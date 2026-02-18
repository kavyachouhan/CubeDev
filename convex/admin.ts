import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get system-wide statistics for admin dashboard
export const getSystemStats = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Get all users (excluding deleted)
    const allUsers = await ctx.db
      .query("users")
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();

    const totalUsers = allUsers.length;

    // Users active in last 24 hours, 7 days, 30 days
    const activeUsersDay = allUsers.filter(
      (u) => u.lastLoginAt && u.lastLoginAt >= oneDayAgo,
    ).length;
    const activeUsersWeek = allUsers.filter(
      (u) => u.lastLoginAt && u.lastLoginAt >= oneWeekAgo,
    ).length;
    const activeUsersMonth = allUsers.filter(
      (u) => u.lastLoginAt && u.lastLoginAt >= oneMonthAgo,
    ).length;

    // New users in last 7 days
    const newUsersWeek = allUsers.filter(
      (u) => u.createdAt >= oneWeekAgo,
    ).length;

    // Get total solves
    const allSolves = await ctx.db.query("solves").collect();
    const totalSolves = allSolves.length;
    const solvesToday = allSolves.filter(
      (s) => s.createdAt >= oneDayAgo,
    ).length;
    const solvesThisWeek = allSolves.filter(
      (s) => s.createdAt >= oneWeekAgo,
    ).length;

    // Get sessions count
    const allSessions = await ctx.db.query("sessions").collect();
    const totalSessions = allSessions.length;

    // Get challenge rooms stats
    const allChallengeRooms = await ctx.db.query("challengeRooms").collect();
    const activeChallengeRooms = allChallengeRooms.filter(
      (r) => r.status === "active",
    ).length;
    const totalChallengeRooms = allChallengeRooms.length;

    // Get contact messages stats
    const allContactMessages = await ctx.db.query("contactMessages").collect();
    const totalContactMessages = allContactMessages.length;
    const unresolvedContactMessages = allContactMessages.filter(
      (m) => m.status === "new" || m.status === "read",
    ).length;

    // Get feedback submissions stats
    const allFeedback = await ctx.db.query("feedbackResponses").collect();
    const totalFeedback = allFeedback.length;
    const feedbackThisWeek = allFeedback.filter(
      (f) => f.createdAt >= oneWeekAgo,
    ).length;

    // Get push subscriptions
    const allSubscriptions = await ctx.db.query("pushSubscriptions").collect();
    const activeSubscriptions = allSubscriptions.filter(
      (s) => s.isActive,
    ).length;

    // Get coach profiles
    const allCoachProfiles = await ctx.db.query("coachProfiles").collect();
    const totalCoachProfiles = allCoachProfiles.length;

    // Get algorithm progress entries
    const allAlgorithmProgress = await ctx.db
      .query("userAlgorithmProgress")
      .collect();
    const totalAlgorithmProgress = allAlgorithmProgress.length;

    // Get competition simulations
    const allSimulations = await ctx.db
      .query("competitionSimulations")
      .collect();
    const totalSimulations = allSimulations.length;
    const completedSimulations = allSimulations.filter(
      (s) => s.status === "completed",
    ).length;

    return {
      users: {
        total: totalUsers,
        activeDay: activeUsersDay,
        activeWeek: activeUsersWeek,
        activeMonth: activeUsersMonth,
        newThisWeek: newUsersWeek,
      },
      solves: {
        total: totalSolves,
        today: solvesToday,
        thisWeek: solvesThisWeek,
      },
      sessions: {
        total: totalSessions,
      },
      challengeRooms: {
        total: totalChallengeRooms,
        active: activeChallengeRooms,
      },
      contact: {
        total: totalContactMessages,
        unresolved: unresolvedContactMessages,
      },
      feedback: {
        total: totalFeedback,
        thisWeek: feedbackThisWeek,
      },
      pushSubscriptions: {
        active: activeSubscriptions,
        total: allSubscriptions.length,
      },
      coach: {
        totalProfiles: totalCoachProfiles,
      },
      algorithms: {
        totalProgress: totalAlgorithmProgress,
      },
      competitions: {
        total: totalSimulations,
        completed: completedSimulations,
      },
    };
  },
});

// Get all users with pagination for admin
export const getAllUsersAdmin = query({
  args: {
    limit: v.optional(v.number()),
    includeDeleted: v.optional(v.boolean()),
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let users = await ctx.db.query("users").order("desc").collect();

    // Filter deleted users unless explicitly requested
    if (!args.includeDeleted) {
      users = users.filter((u) => !u.isDeleted);
    }

    // Search filter
    if (args.searchQuery && args.searchQuery.trim() !== "") {
      const query = args.searchQuery.toLowerCase();
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(query) ||
          u.wcaId.toLowerCase().includes(query) ||
          (u.email && u.email.toLowerCase().includes(query)),
      );
    }

    // Apply limit
    if (args.limit) {
      users = users.slice(0, args.limit);
    }

    return users;
  },
});

// Get user activity summary for admin
export const getUserActivitySummary = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    // Get user's sessions
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Get user's solves count
    const solves = await ctx.db
      .query("solves")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Get user's challenge room participations
    const roomParticipations = await ctx.db
      .query("roomParticipants")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Get user's algorithm progress
    const algorithmProgress = await ctx.db
      .query("userAlgorithmProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Get user's coach profile
    const coachProfile = await ctx.db
      .query("coachProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    // Get user's feedback submissions
    const feedback = await ctx.db
      .query("feedbackResponses")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Get user's contact messages
    const contactMessages = await ctx.db
      .query("contactMessages")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return {
      user,
      stats: {
        totalSessions: sessions.length,
        totalSolves: solves.length,
        challengeRoomsJoined: roomParticipations.length,
        algorithmsLearned: algorithmProgress.filter(
          (p) => p.learningStage === "mastered",
        ).length,
        algorithmsInProgress: algorithmProgress.filter(
          (p) => p.learningStage !== "mastered",
        ).length,
        hasCoachProfile: !!coachProfile,
        feedbackSubmissions: feedback.length,
        contactMessages: contactMessages.length,
      },
    };
  },
});

// Get push notification logs for admin
export const getPushNotificationLogs = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let logs = await ctx.db
      .query("pushNotificationLog")
      .order("desc")
      .collect();

    // Filter by status if provided
    if (args.status) {
      logs = logs.filter((log) => log.status === args.status);
    }

    // Apply limit
    if (args.limit) {
      logs = logs.slice(0, args.limit);
    }

    return logs;
  },
});

// Get challenge room stats for admin
export const getChallengeRoomStats = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const rooms = await ctx.db.query("challengeRooms").order("desc").collect();

    // Get participant counts for each room
    const roomsWithStats = await Promise.all(
      rooms.slice(0, args.limit || 50).map(async (room) => {
        const participants = await ctx.db
          .query("roomParticipants")
          .withIndex("by_room", (q) => q.eq("roomId", room._id))
          .collect();

        return {
          ...room,
          participantCount: participants.length,
          completedCount: participants.filter((p) => p.isCompleted).length,
        };
      }),
    );

    return roomsWithStats;
  },
});

// Get algorithm sets stats for admin
export const getAlgorithmSetsStats = query({
  args: {},
  handler: async (ctx) => {
    const sets = await ctx.db.query("algorithmSets").collect();

    const setsWithStats = await Promise.all(
      sets.map(async (set) => {
        const cases = await ctx.db
          .query("algorithmCases")
          .withIndex("by_set", (q) => q.eq("setId", set._id))
          .collect();

        const totalCases = cases.length;

        // Get progress for all cases in this set
        let totalProgress = 0;
        let masteredCount = 0;

        for (const caseItem of cases) {
          const progress = await ctx.db
            .query("userAlgorithmProgress")
            .withIndex("by_case", (q) => q.eq("caseId", caseItem._id))
            .collect();

          totalProgress += progress.length;
          masteredCount += progress.filter(
            (p) => p.learningStage === "mastered",
          ).length;
        }

        return {
          ...set,
          totalCases,
          totalProgress,
          masteredCount,
        };
      }),
    );

    return setsWithStats;
  },
});

// Get coach stats for admin
export const getCoachStats = query({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("coachProfiles").collect();
    const journalEntries = await ctx.db.query("coachJournalEntries").collect();
    const trainingPlans = await ctx.db.query("coachTrainingPlans").collect();

    // Group by skill level
    const bySkillLevel = {
      beginner: profiles.filter((p) => p.skillLevel === "beginner").length,
      intermediate: profiles.filter((p) => p.skillLevel === "intermediate")
        .length,
      advanced: profiles.filter((p) => p.skillLevel === "advanced").length,
      expert: profiles.filter((p) => p.skillLevel === "expert").length,
    };

    // Group by goal type
    const byGoalType: Record<string, number> = {};
    profiles.forEach((p) => {
      byGoalType[p.goalType] = (byGoalType[p.goalType] || 0) + 1;
    });

    return {
      totalProfiles: profiles.length,
      completedOnboarding: profiles.filter((p) => p.onboardingCompleted).length,
      totalJournalEntries: journalEntries.length,
      totalTrainingPlans: trainingPlans.length,
      activePlans: trainingPlans.filter((p) => p.status === "active").length,
      bySkillLevel,
      byGoalType,
    };
  },
});

// Get detailed coach analytics for admin
export const getDetailedCoachStats = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;
    const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;

    const profiles = await ctx.db.query("coachProfiles").collect();
    const journalEntries = await ctx.db.query("coachJournalEntries").collect();
    const trainingPlans = await ctx.db.query("coachTrainingPlans").collect();
    const progressSnapshots = await ctx.db
      .query("coachProgressSnapshots")
      .collect();
    const goalHistory = await ctx.db.query("coachGoalHistory").collect();

    // Weekly journal entry trend (last 12 weeks)
    const weeklyJournalTrend: Array<{ week: string; count: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const weekStart = now - (i + 1) * 7 * 24 * 60 * 60 * 1000;
      const weekEnd = now - i * 7 * 24 * 60 * 60 * 1000;
      const count = journalEntries.filter(
        (e) => e.createdAt >= weekStart && e.createdAt < weekEnd,
      ).length;
      const date = new Date(weekEnd);
      weeklyJournalTrend.push({
        week: `${date.getMonth() + 1}/${date.getDate()}`,
        count,
      });
    }

    // Mood distribution from journal entries
    const moodDistribution: Record<string, number> = {
      great: 0,
      good: 0,
      okay: 0,
      frustrated: 0,
      tired: 0,
    };
    journalEntries.forEach((e) => {
      if (e.mood) {
        moodDistribution[e.mood] = (moodDistribution[e.mood] || 0) + 1;
      }
    });

    // Training plan status distribution
    const planStatusDistribution = {
      active: trainingPlans.filter((p) => p.status === "active").length,
      completed: trainingPlans.filter((p) => p.status === "completed").length,
      skipped: trainingPlans.filter((p) => p.status === "skipped").length,
    };

    // Goal achievement stats from history
    const goalAchievementStats = {
      achieved: goalHistory.filter((g) => g.status === "achieved").length,
      expired: goalHistory.filter((g) => g.status === "expired").length,
      replaced: goalHistory.filter((g) => g.status === "replaced").length,
    };

    // Primary event distribution
    const eventDistribution: Record<string, number> = {};
    profiles.forEach((p) => {
      eventDistribution[p.primaryEvent] =
        (eventDistribution[p.primaryEvent] || 0) + 1;
    });

    // Daily practice time distribution
    const practiceTimeDistribution: Record<string, number> = {
      "15-30 min": 0,
      "30-60 min": 0,
      "1-2 hours": 0,
      "2+ hours": 0,
    };
    profiles.forEach((p) => {
      if (p.dailyPracticeMinutes <= 30) {
        practiceTimeDistribution["15-30 min"]++;
      } else if (p.dailyPracticeMinutes <= 60) {
        practiceTimeDistribution["30-60 min"]++;
      } else if (p.dailyPracticeMinutes <= 120) {
        practiceTimeDistribution["1-2 hours"]++;
      } else {
        practiceTimeDistribution["2+ hours"]++;
      }
    });

    // Activity metrics
    const journalEntriesToday = journalEntries.filter(
      (e) => e.createdAt >= oneDayAgo,
    ).length;
    const journalEntriesThisWeek = journalEntries.filter(
      (e) => e.createdAt >= oneWeekAgo,
    ).length;
    const journalEntriesLastWeek = journalEntries.filter(
      (e) => e.createdAt >= twoWeeksAgo && e.createdAt < oneWeekAgo,
    ).length;
    const journalEntriesThisMonth = journalEntries.filter(
      (e) => e.createdAt >= oneMonthAgo,
    ).length;

    const weeklyJournalGrowth =
      journalEntriesLastWeek > 0
        ? Math.round(
            ((journalEntriesThisWeek - journalEntriesLastWeek) /
              journalEntriesLastWeek) *
              100,
          )
        : journalEntriesThisWeek > 0
          ? 100
          : 0;

    // New profiles this week/month
    const newProfilesThisWeek = profiles.filter(
      (p) => p.createdAt >= oneWeekAgo,
    ).length;
    const newProfilesThisMonth = profiles.filter(
      (p) => p.createdAt >= oneMonthAgo,
    ).length;
    const lastWeekProfiles = profiles.filter(
      (p) => p.createdAt >= twoWeeksAgo && p.createdAt < oneWeekAgo,
    ).length;
    const profileGrowthRate =
      lastWeekProfiles > 0
        ? Math.round(
            ((newProfilesThisWeek - lastWeekProfiles) / lastWeekProfiles) * 100,
          )
        : newProfilesThisWeek > 0
          ? 100
          : 0;

    // Average practice minutes from journal (where recorded)
    const entriesWithPractice = journalEntries.filter(
      (e) => e.practiceMinutes && e.practiceMinutes > 0,
    );
    const avgPracticeMinutes =
      entriesWithPractice.length > 0
        ? Math.round(
            entriesWithPractice.reduce(
              (sum, e) => sum + (e.practiceMinutes || 0),
              0,
            ) / entriesWithPractice.length,
          )
        : 0;

    // Average solves per entry
    const entriesWithSolves = journalEntries.filter(
      (e) => e.solveCount && e.solveCount > 0,
    );
    const avgSolvesPerEntry =
      entriesWithSolves.length > 0
        ? Math.round(
            entriesWithSolves.reduce((sum, e) => sum + (e.solveCount || 0), 0) /
              entriesWithSolves.length,
          )
        : 0;

    // Media attachment stats
    const entriesWithMedia = journalEntries.filter(
      (e) => e.mediaUrls && e.mediaUrls.length > 0,
    ).length;

    // Progress tracking
    const usersOnTrack = progressSnapshots.filter((s) => s.onTrack).length;
    const avgProgressPercentage =
      progressSnapshots.length > 0
        ? Math.round(
            progressSnapshots.reduce(
              (sum, s) => sum + s.progressPercentage,
              0,
            ) / progressSnapshots.length,
          )
        : 0;

    // Training plan completion rate
    const completedDaysTotal = trainingPlans.reduce(
      (sum, p) => sum + p.completedDays,
      0,
    );
    const totalDaysTotal = trainingPlans.reduce(
      (sum, p) => sum + p.totalDays,
      0,
    );
    const planCompletionRate =
      totalDaysTotal > 0
        ? Math.round((completedDaysTotal / totalDaysTotal) * 100)
        : 0;

    return {
      // Overview
      totalProfiles: profiles.length,
      onboardedProfiles: profiles.filter((p) => p.onboardingCompleted).length,
      newProfilesThisWeek,
      newProfilesThisMonth,
      profileGrowthRate,

      // Journal Activity
      totalJournalEntries: journalEntries.length,
      journalEntriesToday,
      journalEntriesThisWeek,
      journalEntriesThisMonth,
      weeklyJournalGrowth,
      avgPracticeMinutes,
      avgSolvesPerEntry,
      entriesWithMedia,
      weeklyJournalTrend,
      moodDistribution,

      // Training Plans
      totalTrainingPlans: trainingPlans.length,
      activePlans: planStatusDistribution.active,
      planStatusDistribution,
      planCompletionRate,
      completedDaysTotal,

      // Progress
      totalProgressSnapshots: progressSnapshots.length,
      usersOnTrack,
      avgProgressPercentage,

      // Goals
      totalGoalsHistory: goalHistory.length,
      goalAchievementStats,

      // Distributions
      eventDistribution,
      practiceTimeDistribution,
    };
  },
});

// Get all coach profiles for export
export const getAllCoachProfiles = query({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("coachProfiles").collect();

    // Get user info for each profile
    const profilesWithUser = await Promise.all(
      profiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        const journalCount = (
          await ctx.db
            .query("coachJournalEntries")
            .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
            .collect()
        ).length;
        const planCount = (
          await ctx.db
            .query("coachTrainingPlans")
            .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
            .collect()
        ).length;

        // Get goal history for this profile
        const goalHistory = await ctx.db
          .query("coachGoalHistory")
          .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
          .collect();

        const goalStats = {
          total: goalHistory.length,
          achieved: goalHistory.filter((g) => g.status === "achieved").length,
          expired: goalHistory.filter((g) => g.status === "expired").length,
          replaced: goalHistory.filter((g) => g.status === "replaced").length,
        };

        return {
          ...profile,
          userName: user?.name || "Unknown",
          wcaId: user?.wcaId || "Unknown",
          journalCount,
          planCount,
          goalStats,
        };
      }),
    );

    return profilesWithUser;
  },
});

// Get competition simulation stats for admin
export const getCompetitionStats = query({
  args: {},
  handler: async (ctx) => {
    const simulations = await ctx.db.query("competitionSimulations").collect();

    const byStatus = {
      inProgress: simulations.filter((s) => s.status === "in-progress").length,
      completed: simulations.filter((s) => s.status === "completed").length,
      abandoned: simulations.filter((s) => s.status === "abandoned").length,
    };

    // Get unique competitions
    const uniqueCompetitions = new Set(simulations.map((s) => s.competitionId));

    // Get most popular events
    const eventCounts: Record<string, number> = {};
    simulations.forEach((s) => {
      s.selectedEvents.forEach((event) => {
        eventCounts[event] = (eventCounts[event] || 0) + 1;
      });
    });

    return {
      totalSimulations: simulations.length,
      byStatus,
      uniqueCompetitions: uniqueCompetitions.size,
      popularEvents: Object.entries(eventCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([event, count]) => ({ event, count })),
    };
  },
});

// Get detailed user analytics for admin dashboard
export const getUserAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;

    // Get all users (excluding deleted)
    const allUsers = await ctx.db
      .query("users")
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();

    // Country breakdown
    const countryBreakdown: Record<string, number> = {};
    allUsers.forEach((u) => {
      countryBreakdown[u.countryIso2] =
        (countryBreakdown[u.countryIso2] || 0) + 1;
    });
    const topCountries = Object.entries(countryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([country, count]) => ({ country, count }));

    // Registration trends - last 12 weeks
    const weeklyRegistrations: Array<{ week: string; count: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const weekStart = now - (i + 1) * 7 * 24 * 60 * 60 * 1000;
      const weekEnd = now - i * 7 * 24 * 60 * 60 * 1000;
      const count = allUsers.filter(
        (u) => u.createdAt >= weekStart && u.createdAt < weekEnd,
      ).length;
      const date = new Date(weekEnd);
      weeklyRegistrations.push({
        week: `${date.getMonth() + 1}/${date.getDate()}`,
        count,
      });
    }

    // Monthly registrations - last 6 months
    const monthlyRegistrations: Array<{ month: string; count: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now);
      monthStart.setMonth(monthStart.getMonth() - i - 1);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      const count = allUsers.filter(
        (u) =>
          u.createdAt >= monthStart.getTime() &&
          u.createdAt < monthEnd.getTime(),
      ).length;
      monthlyRegistrations.push({
        month: monthStart.toLocaleDateString("en-US", { month: "short" }),
        count,
      });
    }

    // Active users breakdown
    const activeToday = allUsers.filter(
      (u) => u.lastLoginAt && u.lastLoginAt >= oneDayAgo,
    ).length;
    const activeThisWeek = allUsers.filter(
      (u) => u.lastLoginAt && u.lastLoginAt >= oneWeekAgo,
    ).length;
    const activeThisMonth = allUsers.filter(
      (u) => u.lastLoginAt && u.lastLoginAt >= thirtyDaysAgo,
    ).length;

    // Inactive users (no activity in 30 days)
    const inactiveUsers = allUsers.filter(
      (u) => !u.lastLoginAt || u.lastLoginAt < thirtyDaysAgo,
    ).length;

    // Churned estimate (active 30-60 days ago but not in last 30)
    const churnedUsers = allUsers.filter(
      (u) =>
        u.lastLoginAt &&
        u.lastLoginAt >= sixtyDaysAgo &&
        u.lastLoginAt < thirtyDaysAgo,
    ).length;

    // Theme mode distribution
    const themeDistribution: Record<string, number> = {
      light: 0,
      dark: 0,
      auto: 0,
    };
    allUsers.forEach((u) => {
      const mode = u.themeMode || "auto";
      themeDistribution[mode] = (themeDistribution[mode] || 0) + 1;
    });

    // Color scheme distribution
    const colorSchemeDistribution: Record<string, number> = {
      blue: 0,
      purple: 0,
      green: 0,
      orange: 0,
      cyan: 0,
    };
    allUsers.forEach((u) => {
      const scheme = u.colorScheme || "blue";
      colorSchemeDistribution[scheme] =
        (colorSchemeDistribution[scheme] || 0) + 1;
    });

    // Gender distribution
    const genderDistribution: Record<string, number> = {
      male: 0,
      female: 0,
      other: 0,
      unspecified: 0,
    };
    allUsers.forEach((u) => {
      const gender = u.gender?.toLowerCase() || "unspecified";
      if (gender === "m" || gender === "male") {
        genderDistribution.male++;
      } else if (gender === "f" || gender === "female") {
        genderDistribution.female++;
      } else if (gender === "o" || gender === "other") {
        genderDistribution.other++;
      } else {
        genderDistribution.unspecified++;
      }
    });

    // Privacy settings distribution
    const privacySettings = {
      profileHidden: allUsers.filter((u) => u.hideProfile === true).length,
      challengeStatsHidden: allUsers.filter(
        (u) => u.hideChallengeStats === true,
      ).length,
      profilePublic: allUsers.filter((u) => u.hideProfile !== true).length,
    };

    // Timer font size distribution
    const timerFontSizeDistribution: Record<string, number> = {
      sm: 0,
      md: 0,
      lg: 0,
      xl: 0,
    };
    allUsers.forEach((u) => {
      const size = u.timerFontSize || "lg";
      timerFontSizeDistribution[size] =
        (timerFontSizeDistribution[size] || 0) + 1;
    });

    // Timer font family distribution
    const timerFontFamilyDistribution: Record<string, number> = {
      mono: 0,
      sans: 0,
      statement: 0,
    };
    allUsers.forEach((u) => {
      const family = u.timerFontFamily || "mono";
      timerFontFamilyDistribution[family] =
        (timerFontFamilyDistribution[family] || 0) + 1;
    });

    // Timer update mode distribution
    const timerUpdateModeDistribution: Record<string, number> = {
      live: 0,
      solving: 0,
      seconds: 0,
    };
    allUsers.forEach((u) => {
      const mode = u.timerUpdateMode || "live";
      timerUpdateModeDistribution[mode] =
        (timerUpdateModeDistribution[mode] || 0) + 1;
    });

    // Accessibility settings
    const accessibilitySettings = {
      reduceMotion: allUsers.filter((u) => u.reduceMotion === true).length,
      disableGlow: allUsers.filter((u) => u.disableGlow === true).length,
      highContrast: allUsers.filter((u) => u.highContrast === true).length,
    };

    // Retention metrics
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;

    // Users who registered in the week before last and returned this week
    const cohortRegisteredTwoWeeksAgo = allUsers.filter(
      (u) => u.createdAt >= fourteenDaysAgo && u.createdAt < sevenDaysAgo,
    );
    const returnedFromCohort = cohortRegisteredTwoWeeksAgo.filter(
      (u) => u.lastLoginAt && u.lastLoginAt >= sevenDaysAgo,
    ).length;
    const weeklyRetentionRate =
      cohortRegisteredTwoWeeksAgo.length > 0
        ? Math.round(
            (returnedFromCohort / cohortRegisteredTwoWeeksAgo.length) * 100,
          )
        : 0;

    // Average days since last login for active users
    const activeUsersWithLogin = allUsers.filter(
      (u) => u.lastLoginAt && u.lastLoginAt >= thirtyDaysAgo,
    );
    const avgDaysSinceLogin =
      activeUsersWithLogin.length > 0
        ? Math.round(
            activeUsersWithLogin.reduce(
              (sum, u) =>
                sum + (now - (u.lastLoginAt || now)) / (24 * 60 * 60 * 1000),
              0,
            ) / activeUsersWithLogin.length,
          )
        : 0;

    // New users this week vs last week
    const newThisWeek = allUsers.filter(
      (u) => u.createdAt >= oneWeekAgo,
    ).length;
    const lastWeekStart = oneWeekAgo - 7 * 24 * 60 * 60 * 1000;
    const newLastWeek = allUsers.filter(
      (u) => u.createdAt >= lastWeekStart && u.createdAt < oneWeekAgo,
    ).length;
    const weekOverWeekGrowth =
      newLastWeek > 0
        ? Math.round(((newThisWeek - newLastWeek) / newLastWeek) * 100)
        : newThisWeek > 0
          ? 100
          : 0;

    // New users this month vs last month
    const newThisMonth = allUsers.filter(
      (u) => u.createdAt >= thirtyDaysAgo,
    ).length;
    const lastMonthStart = thirtyDaysAgo - 30 * 24 * 60 * 60 * 1000;
    const newLastMonth = allUsers.filter(
      (u) => u.createdAt >= lastMonthStart && u.createdAt < thirtyDaysAgo,
    ).length;
    const monthOverMonthGrowth =
      newLastMonth > 0
        ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100)
        : newThisMonth > 0
          ? 100
          : 0;

    return {
      totalUsers: allUsers.length,
      activity: {
        activeToday,
        activeThisWeek,
        activeThisMonth,
        inactiveUsers,
        churnedUsers,
        avgDaysSinceLogin,
        weeklyRetentionRate,
      },
      registration: {
        newThisWeek,
        newLastWeek,
        weekOverWeekGrowth,
        newThisMonth,
        newLastMonth,
        monthOverMonthGrowth,
        weeklyTrend: weeklyRegistrations,
        monthlyTrend: monthlyRegistrations,
      },
      geography: {
        topCountries,
        totalCountries: Object.keys(countryBreakdown).length,
      },
      preferences: {
        themeDistribution,
        colorSchemeDistribution,
      },
      demographics: {
        genderDistribution,
        privacySettings,
      },
      timerSettings: {
        fontSizeDistribution: timerFontSizeDistribution,
        fontFamilyDistribution: timerFontFamilyDistribution,
        updateModeDistribution: timerUpdateModeDistribution,
      },
      accessibility: accessibilitySettings,
    };
  },
});

// Get recent activity for admin dashboard
export const getRecentActivity = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    // To ensure we have enough activities to show after merging different sources, we fetch more than the requested limit from each source and then sort them together.
    const perSourceLimit = Math.max(limit, 10);
    const activities: Array<{
      type: string;
      description: string;
      timestamp: number;
      userId?: string;
      userName?: string;
    }> = [];

    // Recent user registrations
    const recentUsers = await ctx.db
      .query("users")
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .order("desc")
      .take(perSourceLimit);

    for (const user of recentUsers) {
      activities.push({
        type: "user_registration",
        description: `New user registered: ${user.name}`,
        timestamp: user.createdAt,
        userId: user._id,
        userName: user.name,
      });
    }

    // Recent feedback submissions
    const recentFeedback = await ctx.db
      .query("feedbackResponses")
      .order("desc")
      .take(perSourceLimit);

    for (const feedback of recentFeedback) {
      activities.push({
        type: "feedback",
        description: `Feedback submitted (${feedback.surveyType})`,
        timestamp: feedback.createdAt,
      });
    }

    // Recent contact messages
    const recentContact = await ctx.db
      .query("contactMessages")
      .order("desc")
      .take(perSourceLimit);

    for (const message of recentContact) {
      activities.push({
        type: "contact",
        description: `Contact message: ${message.subject}`,
        timestamp: message.createdAt,
      });
    }

    // Recent challenge rooms
    const recentRooms = await ctx.db
      .query("challengeRooms")
      .order("desc")
      .take(perSourceLimit);

    for (const room of recentRooms) {
      activities.push({
        type: "challenge_room",
        description: `Challenge room created: ${room.name}`,
        timestamp: room.createdAt,
      });
    }

    // Sort all activities by timestamp and return top N
    return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  },
});

// ALGORITHM ADMIN FUNCTIONS

// Helper function to calculate move count from notation
function calculateMoveCount(notation: string): number {
  if (!notation || notation.trim() === "") return 0;

  // Normalize the notation
  const cleaned = notation
    .replace(/\([^)]*\)/g, "") // Remove parentheses content
    .replace(/\[[^\]]*\]/g, "") // Remove bracket content
    .trim();

  if (!cleaned) return 0;

  // Split by spaces and count moves
  const moves = cleaned.split(/\s+/).filter((move) => {
    // Filter out empty strings and comments
    return move.length > 0 && !move.startsWith("//");
  });

  return moves.length;
}

// Get detailed algorithm analytics for admin
export const getAlgorithmAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const sets = await ctx.db.query("algorithmSets").collect();
    const cases = await ctx.db.query("algorithmCases").collect();
    const algorithms = await ctx.db.query("algorithms").collect();
    const progress = await ctx.db.query("userAlgorithmProgress").collect();
    const sessions = await ctx.db.query("algorithmPracticeSessions").collect();

    // Category distribution
    const categoryDistribution: Record<string, number> = {};
    sets.forEach((s) => {
      categoryDistribution[s.category] =
        (categoryDistribution[s.category] || 0) + 1;
    });

    // Difficulty distribution
    const difficultyDistribution = {
      beginner: sets.filter((s) => s.difficulty === "beginner").length,
      intermediate: sets.filter((s) => s.difficulty === "intermediate").length,
      advanced: sets.filter((s) => s.difficulty === "advanced").length,
    };

    // Learning stage distribution
    const stageDistribution = {
      new: progress.filter((p) => p.learningStage === "new").length,
      learning: progress.filter((p) => p.learningStage === "learning").length,
      reviewing: progress.filter((p) => p.learningStage === "reviewing").length,
      mastered: progress.filter((p) => p.learningStage === "mastered").length,
    };

    // Practice sessions stats
    const sessionsToday = sessions.filter(
      (s) => s.createdAt >= oneDayAgo,
    ).length;
    const sessionsThisWeek = sessions.filter(
      (s) => s.createdAt >= oneWeekAgo,
    ).length;
    const sessionsThisMonth = sessions.filter(
      (s) => s.createdAt >= oneMonthAgo,
    ).length;

    // Session type distribution
    const sessionTypeDistribution: Record<string, number> = {};
    sessions.forEach((s) => {
      sessionTypeDistribution[s.sessionType] =
        (sessionTypeDistribution[s.sessionType] || 0) + 1;
    });

    // Average accuracy across all progress
    const progressWithAccuracy = progress.filter((p) => p.accuracyRate > 0);
    const avgAccuracy =
      progressWithAccuracy.length > 0
        ? progressWithAccuracy.reduce((sum, p) => sum + p.accuracyRate, 0) /
          progressWithAccuracy.length
        : 0;

    // Average recognition time across all progress
    const progressWithRecognition = progress.filter(
      (p) => p.recognitionTimes.length > 0,
    );
    const avgRecognitionTime =
      progressWithRecognition.length > 0
        ? progressWithRecognition.reduce((sum, p) => {
            const avg =
              p.recognitionTimes.reduce((a, b) => a + b, 0) /
              p.recognitionTimes.length;
            return sum + avg;
          }, 0) / progressWithRecognition.length
        : 0;

    // Most popular sets (by learning count)
    const setPopularity: Record<string, { name: string; count: number }> = {};
    for (const p of progress) {
      const caseItem = cases.find((c) => c._id === p.caseId);
      if (caseItem) {
        const set = sets.find((s) => s._id === caseItem.setId);
        if (set) {
          if (!setPopularity[set._id]) {
            setPopularity[set._id] = { name: set.name, count: 0 };
          }
          setPopularity[set._id].count++;
        }
      }
    }
    const topSets = Object.entries(setPopularity)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([id, data]) => ({ setId: id, ...data }));

    // Weekly learning trend (last 12 weeks)
    const weeklyLearningTrend: Array<{ week: string; count: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const weekStart = now - (i + 1) * 7 * 24 * 60 * 60 * 1000;
      const weekEnd = now - i * 7 * 24 * 60 * 60 * 1000;
      const count = progress.filter(
        (p) => p.firstLearnedAt >= weekStart && p.firstLearnedAt < weekEnd,
      ).length;
      const date = new Date(weekEnd);
      weeklyLearningTrend.push({
        week: `${date.getMonth() + 1}/${date.getDate()}`,
        count,
      });
    }

    // Unique learners
    const uniqueLearners = new Set(progress.map((p) => p.userId)).size;

    return {
      // Overview
      totalSets: sets.length,
      publishedSets: sets.filter((s) => s.isPublished).length,
      draftSets: sets.filter((s) => !s.isPublished).length,
      totalCases: cases.length,
      totalAlgorithms: algorithms.length,
      totalProgressRecords: progress.length,

      // Learning stats
      uniqueLearners,
      stageDistribution,
      avgAccuracy: Math.round(avgAccuracy * 100) / 100,
      avgRecognitionTime: Math.round(avgRecognitionTime),

      // Distributions
      categoryDistribution,
      difficultyDistribution,
      sessionTypeDistribution,

      // Session stats
      totalSessions: sessions.length,
      sessionsToday,
      sessionsThisWeek,
      sessionsThisMonth,

      // Trends
      weeklyLearningTrend,
      topSets,
    };
  },
});

// Get all algorithm sets for admin (including drafts)
export const getAllSetsForAdmin = query({
  args: {},
  handler: async (ctx) => {
    const sets = await ctx.db.query("algorithmSets").collect();

    // Get case counts and progress stats for each set
    const setsWithStats = await Promise.all(
      sets.map(async (set) => {
        const cases = await ctx.db
          .query("algorithmCases")
          .withIndex("by_set", (q) => q.eq("setId", set._id))
          .collect();

        let totalProgressCount = 0;
        let masteredCount = 0;
        let learningCount = 0;

        for (const caseItem of cases) {
          const progress = await ctx.db
            .query("userAlgorithmProgress")
            .withIndex("by_case", (q) => q.eq("caseId", caseItem._id))
            .collect();

          totalProgressCount += progress.length;
          masteredCount += progress.filter(
            (p) => p.learningStage === "mastered",
          ).length;
          learningCount += progress.filter(
            (p) =>
              p.learningStage === "learning" || p.learningStage === "reviewing",
          ).length;
        }

        return {
          ...set,
          actualCaseCount: cases.length,
          totalProgressCount,
          masteredCount,
          learningCount,
        };
      }),
    );

    return setsWithStats.sort((a, b) => a.order - b.order);
  },
});

// Get all cases for a specific set (admin)
export const getCasesForSetAdmin = query({
  args: { setId: v.id("algorithmSets") },
  handler: async (ctx, { setId }) => {
    const cases = await ctx.db
      .query("algorithmCases")
      .withIndex("by_set_order", (q) => q.eq("setId", setId))
      .collect();

    // Get algorithm counts and progress for each case
    const casesWithStats = await Promise.all(
      cases.map(async (caseItem) => {
        const algorithms = await ctx.db
          .query("algorithms")
          .withIndex("by_case", (q) => q.eq("caseId", caseItem._id))
          .collect();

        const progress = await ctx.db
          .query("userAlgorithmProgress")
          .withIndex("by_case", (q) => q.eq("caseId", caseItem._id))
          .collect();

        return {
          ...caseItem,
          algorithmCount: algorithms.length,
          learnerCount: progress.length,
          masteredCount: progress.filter((p) => p.learningStage === "mastered")
            .length,
        };
      }),
    );

    return casesWithStats;
  },
});

// Get all algorithms for a specific case (admin)
export const getAlgorithmsForCaseAdmin = query({
  args: { caseId: v.id("algorithmCases") },
  handler: async (ctx, { caseId }) => {
    const algorithms = await ctx.db
      .query("algorithms")
      .withIndex("by_case", (q) => q.eq("caseId", caseId))
      .collect();

    // Get usage count for each algorithm
    const algorithmsWithStats = await Promise.all(
      algorithms.map(async (alg) => {
        const usageCount = (
          await ctx.db
            .query("userAlgorithmProgress")
            .filter((q) => q.eq(q.field("preferredAlgId"), alg._id))
            .collect()
        ).length;

        return {
          ...alg,
          usageCount,
        };
      }),
    );

    return algorithmsWithStats.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return b.popularity - a.popularity;
    });
  },
});

// Create a new algorithm set
export const createAlgorithmSet = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    category: v.string(),
    description: v.string(),
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced"),
    ),
    puzzleType: v.optional(v.string()),
    iconUrl: v.optional(v.string()),
    order: v.number(),
    isPublished: v.boolean(),
  },
  handler: async (ctx, args) => {
    const setId = await ctx.db.insert("algorithmSets", {
      ...args,
      caseCount: 0,
      createdAt: Date.now(),
    });
    return setId;
  },
});

// Update an algorithm set
export const updateAlgorithmSet = mutation({
  args: {
    setId: v.id("algorithmSets"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    difficulty: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced"),
      ),
    ),
    puzzleType: v.optional(v.string()),
    iconUrl: v.optional(v.string()),
    order: v.optional(v.number()),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, { setId, ...updates }) => {
    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }
    await ctx.db.patch(setId, filteredUpdates);
  },
});

// Delete an algorithm set (with cascading delete)
export const deleteAlgorithmSet = mutation({
  args: { setId: v.id("algorithmSets") },
  handler: async (ctx, { setId }) => {
    // Get all cases in this set
    const cases = await ctx.db
      .query("algorithmCases")
      .withIndex("by_set", (q) => q.eq("setId", setId))
      .collect();

    // Delete all algorithms and progress for each case
    for (const caseItem of cases) {
      // Delete algorithms
      const algorithms = await ctx.db
        .query("algorithms")
        .withIndex("by_case", (q) => q.eq("caseId", caseItem._id))
        .collect();
      for (const alg of algorithms) {
        await ctx.db.delete(alg._id);
      }

      // Delete user progress
      const progress = await ctx.db
        .query("userAlgorithmProgress")
        .withIndex("by_case", (q) => q.eq("caseId", caseItem._id))
        .collect();
      for (const p of progress) {
        await ctx.db.delete(p._id);
      }

      // Delete the case
      await ctx.db.delete(caseItem._id);
    }

    // Delete the set
    await ctx.db.delete(setId);
  },
});

// Create a new algorithm case
export const createAlgorithmCase = mutation({
  args: {
    setId: v.id("algorithmSets"),
    caseName: v.string(),
    slug: v.string(),
    caseImage: v.optional(v.string()),
    setupMoves: v.string(),
    recognition: v.array(v.string()),
    difficulty: v.number(),
    frequency: v.number(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const caseId = await ctx.db.insert("algorithmCases", {
      ...args,
      createdAt: Date.now(),
    });

    // Update set case count
    const set = await ctx.db.get(args.setId);
    if (set) {
      await ctx.db.patch(args.setId, {
        caseCount: set.caseCount + 1,
      });
    }

    return caseId;
  },
});

// Update an algorithm case
export const updateAlgorithmCase = mutation({
  args: {
    caseId: v.id("algorithmCases"),
    caseName: v.optional(v.string()),
    slug: v.optional(v.string()),
    caseImage: v.optional(v.string()),
    setupMoves: v.optional(v.string()),
    recognition: v.optional(v.array(v.string())),
    difficulty: v.optional(v.number()),
    frequency: v.optional(v.number()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, { caseId, ...updates }) => {
    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }
    await ctx.db.patch(caseId, filteredUpdates);
  },
});

// Delete an algorithm case (with cleanup)
export const deleteAlgorithmCase = mutation({
  args: { caseId: v.id("algorithmCases") },
  handler: async (ctx, { caseId }) => {
    const caseItem = await ctx.db.get(caseId);
    if (!caseItem) return;

    // Delete all algorithms for this case
    const algorithms = await ctx.db
      .query("algorithms")
      .withIndex("by_case", (q) => q.eq("caseId", caseId))
      .collect();
    for (const alg of algorithms) {
      await ctx.db.delete(alg._id);
    }

    // Delete all user progress for this case
    const progress = await ctx.db
      .query("userAlgorithmProgress")
      .withIndex("by_case", (q) => q.eq("caseId", caseId))
      .collect();
    for (const p of progress) {
      await ctx.db.delete(p._id);
    }

    // Update set case count
    const set = await ctx.db.get(caseItem.setId);
    if (set) {
      await ctx.db.patch(caseItem.setId, {
        caseCount: Math.max(0, set.caseCount - 1),
      });
    }

    // Delete the case
    await ctx.db.delete(caseId);
  },
});

// Create a new algorithm
export const createAlgorithm = mutation({
  args: {
    caseId: v.id("algorithmCases"),
    notation: v.string(),
    moveCount: v.optional(v.number()),
    fingerTricks: v.optional(v.string()),
    averageSpeed: v.optional(v.number()),
    popularity: v.optional(v.number()),
    isDefault: v.boolean(),
    createdBy: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Auto-calculate move count if not provided
    const moveCount = args.moveCount ?? calculateMoveCount(args.notation);

    // If this is set as default, unset other defaults
    if (args.isDefault) {
      const existingAlgorithms = await ctx.db
        .query("algorithms")
        .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
        .collect();
      for (const alg of existingAlgorithms) {
        if (alg.isDefault) {
          await ctx.db.patch(alg._id, { isDefault: false });
        }
      }
    }

    const algId = await ctx.db.insert("algorithms", {
      caseId: args.caseId,
      notation: args.notation,
      moveCount,
      fingerTricks: args.fingerTricks,
      averageSpeed: args.averageSpeed,
      popularity: args.popularity ?? 50,
      isDefault: args.isDefault,
      createdBy: args.createdBy,
      videoUrl: args.videoUrl,
      notes: args.notes,
      createdAt: Date.now(),
    });
    return algId;
  },
});

// Update an algorithm
export const updateAlgorithm = mutation({
  args: {
    algId: v.id("algorithms"),
    notation: v.optional(v.string()),
    moveCount: v.optional(v.number()),
    fingerTricks: v.optional(v.string()),
    averageSpeed: v.optional(v.number()),
    popularity: v.optional(v.number()),
    isDefault: v.optional(v.boolean()),
    createdBy: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { algId, moveCount: providedMoveCount, ...updates }) => {
    const alg = await ctx.db.get(algId);
    if (!alg) return;

    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    // Handle move count - use provided or calculate from notation
    if (providedMoveCount !== undefined) {
      filteredUpdates.moveCount = providedMoveCount;
    } else if (updates.notation !== undefined) {
      filteredUpdates.moveCount = calculateMoveCount(updates.notation);
    }

    // If setting as default, unset other defaults
    if (updates.isDefault === true) {
      const existingAlgorithms = await ctx.db
        .query("algorithms")
        .withIndex("by_case", (q) => q.eq("caseId", alg.caseId))
        .collect();
      for (const otherAlg of existingAlgorithms) {
        if (otherAlg._id !== algId && otherAlg.isDefault) {
          await ctx.db.patch(otherAlg._id, { isDefault: false });
        }
      }
    }

    await ctx.db.patch(algId, filteredUpdates);
  },
});

// Delete an algorithm
export const deleteAlgorithm = mutation({
  args: { algId: v.id("algorithms") },
  handler: async (ctx, { algId }) => {
    const alg = await ctx.db.get(algId);
    if (!alg) return;

    // Update any user progress that references this algorithm
    const progress = await ctx.db
      .query("userAlgorithmProgress")
      .filter((q) => q.eq(q.field("preferredAlgId"), algId))
      .collect();

    // Find another algorithm for this case to use as replacement
    const otherAlgorithms = await ctx.db
      .query("algorithms")
      .withIndex("by_case", (q) => q.eq("caseId", alg.caseId))
      .filter((q) => q.neq(q.field("_id"), algId))
      .collect();

    if (otherAlgorithms.length > 0) {
      const replacement =
        otherAlgorithms.find((a) => a.isDefault) || otherAlgorithms[0];
      for (const p of progress) {
        await ctx.db.patch(p._id, { preferredAlgId: replacement._id });
      }
    } else {
      // No replacement available, delete the progress records
      for (const p of progress) {
        await ctx.db.delete(p._id);
      }
    }

    // Delete the algorithm
    await ctx.db.delete(algId);
  },
});

// Export algorithms data
export const exportAlgorithmsData = query({
  args: {},
  handler: async (ctx) => {
    const sets = await ctx.db.query("algorithmSets").collect();
    const cases = await ctx.db.query("algorithmCases").collect();
    const algorithms = await ctx.db.query("algorithms").collect();

    return {
      sets: sets.map((s) => ({
        id: s._id,
        name: s.name,
        slug: s.slug,
        category: s.category,
        description: s.description,
        difficulty: s.difficulty,
        puzzleType: s.puzzleType,
        caseCount: s.caseCount,
        isPublished: s.isPublished,
        order: s.order,
        createdAt: s.createdAt,
      })),
      cases: cases.map((c) => ({
        id: c._id,
        setId: c.setId,
        caseName: c.caseName,
        slug: c.slug,
        setupMoves: c.setupMoves,
        recognition: c.recognition,
        difficulty: c.difficulty,
        frequency: c.frequency,
        order: c.order,
        createdAt: c.createdAt,
      })),
      algorithms: algorithms.map((a) => ({
        id: a._id,
        caseId: a.caseId,
        notation: a.notation,
        moveCount: a.moveCount,
        fingerTricks: a.fingerTricks,
        popularity: a.popularity,
        isDefault: a.isDefault,
        createdBy: a.createdBy,
        videoUrl: a.videoUrl,
        notes: a.notes,
        createdAt: a.createdAt,
      })),
    };
  },
});

// Import algorithm data (sets, cases, algorithms) with upsert logic
export const importAlgorithmData = mutation({
  args: {
    sets: v.array(
      v.object({
        name: v.string(),
        slug: v.optional(v.string()),
        category: v.string(),
        description: v.optional(v.string()),
        difficulty: v.optional(
          v.union(
            v.literal("beginner"),
            v.literal("intermediate"),
            v.literal("advanced"),
          ),
        ),
        puzzleType: v.optional(v.string()),
        order: v.optional(v.number()),
        isPublished: v.optional(v.boolean()),
        caseCount: v.optional(v.number()),
      }),
    ),
    cases: v.array(
      v.object({
        setSlug: v.optional(v.string()),
        setName: v.optional(v.string()),
        caseName: v.string(),
        setupMoves: v.string(),
        difficulty: v.optional(v.number()),
        frequency: v.optional(v.number()),
      }),
    ),
    algorithms: v.array(
      v.object({
        caseSlug: v.optional(v.string()),
        caseName: v.optional(v.string()),
        setSlug: v.optional(v.string()),
        setName: v.optional(v.string()),
        notation: v.string(),
        moveCount: v.optional(v.number()),
        fingerTricks: v.optional(v.string()),
        isDefault: v.optional(v.boolean()),
      }),
    ),
  },
  handler: async (ctx, { sets, cases, algorithms }) => {
    const result = {
      setsCreated: 0,
      setsUpdated: 0,
      casesCreated: 0,
      casesUpdated: 0,
      algorithmsCreated: 0,
      algorithmsUpdated: 0,
      errors: [] as string[],
    };

    // Helper function to generate slug
    const generateSlug = (name: string) =>
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    // Map to track set slugs to IDs
    const setSlugToId = new Map<string, string>();

    // Process sets
    for (const setData of sets) {
      try {
        const slug = setData.slug || generateSlug(setData.name);

        // Check if set exists by slug or name
        let existingSet = await ctx.db
          .query("algorithmSets")
          .withIndex("by_slug", (q) => q.eq("slug", slug))
          .first();

        if (!existingSet) {
          existingSet = await ctx.db
            .query("algorithmSets")
            .filter((q) => q.eq(q.field("name"), setData.name))
            .first();
        }

        if (existingSet) {
          // Update existing set
          await ctx.db.patch(existingSet._id, {
            name: setData.name,
            slug,
            category: setData.category,
            description: setData.description || existingSet.description,
            difficulty: setData.difficulty || existingSet.difficulty,
            puzzleType: setData.puzzleType || existingSet.puzzleType,
            order: setData.order ?? existingSet.order,
            isPublished: setData.isPublished ?? existingSet.isPublished,
          });
          setSlugToId.set(slug, existingSet._id);
          setSlugToId.set(setData.name.toLowerCase(), existingSet._id);
          result.setsUpdated++;
        } else {
          // Create new set
          const setId = await ctx.db.insert("algorithmSets", {
            name: setData.name,
            slug,
            category: setData.category,
            description: setData.description || "",
            difficulty: setData.difficulty || "intermediate",
            puzzleType: setData.puzzleType || "3x3x3",
            caseCount: setData.caseCount || 0,
            order: setData.order ?? 0,
            isPublished: setData.isPublished ?? false,
            createdAt: Date.now(),
          });
          setSlugToId.set(slug, setId);
          setSlugToId.set(setData.name.toLowerCase(), setId);
          result.setsCreated++;
        }
      } catch (error) {
        result.errors.push(
          `Set "${setData.name}": ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    // Map to track case identifiers to IDs
    const caseNameToId = new Map<string, string>();

    // Process cases
    for (const caseData of cases) {
      try {
        // Find parent set
        let setId: string | undefined;
        if (caseData.setSlug) {
          setId = setSlugToId.get(caseData.setSlug);
          if (!setId) {
            const existingSet = await ctx.db
              .query("algorithmSets")
              .withIndex("by_slug", (q) => q.eq("slug", caseData.setSlug!))
              .first();
            if (existingSet) setId = existingSet._id;
          }
        }
        if (!setId && caseData.setName) {
          setId = setSlugToId.get(caseData.setName.toLowerCase());
          if (!setId) {
            const existingSet = await ctx.db
              .query("algorithmSets")
              .filter((q) => q.eq(q.field("name"), caseData.setName))
              .first();
            if (existingSet) setId = existingSet._id;
          }
        }

        if (!setId) {
          result.errors.push(
            `Case "${caseData.caseName}": Could not find parent set (setSlug: ${caseData.setSlug}, setName: ${caseData.setName})`,
          );
          continue;
        }

        // Check if case exists in this set
        const existingCase = await ctx.db
          .query("algorithmCases")
          .withIndex("by_set", (q) => q.eq("setId", setId as any))
          .filter((q) => q.eq(q.field("caseName"), caseData.caseName))
          .first();

        if (existingCase) {
          // Update existing case
          await ctx.db.patch(existingCase._id, {
            setupMoves: caseData.setupMoves,
            difficulty: caseData.difficulty ?? existingCase.difficulty,
            frequency: caseData.frequency ?? existingCase.frequency,
          });
          caseNameToId.set(`${setId}:${caseData.caseName}`, existingCase._id);
          result.casesUpdated++;
        } else {
          // Create new case
          const caseId = await ctx.db.insert("algorithmCases", {
            setId: setId as Id<"algorithmSets">,
            caseName: caseData.caseName,
            slug: generateSlug(caseData.caseName),
            setupMoves: caseData.setupMoves,
            recognition: [],
            difficulty: caseData.difficulty ?? 5,
            frequency: caseData.frequency ?? 3,
            order: 0,
            createdAt: Date.now(),
          });
          caseNameToId.set(`${setId}:${caseData.caseName}`, caseId);

          // Update set case count
          const parentSet = await ctx.db.get(setId as Id<"algorithmSets">);
          if (parentSet) {
            await ctx.db.patch(setId as Id<"algorithmSets">, {
              caseCount: (parentSet.caseCount || 0) + 1,
            });
          }
          result.casesCreated++;
        }
      } catch (error) {
        result.errors.push(
          `Case "${caseData.caseName}": ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    // Process algorithms
    for (const algData of algorithms) {
      try {
        // Find parent case
        let caseId: string | undefined;

        // Try finding by setSlug/setName + caseName
        if (algData.caseName && (algData.setSlug || algData.setName)) {
          let setId: string | undefined;
          if (algData.setSlug) {
            setId = setSlugToId.get(algData.setSlug);
            if (!setId) {
              const existingSet = await ctx.db
                .query("algorithmSets")
                .withIndex("by_slug", (q) => q.eq("slug", algData.setSlug!))
                .first();
              if (existingSet) setId = existingSet._id;
            }
          }
          if (!setId && algData.setName) {
            setId = setSlugToId.get(algData.setName.toLowerCase());
            if (!setId) {
              const existingSet = await ctx.db
                .query("algorithmSets")
                .filter((q) => q.eq(q.field("name"), algData.setName))
                .first();
              if (existingSet) setId = existingSet._id;
            }
          }

          if (setId) {
            caseId = caseNameToId.get(`${setId}:${algData.caseName}`);
            if (!caseId) {
              const existingCase = await ctx.db
                .query("algorithmCases")
                .withIndex("by_set", (q) => q.eq("setId", setId as any))
                .filter((q) => q.eq(q.field("caseName"), algData.caseName))
                .first();
              if (existingCase) caseId = existingCase._id;
            }
          }
        }

        // Try finding by caseSlug
        if (!caseId && algData.caseSlug) {
          const existingCase = await ctx.db
            .query("algorithmCases")
            .filter((q) => q.eq(q.field("slug"), algData.caseSlug))
            .first();
          if (existingCase) caseId = existingCase._id;
        }

        if (!caseId) {
          result.errors.push(
            `Algorithm "${algData.notation.substring(0, 30)}...": Could not find parent case`,
          );
          continue;
        }

        // Check if algorithm exists in this case
        const existingAlg = await ctx.db
          .query("algorithms")
          .withIndex("by_case", (q) => q.eq("caseId", caseId as any))
          .filter((q) => q.eq(q.field("notation"), algData.notation))
          .first();

        const moveCount =
          algData.moveCount ?? calculateMoveCount(algData.notation);

        if (existingAlg) {
          // Update existing algorithm
          await ctx.db.patch(existingAlg._id, {
            notation: algData.notation,
            moveCount,
            fingerTricks: algData.fingerTricks ?? existingAlg.fingerTricks,
            isDefault: algData.isDefault ?? existingAlg.isDefault,
          });
          result.algorithmsUpdated++;
        } else {
          // Create new algorithm
          await ctx.db.insert("algorithms", {
            caseId: caseId as any,
            notation: algData.notation,
            moveCount,
            fingerTricks: algData.fingerTricks,
            popularity: 50,
            isDefault: algData.isDefault ?? false,
            createdAt: Date.now(),
          });
          result.algorithmsCreated++;
        }
      } catch (error) {
        result.errors.push(
          `Algorithm "${algData.notation.substring(0, 30)}...": ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    return result;
  },
});
