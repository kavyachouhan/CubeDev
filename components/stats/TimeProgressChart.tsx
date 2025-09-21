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

interface TimeProgressChartProps {
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

export default function TimeProgressChart({ solves }: TimeProgressChartProps) {
  const chartData = useMemo(() => {
    if (solves.length === 0) return [];

    const sortedSolves = [...solves].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
    const data = [];

    for (let i = 0; i < sortedSolves.length; i++) {
      const solve = sortedSolves[i];
      const times = sortedSolves.slice(0, i + 1).map((s) => s.finalTime);

      data.push({
        index: i + 1,
        time: solve.finalTime,
        single: solve.finalTime !== Infinity ? solve.finalTime : null,
        ao5: calculateAverage(times, 5),
        ao12: calculateAverage(times, 12),
        timestamp: solve.timestamp,
      });
    }

    return data;
  }, [solves]);

  const chartBounds = useMemo(() => {
    if (chartData.length === 0)
      return { minTime: 0, maxTime: 100, minIndex: 0, maxIndex: 100 };

    const validTimes = chartData
      .flatMap((d) => [d.single, d.ao5, d.ao12])
      .filter(
        (t) => t !== null && t !== undefined && t !== Infinity
      ) as number[];

    if (validTimes.length === 0)
      return { minTime: 0, maxTime: 100, minIndex: 0, maxIndex: 100 };

    const minTime = Math.min(...validTimes);
    const maxTime = Math.max(...validTimes);
    const padding = (maxTime - minTime) * 0.1;

    return {
      minTime: Math.max(0, minTime - padding),
      maxTime: maxTime + padding,
      minIndex: 1,
      maxIndex: chartData.length,
    };
  }, [chartData]);

  const getYPosition = (time: number | null) => {
    if (time === null || time === Infinity) return null;
    const { minTime, maxTime } = chartBounds;
    return 100 - ((time - minTime) / (maxTime - minTime)) * 100;
  };

  const getXPosition = (index: number) => {
    const { minIndex, maxIndex } = chartBounds;
    return ((index - minIndex) / (maxIndex - minIndex)) * 100;
  };

  // Ao12 trend line (from first to last valid Ao12)
  const ao12TrendLine = useMemo(() => {
    const validPoints = chartData
      .map((d, i) => ({ index: i + 1, time: d.ao12 }))
      .filter((p) => p.time !== null) as { index: number; time: number }[];

    if (validPoints.length < 2) return null;

    const firstPoint = validPoints[0];
    const lastPoint = validPoints[validPoints.length - 1];

    const startY = getYPosition(firstPoint.time);
    const endY = getYPosition(lastPoint.time);

    if (startY === null || endY === null) return null;

    return {
      start: { x: getXPosition(firstPoint.index), y: startY },
      end: { x: getXPosition(lastPoint.index), y: endY },
      improvement: lastPoint.time < firstPoint.time,
    };
  }, [chartData, chartBounds]);

  if (chartData.length === 0) {
    return (
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
        <div className="text-[var(--text-secondary)]">No data to display</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement">
          Time Progress
        </h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[var(--text-muted)] rounded-full opacity-60"></div>
            <span className="text-[var(--text-muted)]">Single</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[var(--primary)] rounded-full"></div>
            <span className="text-[var(--text-muted)]">Ao5</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[var(--accent)] rounded-full"></div>
            <span className="text-[var(--text-muted)]">Ao12</span>
          </div>
        </div>
      </div>

      <div className="relative">
        {/* Chart container */}
        <div className="relative w-full h-64 bg-[var(--surface)] rounded-lg border border-[var(--border)] overflow-hidden">
          <svg
            className="w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            <defs>
              <pattern
                id="grid"
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 10 0 L 0 0 0 10"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="0.2"
                  opacity="0.3"
                />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />

            {/* Trend line */}
            {ao12TrendLine && (
              <line
                x1={ao12TrendLine.start.x}
                y1={ao12TrendLine.start.y}
                x2={ao12TrendLine.end.x}
                y2={ao12TrendLine.end.y}
                stroke={
                  ao12TrendLine.improvement ? "var(--success)" : "var(--error)"
                }
                strokeWidth="0.5"
                strokeDasharray="2,2"
                opacity="0.7"
              />
            )}

            {/* Single times (dots) */}
            {chartData.map((point, index) => {
              const x = getXPosition(point.index);
              const y = getYPosition(point.single);

              if (y === null) return null;

              return (
                <circle
                  key={`single-${index}`}
                  cx={x}
                  cy={y}
                  r="0.8"
                  fill="var(--text-muted)"
                  opacity="0.6"
                />
              );
            })}

            {/* Ao5 line */}
            <polyline
              fill="none"
              stroke="var(--primary)"
              strokeWidth="0.8"
              points={chartData
                .map((point, index) => {
                  const x = getXPosition(point.index);
                  const y = getYPosition(point.ao5);
                  return y !== null ? `${x},${y}` : null;
                })
                .filter(Boolean)
                .join(" ")}
            />

            {/* Ao12 line */}
            <polyline
              fill="none"
              stroke="var(--accent)"
              strokeWidth="0.8"
              points={chartData
                .map((point, index) => {
                  const x = getXPosition(point.index);
                  const y = getYPosition(point.ao12);
                  return y !== null ? `${x},${y}` : null;
                })
                .filter(Boolean)
                .join(" ")}
            />
          </svg>

          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between py-2 -ml-12">
            <span className="text-xs text-[var(--text-muted)]">
              {formatTime(chartBounds.maxTime)}
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              {formatTime((chartBounds.maxTime + chartBounds.minTime) / 2)}
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              {formatTime(chartBounds.minTime)}
            </span>
          </div>
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between mt-2 text-xs text-[var(--text-muted)]">
          <span>Solve 1</span>
          <span>Solve {chartData.length}</span>
        </div>
      </div>

      {/* Progress summary */}
      {ao12TrendLine && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="text-[var(--text-muted)]">Ao12 trend:</span>
          <span
            className={
              ao12TrendLine.improvement
                ? "text-[var(--success)]"
                : "text-[var(--error))"
            }
          >
            {ao12TrendLine.improvement ? "↗ Improving" : "↘ Declining"}
          </span>
        </div>
      )}
    </div>
  );
}