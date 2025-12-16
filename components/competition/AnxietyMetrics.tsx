"use client";

import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  Target,
  Zap,
  Brain,
  BarChart3,
  Info,
} from "lucide-react";
import { WCA_EVENTS } from "./CompetitionSimulator";
import { formatTime } from "@/lib/stats-utils";

interface SolveData {
  time: number;
  timestamp: number;
  event: string;
  isSimulation: boolean;
  sessionType: "practice" | "competition";
}

interface AnxietyMetric {
  name: string;
  value: number;
  description: string;
  status: "good" | "warning" | "alert";
  trend: "up" | "down" | "stable";
}

const STORAGE_KEY = "cubedev_simulation_history";

export default function AnxietyMetrics() {
  const [solveHistory, setSolveHistory] = useState<SolveData[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("333");
  const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("month");

  // Load solve history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSolveHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse solve history:", e);
      }
    }
  }, []);

  // Filter solves by event and time range
  const filteredSolves = useMemo(() => {
    const now = Date.now();
    const cutoff =
      timeRange === "week"
        ? now - 7 * 24 * 60 * 60 * 1000
        : timeRange === "month"
          ? now - 30 * 24 * 60 * 60 * 1000
          : 0;

    return solveHistory.filter(
      (solve) => solve.event === selectedEvent && solve.timestamp >= cutoff
    );
  }, [solveHistory, selectedEvent, timeRange]);

  // Separate practice and competition solves
  const practiceSolves = filteredSolves.filter(
    (s) => s.sessionType === "practice"
  );
  const competitionSolves = filteredSolves.filter(
    (s) => s.sessionType === "competition"
  );

  // Calculate metrics
  const calculateMetrics = (): AnxietyMetric[] => {
    if (practiceSolves.length < 5 || competitionSolves.length < 5) {
      return [];
    }

    const practiceAvg =
      practiceSolves.reduce((a, b) => a + b.time, 0) / practiceSolves.length;
    const compAvg =
      competitionSolves.reduce((a, b) => a + b.time, 0) /
      competitionSolves.length;

    // Performance drop percentage
    const performanceDrop = ((compAvg - practiceAvg) / practiceAvg) * 100;

    // Consistency metrics
    const practiceStdDev = Math.sqrt(
      practiceSolves.reduce(
        (sum, s) => sum + Math.pow(s.time - practiceAvg, 2),
        0
      ) / practiceSolves.length
    );
    const compStdDev = Math.sqrt(
      competitionSolves.reduce(
        (sum, s) => sum + Math.pow(s.time - compAvg, 2),
        0
      ) / competitionSolves.length
    );

    // Consistency change percentage
    const consistencyChange =
      ((compStdDev - practiceStdDev) / practiceStdDev) * 100;


    // First solve penalty (how much slower first solves are in competition)
    const firstCompSolves = competitionSolves.filter((_, i) => i % 5 === 0);
    const otherCompSolves = competitionSolves.filter((_, i) => i % 5 !== 0);
    const firstSolveAvg =
      firstCompSolves.length > 0
        ? firstCompSolves.reduce((a, b) => a + b.time, 0) /
          firstCompSolves.length
        : 0;
    const otherSolvesAvg =
      otherCompSolves.length > 0
        ? otherCompSolves.reduce((a, b) => a + b.time, 0) /
          otherCompSolves.length
        : 0;
    const firstSolvePenalty =
      otherSolvesAvg > 0
        ? ((firstSolveAvg - otherSolvesAvg) / otherSolvesAvg) * 100
        : 0;

    return [
      {
        name: "Competition Anxiety Index",
        value: Math.max(0, Math.min(100, performanceDrop * 5)),
        description:
          performanceDrop > 0
            ? `Your times are ${performanceDrop.toFixed(1)}% slower in competition simulations`
            : `Great job! You perform ${Math.abs(performanceDrop).toFixed(1)}% better under pressure`,
        status:
          performanceDrop > 10
            ? "alert"
            : performanceDrop > 5
              ? "warning"
              : "good",
        trend: performanceDrop > 5 ? "down" : "stable",
      },
      {
        name: "Consistency Under Pressure",
        value: Math.max(0, Math.min(100, 100 - consistencyChange * 2)),
        description:
          consistencyChange > 0
            ? `Your times are ${consistencyChange.toFixed(1)}% more variable in competition`
            : `You're ${Math.abs(consistencyChange).toFixed(1)}% more consistent under pressure`,
        status:
          consistencyChange > 20
            ? "alert"
            : consistencyChange > 10
              ? "warning"
              : "good",
        trend: consistencyChange > 10 ? "down" : "up",
      },
      {
        name: "First Solve Readiness",
        value: Math.max(0, Math.min(100, 100 - firstSolvePenalty * 3)),
        description:
          firstSolvePenalty > 0
            ? `Your first solves are ${firstSolvePenalty.toFixed(1)}% slower than subsequent solves`
            : `Your first solves are actually ${Math.abs(firstSolvePenalty).toFixed(1)}% faster!`,
        status:
          firstSolvePenalty > 15
            ? "alert"
            : firstSolvePenalty > 8
              ? "warning"
              : "good",
        trend: firstSolvePenalty > 10 ? "down" : "stable",
      },
      // Recovery Speed Metric
      (() => {
        // Define bad solve threshold as compAvg + 1.5 * compStdDev
        const badSolveThreshold = compAvg + compStdDev * 1.5;

        // Analyze recovery after bad solves
        let recoveryCount = 0;
        let quickRecoveries = 0; // Recovered to within avg + 0.5 stdDev on next solve

        for (let i = 0; i < competitionSolves.length - 1; i++) {
          if (competitionSolves[i].time > badSolveThreshold) {
            recoveryCount++;
            const nextSolve = competitionSolves[i + 1];
            // Check if next solve is a quick recovery
            if (nextSolve.time <= compAvg + compStdDev * 0.5) {
              quickRecoveries++;
            }
          }
        }

        // Calculate recovery rate
        const recoveryRate =
          recoveryCount > 0 ? (quickRecoveries / recoveryCount) * 100 : 50;

        // Handle case with insufficient bad solves
        if (recoveryCount < 2) {
          return {
            name: "Recovery Speed",
            value: 75,
            description:
              "Not enough data yet - need more competition solves with varied performance",
            status: "good" as const,
            trend: "stable" as const,
          };
        }

        return {
          name: "Recovery Speed",
          value: Math.max(0, Math.min(100, recoveryRate)),
          description:
            recoveryRate >= 60
              ? `You recover quickly ${recoveryRate.toFixed(0)}% of the time after a bad solve`
              : `You recovered quickly after ${quickRecoveries} of ${recoveryCount} bad solves (${recoveryRate.toFixed(0)}%)`,
          status:
            recoveryRate >= 60
              ? ("good" as const)
              : recoveryRate >= 40
                ? ("warning" as const)
                : ("alert" as const),
          trend:
            recoveryRate >= 50
              ? ("up" as const)
              : recoveryRate >= 30
                ? ("stable" as const)
                : ("down" as const),
        };
      })(),
    ];
  };

  const metrics = calculateMetrics();

  // Get status color
  const getStatusColor = (status: AnxietyMetric["status"]) => {
    switch (status) {
      case "good":
        return "text-[var(--success)]";
      case "warning":
        return "text-[var(--warning)]";
      case "alert":
        return "text-[var(--error)]";
    }
  };

  const getStatusBg = (status: AnxietyMetric["status"]) => {
    switch (status) {
      case "good":
        return "bg-[var(--success)]/10";
      case "warning":
        return "bg-[var(--warning)]/10";
      case "alert":
        return "bg-[var(--error)]/10";
    }
  };

  // Tips based on metrics
  const getTips = (): string[] => {
    const tips: string[] = [];

    if (metrics.length === 0) {
      return [
        "Complete more simulation rounds to see anxiety metrics",
        "Try to do at least 5 competition simulations and 5 practice sessions",
        "Use the pressure simulation settings to gradually build competition tolerance",
      ];
    }

    const anxietyIndex = metrics.find(
      (m) => m.name === "Competition Anxiety Index"
    );
    const consistency = metrics.find(
      (m) => m.name === "Consistency Under Pressure"
    );
    const firstSolve = metrics.find((m) => m.name === "First Solve Readiness");

    if (anxietyIndex && anxietyIndex.value > 50) {
      tips.push(
        "Practice with pressure simulation enabled to build competition tolerance"
      );
      tips.push("Try visualization techniques before starting your simulation");
    }

    if (consistency && consistency.value < 70) {
      tips.push(
        "Focus on maintaining your usual solving rhythm during competition"
      );
      tips.push("Practice with crowd noise to improve concentration");
    }

    if (firstSolve && firstSolve.value < 70) {
      tips.push(
        "Do a few warm-up solves before starting your competition round"
      );
      tips.push("Use the inspection time fully - don't rush your first solve");
    }

    if (tips.length === 0) {
      tips.push("Great work! Your competition performance is solid");
      tips.push("Keep practicing to maintain your skills under pressure");
    }

    return tips;
  };

  const tips = getTips();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="timer-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Performance Analysis
            </h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Analyze your competition anxiety patterns and improve under
              pressure.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="timer-card">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-[var(--text-secondary)] block mb-2">
              Event
            </label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              {WCA_EVENTS.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-[var(--text-secondary)] block mb-2">
              Time Range
            </label>
            <div className="flex gap-2">
              {(["week", "month", "all"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    timeRange === range
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {range === "week"
                    ? "Week"
                    : range === "month"
                      ? "Month"
                      : "All Time"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      {metrics.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {metrics.map((metric) => (
            <div key={metric.name} className="timer-card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-2 rounded-lg ${getStatusBg(metric.status)}`}
                  >
                    {metric.status === "good" ? (
                      <Target
                        className={`w-4 h-4 ${getStatusColor(metric.status)}`}
                      />
                    ) : metric.status === "warning" ? (
                      <Activity
                        className={`w-4 h-4 ${getStatusColor(metric.status)}`}
                      />
                    ) : (
                      <AlertTriangle
                        className={`w-4 h-4 ${getStatusColor(metric.status)}`}
                      />
                    )}
                  </div>
                  <span className="font-medium text-[var(--text-primary)]">
                    {metric.name}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {metric.trend === "up" ? (
                    <TrendingUp className="w-4 h-4 text-[var(--success)]" />
                  ) : metric.trend === "down" ? (
                    <TrendingDown className="w-4 h-4 text-[var(--error)]" />
                  ) : null}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-[var(--text-muted)]">Score</span>
                  <span className={getStatusColor(metric.status)}>
                    {Math.round(metric.value)}%
                  </span>
                </div>
                <div className="h-2 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      metric.status === "good"
                        ? "bg-[var(--success)]"
                        : metric.status === "warning"
                          ? "bg-[var(--warning)]"
                          : "bg-[var(--error)]"
                    }`}
                    style={{ width: `${metric.value}%` }}
                  />
                </div>
              </div>

              <p className="text-sm text-[var(--text-muted)]">
                {metric.description}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="timer-card text-center py-12">
          <BarChart3 className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
            Not Enough Data Yet
          </h3>
          <p className="text-[var(--text-muted)] max-w-md mx-auto">
            Complete at least 5 practice sessions and 5 competition simulations
            to see your anxiety metrics and performance analysis.
          </p>
        </div>
      )}

      {/* Comparison Stats */}
      {practiceSolves.length > 0 || competitionSolves.length > 0 ? (
        <div className="timer-card">
          <h3 className="font-bold text-[var(--text-primary)] mb-4">
            Session Comparison
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[var(--surface-elevated)] rounded-lg text-center">
              <div className="text-xs text-[var(--text-muted)] mb-1">
                Practice Sessions
              </div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">
                {practiceSolves.length}
              </div>
              {practiceSolves.length > 0 && (
                <div className="text-sm text-[var(--text-muted)] mt-1">
                  Avg:{" "}
                  {formatTime(
                    practiceSolves.reduce((a, b) => a + b.time, 0) /
                      practiceSolves.length
                  )}
                </div>
              )}
            </div>
            <div className="p-4 bg-[var(--surface-elevated)] rounded-lg text-center">
              <div className="text-xs text-[var(--text-muted)] mb-1">
                Competition Simulations
              </div>
              <div className="text-2xl font-bold text-[var(--primary)]">
                {competitionSolves.length}
              </div>
              {competitionSolves.length > 0 && (
                <div className="text-sm text-[var(--text-muted)] mt-1">
                  Avg:{" "}
                  {formatTime(
                    competitionSolves.reduce((a, b) => a + b.time, 0) /
                      competitionSolves.length
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Tips */}
      <div className="timer-card">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-[var(--primary)]" />
          <h3 className="font-bold text-[var(--text-primary)]">
            Improvement Tips
          </h3>
        </div>
        <ul className="space-y-3">
          {tips.map((tip, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <div className="p-1 mt-0.5 bg-[var(--primary)]/10 rounded">
                <Zap className="w-3 h-3 text-[var(--primary)]" />
              </div>
              <span className="text-sm text-[var(--text-secondary)]">
                {tip}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Info Card */}
      <div className="timer-card bg-[var(--surface-elevated)]">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-[var(--info)] flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-[var(--text-primary)] mb-1">
              About Competition Anxiety Metrics
            </h4>
            <p className="text-sm text-[var(--text-muted)]">
              These metrics compare your performance in practice mode vs
              competition simulation mode. A lower anxiety index means you
              perform consistently regardless of pressure. Track these over time
              to see improvement in your competition mindset.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}