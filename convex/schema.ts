import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    // WCA Authentication Data
    wcaId: v.string(), // WCA ID (e.g., "2023SMIT01")
    wcaUserId: v.number(), // Internal WCA user ID
    name: v.string(), // Full name
    email: v.string(), // Email address
    countryIso2: v.string(), // Country code (e.g., "US", "CA")
    avatar: v.optional(v.string()), // Avatar URL from WCA

    // Authentication Tokens
    accessToken: v.optional(v.string()), // WCA OAuth access token
    refreshToken: v.optional(v.string()), // WCA OAuth refresh token (if available)
    tokenExpiry: v.optional(v.number()), // Token expiration timestamp

    // User Preferences & Settings
    timezone: v.optional(v.string()), // User's timezone
    preferredEvents: v.optional(v.array(v.string())), // Preferred cube events
    inspectionEnabled: v.optional(v.boolean()), // Timer inspection preference

    // Metadata
    createdAt: v.number(), // Account creation timestamp
    updatedAt: v.number(), // Last update timestamp
    lastLoginAt: v.number(), // Last login timestamp

    // WCA Profile Data (optional additional info)
    dateOfBirth: v.optional(v.string()), // Date of birth (if scope includes dob)
    gender: v.optional(v.string()), // Gender
    region: v.optional(v.string()), // WCA region
  })
    .index("by_wca_id", ["wcaId"]) // Index for fast lookup by WCA ID
    .index("by_wca_user_id", ["wcaUserId"]) // Index for fast lookup by WCA user ID
    .index("by_email", ["email"]), // Index for fast lookup by email

  // Timer Sessions - stores timing data for each user
  timerSessions: defineTable({
    userId: v.id("users"), // Reference to user

    // Session Data
    event: v.string(), // Cube event (e.g., "3x3", "4x4", "OH")
    scramble: v.string(), // Scramble used
    time: v.number(), // Solve time in milliseconds
    penalty: v.union(v.literal("none"), v.literal("+2"), v.literal("DNF")), // Penalty applied
    finalTime: v.number(), // Final time including penalties (Infinity for DNF)

    // Solve Details
    inspectionTime: v.optional(v.number()), // Inspection time used (if enabled)
    solveDate: v.number(), // Timestamp when solve was completed

    // Session Context
    sessionId: v.optional(v.string()), // Group related solves in a session
    comment: v.optional(v.string()), // User notes about the solve

    // Metadata
    createdAt: v.number(),
  })
    .index("by_user", ["userId"]) // Index for user's solves
    .index("by_user_event", ["userId", "event"]) // Index for user's solves by event
    .index("by_session", ["sessionId"]) // Index for session grouping
    .index("by_solve_date", ["solveDate"]), // Index for chronological ordering

  // User Statistics - computed statistics for quick access
  userStats: defineTable({
    userId: v.id("users"), // Reference to user
    event: v.string(), // Cube event

    // Personal Bests
    bestSingle: v.optional(v.number()), // Best single solve time
    bestAo5: v.optional(v.number()), // Best average of 5
    bestAo12: v.optional(v.number()), // Best average of 12
    bestAo100: v.optional(v.number()), // Best average of 100

    // Session Counts
    totalSolves: v.number(), // Total number of solves

    // Recent Performance
    recentAo5: v.optional(v.number()), // Most recent Ao5
    recentAo12: v.optional(v.number()), // Most recent Ao12

    // Improvement Tracking
    firstSolveDate: v.optional(v.number()), // Date of first solve
    lastSolveDate: v.optional(v.number()), // Date of most recent solve

    // Metadata
    lastCalculated: v.number(), // When stats were last computed
  })
    .index("by_user", ["userId"]) // Index for user's stats
    .index("by_user_event", ["userId", "event"]), // Index for user's stats by event
});