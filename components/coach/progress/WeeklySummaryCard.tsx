"use client";

import { useMemo } from "react";
import { BarChart3, Clock, Target, Calendar } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import {
  CollapsibleSection,
  StatCard,
  formatTime,
  formatDuration,
  useEffectiveTheme,
  usePrimaryColor,
} from "./utils";
import { ProgressStats } from "./types";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

interface WeeklySummaryCardProps {
  progressStats: ProgressStats;
}

export default function WeeklySummaryCard({
  progressStats,
}: WeeklySummaryCardProps) {
  const effectiveTheme = useEffectiveTheme();
  const primaryColor = usePrimaryColor();
  const isLight = effectiveTheme === "light";
  const textColor = isLight
    ? "rgba(17, 24, 39, 0.8)"
    : "rgba(255, 255, 255, 0.8)";
  const gridColor = isLight ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)";

  // Weekly Activity Bar Chart
  const weeklyActivityData = useMemo(() => {
    return {
      labels: ["Solves", "Practice (10m)", "Entries"],
      datasets: [
        {
          label: "This Week",
          data: [
            progressStats.weekly.solves,
            progressStats.weekly.practiceMinutes / 10,
            progressStats.weekly.entries,
          ],
          backgroundColor: primaryColor,
          borderColor: primaryColor,
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: "Monthly Avg/Week",
          data: [
            Math.round(progressStats.monthly.solves / 4),
            Math.round(progressStats.monthly.practiceMinutes / 4 / 10),
            Math.round(progressStats.monthly.entries / 4),
          ],
          backgroundColor: "rgba(107, 114, 128, 0.5)",
          borderColor: "rgba(107, 114, 128, 1)",
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [progressStats, primaryColor]);

  const weeklyActivityOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
        labels: {
          color: textColor,
          usePointStyle: true,
          pointStyle: "rect" as const,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: textColor },
      },
      y: {
        grid: { color: gridColor },
        ticks: { color: textColor },
        beginAtZero: true,
      },
    },
  };

  return (
    <CollapsibleSection
      title="Weekly Summary"
      storageKey="coach-progress-weekly"
      defaultExpanded={true}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <StatCard
            icon={Clock}
            iconColor="bg-(--primary)/10 text-(--primary)"
            label="Practice"
            value={formatDuration(progressStats.weekly.practiceMinutes)}
          />
          <StatCard
            icon={BarChart3}
            iconColor="bg-(--accent)/10 text-(--accent)"
            label="Solves"
            value={progressStats.weekly.solves.toLocaleString()}
          />
          <StatCard
            icon={Target}
            iconColor="bg-(--success)/10 text-(--success)"
            label="Average"
            value={
              progressStats.weekly.average
                ? formatTime(progressStats.weekly.average)
                : "—"
            }
            valueColor="text-(--success)"
          />
          <StatCard
            icon={Calendar}
            iconColor="bg-(--warning)/10 text-(--warning)"
            label="Active"
            value={`${progressStats.weekly.activeDays} days`}
          />
        </div>

        {/* Weekly Activity Chart */}
        <div className="h-40 sm:h-48 mt-4">
          <Bar data={weeklyActivityData} options={weeklyActivityOptions} />
        </div>
      </div>
    </CollapsibleSection>
  );
}
