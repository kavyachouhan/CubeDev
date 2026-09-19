import { mutation, query, internalMutation, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { getPublicProfileUser, requireMatchingUser, requireUser } from "./auth";
import { toPublicUser } from "./userProjection";

// Generate a unique room ID (6-character alphanumeric)
function generateRoomId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Create a new challenge room
export const createRoom = mutation({
  args: {
    userId: v.id("users"), // Pass userId directly for now
    name: v.string(),
    event: v.string(),
    format: v.union(v.literal("ao5"), v.literal("ao12")),
    scrambles: v.array(v.string()),
    isPublic: v.optional(v.boolean()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireMatchingUser(ctx, args.userId);

    // Generate unique room ID
    let roomId: string;
    let existingRoom;
    do {
      roomId = generateRoomId();
      existingRoom = await ctx.db
        .query("challengeRooms")
        .withIndex("by_room_id", (q) => q.eq("roomId", roomId))
        .first();
    } while (existingRoom);

    // Calculate expiry time (48 hours from now)
    const expiresAt = Date.now() + 48 * 60 * 60 * 1000;

    // Create the room
    const room = await ctx.db.insert("challengeRooms", {
      roomId,
      name: args.name,
      event: args.event,
      format: args.format,
      createdBy: user._id,
      status: "active",
      scrambles: args.scrambles,
      createdAt: Date.now(),
      expiresAt,
      participantCount: 0,
      completedCount: 0,
      isPublic: args.isPublic ?? true,
      description: args.description,
    });

    return { roomId, _id: room };
  },
});

// Join a challenge room
export const joinRoom = mutation({
  args: {
    userId: v.id("users"),
    roomId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireMatchingUser(ctx, args.userId);

    // Find the room
    const room = await ctx.db
      .query("challengeRooms")
      .withIndex("by_room_id", (q) => q.eq("roomId", args.roomId))
      .first();

    if (!room) {
      throw new Error("Room not found");
    }

    // Check if room is still active
    if (room.status !== "active" || room.expiresAt < Date.now()) {
      throw new Error("Room has expired");
    }

    // Check if user already joined
    const existingParticipant = await ctx.db
      .query("roomParticipants")
      .withIndex("by_room_user", (q) =>
        q.eq("roomId", room._id).eq("userId", user._id),
      )
      .first();

    if (existingParticipant) {
      return { participant: existingParticipant, room };
    }

    // Create participant record
    const totalSolves = room.format === "ao5" ? 5 : 12;
    const participant = await ctx.db.insert("roomParticipants", {
      roomId: room._id,
      userId: user._id,
      joinedAt: Date.now(),
      solvesCompleted: 0,
      totalSolves,
      isCompleted: false,
      dnfCount: 0,
      wasDeletedWhenJoined: user.isDeleted || false, // Track deletion status at join time
    });

    // Update room participant count
    await ctx.db.patch(room._id, {
      participantCount: room.participantCount + 1,
    });

    return { participant, room };
  },
});

// Submit a solve for a challenge room
export const submitSolve = mutation({
  args: {
    userId: v.id("users"),
    roomId: v.string(),
    solveNumber: v.number(),
    time: v.number(),
    penalty: v.union(v.literal("none"), v.literal("+2"), v.literal("DNF")),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireMatchingUser(ctx, args.userId);

    // Find the room
    const room = await ctx.db
      .query("challengeRooms")
      .withIndex("by_room_id", (q) => q.eq("roomId", args.roomId))
      .first();

    if (!room) {
      throw new Error("Room not found");
    }

    // Check if room is still active
    if (room.status !== "active" || room.expiresAt < Date.now()) {
      throw new Error("Room has expired");
    }

    // Find participant record
    const participant = await ctx.db
      .query("roomParticipants")
      .withIndex("by_room_user", (q) =>
        q.eq("roomId", room._id).eq("userId", user._id),
      )
      .first();

    if (!participant) {
      throw new Error("User not a participant in this room");
    }

    // Check if solve already exists
    const existingSolve = await ctx.db
      .query("roomSolves")
      .filter((q) =>
        q.and(
          q.eq(q.field("participantId"), participant._id),
          q.eq(q.field("solveNumber"), args.solveNumber)
        )
      )
      .first();

    if (existingSolve) {
      throw new Error("Solve already submitted for this position");
    }

    // Calculate final time
    let finalTime = args.time;
    if (args.penalty === "+2") {
      finalTime += 2000; // Add 2 seconds in milliseconds
    } else if (args.penalty === "DNF") {
      finalTime = Number.MAX_SAFE_INTEGER; // DNF represented as max number
    }

    // Get scramble for this solve
    const scramble = room.scrambles[args.solveNumber - 1];

    // Create solve record
    const solve = await ctx.db.insert("roomSolves", {
      roomId: room._id,
      participantId: participant._id,
      userId: user._id,
      solveNumber: args.solveNumber,
      scramble,
      event: room.event,
      time: args.time,
      penalty: args.penalty,
      finalTime,
      solveDate: Date.now(),
      createdAt: Date.now(),
      comment: args.comment,
    });

    // Update participant progress
    const updatedSolvesCompleted = participant.solvesCompleted + 1;
    const updatedDnfCount =
      participant.dnfCount + (args.penalty === "DNF" ? 1 : 0);
    const isCompleted = updatedSolvesCompleted === participant.totalSolves;

    // Calculate average if completed (WCA compliant)
    let average: number | undefined;
    let bestSingle: number | undefined;

    if (isCompleted) {
      // WCA calculation helper functions
      const truncToCentisMs = (ms: number) => Math.floor(ms / 10) * 10; // singles: truncate
      const roundToCentisMs = (ms: number) => Math.round(ms / 10) * 10; // averages: round

      // Get all participant's solves
      const allSolves = await ctx.db
        .query("roomSolves")
        .filter((q) => q.eq(q.field("participantId"), participant._id))
        .collect();

      // Sort by solve number to maintain order
      allSolves.sort((a, b) => a.solveNumber - b.solveNumber);

      // Convert to WCA format: DNF = Infinity, truncate valid times
      const wcaTimes = allSolves.map((solve) =>
        solve.penalty === "DNF" ? Infinity : truncToCentisMs(solve.finalTime)
      );

      // Best single: find the best non-DNF time
      const validTimes = wcaTimes.filter((t) => isFinite(t));
      bestSingle = validTimes.length > 0 ? Math.min(...validTimes) : undefined;

      // Calculate average based on format (WCA compliant)
      if (room.format === "ao5") {
        if (wcaTimes.length === 5) {
          const dnfCount = wcaTimes.filter((t) => !isFinite(t)).length;

          // Average is DNF if 2+ DNFs
          if (dnfCount >= 2) {
            average = Infinity;
          } else {
            // Sort times to drop best and worst
            const sorted = [...wcaTimes].sort((a, b) => a - b);
            // Remove best (first) and worst (last)
            const middle = sorted.slice(1, 4);

            // Calculate average of middle 3 times
            const sum = middle.reduce(
              (acc, t) => acc + (isFinite(t) ? t : 0),
              0
            );
            average = roundToCentisMs(sum / 3);
          }
        }
      } else if (room.format === "ao12") {
        if (wcaTimes.length === 12) {
          const dnfCount = wcaTimes.filter((t) => !isFinite(t)).length;

          // Average is DNF if 2+ DNFs
          if (dnfCount >= 2) {
            average = Infinity;
          } else {
            // Sort times to drop best and worst
            const sorted = [...wcaTimes].sort((a, b) => a - b);
            // Remove best (first) and worst (last)
            const middle = sorted.slice(1, 11);

            // Calculate average of middle 10 times
            const sum = middle.reduce(
              (acc, t) => acc + (isFinite(t) ? t : 0),
              0
            );
            average = roundToCentisMs(sum / 10);
          }
        }
      }
    }

    // Update participant
    await ctx.db.patch(participant._id, {
      solvesCompleted: updatedSolvesCompleted,
      dnfCount: updatedDnfCount,
      isCompleted,
      bestSingle,
      average,
      completedAt: isCompleted ? Date.now() : undefined,
    });

    // Update room completion count if participant just completed
    if (isCompleted && !participant.isCompleted) {
      await ctx.db.patch(room._id, {
        completedCount: room.completedCount + 1,
      });
    }

    return solve;
  },
});

// Get room details and participants
export const getRoomDetails = query({
  args: {
    roomId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the room
    const room = await ctx.db
      .query("challengeRooms")
      .withIndex("by_room_id", (q) => q.eq("roomId", args.roomId))
      .first();

    if (!room) {
      return null;
    }

    // Check if room is expired (48 hours old)
    const isExpired = Date.now() - room.createdAt > 48 * 60 * 60 * 1000;

    // Get room creator
    const creatorDoc = await ctx.db.get(room.createdBy);
    const creator = toPublicUser(creatorDoc);

    // Get participants with user details
    const participants = await ctx.db
      .query("roomParticipants")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .collect();

    const participantsWithUsers = await Promise.all(
      participants.map(async (participant) => {
        const userDoc = await ctx.db.get(participant.userId);
        return {
          ...participant,
          user: toPublicUser(userDoc),
        };
      })
    );

    // Sort participants by completion status and average time
    participantsWithUsers.sort((a, b) => {
      if (a.isCompleted && !b.isCompleted) return -1;
      if (!a.isCompleted && b.isCompleted) return 1;
      if (a.isCompleted && b.isCompleted) {
        if (a.average && b.average) {
          return a.average - b.average;
        }
        if (a.average && !b.average) return -1;
        if (!a.average && b.average) return 1;
      }
      return b.solvesCompleted - a.solvesCompleted;
    });

    return {
      room: {
        ...room,
        creator,
        isExpired,
      },
      participants: participantsWithUsers,
    };
  },
});

// Get user's room participation
export const getUserParticipation = query({
  args: {
    userId: v.id("users"),
    roomId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireMatchingUser(ctx, args.userId);

    // Find the room
    const room = await ctx.db
      .query("challengeRooms")
      .withIndex("by_room_id", (q) => q.eq("roomId", args.roomId))
      .first();

    if (!room) {
      return null;
    }

    // Find participant record
    const participant = await ctx.db
      .query("roomParticipants")
      .withIndex("by_room_user", (q) =>
        q.eq("roomId", room._id).eq("userId", user._id),
      )
      .first();

    if (!participant) {
      return null;
    }

    // Get user's solves
    const solves = await ctx.db
      .query("roomSolves")
      .filter((q) => q.eq(q.field("participantId"), participant._id))
      .collect();

    // Sort solves by solve number
    solves.sort((a, b) => a.solveNumber - b.solveNumber);

    return {
      participant,
      solves,
      room,
    };
  },
});

// Get user's recent room participations
export const getUserRecentRooms = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await requireMatchingUser(ctx, args.userId);

    // Get recent participations for the user (limit to 20 for performance, we'll filter to 5 valid rooms later)
    const participations = await ctx.db
      .query("roomParticipants")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(20);

    // Get room details for each participation
    const roomsWithDetails = await Promise.all(
      participations.map(async (participation) => {
        const room = await ctx.db.get(participation.roomId);
        return {
          participation,
          room,
        };
      })
    );

    // Filter out any participations where the room no longer exists (should be rare) and return the most recent 5 valid rooms
    return roomsWithDetails.filter(({ room }) => room !== null).slice(0, 5);
  },
});

// Get public active rooms
export const getPublicRooms = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    // Get public active rooms
    const rooms = await ctx.db
      .query("challengeRooms")
      .filter((q) =>
        q.and(
          q.eq(q.field("isPublic"), true),
          q.eq(q.field("status"), "active")
        )
      )
      .order("desc")
      .take(limit);

    // Get creator details for each room
    const roomsWithCreators = await Promise.all(
      rooms.map(async (room) => {
        const creator = await ctx.db.get(room.createdBy);
        return {
          ...room,
          creator,
        };
      })
    );

    return roomsWithCreators;
  },
});

// Update a challenge room
export const updateRoom = mutation({
  args: {
    userId: v.id("users"),
    roomId: v.string(),
    title: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the room
    const room = await ctx.db
      .query("challengeRooms")
      .withIndex("by_room_id", (q) => q.eq("roomId", args.roomId))
      .first();

    if (!room) {
      throw new Error("Room not found");
    }

    await requireMatchingUser(ctx, room.createdBy);

    // Update the room
    await ctx.db.patch(room._id, {
      name: args.title,
      description: args.description,
    });

    return { success: true };
  },
});

// Update participant ranks (to be called when participants complete)
export const updateParticipantRanks = mutation({
  args: {
    roomId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // Find the room
    const room = await ctx.db
      .query("challengeRooms")
      .withIndex("by_room_id", (q) => q.eq("roomId", args.roomId))
      .first();

    if (!room) {
      throw new Error("Room not found");
    }

    const callerParticipant = await ctx.db
      .query("roomParticipants")
      .withIndex("by_room_user", (q) =>
        q.eq("roomId", room._id).eq("userId", user._id),
      )
      .first();

    if (!callerParticipant && room.createdBy !== user._id) {
      throw new Error("Not authorized");
    }

    // Get all completed participants
    const participants = await ctx.db
      .query("roomParticipants")
      .withIndex("by_completion", (q) =>
        q.eq("roomId", room._id).eq("isCompleted", true),
      )
      .collect();

    // Sort by average time
    participants.sort((a, b) => {
      if (a.average && b.average) {
        return a.average - b.average;
      }
      if (a.average && !b.average) return -1;
      if (!a.average && b.average) return 1;
      return 0;
    });

    // Update ranks
    for (let i = 0; i < participants.length; i++) {
      const participant = participants[i];
      const rank = i + 1;

      if (participant.finalRank !== rank) {
        await ctx.db.patch(participant._id, {
          finalRank: rank,
        });
      }
    }

    return participants.length;
  },
});

// Internal helper to update participant ranks
const updateRanksForRoom = async (ctx: MutationCtx, roomId: string) => {
  // Find the room
  const room = await ctx.db
    .query("challengeRooms")
    .withIndex("by_room_id", (q) => q.eq("roomId", roomId))
    .first();

  if (!room) {
    return 0;
  }

  // Get all completed participants
  const participants = await ctx.db
    .query("roomParticipants")
    .withIndex("by_completion", (q) =>
      q.eq("roomId", room._id).eq("isCompleted", true),
    )
    .collect();

  // Sort by average time
  participants.sort((a, b) => {
    if (a.average && b.average) {
      return a.average - b.average;
    }
    if (a.average && !b.average) return -1;
    if (!a.average && b.average) return 1;
    return 0;
  });

  // Update ranks
  for (let i = 0; i < participants.length; i++) {
    const participant = participants[i];
    const rank = i + 1;

    if (participant.finalRank !== rank) {
      await ctx.db.patch(participant._id, {
        finalRank: rank,
      });
    }
  }

  return participants.length;
};

// Clean up expired rooms (48 hours old)
export const cleanupExpiredRooms = internalMutation({
  args: {},
  handler: async (ctx) => {
    const fortyEightHoursAgo = Date.now() - 48 * 60 * 60 * 1000;

    // Find expired rooms
    const expiredRooms = await ctx.db
      .query("challengeRooms")
      .filter((q) => q.lt(q.field("createdAt"), fortyEightHoursAgo))
      .collect();

    // Delete related data for each expired room
    for (const room of expiredRooms) {
      // Delete all solves for this room
      const solves = await ctx.db
        .query("roomSolves")
        .withIndex("by_room", (q) => q.eq("roomId", room._id))
        .collect();

      for (const solve of solves) {
        await ctx.db.delete(solve._id);
      }

      // Delete all participants for this room
      const participants = await ctx.db
        .query("roomParticipants")
        .withIndex("by_room", (q) => q.eq("roomId", room._id))
        .collect();

      for (const participant of participants) {
        await ctx.db.delete(participant._id);
      }

      // Delete the room itself
      await ctx.db.delete(room._id);
    }

    return { deletedRooms: expiredRooms.length };
  },
});

// Process expired rooms - finalize rankings and update user stats
export const processExpiredRooms = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Find all active rooms past their expiry time
    const expiredActiveRooms = await ctx.db
      .query("challengeRooms")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect()
      .then((rooms) => rooms.filter((room) => room.expiresAt < now));

    let processedRooms = 0;

    for (const room of expiredActiveRooms) {
      // Update room status to expired
      await ctx.db.patch(room._id, { status: "expired" });

      // Update participant rankings for completed participants
      await updateRanksForRoom(ctx, room.roomId);

      processedRooms++;
    }

    // Clean up very old rooms (older than 30 days)
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const veryOldRooms = await ctx.db
      .query("challengeRooms")
      .filter((q) => q.lt(q.field("createdAt"), thirtyDaysAgo))
      .collect();

    let deletedRooms = 0;

    for (const room of veryOldRooms) {
      // Delete all solves for this room
      const solves = await ctx.db
        .query("roomSolves")
        .withIndex("by_room", (q) => q.eq("roomId", room._id))
        .collect();

      for (const solve of solves) {
        await ctx.db.delete(solve._id);
      }

      // Delete all participants for this room
      const participants = await ctx.db
        .query("roomParticipants")
        .withIndex("by_room", (q) => q.eq("roomId", room._id))
        .collect();

      for (const participant of participants) {
        await ctx.db.delete(participant._id);
      }

      // Delete the room itself
      await ctx.db.delete(room._id);
      deletedRooms++;
    }

    return { processedRooms, deletedRooms };
  },
});

// Get user's room participations with room details
export const getUserRoomParticipations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const readable = await getPublicProfileUser(ctx, args.userId);
    if (!readable || (!readable.isOwner && readable.user.hideChallengeStats)) {
      return [];
    }

    // Get all participations for the user
    const participations = await ctx.db
      .query("roomParticipants")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // Enrich with room details
    const enrichedParticipations = [];
    for (const participation of participations) {
      const room = await ctx.db.get(participation.roomId);
      if (room) {
        enrichedParticipations.push({
          ...participation,
          roomName: room.name,
          event: room.event,
          format: room.format,
          roomPublicId: room.roomId, // Add the public room ID for navigation
          roomStatus: room.status,
          roomExpiresAt: room.expiresAt,
        });
      }
    }

    return enrichedParticipations;
  },
});