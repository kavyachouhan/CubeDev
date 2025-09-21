import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    // Core User Info
    wcaId: v.string(), // WCA ID (e.g., "2019DOEJ01")
    wcaUserId: v.number(), // Internal WCA user ID
    name: v.string(), // Full name
    email: v.string(), // Email address
    countryIso2: v.string(), // Country code (e.g., "US", "CA")
    avatar: v.optional(v.string()), // Avatar URL from WCA

    // Authentication Tokens
    accessToken: v.optional(v.string()), // WCA OAuth access token
    refreshToken: v.optional(v.string()), // WCA OAuth refresh token
    tokenExpiry: v.optional(v.number()), // Token expiration timestamp

    // Timestamps
    createdAt: v.number(), // Account creation timestamp
    updatedAt: v.number(), // Last update timestamp
    lastLoginAt: v.number(), // Last login timestamp

    // Additional Info
    gender: v.optional(v.string()), // Gender
  })
    .index("by_wca_id", ["wcaId"]) // Index for fast lookup by WCA ID
    .index("by_wca_user_id", ["wcaUserId"]) // Index for fast lookup by WCA user ID
    .index("by_email", ["email"]), // Index for fast lookup by email

  // Timer Sessions - organizing solve sessions
  sessions: defineTable({
    userId: v.id("users"), // Reference to user
    name: v.string(), // Session name
    event: v.string(), // Primary event for this session
    createdAt: v.number(), // When session was created
    updatedAt: v.number(), // When session was last modified
    isActive: v.boolean(), // Whether this is the currently active session
    solveCount: v.number(), // Number of solves in this session

    // Session metadata
    description: v.optional(v.string()), // Session description
    tags: v.optional(v.array(v.string())), // Tags for categorizing sessions
  })
    .index("by_user", ["userId"]) // Index for user's sessions
    .index("by_user_active", ["userId", "isActive"]) // Index for active session lookup
    .index("by_user_event", ["userId", "event"]), // Index for sessions by event

  // Timer Solves - individual solve records
  solves: defineTable({
    userId: v.id("users"), // Reference to user
    sessionId: v.id("sessions"), // Reference to session

    // Solve Data
    event: v.string(), // Cube even
    scramble: v.string(), // Scramble used
    time: v.number(), // Raw solve time in milliseconds
    penalty: v.union(v.literal("none"), v.literal("+2"), v.literal("DNF")), // Penalty applied
    finalTime: v.number(), // Final time after penalty

    // Solve Details
    solveDate: v.number(), // Timestamp when solve was completed

    // Additional Context
    comment: v.optional(v.string()), // User notes about the solve
    tags: v.optional(v.array(v.string())), // Tags for categorizing solves 

    // Metadata
    createdAt: v.number(),
  })
    .index("by_user", ["userId"]) // Index for user's solves
    .index("by_session", ["sessionId"]) // Index for session's solves
    .index("by_user_event", ["userId", "event"]) // Index for user's solves by event
    .index("by_user_session", ["userId", "sessionId"]) // Index for user's session solves
    .index("by_solve_date", ["solveDate"]) // Index for chronological ordering
    .index("by_session_date", ["sessionId", "solveDate"]), // Index for session chronological ordering  
});