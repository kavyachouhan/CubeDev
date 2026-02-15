"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCachedQuery } from "@/lib/hooks/useAdminCache";
import { ADMIN_CACHE_KEYS, ADMIN_CACHE_TTLS } from "@/lib/admin-cache";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Download,
  BookOpen,
  Layers,
  FileText,
  Users,
  Target,
  CheckCircle2,
  Clock,
  Activity,
  LucideIcon,
} from "lucide-react";
import { CollapsibleCard, exportToJSON, exportToCSV } from "./shared";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

// Hook to detect current theme
function useEffectiveTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const checkTheme = () => {
      const dataTheme = document.documentElement.getAttribute("data-theme");
      setTheme((dataTheme as "light" | "dark") || "dark");
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  return theme;
}

// Hook to get computed primary color for charts
function usePrimaryColor() {
  const [primaryColor, setPrimaryColor] = useState("rgba(168, 85, 247, 1)");

  useEffect(() => {
    const getColor = () => {
      if (typeof window === "undefined") return;
      const computed = getComputedStyle(document.documentElement)
        .getPropertyValue("--primary")
        .trim();
      if (computed) {
        setPrimaryColor(computed);
      }
    };

    getColor();

    const observer = new MutationObserver(getColor);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "data-color-scheme"],
    });

    return () => observer.disconnect();
  }, []);

  return primaryColor;
}

// ANALYTICS STAT CARD (with icon)

interface AnalyticsStatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  subValue?: string;
}

function AnalyticsStatCard({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBgColor,
  subValue,
}: AnalyticsStatCardProps) {
  return (
    <div className="p-3 sm:p-4 bg-(--surface-elevated) rounded-lg border border-(--border)">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-(--text-muted) font-inter truncate">
            {title}
          </p>
          <p className="text-lg sm:text-2xl font-bold text-(--text-primary) font-statement mt-1 truncate">
            {value}
          </p>
          {subValue && (
            <p className="text-xs text-(--text-muted) font-inter mt-1 line-clamp-2">
              {subValue}
            </p>
          )}
        </div>
        <div className={`p-2 ${iconBgColor} rounded-lg shrink-0`}>
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

// ANALYTICS PROGRESS BAR (for Learning Stages)

interface AnalyticsProgressBarProps {
  label: string;
  value: number;
  total: number;
  color: string;
}

function AnalyticsProgressBar({
  label,
  value,
  total,
  color,
}: AnalyticsProgressBarProps) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-(--text-muted) font-inter">{label}</span>
        <span className="text-(--text-primary) font-inter">
          {value} ({percentage}%)
        </span>
      </div>
      <div className="h-2 bg-(--surface-elevated) rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// MAIN ANALYTICS COMPONENT

export function AlgorithmAnalytics() {
  const { data: analytics } = useCachedQuery(
    api.admin.getAlgorithmAnalytics,
    {},
    {
      cacheKey: ADMIN_CACHE_KEYS.algorithmAnalytics,
      ttl: ADMIN_CACHE_TTLS.algorithms,
    },
  );
  const { data: exportData } = useCachedQuery(
    api.admin.exportAlgorithmsData,
    {},
    {
      cacheKey: ADMIN_CACHE_KEYS.algorithmExportData,
      ttl: ADMIN_CACHE_TTLS.algorithms,
    },
  );

  const effectiveTheme = useEffectiveTheme();
  const primaryColor = usePrimaryColor();
  const isLight = effectiveTheme === "light";
  const textColor = isLight
    ? "rgba(17, 24, 39, 0.8)"
    : "rgba(255, 255, 255, 0.8)";
  const gridColor = isLight ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)";

  const handleExportJSON = () => {
    if (exportData) {
      exportToJSON(exportData, "algorithms_export");
    }
  };

  const handleExportSetsCSV = () => {
    if (exportData?.sets) {
      exportToCSV(
        exportData.sets as Record<string, unknown>[],
        "algorithm_sets",
      );
    }
  };

  const handleExportCasesCSV = () => {
    if (exportData?.cases) {
      exportToCSV(
        exportData.cases as Record<string, unknown>[],
        "algorithm_cases",
      );
    }
  };

  const handleExportAlgorithmsCSV = () => {
    if (exportData?.algorithms) {
      exportToCSV(
        exportData.algorithms as Record<string, unknown>[],
        "algorithms",
      );
    }
  };

  // Weekly Activity Bar Chart Data
  const weeklyChartData = useMemo(() => {
    if (!analytics) return null;

    return {
      labels: analytics.weeklyLearningTrend.map((w) => w.week),
      datasets: [
        {
          label: "Learning Activity",
          data: analytics.weeklyLearningTrend.map((w) => w.count),
          backgroundColor: primaryColor,
          borderColor: primaryColor,
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [analytics, primaryColor]);

  const weeklyChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: isLight
            ? "rgba(255,255,255,0.95)"
            : "rgba(30,30,30,0.95)",
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: gridColor,
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: textColor, font: { size: 10 } },
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { size: 10 } },
          beginAtZero: true,
        },
      },
    }),
    [isLight, textColor, gridColor],
  );

  // Category Distribution Doughnut Chart Data
  const categoryChartData = useMemo(() => {
    if (!analytics) return null;

    const categories = Object.entries(analytics.categoryDistribution);
    if (categories.length === 0) return null;

    // Color palette compatible with themes
    const colors = [
      "rgba(59, 130, 246, 0.8)", // blue
      "rgba(168, 85, 247, 0.8)", // purple
      "rgba(34, 197, 94, 0.8)", // green
      "rgba(249, 115, 22, 0.8)", // orange
      "rgba(236, 72, 153, 0.8)", // pink
      "rgba(14, 165, 233, 0.8)", // cyan
      "rgba(234, 179, 8, 0.8)", // yellow
      "rgba(107, 114, 128, 0.8)", // gray
    ];

    return {
      labels: categories.map(([cat]) => cat),
      datasets: [
        {
          data: categories.map(([, count]) => count),
          backgroundColor: categories.map((_, i) => colors[i % colors.length]),
          borderColor: isLight ? "rgba(255,255,255,1)" : "rgba(30,30,30,1)",
          borderWidth: 2,
        },
      ],
    };
  }, [analytics, isLight]);

  // Difficulty Distribution Doughnut Chart Data
  const difficultyChartData = useMemo(() => {
    if (!analytics) return null;

    const { beginner, intermediate, advanced } =
      analytics.difficultyDistribution;
    const total = beginner + intermediate + advanced;
    if (total === 0) return null;

    return {
      labels: ["Beginner", "Intermediate", "Advanced"],
      datasets: [
        {
          data: [beginner, intermediate, advanced],
          backgroundColor: [
            "rgba(34, 197, 94, 0.8)", // green for beginner
            "rgba(234, 179, 8, 0.8)", // yellow for intermediate
            "rgba(239, 68, 68, 0.8)", // red for advanced
          ],
          borderColor: isLight ? "rgba(255,255,255,1)" : "rgba(30,30,30,1)",
          borderWidth: 2,
        },
      ],
    };
  }, [analytics, isLight]);

  const doughnutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom" as const,
          labels: {
            color: textColor,
            usePointStyle: true,
            pointStyle: "circle" as const,
            padding: 12,
            font: { size: 11 },
          },
        },
        tooltip: {
          backgroundColor: isLight
            ? "rgba(255,255,255,0.95)"
            : "rgba(30,30,30,0.95)",
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: gridColor,
          borderWidth: 1,
        },
      },
      cutout: "60%",
    }),
    [isLight, textColor, gridColor],
  );

  if (!analytics) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-20 bg-(--surface-elevated) rounded-xl animate-pulse border border-(--border)"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Export Buttons */}
      <div className="flex flex-wrap justify-end gap-2">
        <button
          onClick={handleExportJSON}
          disabled={!exportData}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-(--surface-elevated) hover:bg-(--border) border border-(--border) rounded-lg text-(--text-secondary) transition-colors font-inter disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export All (JSON)</span>
          <span className="sm:hidden">JSON</span>
        </button>
        <button
          onClick={handleExportSetsCSV}
          disabled={!exportData}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-(--surface-elevated) hover:bg-(--border) border border-(--border) rounded-lg text-(--text-secondary) transition-colors font-inter disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sets CSV</span>
          <span className="sm:hidden">Sets</span>
        </button>
        <button
          onClick={handleExportCasesCSV}
          disabled={!exportData}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-(--surface-elevated) hover:bg-(--border) border border-(--border) rounded-lg text-(--text-secondary) transition-colors font-inter disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Cases CSV</span>
          <span className="sm:hidden">Cases</span>
        </button>
        <button
          onClick={handleExportAlgorithmsCSV}
          disabled={!exportData}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-(--surface-elevated) hover:bg-(--border) border border-(--border) rounded-lg text-(--text-secondary) transition-colors font-inter disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Algorithms CSV</span>
          <span className="sm:hidden">Algs</span>
        </button>
      </div>

      {/* Key Metrics - Row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <AnalyticsStatCard
          title="Total Sets"
          value={analytics.totalSets}
          icon={BookOpen}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-500/10"
          subValue={`${analytics.publishedSets} published, ${analytics.draftSets} drafts`}
        />
        <AnalyticsStatCard
          title="Total Cases"
          value={analytics.totalCases}
          icon={Layers}
          iconColor="text-purple-500"
          iconBgColor="bg-purple-500/10"
        />
        <AnalyticsStatCard
          title="Total Algorithms"
          value={analytics.totalAlgorithms}
          icon={FileText}
          iconColor="text-green-500"
          iconBgColor="bg-green-500/10"
        />
        <AnalyticsStatCard
          title="Unique Learners"
          value={analytics.uniqueLearners}
          icon={Users}
          iconColor="text-yellow-500"
          iconBgColor="bg-yellow-500/10"
        />
      </div>

      {/* Learning Metrics - Row 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <AnalyticsStatCard
          title="Total Progress"
          value={analytics.totalProgressRecords}
          icon={Target}
          iconColor="text-cyan-500"
          iconBgColor="bg-cyan-500/10"
        />
        <AnalyticsStatCard
          title="Avg Accuracy"
          value={`${analytics.avgAccuracy.toFixed(1)}%`}
          icon={CheckCircle2}
          iconColor="text-emerald-500"
          iconBgColor="bg-emerald-500/10"
        />
        <AnalyticsStatCard
          title="Avg Recognition"
          value={
            analytics.avgRecognitionTime > 0
              ? `${(analytics.avgRecognitionTime / 1000).toFixed(2)}s`
              : "N/A"
          }
          icon={Clock}
          iconColor="text-orange-500"
          iconBgColor="bg-orange-500/10"
        />
        <AnalyticsStatCard
          title="Practice Sessions"
          value={analytics.totalSessions}
          icon={Activity}
          iconColor="text-pink-500"
          iconBgColor="bg-pink-500/10"
          subValue={`${analytics.sessionsThisWeek} this week`}
        />
      </div>

      {/* Charts Grid - Row 1: Weekly + Stages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Weekly Learning Activity - Bar Chart */}
        <CollapsibleCard
          title="Weekly Learning Activity"
          storageKey="admin-alg-weekly-trend"
          defaultOpen={true}
        >
          <div className="h-48 sm:h-56 mt-4">
            {weeklyChartData ? (
              <Bar data={weeklyChartData} options={weeklyChartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-(--text-muted) text-sm">
                No activity data
              </div>
            )}
          </div>
        </CollapsibleCard>

        {/* Learning Stage Distribution */}
        <CollapsibleCard
          title="Learning Stage Distribution"
          storageKey="admin-alg-stage-dist"
          defaultOpen={true}
        >
          <div className="space-y-3 mt-4">
            <AnalyticsProgressBar
              label="New"
              value={analytics.stageDistribution.new}
              total={analytics.totalProgressRecords}
              color="bg-gray-500"
            />
            <AnalyticsProgressBar
              label="Learning"
              value={analytics.stageDistribution.learning}
              total={analytics.totalProgressRecords}
              color="bg-yellow-500"
            />
            <AnalyticsProgressBar
              label="Reviewing"
              value={analytics.stageDistribution.reviewing}
              total={analytics.totalProgressRecords}
              color="bg-blue-500"
            />
            <AnalyticsProgressBar
              label="Mastered"
              value={analytics.stageDistribution.mastered}
              total={analytics.totalProgressRecords}
              color="bg-green-500"
            />
          </div>
        </CollapsibleCard>
      </div>

      {/* Charts Grid - Row 2: Category + Difficulty Doughnuts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Category Distribution - Doughnut Chart */}
        <CollapsibleCard
          title="Category Distribution"
          storageKey="admin-alg-category"
          defaultOpen={true}
        >
          <div className="h-56 sm:h-64 mt-4">
            {categoryChartData ? (
              <Doughnut data={categoryChartData} options={doughnutOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-(--text-muted) text-sm">
                No category data
              </div>
            )}
          </div>
        </CollapsibleCard>

        {/* Difficulty Distribution - Doughnut Chart */}
        <CollapsibleCard
          title="Difficulty Distribution"
          storageKey="admin-alg-difficulty"
          defaultOpen={true}
        >
          <div className="h-56 sm:h-64 mt-4">
            {difficultyChartData ? (
              <Doughnut data={difficultyChartData} options={doughnutOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-(--text-muted) text-sm">
                No difficulty data
              </div>
            )}
          </div>
        </CollapsibleCard>
      </div>

      {/* Top Sets */}
      {analytics.topSets.length > 0 && (
        <CollapsibleCard
          title="Most Popular Sets"
          storageKey="admin-alg-top-sets"
          defaultOpen={true}
        >
          <div className="space-y-2 mt-4">
            {analytics.topSets.map((set, idx) => (
              <div key={set.setId} className="flex items-center gap-3">
                <span className="text-xs text-(--text-muted) font-inter w-4">
                  {idx + 1}
                </span>
                <span className="text-sm font-medium text-(--text-primary) font-inter flex-1 truncate">
                  {set.name}
                </span>
                <span className="text-sm text-(--text-secondary) font-inter shrink-0">
                  {set.count} learners
                </span>
              </div>
            ))}
          </div>
        </CollapsibleCard>
      )}
    </div>
  );
}
