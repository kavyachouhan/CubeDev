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

interface AverageProgressCardProps {
  solves: TimerRecord[];
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

const calculateAverage = (times: number[], count: number): number | null => {
  if (times.length < count) return null;

  const recentTimes = times.slice(-count);
  const validTimes = recentTimes.filter((time) => time !== Infinity);

  if (validTimes.length < count - 1) return null;

  if (count <= 3) {
    return validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length;
  }

  const sorted = [...validTimes].sort((a, b) => a - b);
  const toRemove = Math.floor(count * 0.05) || 1;
  const trimmed = sorted.slice(toRemove, -toRemove);

  if (trimmed.length === 0) return null;

  return trimmed.reduce((sum, time) => sum + time, 0) / trimmed.length;
};

export default function AverageProgressCard({
  solves,
}: AverageProgressCardProps) {
  const progressData = useMemo(() => {
    if (solves.length === 0) return null;

    const sortedSolves = [...solves].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
    const times = sortedSolves.map((solve) => solve.finalTime);

    // Current averages
    const currentAo5 = calculateAverage(times, 5);
    const currentAo12 = calculateAverage(times, 12);
    const currentAo50 = calculateAverage(times, 50);
    const currentAo100 = calculateAverage(times, 100);

    // Historical comparison (30 days ago vs now)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSolves = sortedSolves.filter(
      (solve) => solve.timestamp >= thirtyDaysAgo
    );
    const oldSolves = sortedSolves.filter(
      (solve) => solve.timestamp < thirtyDaysAgo
    );

    const historicalAo12 =
      oldSolves.length >= 12
        ? calculateAverage(
            oldSolves.slice(-12).map((s) => s.finalTime),
            12
          )
        : null;

    // Calculate improvement
    const improvement =
      currentAo12 && historicalAo12
        ? ((historicalAo12 - currentAo12) / historicalAo12) * 100
        : null;

    // Weekly progress (last 4 weeks)
    const weeklyProgress = [];
    for (let week = 0; week < 4; week++) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (week + 1) * 7);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - week * 7);

      const weekSolves = sortedSolves.filter(
        (solve) => solve.timestamp >= weekStart && solve.timestamp < weekEnd
      );

      const weekTimes = weekSolves.map((s) => s.finalTime);
      const weekAo12 = calculateAverage(weekTimes, 12);

      weeklyProgress.unshift({
        week: week + 1,
        solveCount: weekSolves.length,
        ao12: weekAo12,
      });
    }

    return {
      current: {
        ao5: currentAo5,
        ao12: currentAo12,
        ao50: currentAo50,
        ao100: currentAo100,
      },
      historical: {
        ao12: historicalAo12,
      },
      improvement,
      weeklyProgress,
      recentSolveCount: recentSolves.length,
    };
  }, [solves]);

  if (!progressData) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement">
          Average Progress
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
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
          <div className="text-[var(--text-secondary)]">No progress data</div>
        </div>
      </div>
    );
  }

  const averages = [
    {
      label: "Ao5",
      current: progressData.current.ao5,
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
          />
        </svg>
      ),
    },
    {
      label: "Ao12",
      current: progressData.current.ao12,
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      label: "Ao50",
      current: progressData.current.ao50,
      icon: (
        <svg
          className="w-4 h-4"
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
      ),
    },
    {
      label: "Ao100",
      current: progressData.current.ao100,
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement">
        Average Progress
      </h3>

      {/* Current averages */}
      <div className="space-y-3">
        {averages.map((avg, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-muted)]">{avg.icon}</span>
              <span className="text-sm font-medium text-[var(--text-secondary)]">
                {avg.label}
              </span>
            </div>
            <div className="font-mono font-bold text-[var(--text-primary)]">
              {avg.current ? formatTime(avg.current) : "—"}
            </div>
          </div>
        ))}
      </div>

      {/* Improvement indicator */}
      {progressData.improvement !== null && (
        <div className="pt-3 border-t border-[var(--border)]">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-muted)]">
              30-day improvement:
            </span>
            <div
              className={`flex items-center gap-1 text-sm font-semibold ${
                progressData.improvement > 0
                  ? "text-[var(--success)]"
                  : progressData.improvement < 0
                    ? "text-[var(--error)]"
                    : "text-[var(--text-muted)]"
              }`}
            >
              {progressData.improvement > 0 && "↗"}
              {progressData.improvement < 0 && "↘"}
              {progressData.improvement === 0 && "→"}
              <span>{Math.abs(progressData.improvement).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Weekly mini chart */}
      <div className="pt-3 border-t border-[var(--border)]">
        <div className="text-sm text-[var(--text-muted)] mb-2">
          Weekly Ao12 trend:
        </div>
        <div className="flex items-end gap-1 h-12">
          {progressData.weeklyProgress.map((week, index) => {
            const maxAo12 = Math.max(
              ...(progressData.weeklyProgress
                .map((w) => w.ao12)
                .filter(Boolean) as number[])
            );
            const minAo12 = Math.min(
              ...(progressData.weeklyProgress
                .map((w) => w.ao12)
                .filter(Boolean) as number[])
            );

            const height = week.ao12
              ? ((week.ao12 - minAo12) / (maxAo12 - minAo12)) * 100
              : 0;

            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-[var(--primary)] rounded-sm opacity-70 transition-all hover:opacity-100"
                  style={{
                    height: `${Math.max(height, 10)}%`,
                  }}
                  title={`Week ${week.week}: ${week.ao12 ? formatTime(week.ao12) : "No data"} (${week.solveCount} solves)`}
                />
                <div className="text-xs text-[var(--text-muted)] mt-1">
                  W{week.week}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent activity */}
      <div className="pt-3 border-t border-[var(--border)] text-sm">
        <span className="text-[var(--text-muted)]">Recent activity: </span>
        <span className="font-semibold text-[var(--text-primary)]">
          {progressData.recentSolveCount} solves
        </span>
        <span className="text-[var(--text-muted)]"> in last 30 days</span>
      </div>
    </div>
  );
}