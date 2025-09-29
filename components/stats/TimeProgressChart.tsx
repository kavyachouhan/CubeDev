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
import { Eye, EyeOff, TrendingUp, ChevronDown, ChevronRight } from "lucide-react";

// Register Chart.js components
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
    if (solves.length === 0) return null;

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

    return {
      labels,
      datasets: [
        {
          label: "Singles",
          data: singleData,
          borderColor: "rgba(255, 255, 255, 0.7)",
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          pointBackgroundColor: "rgba(255, 255, 255, 0.8)",
          pointBorderColor: "rgba(255, 255, 255, 1)",
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 1.5,
          tension: 0,
          hidden: !showDataLines.singles,
        },
        {
          label: "Ao5",
          data: ao5Data,
          borderColor: "rgba(59, 130, 246, 1)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          pointBackgroundColor: "rgba(59, 130, 246, 1)",
          pointBorderColor: "rgba(255, 255, 255, 1)",
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
          borderColor: "rgba(168, 85, 247, 1)",
          backgroundColor: "rgba(168, 85, 247, 0.1)",
          pointBackgroundColor: "rgba(168, 85, 247, 1)",
          pointBorderColor: "rgba(255, 255, 255, 1)",
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
          borderColor: "rgba(34, 197, 94, 0.8)",
          backgroundColor: "rgba(34, 197, 94, 0.05)",
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
    };
  }, [solves, dataRange, showDataLines]);

  const progressStats = useMemo(() => {
    if (!chartData) return null;

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
        backgroundColor: "var(--surface-elevated)",
        titleColor: "white",
        bodyColor: "rgba(255, 255, 255, 0.9)",
        borderColor: "var(--border)",
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
          color: "rgba(255, 255, 255, 0.7)",
          font: {
            size: isMobile ? 10 : 12,
            weight: "bold",
          },
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.6)",
          maxTicksLimit: isMobile ? 4 : isTablet ? 6 : 8,
          font: {
            size: isMobile ? 9 : 11,
          },
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
      },
      y: {
        display: true,
        title: {
          display: !isMobile,
          text: "Time (seconds)",
          color: "rgba(255, 255, 255, 0.7)",
          font: {
            size: isMobile ? 10 : 12,
            weight: "bold",
          },
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.6)",
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
          color: "rgba(255, 255, 255, 0.1)",
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
        hoverBorderColor: "white",
      },
      line: {
        borderWidth: isMobile ? 1.5 : 2,
      },
    },
  };

  const toggleDataLine = (key: keyof typeof showDataLines) => {
    setShowDataLines((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!chartData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowChart(!showChart)}
            className="flex items-center gap-1 p-2 text-[var(--text-muted)] hover:text-[var(--primary)] rounded transition-colors"
            title={showChart ? "Hide chart" : "Show chart"}
          >
          <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement hover:text-[var(--primary)] transition-colors">
            Time Progress
          </h3>
            {showChart ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setShowChart(!showChart)}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-md transition-colors"
            title={showChart ? "Hide chart" : "Show chart"}
          >
            {showChart ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        {showChart && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-[var(--surface-elevated)] rounded-lg flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-[var(--text-muted)]" />
            </div>
            <div className="text-[var(--text-secondary)]">
              No data to display
            </div>
            <div className="text-sm text-[var(--text-muted)] mt-2">
              Start solving to see your progress!
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChart(!showChart)}
            className="flex items-center gap-1 p-2 text-[var(--text-muted)] hover:text-[var(--primary)] rounded transition-colors"
            title={showChart ? "Hide chart" : "Show chart"}
          >
          <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement hover:text-[var(--primary)] transition-colors">
            Time Progress
          </h3>
            {showChart ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setShowChart(!showChart)}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-md transition-colors"
            title={showChart ? "Hide chart" : "Show chart"}
          >
            {showChart ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        {showChart && (
          <div className="flex items-center gap-1 p-1 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)] sm:overflow-x-auto">
            {(
              [
                ["25", "Last 25"],
                ["50", "Last 50"],
                ["100", "Last 100"],
                ["all", "All"],
              ] as const
            ).map(([range, label]) => (
              <button
                key={range}
                onClick={() => setDataRange(range)}
                className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all whitespace-nowrap flex-1 sm:flex-none ${
                  dataRange === range
                    ? "bg-[var(--primary)] text-white shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {showChart && (
        <>
          {/* Progress Stats - Show useful metrics */}
          {progressStats && (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              {/* Trend Card - only show if we have trend data */}
              {progressStats.trend && (
                <div className="bg-[var(--surface-elevated)] rounded-lg p-2 sm:p-3 border border-[var(--border)]">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                    <div
                      className={`p-1 sm:p-1.5 rounded-md ${
                        progressStats.trend.isImproving
                          ? "bg-emerald-500/10"
                          : progressStats.trend.improvement === 0
                            ? "bg-[var(--text-muted)]/10"
                            : "bg-red-500/10"
                      }`}
                    >
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide truncate">
                        Progress Trend
                      </div>
                      <div
                        className={`text-xs sm:text-sm font-bold font-mono ${
                          progressStats.trend.isImproving
                            ? "text-emerald-400"
                            : progressStats.trend.improvement === 0
                              ? "text-[var(--text-muted)]"
                              : "text-red-400"
                        }`}
                      >
                        {progressStats.trend.isImproving
                          ? "↗"
                          : progressStats.trend.improvement === 0
                            ? "→"
                            : "↘"}{" "}
                        {Math.abs(
                          progressStats.trend.improvementPercent
                        ).toFixed(1)}
                        %
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Best Single Card */}
              {progressStats.bestSingle && (
                <div className="bg-[var(--surface-elevated)] rounded-lg p-2 sm:p-3 border border-[var(--border)]">
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1 truncate">
                    Best Single
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-yellow-400 font-mono">
                    {formatTime(progressStats.bestSingle)}
                  </div>
                </div>
              )}

              {/* Sessions Count Card */}
              <div className="bg-[var(--surface-elevated)] rounded-lg p-2 sm:p-3 border border-[var(--border)]">
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">
                  Sessions
                </div>
                <div className="text-xs sm:text-sm font-bold text-blue-400">
                  {progressStats.uniqueSessions}
                </div>
              </div>

              {/* Consistency Score Card - only show if we have enough data */}
              {progressStats.consistencyScore !== null &&
                progressStats.trend === null && (
                  <div className="bg-[var(--surface-elevated)] rounded-lg p-2 sm:p-3 border border-[var(--border)]">
                    <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">
                      Consistency
                    </div>
                    <div
                      className={`text-xs sm:text-sm font-bold font-mono ${
                        progressStats.consistencyScore < 15
                          ? "text-emerald-400"
                          : progressStats.consistencyScore < 25
                            ? "text-yellow-400"
                            : "text-red-400"
                      }`}
                    >
                      {progressStats.consistencyScore.toFixed(1)}%
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Data Line Toggle Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <button
              onClick={() => toggleDataLine("singles")}
              className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg transition-all ${
                showDataLines.singles
                  ? "bg-[var(--surface-elevated)] text-white border border-[var(--border)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]"
              }`}
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: showDataLines.singles
                    ? "rgba(255, 255, 255, 0.8)"
                    : "rgba(156, 163, 175, 0.3)",
                }}
              />
              <span className="whitespace-nowrap">Singles</span>
            </button>

            <button
              onClick={() => toggleDataLine("ao5")}
              className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg transition-all ${
                showDataLines.ao5
                  ? "bg-[var(--surface-elevated)] text-blue-400 border border-[var(--border)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]"
              }`}
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: showDataLines.ao5
                    ? "rgba(59, 130, 246, 1)"
                    : "rgba(156, 163, 175, 0.3)",
                }}
              />
              <span className="whitespace-nowrap">Ao5</span>
            </button>

            <button
              onClick={() => toggleDataLine("ao12")}
              className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg transition-all ${
                showDataLines.ao12
                  ? "bg-[var(--surface-elevated)] text-purple-400 border border-[var(--border)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]"
              }`}
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: showDataLines.ao12
                    ? "rgba(168, 85, 247, 1)"
                    : "rgba(156, 163, 175, 0.3)",
                }}
              />
              <span className="whitespace-nowrap">Ao12</span>
            </button>

            <button
              onClick={() => toggleDataLine("trend")}
              className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg transition-all ${
                showDataLines.trend
                  ? "bg-[var(--surface-elevated)] text-emerald-400 border border-[var(--border)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]"
              }`}
            >
              <div
                className="w-2 h-2 rounded-full border border-dashed flex-shrink-0"
                style={{
                  borderColor: showDataLines.trend
                    ? "rgba(34, 197, 94, 0.8)"
                    : "rgba(156, 163, 175, 0.3)",
                  backgroundColor: "transparent",
                }}
              />
              <span className="whitespace-nowrap">Trend</span>
            </button>
          </div>

          {/* Chart */}
          <div className="bg-[var(--surface-elevated)] rounded-lg p-2 sm:p-4 border border-[var(--border)] overflow-hidden">
            <div className="h-32 xs:h-40 sm:h-48 lg:h-64 w-full min-w-0">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}