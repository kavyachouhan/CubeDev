"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  TooltipItem,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useThemeColors, withAlpha } from "@/lib/hooks/useThemeColors";
import { CollapsibleCard } from "@/components/ui/Card";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { StatTile } from "@/components/ui/StatTile";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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

const calculateRollingAverage = (
  times: number[],
  index: number,
  count: number
): number | null => {
  if (index + 1 < count) return null;

  const windowTimes = times.slice(Math.max(0, index - count + 1), index + 1);
  return calculateAverage(windowTimes, count);
};

// Custom hook for window size
function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1024,
    height: typeof window !== "undefined" ? window.innerHeight : 768,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);
      handleResize();
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  return windowSize;
}

export default function TimeProgressChart({ solves }: TimeProgressChartProps) {
  const windowSize = useWindowSize();
  const isMobile = windowSize.width < 640;
  const isTablet = windowSize.width < 1024;
  const colors = useThemeColors();
  const [showChart, setShowChart] = usePersistentBool(
    "cubelab-time-progress-chart-expanded",
    true
  );
  const [dataRange, setDataRange] = useState<"25" | "50" | "100" | "all">(
    "all"
  );
  const [showDataLines, setShowDataLines] = useState({
    singles: true,
    ao5: false,
    ao12: false,
    trend: true,
  });

  const chartData = useMemo(() => {
    // No early return for an empty solve list: every step below is a no-op on
    // empty arrays, so we still produce a valid (empty) chart. That lets the
    // "no solves yet" page render the real axes and controls instead of a
    // separate placeholder layout.
    const sortedSolves = [...solves].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    // Apply data range filter
    const filteredSolves =
      dataRange === "all"
        ? sortedSolves
        : sortedSolves.slice(-parseInt(dataRange));

    const times = filteredSolves.map((solve) => solve.finalTime);
    // X-axis labels as solve indices
    const labels = filteredSolves.map((_, index) => (index + 1).toString());

    // Calculate rolling averages
    const ao5Data: (number | null)[] = [];
    const ao12Data: (number | null)[] = [];
    const singleData: (number | null)[] = [];

    for (let i = 0; i < times.length; i++) {
      // Singles (filter out DNFs for display but keep them in calculation)
      singleData.push(times[i] === Infinity ? null : times[i]);

      // Ao5
      ao5Data.push(calculateRollingAverage(times, i, 5));

      // Ao12
      ao12Data.push(calculateRollingAverage(times, i, 12));
    }

    // Calculate trend line for Ao12 (simple linear regression)
    const validAo12Points = ao12Data
      .map((value, index) => ({ x: index, y: value }))
      .filter((point) => point.y !== null) as { x: number; y: number }[];

    let trendData: (number | null)[] = new Array(times.length).fill(null);

    if (validAo12Points.length >= 2) {
      const n = validAo12Points.length;
      const sumX = validAo12Points.reduce((sum, point) => sum + point.x, 0);
      const sumY = validAo12Points.reduce((sum, point) => sum + point.y, 0);
      const sumXY = validAo12Points.reduce(
        (sum, point) => sum + point.x * point.y,
        0
      );
      const sumXX = validAo12Points.reduce(
        (sum, point) => sum + point.x * point.x,
        0
      );

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      // Only show trend for the range where we have Ao12 data
      const firstAo12Index = validAo12Points[0].x;
      const lastAo12Index = validAo12Points[validAo12Points.length - 1].x;

      for (let i = firstAo12Index; i <= lastAo12Index; i++) {
        trendData[i] = slope * i + intercept;
      }
    }

    // Series colors follow the active theme and color scheme.
    const textColor = colors["--text-secondary"];
    const textSecondaryColor = colors["--text-muted"];
    const gridColor = withAlpha(colors["--border"], 0.6);
    const singlesColor = withAlpha(colors["--text-secondary"], 0.75);
    const singlesColorBg = withAlpha(colors["--text-secondary"], 0.1);
    const pointBorderColor = colors["--surface"];

    return {
      labels,
      datasets: [
        {
          label: "Singles",
          data: singleData,
          borderColor: singlesColor,
          backgroundColor: singlesColorBg,
          pointBackgroundColor: singlesColor,
          pointBorderColor: pointBorderColor,
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 1.5,
          tension: 0,
          hidden: !showDataLines.singles,
        },
        {
          label: "Ao5",
          data: ao5Data,
          borderColor: colors["--primary"],
          backgroundColor: withAlpha(colors["--primary"], 0.1),
          pointBackgroundColor: colors["--primary"],
          pointBorderColor: pointBorderColor,
          pointBorderWidth: 1,
          pointRadius: 3,
          pointHoverRadius: 5,
          borderWidth: 2,
          tension: 0.1,
          hidden: !showDataLines.ao5,
        },
        {
          label: "Ao12",
          data: ao12Data,
          borderColor: colors["--accent"],
          backgroundColor: withAlpha(colors["--accent"], 0.1),
          pointBackgroundColor: colors["--accent"],
          pointBorderColor: pointBorderColor,
          pointBorderWidth: 1,
          pointRadius: 3,
          pointHoverRadius: 5,
          borderWidth: 2,
          tension: 0.1,
          hidden: !showDataLines.ao12,
        },
        {
          label: "Trend",
          data: trendData,
          borderColor: withAlpha(colors["--success"], 0.85),
          backgroundColor: withAlpha(colors["--success"], 0.05),
          pointRadius: 0,
          pointHoverRadius: 0,
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0,
          hidden: !showDataLines.trend,
        },
      ],
      validAo12Points,
      trendData,
      textColor,
      textSecondaryColor,
      gridColor,
    };
  }, [solves, dataRange, showDataLines, colors]);

  const progressStats = useMemo(() => {
    // Calculate trend from Ao12 data
    let trendData = null;
    if (chartData.validAo12Points.length >= 2) {
      const firstAo12 = chartData.validAo12Points[0].y;
      const lastAo12 =
        chartData.validAo12Points[chartData.validAo12Points.length - 1].y;
      const improvement = firstAo12 - lastAo12;
      const improvementPercent = (improvement / firstAo12) * 100;

      trendData = {
        improvement,
        improvementPercent,
        isImproving: improvement > 0,
      };
    }

    // Calculate additional useful stats from the filtered data
    const dataRange = solves.length;
    const sortedSolves = [...solves].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    const validTimes = sortedSolves
      .map((solve) => solve.finalTime)
      .filter((time) => time !== Infinity);

    const bestSingle = validTimes.length > 0 ? Math.min(...validTimes) : null;

    // Count unique sessions in the filtered solves
    const uniqueSessions = new Set(sortedSolves.map((solve) => solve.sessionId))
      .size;

    // Calculate consistency (standard deviation of times)
    let consistencyScore = null;
    if (validTimes.length >= 5) {
      const mean =
        validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length;
      const variance =
        validTimes.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) /
        validTimes.length;
      const stdDev = Math.sqrt(variance);
      // Convert to percentage of mean for consistency score
      consistencyScore = (stdDev / mean) * 100;
    }

    return {
      trend: trendData,
      bestSingle,
      uniqueSessions,
      consistencyScore,
      totalSolves: sortedSolves.length,
    };
  }, [chartData, solves]);

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        // Canvas can't read CSS variables, so pass resolved token values.
        backgroundColor: colors["--surface-elevated"],
        titleColor: colors["--text-primary"],
        bodyColor: colors["--text-secondary"],
        borderColor: colors["--border"],
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        titleFont: {
          weight: "bold",
          size: isMobile ? 12 : 14,
        },
        bodyFont: {
          family: "'JetBrains Mono', monospace",
          size: isMobile ? 11 : 12,
        },
        padding: isMobile ? 8 : 12,
        callbacks: {
          label: (context: TooltipItem<"line">) => {
            const label = context.dataset.label || "";
            const value = context.parsed.y;
            if (value === null) return "";
            return `${label}: ${formatTime(value)}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: !isMobile,
          text: "Solve Number",
          color: chartData?.textColor || "rgba(255, 255, 255, 0.7)",
          font: {
            size: isMobile ? 10 : 12,
            weight: "bold",
          },
        },
        ticks: {
          color: chartData?.textSecondaryColor || "rgba(255, 255, 255, 0.6)",
          maxTicksLimit: isMobile ? 4 : isTablet ? 6 : 8,
          font: {
            size: isMobile ? 9 : 11,
          },
        },
        grid: {
          color: chartData?.gridColor || "rgba(255, 255, 255, 0.1)",
        },
      },
      y: {
        display: true,
        title: {
          display: !isMobile,
          text: "Time (seconds)",
          color: chartData?.textColor || "rgba(255, 255, 255, 0.7)",
          font: {
            size: isMobile ? 10 : 12,
            weight: "bold",
          },
        },
        ticks: {
          color: chartData?.textSecondaryColor || "rgba(255, 255, 255, 0.6)",
          font: {
            size: isMobile ? 9 : 11,
            family: "'JetBrains Mono', monospace",
          },
          maxTicksLimit: isMobile ? 4 : 6,
          callback: (value) => {
            const timeStr = formatTime(value as number);
            // On mobile, simplify formatting for space
            if (isMobile && timeStr.length > 6) {
              const seconds = (value as number) / 1000;
              return seconds >= 60
                ? `${Math.floor(seconds / 60)}:${(seconds % 60).toFixed(0).padStart(2, "0")}`
                : seconds.toFixed(1);
            }
            return timeStr;
          },
        },
        grid: {
          color: chartData?.gridColor || "rgba(255, 255, 255, 0.1)",
        },
      },
    },
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    elements: {
      point: {
        radius: isMobile ? 1.5 : 2,
        hoverRadius: isMobile ? 3 : 4,
        hoverBorderWidth: isMobile ? 1 : 2,
        hoverBorderColor: colors["--text-primary"],
      },
      line: {
        borderWidth: isMobile ? 1.5 : 2,
      },
    },
  };

  const toggleDataLine = (key: keyof typeof showDataLines) => {
    setShowDataLines((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const trend = progressStats.trend;
  const trendTone = !trend
    ? "default"
    : trend.isImproving
      ? "success"
      : trend.improvement === 0
        ? "default"
        : "error";

  const series = [
    { key: "singles" as const, label: "Singles", color: "var(--text-secondary)" },
    { key: "ao5" as const, label: "Ao5", color: "var(--primary)" },
    { key: "ao12" as const, label: "Ao12", color: "var(--accent)" },
    { key: "trend" as const, label: "Trend", color: "var(--success)", dashed: true },
  ];

  return (
    <CollapsibleCard
      title="Time Progress"
      open={showChart}
      onOpenChange={setShowChart}
      variant="static"
      actions={
        showChart ? (
          <SegmentedControl
            aria-label="Solves shown"
            size="sm"
            value={dataRange}
            onChange={setDataRange}
            options={[
              { value: "25", label: "25", "aria-label": "Last 25 solves" },
              { value: "50", label: "50", "aria-label": "Last 50 solves" },
              { value: "100", label: "100", "aria-label": "Last 100 solves" },
              { value: "all", label: "All" },
            ]}
          />
        ) : undefined
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <StatTile
            size="sm"
            label="Progress Trend"
            value={trend ? `${Math.abs(trend.improvementPercent).toFixed(1)}%` : "—"}
            tone={trendTone}
            trend={
              trend
                ? {
                    direction: trend.isImproving
                      ? "down"
                      : trend.improvement === 0
                        ? "flat"
                        : "up",
                    label: trend.isImproving ? "faster" : trend.improvement === 0 ? "flat" : "slower",
                    good: trend.improvement === 0 ? undefined : trend.isImproving,
                  }
                : undefined
            }
          />
          <StatTile
            size="sm"
            label="Best Single"
            value={progressStats.bestSingle ? formatTime(progressStats.bestSingle) : "—"}
            tone={progressStats.bestSingle ? "warning" : "default"}
          />
          <StatTile
            size="sm"
            label="Sessions"
            mono={false}
            value={progressStats.uniqueSessions}
            tone={progressStats.uniqueSessions > 0 ? "primary" : "default"}
          />
          {trend === null && (
            <StatTile
              size="sm"
              label="Consistency"
              value={
                progressStats.consistencyScore === null
                  ? "—"
                  : `${progressStats.consistencyScore.toFixed(1)}%`
              }
              tone={
                progressStats.consistencyScore === null
                  ? "default"
                  : progressStats.consistencyScore < 15
                    ? "success"
                    : progressStats.consistencyScore < 25
                      ? "warning"
                      : "error"
              }
            />
          )}
        </div>

        <div role="group" aria-label="Chart series" className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {series.map(({ key, label, color, dashed }) => {
            const on = showDataLines[key];
            return (
              <button
                key={key}
                type="button"
                aria-pressed={on}
                onClick={() => toggleDataLine(key)}
                className={`inline-flex items-center gap-2 h-8 px-3 rounded-full border text-xs sm:text-sm font-medium font-inter transition-colors ${
                  on
                    ? "bg-(--surface-elevated) text-(--text-primary) border-(--border-hover)"
                    : "border-transparent text-(--text-muted) hover:text-(--text-primary) hover:bg-(--surface-elevated)"
                }`}
              >
                <span
                  aria-hidden
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${dashed ? "border-2 border-dashed" : ""}`}
                  style={
                    dashed
                      ? { borderColor: on ? color : "var(--border)" }
                      : { background: on ? color : "var(--border)" }
                  }
                />
                {label}
              </button>
            );
          })}
        </div>

        <div className="bg-(--surface-elevated) rounded-(--radius-panel) p-2 sm:p-4 border border-(--border) overflow-hidden">
          <div className="h-40 sm:h-48 lg:h-64 w-full min-w-0">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </CollapsibleCard>
  );
}