import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Constants for survey versions and types
export const CURRENT_SURVEY_VERSION = "1.0";
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
    // Validate ratings are within expected ranges if provided
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

    // Create the feedback response
    const feedbackId = await ctx.db.insert("feedbackResponses", {
      userId: args.userId,
      surveyType: args.surveyType || DEFAULT_SURVEY_TYPE,
      surveyVersion: args.surveyVersion || CURRENT_SURVEY_VERSION,
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

// Check if user has already submitted feedback recently (within specified days)
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
        (r) => r.surveyVersion === args.surveyVersion
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
        (r) => r.surveyVersion === args.surveyVersion
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
      (r) => r.recommendScore !== undefined
    );
    const avgRecommend =
      recommendResponses.length > 0
        ? recommendResponses.reduce(
            (sum, r) => sum + (r.recommendScore || 0),
            0
          ) / recommendResponses.length
        : 0;

    // Calculate NPS score
    const promoters = recommendResponses.filter(
      (r) => (r.recommendScore || 0) >= 9
    ).length;
    const detractors = recommendResponses.filter(
      (r) => (r.recommendScore || 0) <= 6
    ).length;
    const npsScore =
      recommendResponses.length > 0
        ? Math.round(
            ((promoters - detractors) / recommendResponses.length) * 100
          )
        : 0;

    // Calculate feature averages dynamically
    const featureAverages: Record<string, number> = {};
    const featureResponses = responses.filter(
      (r) => r.featureRatings && typeof r.featureRatings === "object"
    );

    if (featureResponses.length > 0) {
      // Collect all unique feature keys
      const allFeatureKeys = new Set<string>();
      featureResponses.forEach((r) => {
        if (r.featureRatings) {
          Object.keys(r.featureRatings).forEach((key) =>
            allFeatureKeys.add(key)
          );
        }
      });

      // Calculate average for each feature
      allFeatureKeys.forEach((key) => {
        const validResponses = featureResponses.filter(
          (r) => r.featureRatings && typeof r.featureRatings[key] === "number"
        );
        if (validResponses.length > 0) {
          const sum = validResponses.reduce(
            (acc, r) => acc + (r.featureRatings[key] || 0),
            0
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