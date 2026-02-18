import { v } from "convex/values";
import { query, action } from "./_generated/server";
import { internal } from "./_generated/api";

// Admin API for managing push notifications, viewing logs, and analytics
export const getNotificationAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Get all notification logs
    const allLogs = await ctx.db.query("pushNotificationLog").collect();

    // Get all push subscriptions to analyze active vs inactive and device types
    const allSubscriptions = await ctx.db.query("pushSubscriptions").collect();
    const activeSubscriptions = allSubscriptions.filter((s) => s.isActive);

    // Basic counts
    const total = allLogs.length;
    const sent = allLogs.filter((l) => l.status === "sent").length;
    const failed = allLogs.filter((l) => l.status === "failed").length;
    const clicked = allLogs.filter((l) => l.status === "clicked").length;
    const pending = allLogs.filter((l) => l.status === "pending").length;

    // Time-based stats
    const logsToday = allLogs.filter((l) => l.sentAt >= oneDayAgo);
    const logsThisWeek = allLogs.filter((l) => l.sentAt >= oneWeekAgo);
    const logsThisMonth = allLogs.filter((l) => l.sentAt >= oneMonthAgo);

    // Distribution by notification type
    const typeDistribution: Record<string, number> = {};
    allLogs.forEach((log) => {
      typeDistribution[log.type] = (typeDistribution[log.type] || 0) + 1;
    });

    // Status distribution for this week
    const weekStatusDistribution = {
      sent: logsThisWeek.filter((l) => l.status === "sent").length,
      failed: logsThisWeek.filter((l) => l.status === "failed").length,
      clicked: logsThisWeek.filter((l) => l.status === "clicked").length,
      pending: logsThisWeek.filter((l) => l.status === "pending").length,
    };

    // Calculate rates
    const deliveryRate = total > 0 ? ((sent / total) * 100).toFixed(1) : "0";
    const clickThroughRate =
      sent > 0 ? ((clicked / sent) * 100).toFixed(1) : "0";
    const failureRate = total > 0 ? ((failed / total) * 100).toFixed(1) : "0";

    // Daily trend for the last 7 days
    const dailyTrend: { date: string; sent: number; failed: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now - i * 24 * 60 * 60 * 1000);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dayLogs = allLogs.filter(
        (l) => l.sentAt >= dayStart.getTime() && l.sentAt <= dayEnd.getTime(),
      );

      dailyTrend.push({
        date: dayStart.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        sent: dayLogs.filter((l) => l.status === "sent").length,
        failed: dayLogs.filter((l) => l.status === "failed").length,
      });
    }

    // Unique users who received notifications
    const uniqueUsers = new Set(allLogs.map((l) => l.userId)).size;

    // Active subscriptions by device type
    const subscriptionsByDevice: Record<string, number> = {};
    activeSubscriptions.forEach((sub) => {
      const userAgent = sub.userAgent || "Unknown";
      let device = "Unknown";
      if (userAgent.includes("Mobile") || userAgent.includes("Android")) {
        device = "Mobile";
      } else if (userAgent.includes("Chrome")) {
        device = "Chrome";
      } else if (userAgent.includes("Firefox")) {
        device = "Firefox";
      } else if (userAgent.includes("Safari")) {
        device = "Safari";
      } else if (userAgent.includes("Edge")) {
        device = "Edge";
      } else {
        device = "Other";
      }
      subscriptionsByDevice[device] = (subscriptionsByDevice[device] || 0) + 1;
    });

    // Recent errors
    const recentErrors = allLogs
      .filter((l) => l.status === "failed" && l.error)
      .slice(-10)
      .map((l) => ({
        error: l.error,
        type: l.type,
        sentAt: l.sentAt,
      }));

    return {
      summary: {
        total,
        sent,
        failed,
        clicked,
        pending,
        deliveryRate: parseFloat(deliveryRate),
        clickThroughRate: parseFloat(clickThroughRate),
        failureRate: parseFloat(failureRate),
      },
      timeBasedStats: {
        today: logsToday.length,
        thisWeek: logsThisWeek.length,
        thisMonth: logsThisMonth.length,
        weekStatusDistribution,
      },
      typeDistribution,
      dailyTrend,
      subscriptions: {
        total: allSubscriptions.length,
        active: activeSubscriptions.length,
        inactive: allSubscriptions.length - activeSubscriptions.length,
        byDevice: subscriptionsByDevice,
      },
      uniqueUsers,
      recentErrors,
    };
  },
});

// Admin API to get notification logs with filtering and pagination
export const getNotificationLogs = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
    type: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let logs = await ctx.db
      .query("pushNotificationLog")
      .order("desc")
      .collect();

    // Filter by status
    if (args.status && args.status !== "all") {
      logs = logs.filter((log) => log.status === args.status);
    }

    // Filter by type
    if (args.type && args.type !== "all") {
      logs = logs.filter((log) => log.type === args.type);
    }

    // Search in title or body
    if (args.searchQuery && args.searchQuery.trim() !== "") {
      const query = args.searchQuery.toLowerCase();
      logs = logs.filter(
        (log) =>
          log.title.toLowerCase().includes(query) ||
          log.body.toLowerCase().includes(query),
      );
    }

    // Apply limit
    const limit = args.limit ?? 100;
    logs = logs.slice(0, limit);

    return logs;
  },
});

// Admin API to get all push subscriptions with user info
export const getAllSubscriptions = query({
  args: {
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let subscriptions = await ctx.db
      .query("pushSubscriptions")
      .order("desc")
      .collect();

    if (args.activeOnly) {
      subscriptions = subscriptions.filter((s) => s.isActive);
    }

    // Enrich subscriptions with user info
    const subscriptionsWithUser = await Promise.all(
      subscriptions.map(async (sub) => {
        const user = await ctx.db.get(sub.userId);
        return {
          ...sub,
          userName: user?.name || "Unknown",
          userWcaId: user?.wcaId || "Unknown",
        };
      }),
    );

    return subscriptionsWithUser;
  },
});

// Admin API to get distinct notification types for filtering
export const getNotificationTypes = query({
  args: {},
  handler: async (ctx) => {
    const logs = await ctx.db.query("pushNotificationLog").collect();
    const types = [...new Set(logs.map((l) => l.type))];
    return types.sort();
  },
});

// Admin action to send a custom notification to a specific user
export const sendCustomNotification = action({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    success: boolean;
    sent?: number;
    total?: number;
    message?: string;
    error?: string;
  }> => {
    return await ctx.runAction(internal.pushNodeActions.sendPushToUser, {
      userId: args.userId,
      payload: {
        title: args.title,
        body: args.body,
        icon: "/cubedev_logo.png",
        badge: "/cubedev_logo.png",
        tag: "admin-custom",
        url: args.url || "/",
      },
      notificationType: "admin_custom",
    });
  },
});

// Admin action to broadcast a notification to all users with active subscriptions
export const sendBroadcastNotification = action({
  args: {
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    success: boolean;
    sentCount: number;
    totalUsers: number;
    errors: string[];
  }> => {
    // Get all users with active subscriptions
    const usersWithSubscriptions = await ctx.runMutation(
      internal.pushNotifications.getUsersWithActiveSubscriptions,
    );

    let sentCount = 0;
    const errors: string[] = [];

    for (const userId of usersWithSubscriptions) {
      try {
        const result = await ctx.runAction(
          internal.pushNodeActions.sendPushToUser,
          {
            userId,
            payload: {
              title: args.title,
              body: args.body,
              icon: "/cubedev_logo.png",
              badge: "/cubedev_logo.png",
              tag: "admin-broadcast",
              url: args.url || "/",
            },
            notificationType: "admin_broadcast",
          },
        );
        if (result.success) {
          sentCount++;
        }
      } catch (error: any) {
        errors.push(`User ${userId}: ${error.message}`);
      }
    }

    return {
      success: sentCount > 0,
      sentCount,
      totalUsers: usersWithSubscriptions.length,
      errors,
    };
  },
});