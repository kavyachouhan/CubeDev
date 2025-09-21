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

interface PersonalBestsCardProps {
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

  const validTimes = times.filter((time) => time !== Infinity);
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

const findBestAverage = (
  times: number[],
  count: number
): { value: number; index: number } | null => {
  let bestAvg = null;
  let bestIndex = -1;

  for (let i = count - 1; i < times.length; i++) {
    const windowTimes = times.slice(i - count + 1, i + 1);
    const avg = calculateAverage(windowTimes, count);

    if (avg !== null && (bestAvg === null || avg < bestAvg)) {
      bestAvg = avg;
      bestIndex = i;
    }
  }

  return bestAvg !== null ? { value: bestAvg, index: bestIndex } : null;
};

export default function PersonalBestsCard({ solves }: PersonalBestsCardProps) {
  const personalBests = useMemo(() => {
    if (solves.length === 0) return null;

    const sortedSolves = [...solves].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
    const times = sortedSolves.map((solve) => solve.finalTime);
    const validTimes = times.filter((time) => time !== Infinity);

    // Best single
    const bestSingle =
      validTimes.length > 0
        ? {
            value: Math.min(...validTimes),
            solve: sortedSolves.find(
              (s) => s.finalTime === Math.min(...validTimes)
            )!,
          }
        : null;

    // Best averages
    const bestAo5 = findBestAverage(times, 5);
    const bestAo12 = findBestAverage(times, 12);
    const bestAo50 = findBestAverage(times, 50);
    const bestAo100 = findBestAverage(times, 100);

    return {
      bestSingle,
      bestAo5: bestAo5
        ? {
            ...bestAo5,
            solve: sortedSolves[bestAo5.index],
          }
        : null,
      bestAo12: bestAo12
        ? {
            ...bestAo12,
            solve: sortedSolves[bestAo12.index],
          }
        : null,
      bestAo50: bestAo50
        ? {
            ...bestAo50,
            solve: sortedSolves[bestAo50.index],
          }
        : null,
      bestAo100: bestAo100
        ? {
            ...bestAo100,
            solve: sortedSolves[bestAo100.index],
          }
        : null,
    };
  }, [solves]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!personalBests) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement">
          Personal Bests
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
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          </div>
          <div className="text-[var(--text-secondary)]">No records yet</div>
        </div>
      </div>
    );
  }

  const records = [
    {
      label: "Single",
      value: personalBests.bestSingle?.value,
      date: personalBests.bestSingle?.solve.timestamp,
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
      ),
      color: "text-[var(--warning)]",
    },
    {
      label: "Ao5",
      value: personalBests.bestAo5?.value,
      date: personalBests.bestAo5?.solve.timestamp,
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
      ),
      color: "text-[var(--primary)]",
    },
    {
      label: "Ao12",
      value: personalBests.bestAo12?.value,
      date: personalBests.bestAo12?.solve.timestamp,
      icon: (
        <svg
          className="w-5 h-5"
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
      color: "text-[var(--accent)]",
    },
    {
      label: "Ao50",
      value: personalBests.bestAo50?.value,
      date: personalBests.bestAo50?.solve.timestamp,
      icon: (
        <svg
          className="w-5 h-5"
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
      color: "text-[var(--success)]",
    },
    {
      label: "Ao100",
      value: personalBests.bestAo100?.value,
      date: personalBests.bestAo100?.solve.timestamp,
      icon: (
        <svg
          className="w-5 h-5"
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
      color: "text-[var(--text-primary)]",
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement">
        Personal Bests
      </h3>

      <div className="space-y-3">
        {records.map((record, index) => (
          <div key={index} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <span className={`${record.color}`}>{record.icon}</span>
              <div>
                <div className={`font-semibold ${record.color}`}>
                  {record.label}
                </div>
                {record.date && (
                  <div className="text-xs text-[var(--text-muted)]">
                    {formatDate(record.date)}
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className={`font-mono font-bold ${record.color}`}>
                {record.value ? formatTime(record.value) : "—"}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress indicators */}
      <div className="pt-4 border-t border-[var(--border)] space-y-2">
        <div className="text-sm text-[var(--text-muted)]">
          Recent improvements:
        </div>

        {/* Check for recent PBs (last 7 days) */}
        {(() => {
          const recentDate = new Date();
          recentDate.setDate(recentDate.getDate() - 7);

          const recentPBs = records.filter(
            (record) => record.date && record.date >= recentDate
          );

          if (recentPBs.length === 0) {
            return (
              <div className="text-xs text-[var(--text-muted)]">
                No recent personal bests
              </div>
            );
          }

          return (
            <div className="space-y-1">
              {recentPBs.map((pb, i) => (
                <div key={i} className="text-xs flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-[var(--success)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                  <span className="text-[var(--text-secondary)]">
                    New {pb.label} PB: {pb.value ? formatTime(pb.value) : "—"}
                  </span>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}