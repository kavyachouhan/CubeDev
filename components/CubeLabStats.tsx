"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser } from "@/components/UserProvider";
import { useSessionState } from "./timer/hooks/useSessionState";
import { useDatabaseSync } from "./timer/hooks/useDatabaseSync";
import { useLocalStorageManager } from "./timer/hooks/useLocalStorageManager";
import SolveHeatmap from "./stats/SolveHeatmap";
import StatsFilters from "./stats/StatsFilters";
import TimeProgressChart from "./stats/TimeProgressChart";
import TimeDistributionChart from "./stats/TimeDistributionChart";
import PersonalBestsCard from "./stats/PersonalBestsCard";

interface TimerRecord {
  id: string;
  time: number;
  timestamp: Date;
  scramble: string;
  penalty: "none" | "+2" | "DNF";
  finalTime: number;
  event: string;
  sessionId: string;
  notes?: string;
  tags?: string[];
  splits?: Array<{ phase: string; time: number }>;
  splitMethod?: string;
}

export type TimeFilter = "7d" | "30d" | "3m" | "6m" | "1y" | "all" | "custom";
export type EventFilter = string | "all";
export type SessionFilter = string | "all";
export type TimeRangeFilter =
  | "single"
  | "ao5"
  | "ao12"
  | "ao50"
  | "ao100"
  | "all";

interface FilterState {
  timeFilter: TimeFilter;
  eventFilter: EventFilter;
  sessionFilter: SessionFilter;
  timeRangeFilter: TimeRangeFilter;
  customTimeRange?: {
    startDate: string;
    endDate: string;
  };
  secondaryEventFilter?: string;
}

export default function CubeLabStats() {
  const { user } = useUser();
  const { sessions, isSessionsInitialized } = useSessionState(user?.convexId);
  const { dbSolves, isLoading } = useDatabaseSync(user?.convexId);
  const { loadFromCache } = useLocalStorageManager(user?.convexId);

  const [filters, setFilters] = useState<FilterState>({
    timeFilter: "30d",
    eventFilter: "all",
    sessionFilter: "all",
    timeRangeFilter: "all",
  });

  const [solves, setSolves] = useState<TimerRecord[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize solves from database or cache
  useEffect(() => {
    if (!user?.convexId || isInitialized) return;

    const initializeSolves = () => {
      let allSolves: TimerRecord[] = [];

      // Prefer database solves if available
      if (dbSolves && dbSolves.length > 0) {
        allSolves = dbSolves.map((solve) => ({
          id: solve._id,
          time: solve.time,
          timestamp: new Date(solve.solveDate),
          scramble: solve.scramble,
          penalty: solve.penalty as "none" | "+2" | "DNF",
          finalTime: solve.finalTime,
          event: solve.event,
          sessionId: solve.sessionId,
          notes: solve.comment,
          tags: solve.tags,
        }));
      } else {
        // Fallback to cached solves
        const cachedSolves = loadFromCache("solves", []) as TimerRecord[];
        allSolves = cachedSolves.map((solve) => ({
          ...solve,
          timestamp: new Date(solve.timestamp),
        }));
      }

      setSolves(allSolves);
      setIsInitialized(true);
    };

    // Only initialize when sessions are ready
    if (isSessionsInitialized) {
      initializeSolves();
    }
  }, [
    user?.convexId,
    dbSolves,
    isSessionsInitialized,
    loadFromCache,
    isInitialized,
  ]);

  // Apply filters to solves
  const filteredSolves = useMemo(() => {
    if (!solves.length) return [];

    let filtered = [...solves];

    // Time filter
    if (filters.timeFilter === "custom" && filters.customTimeRange) {
      const startDate = new Date(filters.customTimeRange.startDate);
      const endDate = new Date(filters.customTimeRange.endDate);
      endDate.setHours(23, 59, 59, 999); // Include entire end date

      filtered = filtered.filter(
        (solve) => solve.timestamp >= startDate && solve.timestamp <= endDate
      );
    } else if (filters.timeFilter !== "all") {
      const now = new Date();
      let cutoffDate = new Date();

      switch (filters.timeFilter) {
        case "7d":
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case "30d":
          cutoffDate.setDate(now.getDate() - 30);
          break;
        case "3m":
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
        case "6m":
          cutoffDate.setMonth(now.getMonth() - 6);
          break;
        case "1y":
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      filtered = filtered.filter((solve) => solve.timestamp >= cutoffDate);
    }

    // Session filter (primary)
    if (filters.sessionFilter !== "all") {
      filtered = filtered.filter(
        (solve) => solve.sessionId === filters.sessionFilter
      );

      // Secondary event filter (only applies when a specific session is selected)
      if (filters.secondaryEventFilter) {
        filtered = filtered.filter(
          (solve) => solve.event === filters.secondaryEventFilter
        );
      }
    } else {
      // Event filter (only applies when all sessions are selected)
      if (filters.eventFilter !== "all") {
        filtered = filtered.filter(
          (solve) => solve.event === filters.eventFilter
        );
      }
    }

    return filtered.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }, [solves, filters]);

  // Get available events from solves
  const availableEvents = useMemo(() => {
    const events = Array.from(new Set(solves.map((solve) => solve.event)));
    return events.sort();
  }, [solves]);

  // Get available sessions
  const availableSessions = useMemo(() => {
    return sessions.filter((session) =>
      solves.some((solve) => solve.sessionId === session.id)
    );
  }, [sessions, solves]);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  if (!user) {
    return (
      <div className="p-8 text-center">
        <div className="text-[var(--text-secondary)]">
          Please log in to view statistics
        </div>
      </div>
    );
  }

  if (isLoading || !isInitialized) {
    return (
      <div className="p-8">
        <div className="stats-grid gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="timer-card h-48 animate-pulse bg-[var(--surface-elevated)]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!solves.length) {
    return (
      <div className="p-8 text-center">
        <div className="timer-card max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 bg-[var(--surface-elevated)] rounded-lg flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[var(--text-muted)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            No Statistics Yet
          </h3>
          <p className="text-[var(--text-secondary)] mb-4">
            Start solving cubes to see your progress and analytics here!
          </p>
          <div className="text-sm text-[var(--text-muted)]">
            Your solving data, personal bests, and improvement trends will
            appear once you complete some solves.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Filters */}
      <StatsFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        availableEvents={availableEvents}
        availableSessions={availableSessions}
        allSolveHistory={solves}
      />

      {/* Time Progress Chart */}
      <div className="timer-card lg:col-span-2">
        <TimeProgressChart solves={filteredSolves} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Personal Bests */}
        <div className="timer-card">
          <PersonalBestsCard solves={filteredSolves} />
        </div>

        {/* Time Distribution */}
        <div className="timer-card">
          <TimeDistributionChart solves={filteredSolves} />
        </div>
      </div>

      {/* Solve Heatmap */}
      <div className="timer-card">
        <SolveHeatmap solves={filteredSolves} />
      </div>
    </div>
  );
}