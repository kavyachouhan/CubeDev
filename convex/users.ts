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
    dateOfBirth: v.optional(v.string()),
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

// Get all users (for directory/discovery)
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").order("desc").take(100); // Limit to 100 for performance
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