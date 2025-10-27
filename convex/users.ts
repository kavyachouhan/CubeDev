import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Upsert (create or update) user profile
export const upsertUser = mutation({
  args: {
    wcaId: v.string(),
    wcaUserId: v.number(),
    name: v.string(),
    email: v.optional(v.string()),
    countryIso2: v.string(),
    avatar: v.optional(v.string()),
    accessToken: v.optional(v.string()),
    gender: v.optional(v.string()),
    region: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_wca_id", (q) => q.eq("wcaId", args.wcaId))
      .first();

    if (existingUser) {
      // If the user was previously deleted, restore their account
      if (existingUser.isDeleted) {
        // Find any orphaned sessions for this user (that weren't deleted)
        const orphanedSessions = await ctx.db
          .query("sessions")
          .withIndex("by_user", (q) => q.eq("userId", existingUser._id))
          .collect();

        // Delete orphaned sessions and their associated solves
        for (const session of orphanedSessions) {
          const solves = await ctx.db
            .query("solves")
            .withIndex("by_session", (q) => q.eq("sessionId", session._id))
            .collect();

          for (const solve of solves) {
            await ctx.db.delete(solve._id);
          }

          await ctx.db.delete(session._id);
        }

        // Restore user account
        const updateData: any = {
          name: args.name,
          email: args.email,
          countryIso2: args.countryIso2,
          avatar: args.avatar,
          accessToken: args.accessToken,
          gender: args.gender,
          updatedAt: now,
          lastLoginAt: now,
          isDeleted: false, // Clear deletion flag
          deletedAt: undefined, // Clear deletion timestamp
          // Reset privacy and theme settings to defaults
          hideProfile: undefined,
          hideChallengeStats: undefined,
          themeMode: undefined,
          colorScheme: undefined,
          timerFontSize: undefined,
          timerFontFamily: undefined,
          timerUpdateMode: undefined,
          reduceMotion: undefined,
          disableGlow: undefined,
          highContrast: undefined,
        };

        await ctx.db.patch(existingUser._id, updateData);
        return existingUser._id;
      }

      // Update existing user
      const updateData: any = {
        name: args.name,
        countryIso2: args.countryIso2,
        avatar: args.avatar,
        accessToken: args.accessToken,
        gender: args.gender,
        updatedAt: now,
        lastLoginAt: now,
      };

      // Only update email if provided
      if (args.email) {
        updateData.email = args.email;
      }

      await ctx.db.patch(existingUser._id, updateData);
      return existingUser._id;
    } else {
      // Create new user
      const newUserData: any = {
        wcaId: args.wcaId,
        wcaUserId: args.wcaUserId,
        name: args.name,
        countryIso2: args.countryIso2,
        avatar: args.avatar,
        accessToken: args.accessToken,
        gender: args.gender,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      };

      // Only set email if provided
      if (args.email) {
        newUserData.email = args.email;
      }

      const userId = await ctx.db.insert("users", newUserData);
      return userId;
    }
  },
});

// Get or create user by WCA ID (used during OAuth login)
export const getOrCreateUser = mutation({
  args: {
    wcaId: v.string(),
    wcaUserId: v.number(),
    name: v.string(),
    email: v.string(),
    countryIso2: v.string(),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_wca_id", (q) => q.eq("wcaId", args.wcaId))
      .first();

    if (existingUser) {
      // Update user info if it exists
      await ctx.db.patch(existingUser._id, {
        name: args.name,
        email: args.email,
        avatar: args.avatar,
        updatedAt: Date.now(),
        lastLoginAt: Date.now(),
      });
      return existingUser._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      wcaId: args.wcaId,
      wcaUserId: args.wcaUserId,
      name: args.name,
      email: args.email,
      countryIso2: args.countryIso2,
      avatar: args.avatar,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastLoginAt: Date.now(),
    });

    return userId;
  },
});

// Get user by WCA ID
export const getUserByWcaId = query({
  args: { wcaId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_wca_id", (q) => q.eq("wcaId", args.wcaId))
      .first();
  },
});

// Get user by ID
export const getUserById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get all users (for directory/discovery) - excludes deleted users
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .order("desc")
      .take(100); // Limit to 100 for performance
  },
});

// Update user privacy settings
export const updatePrivacySettings = mutation({
  args: {
    userId: v.id("users"),
    hideProfile: v.optional(v.boolean()),
    hideChallengeStats: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    await ctx.db.patch(userId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Update user theme settings
export const updateThemeSettings = mutation({
  args: {
    userId: v.id("users"),
    themeMode: v.optional(v.string()),
    colorScheme: v.optional(v.string()),
    timerFontSize: v.optional(v.string()),
    timerFontFamily: v.optional(v.string()),
    timerUpdateMode: v.optional(v.string()),
    reduceMotion: v.optional(v.boolean()),
    disableGlow: v.optional(v.boolean()),
    highContrast: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    await ctx.db.patch(userId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Delete user account (anonymize data and remove personal info)
export const deleteUserAccount = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is already deleted
    if (user.isDeleted) {
      throw new Error("User account is already deleted");
    }

    // Anonymize user data
    await ctx.db.patch(args.userId, {
      // Replace personal info with generic placeholders
      name: `Deleted User`,
      email: undefined, // Remove email
      avatar: undefined, // Remove avatar
      accessToken: undefined, // Remove access token
      refreshToken: undefined, // Remove refresh token

      // Mark account as deleted
      isDeleted: true,
      deletedAt: now,
      updatedAt: now,

      // Reset all preferences
      hideProfile: undefined,
      hideChallengeStats: undefined,
      themeMode: undefined,
      colorScheme: undefined,
      timerFontSize: undefined,
      timerFontFamily: undefined,
      timerUpdateMode: undefined,
      reduceMotion: undefined,
      disableGlow: undefined,
      highContrast: undefined,
    });

    // Find any orphaned sessions for this user (that weren't deleted)
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    let deletedSessions = 0;
    let deletedSolves = 0;

    for (const session of sessions) {
      // Delete all solves in each session
      const solves = await ctx.db
        .query("solves")
        .withIndex("by_session", (q) => q.eq("sessionId", session._id))
        .collect();

      for (const solve of solves) {
        await ctx.db.delete(solve._id);
        deletedSolves++;
      }

      // Delete the session
      await ctx.db.delete(session._id);
      deletedSessions++;
    }

    return {
      success: true,
      message:
        "Account deleted successfully. Your personal data has been removed, but challenge room data is preserved for leaderboard integrity.",
      details: {
        deletedSessions,
        deletedSolves,
      },
    };
  },
});

// Check if user profile is private
export const isUserProfilePrivate = query({
  args: { wcaId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_wca_id", (q) => q.eq("wcaId", args.wcaId))
      .first();

    if (!user || user.isDeleted) {
      return { isPrivate: true, isDeleted: !!user?.isDeleted };
    }

    return {
      isPrivate: !!user.hideProfile,
      isDeleted: false,
      hideChallengeStats: !!user.hideChallengeStats,
      hideProfile: !!user.hideProfile,
    };
  },
});

// Create a new session
export const createSession = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    event: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sessionId = await ctx.db.insert("sessions", {
      userId: args.userId,
      name: args.name,
      event: args.event,
      description: args.description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true,
      solveCount: 0,
    });
    return sessionId;
  },
});

// Get user sessions
export const getUserSessions = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Update session
export const updateSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    name: v.optional(v.string()),
    event: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { sessionId, ...updates } = args;
    await ctx.db.patch(sessionId, updates);
  },
});

// Add a solve to a session
export const addSolve = mutation({
  args: {
    userId: v.id("users"),
    sessionId: v.id("sessions"),
    event: v.string(),
    time: v.number(),
    scramble: v.string(),
    penalty: v.union(v.literal("none"), v.literal("+2"), v.literal("DNF")),
    inspectionTime: v.optional(v.number()),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Calculate final time based on penalty
    let finalTime = args.time;
    if (args.penalty === "+2") {
      finalTime = args.time + 2000; // Add 2 seconds
    } else if (args.penalty === "DNF") {
      finalTime = Infinity;
    }

    const solveId = await ctx.db.insert("solves", {
      userId: args.userId,
      sessionId: args.sessionId,
      event: args.event,
      time: args.time,
      scramble: args.scramble,
      penalty: args.penalty,
      finalTime: finalTime,
      solveDate: Date.now(),
      comment: args.comment,
      createdAt: Date.now(),
    });

    // Update session solve count
    const session = await ctx.db.get(args.sessionId);
    if (session) {
      await ctx.db.patch(args.sessionId, {
        solveCount: session.solveCount + 1,
        updatedAt: Date.now(),
      });
    }

    return solveId;
  },
});

// Save a solve (new or existing)
export const saveSolve = mutation({
  args: {
    userId: v.id("users"),
    sessionId: v.id("sessions"),
    event: v.string(),
    scramble: v.string(),
    time: v.number(),
    penalty: v.union(v.literal("none"), v.literal("+2"), v.literal("DNF")),
    finalTime: v.number(),
    inspectionTime: v.optional(v.number()),
    comment: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    reconstruction: v.optional(v.string()),
    splits: v.optional(
      v.array(
        v.object({
          phase: v.string(),
          time: v.number(),
        })
      )
    ),
    splitMethod: v.optional(v.string()),
    microPausesMs: v.optional(v.array(v.number())),
    timerMode: v.optional(
      v.union(v.literal("normal"), v.literal("manual"), v.literal("stackmat"))
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const solveId = await ctx.db.insert("solves", {
      userId: args.userId,
      sessionId: args.sessionId,
      event: args.event,
      scramble: args.scramble,
      time: args.time,
      penalty: args.penalty,
      finalTime: args.finalTime,
      comment: args.comment,
      tags: args.tags,
      splits: args.splits,
      splitMethod: args.splitMethod,
      microPausesMs: args.microPausesMs,
      timerMode: args.timerMode,
      solveDate: now,
      createdAt: now,
    });

    // Update session solve count
    const currentSolveCount = await ctx.db
      .query("solves")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect()
      .then((solves) => solves.length);

    await ctx.db.patch(args.sessionId, {
      solveCount: currentSolveCount,
      updatedAt: now,
    });

    return solveId;
  },
});

// Batch import solves for better performance
export const batchImportSolves = mutation({
  args: {
    userId: v.id("users"),
    sessionId: v.id("sessions"),
    solves: v.array(
      v.object({
        event: v.string(),
        scramble: v.string(),
        time: v.number(),
        penalty: v.union(v.literal("none"), v.literal("+2"), v.literal("DNF")),
        finalTime: v.number(),
        timestamp: v.number(),
        comment: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        splits: v.optional(
          v.array(
            v.object({
              phase: v.string(),
              time: v.number(),
            })
          )
        ),
        splitMethod: v.optional(v.string()),
        microPausesMs: v.optional(v.array(v.number())),
        timerMode: v.optional(
          v.union(
            v.literal("normal"),
            v.literal("manual"),
            v.literal("stackmat")
          )
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const savedSolveIds = [];

    // Insert all solves in batch
    for (const solve of args.solves) {
      try {
        const solveId = await ctx.db.insert("solves", {
          userId: args.userId,
          sessionId: args.sessionId,
          event: solve.event,
          scramble: solve.scramble,
          time: solve.time,
          penalty: solve.penalty,
          finalTime: solve.finalTime,
          comment: solve.comment,
          tags: solve.tags,
          splits: solve.splits,
          splitMethod: solve.splitMethod,
          microPausesMs: solve.microPausesMs,
          timerMode: solve.timerMode,
          solveDate: solve.timestamp,
          createdAt: now,
        });
        savedSolveIds.push(solveId);
      } catch (error) {
        console.error("Failed to import solve:", solve, error);
      }
    }

    // Update session solve count once at the end
    const currentSolveCount = await ctx.db
      .query("solves")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect()
      .then((solves) => solves.length);

    await ctx.db.patch(args.sessionId, {
      solveCount: currentSolveCount,
      updatedAt: now,
    });

    return {
      importedCount: savedSolveIds.length,
      totalAttempted: args.solves.length,
      solveIds: savedSolveIds,
    };
  },
});

// Get solves for a session
export const getSessionSolves = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("solves")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .collect();
  },
});

// Get all solves for a user
export const getUserSolves = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("solves")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Delete a solve
export const deleteSolve = mutation({
  args: { solveId: v.id("solves") },
  handler: async (ctx, args) => {
    const solve = await ctx.db.get(args.solveId);
    if (solve) {
      // Delete the solve
      await ctx.db.delete(args.solveId);

      // Update session solve count
      const remainingSolves = await ctx.db
        .query("solves")
        .withIndex("by_session", (q) => q.eq("sessionId", solve.sessionId))
        .collect();

      await ctx.db.patch(solve.sessionId, {
        solveCount: remainingSolves.length,
        updatedAt: Date.now(),
      });
    }
  },
});

// Delete a session and all its solves
export const deleteSession = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    // First delete all solves in this session
    const solves = await ctx.db
      .query("solves")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    for (const solve of solves) {
      await ctx.db.delete(solve._id);
    }

    // Then delete the session
    await ctx.db.delete(args.sessionId);
  },
});

// Update a solve
export const updateSolve = mutation({
  args: {
    solveId: v.id("solves"),
    time: v.optional(v.number()),
    penalty: v.optional(
      v.union(v.literal("none"), v.literal("+2"), v.literal("DNF"))
    ),
    comment: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    finalTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { solveId, ...updates } = args;

    // If time or penalty is updated, recalculate finalTime
    if (updates.time !== undefined || updates.penalty !== undefined) {
      const solve = await ctx.db.get(solveId);
      if (solve) {
        const newTime = updates.time ?? solve.time;
        const newPenalty = updates.penalty ?? solve.penalty;

        let finalTime = newTime;
        if (newPenalty === "+2") {
          finalTime = newTime + 2000;
        } else if (newPenalty === "DNF") {
          finalTime = Infinity;
        }

        await ctx.db.patch(solveId, {
          ...updates,
          finalTime: finalTime,
        });
      }
    } else {
      await ctx.db.patch(solveId, updates);
    }
  },
});

// Get user statistics
export const getUserStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get all user sessions
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Get solve count for each session
    const stats = await Promise.all(
      sessions.map(async (session) => {
        const solves = await ctx.db
          .query("solves")
          .withIndex("by_session", (q) => q.eq("sessionId", session._id))
          .collect();

        const validSolves = solves.filter((solve) => solve.penalty !== "DNF");
        const times = validSolves.map((solve) => solve.finalTime);

        let average = 0;
        let best = 0;
        if (times.length > 0) {
          average = times.reduce((sum, time) => sum + time, 0) / times.length;
          best = Math.min(...times);
        }

        return {
          sessionId: session._id,
          sessionName: session.name,
          event: session.event,
          solveCount: solves.length,
          average: average,
          best: best,
        };
      })
    );

    return stats;
  },
});

// Get user account status by WCA ID
export const getUserAccountStatus = query({
  args: { wcaId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_wca_id", (q) => q.eq("wcaId", args.wcaId))
      .first();

    if (!user) {
      return { exists: false };
    }

    // Count sessions and solves
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const solves = await ctx.db
      .query("solves")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Count challenge room participations
    const roomParticipations = await ctx.db
      .query("roomParticipants")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return {
      exists: true,
      isDeleted: !!user.isDeleted,
      deletedAt: user.deletedAt,
      name: user.name,
      email: user.email,
      hasAvatar: !!user.avatar,
      sessionCount: sessions.length,
      solveCount: solves.length,
      challengeRoomCount: roomParticipations.length,
      lastLoginAt: user.lastLoginAt,
    };
  },
});