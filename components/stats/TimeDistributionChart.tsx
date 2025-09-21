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

interface TimeDistributionChartProps {
  solves: TimerRecord[];
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
  const distributionData = useMemo(() => {
    const validSolves = solves.filter((solve) => solve.finalTime !== Infinity);

    if (validSolves.length === 0) return [];

    const times = validSolves.map((solve) => solve.finalTime);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    // Create buckets
    const bucketCount = Math.min(
      15,
      Math.max(5, Math.ceil(Math.sqrt(times.length)))
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
      buckets[bucketIndex].count++;
    });

    // Calculate percentages
    buckets.forEach((bucket) => {
      bucket.percentage = (bucket.count / times.length) * 100;
    });

    return buckets;
  }, [solves]);

  const maxPercentage = Math.max(
    ...distributionData.map((b) => b.percentage),
    1
  );

  if (distributionData.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement">
          Time Distribution
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div className="text-[var(--text-secondary)]">No data to display</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement">
        Time Distribution
      </h3>

      <div className="space-y-2">
        {distributionData.map((bucket, index) => (
          <div key={index} className="flex items-center gap-3">
            {/* Time range */}
            <div className="w-20 text-xs text-[var(--text-muted)] text-right font-mono">
              {formatTime(bucket.min)}
            </div>

            {/* Bar */}
            <div className="flex-1 relative">
              <div className="w-full h-6 bg-[var(--surface)] rounded-md overflow-hidden">
                <div
                  className="h-full bg-[var(--primary)] transition-all duration-300"
                  style={{
                    width: `${(bucket.percentage / maxPercentage) * 100}%`,
                  }}
                />
              </div>

              {/* Count and percentage overlay */}
              {bucket.count > 0 && (
                <div className="absolute inset-0 flex items-center justify-between px-2">
                  <span className="text-xs font-medium text-white">
                    {bucket.count}
                  </span>
                  <span className="text-xs text-white opacity-80">
                    {bucket.percentage.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>

            {/* Max time */}
            <div className="w-20 text-xs text-[var(--text-muted)] font-mono">
              {formatTime(bucket.max)}
            </div>
          </div>
        ))}
      </div>

      {/* Statistics summary */}
      <div className="pt-4 border-t border-[var(--border)] space-y-2">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-[var(--text-muted)]">Total solves: </span>
            <span className="font-semibold text-[var(--text-primary)]">
              {solves.filter((s) => s.finalTime !== Infinity).length}
            </span>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">Range: </span>
            <span className="font-semibold text-[var(--text-primary)]">
              {formatTime(
                distributionData[distributionData.length - 1].max -
                  distributionData[0].min
              )}
            </span>
          </div>
        </div>

        {/* Most frequent range */}
        {(() => {
          const mostFrequent = distributionData.reduce((max, bucket) =>
            bucket.count > max.count ? bucket : max
          );

          return (
            <div className="text-sm">
              <span className="text-[var(--text-muted)]">Most frequent: </span>
              <span className="font-semibold text-[var(--text-primary)]">
                {formatTime(mostFrequent.min)} - {formatTime(mostFrequent.max)}
              </span>
              <span className="text-[var(--text-muted)]">
                {" "}
                ({mostFrequent.count} solves)
              </span>
            </div>
          );
        })()}
      </div>
    </div>
  );
}