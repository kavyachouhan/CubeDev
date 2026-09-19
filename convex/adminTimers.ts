import { query } from "./adminAuth";
import { v } from "convex/values";

// Helper to format time in a human-readable way
function formatTime(ms: number): string {
  if (ms < 0) return "DNF";
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toFixed(2);
  return minutes > 0 ? `${minutes}:${seconds.padStart(5, "0")}` : seconds;
}

// Categorize average times into skill brackets for different events
function getTimeCategory(avgMs: number, event: string): string {
  const seconds = avgMs / 1000;

  if (event === "333") {
    if (seconds < 10) return "Sub-10";
    if (seconds < 15) return "Sub-15";
    if (seconds < 20) return "Sub-20";
    if (seconds < 30) return "Sub-30";
    if (seconds < 45) return "Sub-45";
    if (seconds < 60) return "Sub-60";
    return "60+";
  }

  if (event === "222") {
    if (seconds < 2) return "Sub-2";
    if (seconds < 3) return "Sub-3";
    if (seconds < 5) return "Sub-5";
    if (seconds < 8) return "Sub-8";
    if (seconds < 10) return "Sub-10";
    if (seconds < 15) return "Sub-15";
    return "15+";
  }

  if (event === "444") {
    if (seconds < 35) return "Sub-35";
    if (seconds < 45) return "Sub-45";
    if (seconds < 60) return "Sub-60";
    if (seconds < 90) return "Sub-90";
    if (seconds < 120) return "Sub-2min";
    return "2min+";
  }

  if (event === "555") {
    if (seconds < 60) return "Sub-60";
    if (seconds < 90) return "Sub-90";
    if (seconds < 120) return "Sub-2min";
    if (seconds < 180) return "Sub-3min";
    return "3min+";
  }

  if (event === "666" || event === "777") {
    if (seconds < 120) return "Sub-2min";
    if (seconds < 180) return "Sub-3min";
    if (seconds < 240) return "Sub-4min";
    if (seconds < 300) return "Sub-5min";
    return "5min+";
  }

  if (event === "333oh") {
    if (seconds < 15) return "Sub-15";
    if (seconds < 20) return "Sub-20";
    if (seconds < 30) return "Sub-30";
    if (seconds < 45) return "Sub-45";
    if (seconds < 60) return "Sub-60";
    return "60+";
  }

  if (event === "333bf" || event === "444bf" || event === "555bf") {
    if (seconds < 60) return "Sub-60";
    if (seconds < 120) return "Sub-2min";
    if (seconds < 180) return "Sub-3min";
    if (seconds < 300) return "Sub-5min";
    return "5min+";
  }

  if (event === "sq1") {
    if (seconds < 10) return "Sub-10";
    if (seconds < 15) return "Sub-15";
    if (seconds < 20) return "Sub-20";
    if (seconds < 30) return "Sub-30";
    return "30+";
  }

  if (event === "clock") {
    if (seconds < 5) return "Sub-5";
    if (seconds < 8) return "Sub-8";
    if (seconds < 10) return "Sub-10";
    if (seconds < 15) return "Sub-15";
    return "15+";
  }

  if (event === "pyram") {
    if (seconds < 3) return "Sub-3";
    if (seconds < 5) return "Sub-5";
    if (seconds < 8) return "Sub-8";
    if (seconds < 10) return "Sub-10";
    return "10+";
  }

  if (event === "skewb") {
    if (seconds < 3) return "Sub-3";
    if (seconds < 5) return "Sub-5";
    if (seconds < 8) return "Sub-8";
    if (seconds < 10) return "Sub-10";
    return "10+";
  }

  if (event === "minx") {
    if (seconds < 60) return "Sub-60";
    if (seconds < 90) return "Sub-90";
    if (seconds < 120) return "Sub-2min";
    if (seconds < 180) return "Sub-3min";
    return "3min+";
  }

  // Default categories for other events
  if (seconds < 15) return "Sub-15";
  if (seconds < 30) return "Sub-30";
  if (seconds < 60) return "Sub-60";
  if (seconds < 120) return "Sub-2min";
  return "2min+";
}

// Mapping of WCA event codes to human-readable names
const WCA_EVENTS: Record<string, string> = {
  "333": "3x3",
  "222": "2x2",
  "444": "4x4",
  "555": "5x5",
  "666": "6x6",
  "777": "7x7",
  "333oh": "3x3 OH",
  "333bf": "3x3 BLD",
  "444bf": "4x4 BLD",
  "555bf": "5x5 BLD",
  "333mbf": "Multi-BLD",
  "333fm": "FMC",
  sq1: "Square-1",
  clock: "Clock",
  pyram: "Pyraminx",
  skewb: "Skewb",
  minx: "Megaminx",
};

// Admin-only queries for timer analytics and stats
export const getTimerAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const allSessions = await ctx.db.query("sessions").collect();
    const allUserEventStats = await ctx.db.query("userEventStats").collect();
    const allUsers = await ctx.db.query("users").collect();

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Basic counts and totals from aggregated stats
    const totalSolves = allUserEventStats.reduce(
      (sum, stat) => sum + stat.totalSolves,
      0,
    );
    const totalSessions = allSessions.length;
    const totalUsers = new Set(
      allUserEventStats.map((s) => s.userId.toString()),
    ).size;
    const totalActiveUsers = new Set(
      allUserEventStats
        .filter((s) => s.lastSolveDate && s.lastSolveDate >= thirtyDaysAgo)
        .map((s) => s.userId.toString()),
    ).size;

    // Penalty statistics require per-solve data
    const dnfCount = 0;
    const plusTwoCount = 0;
    const cleanSolves = 0;
    const dnfRate = 0;
    const plusTwoRate = 0;

    // Event distribution and user counts from aggregated stats
    const eventCounts: Record<string, number> = {};
    const eventUserCounts: Record<string, Set<string>> = {};
    for (const stat of allUserEventStats) {
      eventCounts[stat.event] =
        (eventCounts[stat.event] || 0) + stat.totalSolves;
      if (!eventUserCounts[stat.event]) {
        eventUserCounts[stat.event] = new Set();
      }
      if (stat.totalSolves > 0) {
        eventUserCounts[stat.event].add(stat.userId.toString());
      }
    }

    const eventDistribution = Object.entries(eventCounts)
      .map(([event, count]) => ({
        event,
        eventName: WCA_EVENTS[event] || event,
        count,
        userCount: eventUserCounts[event]?.size || 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Timer mode and splits require per-solve data
    const timerModeDistribution = {
      normal: 0,
      manual: 0,
      stackmat: 0,
    };
    const splitUsageRate = 0;
    const splitMethodCounts: Record<string, number> = {};

    // User categories based on 3x3 averages (using pre-computed stats for efficiency)
    const userCategories: Record<string, number> = {};
    const userCategoriesData: {
      userId: string;
      name: string;
      average: number;
      category: string;
    }[] = [];

    // Focus on 3x3 stats for category breakdown, but this can be extended to other events as needed
    const user3x3Stats = allUserEventStats.filter(
      (stat) => stat.event === "333" && stat.overallAverage,
    );

    for (const stat of user3x3Stats) {
      if (stat.overallAverage) {
        const category = getTimeCategory(stat.overallAverage, "333");
        userCategories[category] = (userCategories[category] || 0) + 1;

        const user = allUsers.find((u) => u._id === stat.userId);
        if (user) {
          userCategoriesData.push({
            userId: stat.userId.toString(),
            name: user.name,
            average: stat.overallAverage,
            category,
          });
        }
      }
    }

    // Sort categories by skill level for 3x3
    const category3x3Order = [
      "Sub-10",
      "Sub-15",
      "Sub-20",
      "Sub-30",
      "Sub-45",
      "Sub-60",
      "60+",
    ];
    const sortedCategories = category3x3Order
      .filter((cat) => userCategories[cat])
      .map((cat) => ({
        category: cat,
        count: userCategories[cat] || 0,
      }));

    // Daily/weekly solve trends require per-solve data
    const dailyTrend: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      dailyTrend.push({ date, count: 0 });
    }

    const weeklyTrend: { week: string; count: number; users: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      weeklyTrend.push({
        week: `W${8 - i}`,
        count: 0,
        users: 0,
      });
    }

    // Session statistics
    const avgSolvesPerSession =
      totalSessions > 0 ? Math.round(totalSolves / totalSessions) : 0;
    const activeSessions = allSessions.filter((s) => s.isActive).length;
    const sessionsWithDescription = allSessions.filter(
      (s) => s.description,
    ).length;
    const sessionsWithTags = allSessions.filter(
      (s) => s.tags && s.tags.length > 0,
    ).length;

    // Session size distribution (based on solve count per session)
    const sessionSizes: Record<string, number> = {
      "1-10": 0,
      "11-50": 0,
      "51-100": 0,
      "101-500": 0,
      "500+": 0,
    };

    for (const session of allSessions) {
      const count = session.solveCount;
      if (count <= 10) sessionSizes["1-10"]++;
      else if (count <= 50) sessionSizes["11-50"]++;
      else if (count <= 100) sessionSizes["51-100"]++;
      else if (count <= 500) sessionSizes["101-500"]++;
      else sessionSizes["500+"]++;
    }

    // Top performers based on 3x3 averages (can be extended to other events as needed)
    const topPerformers = userCategoriesData
      .sort((a, b) => a.average - b.average)
      .slice(0, 10)
      .map((u) => ({
        ...u,
        averageFormatted: formatTime(u.average),
      }));

    // Most active users based on aggregated solve counts
    const userSolveCounts: Map<string, { count: number; userId: string }> =
      new Map();
    for (const stat of allUserEventStats) {
      const userId = stat.userId.toString();
      const current = userSolveCounts.get(userId);
      if (current) {
        current.count += stat.totalSolves;
      } else {
        userSolveCounts.set(userId, { count: stat.totalSolves, userId });
      }
    }

    const mostActiveUsers = Array.from(userSolveCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([userId, data]) => {
        const user = allUsers.find((u) => u._id.toString() === userId);
        return {
          userId,
          name: user?.name || "Unknown User",
          wcaId: user?.wcaId || "",
          solveCount: data.count,
        };
      });

    // Time period solve counts require per-solve data
    const todaySolves = 0;
    const thisWeekSolves = 0;
    const thisMonthSolves = 0;

    // Best times and category breakdowns for 3x3 (can be extended to other events as needed)
    const all3x3Stats = allUserEventStats.filter((s) => s.event === "333");
    const bestSingles = all3x3Stats
      .filter((s) => s.bestSingle && s.bestSingle > 0)
      .map((s) => s.bestSingle!)
      .sort((a, b) => a - b);
    const bestAo5s = all3x3Stats
      .filter((s) => s.bestAo5 && s.bestAo5 > 0)
      .map((s) => s.bestAo5!)
      .sort((a, b) => a - b);

    const bestOverallSingle = bestSingles[0] || null;
    const bestOverallAo5 = bestAo5s[0] || null;
    const medianSingle =
      bestSingles.length > 0
        ? bestSingles[Math.floor(bestSingles.length / 2)]
        : null;
    const medianAo5 =
      bestAo5s.length > 0 ? bestAo5s[Math.floor(bestAo5s.length / 2)] : null;

    // Best times for each event
    const eventBestTimes: {
      event: string;
      eventName: string;
      bestSingle: number | null;
      bestAo5: number | null;
      userCount: number;
    }[] = [];

    for (const event of Object.keys(WCA_EVENTS)) {
      const eventStats = allUserEventStats.filter((s) => s.event === event);
      if (eventStats.length === 0) continue;

      const singles = eventStats
        .filter((s) => s.bestSingle && s.bestSingle > 0)
        .map((s) => s.bestSingle!)
        .sort((a, b) => a - b);
      const ao5s = eventStats
        .filter((s) => s.bestAo5 && s.bestAo5 > 0)
        .map((s) => s.bestAo5!)
        .sort((a, b) => a - b);

      eventBestTimes.push({
        event,
        eventName: WCA_EVENTS[event],
        bestSingle: singles[0] || null,
        bestAo5: ao5s[0] || null,
        userCount: eventStats.length,
      });
    }

    return {
      // Overall stats
      totalSolves,
      totalSessions,
      totalUsers,
      totalActiveUsers,
      avgSolvesPerSession,

      // Time period stats
      todaySolves,
      thisWeekSolves,
      thisMonthSolves,

      // Penalty stats
      dnfCount,
      plusTwoCount,
      cleanSolves,
      dnfRate,
      plusTwoRate,

      // Distribution data
      eventDistribution,
      timerModeDistribution,
      splitUsageRate,
      splitMethodCounts,
      userCategories: sortedCategories,

      // Trends
      dailyTrend,
      weeklyTrend,

      // Session stats
      activeSessions,
      sessionsWithDescription,
      sessionsWithTags,
      sessionSizes,

      // Leaderboards
      topPerformers,
      mostActiveUsers,

      // Best times
      bestOverallSingle: bestOverallSingle
        ? formatTime(bestOverallSingle)
        : "N/A",
      bestOverallAo5: bestOverallAo5 ? formatTime(bestOverallAo5) : "N/A",
      medianSingle: medianSingle ? formatTime(medianSingle) : "N/A",
      medianAo5: medianAo5 ? formatTime(medianAo5) : "N/A",
      eventBestTimes: eventBestTimes
        .filter((e) => e.bestSingle || e.bestAo5)
        .sort((a, b) => b.userCount - a.userCount),
    };
  },
});

// Get filtered timer analytics for a specific event (e.g. 3x3, 4x4, etc.)
export const getFilteredTimerAnalytics = query({
  args: {
    event: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const eventFilter = args.event || "333"; // Default to 3x3

    const allUserEventStats = await ctx.db.query("userEventStats").collect();
    const allUsers = await ctx.db.query("users").collect();

    // Filter user event stats for the selected event
    const eventStats = allUserEventStats.filter((s) => s.event === eventFilter);
    const totalSolves = eventStats.reduce(
      (sum, stat) => sum + stat.totalSolves,
      0,
    );
    const totalUsers = new Set(
      eventStats.filter((s) => s.totalSolves > 0).map((s) => s.userId.toString()),
    ).size;

    // Categorize users based on their average times for the selected event
    const userCategories: Record<string, number> = {};
    const userCategoriesData: {
      userId: string;
      name: string;
      average: number;
      category: string;
    }[] = [];

    for (const stat of eventStats) {
      if (stat.overallAverage) {
        const category = getTimeCategory(stat.overallAverage, eventFilter);
        userCategories[category] = (userCategories[category] || 0) + 1;

        const user = allUsers.find((u) => u._id === stat.userId);
        if (user) {
          userCategoriesData.push({
            userId: stat.userId.toString(),
            name: user.name,
            average: stat.overallAverage,
            category,
          });
        }
      }
    }

    // Sort categories by skill level for the selected event
    const sortedCategories = Object.entries(userCategories)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => {
        const order = [
          "Sub-3",
          "Sub-5",
          "Sub-8",
          "Sub-10",
          "Sub-15",
          "Sub-20",
          "Sub-30",
          "Sub-35",
          "Sub-45",
          "Sub-60",
          "Sub-90",
          "Sub-2min",
          "Sub-3min",
          "Sub-4min",
          "Sub-5min",
          "3+",
          "5+",
          "8+",
          "10+",
          "15+",
          "30+",
          "60+",
          "2min+",
          "3min+",
          "5min+",
        ];
        const aIdx = order.indexOf(a.category);
        const bIdx = order.indexOf(b.category);
        if (aIdx === -1 && bIdx === -1) return 0;
        if (aIdx === -1) return 1;
        if (bIdx === -1) return -1;
        return aIdx - bIdx;
      });

    // Top performers for the selected event
    const topPerformers = userCategoriesData
      .sort((a, b) => a.average - b.average)
      .slice(0, 10)
      .map((u) => ({
        ...u,
        averageFormatted: formatTime(u.average),
      }));

    // Best times for the selected event
    const bestSingles = eventStats
      .filter((s) => s.bestSingle && s.bestSingle > 0)
      .map((s) => s.bestSingle!)
      .sort((a, b) => a - b);
    const bestAo5s = eventStats
      .filter((s) => s.bestAo5 && s.bestAo5 > 0)
      .map((s) => s.bestAo5!)
      .sort((a, b) => a - b);

    const bestOverallSingle = bestSingles[0] || null;
    const bestOverallAo5 = bestAo5s[0] || null;
    const medianSingle =
      bestSingles.length > 0
        ? bestSingles[Math.floor(bestSingles.length / 2)]
        : null;

    return {
      event: eventFilter,
      eventName: WCA_EVENTS[eventFilter] || eventFilter,
      totalSolves,
      totalUsers,
      userCategories: sortedCategories,
      topPerformers,
      bestOverallSingle: bestOverallSingle
        ? formatTime(bestOverallSingle)
        : "N/A",
      bestOverallAo5: bestOverallAo5 ? formatTime(bestOverallAo5) : "N/A",
      medianSingle: medianSingle ? formatTime(medianSingle) : "N/A",
    };
  },
});

// Get breakdown of users in different time categories for a specific event (e.g. 3x3, 4x4, etc.)
export const getEventCategoryBreakdown = query({
  args: {
    event: v.string(),
  },
  handler: async (ctx, args) => {
    const allUserEventStats = await ctx.db.query("userEventStats").collect();
    const allUsers = await ctx.db.query("users").collect();

    const eventStats = allUserEventStats.filter(
      (s) => s.event === args.event && s.overallAverage,
    );

    const categories: Record<string, { count: number; users: string[] }> = {};

    for (const stat of eventStats) {
      if (stat.overallAverage) {
        const category = getTimeCategory(stat.overallAverage, args.event);
        if (!categories[category]) {
          categories[category] = { count: 0, users: [] };
        }
        categories[category].count++;

        const user = allUsers.find((u) => u._id === stat.userId);
        if (user) {
          categories[category].users.push(user.name);
        }
      }
    }

    return {
      event: args.event,
      eventName: WCA_EVENTS[args.event] || args.event,
      categories: Object.entries(categories)
        .map(([category, data]) => ({
          category,
          count: data.count,
          users: data.users.slice(0, 10), // Show up to 10 user names per category for brevity
        }))
        .sort((a, b) => {
          // Sort categories by skill level based on the predefined order for the event
          const order = [
            "Sub-3",
            "Sub-5",
            "Sub-8",
            "Sub-10",
            "Sub-15",
            "Sub-20",
            "Sub-30",
            "Sub-35",
            "Sub-45",
            "Sub-60",
            "Sub-90",
            "Sub-2min",
            "Sub-3min",
            "Sub-4min",
            "Sub-5min",
          ];
          const aIdx = order.indexOf(a.category);
          const bIdx = order.indexOf(b.category);
          if (aIdx === -1 && bIdx === -1)
            return a.category.localeCompare(b.category);
          if (aIdx === -1) return 1;
          if (bIdx === -1) return -1;
          return aIdx - bIdx;
        }),
    };
  },
});

// Export all timer data for backup or analysis (admin-only)
export const exportTimerData = query({
  args: {},
  handler: async (ctx) => {
    const recentSolves = await ctx.db
      .query("solves")
      .order("desc")
      .take(2000);
    const allSessions = await ctx.db.query("sessions").collect();
    const allUserEventStats = await ctx.db.query("userEventStats").collect();
    const allUsers = await ctx.db.query("users").collect();

    const totalSolves = allUserEventStats.reduce(
      (sum, stat) => sum + stat.totalSolves,
      0,
    );

    // Create a user map for easy lookup when formatting solves and sessions
    const userMap = new Map(allUsers.map((u) => [u._id.toString(), u]));

    // Format solves for export (capped at 2000 most recent)
    const solvesExport = recentSolves.map((solve) => {
      const user = userMap.get(solve.userId.toString());
      return {
        id: solve._id.toString(),
        userId: solve.userId.toString(),
        userName: user?.name || "Unknown",
        userWcaId: user?.wcaId || "",
        event: solve.event,
        time: solve.time,
        timeFormatted: formatTime(solve.time),
        penalty: solve.penalty,
        finalTime: solve.finalTime,
        finalTimeFormatted: formatTime(solve.finalTime),
        timerMode: solve.timerMode || "normal",
        hasSplits: solve.splits && solve.splits.length > 0,
        splitMethod: solve.splitMethod || null,
        solveDate: new Date(solve.solveDate).toISOString(),
      };
    });

    // Format sessions for export
    const sessionsExport = allSessions.map((session) => {
      const user = userMap.get(session.userId.toString());
      return {
        id: session._id.toString(),
        userId: session.userId.toString(),
        userName: user?.name || "Unknown",
        name: session.name,
        event: session.event,
        solveCount: session.solveCount,
        isActive: session.isActive,
        hasDescription: !!session.description,
        tagCount: session.tags?.length || 0,
        createdAt: new Date(session.createdAt).toISOString(),
        updatedAt: new Date(session.updatedAt).toISOString(),
      };
    });

    // Format user event stats for export
    const userStatsExport = allUserEventStats.map((stat) => {
      const user = userMap.get(stat.userId.toString());
      return {
        userId: stat.userId.toString(),
        userName: user?.name || "Unknown",
        userWcaId: user?.wcaId || "",
        event: stat.event,
        eventName: WCA_EVENTS[stat.event] || stat.event,
        totalSolves: stat.totalSolves,
        totalNonDnfSolves: stat.totalNonDnfSolves,
        bestSingle: stat.bestSingle ? formatTime(stat.bestSingle) : null,
        bestAo5: stat.bestAo5 ? formatTime(stat.bestAo5) : null,
        bestAo12: stat.bestAo12 ? formatTime(stat.bestAo12) : null,
        bestAo100: stat.bestAo100 ? formatTime(stat.bestAo100) : null,
        overallAverage: stat.overallAverage
          ? formatTime(stat.overallAverage)
          : null,
        activeDays: stat.activeDays,
      };
    });

    return {
      exportedAt: new Date().toISOString(),
      solves: solvesExport,
      sessions: sessionsExport,
      userStats: userStatsExport,
      summary: {
        totalSolves,
        totalSessions: sessionsExport.length,
        totalUserStats: userStatsExport.length,
        uniqueUsers: new Set(
          allUserEventStats.map((s) => s.userId.toString()),
        ).size,
      },
    };
  },
});