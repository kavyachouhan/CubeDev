import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Define current survey versions for each type. This allows us to track when we need to prompt users for new feedback based on version changes.
export const SURVEY_VERSIONS = {
  general: "2.0", // Bumped to 2.0 to include Coach feature
  coach: "1.0",
  cubie: "1.0",
} as const;

export const DEFAULT_SURVEY_TYPE = "general";

// Submit feedback response
export const submitFeedback = mutation({
  args: {
    userId: v.optional(v.id("users")),
    surveyType: v.optional(v.string()), // defaults to "general"
    surveyVersion: v.optional(v.string()), // defaults to current version
    uiuxRating: v.optional(v.number()),
    featureRatings: v.optional(v.any()), // Flexible feature ratings
    mostUsefulFeature: v.optional(v.string()),
    featureRequests: v.optional(v.string()),
    recommendScore: v.optional(v.number()),
    additionalComments: v.optional(v.string()),
    customResponses: v.optional(v.any()), // For custom survey questions
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Basic validation
    if (
      args.uiuxRating !== undefined &&
      (args.uiuxRating < 1 || args.uiuxRating > 5)
    ) {
      throw new Error("UI/UX rating must be between 1 and 5");
    }

    if (
      args.recommendScore !== undefined &&
      (args.recommendScore < 1 || args.recommendScore > 10)
    ) {
      throw new Error("Recommend score must be between 1 and 10");
    }

    // Validate feature ratings if provided
    if (args.featureRatings && typeof args.featureRatings === "object") {
      const featureValues = Object.values(args.featureRatings) as number[];
      for (const value of featureValues) {
        if (typeof value === "number" && (value < 1 || value > 5)) {
          throw new Error("Feature ratings must be between 1 and 5");
        }
      }
    }

    // Get current version for the survey type
    const surveyType = args.surveyType || DEFAULT_SURVEY_TYPE;
    const currentVersion =
      SURVEY_VERSIONS[surveyType as keyof typeof SURVEY_VERSIONS] || "1.0";

    // Create the feedback response
    const feedbackId = await ctx.db.insert("feedbackResponses", {
      userId: args.userId,
      surveyType: surveyType,
      surveyVersion: args.surveyVersion || currentVersion,
      uiuxRating: args.uiuxRating,
      featureRatings: args.featureRatings,
      mostUsefulFeature: args.mostUsefulFeature?.trim(),
      featureRequests: args.featureRequests?.trim(),
      recommendScore: args.recommendScore,
      additionalComments: args.additionalComments?.trim(),
      customResponses: args.customResponses,
      createdAt: Date.now(),
      userAgent: args.userAgent,
    });

    return { feedbackId };
  },
});

// Check if user has submitted feedback recently (e.g. in the last 30 days) for a specific survey type
export const hasRecentFeedback = query({
  args: {
    userId: v.optional(v.id("users")),
    surveyType: v.optional(v.string()), // Check for specific survey type
    daysAgo: v.optional(v.number()), // Default 30 days
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      return false;
    }

    const daysAgo = args.daysAgo || 30;
    const cutoffTime = Date.now() - daysAgo * 24 * 60 * 60 * 1000;

    let query = ctx.db
      .query("feedbackResponses")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gte(q.field("createdAt"), cutoffTime));

    // Filter by survey type if specified
    if (args.surveyType) {
      query = query.filter((q) => q.eq(q.field("surveyType"), args.surveyType));
    }

    const recentFeedback = await query.first();
    return !!recentFeedback;
  },
});

// Check if user needs to see a survey for a new version
// This is useful when adding new features to an existing survey
export const needsSurveyForVersion = query({
  args: {
    userId: v.optional(v.id("users")),
    surveyType: v.string(),
    currentVersion: v.string(), // The current version of the survey
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      return false;
    }

    // Get the user's most recent submission for this survey type
    const lastSubmission = await ctx.db
      .query("feedbackResponses")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("surveyType"), args.surveyType))
      .order("desc")
      .first();

    // If no submission, they need to see it
    if (!lastSubmission) {
      return true;
    }

    // Compare versions
    const parseVersion = (v: string) => v.split(".").map(Number);
    const current = parseVersion(args.currentVersion);
    const last = parseVersion(lastSubmission.surveyVersion || "1.0");

    // Check if current version is higher than last submitted version
    if (current[0] > last[0]) return true;
    if (current[0] === last[0] && (current[1] || 0) > (last[1] || 0))
      return true;

    return false;
  },
});

// Get the last submitted version for a user and survey type
export const getLastSubmittedVersion = query({
  args: {
    userId: v.optional(v.id("users")),
    surveyType: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      return null;
    }

    const lastSubmission = await ctx.db
      .query("feedbackResponses")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("surveyType"), args.surveyType))
      .order("desc")
      .first();

    return lastSubmission?.surveyVersion || null;
  },
});

// Get all feedback responses (admin) with filtering options
export const getAllFeedback = query({
  args: {
    limit: v.optional(v.number()),
    surveyType: v.optional(v.string()),
    surveyVersion: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("feedbackResponses")
      .withIndex("by_created")
      .order("desc");

    let responses = await query.collect();

    // Filter by survey type if specified
    if (args.surveyType) {
      responses = responses.filter((r) => r.surveyType === args.surveyType);
    }

    // Filter by survey version if specified
    if (args.surveyVersion) {
      responses = responses.filter(
        (r) => r.surveyVersion === args.surveyVersion,
      );
    }

    if (args.limit) {
      return responses.slice(0, args.limit);
    }

    return responses;
  },
});

// Get feedback statistics (admin) with filtering options
export const getFeedbackStats = query({
  args: {
    surveyType: v.optional(v.string()),
    surveyVersion: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let responses = await ctx.db.query("feedbackResponses").collect();

    // Filter by survey type if specified
    if (args.surveyType) {
      responses = responses.filter((r) => r.surveyType === args.surveyType);
    }

    // Filter by survey version if specified
    if (args.surveyVersion) {
      responses = responses.filter(
        (r) => r.surveyVersion === args.surveyVersion,
      );
    }

    if (responses.length === 0) {
      return {
        totalResponses: 0,
        averageUiuxRating: 0,
        averageRecommendScore: 0,
        npsScore: 0,
        featureAverages: {},
      };
    }

    const totalResponses = responses.length;

    // Calculate UI/UX average (only from responses that have it)
    const uiuxResponses = responses.filter((r) => r.uiuxRating !== undefined);
    const avgUiux =
      uiuxResponses.length > 0
        ? uiuxResponses.reduce((sum, r) => sum + (r.uiuxRating || 0), 0) /
          uiuxResponses.length
        : 0;

    // Calculate recommend score average (only from responses that have it)
    const recommendResponses = responses.filter(
      (r) => r.recommendScore !== undefined,
    );
    const avgRecommend =
      recommendResponses.length > 0
        ? recommendResponses.reduce(
            (sum, r) => sum + (r.recommendScore || 0),
            0,
          ) / recommendResponses.length
        : 0;

    // Calculate NPS score
    const promoters = recommendResponses.filter(
      (r) => (r.recommendScore || 0) >= 9,
    ).length;
    const detractors = recommendResponses.filter(
      (r) => (r.recommendScore || 0) <= 6,
    ).length;
    const npsScore =
      recommendResponses.length > 0
        ? Math.round(
            ((promoters - detractors) / recommendResponses.length) * 100,
          )
        : 0;

    // Calculate feature averages dynamically
    const featureAverages: Record<string, number> = {};
    const featureResponses = responses.filter(
      (r) => r.featureRatings && typeof r.featureRatings === "object",
    );

    if (featureResponses.length > 0) {
      // Collect all unique feature keys
      const allFeatureKeys = new Set<string>();
      featureResponses.forEach((r) => {
        if (r.featureRatings) {
          Object.keys(r.featureRatings).forEach((key) =>
            allFeatureKeys.add(key),
          );
        }
      });

      // Calculate average for each feature
      allFeatureKeys.forEach((key) => {
        const validResponses = featureResponses.filter(
          (r) => r.featureRatings && typeof r.featureRatings[key] === "number",
        );
        if (validResponses.length > 0) {
          const sum = validResponses.reduce(
            (acc, r) => acc + (r.featureRatings[key] || 0),
            0,
          );
          featureAverages[key] =
            Math.round((sum / validResponses.length) * 10) / 10;
        }
      });
    }

    return {
      totalResponses,
      averageUiuxRating: Math.round(avgUiux * 10) / 10,
      averageRecommendScore: Math.round(avgRecommend * 10) / 10,
      npsScore,
      featureAverages,
    };
  },
});

// Get detailed feedback analytics for admin dashboard
export const getDetailedFeedbackStats = query({
  args: {
    surveyType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;
    const threeMonthsAgo = now - 90 * 24 * 60 * 60 * 1000;

    let responses = await ctx.db.query("feedbackResponses").collect();

    // Filter by survey type if specified
    if (args.surveyType) {
      responses = responses.filter((r) => r.surveyType === args.surveyType);
    }

    if (responses.length === 0) {
      return {
        totalResponses: 0,
        responsesThisWeek: 0,
        responsesThisMonth: 0,
        responseRate: { weekly: 0, monthly: 0 },
        uiuxRatingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        recommendScoreDistribution: {},
        npsBreakdown: { promoters: 0, passives: 0, detractors: 0 },
        surveyTypeBreakdown: {},
        surveyVersionBreakdown: {},
        weeklyTrend: [],
        mostUsefulFeatures: [],
        commonFeatureRequests: [],
        responsesWithComments: 0,
        avgResponsesPerUser: 0,
      };
    }

    // Response counts
    const responsesThisWeek = responses.filter(
      (r) => r.createdAt >= oneWeekAgo,
    ).length;
    const responsesThisMonth = responses.filter(
      (r) => r.createdAt >= oneMonthAgo,
    ).length;
    const responsesLastWeek = responses.filter(
      (r) =>
        r.createdAt >= oneWeekAgo - 7 * 24 * 60 * 60 * 1000 &&
        r.createdAt < oneWeekAgo,
    ).length;
    const responsesLastMonth = responses.filter(
      (r) =>
        r.createdAt >= oneMonthAgo - 30 * 24 * 60 * 60 * 1000 &&
        r.createdAt < oneMonthAgo,
    ).length;

    // UI/UX rating distribution
    const uiuxRatingDistribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    responses.forEach((r) => {
      if (
        r.uiuxRating !== undefined &&
        r.uiuxRating >= 1 &&
        r.uiuxRating <= 5
      ) {
        uiuxRatingDistribution[r.uiuxRating] =
          (uiuxRatingDistribution[r.uiuxRating] || 0) + 1;
      }
    });

    // Recommend score distribution (1-10)
    const recommendScoreDistribution: Record<number, number> = {};
    for (let i = 1; i <= 10; i++) {
      recommendScoreDistribution[i] = 0;
    }
    responses.forEach((r) => {
      if (
        r.recommendScore !== undefined &&
        r.recommendScore >= 1 &&
        r.recommendScore <= 10
      ) {
        recommendScoreDistribution[r.recommendScore] =
          (recommendScoreDistribution[r.recommendScore] || 0) + 1;
      }
    });

    // NPS breakdown
    const recommendResponses = responses.filter(
      (r) => r.recommendScore !== undefined,
    );
    const promoters = recommendResponses.filter(
      (r) => (r.recommendScore || 0) >= 9,
    ).length;
    const passives = recommendResponses.filter(
      (r) => (r.recommendScore || 0) >= 7 && (r.recommendScore || 0) <= 8,
    ).length;
    const detractors = recommendResponses.filter(
      (r) => (r.recommendScore || 0) <= 6,
    ).length;

    // Survey type breakdown
    const surveyTypeBreakdown: Record<string, number> = {};
    responses.forEach((r) => {
      const type = r.surveyType || "general";
      surveyTypeBreakdown[type] = (surveyTypeBreakdown[type] || 0) + 1;
    });

    // Survey version breakdown
    const surveyVersionBreakdown: Record<string, number> = {};
    responses.forEach((r) => {
      const version = r.surveyVersion || "1.0";
      surveyVersionBreakdown[version] =
        (surveyVersionBreakdown[version] || 0) + 1;
    });

    // Weekly trend - last 12 weeks
    const weeklyTrend: Array<{
      week: string;
      count: number;
      avgRating: number;
    }> = [];
    for (let i = 11; i >= 0; i--) {
      const weekStart = now - (i + 1) * 7 * 24 * 60 * 60 * 1000;
      const weekEnd = now - i * 7 * 24 * 60 * 60 * 1000;
      const weekResponses = responses.filter(
        (r) => r.createdAt >= weekStart && r.createdAt < weekEnd,
      );
      const avgRating =
        weekResponses.length > 0
          ? weekResponses.reduce((sum, r) => sum + (r.uiuxRating || 0), 0) /
            weekResponses.length
          : 0;
      const date = new Date(weekEnd);
      weeklyTrend.push({
        week: `${date.getMonth() + 1}/${date.getDate()}`,
        count: weekResponses.length,
        avgRating: Math.round(avgRating * 10) / 10,
      });
    }

    // Most useful features mentioned
    const featureCounts: Record<string, number> = {};
    responses.forEach((r) => {
      if (r.mostUsefulFeature) {
        const feature = r.mostUsefulFeature.toLowerCase().trim();
        featureCounts[feature] = (featureCounts[feature] || 0) + 1;
      }
    });
    const mostUsefulFeatures = Object.entries(featureCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([feature, count]) => ({ feature, count }));

    // Common feature requests (word frequency)
    const requestWords: Record<string, number> = {};
    responses.forEach((r) => {
      if (r.featureRequests) {
        const words = r.featureRequests
          .toLowerCase()
          .split(/\s+/)
          .filter((w) => w.length > 4);
        words.forEach((word) => {
          requestWords[word] = (requestWords[word] || 0) + 1;
        });
      }
    });
    const commonFeatureRequests = Object.entries(requestWords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word, count]) => ({ word, count }));

    // Responses with comments
    const responsesWithComments = responses.filter(
      (r) => r.additionalComments || r.featureRequests,
    ).length;

    // Average responses per user (for logged-in users)
    const userResponseCounts: Record<string, number> = {};
    responses.forEach((r) => {
      if (r.userId) {
        userResponseCounts[r.userId] = (userResponseCounts[r.userId] || 0) + 1;
      }
    });
    const uniqueUsers = Object.keys(userResponseCounts).length;
    const avgResponsesPerUser =
      uniqueUsers > 0
        ? Math.round(
            (responses.filter((r) => r.userId).length / uniqueUsers) * 10,
          ) / 10
        : 0;

    // Logged in vs anonymous responses
    const loggedInResponses = responses.filter((r) => r.userId).length;
    const anonymousResponses = responses.filter((r) => !r.userId).length;

    return {
      totalResponses: responses.length,
      responsesThisWeek,
      responsesThisMonth,
      responseRate: {
        weekly:
          responsesLastWeek > 0
            ? Math.round(
                ((responsesThisWeek - responsesLastWeek) / responsesLastWeek) *
                  100,
              )
            : responsesThisWeek > 0
              ? 100
              : 0,
        monthly:
          responsesLastMonth > 0
            ? Math.round(
                ((responsesThisMonth - responsesLastMonth) /
                  responsesLastMonth) *
                  100,
              )
            : responsesThisMonth > 0
              ? 100
              : 0,
      },
      uiuxRatingDistribution,
      recommendScoreDistribution,
      npsBreakdown: { promoters, passives, detractors },
      surveyTypeBreakdown,
      surveyVersionBreakdown,
      weeklyTrend,
      mostUsefulFeatures,
      commonFeatureRequests,
      responsesWithComments,
      avgResponsesPerUser,
      loggedInResponses,
      anonymousResponses,
    };
  },
});

// Get list of all survey types that have been used
export const getSurveyTypes = query({
  args: {},
  handler: async (ctx) => {
    const responses = await ctx.db.query("feedbackResponses").collect();
    const types = new Set<string>();
    responses.forEach((r) => {
      if (r.surveyType) {
        types.add(r.surveyType);
      }
    });
    return Array.from(types);
  },
});
