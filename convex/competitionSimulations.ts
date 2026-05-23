import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { resolveUserByIdentifierOrAlias } from "./identifierResolver";

// Helper to resolve user by canonical identifier or alias.
async function getUserByIdentifier(ctx: any, identifier: string) {
  const { user } = await resolveUserByIdentifierOrAlias(ctx, identifier);
  return user;
}

// Create a new competition simulation
export const createSimulation = mutation({
  args: {
    wcaId: v.string(), // WCA ID of the user
    competitionId: v.string(),
    competitionName: v.string(),
    competitionDate: v.string(),
    competitionVenue: v.optional(v.string()),
    competitionCity: v.optional(v.string()),
    competitionCountry: v.optional(v.string()),
    selectedEvents: v.array(v.string()),
    eventRounds: v.optional(v.any()),
    atmosphereSettings: v.object({
      crowdNoise: v.number(),
      pressure: v.number(),
      distractions: v.boolean(),
      timerDelay: v.boolean(),
      judgeInteractions: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    if (!args.wcaId) {
      throw new Error("Not authenticated");
    }

    // Get user from database
    const user = await getUserByIdentifier(ctx, args.wcaId);

    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();

    // Create the simulation record
    const simulationId = await ctx.db.insert("competitionSimulations", {
      userId: user._id,
      competitionId: args.competitionId,
      competitionName: args.competitionName,
      competitionDate: args.competitionDate,
      competitionVenue: args.competitionVenue,
      competitionCity: args.competitionCity,
      competitionCountry: args.competitionCountry,
      selectedEvents: args.selectedEvents,
      eventRounds: args.eventRounds,
      atmosphereSettings: args.atmosphereSettings,
      status: "in-progress",
      completedEvents: [],
      eventProgress: {},
      startedAt: now,
      lastActivityAt: now,
      createdAt: now,
    });

    return simulationId;
  },
});

// Get a simulation by ID
export const getSimulation = query({
  args: { simulationId: v.id("competitionSimulations") },
  handler: async (ctx, args) => {
    const simulation = await ctx.db.get(args.simulationId);
    return simulation;
  },
});

// Get user's simulations for a specific competition
export const getUserSimulationsForCompetition = query({
  args: {
    wcaId: v.optional(v.string()),
    competitionId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.wcaId) {
      return [];
    }

    const user = await getUserByIdentifier(ctx, args.wcaId);

    if (!user) {
      return [];
    }

    const simulations = await ctx.db
      .query("competitionSimulations")
      .withIndex("by_user_competition", (q) =>
        q.eq("userId", user._id).eq("competitionId", args.competitionId),
      )
      .order("desc")
      .collect();

    return simulations;
  },
});

// Get user's recent simulations
export const getUserRecentSimulations = query({
  args: {
    wcaId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.wcaId) {
      return [];
    }

    const user = await getUserByIdentifier(ctx, args.wcaId);

    if (!user) {
      return [];
    }

    const limit = args.limit ?? 10;
    const simulations = await ctx.db
      .query("competitionSimulations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);

    return simulations;
  },
});

// Update simulation progress
export const updateSimulationProgress = mutation({
  args: {
    simulationId: v.id("competitionSimulations"),
    completedEvents: v.array(v.string()),
    eventProgress: v.any(),
  },
  handler: async (ctx, args) => {
    const simulation = await ctx.db.get(args.simulationId);
    if (!simulation) {
      throw new Error("Simulation not found");
    }

    await ctx.db.patch(args.simulationId, {
      completedEvents: args.completedEvents,
      eventProgress: args.eventProgress,
      lastActivityAt: Date.now(),
    });
  },
});

// Complete a simulation
export const completeSimulation = mutation({
  args: { simulationId: v.id("competitionSimulations") },
  handler: async (ctx, args) => {
    const simulation = await ctx.db.get(args.simulationId);
    if (!simulation) {
      throw new Error("Simulation not found");
    }

    await ctx.db.patch(args.simulationId, {
      status: "completed",
      completedAt: Date.now(),
      lastActivityAt: Date.now(),
    });
  },
});

// Abandon a simulation
export const abandonSimulation = mutation({
  args: { simulationId: v.id("competitionSimulations") },
  handler: async (ctx, args) => {
    const simulation = await ctx.db.get(args.simulationId);
    if (!simulation) {
      throw new Error("Simulation not found");
    }

    await ctx.db.patch(args.simulationId, {
      status: "abandoned",
      lastActivityAt: Date.now(),
    });
  },
});

// Save a round result
export const saveRoundResult = mutation({
  args: {
    simulationId: v.id("competitionSimulations"),
    eventId: v.string(),
    roundNumber: v.number(),
    solves: v.array(
      v.object({
        time: v.number(),
        scramble: v.string(),
        penalty: v.union(v.literal("none"), v.literal("+2"), v.literal("DNF")),
        inspectionViolation: v.optional(
          v.union(v.literal("+2"), v.literal("DNF"), v.null()),
        ),
        solvedAt: v.number(),
      }),
    ),
    average: v.number(),
    best: v.number(),
  },
  handler: async (ctx, args) => {
    const simulation = await ctx.db.get(args.simulationId);
    if (!simulation) {
      throw new Error("Simulation not found");
    }

    const now = Date.now();

    // Save the round result
    const resultId = await ctx.db.insert("competitionSimulationResults", {
      simulationId: args.simulationId,
      userId: simulation.userId,
      eventId: args.eventId,
      roundNumber: args.roundNumber,
      solves: args.solves,
      average: args.average,
      best: args.best,
      completedAt: now,
      createdAt: now,
    });

    // Update simulation last activity
    await ctx.db.patch(args.simulationId, {
      lastActivityAt: now,
    });

    return resultId;
  },
});

// Get results for a simulation
export const getSimulationResults = query({
  args: { simulationId: v.id("competitionSimulations") },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("competitionSimulationResults")
      .withIndex("by_simulation", (q) =>
        q.eq("simulationId", args.simulationId),
      )
      .collect();

    return results;
  },
});

// Get user's results for a specific event across all simulations
export const getUserEventResults = query({
  args: {
    wcaId: v.optional(v.string()),
    eventId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.wcaId) {
      return [];
    }

    const user = await getUserByIdentifier(ctx, args.wcaId);

    if (!user) {
      return [];
    }

    const results = await ctx.db
      .query("competitionSimulationResults")
      .withIndex("by_user_event", (q) =>
        q.eq("userId", user._id).eq("eventId", args.eventId),
      )
      .collect();

    return results;
  },
});

// Get in-progress simulations for a user
export const getInProgressSimulations = query({
  args: {
    wcaId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.wcaId) {
      return [];
    }

    const user = await getUserByIdentifier(ctx, args.wcaId);

    if (!user) {
      return [];
    }

    const simulations = await ctx.db
      .query("competitionSimulations")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", user._id).eq("status", "in-progress"),
      )
      .collect();

    return simulations;
  },
});
