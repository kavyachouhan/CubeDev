import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ==================== ALGORITHM SETS ====================

// Get all published algorithm sets
export const getAllSets = query({
  args: {},
  handler: async (ctx) => {
    const sets = await ctx.db
      .query("algorithmSets")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .collect();

    return sets.sort((a, b) => a.order - b.order);
  },
});

// Get a specific algorithm set with its cases
export const getSetWithCases = query({
  args: { setId: v.id("algorithmSets") },
  handler: async (ctx, { setId }) => {
    const set = await ctx.db.get(setId);
    if (!set) throw new Error("Algorithm set not found");

    const cases = await ctx.db
      .query("algorithmCases")
      .withIndex("by_set_order", (q) => q.eq("setId", setId))
      .collect();

    return { set, cases };
  },
});

// Get a specific algorithm set by slug with its cases
export const getSetBySlugWithCases = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const set = await ctx.db
      .query("algorithmSets")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (!set) {
      // Fallback: try to find by name if slug doesn't exist
      const setByName = await ctx.db
        .query("algorithmSets")
        .filter((q) => q.eq(q.field("name"), slug.toUpperCase()))
        .first();

      if (!setByName) {
        throw new Error("Algorithm set not found");
      }

      const cases = await ctx.db
        .query("algorithmCases")
        .withIndex("by_set_order", (q) => q.eq("setId", setByName._id))
        .collect();

      return { set: setByName, cases };
    }

    const cases = await ctx.db
      .query("algorithmCases")
      .withIndex("by_set_order", (q) => q.eq("setId", set._id))
      .collect();

    return { set, cases };
  },
});

// ==================== ALGORITHM CASES ====================

// Get a specific case with its algorithms
export const getCaseWithAlgorithms = query({
  args: { caseId: v.id("algorithmCases") },
  handler: async (ctx, { caseId }) => {
    const algorithmCase = await ctx.db.get(caseId);
    if (!algorithmCase) throw new Error("Algorithm case not found");

    const algorithms = await ctx.db
      .query("algorithms")
      .withIndex("by_case", (q) => q.eq("caseId", caseId))
      .collect();

    // Sort by default first, then by popularity
    algorithms.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return b.popularity - a.popularity;
    });

    const set = await ctx.db.get(algorithmCase.setId);

    return { case: algorithmCase, algorithms, set };
  },
});

// Get a specific case by slug with its algorithms
export const getCaseBySlugWithAlgorithms = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const algorithmCase = await ctx.db
      .query("algorithmCases")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (!algorithmCase) {
      // Fallback: try to find by case name if slug doesn't exist
      const caseByName = await ctx.db
        .query("algorithmCases")
        .filter((q) =>
          q.eq(
            q.field("caseName"),
            slug
              .replace(/-/g, " ")
              .split(" ")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ")
          )
        )
        .first();

      if (!caseByName) {
        throw new Error("Algorithm case not found");
      }

      const algorithms = await ctx.db
        .query("algorithms")
        .withIndex("by_case", (q) => q.eq("caseId", caseByName._id))
        .collect();

      // Sort by default first, then by popularity
      algorithms.sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return b.popularity - a.popularity;
      });

      const set = await ctx.db.get(caseByName.setId);

      return { case: caseByName, algorithms, set };
    }

    const algorithms = await ctx.db
      .query("algorithms")
      .withIndex("by_case", (q) => q.eq("caseId", algorithmCase._id))
      .collect();

    // Sort by default first, then by popularity
    algorithms.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return b.popularity - a.popularity;
    });

    const set = await ctx.db.get(algorithmCase.setId);

    return { case: algorithmCase, algorithms, set };
  },
});

// ==================== USER PROGRESS ====================

// Get user's progress for a specific set
export const getUserSetProgress = query({
  args: {
    userId: v.id("users"),
    setId: v.id("algorithmSets"),
  },
  handler: async (ctx, { userId, setId }) => {
    // Get all cases in the set
    const cases = await ctx.db
      .query("algorithmCases")
      .withIndex("by_set", (q) => q.eq("setId", setId))
      .collect();

    // Get user's progress for these cases
    const progressMap = new Map<
      Id<"algorithmCases">,
      Doc<"userAlgorithmProgress">
    >();

    for (const algorithmCase of cases) {
      const progress = await ctx.db
        .query("userAlgorithmProgress")
        .withIndex("by_user_case", (q) =>
          q.eq("userId", userId).eq("caseId", algorithmCase._id)
        )
        .first();

      if (progress) {
        progressMap.set(algorithmCase._id, progress);
      }
    }

    const learned = Array.from(progressMap.values()).filter(
      (p) => p.learningStage !== "new"
    ).length;

    const mastered = Array.from(progressMap.values()).filter(
      (p) => p.learningStage === "mastered"
    ).length;

    return {
      total: cases.length,
      learned,
      mastered,
      progressMap: Object.fromEntries(progressMap),
    };
  },
});

// Get user's progress for a specific case
export const getUserCaseProgress = query({
  args: {
    userId: v.id("users"),
    caseId: v.id("algorithmCases"),
  },
  handler: async (ctx, { userId, caseId }) => {
    const progress = await ctx.db
      .query("userAlgorithmProgress")
      .withIndex("by_user_case", (q) =>
        q.eq("userId", userId).eq("caseId", caseId)
      )
      .first();

    return progress || null;
  },
});

// Get all cases due for review
export const getDueReviews = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const now = Date.now();

    const allProgress = await ctx.db
      .query("userAlgorithmProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Filter for due reviews (excluding new and mastered)
    const dueReviews = allProgress.filter(
      (p) =>
        p.learningStage !== "new" &&
        p.learningStage !== "mastered" &&
        p.nextReviewDate <= now
    );

    // Get case details for each due review
    const reviewsWithCases = await Promise.all(
      dueReviews.map(async (progress) => {
        const algorithmCase = await ctx.db.get(progress.caseId);
        const set = algorithmCase
          ? await ctx.db.get(algorithmCase.setId)
          : null;
        const preferredAlg = await ctx.db.get(progress.preferredAlgId);
        return { progress, case: algorithmCase, set, algorithm: preferredAlg };
      })
    );

    return reviewsWithCases.filter((r) => r.case !== null);
  },
});

// Get all learned cases for free practice (not just due)
export const getAllLearnedCases = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const allProgress = await ctx.db
      .query("userAlgorithmProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Filter for all cases that are not "new" (i.e., user has started learning)
    const learnedCases = allProgress.filter((p) => p.learningStage !== "new");

    // Get case details for each learned case
    const casesWithDetails = await Promise.all(
      learnedCases.map(async (progress) => {
        const algorithmCase = await ctx.db.get(progress.caseId);
        const set = algorithmCase
          ? await ctx.db.get(algorithmCase.setId)
          : null;
        const preferredAlg = await ctx.db.get(progress.preferredAlgId);
        return { progress, case: algorithmCase, set, algorithm: preferredAlg };
      })
    );

    return casesWithDetails.filter((r) => r.case !== null);
  },
});

// Get user's overall statistics
export const getUserStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const allProgress = await ctx.db
      .query("userAlgorithmProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const stats = {
      totalLearned: allProgress.filter((p) => p.learningStage !== "new").length,
      mastered: allProgress.filter((p) => p.learningStage === "mastered")
        .length,
      learning: allProgress.filter((p) => p.learningStage === "learning")
        .length,
      reviewing: allProgress.filter((p) => p.learningStage === "reviewing")
        .length,
      dueToday: allProgress.filter(
        (p) =>
          p.learningStage !== "new" &&
          p.learningStage !== "mastered" &&
          p.nextReviewDate <= now
      ).length,
      reviewedToday: allProgress.filter((p) => p.lastReviewedAt >= oneDayAgo)
        .length,
    };

    return stats;
  },
});

// Get user's review history for heatmap
export const getUserReviewHistory = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const allProgress = await ctx.db
      .query("userAlgorithmProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Filter only cases that have been reviewed (not just new)
    const reviewed = allProgress.filter(
      (p) => p.learningStage !== "new" && p.reviewCount > 0
    );

    // Create review records from lastReviewedAt timestamps
    // Each progress record represents at least one review activity
    const reviewHistory = reviewed.map((progress) => ({
      _id: progress._id,
      userId: progress.userId,
      caseId: progress.caseId,
      rating: "good" as const, // Default for visualization
      wasCorrect: progress.accuracyRate >= 70,
      _creationTime: progress.lastReviewedAt,
    }));

    // Sort by creation time descending (most recent first)
    return reviewHistory.sort((a, b) => b._creationTime - a._creationTime);
  },
});

// ==================== MUTATIONS ====================

// Start learning a new algorithm case
export const startLearning = mutation({
  args: {
    userId: v.id("users"),
    caseId: v.id("algorithmCases"),
    preferredAlgId: v.id("algorithms"),
  },
  handler: async (ctx, { userId, caseId, preferredAlgId }) => {
    // Check if progress already exists
    const existing = await ctx.db
      .query("userAlgorithmProgress")
      .withIndex("by_user_case", (q) =>
        q.eq("userId", userId).eq("caseId", caseId)
      )
      .first();

    if (existing) {
      throw new Error("Already learning this case");
    }

    const now = Date.now();
    const oneDayLater = now + 24 * 60 * 60 * 1000;

    const progressId = await ctx.db.insert("userAlgorithmProgress", {
      userId,
      caseId,
      preferredAlgId,
      learningStage: "learning",
      easeFactor: 2.5,
      interval: 1,
      nextReviewDate: oneDayLater,
      reviewCount: 0,
      lapseCount: 0,
      recognitionTimes: [],
      executionTimes: [],
      accuracyRate: 0, // Start at 0% - no reviews done yet
      firstLearnedAt: now,
      lastReviewedAt: now,
      createdAt: now,
    });

    return progressId;
  },
});

// Update progress after a review
export const recordReview = mutation({
  args: {
    userId: v.id("users"),
    caseId: v.id("algorithmCases"),
    rating: v.union(
      v.literal("again"),
      v.literal("hard"),
      v.literal("good"),
      v.literal("easy")
    ),
    recognitionTime: v.optional(v.number()),
    executionTime: v.optional(v.number()),
    wasCorrect: v.boolean(),
  },
  handler: async (ctx, args) => {
    const {
      userId,
      caseId,
      rating,
      recognitionTime,
      executionTime,
      wasCorrect,
    } = args;

    const progress = await ctx.db
      .query("userAlgorithmProgress")
      .withIndex("by_user_case", (q) =>
        q.eq("userId", userId).eq("caseId", caseId)
      )
      .first();

    if (!progress) {
      throw new Error("Progress not found");
    }

    // Calculate new SRS values
    const srsResult = calculateSRS(
      {
        easeFactor: progress.easeFactor,
        interval: progress.interval,
        reviewCount: progress.reviewCount,
      },
      rating
    );

    // Update recognition times (keep last 10)
    const newRecognitionTimes = recognitionTime
      ? [...progress.recognitionTimes, recognitionTime].slice(-10)
      : progress.recognitionTimes;

    // Update execution times (keep last 10)
    const newExecutionTimes = executionTime
      ? [...progress.executionTimes, executionTime].slice(-10)
      : progress.executionTimes;

    // Calculate new accuracy rate
    const totalReviews = progress.reviewCount + 1;
    const correctReviews =
      Math.round((progress.accuracyRate / 100) * progress.reviewCount) +
      (wasCorrect ? 1 : 0);
    const newAccuracyRate = (correctReviews / totalReviews) * 100;

    // Determine new learning stage
    let newStage = progress.learningStage;
    if (
      rating === "easy" &&
      progress.reviewCount >= 5 &&
      newAccuracyRate >= 95
    ) {
      newStage = "mastered";
    } else if (
      progress.learningStage === "learning" &&
      progress.reviewCount >= 2
    ) {
      newStage = "reviewing";
    }

    const now = Date.now();
    const nextReviewDate = now + srsResult.interval * 24 * 60 * 60 * 1000;

    await ctx.db.patch(progress._id, {
      easeFactor: srsResult.easeFactor,
      interval: srsResult.interval,
      nextReviewDate,
      reviewCount: srsResult.reviewCount,
      lapseCount:
        rating === "again" ? progress.lapseCount + 1 : progress.lapseCount,
      recognitionTimes: newRecognitionTimes,
      executionTimes: newExecutionTimes,
      accuracyRate: newAccuracyRate,
      learningStage: newStage,
      lastReviewedAt: now,
      masteredAt:
        newStage === "mastered" && !progress.masteredAt
          ? now
          : progress.masteredAt,
    });

    return { newStage, nextReviewDate };
  },
});

// Change preferred algorithm
export const changePreferredAlgorithm = mutation({
  args: {
    userId: v.id("users"),
    caseId: v.id("algorithmCases"),
    newAlgId: v.id("algorithms"),
  },
  handler: async (ctx, { userId, caseId, newAlgId }) => {
    const progress = await ctx.db
      .query("userAlgorithmProgress")
      .withIndex("by_user_case", (q) =>
        q.eq("userId", userId).eq("caseId", caseId)
      )
      .first();

    if (!progress) {
      throw new Error("Progress not found");
    }

    await ctx.db.patch(progress._id, {
      preferredAlgId: newAlgId,
    });
  },
});

// Record a practice session
export const recordPracticeSession = mutation({
  args: {
    userId: v.id("users"),
    sessionType: v.union(
      v.literal("recognition"),
      v.literal("execution"),
      v.literal("mixed")
    ),
    casesReviewed: v.number(),
    averageRecognitionTime: v.optional(v.number()),
    averageExecutionTime: v.optional(v.number()),
    accuracyRate: v.number(),
    duration: v.number(),
  },
  handler: async (ctx, args) => {
    const sessionId = await ctx.db.insert("algorithmPracticeSessions", {
      ...args,
      createdAt: Date.now(),
    });

    return sessionId;
  },
});

// ==================== ADVANCED SRS ALGORITHM ====================
// Based on SM-2+ algorithm with improvements for algorithm learning
// Features:
// - Graduating intervals for new cards
// - Variable ease factor adjustments
// - Interval fuzzing for better distribution
// - Lapse handling with reduced intervals
// - Different intervals for hard/good/easy ratings

interface SRSCard {
  easeFactor: number;
  interval: number;
  reviewCount: number;
}

// SRS Configuration Constants
const SRS_CONFIG = {
  // Initial ease factor (2.5 is Anki default)
  INITIAL_EASE: 2.5,
  // Minimum ease factor
  MIN_EASE: 1.3,
  // Maximum ease factor
  MAX_EASE: 3.5,
  // Ease adjustments for each rating
  EASE_BONUS: {
    again: -0.2,
    hard: -0.15,
    good: 0,
    easy: 0.15,
  },
  // Learning steps for new cards (in days)
  LEARNING_STEPS: [1, 4], // Review after 1 day, then 4 days
  // Graduating interval (when card moves from learning to reviewing)
  GRADUATING_INTERVAL: 7,
  // Easy interval for new cards
  EASY_INTERVAL: 14,
  // Lapse relearning steps
  LAPSE_STEPS: [1, 3],
  // Interval multipliers for different ratings
  INTERVAL_MODIFIERS: {
    hard: 1.2, // Hard cards get a smaller interval increase
    good: 1.0, // Good uses the ease factor as-is
    easy: 1.3, // Easy cards get a bonus multiplier
  },
  // Fuzzing range (±10% of interval for better distribution)
  FUZZ_RANGE: 0.1,
};

/**
 * Advanced SRS calculation with support for:
 * - New card learning steps
 * - Graduating intervals
 * - Variable ease factors
 * - Interval fuzzing
 * - Lapse handling
 */
function calculateSRS(
  card: SRSCard,
  rating: "again" | "hard" | "good" | "easy"
): SRSCard {
  let { easeFactor, interval, reviewCount } = card;

  // Handle "Again" rating (lapse)
  if (rating === "again") {
    // Reset to lapse relearning steps
    const lapseStepIndex = 0;
    const newInterval = SRS_CONFIG.LAPSE_STEPS[lapseStepIndex] || 1;

    // Reduce ease factor more significantly for lapses
    const newEaseFactor = Math.max(
      SRS_CONFIG.MIN_EASE,
      easeFactor + SRS_CONFIG.EASE_BONUS.again
    );

    return {
      easeFactor: newEaseFactor,
      interval: newInterval,
      reviewCount: reviewCount + 1,
    };
  }

  // Adjust ease factor based on rating
  easeFactor = Math.max(
    SRS_CONFIG.MIN_EASE,
    Math.min(SRS_CONFIG.MAX_EASE, easeFactor + SRS_CONFIG.EASE_BONUS[rating])
  );

  // Calculate new interval based on review count and rating
  let newInterval: number;

  // New card (in learning phase)
  if (reviewCount === 0) {
    if (rating === "easy") {
      newInterval = SRS_CONFIG.EASY_INTERVAL;
    } else {
      newInterval = SRS_CONFIG.LEARNING_STEPS[0];
    }
  }
  // Second review (still in learning)
  else if (reviewCount === 1) {
    if (rating === "easy") {
      newInterval = SRS_CONFIG.EASY_INTERVAL;
    } else if (rating === "hard") {
      // Repeat the current learning step
      newInterval = SRS_CONFIG.LEARNING_STEPS[0];
    } else {
      // Move to next learning step
      newInterval =
        SRS_CONFIG.LEARNING_STEPS[1] || SRS_CONFIG.GRADUATING_INTERVAL;
    }
  }
  // Graduating review
  else if (reviewCount === 2) {
    if (rating === "easy") {
      newInterval = SRS_CONFIG.EASY_INTERVAL * easeFactor;
    } else if (rating === "hard") {
      newInterval = SRS_CONFIG.GRADUATING_INTERVAL * 0.8;
    } else {
      newInterval = SRS_CONFIG.GRADUATING_INTERVAL;
    }
  }
  // Review phase (mature cards)
  else {
    // Apply the ease factor with rating-specific modifiers
    const modifier = SRS_CONFIG.INTERVAL_MODIFIERS[rating];
    newInterval = interval * easeFactor * modifier;

    // Apply fuzzing to distribute reviews more evenly
    // Fuzzing is only applied to intervals > 7 days
    if (newInterval > 7) {
      const fuzzRange = newInterval * SRS_CONFIG.FUZZ_RANGE;
      const fuzzOffset = (Math.random() * 2 - 1) * fuzzRange;
      newInterval = newInterval + fuzzOffset;
    }
  }

  // Round the interval and ensure minimum of 1 day
  newInterval = Math.max(1, Math.round(newInterval));

  return {
    easeFactor,
    interval: newInterval,
    reviewCount: reviewCount + 1,
  };
}
