import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create or update user after WCA authentication
export const upsertUser = mutation({
  args: {
    wcaId: v.string(),
    wcaUserId: v.number(),
    name: v.string(),
    email: v.optional(v.string()), 
    countryIso2: v.string(),
    avatar: v.optional(v.string()),
    accessToken: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    gender: v.optional(v.string()),
    region: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if user already exists by WCA ID
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_wca_id", (q) => q.eq("wcaId", args.wcaId))
      .first();

    if (existingUser) {
      // Update existing user
      const updateData: any = {
        name: args.name,
        countryIso2: args.countryIso2,
        avatar: args.avatar,
        accessToken: args.accessToken,
        dateOfBirth: args.dateOfBirth,
        gender: args.gender,
        region: args.region,
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
        dateOfBirth: args.dateOfBirth,
        gender: args.gender,
        region: args.region,
        inspectionEnabled: true, // Default preference
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      };

      // Only add email if provided
      if (args.email) {
        newUserData.email = args.email;
      }

      const userId = await ctx.db.insert("users", newUserData);

      return userId;
    }
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

// Get user by Convex ID
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Get all users (for directory/discovery)
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").order("desc").take(100); // Limit to 100 for performance, add pagination later if needed
  },
});

// Update user preferences
export const updateUserPreferences = mutation({
  args: {
    userId: v.id("users"),
    inspectionEnabled: v.optional(v.boolean()),
    preferredEvents: v.optional(v.array(v.string())),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...preferences } = args;

    await ctx.db.patch(userId, {
      ...preferences,
      updatedAt: Date.now(),
    });
  },
});

// Save timer solve
export const saveSolve = mutation({
  args: {
    userId: v.id("users"),
    event: v.string(),
    scramble: v.string(),
    time: v.number(),
    penalty: v.union(v.literal("none"), v.literal("+2"), v.literal("DNF")),
    finalTime: v.number(),
    inspectionTime: v.optional(v.number()),
    sessionId: v.optional(v.string()),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const solveId = await ctx.db.insert("timerSessions", {
      userId: args.userId,
      event: args.event,
      scramble: args.scramble,
      time: args.time,
      penalty: args.penalty,
      finalTime: args.finalTime,
      inspectionTime: args.inspectionTime,
      sessionId: args.sessionId,
      comment: args.comment,
      solveDate: now,
      createdAt: now,
    });

    // Update user stats
    await updateUserStatsForEvent(ctx, args.userId, args.event);

    return solveId;
  },
});

// Get user's recent solves
export const getUserSolves = query({
  args: {
    userId: v.id("users"),
    event: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("timerSessions");

    if (args.event) {
      query = query.withIndex("by_user_event", (q) =>
        q.eq("userId", args.userId).eq("event", args.event)
      );
    } else {
      query = query.withIndex("by_user", (q) => q.eq("userId", args.userId));
    }

    return await query.order("desc").take(args.limit || 50);
  },
});

// Get user statistics
export const getUserStats = query({
  args: {
    userId: v.id("users"),
    event: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.event) {
      return await ctx.db
        .query("userStats")
        .withIndex("by_user_event", (q) =>
          q.eq("userId", args.userId).eq("event", args.event)
        )
        .first();
    } else {
      return await ctx.db
        .query("userStats")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();
    }
  },
});

// Helper function to update user statistics
async function updateUserStatsForEvent(ctx: any, userId: any, event: string) {
  // Get recent solves for this event
  const recentSolves = await ctx.db
    .query("timerSessions")
    .withIndex("by_user_event", (q) =>
      q.eq("userId", userId).eq("event", event)
    )
    .order("desc")
    .take(100);

  const validTimes = recentSolves
    .filter((solve: any) => solve.finalTime !== Infinity)
    .map((solve: any) => solve.finalTime);

  if (validTimes.length === 0) return;

  // Calculate statistics
  const bestSingle = Math.min(...validTimes);
  const totalSolves = recentSolves.length;

  // Calculate averages
  let bestAo5 = null;
  let bestAo12 = null;
  let recentAo5 = null;
  let recentAo12 = null;

  if (validTimes.length >= 5) {
    recentAo5 = calculateAverage(validTimes.slice(0, 5));
    bestAo5 = calculateBestAverage(validTimes, 5);
  }

  if (validTimes.length >= 12) {
    recentAo12 = calculateAverage(validTimes.slice(0, 12));
    bestAo12 = calculateBestAverage(validTimes, 12);
  }

  // Update or create stats
  const existingStats = await ctx.db
    .query("userStats")
    .withIndex("by_user_event", (q) =>
      q.eq("userId", userId).eq("event", event)
    )
    .first();

  const statsData = {
    bestSingle,
    bestAo5,
    bestAo12,
    recentAo5,
    recentAo12,
    totalSolves,
    lastSolveDate: recentSolves[0]?.solveDate,
    lastCalculated: Date.now(),
  };

  if (existingStats) {
    await ctx.db.patch(existingStats._id, statsData);
  } else {
    await ctx.db.insert("userStats", {
      userId,
      event,
      firstSolveDate: recentSolves[recentSolves.length - 1]?.solveDate,
      ...statsData,
    });
  }
}

// Helper function to calculate average (removes best and worst for Ao5/Ao12)
function calculateAverage(times: number[]): number {
  if (times.length < 3) return times.reduce((a, b) => a + b) / times.length;

  const sorted = [...times].sort((a, b) => a - b);
  const trimmed = sorted.slice(1, -1); // Remove best and worst
  return trimmed.reduce((a, b) => a + b) / trimmed.length;
}

// Helper function to find best average in a set of times
function calculateBestAverage(times: number[], size: number): number | null {
  if (times.length < size) return null;

  let best = Infinity;
  for (let i = 0; i <= times.length - size; i++) {
    const subset = times.slice(i, i + size);
    const avg = calculateAverage(subset);
    best = Math.min(best, avg);
  }

  return best;
}