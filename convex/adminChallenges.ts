import { query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Comprehensive analytics for admin dashboard
export const getComprehensiveAnalytics = query({
  args: {},
  handler: async (ctx) => {
    // Fetch all relevant data
    const allRooms = await ctx.db.query("challengeRooms").collect();
    const allParticipants = await ctx.db.query("roomParticipants").collect();
    const allSolves = await ctx.db.query("roomSolves").collect();

    const now = Date.now();

    // Room stats
    const totalRooms = allRooms.length;
    const activeRooms = allRooms.filter(
      (r) => r.status === "active" && r.expiresAt > now,
    ).length;
    const expiredRooms = allRooms.filter(
      (r) => r.status === "expired" || r.expiresAt <= now,
    ).length;
    const archivedRooms = allRooms.filter(
      (r) => r.status === "archived",
    ).length;

    // Participant stats
    const totalParticipants = allParticipants.length;
    const completedParticipants = allParticipants.filter(
      (p) => p.isCompleted,
    ).length;
    const completionRate =
      totalParticipants > 0
        ? Math.round((completedParticipants / totalParticipants) * 100)
        : 0;

    // Solve stats
    const totalSolves = allSolves.length;
    const dnfSolves = allSolves.filter((s) => s.penalty === "DNF").length;
    const plusTwoSolves = allSolves.filter((s) => s.penalty === "+2").length;

    // Event distribution
    const eventCounts: Record<string, number> = {};
    for (const room of allRooms) {
      eventCounts[room.event] = (eventCounts[room.event] || 0) + 1;
    }

    // Format distribution
    const formatCounts = {
      ao5: allRooms.filter((r) => r.format === "ao5").length,
      ao12: allRooms.filter((r) => r.format === "ao12").length,
    };

    // Public vs Private
    const publicRooms = allRooms.filter((r) => r.isPublic).length;
    const privateRooms = allRooms.filter((r) => !r.isPublic).length;

    // Average participants per room
    const avgParticipants =
      totalRooms > 0
        ? Math.round((totalParticipants / totalRooms) * 10) / 10
        : 0;

    // Rooms with no participants
    const emptyRooms = allRooms.filter((r) => {
      const roomParticipants = allParticipants.filter(
        (p) => p.roomId === r._id,
      );
      return roomParticipants.length === 0;
    }).length;

    // Room creation trends (last 30 days)
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const recentRooms = allRooms.filter((r) => r.createdAt >= thirtyDaysAgo);
    const roomsPerDay: Record<string, number> = {};
    for (const room of recentRooms) {
      const date = new Date(room.createdAt).toISOString().split("T")[0];
      roomsPerDay[date] = (roomsPerDay[date] || 0) + 1;
    }

    // Most active creators (users who created the most rooms)
    const creatorCounts: Map<Id<"users">, number> = new Map();
    for (const room of allRooms) {
      const creatorId = room.createdBy;
      creatorCounts.set(creatorId, (creatorCounts.get(creatorId) || 0) + 1);
    }

    // Get top 5 creators with user details
    const topCreatorIds = Array.from(creatorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topCreators = await Promise.all(
      topCreatorIds.map(async ([id, count]) => {
        try {
          const user = await ctx.db.get(id);
          return {
            userId: id.toString(),
            name: user?.name || "Unknown User",
            wcaId: user?.wcaId || "N/A",
            roomCount: count,
          };
        } catch {
          return {
            userId: id.toString(),
            name: "Unknown User",
            wcaId: "N/A",
            roomCount: count,
          };
        }
      }),
    );

    // Most active participants (users who participated in the most rooms)
    const participantCounts: Map<Id<"users">, number> = new Map();
    for (const p of allParticipants) {
      const participantId = p.userId;
      participantCounts.set(
        participantId,
        (participantCounts.get(participantId) || 0) + 1,
      );
    }

    const topParticipantIds = Array.from(participantCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topParticipants = await Promise.all(
      topParticipantIds.map(async ([id, count]) => {
        try {
          const user = await ctx.db.get(id);
          const userParticipations = allParticipants.filter(
            (p) => p.userId === id,
          );
          const wins = userParticipations.filter(
            (p) => p.finalRank === 1,
          ).length;
          return {
            userId: id.toString(),
            name: user?.name || "Unknown User",
            wcaId: user?.wcaId || "N/A",
            participationCount: count,
            wins,
          };
        } catch {
          return {
            userId: id.toString(),
            name: "Unknown User",
            wcaId: "N/A",
            participationCount: count,
            wins: 0,
          };
        }
      }),
    );

    // Unique participants
    const uniqueParticipants = new Set(
      allParticipants.map((p) => p.userId.toString()),
    ).size;

    // Average solve time (excluding DNFs and +2s)
    const validSolves = allSolves.filter(
      (s) => s.penalty !== "DNF" && s.finalTime > 0,
    );
    const avgSolveTime =
      validSolves.length > 0
        ? Math.round(
            validSolves.reduce((sum, s) => sum + s.finalTime, 0) /
              validSolves.length,
          )
        : 0;

    // Best solve time
    const bestSolveTime =
      validSolves.length > 0
        ? Math.min(...validSolves.map((s) => s.finalTime))
        : 0;

    // Weekly activity (last 7 days)
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const weeklyRooms = allRooms.filter(
      (r) => r.createdAt >= sevenDaysAgo,
    ).length;
    const weeklyParticipants = allParticipants.filter(
      (p) => p.joinedAt >= sevenDaysAgo,
    ).length;
    const weeklySolves = allSolves.filter(
      (s) => s.solveDate >= sevenDaysAgo,
    ).length;

    return {
      // Overview stats
      totalRooms,
      activeRooms,
      expiredRooms,
      archivedRooms,
      totalParticipants,
      completedParticipants,
      completionRate,
      totalSolves,
      dnfSolves,
      plusTwoSolves,
      uniqueParticipants,
      avgParticipants,
      emptyRooms,
      avgSolveTime,
      bestSolveTime,

      // Distributions
      eventDistribution: Object.entries(eventCounts)
        .map(([event, count]) => ({ event, count }))
        .sort((a, b) => b.count - a.count),
      formatDistribution: formatCounts,
      visibilityDistribution: {
        public: publicRooms,
        private: privateRooms,
      },

      // Leaderboards
      topCreators,
      topParticipants,

      // Time trends
      roomsPerDay: Object.entries(roomsPerDay)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),

      // Weekly activity
      weeklyActivity: {
        rooms: weeklyRooms,
        participants: weeklyParticipants,
        solves: weeklySolves,
      },
    };
  },
});

// Get detailed room list with participant stats for admin dashboard
export const getDetailedRooms = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
    event: v.optional(v.string()),
    sortBy: v.optional(v.string()),
    sortOrder: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let rooms = await ctx.db.query("challengeRooms").order("desc").collect();

    // Apply status filter
    if (args.status && args.status !== "all") {
      const now = Date.now();
      rooms = rooms.filter((r) => {
        if (args.status === "active") {
          return r.status === "active" && r.expiresAt > now;
        } else if (args.status === "expired") {
          return r.status === "expired" || r.expiresAt <= now;
        }
        return r.status === args.status;
      });
    }

    // Apply event filter
    if (args.event && args.event !== "all") {
      rooms = rooms.filter((r) => r.event === args.event);
    }

    // For each room, get participant count, completed count, creator info, and solve stats
    const roomsWithStats = await Promise.all(
      rooms.slice(0, args.limit || 50).map(async (room) => {
        const participants = await ctx.db
          .query("roomParticipants")
          .withIndex("by_room", (q) => q.eq("roomId", room._id))
          .collect();

        const creator = await ctx.db.get(room.createdBy);

        // Get solves for this room
        const solves = await ctx.db
          .query("roomSolves")
          .withIndex("by_room", (q) => q.eq("roomId", room._id))
          .collect();

        const validSolves = solves.filter(
          (s) => s.penalty !== "DNF" && s.finalTime > 0,
        );
        const avgTime =
          validSolves.length > 0
            ? Math.round(
                validSolves.reduce((sum, s) => sum + s.finalTime, 0) /
                  validSolves.length,
              )
            : null;
        const bestTime =
          validSolves.length > 0
            ? Math.min(...validSolves.map((s) => s.finalTime))
            : null;

        return {
          ...room,
          participantCount: participants.length,
          completedCount: participants.filter((p) => p.isCompleted).length,
          creatorName: creator?.name || "Unknown",
          creatorWcaId: creator?.wcaId || "N/A",
          totalSolves: solves.length,
          avgTime,
          bestTime,
          dnfCount: solves.filter((s) => s.penalty === "DNF").length,
        };
      }),
    );

    // Apply sorting
    if (args.sortBy) {
      const order = args.sortOrder === "asc" ? 1 : -1;
      roomsWithStats.sort((a, b) => {
        const aVal = (a as any)[args.sortBy!];
        const bVal = (b as any)[args.sortBy!];
        if (typeof aVal === "number" && typeof bVal === "number") {
          return (aVal - bVal) * order;
        }
        return 0;
      });
    }

    return roomsWithStats;
  },
});

// Get participants and their solves for a specific room
export const getRoomParticipants = query({
  args: {
    roomId: v.id("challengeRooms"),
  },
  handler: async (ctx, args) => {
    const participants = await ctx.db
      .query("roomParticipants")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    const participantsWithDetails = await Promise.all(
      participants.map(async (p) => {
        const user = await ctx.db.get(p.userId);
        const solves = await ctx.db
          .query("roomSolves")
          .withIndex("by_participant", (q) => q.eq("participantId", p._id))
          .collect();

        return {
          ...p,
          userName: user?.name || "Unknown",
          userWcaId: user?.wcaId || "N/A",
          userAvatar: user?.avatar,
          solves: solves
            .sort((a, b) => a.solveNumber - b.solveNumber)
            .map((s) => ({
              solveNumber: s.solveNumber,
              time: s.time,
              penalty: s.penalty,
              finalTime: s.finalTime,
            })),
        };
      }),
    );

    // Sort participants by final rank, then average time
    participantsWithDetails.sort((a, b) => {
      if (a.finalRank && b.finalRank) {
        return a.finalRank - b.finalRank;
      }
      if (a.finalRank) return -1;
      if (b.finalRank) return 1;
      if (a.average && b.average) {
        return a.average - b.average;
      }
      return 0;
    });

    return participantsWithDetails;
  },
});

// Get list of users who have participated in challenges, along with participation stats
export const getChallengeUsers = query({
  args: {},
  handler: async (ctx) => {
    const participants = await ctx.db.query("roomParticipants").collect();
    const uniqueUserIds = new Set<Id<"users">>();
    for (const p of participants) {
      uniqueUserIds.add(p.userId);
    }

    const users = await Promise.all(
      Array.from(uniqueUserIds).map(async (userId: Id<"users">) => {
        try {
          const user = await ctx.db.get(userId);
          if (!user) return null;
          const userParticipations = participants.filter(
            (p) => p.userId === userId,
          );
          return {
            _id: userId.toString(),
            name: user.name,
            wcaId: user.wcaId,
            participationCount: userParticipations.length,
            completedCount: userParticipations.filter((p) => p.isCompleted)
              .length,
          };
        } catch {
          return null;
        }
      }),
    );

    return users
      .filter((u): u is NonNullable<typeof u> => u !== null)
      .sort((a, b) => b.participationCount - a.participationCount);
  },
});