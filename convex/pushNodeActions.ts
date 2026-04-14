"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import webpush from "web-push";

// VAPID keys from environment variables
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "";
const DAILY_REMINDER_WINDOW_MINUTES = 5;
const STREAK_ALERT_HOUR = 20; // 8 PM local time
const WEEKLY_SUMMARY_TARGET_DAY = 0; // Sunday
const WEEKLY_SUMMARY_TARGET_HOUR = 10; // 10 AM local time

function getDateInTimeZone(timeZone: string): Date {
  try {
    return new Date(new Date().toLocaleString("en-US", { timeZone }));
  } catch {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "UTC" }));
  }
}

function getWeekKey(localDate: Date): string {
  const startOfYear = new Date(localDate.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(
    ((localDate.getTime() - startOfYear.getTime()) / 86400000 +
      startOfYear.getDay() +
      1) /
      7,
  );
  return `${localDate.getFullYear()}-W${weekNumber}`;
}

function getDayKey(localDate: Date): string {
  const month = String(localDate.getMonth() + 1).padStart(2, "0");
  const day = String(localDate.getDate()).padStart(2, "0");
  return `${localDate.getFullYear()}-${month}-${day}`;
}

function parseTimeToMinutes(timeValue: string): number | null {
  const [hourStr, minuteStr] = timeValue.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return hour * 60 + minute;
}

function formatSeconds(ms: number): string {
  return (ms / 1000).toFixed(1);
}

function buildWeeklySummaryBody(summary: {
  practiceHours: number;
  solves: number;
  weeklyAverage: number | null;
  prevWeekAverage: number | null;
  weeklyImprovementMs: number | null;
  currentStdDev: number | null;
  consistencyScore: number | null;
  slowdownAfterTenDetected: boolean;
  slowdownDeltaMs: number | null;
}): string {
  if (summary.solves === 0) {
    return "No solves logged this week yet. Start with one short session today to build momentum.";
  }

  const hints: string[] = [];

  if (
    summary.weeklyAverage !== null &&
    summary.prevWeekAverage !== null &&
    summary.weeklyImprovementMs !== null
  ) {
    const fromAvg = formatSeconds(summary.prevWeekAverage);
    const toAvg = formatSeconds(summary.weeklyAverage);
    if (summary.weeklyImprovementMs > 0) {
      hints.push(`Your avg dropped from ${fromAvg}s to ${toAvg}s this week.`);
    } else if (summary.weeklyImprovementMs < 0) {
      hints.push(`Your avg rose from ${fromAvg}s to ${toAvg}s this week.`);
    }
  }

  if (summary.slowdownAfterTenDetected) {
    hints.push(
      "You slow down after 10 solves. Take short breaks between sets.",
    );
  }

  if (
    summary.consistencyScore !== null &&
    summary.consistencyScore >= 15 &&
    summary.currentStdDev !== null
  ) {
    hints.push(
      `Your consistency is low this week (std dev ${formatSeconds(summary.currentStdDev)}s).`,
    );
  }

  const base = `${summary.practiceHours.toFixed(1)}h practice and ${summary.solves} solves this week.`;
  if (hints.length === 0) {
    return `${base} Keep stacking clean sessions for steadier averages.`;
  }

  return `${base} ${hints.slice(0, 2).join(" ")}`;
}

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
        VAPID_PRIVATE_KEY,
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
        },
      );

      // Log success and update subscription
      await ctx.runMutation(
        internal.pushNotifications.updateSubscriptionLastUsed,
        {
          subscriptionId: args.subscriptionId,
        },
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
          },
        );
      } else {
        await ctx.runMutation(
          internal.pushNotifications.markSubscriptionFailed,
          {
            subscriptionId: args.subscriptionId,
            error: error.message || "Unknown error",
          },
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
    args,
  ): Promise<{
    success: boolean;
    sent: number;
    total?: number;
    message?: string;
  }> => {
    // Get all active subscriptions for the user
    const subscriptions: Subscription[] = await ctx.runMutation(
      internal.pushNotifications.getActiveSubscriptionsInternal,
      { userId: args.userId },
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
          }),
      ),
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
    const runAt = Date.now();
    // Get users with active push subscriptions and enabled algorithm reminders
    const usersWithSubscriptions = await ctx.runMutation(
      internal.pushNotifications.getUsersEligibleForAlgorithmDue,
    );

    let totalSent = 0;
    let skippedDedup = 0;
    let skippedNoDue = 0;

    for (const userId of usersWithSubscriptions) {
      // Check if user has due algorithms
      const dueCount = await ctx.runMutation(
        internal.pushNotifications.getDueAlgorithmCount,
        { userId },
      );

      if (dueCount <= 0) {
        skippedNoDue++;
        continue;
      }

      // Check if we already sent a notification recently (within 4 hours)
      const recentNotification = await ctx.runMutation(
        internal.pushNotifications.getRecentNotification,
        { userId, type: "algorithm_due", hours: 4 },
      );

      if (recentNotification) {
        skippedDedup++;
        continue;
      }

      // Send push notification
      const result = await ctx.runAction(
        internal.pushNodeActions.sendPushToUser,
        {
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
        },
      );

      if (result.sent && result.sent > 0) {
        totalSent++;
      }
    }

    await ctx.runMutation(internal.pushNotifications.logReminderRunMetrics, {
      type: "algorithm_due",
      runAt,
      eligible: usersWithSubscriptions.length,
      sent: totalSent,
      skippedDedup,
      skippedPracticedToday: 0,
      metadata: {
        skippedNoDue,
      },
    });

    console.log(
      `[Push] Sent due algorithm notifications to ${totalSent} users`,
    );
    return { sent: totalSent };
  },
});

// Internal action to send daily practice reminder notifications.
export const sendDailyPracticeReminderNotifications = internalAction({
  args: {},
  handler: async (ctx) => {
    const runAt = Date.now();
    const eligibleUsers: Array<{
      userId: any;
      timeZone: string;
      dailyPracticeTime: string;
    }> = await ctx.runMutation(
      internal.pushNotifications.getUsersEligibleForDailyPracticeReminder,
    );

    let totalSent = 0;
    let skippedDedup = 0;
    let skippedPracticedToday = 0;
    let skippedOutsideWindow = 0;
    let skippedInvalidTime = 0;

    for (const { userId, timeZone, dailyPracticeTime } of eligibleUsers) {
      const localNow = getDateInTimeZone(timeZone);
      const dayKey = getDayKey(localNow);
      const nowMinutes = localNow.getHours() * 60 + localNow.getMinutes();
      const targetMinutes = parseTimeToMinutes(dailyPracticeTime);

      if (targetMinutes === null) {
        skippedInvalidTime++;
        continue;
      }

      const inWindow =
        nowMinutes >= targetMinutes &&
        nowMinutes < targetMinutes + DAILY_REMINDER_WINDOW_MINUTES;

      if (!inWindow) {
        skippedOutsideWindow++;
        continue;
      }

      const alreadySent = await ctx.runMutation(
        internal.pushNotifications.hasNotificationForDay,
        {
          userId,
          type: "daily_practice_reminder",
          dayKey,
        },
      );

      if (alreadySent) {
        skippedDedup++;
        continue;
      }

      const hasPracticedToday = await ctx.runMutation(
        internal.pushNotifications.hasPracticedTodayInTimeZone,
        {
          userId,
          timeZone,
        },
      );

      if (hasPracticedToday) {
        skippedPracticedToday++;
        continue;
      }

      const result = await ctx.runAction(
        internal.pushNodeActions.sendPushToUser,
        {
          userId,
          payload: {
            title: "Time to Practice",
            body: "Your daily practice session awaits. Keep building those skills!",
            icon: "/cubedev_logo.png",
            badge: "/cubedev_logo.png",
            tag: "daily-practice-reminder",
            url: "/cube-lab/coach",
            data: {
              dayKey,
              timeZone,
            },
          },
          notificationType: "daily_practice_reminder",
        },
      );

      if (result.sent && result.sent > 0) {
        totalSent++;
      }
    }

    await ctx.runMutation(internal.pushNotifications.logReminderRunMetrics, {
      type: "daily_practice_reminder",
      runAt,
      eligible: eligibleUsers.length,
      sent: totalSent,
      skippedDedup,
      skippedPracticedToday,
      metadata: {
        skippedOutsideWindow,
        skippedInvalidTime,
      },
    });

    console.log(`[Push] Sent daily practice reminders to ${totalSent} users`);
    return { sent: totalSent };
  },
});

// Internal action to send streak alert notifications.
export const sendStreakAlertNotifications = internalAction({
  args: {},
  handler: async (ctx) => {
    const runAt = Date.now();
    const eligibleUsers: Array<{ userId: any; timeZone: string }> =
      await ctx.runMutation(
        internal.pushNotifications.getUsersEligibleForStreakAlerts,
      );

    let totalSent = 0;
    let skippedDedup = 0;
    let skippedPracticedToday = 0;
    let skippedBeforeHour = 0;

    for (const { userId, timeZone } of eligibleUsers) {
      const localNow = getDateInTimeZone(timeZone);
      if (localNow.getHours() < STREAK_ALERT_HOUR) {
        skippedBeforeHour++;
        continue;
      }

      const dayKey = getDayKey(localNow);
      const alreadySent = await ctx.runMutation(
        internal.pushNotifications.hasNotificationForDay,
        {
          userId,
          type: "streak_alert",
          dayKey,
        },
      );

      if (alreadySent) {
        skippedDedup++;
        continue;
      }

      const hasPracticedToday = await ctx.runMutation(
        internal.pushNotifications.hasPracticedTodayInTimeZone,
        {
          userId,
          timeZone,
        },
      );

      if (hasPracticedToday) {
        skippedPracticedToday++;
        continue;
      }

      const result = await ctx.runAction(
        internal.pushNodeActions.sendPushToUser,
        {
          userId,
          payload: {
            title: "Streak at Risk",
            body: "You haven't practiced today yet. Keep your streak alive with a short session.",
            icon: "/cubedev_logo.png",
            badge: "/cubedev_logo.png",
            tag: "streak-alert",
            url: "/cube-lab/coach",
            data: {
              dayKey,
              timeZone,
            },
          },
          notificationType: "streak_alert",
        },
      );

      if (result.sent && result.sent > 0) {
        totalSent++;
      }
    }

    await ctx.runMutation(internal.pushNotifications.logReminderRunMetrics, {
      type: "streak_alert",
      runAt,
      eligible: eligibleUsers.length,
      sent: totalSent,
      skippedDedup,
      skippedPracticedToday,
      metadata: {
        skippedBeforeHour,
      },
    });

    console.log(`[Push] Sent streak alerts to ${totalSent} users`);
    return { sent: totalSent };
  },
});

// Internal action to send goal progress milestone notifications.
export const sendGoalProgressNotifications = internalAction({
  args: {},
  handler: async (ctx) => {
    const runAt = Date.now();
    const eligibleUsers: Array<{ userId: any; timeZone: string }> =
      await ctx.runMutation(
        internal.pushNotifications.getUsersEligibleForGoalProgressUpdates,
      );

    let totalSent = 0;
    let skippedDedup = 0;
    let skippedNoMilestone = 0;

    for (const { userId, timeZone } of eligibleUsers) {
      const snapshot = await ctx.runMutation(
        internal.pushNotifications.getGoalProgressSnapshot,
        { userId },
      );

      if (!snapshot || snapshot.goalAchieved || snapshot.milestone <= 0) {
        skippedNoMilestone++;
        continue;
      }

      const alreadySent = await ctx.runMutation(
        internal.pushNotifications.hasGoalProgressMilestoneNotification,
        {
          userId,
          milestone: snapshot.milestone,
        },
      );

      if (alreadySent) {
        skippedDedup++;
        continue;
      }

      const result = await ctx.runAction(
        internal.pushNodeActions.sendPushToUser,
        {
          userId,
          payload: {
            title: "Goal Progress Update",
            body: `You're ${snapshot.progressPercent.toFixed(0)}% towards your ${snapshot.goalLabel} goal! Keep pushing!`,
            icon: "/cubedev_logo.png",
            badge: "/cubedev_logo.png",
            tag: "goal-progress",
            url: "/cube-lab/coach?tab=progress",
            data: {
              milestone: snapshot.milestone,
              progressPercent: snapshot.progressPercent,
              goalType: snapshot.goalType,
              timeZone,
            },
          },
          notificationType: "goal_progress",
        },
      );

      if (result.sent && result.sent > 0) {
        totalSent++;
      }
    }

    await ctx.runMutation(internal.pushNotifications.logReminderRunMetrics, {
      type: "goal_progress",
      runAt,
      eligible: eligibleUsers.length,
      sent: totalSent,
      skippedDedup,
      skippedPracticedToday: 0,
      metadata: {
        skippedNoMilestone,
      },
    });

    console.log(`[Push] Sent goal progress updates to ${totalSent} users`);
    return { sent: totalSent };
  },
});

// Internal action to send weekly coaching summary notifications.
export const sendWeeklyCoachSummaryNotifications = internalAction({
  args: {},
  handler: async (ctx) => {
    const runAt = Date.now();
    const eligibleUsers: Array<{ userId: any; timeZone: string }> =
      await ctx.runMutation(
        internal.pushNotifications.getUsersEligibleForWeeklySummary,
      );

    let totalSent = 0;
    let skippedDedup = 0;
    let skippedOutsideWindow = 0;

    for (const { userId, timeZone } of eligibleUsers) {
      const localNow = getDateInTimeZone(timeZone);
      const isScheduledWindow =
        localNow.getDay() === WEEKLY_SUMMARY_TARGET_DAY &&
        localNow.getHours() === WEEKLY_SUMMARY_TARGET_HOUR;

      if (!isScheduledWindow) {
        skippedOutsideWindow++;
        continue;
      }

      const weekKey = getWeekKey(localNow);
      const alreadySent = await ctx.runMutation(
        internal.pushNotifications.hasWeeklySummaryForWeek,
        {
          userId,
          weekKey,
        },
      );

      if (alreadySent) {
        skippedDedup++;
        continue;
      }

      const summary = await ctx.runMutation(
        internal.pushNotifications.getWeeklyCoachSummaryData,
        {
          userId,
        },
      );

      const body = buildWeeklySummaryBody(summary);
      const result = await ctx.runAction(
        internal.pushNodeActions.sendPushToUser,
        {
          userId,
          payload: {
            title: "Weekly Practice Summary",
            body,
            icon: "/cubedev_logo.png",
            badge: "/cubedev_logo.png",
            tag: "weekly-summary",
            url: "/cube-lab/coach?tab=progress",
            data: {
              weekKey,
              timeZone,
            },
          },
          notificationType: "weekly_summary",
        },
      );

      if (result.sent && result.sent > 0) {
        totalSent++;
      }
    }

    await ctx.runMutation(internal.pushNotifications.logReminderRunMetrics, {
      type: "weekly_summary",
      runAt,
      eligible: eligibleUsers.length,
      sent: totalSent,
      skippedDedup,
      skippedPracticedToday: 0,
      metadata: {
        skippedOutsideWindow,
      },
    });

    console.log(`[Push] Sent weekly coaching summaries to ${totalSent} users`);
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
    args,
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
