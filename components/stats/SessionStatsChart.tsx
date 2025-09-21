"use client";

import { useMemo } from "react";

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
}

interface Session {
  id: string;
  name: string;
  event: string;
  createdAt: Date;
  solveCount: number;
  convexId?: string;
}

interface SessionStatsChartProps {
  solves: TimerRecord[];
  sessions: Session[];
}

const formatTime = (ms: number): string => {
  if (ms === Infinity) return "DNF";

  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `${minutes}:${seconds.toFixed(2).padStart(5, "0")}`;
  }

  return seconds.toFixed(2);
};

const calculateAverage = (times: number[]): number | null => {
  const validTimes = times.filter((time) => time !== Infinity);
  if (validTimes.length === 0) return null;
  return validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length;
};

export default function SessionStatsChart({
  solves,
  sessions,
}: SessionStatsChartProps) {
  const sessionStats = useMemo(() => {
    return sessions
      .map((session) => {
        const sessionSolves = solves.filter(
          (solve) => solve.sessionId === session.id
        );
        const validSolves = sessionSolves.filter(
          (solve) => solve.finalTime !== Infinity
        );
        const times = validSolves.map((solve) => solve.finalTime);

        const bestTime = times.length > 0 ? Math.min(...times) : null;
        const averageTime = calculateAverage(
          sessionSolves.map((s) => s.finalTime)
        );
        const successRate =
          sessionSolves.length > 0
            ? (validSolves.length / sessionSolves.length) * 100
            : 0;

        return {
          session,
          solveCount: sessionSolves.length,
          bestTime,
          averageTime,
          successRate,
        };
      })
      .filter((stat) => stat.solveCount > 0)
      .sort((a, b) => b.solveCount - a.solveCount);
  }, [solves, sessions]);

  const maxSolves = Math.max(...sessionStats.map((s) => s.solveCount), 1);

  if (sessionStats.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement">
          Session Statistics
        </h3>
        <div className="text-center py-8">
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
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v0"
              />
            </svg>
          </div>
          <div className="text-[var(--text-secondary)]">No session data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement">
        Session Statistics
      </h3>

      <div className="space-y-3">
        {sessionStats.slice(0, 8).map((stat, index) => (
          <div key={stat.session.id} className="space-y-2">
            {/* Session header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {stat.session.name}
                </span>
                <span className="text-xs text-[var(--text-muted)] px-2 py-1 bg-[var(--surface)] rounded">
                  {stat.session.event}
                </span>
              </div>
              <span className="text-xs text-[var(--text-muted)]">
                {stat.solveCount} solves
              </span>
            </div>

            {/* Progress bar */}
            <div className="relative">
              <div className="w-full h-3 bg-[var(--surface)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--primary)] transition-all duration-300"
                  style={{
                    width: `${(stat.solveCount / maxSolves) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Session stats */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="text-[var(--text-muted)]">Best</div>
                <div className="font-mono text-[var(--success)]">
                  {stat.bestTime ? formatTime(stat.bestTime) : "—"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[var(--text-muted)]">Average</div>
                <div className="font-mono text-[var(--text-primary)]">
                  {stat.averageTime ? formatTime(stat.averageTime) : "—"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[var(--text-muted)]">Success</div>
                <div
                  className={`font-mono ${
                    stat.successRate >= 95
                      ? "text-[var(--success)]"
                      : stat.successRate >= 85
                        ? "text-[var(--warning)]"
                        : "text-[var(--error)]"
                  }`}
                >
                  {stat.successRate.toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary stats */}
      <div className="pt-4 border-t border-[var(--border)] space-y-2">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-[var(--text-muted)]">Active sessions: </span>
            <span className="font-semibold text-[var(--text-primary)]">
              {sessionStats.length}
            </span>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">Total solves: </span>
            <span className="font-semibold text-[var(--text-primary)]">
              {sessionStats.reduce((sum, s) => sum + s.solveCount, 0)}
            </span>
          </div>
        </div>

        {/* Most active session */}
        {sessionStats.length > 0 && (
          <div className="text-sm">
            <span className="text-[var(--text-muted)]">Most active: </span>
            <span className="font-semibold text-[var(--text-primary)]">
              {sessionStats[0].session.name}
            </span>
            <span className="text-[var(--text-muted)]">
              {" "}
              ({sessionStats[0].solveCount} solves)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}