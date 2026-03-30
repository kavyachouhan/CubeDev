"use client";

import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
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
} from "chart.js";
import { Line } from "react-chartjs-2";
import {
  CollapsibleSection,
  formatTime,
  useEffectiveTheme,
  usePrimaryColor,
} from "./utils";
import { ProgressSnapshot } from "./types";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface ProgressHistoryCardProps {
  snapshots: ProgressSnapshot[];
  targetTime: number;
}

export default function ProgressHistoryCard({
  snapshots,
  targetTime,
}: ProgressHistoryCardProps) {
  const effectiveTheme = useEffectiveTheme();
  const primaryColor = usePrimaryColor();
  const isLight = effectiveTheme === "light";
  const textColor = isLight
    ? "rgba(17, 24, 39, 0.8)"
    : "rgba(255, 255, 255, 0.8)";
  const gridColor = isLight ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)";

  // Progress History Chart Data
  const progressChartData = useMemo(() => {
    if (snapshots.length === 0) return null;

    const sortedSnapshots = [...snapshots].sort(
      (a, b) => a.weekNumber - b.weekNumber,
    );

    return {
      labels: sortedSnapshots.map((s) => `Week ${s.weekNumber}`),
      datasets: [
        {
          label: "Average Time",
          data: sortedSnapshots.map((s) => s.averageTime / 1000),
          borderColor: primaryColor,
          backgroundColor: `${primaryColor}1A`,
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: "Goal",
          data: sortedSnapshots.map(() => targetTime / 1000),
          borderColor: "rgba(34, 197, 94, 0.8)",
          backgroundColor: "transparent",
          borderDash: [5, 5],
          pointRadius: 0,
          tension: 0,
        },
      ],
    };
  }, [snapshots, targetTime, primaryColor]);

  const progressChartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          color: textColor,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y ?? 0;
            return `${context.dataset.label}: ${formatTime(value * 1000)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: textColor },
      },
      y: {
        grid: { color: gridColor },
        ticks: {
          color: textColor,
          callback: (value) => formatTime(Number(value) * 1000),
        },
        reverse: true,
      },
    },
  };

  if (snapshots.length === 0) {
    return null;
  }

  return (
    <CollapsibleSection
      title="Progress History"
      storageKey="coach-progress-history"
      defaultExpanded={true}
    >
      <div className="space-y-4">
        {/* Progress Chart */}
        {progressChartData && (
          <div className="h-52 sm:h-64">
            <Line data={progressChartData} options={progressChartOptions} />
          </div>
        )}

        {/* Snapshot List */}
        <div className="space-y-2 mt-4">
          <div className="text-sm font-medium text-(--text-primary) border-b border-(--border) pb-2">
            Weekly Snapshots
          </div>
          {snapshots.slice(0, 5).map((snapshot) => (
            <div
              key={snapshot._id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-(--surface-elevated) rounded-lg border border-(--border) gap-2"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm text-(--text-muted)">
                  Week {snapshot.weekNumber}
                </span>
                <span className="font-bold text-(--primary) font-mono">
                  {formatTime(snapshot.averageTime)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-(--text-muted)">
                <span>{snapshot.totalSolves} solves</span>
                <span>{snapshot.journalEntries} entries</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </CollapsibleSection>
  );
}
