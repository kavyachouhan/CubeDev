import { v } from "convex/values";
import { query } from "./_generated/server";

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
    const limit = args.limit || 20;
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
      .take(10);

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
      .take(10);

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
      .take(10);

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
      .take(10);

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
