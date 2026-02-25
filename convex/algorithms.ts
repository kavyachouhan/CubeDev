import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Algorithm SRS calculation function
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
      // Fallback: try to find by set name if slug doesn't exist
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

// Get reviews for notifications (includes both due and upcoming within 24h)
export const getReviewsForNotifications = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const now = Date.now();
    const oneDayFromNow = now + 24 * 60 * 60 * 1000;

    // Get user's dismissed notifications
    const user = await ctx.db.get(userId);
    const dismissedNotifications = user?.dismissedNotifications || [];
    const dismissedProgressIds = new Set(
      dismissedNotifications.map((d) => d.progressId)
    );

    const allProgress = await ctx.db
      .query("userAlgorithmProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Filter for reviews that are due or within the next 24 hours
    const relevantReviews = allProgress.filter(
      (p) =>
        p.learningStage !== "new" &&
        p.learningStage !== "mastered" &&
        p.nextReviewDate <= oneDayFromNow &&
        !dismissedProgressIds.has(p._id) // Filter out dismissed notifications
    );

    // Get case details for each review
    const reviewsWithCases = await Promise.all(
      relevantReviews.map(async (progress) => {
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

    // Filter to learned cases
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

// Get random cases for practice session
export const getRandomPracticeCases = query({
  args: {
    userId: v.id("users"),
    count: v.optional(v.number()),
    setId: v.optional(v.id("algorithmSets")),
    difficulty: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      )
    ),
  },
  handler: async (ctx, { userId, count = 10, setId, difficulty }) => {
    // Get user's progress for all cases
    const allProgress = await ctx.db
      .query("userAlgorithmProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Get all cases or filter by set
    let allCases = setId
      ? await ctx.db
          .query("algorithmCases")
          .withIndex("by_set", (q) => q.eq("setId", setId))
          .collect()
      : await ctx.db.query("algorithmCases").collect();

    // Filter by difficulty if specified
    if (difficulty) {
      const sets = await ctx.db.query("algorithmSets").collect();
      const setsByDifficulty = sets
        .filter((s) => s.difficulty === difficulty)
        .map((s) => s._id);
      allCases = allCases.filter((c) => setsByDifficulty.includes(c.setId));
    }

    // Filter to only learned cases
    const learnedCaseIds = new Set(
      allProgress.filter((p) => p.learningStage !== "new").map((p) => p.caseId)
    );
    const learnedCases = allCases.filter((c) => learnedCaseIds.has(c._id));

    // If no learned cases, return empty
    if (learnedCases.length === 0) {
      return [];
    }

    // Create progress map for weighting
    const progressMap = new Map(allProgress.map((p) => [p.caseId, p]));
    const now = Date.now();

    // Weight cases based on performance, recency, and mastery degradation
    const weightedCases = learnedCases.map((algorithmCase) => {
      const progress = progressMap.get(algorithmCase._id);
      if (!progress) {
        return { case: algorithmCase, weight: 1 };
      }

      let weight = 1;

      // 1. Lower accuracy = higher weight
      const accuracyFactor = Math.max(0.1, 1 - progress.accuracyRate / 100);
      weight *= 1 + accuracyFactor;

      // 2. Slower recognition = higher weight
      if (progress.recognitionTimes.length > 0) {
        const avgRecognition =
          progress.recognitionTimes.reduce((a, b) => a + b, 0) /
          progress.recognitionTimes.length;
        // Normalize to 0-1 scale (assuming 10s is very slow)
        const timeFactor = Math.min(1, avgRecognition / 10000);
        weight *= 1 + timeFactor;
      }

      // 3. More lapses = higher weight
      if (progress.lapseCount > 0) {
        weight *= 1 + progress.lapseCount * 0.2;
      }

      // 4. Newer cases (fewer reviews) get slight boost
      if (progress.reviewCount < 5) {
        weight *= 1.3;
      }

      // 5. RECENCY WEIGHTING: Cases not practiced recently get boosted
      // Calculate days since last review
      const daysSinceReview =
        (now - progress.lastReviewedAt) / (1000 * 60 * 60 * 24);
      if (daysSinceReview > 7) {
        // Boost cases not practiced in over a week (up to 2x boost at 30+ days)
        const recencyBoost = Math.min(2, 1 + (daysSinceReview - 7) / 23);
        weight *= recencyBoost;
      }

      // 6. MASTERY DEGRADATION: Mastered cases re-enter rotation after long periods
      // This helps prevent skill decay on "mastered" algorithms
      if (progress.learningStage === "mastered" && progress.masteredAt) {
        const daysSinceMastery =
          (now - progress.masteredAt) / (1000 * 60 * 60 * 24);
        // After 30 days of mastery, start adding weight to bring them back
        if (daysSinceMastery > 30) {
          // Gradual increase: 0.5x at 30 days, up to 1.5x at 90+ days
          const masteryDecay = Math.min(
            1.5,
            0.5 + (daysSinceMastery - 30) / 60
          );
          weight *= masteryDecay;
        } else {
          // Recently mastered cases get lower weight to focus on learning cases
          weight *= 0.3;
        }
      }

      return { case: algorithmCase, progress, weight };
    });

    // Weighted random selection
    const selectedCases: typeof weightedCases = [];
    const casesToSelect = Math.min(count, weightedCases.length);

    for (let i = 0; i < casesToSelect; i++) {
      const totalWeight = weightedCases.reduce((sum, c) => sum + c.weight, 0);
      let random = Math.random() * totalWeight;

      let selectedIndex = 0;
      for (let j = 0; j < weightedCases.length; j++) {
        random -= weightedCases[j].weight;
        if (random <= 0) {
          selectedIndex = j;
          break;
        }
      }

      selectedCases.push(weightedCases[selectedIndex]);
      weightedCases.splice(selectedIndex, 1);
    }

    // Get full details for selected cases
    const casesWithDetails = await Promise.all(
      selectedCases.map(async ({ case: algorithmCase, progress }) => {
        const set = await ctx.db.get(algorithmCase.setId);
        const preferredAlg = progress
          ? await ctx.db.get(progress.preferredAlgId)
          : await ctx.db
              .query("algorithms")
              .withIndex("by_case_default", (q) =>
                q.eq("caseId", algorithmCase._id).eq("isDefault", true)
              )
              .first();

        return {
          progress: progress || null,
          case: algorithmCase,
          set,
          algorithm: preferredAlg,
        };
      })
    );

    return casesWithDetails;
  },
});

// Get a single case for practice by slug
export const getCaseForPractice = query({
  args: {
    userId: v.id("users"),
    caseSlug: v.string(),
  },
  handler: async (ctx, { userId, caseSlug }) => {
    // Get the case by slug
    const algorithmCase = await ctx.db
      .query("algorithmCases")
      .withIndex("by_slug", (q) => q.eq("slug", caseSlug))
      .first();

    if (!algorithmCase) {
      return [];
    }

    // Get user progress for this case
    const progress = await ctx.db
      .query("userAlgorithmProgress")
      .withIndex("by_user_case", (q) =>
        q.eq("userId", userId).eq("caseId", algorithmCase._id)
      )
      .first();

    // Get set and preferred algorithm
    const set = await ctx.db.get(algorithmCase.setId);
    const preferredAlg = progress?.preferredAlgId
      ? await ctx.db.get(progress.preferredAlgId)
      : null;

    return [
      {
        progress: progress || null,
        case: algorithmCase,
        set,
        algorithm: preferredAlg,
      },
    ];
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

    // Filter to reviewed cases
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

// Get recognition metrics for analytics
export const getRecognitionMetrics = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const allProgress = await ctx.db
      .query("userAlgorithmProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Filter to learned cases
    const learnedCases = allProgress.filter((p) => p.learningStage !== "new");

    if (learnedCases.length === 0) {
      return {
        totalCases: 0,
        mastered: 0,
        averageRecognitionTime: 0,
        averageExecutionTime: 0,
        fastestRecognition: 0,
        slowestRecognition: 0,
        accuracyRate: 0,
        improvementRate: 0,
      };
    }

    // Calculate metrics
    let totalRecognitionTime = 0;
    let totalExecutionTime = 0;
    let recognitionCount = 0;
    let executionCount = 0;
    let fastestRecognition = Infinity;
    let slowestRecognition = 0;
    let totalAccuracy = 0;

    for (const progress of learnedCases) {
      // Recognition times
      if (progress.recognitionTimes.length > 0) {
        const avgRecognition =
          progress.recognitionTimes.reduce((a, b) => a + b, 0) /
          progress.recognitionTimes.length;
        totalRecognitionTime += avgRecognition;
        recognitionCount++;

        const fastest = Math.min(...progress.recognitionTimes);
        const slowest = Math.max(...progress.recognitionTimes);
        fastestRecognition = Math.min(fastestRecognition, fastest);
        slowestRecognition = Math.max(slowestRecognition, slowest);
      }

      // Execution times
      if (progress.executionTimes.length > 0) {
        const avgExecution =
          progress.executionTimes.reduce((a, b) => a + b, 0) /
          progress.executionTimes.length;
        totalExecutionTime += avgExecution;
        executionCount++;
      }

      // Accuracy
      totalAccuracy += progress.accuracyRate;
    }

    const mastered = learnedCases.filter(
      (p) => p.learningStage === "mastered"
    ).length;

    return {
      totalCases: learnedCases.length,
      mastered,
      averageRecognitionTime:
        recognitionCount > 0 ? totalRecognitionTime / recognitionCount : 0,
      averageExecutionTime:
        executionCount > 0 ? totalExecutionTime / executionCount : 0,
      fastestRecognition:
        fastestRecognition === Infinity ? 0 : fastestRecognition,
      slowestRecognition,
      accuracyRate: totalAccuracy / learnedCases.length,
      improvementRate: 0, // Calculated on frontend from session history
    };
  },
});

// Get recent practice sessions
export const getRecentSessions = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 10 }) => {
    const sessions = await ctx.db
      .query("algorithmPracticeSessions")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    return sessions;
  },
});

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
      accuracyRate: 0, // Initial accuracy
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
    const intervalBasedMastery = srsResult.interval >= 21;
    const easyMastery =
      rating === "easy" && progress.reviewCount >= 5 && newAccuracyRate >= 95;
    const goodMastery =
      rating === "good" && progress.reviewCount >= 8 && newAccuracyRate >= 90;

    if (intervalBasedMastery || easyMastery || goodMastery) {
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
      v.literal("drill"),
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

// Advanced SRS Algorithm Implementation
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

// Calculate new SRS values based on user rating
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

  // First review (new card)
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

    // Apply fuzzing for intervals greater than 7 days
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

// Get user's custom algorithm sets
export const getUserCustomSets = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const sets = await ctx.db
      .query("customAlgorithmSets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return sets.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Get a specific custom set by ID
export const getCustomSetById = query({
  args: { setId: v.id("customAlgorithmSets") },
  handler: async (ctx, { setId }) => {
    return await ctx.db.get(setId);
  },
});

// Get all cases for custom set selection (with set names)
export const getAllCasesForCustomSets = query({
  args: {},
  handler: async (ctx) => {
    const cases = await ctx.db.query("algorithmCases").collect();
    const sets = await ctx.db.query("algorithmSets").collect();

    const setMap = new Map(sets.map((s) => [s._id, s.name]));

    return cases.map((c) => ({
      ...c,
      setName: setMap.get(c.setId) || "Unknown",
    }));
  },
});

// Get all case names for blind recognition mode
export const getAllCaseNames = query({
  args: {},
  handler: async (ctx) => {
    const cases = await ctx.db.query("algorithmCases").collect();
    return cases.map((c) => c.caseName);
  },
});

// Create a new custom set
export const createCustomSet = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    caseIds: v.array(v.id("algorithmCases")),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const setId = await ctx.db.insert("customAlgorithmSets", {
      userId: args.userId,
      name: args.name,
      description: args.description,
      caseIds: args.caseIds,
      isPublic: args.isPublic,
      createdAt: now,
      updatedAt: now,
    });
    return setId;
  },
});

// Update a custom set
export const updateCustomSet = mutation({
  args: {
    setId: v.id("customAlgorithmSets"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { setId, name, description }) => {
    const updates: any = { updatedAt: Date.now() };
    if (name !== undefined) updates.name = name;
    // Allow clearing description by passing empty string
    if (description !== undefined) updates.description = description || undefined;

    await ctx.db.patch(setId, updates);
  },
});

// Delete a custom set
export const deleteCustomSet = mutation({
  args: { setId: v.id("customAlgorithmSets") },
  handler: async (ctx, { setId }) => {
    await ctx.db.delete(setId);
  },
});

// Add a case to a custom set
export const addCaseToCustomSet = mutation({
  args: {
    setId: v.id("customAlgorithmSets"),
    caseId: v.id("algorithmCases"),
  },
  handler: async (ctx, { setId, caseId }) => {
    const set = await ctx.db.get(setId);
    if (!set) throw new Error("Custom set not found");

    if (!set.caseIds.includes(caseId)) {
      await ctx.db.patch(setId, {
        caseIds: [...set.caseIds, caseId],
        updatedAt: Date.now(),
      });
    }
  },
});

// Remove a case from a custom set
export const removeCaseFromCustomSet = mutation({
  args: {
    setId: v.id("customAlgorithmSets"),
    caseId: v.id("algorithmCases"),
  },
  handler: async (ctx, { setId, caseId }) => {
    const set = await ctx.db.get(setId);
    if (!set) throw new Error("Custom set not found");

    await ctx.db.patch(setId, {
      caseIds: set.caseIds.filter((id) => id !== caseId),
      updatedAt: Date.now(),
    });
  },
});

// Toggle custom set visibility (public/private)
export const toggleCustomSetVisibility = mutation({
  args: { setId: v.id("customAlgorithmSets") },
  handler: async (ctx, { setId }) => {
    const set = await ctx.db.get(setId);
    if (!set) throw new Error("Custom set not found");

    await ctx.db.patch(setId, {
      isPublic: !set.isPublic,
      updatedAt: Date.now(),
    });
  },
});

// Import a custom set from JSON data
export const importCustomSet = mutation({
  args: {
    userId: v.id("users"),
    data: v.object({
      name: v.string(),
      description: v.optional(v.string()),
      caseIds: v.array(v.string()),
    }),
  },
  handler: async (ctx, { userId, data }) => {
    const now = Date.now();

    // Validate case IDs exist
    const validCaseIds: any[] = [];
    for (const caseIdStr of data.caseIds) {
      try {
        const caseDoc = await ctx.db.get(caseIdStr as any);
        if (caseDoc) {
          validCaseIds.push(caseIdStr);
        }
      } catch {
        // Skip invalid IDs
      }
    }

    const setId = await ctx.db.insert("customAlgorithmSets", {
      userId,
      name: data.name + " (Imported)",
      description: data.description,
      caseIds: validCaseIds,
      isPublic: false,
      createdAt: now,
      updatedAt: now,
    });

    return setId;
  },
});

// Get cases from a custom set for practice
export const getCustomSetCasesForPractice = query({
  args: {
    userId: v.id("users"),
    setId: v.id("customAlgorithmSets"),
  },
  handler: async (ctx, { userId, setId }) => {
    const customSet = await ctx.db.get(setId);
    if (!customSet) return [];

    const casesWithDetails = await Promise.all(
      customSet.caseIds.map(async (caseId) => {
        const algorithmCase = await ctx.db.get(caseId);
        if (!algorithmCase) return null;

        const set = await ctx.db.get(algorithmCase.setId);

        const progress = await ctx.db
          .query("userAlgorithmProgress")
          .withIndex("by_user_case", (q) =>
            q.eq("userId", userId).eq("caseId", caseId)
          )
          .first();

        const preferredAlg = progress?.preferredAlgId
          ? await ctx.db.get(progress.preferredAlgId)
          : await ctx.db
              .query("algorithms")
              .withIndex("by_case_default", (q) =>
                q.eq("caseId", caseId).eq("isDefault", true)
              )
              .first();

        return {
          progress: progress || null,
          case: algorithmCase,
          set,
          algorithm: preferredAlg,
        };
      })
    );

    return casesWithDetails.filter((c) => c !== null);
  },
});

// Add a custom (user-created) algorithm to a custom set
export const addCustomAlgorithmToSet = mutation({
  args: {
    setId: v.id("customAlgorithmSets"),
    name: v.string(),
    notation: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { setId, name, notation, notes }) => {
    const set = await ctx.db.get(setId);
    if (!set) throw new Error("Custom set not found");

    const newAlg = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      notation,
      notes,
      createdAt: Date.now(),
    };

    const existing = set.customAlgorithms || [];
    await ctx.db.patch(setId, {
      customAlgorithms: [...existing, newAlg],
      updatedAt: Date.now(),
    });

    return newAlg.id;
  },
});

// Update a custom algorithm in a custom set
export const updateCustomAlgorithmInSet = mutation({
  args: {
    setId: v.id("customAlgorithmSets"),
    algorithmId: v.string(),
    name: v.optional(v.string()),
    notation: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { setId, algorithmId, name, notation, notes }) => {
    const set = await ctx.db.get(setId);
    if (!set) throw new Error("Custom set not found");

    const algList = set.customAlgorithms || [];
    const algExists = algList.some((alg) => alg.id === algorithmId);
    if (!algExists) throw new Error("Algorithm not found in set");

    const updated = algList.map((alg) => {
      if (alg.id === algorithmId) {
        return {
          ...alg,
          ...(name !== undefined && { name }),
          ...(notation !== undefined && { notation }),
          // Always update notes when provided (empty string clears notes)
          ...(notes !== undefined && { notes: notes || undefined }),
        };
      }
      return alg;
    });

    await ctx.db.patch(setId, {
      customAlgorithms: updated,
      updatedAt: Date.now(),
    });
  },
});

// Remove a custom algorithm from a custom set
export const removeCustomAlgorithmFromSet = mutation({
  args: {
    setId: v.id("customAlgorithmSets"),
    algorithmId: v.string(),
  },
  handler: async (ctx, { setId, algorithmId }) => {
    const set = await ctx.db.get(setId);
    if (!set) throw new Error("Custom set not found");

    const algList = set.customAlgorithms || [];
    await ctx.db.patch(setId, {
      customAlgorithms: algList.filter((alg) => alg.id !== algorithmId),
      updatedAt: Date.now(),
    });
  },
});

// Get full details of a custom set with all algorithm data resolved
export const getCustomSetWithDetails = query({
  args: { setId: v.id("customAlgorithmSets") },
  handler: async (ctx, { setId }) => {
    const customSet = await ctx.db.get(setId);
    if (!customSet) return null;

    // Resolve predefined cases with their algorithms
    const predefinedCases = await Promise.all(
      customSet.caseIds.map(async (caseId) => {
        const algorithmCase = await ctx.db.get(caseId);
        if (!algorithmCase) return null;

        const set = await ctx.db.get(algorithmCase.setId);

        // Get the default algorithm for this case
        const defaultAlg = await ctx.db
          .query("algorithms")
          .withIndex("by_case_default", (q) =>
            q.eq("caseId", caseId).eq("isDefault", true)
          )
          .first();

        // Get all algorithms for this case
        const allAlgs = await ctx.db
          .query("algorithms")
          .withIndex("by_case", (q) => q.eq("caseId", caseId))
          .collect();

        return {
          type: "predefined" as const,
          caseId: algorithmCase._id,
          caseName: algorithmCase.caseName,
          setName: set?.name || "Unknown",
          setupMoves: algorithmCase.setupMoves,
          defaultAlgorithm: defaultAlg?.notation || "",
          algorithmCount: allAlgs.length,
          difficulty: algorithmCase.difficulty,
        };
      })
    );

    return {
      ...customSet,
      predefinedCases: predefinedCases.filter((c) => c !== null),
      customAlgorithms: customSet.customAlgorithms || [],
    };
  },
});