"use client";

import { useMemo, useState, useEffect } from "react";
import { Trophy, Calendar, Target, TrendingUp } from "lucide-react";
import { CardIcon, CollapsibleCard } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";

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

// Pre-computed event stats from database
interface EventStats {
  _id: string;
  userId: string;
  event: string;
  totalSolves: number;
  totalNonDnfSolves: number;
  bestSingle?: number;
  bestAo5?: number;
  bestAo12?: number;
  bestAo100?: number;
  overallAverage?: number;
  firstSolveDate?: number;
  lastSolveDate?: number;
  activeDays?: number;
  updatedAt: number;
}

interface PersonalBestsCardProps {
  solves: TimerRecord[];
  precomputedStats?: EventStats[]; // Optional pre-computed stats for accurate PBs
  selectedEvent?: string; // Current event filter
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

// Persistent boolean that reads/writes localStorage on first render
function usePersistentBool(key: string, defaultValue: boolean) {
  const [state, setState] = useState<boolean>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? defaultValue : JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState] as const;
}

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
  count: number,
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

export default function PersonalBestsCard({
  solves,
  precomputedStats,
  selectedEvent,
}: PersonalBestsCardProps) {
  const [showPersonalBests, setShowPersonalBests] = usePersistentBool(
    "cubelab-personal-bests-expanded",
    true,
  );

  // Get aggregated stats from precomputed data if available
  const aggregatedPrecomputedStats = useMemo(() => {
    if (!precomputedStats || precomputedStats.length === 0) return null;

    // If a specific event is selected, filter to that event
    const relevantStats =
      selectedEvent && selectedEvent !== "all"
        ? precomputedStats.filter((s) => s.event === selectedEvent)
        : precomputedStats;

    if (relevantStats.length === 0) return null;

    // Aggregate across all relevant events
    const totalSolves = relevantStats.reduce(
      (sum, s) => sum + s.totalSolves,
      0,
    );
    const totalNonDnfSolves = relevantStats.reduce(
      (sum, s) => sum + s.totalNonDnfSolves,
      0,
    );

    // Find best values across all events
    const bestSingles = relevantStats
      .map((s) => s.bestSingle)
      .filter((v): v is number => v !== undefined);
    const bestAo5s = relevantStats
      .map((s) => s.bestAo5)
      .filter((v): v is number => v !== undefined);
    const bestAo12s = relevantStats
      .map((s) => s.bestAo12)
      .filter((v): v is number => v !== undefined);
    const bestAo100s = relevantStats
      .map((s) => s.bestAo100)
      .filter((v): v is number => v !== undefined);

    return {
      bestSingle: bestSingles.length > 0 ? Math.min(...bestSingles) : null,
      bestAo5: bestAo5s.length > 0 ? Math.min(...bestAo5s) : null,
      bestAo12: bestAo12s.length > 0 ? Math.min(...bestAo12s) : null,
      bestAo100: bestAo100s.length > 0 ? Math.min(...bestAo100s) : null,
      totalSolves,
      successRate:
        totalSolves > 0 ? (totalNonDnfSolves / totalSolves) * 100 : 0,
    };
  }, [precomputedStats, selectedEvent]);

  const personalBests = useMemo(() => {
    if (solves.length === 0) return null;

    const sortedSolves = [...solves].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );
    const times = sortedSolves.map((solve) => solve.finalTime);
    const validTimes = times.filter((time) => time !== Infinity);

    // Best single
    const bestSingle =
      validTimes.length > 0
        ? {
            value: Math.min(...validTimes),
            solve: sortedSolves.find(
              (s) => s.finalTime === Math.min(...validTimes),
            )!,
          }
        : null;

    // Best averages
    const bestAo5 = findBestAverage(times, 5);
    const bestAo12 = findBestAverage(times, 12);
    const bestAo50 = findBestAverage(times, 50);
    const bestAo100 = findBestAverage(times, 100);

    // Current averages (last N solves)
    const currentAo5 =
      times.length >= 5 ? calculateAverage(times.slice(-5), 5) : null;
    const currentAo12 =
      times.length >= 12 ? calculateAverage(times.slice(-12), 12) : null;

    // Calculate overall stats
    const averageTime =
      validTimes.length > 0
        ? validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length
        : null;

    const successRate =
      solves.length > 0 ? (validTimes.length / solves.length) * 100 : 0;

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
      currentAo5,
      currentAo12,
      totalSolves: solves.length,
      averageTime,
      successRate,
    };
  }, [solves]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

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

  // No dedicated empty state: every value below already falls back to "—", so
  // with no solves the card keeps its real structure and simply reads empty.

  // Use precomputed stats for PBs when available (more accurate for users with many solves)
  // Fall back to calculated values from recent solves if no precomputed data
  const displayBestSingle =
    aggregatedPrecomputedStats?.bestSingle ?? personalBests?.bestSingle?.value;
  const displayBestAo5 =
    aggregatedPrecomputedStats?.bestAo5 ?? personalBests?.bestAo5?.value;
  const displayBestAo12 =
    aggregatedPrecomputedStats?.bestAo12 ?? personalBests?.bestAo12?.value;
  const displayBestAo100 =
    aggregatedPrecomputedStats?.bestAo100 ?? personalBests?.bestAo100?.value;
  const displayTotalSolves =
    aggregatedPrecomputedStats?.totalSolves ?? personalBests?.totalSolves ?? 0;
  const displaySuccessRate =
    aggregatedPrecomputedStats?.successRate ?? personalBests?.successRate ?? 0;

  const records = [
    {
      label: "Best Single",
      value: displayBestSingle,
      date: personalBests?.bestSingle?.solve?.timestamp,
      icon: Trophy,
      tone: "warning" as const,
    },
    {
      label: "Best Ao5",
      value: displayBestAo5,
      date: personalBests?.bestAo5?.solve?.timestamp,
      icon: Target,
      tone: "primary" as const,
    },
    {
      label: "Best Ao12",
      value: displayBestAo12,
      date: personalBests?.bestAo12?.solve?.timestamp,
      icon: TrendingUp,
      tone: "accent" as const,
    },
  ];

  const averageText = (value: number | null | undefined) =>
    value && isFinite(value) ? formatTime(value) : value === Infinity ? "DNF" : "—";

  const successTone =
    displayTotalSolves === 0
      ? "default"
      : displaySuccessRate >= 95
        ? "success"
        : displaySuccessRate >= 85
          ? "warning"
          : "error";

  return (
    <CollapsibleCard
      title="Personal Bests"
      open={showPersonalBests}
      onOpenChange={setShowPersonalBests}
      variant="static"
    >
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <StatTile
            label="Total"
            icon={<Target />}
            value={displayTotalSolves.toLocaleString()}
            tone="primary"
          />
          <StatTile
            label="Success"
            icon={<Trophy />}
            value={displayTotalSolves === 0 ? "—" : `${displaySuccessRate.toFixed(1)}%`}
            tone={successTone}
          />
          <StatTile
            label="Average"
            icon={<TrendingUp />}
            value={personalBests?.averageTime ? formatTime(personalBests.averageTime) : "—"}
          />
        </div>

        <section className="space-y-2">
          <h4 className="type-label pb-2 border-b border-(--border)">Personal Best Times</h4>
          <ul className="space-y-2">
            {records.map((record) => (
              <li
                key={record.label}
                className="flex items-center justify-between gap-3 p-3 rounded-(--radius-control) border border-(--border) bg-(--surface-elevated)"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <CardIcon tone={record.tone}>
                    <record.icon />
                  </CardIcon>
                  <div className="min-w-0">
                    <p className="type-label truncate">{record.label}</p>
                    {record.date && (
                      <p className="type-caption flex items-center gap-1 truncate">
                        <Calendar className="w-3 h-3 shrink-0" aria-hidden />
                        {formatDate(record.date)}
                      </p>
                    )}
                  </div>
                </div>
                <span
                  className={`type-time font-bold text-base sm:text-lg shrink-0 ${
                    record.value ? "text-(--text-primary)" : "text-(--text-muted)"
                  }`}
                >
                  {record.value ? formatTime(record.value) : "—"}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="pt-4 border-t border-(--border) space-y-2">
          <h4 className="type-label">Current Averages</h4>
          <div className="grid grid-cols-2 gap-3">
            <StatTile
              size="sm"
              label="Current Ao5"
              value={averageText(personalBests?.currentAo5)}
              tone={personalBests?.currentAo5 === Infinity ? "error" : "primary"}
            />
            <StatTile
              size="sm"
              label="Current Ao12"
              value={averageText(personalBests?.currentAo12)}
              tone={personalBests?.currentAo12 === Infinity ? "error" : "accent"}
            />
          </div>
        </section>
      </div>
    </CollapsibleCard>
  );
}
