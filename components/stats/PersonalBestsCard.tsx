"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Trophy,
  Calendar,
  Target,
  TrendingUp,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

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
  const [showPersonalBests, setShowPersonalBests] = usePersistentBool(
    "cubelab-personal-bests-expanded",
    true
  );
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

  if (!personalBests) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowPersonalBests(!showPersonalBests)}
            className="flex items-center gap-1 p-2 text-[var(--text-muted)] hover:text-[var(--primary)] rounded transition-colors"
            title={
              showPersonalBests ? "Hide personal bests" : "Show personal bests"
            }
          >
            <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement hover:text-[var(--primary)] transition-colors">
              Personal Bests
            </h3>
            {showPersonalBests ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setShowPersonalBests(!showPersonalBests)}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-md transition-colors"
            title={showPersonalBests ? "Hide personal bests" : "Show personal bests"}
          >
            {showPersonalBests ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        {showPersonalBests && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-[var(--surface-elevated)] rounded-lg flex items-center justify-center">
              <Trophy className="w-8 h-8 text-[var(--text-muted)]" />
            </div>
            <div className="text-[var(--text-secondary)]">No records yet</div>
            <div className="text-sm text-[var(--text-muted)] mt-2">
              Start solving to see your personal bests!
            </div>
          </div>
        )}
      </div>
    );
  }

  const records = [
    {
      label: "Best Single",
      value: personalBests.bestSingle?.value,
      date: personalBests.bestSingle?.solve.timestamp,
      icon: Trophy,
      color: "text-[var(--warning)]",
      bgColor: "bg-[var(--warning)]/10",
    },
    {
      label: "Best Ao5",
      value: personalBests.bestAo5?.value,
      date: personalBests.bestAo5?.solve.timestamp,
      icon: Target,
      color: "text-[var(--primary)]",
      bgColor: "bg-[var(--primary)]/10",
    },
    {
      label: "Best Ao12",
      value: personalBests.bestAo12?.value,
      date: personalBests.bestAo12?.solve.timestamp,
      icon: TrendingUp,
      color: "text-[var(--accent)]",
      bgColor: "bg-[var(--accent)]/10",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowPersonalBests(!showPersonalBests)}
          className="flex items-center gap-1 p-2 text-[var(--text-muted)] hover:text-[var(--primary)] rounded transition-colors"
          title={
            showPersonalBests ? "Hide personal bests" : "Show personal bests"
          }
        >
          <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement hover:text-[var(--primary)] transition-colors">
            Personal Bests
          </h3>
          {showPersonalBests ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        <button
            onClick={() => setShowPersonalBests(!showPersonalBests)}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-md transition-colors"
            title={showPersonalBests ? "Hide personal bests" : "Show personal bests"}
          >
            {showPersonalBests ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
      </div>

      {showPersonalBests && (
        <>
          {/* Personal Best Times */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <div className="bg-[var(--surface-elevated)] rounded-lg p-3 border border-[var(--border)]">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1 bg-[var(--primary)]/10 rounded">
                  <Target className="w-3 h-3 text-[var(--primary)]" />
                </div>
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide truncate">
                  Total
                </div>
              </div>
              <div className="text-sm sm:text-lg font-bold text-[var(--primary)] font-mono truncate">
                {personalBests.totalSolves.toLocaleString()}
              </div>
            </div>

            <div className="bg-[var(--surface-elevated)] rounded-lg p-3 border border-[var(--border)]">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1 bg-[var(--success)]/10 rounded">
                  <Trophy className="w-3 h-3 text-[var(--success)]" />
                </div>
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide truncate">
                  Success
                </div>
              </div>
              <div
                className={`text-sm sm:text-lg font-bold font-mono truncate ${
                  personalBests.successRate >= 95
                    ? "text-[var(--success)]"
                    : personalBests.successRate >= 85
                      ? "text-[var(--warning)]"
                      : "text-[var(--error)]"
                }`}
              >
                {personalBests.successRate.toFixed(1)}%
              </div>
            </div>

            <div className="bg-[var(--surface-elevated)] rounded-lg p-3 border border-[var(--border)]">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1 bg-[var(--accent)]/10 rounded">
                  <TrendingUp className="w-3 h-3 text-[var(--accent)]" />
                </div>
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide truncate">
                  Average
                </div>
              </div>
              <div className="text-sm sm:text-lg font-bold text-[var(--text-primary)] font-mono truncate">
                {personalBests.averageTime
                  ? formatTime(personalBests.averageTime)
                  : "—"}
              </div>
            </div>
          </div>

          {/* Personal Best Times */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-[var(--text-primary)] border-b border-[var(--border)] pb-2">
              Personal Best Times
            </div>

            {records.map((record, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg ${record.bgColor} border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors`}
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div
                    className={`p-2 ${record.bgColor} rounded-lg flex-shrink-0`}
                  >
                    <record.icon className={`w-4 h-4 ${record.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className={`font-semibold text-sm sm:text-base ${record.color} truncate`}
                    >
                      {record.label}
                    </div>
                    {record.date && (
                      <div className="text-xs text-[var(--text-muted)] flex items-center gap-1 truncate">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">
                          {formatDate(record.date)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div
                    className={`font-mono font-bold text-sm sm:text-lg ${record.color}`}
                  >
                    {record.value ? formatTime(record.value) : "—"}
                  </div>
                </div>
              </div>
            ))}

            {/* Current Averages */}
            <div className="pt-4 border-t border-[var(--border)] space-y-3">
              <div className="text-sm font-medium text-[var(--text-primary)]">
                Current Averages
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]">
                  <div>
                    <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide truncate">
                      Current Ao5
                    </div>
                    <div className="font-mono font-bold text-sm sm:text-base text-[var(--primary)] truncate">
                      {personalBests.currentAo5 &&
                      isFinite(personalBests.currentAo5)
                        ? formatTime(personalBests.currentAo5)
                        : personalBests.currentAo5 === Infinity
                          ? "DNF"
                          : "—"}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]">
                  <div>
                    <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide truncate">
                      Current Ao12
                    </div>
                    <div className="font-mono font-bold text-sm sm:text-base text-[var(--accent)] truncate">
                      {personalBests.currentAo12 &&
                      isFinite(personalBests.currentAo12)
                        ? formatTime(personalBests.currentAo12)
                        : personalBests.currentAo12 === Infinity
                          ? "DNF"
                          : "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}