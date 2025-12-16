"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import webpush from "web-push";

// VAPID keys from environment variables
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "";

// Internal action to send a push notification to a specific subscription
export const sendPushToSubscription = internalAction({
  args: {
    subscriptionId: v.id("pushSubscriptions"),
    endpoint: v.string(),
    keys: v.object({
      p256dh: v.string(),
      auth: v.string(),
    }),
    payload: v.object({
      title: v.string(),
      body: v.string(),
      icon: v.optional(v.string()),
      badge: v.optional(v.string()),
      tag: v.optional(v.string()),
      url: v.optional(v.string()),
      data: v.optional(v.any()),
    }),
    userId: v.id("users"),
    notificationType: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if VAPID keys are configured
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.error("[Push] VAPID keys not configured");
      await ctx.runMutation(internal.pushNotifications.logNotification, {
        userId: args.userId,
        subscriptionId: args.subscriptionId,
        type: args.notificationType,
        title: args.payload.title,
        body: args.payload.body,
        status: "failed",
        error: "VAPID keys not configured",
      });
      return { success: false, error: "VAPID keys not configured" };
    }

    try {
      webpush.setVapidDetails(
        VAPID_SUBJECT,
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
      );

      const subscription = {
        endpoint: args.endpoint,
        keys: args.keys,
      };

      await webpush.sendNotification(
        subscription,
        JSON.stringify(args.payload),
        {
          TTL: 60 * 60 * 24, // 24 hours
          urgency: "normal",
        }
      );

      // Log success and update subscription
      await ctx.runMutation(
        internal.pushNotifications.updateSubscriptionLastUsed,
        {
          subscriptionId: args.subscriptionId,
        }
      );

      await ctx.runMutation(internal.pushNotifications.logNotification, {
        userId: args.userId,
        subscriptionId: args.subscriptionId,
        type: args.notificationType,
        title: args.payload.title,
        body: args.payload.body,
        data: args.payload.data,
        status: "sent",
      });

      return { success: true };
    } catch (error: any) {
      console.error("[Push] Failed to send notification:", error);

      // Handle specific error codes
      if (error.statusCode === 410 || error.statusCode === 404) {
        // Subscription expired or invalid - mark as failed
        await ctx.runMutation(
          internal.pushNotifications.markSubscriptionFailed,
          {
            subscriptionId: args.subscriptionId,
            error: "Subscription expired",
          }
        );
      } else {
        await ctx.runMutation(
          internal.pushNotifications.markSubscriptionFailed,
          {
            subscriptionId: args.subscriptionId,
            error: error.message || "Unknown error",
          }
        );
      }

      await ctx.runMutation(internal.pushNotifications.logNotification, {
        userId: args.userId,
        subscriptionId: args.subscriptionId,
        type: args.notificationType,
        title: args.payload.title,
        body: args.payload.body,
        status: "failed",
        error: error.message || "Unknown error",
      });

      return { success: false, error: error.message };
    }
  },
});

interface PushResult {
  success: boolean;
  error?: string;
}

interface Subscription {
  _id: any;
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

// Internal action to send push notifications to all of a user's subscriptions
export const sendPushToUser = internalAction({
  args: {
    userId: v.id("users"),
    payload: v.object({
      title: v.string(),
      body: v.string(),
      icon: v.optional(v.string()),
      badge: v.optional(v.string()),
      tag: v.optional(v.string()),
      url: v.optional(v.string()),
      data: v.optional(v.any()),
    }),
    notificationType: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    sent: number;
    total?: number;
    message?: string;
  }> => {
    // Get all active subscriptions for the user
    const subscriptions: Subscription[] = await ctx.runMutation(
      internal.pushNotifications.getActiveSubscriptionsInternal,
      { userId: args.userId }
    );

    if (subscriptions.length === 0) {
      return { success: true, sent: 0, message: "No active subscriptions" };
    }

    // Send to all subscriptions in parallel
    const results: PushResult[] = await Promise.all(
      subscriptions.map(
        (sub: {
          _id: any;
          endpoint: string;
          keys: { p256dh: string; auth: string };
        }) =>
          ctx.runAction(internal.pushNodeActions.sendPushToSubscription, {
            subscriptionId: sub._id,
            endpoint: sub.endpoint,
            keys: sub.keys,
            payload: args.payload,
            userId: args.userId,
            notificationType: args.notificationType,
          })
      )
    );

    const successCount = results.filter((r: PushResult) => r.success).length;
    return {
      success: successCount > 0,
      sent: successCount,
      total: subscriptions.length,
    };
  },
});

// Internal action to check and send due algorithm notifications to all users
export const sendDueAlgorithmNotifications = internalAction({
  args: {},
  handler: async (ctx) => {
    // Get all users with active push subscriptions
    const usersWithSubscriptions = await ctx.runMutation(
      internal.pushNotifications.getUsersWithActiveSubscriptions
    );

    let totalSent = 0;

    for (const userId of usersWithSubscriptions) {
      // Check if user has due algorithms
      const dueCount = await ctx.runMutation(
        internal.pushNotifications.getDueAlgorithmCount,
        { userId }
      );

      if (dueCount > 0) {
        // Check if we already sent a notification recently (within 4 hours)
        const recentNotification = await ctx.runMutation(
          internal.pushNotifications.getRecentNotification,
          { userId, type: "algorithm_due", hours: 4 }
        );

        if (!recentNotification) {
          // Send push notification
          await ctx.runAction(internal.pushNodeActions.sendPushToUser, {
            userId,
            payload: {
              title: `${dueCount} Algorithm${dueCount !== 1 ? "s" : ""} Due for Review`,
              body:
                dueCount === 1
                  ? "You have 1 algorithm ready to practice!"
                  : `You have ${dueCount} algorithms ready to practice!`,
              icon: "/cubedev_logo.png",
              badge: "/cubedev_logo.png",
              tag: "algorithm-due",
              url: "/cube-lab/algorithm-trainer/practice",
            },
            notificationType: "algorithm_due",
          });
          totalSent++;
        }
      }
    }

    console.log(
      `[Push] Sent due algorithm notifications to ${totalSent} users`
    );
    return { sent: totalSent };
  },
});

// Test push notification
export const testPushNotificationAction = internalAction({
  args: {
    userId: v.id("users"),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    sent: number;
    total?: number;
    message?: string;
  }> => {
    return await ctx.runAction(internal.pushNodeActions.sendPushToUser, {
      userId: args.userId,
      payload: {
        title: "Test Notification",
        body: "Push notifications are working! 🎉",
        icon: "/cubedev_logo.png",
        badge: "/cubedev_logo.png",
        tag: "test",
        url: "/cube-lab/timer",
      },
      notificationType: "test",
    });
  },
});