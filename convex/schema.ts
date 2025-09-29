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

    // Privacy Settings
    hideProfile: v.optional(v.boolean()), // Hide CubeDev profile from public view
    hideChallengeStats: v.optional(v.boolean()), // Hide challenge room stats from public view

    // Account Status
    isDeleted: v.optional(v.boolean()), // Soft delete flag
    deletedAt: v.optional(v.number()), // Deletion timestamp
  })
    .index("by_wca_id", ["wcaId"]) // Index for fast lookup by WCA ID
    .index("by_wca_user_id", ["wcaUserId"]) // Index for fast lookup by WCA user ID
    .index("by_email", ["email"]) // Index for fast lookup by email
    .index("by_deleted", ["isDeleted"]), // Index for filtering deleted users

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

    // Phase Split Data
    splits: v.optional(
      v.array(
        v.object({
          phase: v.string(), // Phase name (e.g., "cross", "f2l", "oll", "pll")
          time: v.number(), // Time at which this phase was completed (milliseconds from start)
        })
      )
    ), // Phase splits marked during solve
    splitMethod: v.optional(v.string()), // Split method used (e.g., "cfop", "2ll", "4ll")
    microPausesMs: v.optional(v.array(v.number())), // Micro-pauses detected during solve for consistency analysis

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

  // Challenge Rooms - async scramble rooms for competitions
  challengeRooms: defineTable({
    // Basic Room Info
    roomId: v.string(), // Unique room identifier (short code)
    name: v.string(), // Room name/title
    event: v.string(), // WCA event (333, 222, etc.)
    format: v.union(v.literal("ao5"), v.literal("ao12")), // Average format

    // Room Owner
    createdBy: v.id("users"), // User who created the room

    // Room State
    status: v.union(
      v.literal("active"),
      v.literal("expired"),
      v.literal("archived")
    ), // Room status

    // Scrambles (fixed set for all participants)
    scrambles: v.array(v.string()), // Pre-generated scrambles

    // Timestamps
    createdAt: v.number(), // Room creation time
    expiresAt: v.number(), // Room expiration time (48h after creation)

    // Participation Stats
    participantCount: v.number(), // Number of users who joined
    completedCount: v.number(), // Number of users who completed all solves

    // Room Configuration
    isPublic: v.boolean(), // Whether room appears in public listings
    description: v.optional(v.string()), // Optional room description
  })
    .index("by_room_id", ["roomId"]) // Index for room lookup
    .index("by_creator", ["createdBy"]) // Index for creator's rooms
    .index("by_status", ["status"]) // Index for active/expired rooms
    .index("by_event", ["event"]) // Index for rooms by event
    .index("by_expiry", ["expiresAt"]) // Index for expiry cleanup
    .index("by_public_status", ["isPublic", "status"]), // Index for public room listings

  // Room Participants - users who joined a room
  roomParticipants: defineTable({
    roomId: v.id("challengeRooms"), // Reference to room
    userId: v.id("users"), // Reference to user

    // Participation Info
    joinedAt: v.number(), // When user joined room
    completedAt: v.optional(v.number()), // When user completed all solves

    // Progress Tracking
    solvesCompleted: v.number(), // Number of solves completed
    totalSolves: v.number(), // Total solves required (5 for ao5, 12 for ao12)

    // Results Summary
    isCompleted: v.boolean(), // Whether user completed all solves
    bestSingle: v.optional(v.number()), // Best single time
    average: v.optional(v.number()), // Calculated average
    dnfCount: v.number(), // Number of DNF solves

    // Final Ranking
    finalRank: v.optional(v.number()), // User's rank in the room
  })
    .index("by_room", ["roomId"]) // Index for room participants
    .index("by_user", ["userId"]) // Index for user's room participations
    .index("by_room_user", ["roomId", "userId"]) // Index for unique participation
    .index("by_completion", ["roomId", "isCompleted"]) // Index for completed participants
    .index("by_rank", ["roomId", "finalRank"]), // Index for leaderboard ordering

  // Room Solves - individual solves within challenge rooms
  roomSolves: defineTable({
    roomId: v.id("challengeRooms"), // Reference to room
    participantId: v.id("roomParticipants"), // Reference to participant record
    userId: v.id("users"), // Reference to user (for easier queries)

    // Solve Info
    solveNumber: v.number(), // Which solve this is (1-12 for ao12, 1-5 for ao5)
    scramble: v.string(), // The scramble used
    event: v.string(), // WCA event

    // Timing Results
    time: v.number(), // Raw solve time in milliseconds
    penalty: v.union(v.literal("none"), v.literal("+2"), v.literal("DNF")), // Penalty
    finalTime: v.number(), // Final time after penalty

    // Metadata
    solveDate: v.number(), // When solve was completed
    createdAt: v.number(),

    // Optional Context
    comment: v.optional(v.string()), // User notes
  })
    .index("by_room", ["roomId"]) // Index for room solves
    .index("by_participant", ["participantId"]) // Index for participant's solves
    .index("by_user", ["userId"]) // Index for user's room solves
    .index("by_room_user", ["roomId", "userId"]) // Index for user's solves in specific room
    .index("by_solve_number", ["participantId", "solveNumber"]), // Index for ordered solves

  // Contact Messages - messages from users via contact form
  contactMessages: defineTable({
    // Contact Info
    name: v.string(), // Sender's name
    email: v.string(), // Sender's email
    subject: v.string(), // Message subject
    message: v.string(), // Message content

    // Optional fields
    wcaId: v.optional(v.string()), // WCA ID if provided
    userId: v.optional(v.id("users")), // Reference to user if logged in

    // Metadata
    createdAt: v.number(), // When message was sent
    isRead: v.optional(v.boolean()), // Whether message has been read
    adminNotes: v.optional(v.string()), // Admin notes about the message

    // Status
    status: v.union(
      v.literal("new"),
      v.literal("read"),
      v.literal("replied"),
      v.literal("resolved")
    ), // Message status
  })
    .index("by_email", ["email"]) // Index for sender lookup
    .index("by_status", ["status"]) // Index for filtering by status
    .index("by_created", ["createdAt"]) // Index for chronological ordering
    .index("by_user", ["userId"]), // Index for user messages
});