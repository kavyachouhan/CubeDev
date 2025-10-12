"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  BarChart3,
  Target,
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

interface TimeDistributionChartProps {
  solves: TimerRecord[];
}

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

const formatTime = (ms: number): string => {
  if (ms === Infinity) return "DNF";

  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `${minutes}:${seconds.toFixed(1).padStart(4, "0")}`;
  }

  return seconds.toFixed(1);
};

export default function TimeDistributionChart({
  solves,
}: TimeDistributionChartProps) {
  const [isVisible, setIsVisible] = usePersistentBool(
    "time-distribution-chart-visible",
    true
  );

  const distributionData = useMemo(() => {
    const validSolves = solves.filter((solve) => solve.finalTime !== Infinity);

    if (validSolves.length === 0) return null;

    const times = validSolves.map((solve) => solve.finalTime);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    // Create buckets based on screen size and data
    const bucketCount = Math.min(
      8,
      Math.max(4, Math.ceil(Math.sqrt(times.length)))
    );
    const bucketSize = (maxTime - minTime) / bucketCount;

    const buckets = Array.from({ length: bucketCount }, (_, i) => ({
      min: minTime + i * bucketSize,
      max: minTime + (i + 1) * bucketSize,
      count: 0,
      percentage: 0,
    }));

    // Fill buckets
    times.forEach((time) => {
      const bucketIndex = Math.min(
        bucketCount - 1,
        Math.floor((time - minTime) / bucketSize)
      );
      if (buckets[bucketIndex]) {
        buckets[bucketIndex].count++;
      }
    });

    // Calculate percentages
    buckets.forEach((bucket) => {
      if (bucket && times.length > 0) {
        bucket.percentage = (bucket.count / times.length) * 100;
      }
    });

    // Calculate statistics
    const mean = times.reduce((sum, time) => sum + time, 0) / times.length;
    const sortedTimes = [...times].sort((a, b) => a - b);
    const median = sortedTimes[Math.floor(sortedTimes.length / 2)];

    // Calculate standard deviation
    const variance =
      times.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) /
      times.length;
    const stdDev = Math.sqrt(variance);

    // Find most frequent bucket - with safety check
    const mostFrequentBucket = buckets.reduce((max, bucket) => {
      if (!bucket || !max) return max || bucket;
      return bucket.count > max.count ? bucket : max;
    }, buckets[0]);

    // Calculate quartiles
    const q1 = sortedTimes[Math.floor(sortedTimes.length * 0.25)];
    const q3 = sortedTimes[Math.floor(sortedTimes.length * 0.75)];

    return {
      buckets,
      stats: {
        mean,
        median,
        stdDev,
        q1,
        q3,
        min: minTime,
        max: maxTime,
        mostFrequentRange: mostFrequentBucket,
        totalSolves: times.length,
        consistencyScore: (stdDev / mean) * 100, // Lower is better
      },
    };
  }, [solves]);

  const hasData =
    distributionData &&
    distributionData.buckets &&
    distributionData.buckets.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="flex items-center gap-1 p-2 text-[var(--text-muted)] hover:text-[var(--primary)] rounded transition-colors"
          title={isVisible ? "Hide chart" : "Show chart"}
        >
          <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement hover:text-[var(--primary)] transition-colors">
            Time Distribution
          </h3>
          {isVisible ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-md transition-colors"
          title={isVisible ? "Hide chart" : "Show chart"}
        >
          {isVisible ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>

      {isVisible && (
        <>
          {hasData ? (
            <>
              {/* Quick Stats Cards */}
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <div className="bg-[var(--surface-elevated)] rounded-lg p-3 sm:p-4 border border-[var(--border)]">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-[var(--success)]" />
                    <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-medium">
                      Typical
                    </div>
                  </div>
                  <div className="text-sm sm:text-base font-bold text-[var(--success)] font-mono">
                    {formatTime(distributionData.stats.median)}
                  </div>
                </div>
                <div className="bg-[var(--surface-elevated)] rounded-lg p-3 sm:p-4 border border-[var(--border)]">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-[var(--accent)]" />
                    <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-medium">
                      Stability
                    </div>
                  </div>
                  <div
                    className={`text-sm sm:text-base font-bold font-mono ${
                      distributionData.stats.consistencyScore < 15
                        ? "text-emerald-400"
                        : distributionData.stats.consistencyScore < 25
                          ? "text-yellow-400"
                          : "text-red-400"
                    }`}
                  >
                    {distributionData.stats.consistencyScore < 15
                      ? "Great"
                      : distributionData.stats.consistencyScore < 25
                        ? "Good"
                        : "Needs Work"}
                  </div>
                </div>
              </div>

              {/* Time Ranges */}
              <div className="bg-[var(--surface-elevated)] rounded-lg p-4 sm:p-5 border border-[var(--border)] space-y-5">
                <div className="text-base sm:text-lg font-semibold text-[var(--text-primary)] border-b border-[var(--border)] pb-3">
                  Your Time Ranges
                </div>

                <div className="space-y-4">
                  {distributionData.buckets.map((bucket, index) => {
                    if (!bucket) return null;
                    const maxCount = Math.max(
                      ...distributionData.buckets
                        .filter((b) => b)
                        .map((b) => b.count)
                    );
                    const widthPercentage =
                      maxCount > 0 ? (bucket.count / maxCount) * 100 : 0;
                    const isHighest = bucket.count === maxCount;

                    return (
                      <div key={index} className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-4 h-4 rounded-full ${isHighest ? "bg-blue-500" : "bg-blue-400"}`}
                            />
                            <span className="font-mono text-sm sm:text-base text-[var(--text-primary)] font-medium">
                              {formatTime(bucket.min)} -{" "}
                              {formatTime(bucket.max)}
                            </span>
                            {isHighest && (
                              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full font-medium">
                                Most Common
                              </span>
                            )}
                          </div>
                          <div className="text-[var(--text-muted)] text-sm font-medium">
                            {bucket.count} solve{bucket.count !== 1 ? "s" : ""}{" "}
                            ({bucket.percentage.toFixed(1)}%)
                          </div>
                        </div>
                        <div className="w-full bg-[var(--surface)] rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${
                              isHighest
                                ? "bg-gradient-to-r from-blue-600 to-blue-500"
                                : "bg-gradient-to-r from-blue-500 to-blue-400"
                            }`}
                            style={{ width: `${widthPercentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Performance Insights */}
                <div className="mt-6 p-4 sm:p-5 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
                  <div className="text-base sm:text-lg font-semibold text-[var(--text-primary)] mb-3">
                    Performance Summary
                  </div>
                  <div className="space-y-2 text-sm text-[var(--text-muted)]">
                    <div className="flex flex-wrap items-center gap-1">
                      <span>• Your fastest solve:</span>
                      <span className="font-mono text-emerald-400 font-medium">
                        {formatTime(distributionData.stats.min)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <span>• Your slowest solve:</span>
                      <span className="font-mono text-red-400 font-medium">
                        {formatTime(distributionData.stats.max)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <span>
                        • Most of your solves (
                        {distributionData.stats.mostFrequentRange.percentage.toFixed(
                          1
                        )}
                        %) are between
                      </span>
                      <span className="font-mono text-blue-400 font-medium">
                        {formatTime(
                          distributionData.stats.mostFrequentRange.min
                        )}{" "}
                        -{" "}
                        {formatTime(
                          distributionData.stats.mostFrequentRange.max
                        )}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <span>• 50% of your solves are faster than</span>
                      <span className="font-mono text-[var(--text-primary)] font-medium">
                        {formatTime(distributionData.stats.median)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <span>• 25% of your solves are faster than</span>
                      <span className="font-mono text-[var(--text-primary)] font-medium">
                        {formatTime(distributionData.stats.q1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-[var(--surface-elevated)] rounded-lg flex items-center justify-center border border-[var(--border)]">
                <BarChart3 className="w-8 h-8 text-[var(--text-muted)]" />
              </div>
              <div className="text-[var(--text-secondary)]">
                No data to display
              </div>
              <div className="text-sm text-[var(--text-muted)] mt-2">
                Start solving to see your time distribution!
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}