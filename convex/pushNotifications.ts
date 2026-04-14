import { v } from "convex/values";
import { query, mutation, action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

const GOAL_TIMES: Record<string, number> = {
  "sub-60": 60000,
  "sub-45": 45000,
  "sub-30": 30000,
  "sub-20": 20000,
  "sub-15": 15000,
  "sub-12": 12000,
  "sub-10": 10000,
  "sub-8": 8000,
};

function getDateInTimeZone(
  timeZone: string,
  timestamp: number = Date.now(),
): Date {
  try {
    return new Date(new Date(timestamp).toLocaleString("en-US", { timeZone }));
  } catch {
    return new Date(
      new Date(timestamp).toLocaleString("en-US", { timeZone: "UTC" }),
    );
  }
}

function getDayKeyInTimeZone(
  timeZone: string,
  timestamp: number = Date.now(),
): string {
  const localDate = getDateInTimeZone(timeZone, timestamp);
  const month = String(localDate.getMonth() + 1).padStart(2, "0");
  const day = String(localDate.getDate()).padStart(2, "0");
  return `${localDate.getFullYear()}-${month}-${day}`;
}

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
        q.eq("userId", args.userId).eq("isActive", true),
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
      v.literal("failed"),
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

// Internal mutation to log reminder cron run metrics.
export const logReminderRunMetrics = internalMutation({
  args: {
    type: v.string(),
    runAt: v.number(),
    eligible: v.number(),
    sent: v.number(),
    skippedDedup: v.number(),
    skippedPracticedToday: v.number(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("reminderRunMetrics", {
      type: args.type,
      runAt: args.runAt,
      eligible: args.eligible,
      sent: args.sent,
      skippedDedup: args.skippedDedup,
      skippedPracticedToday: args.skippedPracticedToday,
      metadata: args.metadata,
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
        q.eq("userId", args.userId).eq("isActive", true),
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

// Internal mutation to get users eligible for server-driven algorithm due reminders.
export const getUsersEligibleForAlgorithmDue = internalMutation({
  args: {},
  handler: async (ctx) => {
    const subscriptions = await ctx.db
      .query("pushSubscriptions")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const userIds = [...new Set(subscriptions.map((sub) => sub.userId))];
    const eligibleUserIds: any[] = [];

    for (const userId of userIds) {
      const user = await ctx.db.get(userId);
      if (!user || user.isDeleted) continue;
      if (user.algorithmReminders === false) continue;
      eligibleUserIds.push(userId);
    }

    return eligibleUserIds;
  },
});

// Internal mutation to get users eligible for daily practice reminders.
export const getUsersEligibleForDailyPracticeReminder = internalMutation({
  args: {},
  handler: async (ctx) => {
    const subscriptions = await ctx.db
      .query("pushSubscriptions")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const userIds = [...new Set(subscriptions.map((sub) => sub.userId))];
    const eligibleUsers: Array<{
      userId: any;
      timeZone: string;
      dailyPracticeTime: string;
    }> = [];

    for (const userId of userIds) {
      const user = await ctx.db.get(userId);
      if (!user || user.isDeleted) continue;
      if (user.coachingDailyPracticeReminder === false) continue;

      eligibleUsers.push({
        userId,
        timeZone: user.notificationTimeZone || "UTC",
        dailyPracticeTime: user.coachingDailyPracticeTime || "19:00",
      });
    }

    return eligibleUsers;
  },
});

// Internal mutation to get users eligible for streak alerts.
export const getUsersEligibleForStreakAlerts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const subscriptions = await ctx.db
      .query("pushSubscriptions")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const userIds = [...new Set(subscriptions.map((sub) => sub.userId))];
    const eligibleUsers: Array<{ userId: any; timeZone: string }> = [];

    for (const userId of userIds) {
      const user = await ctx.db.get(userId);
      if (!user || user.isDeleted) continue;
      if (user.coachingStreakAlerts === false) continue;

      eligibleUsers.push({
        userId,
        timeZone: user.notificationTimeZone || "UTC",
      });
    }

    return eligibleUsers;
  },
});

// Internal mutation to get users eligible for goal progress updates.
export const getUsersEligibleForGoalProgressUpdates = internalMutation({
  args: {},
  handler: async (ctx) => {
    const subscriptions = await ctx.db
      .query("pushSubscriptions")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const userIds = [...new Set(subscriptions.map((sub) => sub.userId))];
    const eligibleUsers: Array<{ userId: any; timeZone: string }> = [];

    for (const userId of userIds) {
      const user = await ctx.db.get(userId);
      if (!user || user.isDeleted) continue;
      if (user.coachingGoalProgressUpdates === false) continue;

      eligibleUsers.push({
        userId,
        timeZone: user.notificationTimeZone || "UTC",
      });
    }

    return eligibleUsers;
  },
});

// Internal mutation to check whether a reminder has already been sent for a day key.
export const hasNotificationForDay = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    dayKey: v.string(),
  },
  handler: async (ctx, args) => {
    const recentLogs = await ctx.db
      .query("pushNotificationLog")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", args.userId).eq("type", args.type),
      )
      .order("desc")
      .take(20);

    return recentLogs.some(
      (log) =>
        log.status === "sent" &&
        log.data &&
        typeof log.data === "object" &&
        (log.data as Record<string, unknown>).dayKey === args.dayKey,
    );
  },
});

// Internal mutation to check whether a specific goal milestone notification was already sent.
export const hasGoalProgressMilestoneNotification = internalMutation({
  args: {
    userId: v.id("users"),
    milestone: v.number(),
  },
  handler: async (ctx, args) => {
    const recentLogs = await ctx.db
      .query("pushNotificationLog")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", args.userId).eq("type", "goal_progress"),
      )
      .order("desc")
      .take(60);

    return recentLogs.some(
      (log) =>
        log.status === "sent" &&
        log.data &&
        typeof log.data === "object" &&
        (log.data as Record<string, unknown>).milestone === args.milestone,
    );
  },
});

// Internal mutation to determine whether user practiced today in their timezone.
export const hasPracticedTodayInTimeZone = internalMutation({
  args: {
    userId: v.id("users"),
    timeZone: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;
    const todayKey = getDayKeyInTimeZone(args.timeZone, now);

    const recentEntries = await ctx.db
      .query("coachJournalEntries")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).gte("entryDate", threeDaysAgo),
      )
      .collect();

    return recentEntries.some(
      (entry) =>
        getDayKeyInTimeZone(args.timeZone, entry.entryDate) === todayKey,
    );
  },
});

// Internal mutation to compute current goal progress milestone for reminder delivery.
export const getGoalProgressSnapshot = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("coachProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) {
      return null;
    }

    const targetTime =
      profile.customGoalTime || GOAL_TIMES[profile.goalType] || 20000;
    const startingAverage = profile.currentAverage || targetTime * 1.5;

    const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const monthlyEntries = await ctx.db
      .query("coachJournalEntries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const monthlyAvgTimes = monthlyEntries
      .filter((entry) => entry.entryDate >= monthAgo)
      .filter((entry) => entry.customAverage || entry.sessionAverage)
      .map((entry) => entry.customAverage || entry.sessionAverage || 0);

    const monthlyAverage =
      monthlyAvgTimes.length > 0
        ? monthlyAvgTimes.reduce((sum, time) => sum + time, 0) /
          monthlyAvgTimes.length
        : null;

    const currentAverage = monthlyAverage ?? startingAverage;
    if (currentAverage <= targetTime) {
      return {
        milestone: 100,
        progressPercent: 100,
        goalType: profile.goalType,
        goalLabel: profile.goalType.replace("-", " ").toUpperCase(),
        goalAchieved: true,
      };
    }

    const totalImprovement = startingAverage - targetTime;
    if (totalImprovement <= 0) {
      return null;
    }

    const currentImprovement = startingAverage - currentAverage;
    const progressPercent = Math.min(
      100,
      Math.max(0, (currentImprovement / totalImprovement) * 100),
    );

    return {
      milestone: Math.floor(progressPercent / 10) * 10,
      progressPercent,
      goalType: profile.goalType,
      goalLabel: profile.goalType.replace("-", " ").toUpperCase(),
      goalAchieved: false,
    };
  },
});

// Internal mutation to get users eligible for weekly coaching summaries.
export const getUsersEligibleForWeeklySummary = internalMutation({
  args: {},
  handler: async (ctx) => {
    const subscriptions = await ctx.db
      .query("pushSubscriptions")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const userIds = [...new Set(subscriptions.map((sub) => sub.userId))];
    const eligibleUsers: Array<{ userId: any; timeZone: string }> = [];

    for (const userId of userIds) {
      const user = await ctx.db.get(userId);
      if (!user || user.isDeleted) continue;
      if (user.coachingWeeklySummary === false) continue;

      eligibleUsers.push({
        userId,
        timeZone: user.notificationTimeZone || "UTC",
      });
    }

    return eligibleUsers;
  },
});

// Internal mutation to check if weekly summary was already sent for a given week key.
export const hasWeeklySummaryForWeek = internalMutation({
  args: {
    userId: v.id("users"),
    weekKey: v.string(),
  },
  handler: async (ctx, args) => {
    const recentLogs = await ctx.db
      .query("pushNotificationLog")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", args.userId).eq("type", "weekly_summary"),
      )
      .order("desc")
      .take(20);

    return recentLogs.some(
      (log) =>
        log.status === "sent" &&
        log.data &&
        typeof log.data === "object" &&
        (log.data as Record<string, unknown>).weekKey === args.weekKey,
    );
  },
});

// Internal mutation to compute weekly coaching summary data.
export const getWeeklyCoachSummaryData = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;

    const allJournalEntries = await ctx.db
      .query("coachJournalEntries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const weeklyEntries = allJournalEntries.filter(
      (e) => e.entryDate >= weekAgo,
    );
    const prevWeekEntries = allJournalEntries.filter(
      (e) => e.entryDate >= twoWeeksAgo && e.entryDate < weekAgo,
    );

    const weeklySolves = weeklyEntries.reduce(
      (sum, e) => sum + (e.customSolveCount || e.solveCount || 0),
      0,
    );
    const weeklyPracticeMinutes = weeklyEntries.reduce(
      (sum, e) => sum + (e.practiceMinutes || 0),
      0,
    );

    const weeklyAvgTimes = weeklyEntries
      .filter((e) => e.customAverage || e.sessionAverage)
      .map((e) => e.customAverage || e.sessionAverage || 0);
    const prevWeekAvgTimes = prevWeekEntries
      .filter((e) => e.customAverage || e.sessionAverage)
      .map((e) => e.customAverage || e.sessionAverage || 0);

    const weeklyAverage =
      weeklyAvgTimes.length > 0
        ? weeklyAvgTimes.reduce((a, b) => a + b, 0) / weeklyAvgTimes.length
        : null;
    const prevWeekAverage =
      prevWeekAvgTimes.length > 0
        ? prevWeekAvgTimes.reduce((a, b) => a + b, 0) / prevWeekAvgTimes.length
        : null;

    const weeklyImprovementMs =
      prevWeekAverage !== null && weeklyAverage !== null
        ? prevWeekAverage - weeklyAverage
        : null;

    const calcStdDev = (times: number[]): number => {
      if (times.length < 2) return 0;
      const mean = times.reduce((a, b) => a + b, 0) / times.length;
      const variance =
        times.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / times.length;
      return Math.sqrt(variance);
    };

    const currentStdDev =
      weeklyAvgTimes.length >= 2 ? calcStdDev(weeklyAvgTimes) : null;
    const consistencyScore =
      currentStdDev !== null && weeklyAverage !== null && weeklyAverage > 0
        ? (currentStdDev / weeklyAverage) * 100
        : null;

    const recentSolves = await ctx.db
      .query("solves")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(1500);

    const recent3x3Solves = recentSolves.filter(
      (s) => s.event === "333" && isFinite(s.finalTime) && s.penalty !== "DNF",
    );

    const sessionSolveMap = new Map<string, typeof recent3x3Solves>();
    for (const solve of recent3x3Solves) {
      const key = solve.sessionId.toString();
      const list = sessionSolveMap.get(key);
      if (list) {
        list.push(solve);
      } else {
        sessionSolveMap.set(key, [solve]);
      }
    }

    const sessionSlowdownDeltas: number[] = [];
    for (const sessionSolves of sessionSolveMap.values()) {
      if (sessionSolves.length < 14) continue;

      const ordered = [...sessionSolves].sort(
        (a, b) => a.solveDate - b.solveDate,
      );
      const firstChunk = ordered.slice(0, 10);
      const laterChunk = ordered.slice(10);

      if (laterChunk.length < 4) continue;

      const firstAvg =
        firstChunk.reduce((sum, solve) => sum + solve.finalTime, 0) /
        firstChunk.length;
      const laterAvg =
        laterChunk.reduce((sum, solve) => sum + solve.finalTime, 0) /
        laterChunk.length;

      sessionSlowdownDeltas.push(laterAvg - firstAvg);
    }

    const slowdownDeltaMs =
      sessionSlowdownDeltas.length > 0
        ? sessionSlowdownDeltas.reduce((sum, delta) => sum + delta, 0) /
          sessionSlowdownDeltas.length
        : null;
    const slowdownAfterTenDetected =
      slowdownDeltaMs !== null &&
      sessionSlowdownDeltas.length >= 2 &&
      slowdownDeltaMs >= 500;

    return {
      practiceHours: weeklyPracticeMinutes / 60,
      solves: weeklySolves,
      weeklyAverage,
      prevWeekAverage,
      weeklyImprovementMs,
      currentStdDev,
      consistencyScore,
      slowdownAfterTenDetected,
      slowdownDeltaMs,
      slowdownSessionsAnalyzed: sessionSlowdownDeltas.length,
    };
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
        p.nextReviewDate <= now,
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
        q.eq("userId", args.userId).eq("type", args.type),
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
    args,
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
      },
    );
  },
});
