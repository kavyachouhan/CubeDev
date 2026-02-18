import { query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Helper function to format time in ms to human-readable format
function formatTime(ms: number): string {
  if (ms === -1 || ms === Infinity) return "DNF";
  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(2)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = (seconds % 60).toFixed(2);
  return `${minutes}:${remainingSeconds.padStart(5, "0")}`;
}

// Mapping of event IDs to human-readable names
const eventNames: Record<string, string> = {
  "333": "3x3x3",
  "222": "2x2x2",
  "444": "4x4x4",
  "555": "5x5x5",
  "666": "6x6x6",
  "777": "7x7x7",
  "333bf": "3x3 BLD",
  "333oh": "3x3 OH",
  pyram: "Pyraminx",
  skewb: "Skewb",
  sq1: "Square-1",
  clock: "Clock",
  minx: "Megaminx",
  "444bf": "4x4 BLD",
  "555bf": "5x5 BLD",
  "333mbf": "3x3 MBLD",
  "333fm": "FMC",
};

// Admin API endpoints for competitions analytics and monitoring
export const getCompetitionAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;

    // Get all simulations
    const allSimulations = await ctx.db
      .query("competitionSimulations")
      .collect();

    // Get all results for additional stats
    const allResults = await ctx.db
      .query("competitionSimulationResults")
      .collect();

    // Status breakdown
    const byStatus = {
      inProgress: allSimulations.filter((s) => s.status === "in-progress")
        .length,
      completed: allSimulations.filter((s) => s.status === "completed").length,
      abandoned: allSimulations.filter((s) => s.status === "abandoned").length,
    };

    // Completion rate
    const completionRate =
      allSimulations.length > 0
        ? Math.round((byStatus.completed / allSimulations.length) * 100)
        : 0;

    // Abandonment rate
    const abandonmentRate =
      allSimulations.length > 0
        ? Math.round((byStatus.abandoned / allSimulations.length) * 100)
        : 0;

    // Get unique competitions
    const uniqueCompetitions = new Set(
      allSimulations.map((s) => s.competitionId),
    );

    // Get unique users
    const uniqueUsers = new Set(allSimulations.map((s) => s.userId));

    // Recent activity stats
    const simulationsToday = allSimulations.filter(
      (s) => s.createdAt >= oneDayAgo,
    ).length;
    const simulationsThisWeek = allSimulations.filter(
      (s) => s.createdAt >= oneWeekAgo,
    ).length;
    const simulationsThisMonth = allSimulations.filter(
      (s) => s.createdAt >= thirtyDaysAgo,
    ).length;
    const simulationsLastMonth = allSimulations.filter(
      (s) => s.createdAt >= sixtyDaysAgo && s.createdAt < thirtyDaysAgo,
    ).length;

    // Week over week growth
    const lastWeekStart = oneWeekAgo - 7 * 24 * 60 * 60 * 1000;
    const simulationsLastWeek = allSimulations.filter(
      (s) => s.createdAt >= lastWeekStart && s.createdAt < oneWeekAgo,
    ).length;
    const weekOverWeekGrowth =
      simulationsLastWeek > 0
        ? Math.round(
            ((simulationsThisWeek - simulationsLastWeek) /
              simulationsLastWeek) *
              100,
          )
        : simulationsThisWeek > 0
          ? 100
          : 0;

    // Month over month growth
    const monthOverMonthGrowth =
      simulationsLastMonth > 0
        ? Math.round(
            ((simulationsThisMonth - simulationsLastMonth) /
              simulationsLastMonth) *
              100,
          )
        : simulationsThisMonth > 0
          ? 100
          : 0;

    // Weekly trend for the last 12 weeks
    const weeklyTrend: Array<{
      week: string;
      count: number;
      completedCount: number;
    }> = [];
    for (let i = 11; i >= 0; i--) {
      const weekStart = now - (i + 1) * 7 * 24 * 60 * 60 * 1000;
      const weekEnd = now - i * 7 * 24 * 60 * 60 * 1000;
      const count = allSimulations.filter(
        (s) => s.createdAt >= weekStart && s.createdAt < weekEnd,
      ).length;
      const completedCount = allSimulations.filter(
        (s) =>
          s.createdAt >= weekStart &&
          s.createdAt < weekEnd &&
          s.status === "completed",
      ).length;
      const date = new Date(weekEnd);
      weeklyTrend.push({
        week: `${date.getMonth() + 1}/${date.getDate()}`,
        count,
        completedCount,
      });
    }

    // Event popularity and completion rates
    const eventStats: Record<
      string,
      { count: number; completed: number; results: number }
    > = {};
    allSimulations.forEach((s) => {
      s.selectedEvents.forEach((event) => {
        if (!eventStats[event]) {
          eventStats[event] = { count: 0, completed: 0, results: 0 };
        }
        eventStats[event].count += 1;
        if (s.status === "completed" && s.completedEvents?.includes(event)) {
          eventStats[event].completed += 1;
        }
      });
    });

    // Count results per event for additional insights
    allResults.forEach((r) => {
      if (eventStats[r.eventId]) {
        eventStats[r.eventId].results += 1;
      }
    });

    const popularEvents = Object.entries(eventStats)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([event, stats]) => ({
        event,
        eventName: eventNames[event] || event,
        ...stats,
        completionRate:
          stats.count > 0
            ? Math.round((stats.completed / stats.count) * 100)
            : 0,
      }));

    // Top competitions by number of simulations, with completion rates and unique user counts
    const competitionCounts: Record<
      string,
      {
        id: string;
        name: string;
        country?: string;
        city?: string;
        date: string;
        count: number;
        completed: number;
        uniqueUsers: Set<string>;
      }
    > = {};

    allSimulations.forEach((s) => {
      if (!competitionCounts[s.competitionId]) {
        competitionCounts[s.competitionId] = {
          id: s.competitionId,
          name: s.competitionName,
          country: s.competitionCountry,
          city: s.competitionCity,
          date: s.competitionDate,
          count: 0,
          completed: 0,
          uniqueUsers: new Set(),
        };
      }
      competitionCounts[s.competitionId].count += 1;
      competitionCounts[s.competitionId].uniqueUsers.add(s.userId);
      if (s.status === "completed") {
        competitionCounts[s.competitionId].completed += 1;
      }
    });

    const topCompetitions = Object.values(competitionCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)
      .map((comp) => ({
        id: comp.id,
        name: comp.name,
        country: comp.country,
        city: comp.city,
        date: comp.date,
        count: comp.count,
        completed: comp.completed,
        uniqueUsers: comp.uniqueUsers.size,
        completionRate:
          comp.count > 0 ? Math.round((comp.completed / comp.count) * 100) : 0,
      }));

    // Atmosphere settings stats
    const atmosphereStats = {
      avgCrowdNoise: 0,
      avgPressure: 0,
      distractionsEnabled: 0,
      timerDelayEnabled: 0,
      judgeInteractionsEnabled: 0,
    };

    if (allSimulations.length > 0) {
      let totalCrowdNoise = 0;
      let totalPressure = 0;

      allSimulations.forEach((s) => {
        if (s.atmosphereSettings) {
          totalCrowdNoise += s.atmosphereSettings.crowdNoise;
          totalPressure += s.atmosphereSettings.pressure;
          if (s.atmosphereSettings.distractions)
            atmosphereStats.distractionsEnabled++;
          if (s.atmosphereSettings.timerDelay)
            atmosphereStats.timerDelayEnabled++;
          if (s.atmosphereSettings.judgeInteractions)
            atmosphereStats.judgeInteractionsEnabled++;
        }
      });

      atmosphereStats.avgCrowdNoise = Math.round(
        totalCrowdNoise / allSimulations.length,
      );
      atmosphereStats.avgPressure = Math.round(
        totalPressure / allSimulations.length,
      );
    }

    // Average number of events selected per simulation
    const totalEvents = allSimulations.reduce(
      (acc, s) => acc + s.selectedEvents.length,
      0,
    );
    const avgEventsPerSimulation =
      allSimulations.length > 0
        ? (totalEvents / allSimulations.length).toFixed(1)
        : "0";

    // Total solves across all results
    const totalSolves = allResults.reduce((acc, r) => acc + r.solves.length, 0);

    // Average time stats (for 3x3x3 only as main event)
    const threeByThreeResults = allResults.filter(
      (r) => r.eventId === "333" && r.average > 0,
    );
    const avgThreeByThreeTime =
      threeByThreeResults.length > 0
        ? Math.round(
            threeByThreeResults.reduce((acc, r) => acc + r.average, 0) /
              threeByThreeResults.length,
          )
        : 0;

    // Best average times per event
    const eventBestAverages: Record<string, { best: number; userId: string }> =
      {};
    allResults.forEach((r) => {
      if (r.average > 0 && r.average !== Infinity) {
        if (
          !eventBestAverages[r.eventId] ||
          r.average < eventBestAverages[r.eventId].best
        ) {
          eventBestAverages[r.eventId] = { best: r.average, userId: r.userId };
        }
      }
    });

    // Country breakdown of competitions
    const countryBreakdown: Record<string, number> = {};
    allSimulations.forEach((s) => {
      if (s.competitionCountry) {
        countryBreakdown[s.competitionCountry] =
          (countryBreakdown[s.competitionCountry] || 0) + 1;
      }
    });
    const topCountries = Object.entries(countryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([country, count]) => ({ country, count }));

    // User engagement stats
    const userSimulationCounts: Record<string, number> = {};
    allSimulations.forEach((s) => {
      userSimulationCounts[s.userId] =
        (userSimulationCounts[s.userId] || 0) + 1;
    });

    const avgSimulationsPerUser =
      uniqueUsers.size > 0
        ? (allSimulations.length / uniqueUsers.size).toFixed(1)
        : "0";

    const powerUsers = Object.values(userSimulationCounts).filter(
      (count) => count >= 5,
    ).length;
    const casualUsers = Object.values(userSimulationCounts).filter(
      (count) => count < 5,
    ).length;

    return {
      // Overview stats
      totalSimulations: allSimulations.length,
      totalResults: allResults.length,
      totalSolves,
      uniqueCompetitions: uniqueCompetitions.size,
      uniqueUsers: uniqueUsers.size,
      avgEventsPerSimulation,
      avgSimulationsPerUser,

      // Status breakdown
      byStatus,
      completionRate,
      abandonmentRate,

      // Trends
      simulationsToday,
      simulationsThisWeek,
      simulationsThisMonth,
      weekOverWeekGrowth,
      monthOverMonthGrowth,
      weeklyTrend,

      // Events
      popularEvents,
      eventBestAverages: Object.entries(eventBestAverages).map(
        ([event, data]) => ({
          event,
          eventName: eventNames[event] || event,
          bestTime: formatTime(data.best),
          bestTimeMs: data.best,
        }),
      ),

      // Competitions
      topCompetitions,
      topCountries,

      // Atmosphere
      atmosphereStats,

      // User engagement
      powerUsers,
      casualUsers,

      // Performance
      avgThreeByThreeTime: formatTime(avgThreeByThreeTime),
      avgThreeByThreeTimeMs: avgThreeByThreeTime,
    };
  },
});

// Get list of competitions with stats for admin overview
export const getCompetitionsList = query({
  args: {},
  handler: async (ctx) => {
    const simulations = await ctx.db.query("competitionSimulations").collect();

    // Group simulations by competition
    const competitionMap: Record<
      string,
      {
        id: string;
        name: string;
        country?: string;
        city?: string;
        venue?: string;
        date: string;
        simulations: typeof simulations;
        uniqueUsers: Set<string>;
      }
    > = {};

    simulations.forEach((s) => {
      if (!competitionMap[s.competitionId]) {
        competitionMap[s.competitionId] = {
          id: s.competitionId,
          name: s.competitionName,
          country: s.competitionCountry,
          city: s.competitionCity,
          venue: s.competitionVenue,
          date: s.competitionDate,
          simulations: [],
          uniqueUsers: new Set(),
        };
      }
      competitionMap[s.competitionId].simulations.push(s);
      competitionMap[s.competitionId].uniqueUsers.add(s.userId);
    });

    return Object.values(competitionMap)
      .map((comp) => {
        const completedCount = comp.simulations.filter(
          (s) => s.status === "completed",
        ).length;
        const inProgressCount = comp.simulations.filter(
          (s) => s.status === "in-progress",
        ).length;
        const abandonedCount = comp.simulations.filter(
          (s) => s.status === "abandoned",
        ).length;

        // Get all unique events for this competition
        const allEvents = new Set<string>();
        comp.simulations.forEach((s) => {
          s.selectedEvents.forEach((e) => allEvents.add(e));
        });

        return {
          id: comp.id,
          name: comp.name,
          country: comp.country,
          city: comp.city,
          venue: comp.venue,
          date: comp.date,
          totalSimulations: comp.simulations.length,
          completedCount,
          inProgressCount,
          abandonedCount,
          uniqueUsers: comp.uniqueUsers.size,
          completionRate:
            comp.simulations.length > 0
              ? Math.round((completedCount / comp.simulations.length) * 100)
              : 0,
          events: Array.from(allEvents).map((e) => ({
            id: e,
            name: eventNames[e] || e,
          })),
          latestActivity: Math.max(
            ...comp.simulations.map((s) => s.lastActivityAt),
          ),
        };
      })
      .sort((a, b) => b.totalSimulations - a.totalSimulations);
  },
});

// Get user activity stats for competitions (for admin monitoring and engagement analysis)
export const getCompetitionUserActivity = query({
  args: {},
  handler: async (ctx) => {
    const simulations = await ctx.db.query("competitionSimulations").collect();
    const results = await ctx.db
      .query("competitionSimulationResults")
      .collect();

    // Group by user
    const userStats: Record<
      string,
      {
        userId: string;
        totalSimulations: number;
        completedSimulations: number;
        totalResults: number;
        totalSolves: number;
        eventsUsed: Set<string>;
        competitionsUsed: Set<string>;
        lastActivity: number;
      }
    > = {};

    simulations.forEach((s) => {
      if (!userStats[s.userId]) {
        userStats[s.userId] = {
          userId: s.userId,
          totalSimulations: 0,
          completedSimulations: 0,
          totalResults: 0,
          totalSolves: 0,
          eventsUsed: new Set(),
          competitionsUsed: new Set(),
          lastActivity: 0,
        };
      }
      userStats[s.userId].totalSimulations++;
      if (s.status === "completed") {
        userStats[s.userId].completedSimulations++;
      }
      s.selectedEvents.forEach((e) => userStats[s.userId].eventsUsed.add(e));
      userStats[s.userId].competitionsUsed.add(s.competitionId);
      if (s.lastActivityAt > userStats[s.userId].lastActivity) {
        userStats[s.userId].lastActivity = s.lastActivityAt;
      }
    });

    results.forEach((r) => {
      if (userStats[r.userId]) {
        userStats[r.userId].totalResults++;
        userStats[r.userId].totalSolves += r.solves.length;
      }
    });

    // Fetch user details for all users in one batch to avoid N+1 query problem
    const userIds = Object.keys(userStats);
    const userDocs = await Promise.all(
      userIds.map(async (userId) => {
        try {
          const user = await ctx.db.get(userId as Id<"users">);
          return user;
        } catch {
          return null;
        }
      }),
    );

    const userMap = new Map(
      userDocs
        .filter((u): u is NonNullable<typeof u> => u !== null)
        .map((u) => [u._id as string, u]),
    );

    return Object.values(userStats)
      .map((stats) => {
        const user = userMap.get(stats.userId);
        return {
          userId: stats.userId,
          totalSimulations: stats.totalSimulations,
          completedSimulations: stats.completedSimulations,
          totalResults: stats.totalResults,
          totalSolves: stats.totalSolves,
          lastActivity: stats.lastActivity,
          userName: user?.name || "Unknown User",
          userWcaId: user?.wcaId || null,
          userAvatar: user?.avatar || null,
          eventsCount: stats.eventsUsed.size,
          competitionsCount: stats.competitionsUsed.size,
        };
      })
      .sort((a, b) => b.totalSimulations - a.totalSimulations);
  },
});

// Get recent simulations with user details for admin monitoring
export const getRecentSimulations = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    const simulations = await ctx.db
      .query("competitionSimulations")
      .order("desc")
      .take(limit);

    // Get user details
    const userIds = [...new Set(simulations.map((s) => s.userId))];
    const userDocs = await Promise.all(
      userIds.map(async (userId) => {
        try {
          const user = await ctx.db.get(userId);
          return user;
        } catch {
          return null;
        }
      }),
    );

    const userMap = new Map(
      userDocs
        .filter((u): u is NonNullable<typeof u> => u !== null)
        .map((u) => [u._id, u]),
    );

    return simulations.map((s) => {
      const user = userMap.get(s.userId);
      return {
        id: s._id,
        competitionId: s.competitionId,
        competitionName: s.competitionName,
        competitionCountry: s.competitionCountry,
        selectedEvents: s.selectedEvents.map((e) => ({
          id: e,
          name: eventNames[e] || e,
        })),
        status: s.status,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
        lastActivityAt: s.lastActivityAt,
        userName: user?.name || "Unknown User",
        userWcaId: user?.wcaId || null,
        userAvatar: user?.avatar || null,
        completedEvents: s.completedEvents.length,
        totalEvents: s.selectedEvents.length,
      };
    });
  },
});