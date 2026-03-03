"use client";

import { useMemo } from "react";
import { Calendar, Clock, BarChart3, Target } from "lucide-react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
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
ChartJS.register(ArcElement, Tooltip, Legend);

interface MonthlyOverviewCardProps {
  progressStats: ProgressStats;
}

export default function MonthlyOverviewCard({
  progressStats,
}: MonthlyOverviewCardProps) {
  const effectiveTheme = useEffectiveTheme();
  const primaryColor = usePrimaryColor();
  const isLight = effectiveTheme === "light";
  const textColor = isLight
    ? "rgba(17, 24, 39, 0.8)"
    : "rgba(255, 255, 255, 0.8)";

  // Mood Distribution Doughnut Chart
  const moodChartData = useMemo(() => {
    const { great, good, okay, frustrated, tired } =
      progressStats.moodDistribution;
    const total = great + good + okay + frustrated + tired;
    if (total === 0) return null;

    return {
      labels: ["Great", "Good", "Okay", "Frustrated", "Tired"],
      datasets: [
        {
          data: [great, good, okay, frustrated, tired],
          backgroundColor: [
            "rgba(34, 197, 94, 0.8)",
            primaryColor,
            "rgba(234, 179, 8, 0.8)",
            "rgba(239, 68, 68, 0.8)",
            "rgba(107, 114, 128, 0.8)",
          ],
          borderColor: [
            "rgba(34, 197, 94, 1)",
            primaryColor,
            "rgba(234, 179, 8, 1)",
            "rgba(239, 68, 68, 1)",
            "rgba(107, 114, 128, 1)",
          ],
          borderWidth: 2,
        },
      ],
    };
  }, [progressStats, primaryColor]);

  const moodChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "right" as const,
        labels: {
          color: textColor,
          usePointStyle: true,
          pointStyle: "circle" as const,
          padding: 8,
          font: {
            size: 11,
          },
        },
      },
    },
    cutout: "60%",
  };

  return (
    <CollapsibleSection
      title="Monthly Overview"
      storageKey="coach-progress-monthly"
      defaultExpanded={true}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <StatCard
            icon={Clock}
            iconColor="bg-(--primary)/10 text-(--primary)"
            label="Practice"
            value={formatDuration(progressStats.monthly.practiceMinutes)}
          />
          <StatCard
            icon={BarChart3}
            iconColor="bg-(--accent)/10 text-(--accent)"
            label="Solves"
            value={progressStats.monthly.solves.toLocaleString()}
          />
          <StatCard
            icon={Target}
            iconColor="bg-(--success)/10 text-(--success)"
            label="Average"
            value={
              progressStats.monthly.average
                ? formatTime(progressStats.monthly.average)
                : "—"
            }
            valueColor="text-(--success)"
          />
          <StatCard
            icon={Calendar}
            iconColor="bg-(--warning)/10 text-(--warning)"
            label="Active"
            value={`${progressStats.monthly.activeDays} days`}
          />
        </div>

        {/* Mood Distribution Chart */}
        {moodChartData && (
          <div className="mt-4">
            <div className="text-sm font-medium text-(--text-primary) border-b border-(--border) pb-2 mb-3">
              Mood Distribution
            </div>
            <div className="h-40 sm:h-48">
              <Doughnut data={moodChartData} options={moodChartOptions} />
            </div>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}
