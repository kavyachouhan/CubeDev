"use client";

import { useMemo, useState, useEffect } from "react";
import { BarChart3, Target } from "lucide-react";
import { cx } from "@/lib/cx";
import { Badge } from "@/components/ui/Badge";
import { CollapsibleCard } from "@/components/ui/Card";
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

interface TimeDistributionChartProps {
  solves: TimerRecord[];
}

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
    } catch {
      // Storage can be unavailable (private mode); the preference just won't persist.
    }
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
    true,
  );

  const distributionData = useMemo(() => {
    const validSolves = solves.filter((solve) => solve.finalTime !== Infinity);
    if (validSolves.length === 0) return null;

    const times = validSolves.map((solve) => solve.finalTime);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    const bucketCount = Math.min(8, Math.max(4, Math.ceil(Math.sqrt(times.length))));
    const bucketSize = (maxTime - minTime) / bucketCount;

    const buckets = Array.from({ length: bucketCount }, (_, i) => ({
      min: minTime + i * bucketSize,
      max: minTime + (i + 1) * bucketSize,
      count: 0,
      percentage: 0,
    }));

    times.forEach((time) => {
      const bucketIndex = Math.min(
        bucketCount - 1,
        Math.floor((time - minTime) / bucketSize),
      );
      if (buckets[bucketIndex]) buckets[bucketIndex].count++;
    });

    buckets.forEach((bucket) => {
      if (bucket && times.length > 0) {
        bucket.percentage = (bucket.count / times.length) * 100;
      }
    });

    const mean = times.reduce((sum, time) => sum + time, 0) / times.length;
    const sortedTimes = [...times].sort((a, b) => a - b);
    const median = sortedTimes[Math.floor(sortedTimes.length / 2)];
    const variance =
      times.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / times.length;
    const stdDev = Math.sqrt(variance);

    const mostFrequentBucket = buckets.reduce((max, bucket) => {
      if (!bucket || !max) return max || bucket;
      return bucket.count > max.count ? bucket : max;
    }, buckets[0]);

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

  const data = distributionData;
  const maxCount = data ? Math.max(...data.buckets.map((b) => b.count)) : 0;
  const stability = data
    ? data.stats.consistencyScore < 15
      ? { label: "Great", tone: "success" as const }
      : data.stats.consistencyScore < 25
        ? { label: "Good", tone: "warning" as const }
        : { label: "Needs Work", tone: "error" as const }
    : null;

  // Keep the same shape with placeholder rows before the first solve.
  const rows = data?.buckets ?? [null, null, null, null];

  const summary: [string, string | null][] = [
    ["Fastest solve", data ? formatTime(data.stats.min) : null],
    ["Slowest solve", data ? formatTime(data.stats.max) : null],
    [
      data
        ? `Most common range (${data.stats.mostFrequentRange.percentage.toFixed(1)}%)`
        : "Most common range",
      data
        ? `${formatTime(data.stats.mostFrequentRange.min)} – ${formatTime(data.stats.mostFrequentRange.max)}`
        : null,
    ],
    ["Half of solves under", data ? formatTime(data.stats.median) : null],
    ["A quarter of solves under", data ? formatTime(data.stats.q1) : null],
  ];

  return (
    <CollapsibleCard
      title="Time Distribution"
      open={isVisible}
      onOpenChange={setIsVisible}
      variant="static"
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <StatTile
            label="Typical"
            icon={<Target />}
            value={data ? formatTime(data.stats.median) : "—"}
            tone={data ? "success" : "default"}
          />
          <StatTile
            label="Stability"
            icon={<BarChart3 />}
            mono={false}
            value={stability?.label ?? "—"}
            tone={stability?.tone ?? "default"}
          />
        </div>

        <section className="rounded-(--radius-panel) border border-(--border) bg-(--surface-elevated) p-4 sm:p-5 space-y-4">
          <h4 className="type-label pb-3 border-b border-(--border)">Your Time Ranges</h4>
          <ul className="space-y-4">
            {rows.map((bucket, index) => {
              const width = bucket && maxCount > 0 ? (bucket.count / maxCount) * 100 : 0;
              const isHighest = Boolean(bucket) && bucket!.count === maxCount;
              return (
                <li key={index} className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5">
                    <div className="flex items-center gap-2.5">
                      <span
                        aria-hidden
                        className={cx(
                          "w-3 h-3 rounded-full shrink-0",
                          bucket
                            ? isHighest
                              ? "bg-(--primary)"
                              : "bg-(--primary)/50"
                            : "bg-(--surface) border border-(--border)",
                        )}
                      />
                      <span
                        className={cx(
                          "type-time text-sm sm:text-base font-medium",
                          bucket ? "text-(--text-primary)" : "text-(--text-muted)",
                        )}
                      >
                        {bucket ? `${formatTime(bucket.min)} – ${formatTime(bucket.max)}` : "— – —"}
                      </span>
                      {isHighest && (
                        <Badge tone="primary" shape="pill">
                          Most common
                        </Badge>
                      )}
                    </div>
                    <span className="type-caption font-medium">
                      {bucket
                        ? `${bucket.count} solve${bucket.count !== 1 ? "s" : ""} (${bucket.percentage.toFixed(1)}%)`
                        : "0 solves (0.0%)"}
                    </span>
                  </div>
                  <div
                    role="img"
                    aria-label={bucket ? `${bucket.percentage.toFixed(1)}% of solves` : "No data"}
                    className="w-full bg-(--surface) rounded-full h-2.5"
                  >
                    <div
                      className={cx(
                        "h-2.5 rounded-full transition-[width] duration-500",
                        isHighest ? "bg-(--primary)" : "bg-(--primary)/60",
                      )}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-2 p-4 rounded-(--radius-control) bg-(--surface) border border-(--border)">
            <h4 className="type-label mb-3">Performance Summary</h4>
            <ul className="text-sm text-(--text-muted) font-inter">
              {summary.map(([label, value], index) => (
                <li
                  key={label}
                  className="flex items-baseline justify-between gap-3 py-1.5 border-b border-(--border) last:border-0"
                >
                  <span className="min-w-0">{label}</span>
                  <span
                    className={cx(
                      "type-time font-medium shrink-0 text-right",
                      value === null
                        ? "text-(--text-muted)"
                        : index === 0
                          ? "text-(--success)"
                          : index === 1
                            ? "text-(--error)"
                            : index === 2
                              ? "text-(--primary)"
                              : "text-(--text-primary)",
                    )}
                  >
                    {value ?? "—"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </CollapsibleCard>
  );
}
