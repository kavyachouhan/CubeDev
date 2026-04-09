import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

const TIMER_IMPORT_ONBOARDING_REMINDER_MS = 7 * 24 * 60 * 60 * 1000;

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
      .collect();
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

// Dismiss timer import onboarding and schedule the next reminder.
export const dismissTimerImportOnboarding = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.patch(args.userId, {
      timerImportOnboardingLastDismissedAt: now,
      timerImportOnboardingNextPromptAt:
        now + TIMER_IMPORT_ONBOARDING_REMINDER_MS,
      updatedAt: now,
    });
  },
});

// Mark timer import onboarding as completed.
export const completeTimerImportOnboarding = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.patch(args.userId, {
      timerImportOnboardingCompletedAt: now,
      timerImportOnboardingNextPromptAt: undefined,
      updatedAt: now,
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
        }),
      ),
    ),
    splitMethod: v.optional(v.string()),
    microPausesMs: v.optional(v.array(v.number())),
    timerMode: v.optional(
      v.union(v.literal("normal"), v.literal("manual"), v.literal("stackmat")),
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

    // Schedule stats recalculation (async, doesn't block the solve save)
    // We use ctx.scheduler to avoid blocking the main operation
    await ctx.scheduler.runAfter(0, internal.users.recalculateUserEventStats, {
      userId: args.userId,
      event: args.event,
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
            }),
          ),
        ),
        splitMethod: v.optional(v.string()),
        microPausesMs: v.optional(v.array(v.number())),
        timerMode: v.optional(
          v.union(
            v.literal("normal"),
            v.literal("manual"),
            v.literal("stackmat"),
          ),
        ),
      }),
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

    // Schedule stats recalculation for all imported events
    const uniqueEvents = new Set(args.solves.map((s) => s.event));
    for (const event of uniqueEvents) {
      await ctx.scheduler.runAfter(
        0,
        internal.users.recalculateUserEventStats,
        {
          userId: args.userId,
          event,
        },
      );
    }

    return {
      importedCount: savedSolveIds.length,
      totalAttempted: args.solves.length,
      solveIds: savedSolveIds,
    };
  },
});

// Get all solves for a session (paginated to prevent timeout on large datasets)
export const getSessionSolves = query({
  args: {
    sessionId: v.id("sessions"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 500; // Default limit to prevent loading too many solves at once

    const result = await ctx.db
      .query("solves")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .paginate({ numItems: limit, cursor: args.cursor ?? null });

    return {
      solves: result.page,
      cursor: result.continueCursor,
      isDone: result.isDone,
    };
  },
});

// Get all solves for a user (paginated to prevent timeout on large datasets)
export const getUserSolves = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 1000; // Default limit to prevent loading 20k+ solves at once

    const result = await ctx.db
      .query("solves")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .paginate({ numItems: limit, cursor: args.cursor ?? null });

    return {
      solves: result.page,
      cursor: result.continueCursor,
      isDone: result.isDone,
    };
  },
});

// Get recent solves for a user (limited, for timer stats display)
export const getUserRecentSolves = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 200; // Default to 200 recent solves for display

    return await ctx.db
      .query("solves")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});

// Get solve count for a user (uses pre-computed stats for performance)
export const getUserSolveCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Use pre-computed event stats for accurate count without loading all solves
    const eventStats = await ctx.db
      .query("userEventStats")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Sum up total solves across all events
    return eventStats.reduce((total, stat) => total + stat.totalSolves, 0);
  },
});

// Delete a solve
export const deleteSolve = mutation({
  args: { solveId: v.id("solves") },
  handler: async (ctx, args) => {
    const solve = await ctx.db.get(args.solveId);
    if (solve) {
      const userId = solve.userId;
      const event = solve.event;
      const sessionId = solve.sessionId;

      // Delete the solve
      await ctx.db.delete(args.solveId);

      // Update session solve count (decrement instead of recounting)
      const session = await ctx.db.get(sessionId);
      if (session) {
        await ctx.db.patch(sessionId, {
          solveCount: Math.max(0, session.solveCount - 1),
          updatedAt: Date.now(),
        });
      }

      // Schedule stats recalculation
      await ctx.scheduler.runAfter(
        0,
        internal.users.recalculateUserEventStats,
        {
          userId,
          event,
        },
      );
    }
  },
});

// Delete a session and all its solves
export const deleteSession = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    // Delete solves in batches to prevent timeout on large sessions
    let hasMore = true;
    while (hasMore) {
      const solves = await ctx.db
        .query("solves")
        .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
        .take(100); // Delete 100 at a time

      if (solves.length === 0) {
        hasMore = false;
      } else {
        for (const solve of solves) {
          await ctx.db.delete(solve._id);
        }
      }
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
      v.union(v.literal("none"), v.literal("+2"), v.literal("DNF")),
    ),
    comment: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    finalTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { solveId, ...updates } = args;
    const solve = await ctx.db.get(solveId);

    if (!solve) return;

    // If time or penalty is updated, recalculate finalTime
    if (updates.time !== undefined || updates.penalty !== undefined) {
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

      // Schedule stats recalculation if time/penalty changed
      await ctx.scheduler.runAfter(
        0,
        internal.users.recalculateUserEventStats,
        {
          userId: solve.userId,
          event: solve.event,
        },
      );
    } else {
      await ctx.db.patch(solveId, updates);
    }
  },
});

// Get user statistics (uses pre-computed event stats for accuracy)
export const getUserStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get all user sessions
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Use pre-computed event stats for accurate data
    const eventStats = await ctx.db
      .query("userEventStats")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const eventStatsMap = new Map(eventStats.map((s) => [s.event, s]));

    // Map sessions to stats using pre-computed data
    const stats = sessions.map((session) => {
      const eventStat = eventStatsMap.get(session.event);
      return {
        sessionId: session._id,
        sessionName: session.name,
        event: session.event,
        solveCount: session.solveCount,
        average: eventStat?.overallAverage ?? 0,
        best: eventStat?.bestSingle ?? 0,
      };
    });

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

    // Count sessions
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Use pre-computed event stats for solve count instead of loading all solves
    const eventStats = await ctx.db
      .query("userEventStats")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const solveCount = eventStats.reduce(
      (total, stat) => total + stat.totalSolves,
      0,
    );

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
      solveCount,
      challengeRoomCount: roomParticipations.length,
      lastLoginAt: user.lastLoginAt,
    };
  },
});

// Dismiss a notification for an algorithm review
export const dismissNotification = mutation({
  args: {
    userId: v.id("users"),
    progressId: v.id("userAlgorithmProgress"),
  },
  handler: async (ctx, { userId, progressId }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const dismissedNotifications = user.dismissedNotifications || [];

    // Check if already dismissed
    const alreadyDismissed = dismissedNotifications.some(
      (d) => d.progressId === progressId,
    );

    if (alreadyDismissed) {
      return; // Already dismissed, nothing to do
    }

    // Add to dismissed list
    dismissedNotifications.push({
      progressId,
      dismissedAt: Date.now(),
    });

    await ctx.db.patch(userId, { dismissedNotifications });
  },
});

// Undismiss a notification for an algorithm review
export const undismissNotification = mutation({
  args: {
    userId: v.id("users"),
    progressId: v.id("userAlgorithmProgress"),
  },
  handler: async (ctx, { userId, progressId }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const dismissedNotifications = user.dismissedNotifications || [];

    // Remove from dismissed list
    const updatedDismissed = dismissedNotifications.filter(
      (d) => d.progressId !== progressId,
    );

    await ctx.db.patch(userId, {
      dismissedNotifications: updatedDismissed,
    });
  },
});

// Clear all dismissed notifications
export const clearAllDismissedNotifications = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(userId, { dismissedNotifications: [] });
  },
});

// PRE-COMPUTED STATISTICS MANAGEMENT

// Helper: Truncate to centiseconds (for singles)
const truncToCentisMs = (ms: number) => Math.floor(ms / 10) * 10;

// Helper: Round to centiseconds (for averages)
const roundToCentisMs = (ms: number) => Math.round(ms / 10) * 10;

// Helper: Calculate WCA Average of N from an array of times
const calculateWcaAverageN = (times: number[], n: number): number | null => {
  if (times.length < n) return null;

  // Get the last N times
  const lastN = times.slice(-n);

  const dnfs = lastN.filter((v) => !isFinite(v)).length;
  if (dnfs >= 2) return Infinity; // average is DNF if 2 or more DNFs

  // Sort to drop best and worst
  const sorted = [...lastN].sort((a, b) => a - b);
  sorted.shift(); // drop best
  sorted.pop(); // drop worst

  // Calculate average of remaining
  const sum = sorted.reduce((acc, v) => acc + (isFinite(v) ? v : 0), 0);
  return roundToCentisMs(sum / (n - 2));
};

// Helper: Calculate best rolling average of N across all solves
const calculateBestAverageN = (times: number[], n: number): number | null => {
  if (times.length < n) return null;

  let bestAvg: number | null = null;

  for (let i = 0; i <= times.length - n; i++) {
    const window = times.slice(i, i + n);
    const dnfs = window.filter((v) => !isFinite(v)).length;

    if (dnfs >= 2) continue; // Skip DNF averages

    const sorted = [...window].sort((a, b) => a - b);
    sorted.shift();
    sorted.pop();

    const avg =
      sorted.reduce((acc, v) => acc + (isFinite(v) ? v : 0), 0) / (n - 2);
    const rounded = roundToCentisMs(avg);

    if (bestAvg === null || rounded < bestAvg) {
      bestAvg = rounded;
    }
  }

  return bestAvg;
};

// Internal function to recalculate stats for a user's event
// This is called after solve add/delete/update via the scheduler
export const recalculateUserEventStats = internalMutation({
  args: {
    userId: v.id("users"),
    event: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Fetch ALL solves for this user-event combo (server-side, no client limit)
    const solves = await ctx.db
      .query("solves")
      .withIndex("by_user_event", (q) =>
        q.eq("userId", args.userId).eq("event", args.event),
      )
      .collect();

    // Sort by solve date ascending for proper average calculation
    solves.sort((a, b) => a.solveDate - b.solveDate);

    // Calculate statistics
    const totalSolves = solves.length;
    const nonDnfSolves = solves.filter((s) => s.penalty !== "DNF");
    const totalNonDnfSolves = nonDnfSolves.length;

    // Extract times (truncated for singles, with Infinity for DNF)
    const times = solves.map((s) =>
      s.penalty === "DNF" ? Infinity : truncToCentisMs(s.finalTime),
    );

    // Best single (excluding DNFs)
    const nonDnfTimes = times.filter((t) => isFinite(t));
    const bestSingle =
      nonDnfTimes.length > 0 ? Math.min(...nonDnfTimes) : undefined;

    // Best averages
    const bestAo5 = calculateBestAverageN(times, 5) ?? undefined;
    const bestAo12 = calculateBestAverageN(times, 12) ?? undefined;
    const bestAo100 = calculateBestAverageN(times, 100) ?? undefined;

    // Overall average (mean of non-DNF solves)
    const overallAverage =
      nonDnfTimes.length > 0
        ? roundToCentisMs(
            nonDnfTimes.reduce((a, b) => a + b, 0) / nonDnfTimes.length,
          )
        : undefined;

    // Activity stats
    const firstSolveDate = solves.length > 0 ? solves[0].solveDate : undefined;
    const lastSolveDate =
      solves.length > 0 ? solves[solves.length - 1].solveDate : undefined;

    // Count unique active days
    const uniqueDays = new Set<string>();
    for (const solve of solves) {
      const dateKey = new Date(solve.solveDate).toISOString().split("T")[0];
      uniqueDays.add(dateKey);
    }
    const activeDays = uniqueDays.size;

    // Check if stats record exists
    const existingStats = await ctx.db
      .query("userEventStats")
      .withIndex("by_user_event", (q) =>
        q.eq("userId", args.userId).eq("event", args.event),
      )
      .first();

    const statsData = {
      userId: args.userId,
      event: args.event,
      totalSolves,
      totalNonDnfSolves,
      bestSingle,
      bestAo5,
      bestAo12,
      bestAo100,
      overallAverage,
      firstSolveDate,
      lastSolveDate,
      activeDays,
      updatedAt: now,
    };

    if (existingStats) {
      await ctx.db.patch(existingStats._id, statsData);
    } else {
      await ctx.db.insert("userEventStats", statsData);
    }

    return statsData;
  },
});

// Query to get pre-computed stats for all events for a user
export const getUserEventStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userEventStats")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Query to get pre-computed stats for a specific event
export const getUserEventStatsByEvent = query({
  args: {
    userId: v.id("users"),
    event: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userEventStats")
      .withIndex("by_user_event", (q) =>
        q.eq("userId", args.userId).eq("event", args.event),
      )
      .first();
  },
});

// Batch recalculate stats for all events a user has solves in
// Useful for migration or after bulk imports
export const recalculateAllUserStats = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get all unique events for this user
    const solves = await ctx.db
      .query("solves")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const uniqueEvents = new Set<string>();
    for (const solve of solves) {
      uniqueEvents.add(solve.event);
    }

    // Recalculate stats for each event
    const results = [];
    for (const event of uniqueEvents) {
      // Inline recalculation (can't call mutation from mutation)
      const now = Date.now();

      const eventSolves = solves
        .filter((s) => s.event === event)
        .sort((a, b) => a.solveDate - b.solveDate);

      const totalSolves = eventSolves.length;
      const nonDnfSolves = eventSolves.filter((s) => s.penalty !== "DNF");
      const totalNonDnfSolves = nonDnfSolves.length;

      const times = eventSolves.map((s) =>
        s.penalty === "DNF" ? Infinity : truncToCentisMs(s.finalTime),
      );

      const nonDnfTimes = times.filter((t) => isFinite(t));
      const bestSingle =
        nonDnfTimes.length > 0 ? Math.min(...nonDnfTimes) : undefined;

      const bestAo5 = calculateBestAverageN(times, 5) ?? undefined;
      const bestAo12 = calculateBestAverageN(times, 12) ?? undefined;
      const bestAo100 = calculateBestAverageN(times, 100) ?? undefined;

      const overallAverage =
        nonDnfTimes.length > 0
          ? roundToCentisMs(
              nonDnfTimes.reduce((a, b) => a + b, 0) / nonDnfTimes.length,
            )
          : undefined;

      const firstSolveDate =
        eventSolves.length > 0 ? eventSolves[0].solveDate : undefined;
      const lastSolveDate =
        eventSolves.length > 0
          ? eventSolves[eventSolves.length - 1].solveDate
          : undefined;

      const uniqueDays = new Set<string>();
      for (const solve of eventSolves) {
        const dateKey = new Date(solve.solveDate).toISOString().split("T")[0];
        uniqueDays.add(dateKey);
      }
      const activeDays = uniqueDays.size;

      const existingStats = await ctx.db
        .query("userEventStats")
        .withIndex("by_user_event", (q) =>
          q.eq("userId", args.userId).eq("event", event),
        )
        .first();

      const statsData = {
        userId: args.userId,
        event,
        totalSolves,
        totalNonDnfSolves,
        bestSingle,
        bestAo5,
        bestAo12,
        bestAo100,
        overallAverage,
        firstSolveDate,
        lastSolveDate,
        activeDays,
        updatedAt: now,
      };

      if (existingStats) {
        await ctx.db.patch(existingStats._id, statsData);
      } else {
        await ctx.db.insert("userEventStats", statsData);
      }

      results.push({ event, totalSolves });
    }

    return { recalculatedEvents: results.length, events: results };
  },
});

// Lightweight query for solve heatmap data
// Only returns date and count per day, avoiding loading full solve objects
export const getSolveHeatmapData = query({
  args: {
    userId: v.id("users"),
    daysBack: v.optional(v.number()), // How many days of history (default 365)
  },
  handler: async (ctx, args) => {
    const daysBack = args.daysBack ?? 365;
    const cutoffDate = Date.now() - daysBack * 24 * 60 * 60 * 1000;

    // Fetch only solves within the date range
    const solves = await ctx.db
      .query("solves")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gte(q.field("solveDate"), cutoffDate))
      .collect();

    // Aggregate by date — only return date keys and counts
    const dateCounts: Record<string, { count: number; events: Set<string> }> =
      {};
    for (const solve of solves) {
      const dateKey = new Date(solve.solveDate).toISOString().split("T")[0];
      if (!dateCounts[dateKey]) {
        dateCounts[dateKey] = { count: 0, events: new Set() };
      }
      dateCounts[dateKey].count++;
      dateCounts[dateKey].events.add(solve.event);
    }

    // Return lightweight data (just dates, counts, and event list)
    return Object.entries(dateCounts).map(([date, data]) => ({
      date,
      count: data.count,
      events: Array.from(data.events),
    }));
  },
});
