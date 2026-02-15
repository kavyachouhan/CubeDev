import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get coach profile for a user
export const getCoachProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("coachProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// Get coach profile by WCA ID (for public profile display)
export const getCoachProfileByWcaId = query({
  args: { wcaId: v.string() },
  handler: async (ctx, args) => {
    // First find the user by WCA ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_wca_id", (q) => q.eq("wcaId", args.wcaId))
      .first();

    if (!user) {
      return null;
    }

    // Then get their coach profile
    const profile = await ctx.db
      .query("coachProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!profile || !profile.onboardingCompleted) {
      return null;
    }

    // Return profile with user info for display
    return {
      ...profile,
      userName: user.name,
      userAvatar: user.avatar,
    };
  },
});

// Get progress stats by WCA ID (for public profile display)
export const getProgressStatsByWcaId = query({
  args: { wcaId: v.string() },
  handler: async (ctx, args) => {
    // First find the user by WCA ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_wca_id", (q) => q.eq("wcaId", args.wcaId))
      .first();

    if (!user) {
      return null;
    }

    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Get all journal entries for the user
    const allJournalEntries = await ctx.db
      .query("coachJournalEntries")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    if (allJournalEntries.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        weekly: null,
        monthly: null,
        allTime: {
          solves: 0,
          practiceMinutes: 0,
          entries: 0,
        },
      };
    }

    // Calculate streak
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const getStartOfDay = (timestamp: number): number => {
      const date = new Date(timestamp);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    };

    const sortedEntries = [...allJournalEntries].sort(
      (a, b) => b.entryDate - a.entryDate,
    );

    if (sortedEntries.length > 0) {
      const today = getStartOfDay(now);
      const yesterday = today - 24 * 60 * 60 * 1000;
      const firstEntryDay = getStartOfDay(sortedEntries[0].entryDate);

      if (firstEntryDay === today || firstEntryDay === yesterday) {
        currentStreak = 1;
        let checkDate = firstEntryDay - 24 * 60 * 60 * 1000;

        for (let i = 1; i < sortedEntries.length; i++) {
          const entryDay = getStartOfDay(sortedEntries[i].entryDate);
          if (entryDay === checkDate) {
            currentStreak++;
            checkDate -= 24 * 60 * 60 * 1000;
          } else if (entryDay < checkDate) {
            break;
          }
        }
      }

      const uniqueDays = new Set(
        sortedEntries.map((e) => getStartOfDay(e.entryDate)),
      );
      const sortedDays = Array.from(uniqueDays).sort((a, b) => a - b);

      for (let i = 0; i < sortedDays.length; i++) {
        if (
          i === 0 ||
          sortedDays[i] - sortedDays[i - 1] === 24 * 60 * 60 * 1000
        ) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }

    // Weekly stats
    const weeklyEntries = allJournalEntries.filter(
      (e) => e.entryDate >= weekAgo,
    );
    const weeklySolves = weeklyEntries.reduce(
      (sum, e) => sum + (e.customSolveCount || e.solveCount || 0),
      0,
    );
    const weeklyAvgTimes = weeklyEntries
      .filter((e) => e.customAverage || e.sessionAverage)
      .map((e) => e.customAverage || e.sessionAverage || 0);
    const weeklyAverage =
      weeklyAvgTimes.length > 0
        ? weeklyAvgTimes.reduce((a, b) => a + b, 0) / weeklyAvgTimes.length
        : null;
    const weeklyActiveDays = new Set(
      weeklyEntries.map((e) => getStartOfDay(e.entryDate)),
    ).size;

    // Monthly stats
    const monthlyEntries = allJournalEntries.filter(
      (e) => e.entryDate >= monthAgo,
    );
    const monthlyAvgTimes = monthlyEntries
      .filter((e) => e.customAverage || e.sessionAverage)
      .map((e) => e.customAverage || e.sessionAverage || 0);
    const monthlyAverage =
      monthlyAvgTimes.length > 0
        ? monthlyAvgTimes.reduce((a, b) => a + b, 0) / monthlyAvgTimes.length
        : null;

    // All-time stats
    const allTimeSolves = allJournalEntries.reduce(
      (sum, e) => sum + (e.customSolveCount || e.solveCount || 0),
      0,
    );
    const allTimePracticeMinutes = allJournalEntries.reduce(
      (sum, e) => sum + (e.practiceMinutes || 0),
      0,
    );

    return {
      currentStreak,
      longestStreak,
      weekly: {
        solves: weeklySolves,
        average: weeklyAverage,
        activeDays: weeklyActiveDays,
      },
      monthly: {
        average: monthlyAverage,
      },
      allTime: {
        solves: allTimeSolves,
        practiceMinutes: allTimePracticeMinutes,
        entries: allJournalEntries.length,
      },
    };
  },
});

// Create or update coach profile (onboarding)
export const saveCoachProfile = mutation({
  args: {
    userId: v.id("users"),
    currentAverage: v.optional(v.number()),
    skillLevel: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced"),
      v.literal("expert"),
    ),
    primaryEvent: v.string(),
    goalType: v.union(
      v.literal("sub-60"),
      v.literal("sub-45"),
      v.literal("sub-30"),
      v.literal("sub-20"),
      v.literal("sub-15"),
      v.literal("sub-12"),
      v.literal("sub-10"),
      v.literal("sub-8"),
      v.literal("custom"),
    ),
    customGoalTime: v.optional(v.number()),
    targetDate: v.number(),
    dailyPracticeMinutes: v.number(),
    practiceSchedule: v.optional(v.array(v.string())),
    baselineSessionId: v.optional(v.id("sessions")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if profile exists
    const existing = await ctx.db
      .query("coachProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      // Update existing profile
      await ctx.db.patch(existing._id, {
        ...args,
        onboardingCompleted: true,
        onboardingCompletedAt: now,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new profile
      return await ctx.db.insert("coachProfiles", {
        ...args,
        onboardingCompleted: true,
        onboardingCompletedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Update goal and optionally archive current goal in history
export const updateGoal = mutation({
  args: {
    userId: v.id("users"),
    goalType: v.union(
      v.literal("sub-60"),
      v.literal("sub-45"),
      v.literal("sub-30"),
      v.literal("sub-20"),
      v.literal("sub-15"),
      v.literal("sub-12"),
      v.literal("sub-10"),
      v.literal("sub-8"),
      v.literal("custom"),
    ),
    customGoalTime: v.optional(v.number()),
    targetDate: v.number(),
    currentAverage: v.optional(v.number()),
    // New flag to indicate whether to archive the current goal
    archiveCurrentGoal: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const existing = await ctx.db
      .query("coachProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!existing) {
      throw new Error("Coach profile not found");
    }

    // Helper to get goal target time
    const getGoalTargetTime = (
      goalType: string,
      customTime?: number,
    ): number => {
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
      return customTime || GOAL_TIMES[goalType] || 20000;
    };

    // Check if this is a goal change (not just an extension)
    const isGoalChange =
      existing.goalType !== args.goalType ||
      existing.customGoalTime !== args.customGoalTime;

    // Archive the current goal if it's changing or explicitly requested
    if (isGoalChange || args.archiveCurrentGoal) {
      // Calculate current progress
      const targetTime = getGoalTargetTime(
        existing.goalType,
        existing.customGoalTime,
      );
      const startingAvg = existing.currentAverage || targetTime * 1.5;
      const currentAvg = args.currentAverage || startingAvg;
      const totalImprovement = startingAvg - targetTime;
      const actualImprovement = startingAvg - currentAvg;
      const progressPercentage =
        totalImprovement > 0
          ? Math.min(
              100,
              Math.max(0, (actualImprovement / totalImprovement) * 100),
            )
          : 0;

      // Determine status
      let status: "achieved" | "expired" | "replaced" = "replaced";
      if (currentAvg <= targetTime) {
        status = "achieved";
      } else if (existing.targetDate < now) {
        status = "expired";
      }

      // Archive the goal
      await ctx.db.insert("coachGoalHistory", {
        userId: args.userId,
        profileId: existing._id,
        goalType: existing.goalType,
        customGoalTime: existing.customGoalTime,
        primaryEvent: existing.primaryEvent,
        startDate: existing.createdAt,
        targetDate: existing.targetDate,
        endDate: now,
        startingAverage: existing.currentAverage,
        finalAverage: args.currentAverage,
        status,
        progressPercentage,
        createdAt: now,
      });
    }

    await ctx.db.patch(existing._id, {
      goalType: args.goalType,
      customGoalTime: args.customGoalTime,
      targetDate: args.targetDate,
      currentAverage: args.currentAverage ?? existing.currentAverage,
      createdAt: isGoalChange ? now : existing.createdAt, // Reset start date for new goals
      updatedAt: now,
    });

    return existing._id;
  },
});

// Get goal history for a user
export const getGoalHistory = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("coachGoalHistory")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc");

    if (args.limit) {
      return await query.take(args.limit);
    }
    return await query.collect();
  },
});

// Get goal history by WCA ID (for public profile display)
export const getGoalHistoryByWcaId = query({
  args: {
    wcaId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // First find the user by WCA ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_wca_id", (q) => q.eq("wcaId", args.wcaId))
      .first();

    if (!user) {
      return [];
    }

    const query = ctx.db
      .query("coachGoalHistory")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc");

    if (args.limit) {
      return await query.take(args.limit);
    }
    return await query.collect();
  },
});

// Get active training plan for user
export const getActiveTrainingPlan = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("coachTrainingPlans")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "active"),
      )
      .first();
  },
});

// Get all training plans for user
export const getTrainingPlans = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("coachTrainingPlans")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc");

    if (args.limit) {
      return await query.take(args.limit);
    }
    return await query.collect();
  },
});

// Generate weekly training plan with intelligent rule-based algorithm
export const generateTrainingPlan = mutation({
  args: {
    userId: v.id("users"),
    profileId: v.id("coachProfiles"),
    weekNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) throw new Error("Coach profile not found");

    const now = Date.now();
    const startOfWeek = getStartOfWeek(now);
    const endOfWeek = startOfWeek + 7 * 24 * 60 * 60 * 1000 - 1;

    // Mark any existing active plans as completed
    const existingActive = await ctx.db
      .query("coachTrainingPlans")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "active"),
      )
      .collect();

    for (const plan of existingActive) {
      await ctx.db.patch(plan._id, { status: "completed", updatedAt: now });
    }

    // Get recent journal entries for insights (last 2 weeks)
    const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;
    const recentJournals = await ctx.db
      .query("coachJournalEntries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gte(q.field("entryDate"), twoWeeksAgo))
      .collect();

    // Get previous training plans for progression tracking
    const previousPlans = await ctx.db
      .query("coachTrainingPlans")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(4);

    // Analyze user data for personalized plan
    const userAnalysis = analyzeUserData(
      profile,
      recentJournals,
      previousPlans,
    );

    // Generate daily plans based on comprehensive analysis
    const dailyPlans = generatePersonalizedDailyPlans(
      profile,
      userAnalysis,
      args.weekNumber,
      startOfWeek,
    );

    const planId = await ctx.db.insert("coachTrainingPlans", {
      userId: args.userId,
      profileId: args.profileId,
      weekNumber: args.weekNumber,
      weekStartDate: startOfWeek,
      weekEndDate: endOfWeek,
      status: "active",
      dailyPlans,
      completedDays: 0,
      totalDays: dailyPlans.filter((d) => !d.isRestDay).length,
      createdAt: now,
      updatedAt: now,
    });

    // Auto-create progress snapshot for the previous week (if week > 1)
    if (args.weekNumber > 1) {
      const prevWeekStart = startOfWeek - 7 * 24 * 60 * 60 * 1000;
      const prevWeekEnd = startOfWeek - 1;

      // Get journal entries from the previous week
      const prevWeekJournals = await ctx.db
        .query("coachJournalEntries")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) =>
          q.and(
            q.gte(q.field("entryDate"), prevWeekStart),
            q.lte(q.field("entryDate"), prevWeekEnd),
          ),
        )
        .collect();

      if (prevWeekJournals.length > 0) {
        // Calculate averages from journal entries
        const avgTimes = prevWeekJournals
          .filter((e) => e.customAverage || e.sessionAverage)
          .map((e) => e.customAverage || e.sessionAverage || 0);
        const averageTime =
          avgTimes.length > 0
            ? avgTimes.reduce((a, b) => a + b, 0) / avgTimes.length
            : profile.currentAverage || 30000;

        const totalSolves = prevWeekJournals.reduce(
          (sum, e) => sum + (e.customSolveCount || e.solveCount || 0),
          0,
        );
        const totalPracticeMinutes = prevWeekJournals.reduce(
          (sum, e) => sum + (e.practiceMinutes || 0),
          0,
        );

        // Calculate best times from journals
        const bestSingle = prevWeekJournals.reduce(
          (best, e) =>
            e.bestSingle && (best === 0 || e.bestSingle < best)
              ? e.bestSingle
              : best,
          0,
        );

        // Calculate progress percentage towards goal using logarithmic scale
        // This accounts for non-linear improvement in speedcubing:
        // Improving from 25s to 20s is much easier than 15s to 10s
        const targetTime =
          profile.customGoalTime || getTargetTimeMs(profile.goalType);
        const startTime = profile.currentAverage || targetTime * 1.5;

        // Use logarithmic scale for non-linear progress calculation
        const logStart = Math.log(startTime);
        const logGoal = Math.log(targetTime);
        const logCurrent = Math.log(averageTime);

        const totalLogImprovement = logStart - logGoal;
        const currentLogImprovement = logStart - logCurrent;

        const progressPercentage =
          totalLogImprovement > 0 && averageTime < startTime
            ? Math.min(
                100,
                Math.max(
                  0,
                  (currentLogImprovement / totalLogImprovement) * 100,
                ),
              )
            : averageTime <= targetTime
              ? 100
              : 0;

        // Check if on track based on time remaining vs progress
        const daysRemaining = Math.max(
          0,
          (profile.targetDate - now) / (24 * 60 * 60 * 1000),
        );
        const weeksRemaining = daysRemaining / 7;
        const expectedProgress =
          weeksRemaining > 0
            ? 100 - (weeksRemaining / (args.weekNumber + weeksRemaining)) * 100
            : 100;
        const onTrack = progressPercentage >= expectedProgress * 0.8; // Allow 20% buffer

        await ctx.db.insert("coachProgressSnapshots", {
          userId: args.userId,
          profileId: args.profileId,
          weekNumber: args.weekNumber - 1,
          averageTime,
          bestSingle: bestSingle > 0 ? bestSingle : undefined,
          bestAo5: undefined,
          bestAo12: undefined,
          totalSolves,
          totalPracticeMinutes,
          journalEntries: prevWeekJournals.length,
          progressPercentage: Math.round(progressPercentage * 10) / 10,
          onTrack,
          snapshotDate: now,
          createdAt: now,
        });
      }
    }

    return planId;
  },
});

// Update activity completion status
export const updateActivityCompletion = mutation({
  args: {
    planId: v.id("coachTrainingPlans"),
    dayIndex: v.number(),
    activityIndex: v.number(),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) throw new Error("Training plan not found");

    const now = Date.now();
    const dailyPlans = [...plan.dailyPlans];
    const day = { ...dailyPlans[args.dayIndex] };
    const activities = [...day.activities];

    activities[args.activityIndex] = {
      ...activities[args.activityIndex],
      completed: args.completed,
      completedAt: args.completed ? now : undefined,
    };

    day.activities = activities;
    day.isCompleted = activities.every((a) => a.completed);
    dailyPlans[args.dayIndex] = day;

    const completedDays = dailyPlans.filter(
      (d) => d.isCompleted && !d.isRestDay,
    ).length;

    await ctx.db.patch(args.planId, {
      dailyPlans,
      completedDays,
      updatedAt: now,
    });
  },
});

// Skip a training day (convert it to a rest day)
export const skipTrainingDay = mutation({
  args: {
    planId: v.id("coachTrainingPlans"),
    dayIndex: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) throw new Error("Training plan not found");

    const now = Date.now();
    const dailyPlans = [...plan.dailyPlans];
    const day = { ...dailyPlans[args.dayIndex] };

    // Skip the day by marking it as a rest day and completed
    day.isRestDay = true;
    day.isCompleted = true;
    day.focus = args.reason || "Skipped";
    day.activities = [];
    dailyPlans[args.dayIndex] = day;

    // Recalculate total non-rest days
    const totalDays = dailyPlans.filter((d) => !d.isRestDay).length;
    const completedDays = dailyPlans.filter(
      (d) => d.isCompleted && !d.isRestDay,
    ).length;

    await ctx.db.patch(args.planId, {
      dailyPlans,
      totalDays,
      completedDays,
      updatedAt: now,
    });
  },
});

// Get tasks for a specific date from training plan
export const getTasksForDate = query({
  args: {
    userId: v.id("users"),
    date: v.number(),
    dayOfWeek: v.optional(v.number()), // Allow client to specify day of week (0-6) to handle timezone differences, otherwise calculate from date
  },
  handler: async (ctx, args) => {
    // Get active training plan for this user
    const plans = await ctx.db
      .query("coachTrainingPlans")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    if (plans.length === 0) return null;

    const activePlan = plans[0];
    
    // Determine the target day of week (use provided value or calculate from date)
    const targetDayOfWeek = args.dayOfWeek !== undefined 
      ? args.dayOfWeek 
      : new Date(args.date).getUTCDay();
    
    // Check if the date is within the plan's week range (allowing for timezone differences)
    const dayMs = 24 * 60 * 60 * 1000;
    const isWithinWeekRange = 
      args.date >= (activePlan.weekStartDate - dayMs) && 
      args.date <= (activePlan.weekEndDate + dayMs);
    
    if (!isWithinWeekRange) return null;

    // Find the daily plan for the target day of week
    const dailyPlan = activePlan.dailyPlans?.find((d) => {
      return d.dayOfWeek === targetDayOfWeek;
    });

    if (!dailyPlan) return null;

    // Find the index of this day in the plan
    const dayIndex = activePlan.dailyPlans?.findIndex((d) => {
      return d.dayOfWeek === targetDayOfWeek;
    });

    return {
      planId: activePlan._id,
      dayIndex: dayIndex ?? -1,
      focus: dailyPlan.focus,
      isRestDay: dailyPlan.isRestDay,
      activities: dailyPlan.activities || [],
    };
  },
});

// Get journal entries for user
export const getJournalEntries = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("coachJournalEntries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc");

    const entries = await query.collect();

    // Filter by date range if provided
    let filtered = entries;
    if (args.startDate || args.endDate) {
      filtered = entries.filter((e) => {
        if (args.startDate && e.entryDate < args.startDate) return false;
        if (args.endDate && e.entryDate > args.endDate) return false;
        return true;
      });
    }

    if (args.limit) {
      return filtered.slice(0, args.limit);
    }
    return filtered;
  },
});

// Get journal entry for a specific date
export const getJournalEntryByDate = query({
  args: { userId: v.id("users"), date: v.number() },
  handler: async (ctx, args) => {
    const startOfDay = getStartOfDay(args.date);
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;

    const entries = await ctx.db
      .query("coachJournalEntries")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .collect();

    return (
      entries.find(
        (e) => e.entryDate >= startOfDay && e.entryDate <= endOfDay,
      ) || null
    );
  },
});

// Get journal entry by ID
export const getJournalEntryById = query({
  args: { entryId: v.id("coachJournalEntries") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.entryId);
  },
});

// Create or update journal entry
export const saveJournalEntry = mutation({
  args: {
    entryId: v.optional(v.id("coachJournalEntries")), // Optional: only for updates
    userId: v.id("users"),
    profileId: v.id("coachProfiles"),
    planId: v.optional(v.id("coachTrainingPlans")),
    entryDate: v.number(),
    linkedSessionId: v.optional(v.id("sessions")),
    solveCount: v.optional(v.number()),
    sessionAverage: v.optional(v.number()),
    bestSingle: v.optional(v.number()),
    practiceMinutes: v.optional(v.number()),
    customAverage: v.optional(v.number()),
    customSolveCount: v.optional(v.number()),
    mood: v.union(
      v.literal("great"),
      v.literal("good"),
      v.literal("okay"),
      v.literal("frustrated"),
      v.literal("tired"),
    ),
    wentWell: v.optional(v.string()),
    challenges: v.optional(v.string()),
    notes: v.optional(v.string()),
    focusAreas: v.optional(v.array(v.string())),
    completedActivities: v.optional(v.array(v.string())),
    completedTaskIndices: v.optional(v.array(v.number())),
    mediaUrls: v.optional(v.array(v.string())),
    mediaFileIds: v.optional(v.array(v.string())),
    mediaTypes: v.optional(v.array(v.string())), // MIME types of media files
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const { entryId, ...entryData } = args;

    // If entryId is provided, update the existing entry
    if (entryId) {
      const existing = await ctx.db.get(entryId);
      if (!existing) {
        throw new Error("Entry not found");
      }
      if (existing.userId !== args.userId) {
        throw new Error("Unauthorized");
      }
      await ctx.db.patch(entryId, {
        ...entryData,
        updatedAt: now,
      });
      return entryId;
    }

    // Otherwise, create a new entry (allow multiple entries per day)
    return await ctx.db.insert("coachJournalEntries", {
      ...entryData,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Delete journal entry
export const deleteJournalEntry = mutation({
  args: {
    entryId: v.id("coachJournalEntries"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw new Error("Entry not found");
    }
    if (entry.userId !== args.userId) {
      throw new Error("Unauthorized");
    }

    // Get media file IDs before deleting so client can clean up Appwrite
    const mediaFileIds = entry.mediaFileIds || [];

    await ctx.db.delete(args.entryId);
    return { success: true, mediaFileIds };
  },
});

// Get progress snapshots
export const getProgressSnapshots = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("coachProgressSnapshots")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc");

    if (args.limit) {
      return await query.take(args.limit);
    }
    return await query.collect();
  },
});

// Create progress snapshot
export const createProgressSnapshot = mutation({
  args: {
    userId: v.id("users"),
    profileId: v.id("coachProfiles"),
    weekNumber: v.number(),
    averageTime: v.number(),
    bestSingle: v.optional(v.number()),
    bestAo5: v.optional(v.number()),
    bestAo12: v.optional(v.number()),
    totalSolves: v.number(),
    totalPracticeMinutes: v.number(),
    journalEntries: v.number(),
    progressPercentage: v.number(),
    onTrack: v.boolean(),
    aiInsights: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert("coachProgressSnapshots", {
      ...args,
      snapshotDate: now,
      createdAt: now,
    });
  },
});

// Get user sessions for selection
export const getUserSessions = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Get user sessions with 3x3 solve counts for coach selection
export const getUserSessionsWith3x3Stats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // Get 3x3 solve counts for each session
    const sessionsWithStats = await Promise.all(
      sessions.map(async (session) => {
        const solves = await ctx.db
          .query("solves")
          .withIndex("by_session", (q) => q.eq("sessionId", session._id))
          .collect();

        // Filter to only 3x3 solves
        const solves3x3 = solves.filter((s) => s.event === "333");

        return {
          ...session,
          solveCount3x3: solves3x3.length,
        };
      }),
    );

    return sessionsWithStats;
  },
});

// Get session stats for baseline calculation (3x3 only)
export const getSessionStats = query({
  args: { sessionId: v.id("sessions"), event: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const eventFilter = args.event || "333"; // Default to 3x3

    const solves = await ctx.db
      .query("solves")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    // Filter by event (default to 3x3)
    const eventSolves = solves.filter((s) => s.event === eventFilter);

    if (eventSolves.length === 0) {
      return null;
    }

    const validSolves = eventSolves.filter(
      (s) => s.penalty !== "DNF" && isFinite(s.finalTime),
    );

    if (validSolves.length === 0) {
      return {
        solveCount: eventSolves.length,
        average: null,
        bestSingle: null,
      };
    }

    const times = validSolves.map((s) => s.finalTime);
    const average = times.reduce((a, b) => a + b, 0) / times.length;
    const bestSingle = Math.min(...times);

    return {
      solveCount: eventSolves.length,
      average: Math.round(average),
      bestSingle,
    };
  },
});

// Get comprehensive progress statistics for the progress tab
export const getProgressStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const todayStart = getStartOfDay(now);
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
    const yearAgo = now - 365 * 24 * 60 * 60 * 1000;

    // Get all journal entries for the user
    const allJournalEntries = await ctx.db
      .query("coachJournalEntries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Get all training plans
    const allPlans = await ctx.db
      .query("coachTrainingPlans")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Get profile for goal info
    const profile = await ctx.db
      .query("coachProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    // Calculate streak (consecutive days with journal entries)
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Sort entries by date descending
    const sortedEntries = [...allJournalEntries].sort(
      (a, b) => b.entryDate - a.entryDate,
    );

    // Calculate current streak (from today going backwards)
    if (sortedEntries.length > 0) {
      const today = getStartOfDay(now);
      const yesterday = today - 24 * 60 * 60 * 1000;

      // Check if there's an entry today or yesterday to start the streak
      const firstEntryDay = getStartOfDay(sortedEntries[0].entryDate);
      if (firstEntryDay === today || firstEntryDay === yesterday) {
        currentStreak = 1;
        let checkDate = firstEntryDay - 24 * 60 * 60 * 1000;

        for (let i = 1; i < sortedEntries.length; i++) {
          const entryDay = getStartOfDay(sortedEntries[i].entryDate);
          if (entryDay === checkDate) {
            currentStreak++;
            checkDate -= 24 * 60 * 60 * 1000;
          } else if (entryDay < checkDate) {
            break;
          }
        }
      }

      // Calculate longest streak
      const uniqueDays = new Set(
        sortedEntries.map((e) => getStartOfDay(e.entryDate)),
      );
      const sortedDays = Array.from(uniqueDays).sort((a, b) => a - b);

      for (let i = 0; i < sortedDays.length; i++) {
        if (
          i === 0 ||
          sortedDays[i] - sortedDays[i - 1] === 24 * 60 * 60 * 1000
        ) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }

    // Weekly stats
    const weeklyEntries = allJournalEntries.filter(
      (e) => e.entryDate >= weekAgo,
    );
    const weeklyPracticeMinutes = weeklyEntries.reduce(
      (sum, e) => sum + (e.practiceMinutes || 0),
      0,
    );
    const weeklySolves = weeklyEntries.reduce(
      (sum, e) => sum + (e.customSolveCount || e.solveCount || 0),
      0,
    );
    const weeklyAvgTimes = weeklyEntries
      .filter((e) => e.customAverage || e.sessionAverage)
      .map((e) => e.customAverage || e.sessionAverage || 0);
    const weeklyAverage =
      weeklyAvgTimes.length > 0
        ? weeklyAvgTimes.reduce((a, b) => a + b, 0) / weeklyAvgTimes.length
        : null;

    // Monthly stats
    const monthlyEntries = allJournalEntries.filter(
      (e) => e.entryDate >= monthAgo,
    );
    const monthlyPracticeMinutes = monthlyEntries.reduce(
      (sum, e) => sum + (e.practiceMinutes || 0),
      0,
    );
    const monthlySolves = monthlyEntries.reduce(
      (sum, e) => sum + (e.customSolveCount || e.solveCount || 0),
      0,
    );
    const monthlyAvgTimes = monthlyEntries
      .filter((e) => e.customAverage || e.sessionAverage)
      .map((e) => e.customAverage || e.sessionAverage || 0);
    const monthlyAverage =
      monthlyAvgTimes.length > 0
        ? monthlyAvgTimes.reduce((a, b) => a + b, 0) / monthlyAvgTimes.length
        : null;

    // Previous month stats for comparison
    const twoMonthsAgo = now - 60 * 24 * 60 * 60 * 1000;
    const prevMonthEntries = allJournalEntries.filter(
      (e) => e.entryDate >= twoMonthsAgo && e.entryDate < monthAgo,
    );
    const prevMonthAvgTimes = prevMonthEntries
      .filter((e) => e.customAverage || e.sessionAverage)
      .map((e) => e.customAverage || e.sessionAverage || 0);
    const prevMonthAverage =
      prevMonthAvgTimes.length > 0
        ? prevMonthAvgTimes.reduce((a, b) => a + b, 0) /
          prevMonthAvgTimes.length
        : null;

    // Calculate learning velocity (improvement rate per month)
    let learningVelocity: number | null = null;
    if (monthlyAverage && prevMonthAverage) {
      learningVelocity = prevMonthAverage - monthlyAverage; // Positive = improving
    }

    // Previous year stats for comparison
    const prevYearStart = yearAgo - 365 * 24 * 60 * 60 * 1000;
    const prevYearEntries = allJournalEntries.filter(
      (e) => e.entryDate >= prevYearStart && e.entryDate < yearAgo,
    );
    const prevYearAvgTimes = prevYearEntries
      .filter((e) => e.customAverage || e.sessionAverage)
      .map((e) => e.customAverage || e.sessionAverage || 0);
    const prevYearAverage =
      prevYearAvgTimes.length > 0
        ? prevYearAvgTimes.reduce((a, b) => a + b, 0) / prevYearAvgTimes.length
        : null;

    // Calculate consistency (standard deviation trend)
    // Lower std dev = more consistent
    const calcStdDev = (times: number[]): number => {
      if (times.length < 2) return 0;
      const mean = times.reduce((a, b) => a + b, 0) / times.length;
      const variance =
        times.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / times.length;
      return Math.sqrt(variance);
    };

    const currentStdDev =
      weeklyAvgTimes.length >= 2 ? calcStdDev(weeklyAvgTimes) : null;

    // Calculate std dev from previous week
    const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;
    const prevWeekEntries = allJournalEntries.filter(
      (e) => e.entryDate >= twoWeeksAgo && e.entryDate < weekAgo,
    );
    const prevWeekAvgTimes = prevWeekEntries
      .filter((e) => e.customAverage || e.sessionAverage)
      .map((e) => e.customAverage || e.sessionAverage || 0);
    const prevStdDev =
      prevWeekAvgTimes.length >= 2 ? calcStdDev(prevWeekAvgTimes) : null;

    // Calculate consistency improvement
    let consistencyImprovement: number | null = null;
    if (currentStdDev !== null && prevStdDev !== null && prevStdDev > 0) {
      consistencyImprovement =
        ((prevStdDev - currentStdDev) / prevStdDev) * 100;
    }

    // Active days count per period
    const getUniqueDays = (entries: typeof allJournalEntries) => {
      return new Set(entries.map((e) => getStartOfDay(e.entryDate))).size;
    };

    const weeklyActiveDays = getUniqueDays(weeklyEntries);
    const monthlyActiveDays = getUniqueDays(monthlyEntries);

    // Training plan completion rate
    const completedPlans = allPlans.filter((p) => p.status === "completed");
    const totalCompletedTasks = allPlans.reduce(
      (sum, p) => sum + p.completedDays,
      0,
    );
    const totalTasks = allPlans.reduce((sum, p) => sum + p.totalDays, 0);
    const completionRate =
      totalTasks > 0 ? (totalCompletedTasks / totalTasks) * 100 : 0;

    // Mood distribution for the month
    const moodCounts = {
      great: 0,
      good: 0,
      okay: 0,
      frustrated: 0,
      tired: 0,
    };
    monthlyEntries.forEach((e) => {
      moodCounts[e.mood]++;
    });

    // All-time stats
    const allTimePracticeMinutes = allJournalEntries.reduce(
      (sum, e) => sum + (e.practiceMinutes || 0),
      0,
    );
    const allTimeSolves = allJournalEntries.reduce(
      (sum, e) => sum + (e.customSolveCount || e.solveCount || 0),
      0,
    );

    return {
      // Streak data
      currentStreak,
      longestStreak,

      // Weekly summary
      weekly: {
        activeDays: weeklyActiveDays,
        practiceMinutes: weeklyPracticeMinutes,
        solves: weeklySolves,
        average: weeklyAverage,
        entries: weeklyEntries.length,
      },

      // Monthly summary
      monthly: {
        activeDays: monthlyActiveDays,
        practiceMinutes: monthlyPracticeMinutes,
        solves: monthlySolves,
        average: monthlyAverage,
        entries: monthlyEntries.length,
      },

      // Comparison stats
      comparison: {
        monthlyImprovement:
          prevMonthAverage && monthlyAverage
            ? prevMonthAverage - monthlyAverage
            : null,
        yearlyImprovement:
          prevYearAverage && monthlyAverage
            ? prevYearAverage - monthlyAverage
            : null,
        prevMonthAverage,
        prevYearAverage,
      },

      // Learning metrics
      learningVelocity,
      consistencyImprovement,
      currentStdDev,

      // Training plan stats
      completionRate,
      totalPlans: allPlans.length,
      completedPlans: completedPlans.length,

      // Mood distribution
      moodDistribution: moodCounts,

      // All-time stats
      allTime: {
        practiceMinutes: allTimePracticeMinutes,
        solves: allTimeSolves,
        entries: allJournalEntries.length,
      },
    };
  },
});

// Helper functions
function getStartOfWeek(timestamp: number): number {
  const date = new Date(timestamp);
  const day = date.getDay();
  const diff = date.getDate() - day;
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function getStartOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

// INTELLIGENT TRAINING PLAN ALGORITHM

// Types for the training algorithm
interface UserAnalysis {
  currentLevel:
    | "absolute-beginner"
    | "beginner"
    | "intermediate"
    | "sub-20"
    | "sub-15"
    | "advanced"
    | "expert";
  currentAverageMs: number;
  targetAverageMs: number;
  daysToGoal: number;
  weeklyProgressNeeded: number; // ms improvement needed per week
  recentMoodTrend: "positive" | "neutral" | "struggling";
  recentPracticeConsistency: number; // 0-1 score
  focusAreasFromJournals: string[];
  challengesFromJournals: string[];
  completionRate: number; // Previous plan completion rate 0-1
  primaryWeakness: string | null;
  isNewUser: boolean;
}

interface TrainingActivity {
  type:
    | "timed-solves"
    | "untimed-practice"
    | "algorithm-drill"
    | "slow-solves"
    | "reconstruction"
    | "cross-practice"
    | "f2l-practice"
    | "lookahead-training"
    | "competition-sim"
    | "rest";
  title: string;
  description: string;
  durationMinutes: number;
  targetSolves?: number;
  completed: boolean;
}

interface DailyPlan {
  dayOfWeek: number;
  date: number;
  focus: string;
  activities: TrainingActivity[];
  isCompleted: boolean;
  isRestDay: boolean;
}

// Convert goal type to target time in milliseconds
function getTargetTimeMs(goalType: string, customGoalTime?: number): number {
  const goalMap: Record<string, number> = {
    "sub-60": 60000,
    "sub-45": 45000,
    "sub-30": 30000,
    "sub-20": 20000,
    "sub-15": 15000,
    "sub-12": 12000,
    "sub-10": 10000,
    "sub-8": 8000,
    custom: customGoalTime || 30000,
  };
  return goalMap[goalType] || 30000;
}

// Determine current level based on average time
function getCurrentLevelFromAverage(
  averageMs: number,
): UserAnalysis["currentLevel"] {
  if (averageMs > 120000) return "absolute-beginner"; // > 2 minutes
  if (averageMs > 60000) return "beginner"; // 1-2 minutes
  if (averageMs > 30000) return "intermediate"; // 30-60 seconds
  if (averageMs > 20000) return "sub-20"; // 20-30 seconds
  if (averageMs > 15000) return "sub-15"; // 15-20 seconds
  if (averageMs > 10000) return "advanced"; // 10-15 seconds
  return "expert"; // < 10 seconds
}

// Analyze user data to create personalized insights
function analyzeUserData(
  profile: {
    currentAverage?: number;
    skillLevel: string;
    goalType: string;
    customGoalTime?: number;
    targetDate: number;
    dailyPracticeMinutes: number;
  },
  recentJournals: Array<{
    mood: string;
    focusAreas?: string[];
    challenges?: string;
    wentWell?: string;
    practiceMinutes?: number;
    completedTaskIndices?: number[];
  }>,
  previousPlans: Array<{
    dailyPlans: DailyPlan[];
    completedDays: number;
    totalDays: number;
  }>,
): UserAnalysis {
  const now = Date.now();
  const targetMs = getTargetTimeMs(profile.goalType, profile.customGoalTime);
  const currentAvgMs =
    profile.currentAverage || getEstimatedAverageFromLevel(profile.skillLevel);

  // Calculate days to goal
  const daysToGoal = Math.max(
    1,
    Math.floor((profile.targetDate - now) / (24 * 60 * 60 * 1000)),
  );
  const weeksToGoal = Math.max(1, Math.floor(daysToGoal / 7));

  // Calculate required weekly progress
  const totalImprovementNeeded = Math.max(0, currentAvgMs - targetMs);
  const weeklyProgressNeeded = totalImprovementNeeded / weeksToGoal;

  // Analyze mood trend from journals
  const moodScores: Record<string, number> = {
    great: 5,
    good: 4,
    okay: 3,
    frustrated: 2,
    tired: 1,
  };
  const recentMoods = recentJournals
    .slice(0, 7)
    .map((j) => moodScores[j.mood] || 3);
  const avgMood =
    recentMoods.length > 0
      ? recentMoods.reduce((a, b) => a + b, 0) / recentMoods.length
      : 3;
  const recentMoodTrend: UserAnalysis["recentMoodTrend"] =
    avgMood >= 3.5 ? "positive" : avgMood >= 2.5 ? "neutral" : "struggling";

  // Calculate practice consistency
  const expectedJournals = Math.min(14, daysToGoal); // Max 2 weeks of data
  const recentPracticeConsistency = Math.min(
    1,
    recentJournals.length / Math.max(1, expectedJournals / 2),
  );

  // Extract focus areas and challenges from journals
  const focusAreasFromJournals: string[] = [];
  const challengesFromJournals: string[] = [];

  recentJournals.forEach((j) => {
    if (j.focusAreas) focusAreasFromJournals.push(...j.focusAreas);
    if (j.challenges) challengesFromJournals.push(j.challenges);
  });

  // Calculate previous plan completion rate
  let completionRate = 0.7; // Default for new users
  if (previousPlans.length > 0) {
    const totalCompleted = previousPlans.reduce(
      (sum, p) => sum + p.completedDays,
      0,
    );
    const totalDays = previousPlans.reduce((sum, p) => sum + p.totalDays, 0);
    completionRate = totalDays > 0 ? totalCompleted / totalDays : 0.7;
  }

  // Identify primary weakness from challenges
  const weaknessKeywords = {
    cross: ["cross", "planning", "inspection"],
    f2l: ["f2l", "pairs", "insertion", "slot"],
    oll: ["oll", "orientation", "last layer"],
    pll: ["pll", "permutation"],
    lookahead: ["lookahead", "looking ahead", "tracking"],
    fingertricks: ["fingertrick", "finger", "turning"],
    recognition: ["recognition", "recognize", "identify"],
  };

  let primaryWeakness: string | null = null;
  const challengeText = challengesFromJournals.join(" ").toLowerCase();
  for (const [weakness, keywords] of Object.entries(weaknessKeywords)) {
    if (keywords.some((kw) => challengeText.includes(kw))) {
      primaryWeakness = weakness;
      break;
    }
  }

  return {
    currentLevel: getCurrentLevelFromAverage(currentAvgMs),
    currentAverageMs: currentAvgMs,
    targetAverageMs: targetMs,
    daysToGoal,
    weeklyProgressNeeded,
    recentMoodTrend,
    recentPracticeConsistency,
    focusAreasFromJournals: [...new Set(focusAreasFromJournals)],
    challengesFromJournals,
    completionRate,
    primaryWeakness,
    isNewUser: previousPlans.length === 0 && recentJournals.length === 0,
  };
}

// Estimate average from skill level when no data available
function getEstimatedAverageFromLevel(skillLevel: string): number {
  const levelMap: Record<string, number> = {
    beginner: 90000, // 1:30
    intermediate: 40000, // 40s
    advanced: 18000, // 18s
    expert: 10000, // 10s
  };
  return levelMap[skillLevel] || 60000;
}

// Generate personalized daily plans based on analysis
function generatePersonalizedDailyPlans(
  profile: {
    dailyPracticeMinutes: number;
    practiceSchedule?: string[];
    skillLevel: string;
    goalType: string;
  },
  analysis: UserAnalysis,
  weekNumber: number,
  weekStart: number,
): DailyPlan[] {
  const plans: DailyPlan[] = [];
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const activeDays = profile.practiceSchedule || daysOfWeek;

  // Get appropriate training modules for user's level
  const trainingModules = getTrainingModulesForLevel(
    analysis,
    profile.dailyPracticeMinutes,
  );

  for (let i = 0; i < 7; i++) {
    const dayDate = weekStart + i * 24 * 60 * 60 * 1000;
    const dayName = daysOfWeek[i];
    const isRestDay = !activeDays.includes(dayName);

    if (isRestDay) {
      plans.push({
        dayOfWeek: i,
        date: dayDate,
        focus: "Rest Day",
        activities: [
          {
            type: "rest",
            title: "Rest & Recovery",
            description:
              "Take a break from cubing. Let your muscles and mind recover.",
            durationMinutes: 0,
            completed: false,
          },
        ],
        isCompleted: false,
        isRestDay: true,
      });
    } else {
      // Select appropriate training for this day based on rotation
      const dayPlan = selectDayTraining(
        analysis,
        trainingModules,
        i,
        weekNumber,
        profile.dailyPracticeMinutes,
      );

      plans.push({
        dayOfWeek: i,
        date: dayDate,
        focus: dayPlan.focus,
        activities: dayPlan.activities,
        isCompleted: false,
        isRestDay: false,
      });
    }
  }

  return plans;
}

// Get training modules appropriate for user's level
function getTrainingModulesForLevel(
  analysis: UserAnalysis,
  dailyMinutes: number,
): Record<string, { focus: string; activities: TrainingActivity[] }[]> {
  const level = analysis.currentLevel;
  const timePerActivity = Math.floor(dailyMinutes / 3);

  // Modules are organized by training focus
  const modules: Record<
    string,
    { focus: string; activities: TrainingActivity[] }[]
  > = {
    foundation: [],
    technique: [],
    speed: [],
    competition: [],
    weakness: [],
  };

  // ======== ABSOLUTE BEGINNER (> 2 min) ========
  if (level === "absolute-beginner") {
    modules.foundation = [
      {
        focus: "Learn the Method",
        activities: [
          {
            type: "untimed-practice",
            title: "Method Practice",
            description:
              "Practice solving the cube step by step. Focus on completing solves, not speed.",
            durationMinutes: Math.floor(dailyMinutes * 0.4),
            completed: false,
          },
          {
            type: "cross-practice",
            title: "Cross Foundation",
            description:
              "Practice making the white cross. Start with 2 pieces, then 3, then 4.",
            durationMinutes: Math.floor(dailyMinutes * 0.3),
            targetSolves: Math.floor(dailyMinutes / 5),
            completed: false,
          },
          {
            type: "slow-solves",
            title: "Guided Solves",
            description:
              "Complete full solves with guidance if needed. The goal is consistency.",
            durationMinutes: Math.floor(dailyMinutes * 0.3),
            targetSolves: Math.floor(dailyMinutes / 8),
            completed: false,
          },
        ],
      },
      {
        focus: "Build Confidence",
        activities: [
          {
            type: "untimed-practice",
            title: "Repetition Practice",
            description:
              "Repeat solves until you can do them without help. No timer pressure.",
            durationMinutes: Math.floor(dailyMinutes * 0.5),
            completed: false,
          },
          {
            type: "algorithm-drill",
            title: "Basic Algorithm Review",
            description:
              "Practice the algorithms you've learned. Say them out loud as you do them.",
            durationMinutes: Math.floor(dailyMinutes * 0.25),
            completed: false,
          },
          {
            type: "slow-solves",
            title: "Complete Solves",
            description: "Do complete solves from start to finish.",
            durationMinutes: Math.floor(dailyMinutes * 0.25),
            targetSolves: Math.floor(dailyMinutes / 10),
            completed: false,
          },
        ],
      },
    ];

    modules.technique = modules.foundation; // Same for beginners
    modules.speed = [
      {
        focus: "First Timed Solves",
        activities: [
          {
            type: "slow-solves",
            title: "Warm-up Solves",
            description: "Start with untimed solves to get comfortable.",
            durationMinutes: Math.floor(dailyMinutes * 0.3),
            targetSolves: 3,
            completed: false,
          },
          {
            type: "timed-solves",
            title: "Your First Times",
            description:
              "Try some timed solves. Don't worry about the time, just complete them!",
            durationMinutes: Math.floor(dailyMinutes * 0.5),
            targetSolves: Math.floor(dailyMinutes / 8),
            completed: false,
          },
          {
            type: "untimed-practice",
            title: "Practice Weak Steps",
            description: "Practice the steps that slowed you down the most.",
            durationMinutes: Math.floor(dailyMinutes * 0.2),
            completed: false,
          },
        ],
      },
    ];
  }

  // ======== BEGINNER (1-2 min) ========
  else if (level === "beginner") {
    modules.foundation = [
      {
        focus: "Cross Efficiency",
        activities: [
          {
            type: "cross-practice",
            title: "Cross Practice",
            description:
              "Practice solving the cross in 8 moves or less. Use inspection time to plan.",
            durationMinutes: timePerActivity,
            targetSolves: Math.floor(timePerActivity / 1.5),
            completed: false,
          },
          {
            type: "slow-solves",
            title: "Mindful Solves",
            description:
              "Slow, deliberate solves. Think about each move before making it.",
            durationMinutes: timePerActivity,
            targetSolves: Math.floor(timePerActivity / 5),
            completed: false,
          },
          {
            type: "timed-solves",
            title: "Practice Solves",
            description: "Regular timed solves to track your progress.",
            durationMinutes: timePerActivity,
            targetSolves: Math.floor(timePerActivity / 3),
            completed: false,
          },
        ],
      },
      {
        focus: "F2L Introduction",
        activities: [
          {
            type: "f2l-practice",
            title: "F2L Basics",
            description:
              "Learn to pair corner and edge pieces. Start with easy cases.",
            durationMinutes: timePerActivity,
            completed: false,
          },
          {
            type: "algorithm-drill",
            title: "Basic F2L Cases",
            description: "Practice the 4-5 most common F2L insertion cases.",
            durationMinutes: timePerActivity,
            completed: false,
          },
          {
            type: "timed-solves",
            title: "Apply F2L",
            description: "Try using intuitive F2L in your timed solves.",
            durationMinutes: timePerActivity,
            targetSolves: Math.floor(timePerActivity / 3),
            completed: false,
          },
        ],
      },
    ];

    modules.technique = [
      {
        focus: "Last Layer Basics",
        activities: [
          {
            type: "algorithm-drill",
            title: "2-Look OLL",
            description:
              "Practice the 2-look OLL algorithms. Focus on edge orientation first.",
            durationMinutes: timePerActivity,
            completed: false,
          },
          {
            type: "algorithm-drill",
            title: "2-Look PLL",
            description: "Practice 2-look PLL. Focus on T-perm and U-perms.",
            durationMinutes: timePerActivity,
            completed: false,
          },
          {
            type: "timed-solves",
            title: "Full Solve Practice",
            description: "Apply what you learned in full solves.",
            durationMinutes: timePerActivity,
            targetSolves: Math.floor(timePerActivity / 3),
            completed: false,
          },
        ],
      },
    ];

    modules.speed = [
      {
        focus: "Speed Building",
        activities: [
          {
            type: "timed-solves",
            title: "Warm-up Averages",
            description: "Start with an ao5 to warm up your hands.",
            durationMinutes: Math.floor(timePerActivity * 0.8),
            targetSolves: 5,
            completed: false,
          },
          {
            type: "timed-solves",
            title: "Speed Session",
            description: "Focus on turning faster. Accept some mistakes.",
            durationMinutes: Math.floor(timePerActivity * 1.2),
            targetSolves: Math.floor(dailyMinutes / 2.5),
            completed: false,
          },
          {
            type: "slow-solves",
            title: "Cool Down",
            description: "End with slow solves focusing on accuracy.",
            durationMinutes: timePerActivity,
            targetSolves: Math.floor(timePerActivity / 5),
            completed: false,
          },
        ],
      },
    ];
  }

  // ======== INTERMEDIATE (30-60s) ========
  else if (level === "intermediate") {
    modules.foundation = [
      {
        focus: "Cross + F2L Connection",
        activities: [
          {
            type: "cross-practice",
            title: "Planned Cross",
            description:
              "Plan the entire cross during inspection. Practice color neutral if ready.",
            durationMinutes: timePerActivity,
            targetSolves: Math.floor(timePerActivity),
            completed: false,
          },
          {
            type: "f2l-practice",
            title: "Cross to First Pair",
            description:
              "Focus on smooth transition from cross to F2L. Track first pair while solving cross.",
            durationMinutes: timePerActivity,
            completed: false,
          },
          {
            type: "timed-solves",
            title: "Timed Practice",
            description: "Apply cross planning in timed solves.",
            durationMinutes: timePerActivity,
            targetSolves: Math.floor(timePerActivity / 2),
            completed: false,
          },
        ],
      },
    ];

    modules.technique = [
      {
        focus: "F2L Efficiency",
        activities: [
          {
            type: "f2l-practice",
            title: "Advanced F2L Cases",
            description:
              "Learn efficient solutions for difficult cases. Focus on reducing rotations.",
            durationMinutes: timePerActivity,
            completed: false,
          },
          {
            type: "slow-solves",
            title: "Efficient Solves",
            description:
              "Slow solves focusing on move count. Aim for sub-50 move solutions.",
            durationMinutes: timePerActivity,
            targetSolves: Math.floor(timePerActivity / 4),
            completed: false,
          },
          {
            type: "timed-solves",
            title: "Apply Efficiency",
            description: "Use efficient solutions in timed practice.",
            durationMinutes: timePerActivity,
            targetSolves: Math.floor(timePerActivity / 2),
            completed: false,
          },
        ],
      },
      {
        focus: "Lookahead Training",
        activities: [
          {
            type: "lookahead-training",
            title: "Pair Tracking",
            description:
              "Practice tracking next pair while inserting current one. Turn at 50% speed.",
            durationMinutes: timePerActivity,
            completed: false,
          },
          {
            type: "slow-solves",
            title: "Continuous Turning",
            description:
              "Never stop turning. Slow down instead of pausing to look.",
            durationMinutes: timePerActivity,
            targetSolves: Math.floor(timePerActivity / 4),
            completed: false,
          },
          {
            type: "timed-solves",
            title: "Lookahead Application",
            description:
              "Practice lookahead in timed solves. Accept slower times initially.",
            durationMinutes: timePerActivity,
            targetSolves: Math.floor(timePerActivity / 2),
            completed: false,
          },
        ],
      },
    ];

    modules.speed = [
      {
        focus: "Full OLL Learning",
        activities: [
          {
            type: "algorithm-drill",
            title: "New OLL Cases",
            description:
              "Learn 3-4 new OLL algorithms. Start with the most common cases.",
            durationMinutes: timePerActivity,
            completed: false,
          },
          {
            type: "algorithm-drill",
            title: "OLL Recognition",
            description: "Practice recognizing OLL cases quickly.",
            durationMinutes: timePerActivity,
            completed: false,
          },
          {
            type: "timed-solves",
            title: "OLL Integration",
            description: "Use new OLLs in timed solves.",
            durationMinutes: timePerActivity,
            targetSolves: Math.floor(timePerActivity / 2),
            completed: false,
          },
        ],
      },
    ];

    modules.competition = [
      {
        focus: "Competition Preparation",
        activities: [
          {
            type: "competition-sim",
            title: "Competition Simulation",
            description:
              "Do a full ao5 as if in competition. Proper inspection, judge calls, etc.",
            durationMinutes: dailyMinutes,
            targetSolves: 5,
            completed: false,
          },
        ],
      },
    ];
  }

  // ======== SUB-20 to SUB-15 (15-30s) ========
  else if (level === "sub-20" || level === "sub-15") {
    modules.foundation = [
      {
        focus: "Advanced Cross",
        activities: [
          {
            type: "cross-practice",
            title: "Optimal Cross",
            description:
              "Practice finding optimal (7-8 move) cross solutions. Consider color neutral.",
            durationMinutes: timePerActivity,
            targetSolves: Math.floor(timePerActivity * 1.5),
            completed: false,
          },
          {
            type: "lookahead-training",
            title: "Cross + 1",
            description: "Plan cross and first F2L pair during inspection.",
            durationMinutes: timePerActivity,
            completed: false,
          },
          {
            type: "timed-solves",
            title: "Speed Solves",
            description: "High intensity timed practice.",
            durationMinutes: timePerActivity,
            targetSolves: Math.floor(timePerActivity / 1.5),
            completed: false,
          },
        ],
      },
    ];

    modules.technique = [
      {
        focus: "F2L Mastery",
        activities: [
          {
            type: "f2l-practice",
            title: "Difficult Cases",
            description:
              "Master the hardest F2L cases. Learn multiple solutions for flexibility.",
            durationMinutes: timePerActivity,
            completed: false,
          },
          {
            type: "lookahead-training",
            title: "Full F2L Lookahead",
            description:
              "Practice tracking all pieces. Know your next 2 pairs.",
            durationMinutes: timePerActivity,
            completed: false,
          },
          {
            type: "timed-solves",
            title: "Smooth F2L",
            description: "Focus on pause-free F2L with continuous lookahead.",
            durationMinutes: timePerActivity,
            targetSolves: Math.floor(timePerActivity / 1.5),
            completed: false,
          },
        ],
      },
      {
        focus: "Full PLL Mastery",
        activities: [
          {
            type: "algorithm-drill",
            title: "PLL Speed Drill",
            description:
              "Drill all 21 PLLs for speed. Aim for sub-2 on every case.",
            durationMinutes: timePerActivity,
            completed: false,
          },
          {
            type: "algorithm-drill",
            title: "PLL Recognition",
            description:
              "Practice 2-side PLL recognition for instant identification.",
            durationMinutes: timePerActivity,
            completed: false,
          },
          {
            type: "timed-solves",
            title: "Fast Last Layer",
            description: "Focus on fast LL execution in solves.",
            durationMinutes: timePerActivity,
            targetSolves: Math.floor(timePerActivity / 1.5),
            completed: false,
          },
        ],
      },
    ];

    modules.speed = [
      {
        focus: "TPS Training",
        activities: [
          {
            type: "algorithm-drill",
            title: "Fingertrick Drills",
            description:
              "Practice fingertricks in isolation. Improve TPS on each algorithm.",
            durationMinutes: timePerActivity,
            completed: false,
          },
          {
            type: "timed-solves",
            title: "Sprint Solves",
            description:
              "Short bursts of maximum speed solves. Push your TPS limits.",
            durationMinutes: Math.floor(timePerActivity * 1.5),
            targetSolves: Math.floor(dailyMinutes / 1.2),
            completed: false,
          },
          {
            type: "slow-solves",
            title: "Technique Reset",
            description:
              "Slow solves to maintain good habits after speed training.",
            durationMinutes: Math.floor(timePerActivity * 0.5),
            targetSolves: 3,
            completed: false,
          },
        ],
      },
    ];

    modules.competition = [
      {
        focus: "Competition Simulation",
        activities: [
          {
            type: "competition-sim",
            title: "Full Round Simulation",
            description:
              "Simulate a full competition round with proper timing and pressure.",
            durationMinutes: dailyMinutes,
            targetSolves: 5,
            completed: false,
          },
        ],
      },
    ];
  }

  // ======== ADVANCED / EXPERT (< 15s) ========
  else {
    modules.foundation = [
      {
        focus: "Advanced Planning",
        activities: [
          {
            type: "cross-practice",
            title: "Cross + 2 Planning",
            description: "Plan cross and first 2 F2L pairs during inspection.",
            durationMinutes: timePerActivity,
            completed: false,
          },
          {
            type: "reconstruction",
            title: "Solve Analysis",
            description:
              "Record and analyze your solves. Find move-count optimizations.",
            durationMinutes: timePerActivity,
            completed: false,
          },
          {
            type: "timed-solves",
            title: "Apply Analysis",
            description: "Apply insights from analysis in timed practice.",
            durationMinutes: timePerActivity,
            targetSolves: Math.floor(timePerActivity / 1.2),
            completed: false,
          },
        ],
      },
    ];

    modules.technique = [
      {
        focus: "ZBLL/COLL Training",
        activities: [
          {
            type: "algorithm-drill",
            title: "Advanced LL Algs",
            description:
              "Learn new COLL or ZBLL algorithms for your most common cases.",
            durationMinutes: timePerActivity,
            completed: false,
          },
          {
            type: "algorithm-drill",
            title: "Recognition Training",
            description:
              "Practice instant recognition for advanced LL algorithms.",
            durationMinutes: timePerActivity,
            completed: false,
          },
          {
            type: "timed-solves",
            title: "Advanced LL Practice",
            description: "Use new algorithms in timed solves.",
            durationMinutes: timePerActivity,
            targetSolves: Math.floor(timePerActivity / 1.2),
            completed: false,
          },
        ],
      },
    ];

    modules.speed = [
      {
        focus: "PB Hunting",
        activities: [
          {
            type: "timed-solves",
            title: "Warm-up",
            description: "Light warm-up to get ready for intense practice.",
            durationMinutes: Math.floor(timePerActivity * 0.5),
            targetSolves: 5,
            completed: false,
          },
          {
            type: "timed-solves",
            title: "Sprint Session",
            description:
              "Maximum intensity speed session. Go for personal bests.",
            durationMinutes: Math.floor(dailyMinutes * 0.6),
            targetSolves: Math.floor(dailyMinutes),
            completed: false,
          },
          {
            type: "reconstruction",
            title: "PB Analysis",
            description:
              "Analyze your best solves. Understand why they were fast.",
            durationMinutes: Math.floor(timePerActivity * 0.5),
            completed: false,
          },
        ],
      },
    ];

    modules.competition = [
      {
        focus: "Competition Pressure",
        activities: [
          {
            type: "competition-sim",
            title: "High-Stakes Simulation",
            description:
              "Simulate competition with added pressure. Time limits, judge calls.",
            durationMinutes: dailyMinutes,
            targetSolves: 5,
            completed: false,
          },
        ],
      },
    ];
  }

  // Add weakness training if identified
  if (analysis.primaryWeakness) {
    const weaknessActivities = getWeaknessTraining(
      analysis.primaryWeakness,
      timePerActivity,
    );
    modules.weakness = weaknessActivities;
  }

  return modules;
}

// Get specific training for identified weakness
function getWeaknessTraining(
  weakness: string,
  timePerActivity: number,
): { focus: string; activities: TrainingActivity[] }[] {
  const weaknessTraining: Record<
    string,
    { focus: string; activities: TrainingActivity[] }
  > = {
    cross: {
      focus: "Cross Improvement",
      activities: [
        {
          type: "cross-practice",
          title: "Cross Only Practice",
          description:
            "Practice only the cross. Aim for consistent 8-move or better solutions.",
          durationMinutes: Math.floor(timePerActivity * 1.5),
          targetSolves: Math.floor(timePerActivity * 2),
          completed: false,
        },
        {
          type: "slow-solves",
          title: "Inspection Practice",
          description:
            "Practice planning the full cross during 15-second inspection.",
          durationMinutes: Math.floor(timePerActivity),
          targetSolves: Math.floor(timePerActivity / 2),
          completed: false,
        },
        {
          type: "timed-solves",
          title: "Apply Cross Skills",
          description: "Timed solves focusing on cross execution.",
          durationMinutes: Math.floor(timePerActivity * 0.5),
          targetSolves: Math.floor(timePerActivity / 3),
          completed: false,
        },
      ],
    },
    f2l: {
      focus: "F2L Improvement",
      activities: [
        {
          type: "f2l-practice",
          title: "F2L Case Study",
          description: "Study and practice your weakest F2L cases.",
          durationMinutes: Math.floor(timePerActivity * 1.2),
          completed: false,
        },
        {
          type: "slow-solves",
          title: "Rotationless F2L",
          description: "Practice F2L with minimal cube rotations.",
          durationMinutes: Math.floor(timePerActivity),
          targetSolves: Math.floor(timePerActivity / 4),
          completed: false,
        },
        {
          type: "timed-solves",
          title: "F2L Focused Solves",
          description: "Timed solves prioritizing smooth F2L.",
          durationMinutes: Math.floor(timePerActivity * 0.8),
          targetSolves: Math.floor(timePerActivity / 2),
          completed: false,
        },
      ],
    },
    lookahead: {
      focus: "Lookahead Improvement",
      activities: [
        {
          type: "lookahead-training",
          title: "Metronome Practice",
          description: "Use a metronome to maintain constant TPS. Never pause.",
          durationMinutes: Math.floor(timePerActivity * 1.2),
          completed: false,
        },
        {
          type: "slow-solves",
          title: "Eyes Ahead",
          description:
            "Slow solves where you always look at the next pair, not current one.",
          durationMinutes: Math.floor(timePerActivity),
          targetSolves: Math.floor(timePerActivity / 5),
          completed: false,
        },
        {
          type: "timed-solves",
          title: "Smooth Solves",
          description: "Timed solves aiming for no pauses, even if slower.",
          durationMinutes: Math.floor(timePerActivity * 0.8),
          targetSolves: Math.floor(timePerActivity / 2),
          completed: false,
        },
      ],
    },
    recognition: {
      focus: "Recognition Improvement",
      activities: [
        {
          type: "algorithm-drill",
          title: "Flash Recognition",
          description:
            "Practice identifying cases as fast as possible without executing.",
          durationMinutes: Math.floor(timePerActivity),
          completed: false,
        },
        {
          type: "algorithm-drill",
          title: "Blind Recognition",
          description:
            "Close eyes after recognizing, then execute the algorithm.",
          durationMinutes: Math.floor(timePerActivity),
          completed: false,
        },
        {
          type: "timed-solves",
          title: "Recognition in Solves",
          description: "Focus on fast recognition during timed solves.",
          durationMinutes: Math.floor(timePerActivity),
          targetSolves: Math.floor(timePerActivity / 2),
          completed: false,
        },
      ],
    },
  };

  const training = weaknessTraining[weakness];
  return training ? [training] : [];
}

// Select training for a specific day based on rotation and analysis
function selectDayTraining(
  analysis: UserAnalysis,
  modules: Record<string, { focus: string; activities: TrainingActivity[] }[]>,
  dayIndex: number,
  weekNumber: number,
  dailyMinutes: number,
): { focus: string; activities: TrainingActivity[] } {
  // Adjust training intensity based on mood and completion rate
  const intensityModifier =
    analysis.recentMoodTrend === "struggling"
      ? 0.8
      : analysis.recentMoodTrend === "positive"
        ? 1.1
        : 1.0;

  // Create a balanced weekly schedule
  // Day 0 (Sun): Foundation or Rest
  // Day 1 (Mon): Technique
  // Day 2 (Tue): Speed or Foundation
  // Day 3 (Wed): Technique or Weakness
  // Day 4 (Thu): Speed
  // Day 5 (Fri): Foundation or Competition
  // Day 6 (Sat): Competition or Technique

  const scheduleMap: Record<number, string[]> = {
    0: ["foundation", "technique"], // Sunday
    1: ["technique", "foundation"], // Monday
    2: ["speed", "foundation"], // Tuesday
    3: ["weakness", "technique"], // Wednesday - weakness if identified
    4: ["speed", "technique"], // Thursday
    5: ["foundation", "competition"], // Friday
    6: ["competition", "speed"], // Saturday
  };

  // Get module categories for this day
  const dayCategories = scheduleMap[dayIndex] || ["foundation", "technique"];

  // Try to find a module from preferred categories
  for (const category of dayCategories) {
    const categoryModules = modules[category];
    if (categoryModules && categoryModules.length > 0) {
      // Rotate through available modules based on week number
      const moduleIndex = (weekNumber - 1 + dayIndex) % categoryModules.length;
      const selectedModule = categoryModules[moduleIndex];

      // Adjust duration based on intensity
      return {
        focus: selectedModule.focus,
        activities: selectedModule.activities.map((a) => ({
          ...a,
          durationMinutes: Math.round(a.durationMinutes * intensityModifier),
          targetSolves: a.targetSolves
            ? Math.round(a.targetSolves * intensityModifier)
            : undefined,
        })),
      };
    }
  }

  // Fallback to first available module
  for (const category of ["foundation", "technique", "speed"]) {
    const categoryModules = modules[category];
    if (categoryModules && categoryModules.length > 0) {
      return categoryModules[0];
    }
  }

  // Ultimate fallback
  return {
    focus: "General Practice",
    activities: [
      {
        type: "timed-solves",
        title: "Timed Practice",
        description: "Regular timed solving session.",
        durationMinutes: dailyMinutes,
        targetSolves: Math.floor(dailyMinutes / 2),
        completed: false,
      },
    ],
  };
}

// LEGACY FUNCTIONS (kept for backward compatibility)

function generateDailyPlans(
  skillLevel: string,
  goalType: string,
  dailyMinutes: number,
  practiceSchedule: string[] | undefined,
  weekStart: number,
) {
  const plans = [];
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Default to all days if no schedule provided
  const activeDays = practiceSchedule || daysOfWeek;

  for (let i = 0; i < 7; i++) {
    const dayDate = weekStart + i * 24 * 60 * 60 * 1000;
    const dayName = daysOfWeek[i];
    const isRestDay = !activeDays.includes(dayName);

    if (isRestDay) {
      plans.push({
        dayOfWeek: i,
        date: dayDate,
        focus: "Rest Day",
        activities: [
          {
            type: "rest" as const,
            title: "Rest & Recovery",
            description:
              "Take a break from cubing. Let your muscles and mind recover.",
            durationMinutes: 0,
            completed: false,
          },
        ],
        isCompleted: false,
        isRestDay: true,
      });
    } else {
      const activities = generateActivitiesForDay(
        skillLevel,
        goalType,
        dailyMinutes,
        i,
      );
      plans.push({
        dayOfWeek: i,
        date: dayDate,
        focus: getDayFocus(skillLevel, goalType, i),
        activities,
        isCompleted: false,
        isRestDay: false,
      });
    }
  }

  return plans;
}

function getDayFocus(
  skillLevel: string,
  goalType: string,
  dayIndex: number,
): string {
  const beginnerFocuses = [
    "Cross Practice",
    "F2L Basics",
    "Last Layer Algorithms",
    "Cross Practice",
    "Full Solve Practice",
    "F2L Efficiency",
    "Timed Averages",
  ];

  const intermediateFocuses = [
    "Cross + F2L Flow",
    "Lookahead Training",
    "Algorithm Speed",
    "Slow Solves Analysis",
    "Full Speed Practice",
    "Efficiency Focus",
    "Competition Simulation",
  ];

  const advancedFocuses = [
    "Advanced F2L",
    "Lookahead Mastery",
    "Algorithm Recognition",
    "Reconstructions",
    "Speed Sessions",
    "Weakness Training",
    "Competition Prep",
  ];

  if (skillLevel === "beginner") return beginnerFocuses[dayIndex];
  if (skillLevel === "intermediate") return intermediateFocuses[dayIndex];
  return advancedFocuses[dayIndex];
}

function generateActivitiesForDay(
  skillLevel: string,
  goalType: string,
  dailyMinutes: number,
  dayIndex: number,
) {
  const activities: Array<{
    type:
      | "timed-solves"
      | "untimed-practice"
      | "algorithm-drill"
      | "slow-solves"
      | "reconstruction"
      | "cross-practice"
      | "f2l-practice"
      | "lookahead-training"
      | "competition-sim"
      | "rest";
    title: string;
    description: string;
    durationMinutes: number;
    targetSolves?: number;
    completed: boolean;
  }> = [];

  // Allocate time based on skill level and day
  const timePerActivity = Math.floor(dailyMinutes / 3);

  if (skillLevel === "beginner") {
    switch (dayIndex % 7) {
      case 0: // Cross Practice
        activities.push({
          type: "cross-practice",
          title: "Cross Practice",
          description:
            "Practice solving the cross efficiently. Focus on planning the cross during inspection.",
          durationMinutes: timePerActivity,
          targetSolves: Math.floor(timePerActivity / 2),
          completed: false,
        });
        activities.push({
          type: "slow-solves",
          title: "Slow Solves",
          description:
            "Do slow, deliberate solves focusing on each step without rushing.",
          durationMinutes: timePerActivity,
          targetSolves: Math.floor(timePerActivity / 4),
          completed: false,
        });
        activities.push({
          type: "timed-solves",
          title: "Timed Practice",
          description: "Regular timed solves to build speed and consistency.",
          durationMinutes: timePerActivity,
          targetSolves: Math.floor(timePerActivity / 2),
          completed: false,
        });
        break;
      case 1: // F2L Basics
        activities.push({
          type: "f2l-practice",
          title: "F2L Training",
          description:
            "Practice first two layers. Focus on intuitive pair insertion.",
          durationMinutes: timePerActivity,
          targetSolves: Math.floor(timePerActivity / 3),
          completed: false,
        });
        activities.push({
          type: "algorithm-drill",
          title: "F2L Cases Review",
          description: "Review and practice common F2L cases.",
          durationMinutes: timePerActivity,
          completed: false,
        });
        activities.push({
          type: "timed-solves",
          title: "Full Solves",
          description: "Apply what you learned in timed solves.",
          durationMinutes: timePerActivity,
          targetSolves: Math.floor(timePerActivity / 2),
          completed: false,
        });
        break;
      case 2: // Last Layer
        activities.push({
          type: "algorithm-drill",
          title: "OLL Practice",
          description:
            "Practice OLL algorithms. Focus on recognition and execution.",
          durationMinutes: timePerActivity,
          completed: false,
        });
        activities.push({
          type: "algorithm-drill",
          title: "PLL Practice",
          description: "Practice PLL algorithms. Work on muscle memory.",
          durationMinutes: timePerActivity,
          completed: false,
        });
        activities.push({
          type: "timed-solves",
          title: "Full Solves",
          description:
            "Practice full solves focusing on last layer efficiency.",
          durationMinutes: timePerActivity,
          targetSolves: Math.floor(timePerActivity / 2),
          completed: false,
        });
        break;
      default:
        activities.push({
          type: "timed-solves",
          title: "Warm-up Solves",
          description:
            "Start with some warm-up solves to get your hands moving.",
          durationMinutes: Math.floor(timePerActivity / 2),
          targetSolves: 5,
          completed: false,
        });
        activities.push({
          type: "slow-solves",
          title: "Analysis Solves",
          description: "Do slow solves while analyzing each move.",
          durationMinutes: timePerActivity,
          targetSolves: Math.floor(timePerActivity / 4),
          completed: false,
        });
        activities.push({
          type: "timed-solves",
          title: "Speed Practice",
          description: "Fast-paced timed solves. Push your limits!",
          durationMinutes: timePerActivity + Math.floor(timePerActivity / 2),
          targetSolves: Math.floor(dailyMinutes / 2),
          completed: false,
        });
    }
  } else if (skillLevel === "intermediate") {
    switch (dayIndex % 7) {
      case 0: // Cross + F2L Flow
        activities.push({
          type: "cross-practice",
          title: "Cross Efficiency",
          description:
            "Practice 8-move or less crosses. Plan during inspection.",
          durationMinutes: timePerActivity,
          targetSolves: Math.floor(timePerActivity / 1.5),
          completed: false,
        });
        activities.push({
          type: "f2l-practice",
          title: "Cross to F2L Transition",
          description:
            "Focus on smooth transition from cross to first F2L pair.",
          durationMinutes: timePerActivity,
          completed: false,
        });
        activities.push({
          type: "timed-solves",
          title: "Timed Averages",
          description: "Do timed ao5 and ao12 focusing on consistency.",
          durationMinutes: timePerActivity,
          targetSolves: 12,
          completed: false,
        });
        break;
      case 1: // Lookahead
        activities.push({
          type: "lookahead-training",
          title: "Lookahead Drills",
          description:
            "Practice tracking the next pair while solving the current one.",
          durationMinutes: timePerActivity,
          completed: false,
        });
        activities.push({
          type: "slow-solves",
          title: "Slow Turning Practice",
          description:
            "Turn slowly but never stop. Focus on continuous lookahead.",
          durationMinutes: timePerActivity,
          targetSolves: Math.floor(timePerActivity / 5),
          completed: false,
        });
        activities.push({
          type: "timed-solves",
          title: "Apply Lookahead",
          description: "Timed solves applying lookahead techniques.",
          durationMinutes: timePerActivity,
          targetSolves: Math.floor(timePerActivity / 2),
          completed: false,
        });
        break;
      case 6: // Competition Sim
        activities.push({
          type: "competition-sim",
          title: "Competition Simulation",
          description: "Simulate competition conditions. Do an official ao5.",
          durationMinutes: dailyMinutes,
          targetSolves: 5,
          completed: false,
        });
        break;
      default:
        activities.push({
          type: "algorithm-drill",
          title: "Algorithm Speed",
          description: "Drill your algorithms for faster execution.",
          durationMinutes: timePerActivity,
          completed: false,
        });
        activities.push({
          type: "untimed-practice",
          title: "Efficiency Practice",
          description: "Work on reducing move count in your solves.",
          durationMinutes: timePerActivity,
          completed: false,
        });
        activities.push({
          type: "timed-solves",
          title: "Speed Session",
          description: "Push for PBs in your timed session.",
          durationMinutes: timePerActivity,
          targetSolves: Math.floor(dailyMinutes / 2),
          completed: false,
        });
    }
  } else {
    // Advanced/Expert
    switch (dayIndex % 7) {
      case 0: // Advanced F2L
        activities.push({
          type: "f2l-practice",
          title: "Advanced F2L Cases",
          description: "Practice difficult F2L cases and alternate solutions.",
          durationMinutes: timePerActivity,
          completed: false,
        });
        activities.push({
          type: "reconstruction",
          title: "Solve Reconstruction",
          description: "Reconstruct your solves and find improvements.",
          durationMinutes: timePerActivity,
          completed: false,
        });
        activities.push({
          type: "timed-solves",
          title: "Sprint Session",
          description: "High-intensity speed solves.",
          durationMinutes: timePerActivity,
          targetSolves: Math.floor(dailyMinutes / 1.5),
          completed: false,
        });
        break;
      case 3: // Reconstructions
        activities.push({
          type: "reconstruction",
          title: "Video Analysis",
          description: "Record and analyze your solves for improvements.",
          durationMinutes: timePerActivity,
          completed: false,
        });
        activities.push({
          type: "slow-solves",
          title: "Perfect Execution",
          description: "Focus on perfect fingertricks and rotations.",
          durationMinutes: timePerActivity,
          targetSolves: Math.floor(timePerActivity / 5),
          completed: false,
        });
        activities.push({
          type: "timed-solves",
          title: "Apply Improvements",
          description: "Practice with improvements from analysis.",
          durationMinutes: timePerActivity,
          targetSolves: Math.floor(timePerActivity / 2),
          completed: false,
        });
        break;
      case 6: // Competition Prep
        activities.push({
          type: "competition-sim",
          title: "Full Competition Simulation",
          description: "Simulate full competition round with pressure.",
          durationMinutes: dailyMinutes,
          targetSolves: 5,
          completed: false,
        });
        break;
      default:
        activities.push({
          type: "algorithm-drill",
          title: "Algorithm Recognition",
          description: "Fast recognition drills for LL algorithms.",
          durationMinutes: timePerActivity,
          completed: false,
        });
        activities.push({
          type: "lookahead-training",
          title: "Advanced Lookahead",
          description: "Work on full F2L lookahead.",
          durationMinutes: timePerActivity,
          completed: false,
        });
        activities.push({
          type: "timed-solves",
          title: "PB Hunting",
          description: "Go for personal bests!",
          durationMinutes: timePerActivity,
          targetSolves: Math.floor(dailyMinutes / 1.5),
          completed: false,
        });
    }
  }

  return activities;
}
