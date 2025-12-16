import { v } from "convex/values";
import { query, mutation, action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Get VAPID public key for client-side subscription
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";

// Get VAPID public key for client-side subscription
export const getVapidPublicKey = query({
  args: {},
  handler: async () => {
    return VAPID_PUBLIC_KEY;
  },
});

// Save a push subscription for a user
export const saveSubscription = mutation({
  args: {
    userId: v.id("users"),
    endpoint: v.string(),
    keys: v.object({
      p256dh: v.string(),
      auth: v.string(),
    }),
    userAgent: v.optional(v.string()),
    deviceName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if subscription already exists
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (existing) {
      // Update existing subscription
      await ctx.db.patch(existing._id, {
        userId: args.userId,
        keys: args.keys,
        userAgent: args.userAgent,
        deviceName: args.deviceName,
        lastUsedAt: now,
        isActive: true,
        failureCount: 0,
      });
      return existing._id;
    }

    // Create new subscription
    const subscriptionId = await ctx.db.insert("pushSubscriptions", {
      userId: args.userId,
      endpoint: args.endpoint,
      keys: args.keys,
      userAgent: args.userAgent,
      deviceName: args.deviceName,
      createdAt: now,
      lastUsedAt: now,
      isActive: true,
      failureCount: 0,
    });

    return subscriptionId;
  },
});

// Remove a push subscription
export const removeSubscription = mutation({
  args: {
    endpoint: v.string(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (subscription) {
      await ctx.db.patch(subscription._id, { isActive: false });
    }
  },
});

// Get user's active subscriptions
export const getUserSubscriptions = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const subscriptions = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", args.userId).eq("isActive", true)
      )
      .collect();

    return subscriptions.map((sub) => ({
      id: sub._id,
      deviceName: sub.deviceName || "Unknown Device",
      userAgent: sub.userAgent,
      createdAt: sub.createdAt,
      lastUsedAt: sub.lastUsedAt,
    }));
  },
});

// Delete a specific subscription
export const deleteSubscription = mutation({
  args: {
    subscriptionId: v.id("pushSubscriptions"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db.get(args.subscriptionId);
    if (subscription && subscription.userId === args.userId) {
      await ctx.db.delete(args.subscriptionId);
    }
  },
});

// Internal mutation to mark subscription as failed
export const markSubscriptionFailed = internalMutation({
  args: {
    subscriptionId: v.id("pushSubscriptions"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db.get(args.subscriptionId);
    if (!subscription) return;

    const newFailureCount = subscription.failureCount + 1;

    // Deactivate after 3 failures
    if (newFailureCount >= 3) {
      await ctx.db.patch(args.subscriptionId, {
        isActive: false,
        failureCount: newFailureCount,
      });
    } else {
      await ctx.db.patch(args.subscriptionId, {
        failureCount: newFailureCount,
      });
    }
  },
});

// Internal mutation to log a notification
export const logNotification = internalMutation({
  args: {
    userId: v.id("users"),
    subscriptionId: v.optional(v.id("pushSubscriptions")),
    type: v.string(),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("failed")
    ),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("pushNotificationLog", {
      userId: args.userId,
      subscriptionId: args.subscriptionId,
      type: args.type,
      title: args.title,
      body: args.body,
      data: args.data,
      status: args.status,
      error: args.error,
      sentAt: Date.now(),
    });
  },
});

// Internal mutation to update subscription last used time
export const updateSubscriptionLastUsed = internalMutation({
  args: {
    subscriptionId: v.id("pushSubscriptions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.subscriptionId, {
      lastUsedAt: Date.now(),
      failureCount: 0,
    });
  },
});

// Internal mutation to get active subscriptions (for use in actions)
export const getActiveSubscriptionsInternal = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", args.userId).eq("isActive", true)
      )
      .collect();
  },
});

// Internal mutation to get users with active subscriptions
export const getUsersWithActiveSubscriptions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const subscriptions = await ctx.db
      .query("pushSubscriptions")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get unique user IDs
    const userIds = [...new Set(subscriptions.map((sub) => sub.userId))];
    return userIds;
  },
});

// Internal mutation to count due algorithms for a user
export const getDueAlgorithmCount = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const progress = await ctx.db
      .query("userAlgorithmProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return progress.filter(
      (p) =>
        p.learningStage !== "new" &&
        p.learningStage !== "mastered" &&
        p.nextReviewDate <= now
    ).length;
  },
});

// Internal mutation to check for recent notifications
export const getRecentNotification = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    hours: v.number(),
  },
  handler: async (ctx, args) => {
    const cutoff = Date.now() - args.hours * 60 * 60 * 1000;

    const recent = await ctx.db
      .query("pushNotificationLog")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", args.userId).eq("type", args.type)
      )
      .order("desc")
      .first();

    return recent && recent.sentAt > cutoff ? recent : null;
  },
});

// Public action for users to test their push notifications
export const testPushNotification = action({
  args: {
    userId: v.id("users"),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    sent?: number;
    total?: number;
    message?: string;
    error?: string;
  }> => {
    return await ctx.runAction(
      internal.pushNodeActions.testPushNotificationAction,
      {
        userId: args.userId,
      }
    );
  },
});