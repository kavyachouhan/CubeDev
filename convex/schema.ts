import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    // Core User Info
    wcaId: v.string(), // WCA ID (e.g., "2019DOEJ01")
    wcaUserId: v.number(), // Internal WCA user ID
    name: v.string(), // Full name
    email: v.optional(v.string()), // Email address (optional for deleted users)
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

    // Theme & Appearance Settings
    themeMode: v.optional(v.string()), // "light" | "dark" | "auto"
    colorScheme: v.optional(v.string()), // "blue" | "purple" | "green" | "orange" | "cyan"
    timerFontSize: v.optional(v.string()), // "sm" | "md" | "lg" | "xl"
    timerFontFamily: v.optional(v.string()), // "mono" | "sans" | "statement"
    timerUpdateMode: v.optional(v.string()), // "live" | "solving" | "seconds"
    reduceMotion: v.optional(v.boolean()), // Reduce animations
    disableGlow: v.optional(v.boolean()), // Disable glow effects
    highContrast: v.optional(v.boolean()), // High contrast mode

    // Account Status
    isDeleted: v.optional(v.boolean()), // Soft delete flag
    deletedAt: v.optional(v.number()), // Deletion timestamp

    // Notification Management
    dismissedNotifications: v.optional(
      v.array(
        v.object({
          progressId: v.id("userAlgorithmProgress"), // Reference to dismissed progress record
          dismissedAt: v.number(), // When notification was dismissed
        })
      )
    ), // Array of dismissed algorithm review notifications
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

    // Timer Mode
    timerMode: v.optional(
      v.union(v.literal("normal"), v.literal("manual"), v.literal("stackmat"))
    ), // Timer mode used

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

  // Pre-computed user statistics per event (updated on solve add/delete/update)
  userEventStats: defineTable({
    userId: v.id("users"), // Reference to user
    event: v.string(), // WCA event code (333, 222, etc.)

    // Core Statistics (all times in milliseconds)
    totalSolves: v.number(), // Total number of solves for this event
    totalNonDnfSolves: v.number(), // Number of non-DNF solves
    bestSingle: v.optional(v.number()), // Best single time (truncated to centiseconds)
    bestAo5: v.optional(v.number()), // Best average of 5 (rounded to centiseconds)
    bestAo12: v.optional(v.number()), // Best average of 12 (rounded to centiseconds)
    bestAo100: v.optional(v.number()), // Best average of 100 (rounded to centiseconds)
    overallAverage: v.optional(v.number()), // Mean of all non-DNF solves (rounded to centiseconds)

    // Activity Statistics
    firstSolveDate: v.optional(v.number()), // Timestamp of first solve
    lastSolveDate: v.optional(v.number()), // Timestamp of most recent solve
    activeDays: v.number(), // Number of unique days with solves

    // Last updated timestamp
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]) // Index for user's event stats
    .index("by_user_event", ["userId", "event"]), // Index for specific user-event combo

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
    wasDeletedWhenJoined: v.optional(v.boolean()), // Whether user was deleted when they joined

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

  // Algorithm Sets - groups of algorithms (PLL, OLL, COLL, etc.)
  algorithmSets: defineTable({
    name: v.string(), // "PLL", "OLL", "COLL", etc.
    slug: v.optional(v.string()), // URL-friendly name: "pll", "oll", "coll", etc. (optional during migration)
    category: v.string(), // "CFOP", "Roux", "ZZ", "2x2", etc.
    description: v.string(), // Detailed description
    caseCount: v.number(), // Number of cases in this set
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
    puzzleType: v.optional(v.string()), // "3x3x3", "2x2x2", "4x4x4", etc. - defaults to "3x3x3" if not specified
    iconUrl: v.optional(v.string()), // Icon/badge URL
    order: v.number(), // Display order
    isPublished: v.boolean(), // Whether visible to users
    createdAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_published", ["isPublished"])
    .index("by_order", ["order"])
    .index("by_slug", ["slug"]),

  // Algorithm Cases - individual cases within sets
  algorithmCases: defineTable({
    setId: v.id("algorithmSets"), // Reference to algorithm set
    caseName: v.string(), // "T-Perm", "OLL 21", etc.
    slug: v.optional(v.string()), // URL-friendly name: "t-perm", "oll-21", etc. (optional during migration)
    caseImage: v.optional(v.string()), // URL to case diagram
    setupMoves: v.string(), // Scramble to create this case
    recognition: v.array(v.string()), // Recognition tips
    difficulty: v.number(), // 1-10 scale
    frequency: v.number(), // How common (1-5 stars)
    order: v.number(), // Order within set
    createdAt: v.number(),
  })
    .index("by_set", ["setId"])
    .index("by_set_order", ["setId", "order"])
    .index("by_difficulty", ["difficulty"])
    .index("by_slug", ["slug"])
    .index("by_set_slug", ["setId", "slug"]),

  // Algorithms - individual algorithm variations
  algorithms: defineTable({
    caseId: v.id("algorithmCases"), // Reference to case
    notation: v.string(), // Algorithm notation
    moveCount: v.number(), // Number of moves
    fingerTricks: v.optional(v.string()), // Fingertrick description
    averageSpeed: v.optional(v.number()), // Community average execution time
    popularity: v.number(), // Popularity score (0-100)
    isDefault: v.boolean(), // Whether this is the default/recommended
    createdBy: v.optional(v.string()), // Algorithm author
    videoUrl: v.optional(v.string()), // Tutorial video URL
    notes: v.optional(v.string()), // Additional notes
    createdAt: v.number(),
  })
    .index("by_case", ["caseId"])
    .index("by_case_default", ["caseId", "isDefault"])
    .index("by_popularity", ["caseId", "popularity"]),

  // User Algorithm Progress - tracks learning progress
  userAlgorithmProgress: defineTable({
    userId: v.id("users"), // Reference to user
    caseId: v.id("algorithmCases"), // Reference to case
    preferredAlgId: v.id("algorithms"), // User's preferred algorithm

    // SRS Data
    learningStage: v.union(
      v.literal("new"),
      v.literal("learning"),
      v.literal("reviewing"),
      v.literal("mastered")
    ),
    easeFactor: v.number(), // SRS ease factor (default 2.5)
    interval: v.number(), // Days until next review
    nextReviewDate: v.number(), // Timestamp for next review
    reviewCount: v.number(), // Total reviews completed
    lapseCount: v.number(), // Times marked as forgotten

    // Performance Metrics
    recognitionTimes: v.array(v.number()), // Last 10 recognition times (ms)
    executionTimes: v.array(v.number()), // Last 10 execution times (ms)
    accuracyRate: v.number(), // % correct recognition (0-100)

    // Timestamps
    firstLearnedAt: v.number(),
    lastReviewedAt: v.number(),
    masteredAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_case", ["userId", "caseId"])
    .index("by_user_next_review", ["userId", "nextReviewDate"])
    .index("by_user_stage", ["userId", "learningStage"])
    .index("by_case", ["caseId"]),

  // Custom Algorithm Sets - user-created collections
  customAlgorithmSets: defineTable({
    userId: v.id("users"), // Reference to user
    name: v.string(), // Set name
    description: v.optional(v.string()),
    caseIds: v.array(v.id("algorithmCases")), // Cases in this set
    isPublic: v.boolean(), // Whether shared publicly
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_public", ["isPublic"]),

  // Algorithm Practice Sessions - tracks practice activity
  algorithmPracticeSessions: defineTable({
    userId: v.id("users"), // Reference to user
    sessionType: v.union(
      v.literal("recognition"),
      v.literal("execution"),
      v.literal("drill"),
      v.literal("mixed")
    ),
    casesReviewed: v.number(), // Number of cases practiced
    averageRecognitionTime: v.optional(v.number()), // Average time (ms)
    averageExecutionTime: v.optional(v.number()), // Average time (ms)
    accuracyRate: v.number(), // % correct (0-100)
    duration: v.number(), // Session duration (ms)
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "createdAt"])
    .index("by_type", ["sessionType"]),

  // Push Subscriptions - for web push notifications
  pushSubscriptions: defineTable({
    userId: v.id("users"), // Reference to user
    endpoint: v.string(), // Push service endpoint URL
    keys: v.object({
      p256dh: v.string(), // P-256 ECDH public key
      auth: v.string(), // Authentication secret
    }),
    userAgent: v.optional(v.string()), // Device/browser info
    deviceName: v.optional(v.string()), // User-friendly device name
    createdAt: v.number(), // When subscription was created
    lastUsedAt: v.number(), // Last time notification was sent
    isActive: v.boolean(), // Whether subscription is still valid
    failureCount: v.number(), // Number of failed delivery attempts
  })
    .index("by_user", ["userId"])
    .index("by_endpoint", ["endpoint"])
    .index("by_user_active", ["userId", "isActive"]),

  // Push Notification Log - track sent notifications
  pushNotificationLog: defineTable({
    userId: v.id("users"), // Reference to user
    subscriptionId: v.optional(v.id("pushSubscriptions")), // Reference to subscription
    type: v.string(), // Notification type (e.g., "algorithm_due", "challenge_invite")
    title: v.string(), // Notification title
    body: v.string(), // Notification body
    data: v.optional(v.any()), // Additional data payload
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("failed"),
      v.literal("clicked")
    ),
    error: v.optional(v.string()), // Error message if failed
    sentAt: v.number(), // When notification was sent
    clickedAt: v.optional(v.number()), // When user clicked (if tracked)
  })
    .index("by_user", ["userId"])
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_user_type", ["userId", "type"]),

  // Feedback Responses - user feedback survey submissions
  feedbackResponses: defineTable({
    userId: v.optional(v.id("users")), // Reference to user (optional for anonymous)

    // Survey identification for reusability
    surveyType: v.string(), // e.g., "general", "feature-specific", "beta-feedback"
    surveyVersion: v.string(), // e.g., "1.0", "2.0" - track survey changes over time

    // UI/UX Rating (1-5 scale)
    uiuxRating: v.optional(v.number()),

    // Feature usefulness ratings (flexible structure)
    featureRatings: v.optional(v.any()), // Allows any feature structure for different surveys

    // Most useful feature
    mostUsefulFeature: v.optional(v.string()),

    // Feature requests
    featureRequests: v.optional(v.string()),

    // Would recommend to friends (1-10 NPS scale)
    recommendScore: v.optional(v.number()),

    // Additional comments
    additionalComments: v.optional(v.string()),

    // Custom responses for flexible surveys
    customResponses: v.optional(v.any()), // Allows arbitrary question/answer pairs

    // Metadata
    createdAt: v.number(),
    userAgent: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_created", ["createdAt"])
    .index("by_recommend_score", ["recommendScore"])
    .index("by_survey_type", ["surveyType"])
    .index("by_survey_version", ["surveyType", "surveyVersion"]),

  // Competition Simulations - track competition simulation sessions
  competitionSimulations: defineTable({
    userId: v.id("users"), // Reference to user
    competitionId: v.string(), // WCA competition ID
    competitionName: v.string(), // Competition name
    competitionDate: v.string(), // Competition start date
    competitionVenue: v.optional(v.string()), // Competition venue
    competitionCity: v.optional(v.string()), // Competition city
    competitionCountry: v.optional(v.string()), // Competition country

    // Selected events for this simulation
    selectedEvents: v.array(v.string()), // Array of event IDs (e.g., ["333", "222", "444"])

    // Rounds per event
    eventRounds: v.optional(v.any()), // Map of eventId -> number of rounds

    // Atmosphere settings
    atmosphereSettings: v.object({
      crowdNoise: v.number(), // 0-100
      pressure: v.number(), // 0-100
      distractions: v.boolean(), // Random distractions
      timerDelay: v.boolean(), // Random timer delay like real stackmat
      judgeInteractions: v.boolean(), // Simulate judge interactions
    }),

    // Simulation status
    status: v.union(
      v.literal("in-progress"),
      v.literal("completed"),
      v.literal("abandoned")
    ),

    // Progress tracking
    completedEvents: v.array(v.string()), // Events fully completed
    eventProgress: v.any(), // Map of eventId -> completed rounds

    // Timestamps
    startedAt: v.number(), // When simulation started
    completedAt: v.optional(v.number()), // When simulation completed
    lastActivityAt: v.number(), // Last activity timestamp
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_competition", ["competitionId"])
    .index("by_user_competition", ["userId", "competitionId"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"]),

  // Competition Simulation Results - individual round results
  competitionSimulationResults: defineTable({
    simulationId: v.id("competitionSimulations"), // Reference to simulation
    userId: v.id("users"), // Reference to user

    // Event and round info
    eventId: v.string(), // WCA event ID
    roundNumber: v.number(), // Round number (1, 2, 3, etc.)

    // Solves data
    solves: v.array(
      v.object({
        time: v.number(), // Time in milliseconds
        scramble: v.string(), // Scramble used
        penalty: v.union(v.literal("none"), v.literal("+2"), v.literal("DNF")),
        inspectionViolation: v.optional(
          v.union(v.literal("+2"), v.literal("DNF"), v.null())
        ),
        solvedAt: v.number(), // When this solve was completed
      })
    ),

    // Calculated results
    average: v.number(), // Average time (or DNF flag)
    best: v.number(), // Best single

    // Timestamps
    completedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_simulation", ["simulationId"])
    .index("by_user", ["userId"])
    .index("by_user_event", ["userId", "eventId"])
    .index("by_simulation_event", ["simulationId", "eventId"]),

  // Coach Profiles - user coaching setup and goals
  coachProfiles: defineTable({
    userId: v.id("users"), // Reference to user
    
    // Current skill level (from session analysis)
    currentAverage: v.optional(v.number()), // Current average time in ms
    skillLevel: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced"),
      v.literal("expert")
    ),
    primaryEvent: v.string(), // Main event user wants to improve (333, 222, etc.)
    
    // Goals
    goalType: v.union(
      v.literal("sub-60"),
      v.literal("sub-45"),
      v.literal("sub-30"),
      v.literal("sub-20"),
      v.literal("sub-15"),
      v.literal("sub-12"),
      v.literal("sub-10"),
      v.literal("sub-8"),
      v.literal("competition-ready"),
      v.literal("custom")
    ),
    customGoalTime: v.optional(v.number()), // For custom goals, time in ms
    targetDate: v.number(), // Target date to achieve goal
    
    // Time commitment
    dailyPracticeMinutes: v.number(), // Daily practice time commitment
    practiceSchedule: v.optional(v.array(v.string())), // Days of week available
    
    // Session reference for baseline
    baselineSessionId: v.optional(v.id("sessions")), // Session used to determine current level
    
    // Onboarding status
    onboardingCompleted: v.boolean(),
    onboardingCompletedAt: v.optional(v.number()),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_skill_level", ["skillLevel"])
    .index("by_goal_type", ["goalType"]),

  // Coach Training Plans - weekly training plans
  coachTrainingPlans: defineTable({
    userId: v.id("users"), // Reference to user
    profileId: v.id("coachProfiles"), // Reference to coach profile
    
    // Plan period
    weekNumber: v.number(), // Week number in the program
    weekStartDate: v.number(), // Start date of this week
    weekEndDate: v.number(), // End date of this week
    
    // Plan status
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("skipped")
    ),
    
    // Daily training activities
    dailyPlans: v.array(
      v.object({
        dayOfWeek: v.number(), // 0 = Sunday, 6 = Saturday
        date: v.number(), // Timestamp for this day
        focus: v.string(), // Main focus for the day (e.g., "Cross Practice", "F2L Efficiency")
        activities: v.array(
          v.object({
            type: v.union(
              v.literal("timed-solves"),
              v.literal("untimed-practice"),
              v.literal("algorithm-drill"),
              v.literal("slow-solves"),
              v.literal("reconstruction"),
              v.literal("cross-practice"),
              v.literal("f2l-practice"),
              v.literal("lookahead-training"),
              v.literal("competition-sim"),
              v.literal("rest")
            ),
            title: v.string(), // Display title
            description: v.string(), // Detailed description
            durationMinutes: v.number(), // Estimated duration
            targetSolves: v.optional(v.number()), // Number of solves to complete
            completed: v.boolean(),
            completedAt: v.optional(v.number()),
          })
        ),
        isCompleted: v.boolean(),
        isRestDay: v.boolean(),
      })
    ),
    
    // Progress tracking
    completedDays: v.number(),
    totalDays: v.number(),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_profile", ["profileId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_week_start", ["weekStartDate"]),

  // Coach Journal Entries - daily practice logs
  coachJournalEntries: defineTable({
    userId: v.id("users"), // Reference to user
    profileId: v.id("coachProfiles"), // Reference to coach profile
    planId: v.optional(v.id("coachTrainingPlans")), // Reference to training plan
    
    // Entry date
    entryDate: v.number(), // Date of the journal entry
    
    // Session reference (optional)
    linkedSessionId: v.optional(v.id("sessions")), // Link to a timer session
    
    // Session stats (computed from linked session or manual entry)
    solveCount: v.optional(v.number()),
    sessionAverage: v.optional(v.number()), // Average time in ms
    bestSingle: v.optional(v.number()), // Best single in ms
    practiceMinutes: v.optional(v.number()), // Total practice time
    
    // Reflection
    mood: v.union(
      v.literal("great"),
      v.literal("good"),
      v.literal("okay"),
      v.literal("frustrated"),
      v.literal("tired")
    ),
    wentWell: v.optional(v.string()), // What went well
    challenges: v.optional(v.string()), // What was challenging
    notes: v.optional(v.string()), // Additional notes
    
    // Focus areas practiced
    focusAreas: v.optional(v.array(v.string())), // e.g., ["cross", "f2l", "lookahead"]
    
    // Activities completed (from training plan)
    completedActivities: v.optional(v.array(v.string())), // Activity titles completed
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_profile", ["profileId"])
    .index("by_plan", ["planId"])
    .index("by_user_date", ["userId", "entryDate"])
    .index("by_entry_date", ["entryDate"]),

  // Coach Progress Snapshots - periodic progress tracking
  coachProgressSnapshots: defineTable({
    userId: v.id("users"), // Reference to user
    profileId: v.id("coachProfiles"), // Reference to coach profile
    
    // Snapshot date
    snapshotDate: v.number(),
    weekNumber: v.number(), // Week number in the program
    
    // Performance metrics
    averageTime: v.number(), // Current average in ms
    bestSingle: v.optional(v.number()), // Best single in ms
    bestAo5: v.optional(v.number()), // Best Ao5 in ms
    bestAo12: v.optional(v.number()), // Best Ao12 in ms
    
    // Practice stats
    totalSolves: v.number(),
    totalPracticeMinutes: v.number(),
    journalEntries: v.number(),
    
    // Progress towards goal
    progressPercentage: v.number(), // 0-100
    onTrack: v.boolean(), // Whether user is on track to meet goal
    
    // Notes
    aiInsights: v.optional(v.string()), // AI-generated insights
    
    // Timestamps
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_profile", ["profileId"])
    .index("by_user_week", ["userId", "weekNumber"])
    .index("by_snapshot_date", ["snapshotDate"]),
});
