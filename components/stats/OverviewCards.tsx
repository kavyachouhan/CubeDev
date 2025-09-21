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

interface OverviewCardsProps {
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

  if (validTimes.length < count - 1) return null; // Too many DNFs

  if (count <= 3) {
    // Ao1, Ao3: simple average
    return validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length;
  }

  // Ao5, Ao12: remove fastest and slowest, then average
  const sorted = [...validTimes].sort((a, b) => a - b);
  const toRemove = Math.floor(count * 0.05) || 1; // Remove at least one from each end
  const trimmed = sorted.slice(toRemove, -toRemove);

  if (trimmed.length === 0) return null;

  return trimmed.reduce((sum, time) => sum + time, 0) / trimmed.length;
};

export default function OverviewCards({ solves }: OverviewCardsProps) {
  const stats = useMemo(() => {
    if (solves.length === 0) {
      return {
        totalSolves: 0,
        bestSingle: null,
        currentAo5: null,
        currentAo12: null,
        averageTime: null,
        totalTime: 0,
        successRate: 0,
      };
    }

    const validSolves = solves.filter((solve) => solve.finalTime !== Infinity);
    const times = solves.map((solve) => solve.finalTime);
    const validTimes = validSolves.map((solve) => solve.finalTime);

    const bestSingle = validTimes.length > 0 ? Math.min(...validTimes) : null;
    const currentAo5 = calculateAverage(times, 5);
    const currentAo12 = calculateAverage(times, 12);
    const averageTime =
      validTimes.length > 0
        ? validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length
        : null;
    const totalTime = validTimes.reduce((sum, time) => sum + time, 0);
    const successRate =
      solves.length > 0 ? (validSolves.length / solves.length) * 100 : 0;

    return {
      totalSolves: solves.length,
      bestSingle,
      currentAo5,
      currentAo12,
      averageTime,
      totalTime,
      successRate,
    };
  }, [solves]);

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const cards = [
    {
      title: "Total Solves",
      value: stats.totalSolves.toLocaleString(),
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
      color: "text-[var(--primary)]",
      bgColor: "bg-[var(--primary)] bg-opacity-10",
    },
    {
      title: "Best Single",
      value: stats.bestSingle ? formatTime(stats.bestSingle) : "—",
      icon: (
        <svg
          className="w-6 h-6"
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
      color: "text-[var(--success)]",
      bgColor: "bg-[var(--success)] bg-opacity-10",
    },
    {
      title: "Current Ao5",
      value: stats.currentAo5 ? formatTime(stats.currentAo5) : "—",
      icon: (
        <svg
          className="w-6 h-6"
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
      color: "text-[var(--accent)]",
      bgColor: "bg-[var(--accent)] bg-opacity-10",
    },
    {
      title: "Current Ao12",
      value: stats.currentAo12 ? formatTime(stats.currentAo12) : "—",
      icon: (
        <svg
          className="w-6 h-6"
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
      color: "text-[var(--warning)]",
      bgColor: "bg-[var(--warning)] bg-opacity-10",
    },
    {
      title: "Average Time",
      value: stats.averageTime ? formatTime(stats.averageTime) : "—",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: "text-[var(--text-primary)]",
      bgColor: "bg-[var(--surface-elevated)]",
    },
    {
      title: "Total Time",
      value: formatDuration(stats.totalTime),
      icon: (
        <svg
          className="w-6 h-6"
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
      bgColor: "bg-[var(--surface-elevated)]",
    },
    {
      title: "Success Rate",
      value: `${stats.successRate.toFixed(1)}%`,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color:
        stats.successRate >= 95
          ? "text-[var(--success)]"
          : stats.successRate >= 85
            ? "text-[var(--warning)]"
            : "text-[var(--error)]",
      bgColor:
        stats.successRate >= 95
          ? "bg-[var(--success)] bg-opacity-10"
          : stats.successRate >= 85
            ? "bg-[var(--warning)] bg-opacity-10"
            : "bg-[var(--error)] bg-opacity-10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`timer-card p-4 ${card.bgColor} border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`${card.color}`}>{card.icon}</div>
            <div className={`text-xs ${card.color} font-medium`}>
              {card.title}
            </div>
          </div>
          <div className={`text-xl font-bold ${card.color} font-mono`}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}