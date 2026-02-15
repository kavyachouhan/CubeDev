"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCachedQuery } from "@/lib/hooks/useAdminCache";
import { ADMIN_CACHE_KEYS, ADMIN_CACHE_TTLS } from "@/lib/admin-cache";
import {
  GraduationCap,
  Target,
  Calendar,
  BookOpen,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Download,
  Clock,
  Activity,
  Users,
  Heart,
  Smile,
  Meh,
  Frown,
  Moon,
  Zap,
  BarChart3,
  Percent,
  Image,
  Trophy,
  X,
} from "lucide-react";
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

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

// Theme detection hook
function useEffectiveTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const updateTheme = () => {
      const root = document.documentElement;
      const dataTheme = root.getAttribute("data-theme");
      setTheme(dataTheme === "light" ? "light" : "dark");
    };

    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return theme;
}

// Primary color hook
function usePrimaryColor() {
  const [primaryColor, setPrimaryColor] = useState("#FA6900");

  useEffect(() => {
    const updateColor = () => {
      const color = getComputedStyle(document.documentElement)
        .getPropertyValue("--primary")
        .trim();
      if (color) setPrimaryColor(color);
    };

    updateColor();
    const observer = new MutationObserver(updateColor);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });
    return () => observer.disconnect();
  }, []);

  return primaryColor;
}

// Export helper functions
function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          if (
            typeof value === "string" &&
            (value.includes(",") || value.includes("\n"))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return String(value ?? "");
        })
        .join(","),
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
}

function exportToJSON(data: unknown, filename: string) {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.json`;
  link.click();
}

// CollapsibleCard Component
function CollapsibleCard({
  title,
  children,
  defaultOpen = true,
  storageKey,
  headerExtra,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  storageKey?: string;
  headerExtra?: React.ReactNode;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== "undefined" && storageKey) {
      const saved = localStorage.getItem(storageKey);
      return saved !== null ? saved === "true" : defaultOpen;
    }
    return defaultOpen;
  });

  const toggleOpen = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (typeof window !== "undefined" && storageKey) {
      localStorage.setItem(storageKey, String(newState));
    }
  };

  return (
    <div className={`timer-card ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={toggleOpen}
          className="flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
        >
          <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement hover:text-[var(--primary)] transition-colors">
            {title}
          </h3>
          {isOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        <div className="flex items-center gap-2">
          {headerExtra}
          <button
            onClick={toggleOpen}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-md transition-colors"
            title={isOpen ? "Hide" : "Show"}
          >
            {isOpen ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
      {isOpen && children}
    </div>
  );
}

// StatCard Component
function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-[var(--primary)]",
  iconBgColor = "bg-[var(--primary)]/10",
  subValue,
  trend,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconColor?: string;
  iconBgColor?: string;
  subValue?: string;
  trend?: { value: number; label: string };
}) {
  return (
    <div className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)]">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className={`p-1.5 sm:p-2 ${iconBgColor} rounded-lg shrink-0`}>
          <Icon className={`w-3 h-3 sm:w-4 sm:h-4 ${iconColor}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide truncate font-inter">
            {title}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm sm:text-lg font-bold text-[var(--text-primary)] font-statement">
              {typeof value === "number" ? value.toLocaleString() : value}
            </div>
            {trend && (
              <div
                className={`flex items-center gap-0.5 text-xs ${
                  trend.value >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {trend.value >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>
          {subValue && (
            <div className="text-xs text-[var(--text-muted)] font-inter">
              {subValue}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// BarChart Component using Chart.js
function BarChart({
  data,
}: {
  data: Array<{ label: string; value: number }>;
  maxValue?: number;
}) {
  const effectiveTheme = useEffectiveTheme();
  const primaryColor = usePrimaryColor();
  const isLight = effectiveTheme === "light";
  const textColor = isLight
    ? "rgba(17, 24, 39, 0.8)"
    : "rgba(255, 255, 255, 0.8)";
  const gridColor = isLight ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)";

  const chartData = useMemo(
    () => ({
      labels: data.map((d) => d.label),
      datasets: [
        {
          label: "Journal Entries",
          data: data.map((d) => d.value),
          backgroundColor: primaryColor,
          borderRadius: 4,
          barThickness: 20,
        },
      ],
    }),
    [data, primaryColor],
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isLight
            ? "rgba(255, 255, 255, 0.95)"
            : "rgba(0, 0, 0, 0.8)",
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: gridColor,
          borderWidth: 1,
          padding: 8,
          cornerRadius: 6,
        },
      },
      scales: {
        x: {
          ticks: { color: textColor, font: { size: 10 } },
          grid: { display: false },
          border: { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: { color: textColor, font: { size: 10 }, stepSize: 1 },
          grid: { color: gridColor },
          border: { display: false },
        },
      },
    }),
    [isLight, textColor, gridColor],
  );

  return (
    <div className="h-40">
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
}

// MoodDistributionChart Component
function MoodDistributionChart({
  distribution,
}: {
  distribution: Record<string, number>;
}) {
  const moodConfig: Record<
    string,
    { icon: React.ElementType; color: string; bgColor: string }
  > = {
    great: { icon: Heart, color: "text-green-500", bgColor: "bg-green-500/10" },
    good: { icon: Smile, color: "text-blue-500", bgColor: "bg-blue-500/10" },
    okay: { icon: Meh, color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
    frustrated: {
      icon: Frown,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    tired: {
      icon: Moon,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  };

  const total = Object.values(distribution).reduce((sum, v) => sum + v, 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
      {Object.entries(distribution).map(([mood, count]) => {
        const config = moodConfig[mood] || {
          icon: Meh,
          color: "text-gray-500",
          bgColor: "bg-gray-500/10",
        };
        const Icon = config.icon;
        const percentage = total > 0 ? ((count / total) * 100).toFixed(0) : 0;

        return (
          <div
            key={mood}
            className="bg-[var(--surface)] rounded-lg p-3 text-center border border-[var(--border)]"
          >
            <div
              className={`p-2 ${config.bgColor} rounded-lg inline-block mb-1`}
            >
              <Icon className={`w-4 h-4 ${config.color}`} />
            </div>
            <div className="text-lg font-bold text-[var(--text-primary)] font-statement">
              {count}
            </div>
            <div className="text-xs text-[var(--text-muted)] capitalize font-inter">
              {mood}
            </div>
            <div className="text-xs text-[var(--text-muted)] font-inter">
              {percentage}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Distribution Chart Component
function DistributionChart({
  data,
  colorMap,
}: {
  data: Record<string, number>;
  colorMap?: Record<string, string>;
}) {
  const total = Object.values(data).reduce((sum, count) => sum + count, 0);

  const defaultColors: Record<string, string> = {
    beginner: "bg-green-500",
    intermediate: "bg-yellow-500",
    advanced: "bg-orange-500",
    expert: "bg-[var(--primary)]",
    "sub-60": "bg-green-500",
    "sub-45": "bg-green-500",
    "sub-30": "bg-blue-500",
    "sub-20": "bg-yellow-500",
    "sub-15": "bg-yellow-500",
    "sub-12": "bg-orange-500",
    "sub-10": "bg-orange-500",
    "sub-8": "bg-[var(--primary)]",
    custom: "bg-purple-500",
    active: "bg-green-500",
    completed: "bg-blue-500",
    skipped: "bg-gray-500",
    achieved: "bg-green-500",
    expired: "bg-red-500",
    replaced: "bg-yellow-500",
    "333": "bg-[var(--primary)]",
    "222": "bg-green-500",
    "444": "bg-orange-500",
    "555": "bg-purple-500",
    pyram: "bg-yellow-500",
    skewb: "bg-cyan-500",
    "15-30 min": "bg-green-500",
    "30-60 min": "bg-blue-500",
    "1-2 hours": "bg-yellow-500",
    "2+ hours": "bg-orange-500",
  };

  const colors = colorMap || defaultColors;

  return (
    <div className="space-y-3">
      {Object.entries(data)
        .filter(([, count]) => count > 0)
        .map(([key, count]) => {
          const percentage = total > 0 ? (count / total) * 100 : 0;
          const colorClass = colors[key] || "bg-[var(--primary)]";

          return (
            <div key={key}>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-[var(--text-secondary)] font-inter capitalize">
                  {key.replace(/-/g, " ")}
                </span>
                <span className="text-sm font-medium text-[var(--text-primary)] font-inter">
                  {count} ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 bg-[var(--surface)] rounded-full overflow-hidden">
                <div
                  className={`h-full ${colorClass} rounded-full transition-all`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
    </div>
  );
}

// Profile Details Modal
function ProfileDetailsModal({
  profile,
  onClose,
}: {
  profile: {
    _id: string;
    userName: string;
    wcaId: string;
    skillLevel: string;
    primaryEvent: string;
    goalType: string;
    customGoalTime?: number;
    dailyPracticeMinutes: number;
    onboardingCompleted: boolean;
    createdAt: number;
    journalCount: number;
    planCount: number;
    goalStats: {
      total: number;
      achieved: number;
      expired: number;
      replaced: number;
    };
  };
  onClose: () => void;
}) {
  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (ms: number) => {
    const seconds = ms / 1000;
    if (seconds >= 60) {
      return `${Math.floor(seconds / 60)}:${(seconds % 60).toFixed(2).padStart(5, "0")}`;
    }
    return `${seconds.toFixed(2)}s`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="timer-card max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] font-statement">
              {profile.userName}
            </h2>
            <p className="text-sm text-[var(--primary)] font-inter">
              {profile.wcaId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-lg hover:bg-[var(--surface-elevated)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Info */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              title="Skill Level"
              value={profile.skillLevel}
              icon={GraduationCap}
              iconColor="text-blue-500"
              iconBgColor="bg-blue-500/10"
            />
            <StatCard
              title="Primary Event"
              value={profile.primaryEvent}
              icon={Zap}
              iconColor="text-yellow-500"
              iconBgColor="bg-yellow-500/10"
            />
            <StatCard
              title="Goal"
              value={
                profile.goalType === "custom" && profile.customGoalTime
                  ? formatTime(profile.customGoalTime)
                  : profile.goalType
              }
              icon={Target}
              iconColor="text-green-500"
              iconBgColor="bg-green-500/10"
            />
            <StatCard
              title="Daily Practice"
              value={`${profile.dailyPracticeMinutes} min`}
              icon={Clock}
              iconColor="text-purple-500"
              iconBgColor="bg-purple-500/10"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatCard
              title="Journal Entries"
              value={profile.journalCount}
              icon={BookOpen}
              iconColor="text-amber-500"
              iconBgColor="bg-amber-500/10"
            />
            <StatCard
              title="Training Plans"
              value={profile.planCount}
              icon={Calendar}
              iconColor="text-cyan-500"
              iconBgColor="bg-cyan-500/10"
            />
          </div>

          {/* Goal History */}
          {profile.goalStats.total > 0 && (
            <div className="bg-[var(--surface-elevated)] rounded-xl p-4 border border-[var(--border)]">
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3 font-statement">
                Goal History
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-[var(--text-primary)] font-statement">
                    {profile.goalStats.total}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] font-inter">
                    Total Goals
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-500 font-statement">
                    {profile.goalStats.achieved}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] font-inter">
                    Achieved
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-500 font-statement">
                    {profile.goalStats.expired}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] font-inter">
                    Expired
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-500 font-statement">
                    {profile.goalStats.replaced}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] font-inter">
                    Replaced
                  </div>
                </div>
              </div>
              {profile.goalStats.total > 0 && (
                <div className="mt-3 pt-3 border-t border-[var(--border)]">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-muted)] font-inter">
                      Success Rate
                    </span>
                    <span className="font-medium text-[var(--text-primary)] font-inter">
                      {Math.round(
                        (profile.goalStats.achieved / profile.goalStats.total) *
                          100,
                      )}
                      %
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-[var(--surface-elevated)] rounded-xl p-4 border border-[var(--border)]">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)] font-inter">
                Status
              </span>
              <span
                className={`font-inter ${profile.onboardingCompleted ? "text-green-500" : "text-yellow-500"}`}
              >
                {profile.onboardingCompleted ? "Onboarded" : "Pending"}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-[var(--text-muted)] font-inter">
                Created
              </span>
              <span className="text-[var(--text-primary)] font-inter">
                {formatDate(profile.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--surface-elevated)] hover:bg-[var(--border)] text-[var(--text-primary)] font-medium rounded-lg transition-colors font-inter"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Progress Ring Component
function ProgressRing({
  percentage,
  label,
  size = 80,
}: {
  percentage: number;
  label: string;
  size?: number;
}) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage >= 70) return "var(--success)";
    if (percentage >= 40) return "var(--warning)";
    return "var(--error)";
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--surface)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-[var(--text-primary)] font-statement">
            {percentage}%
          </span>
        </div>
      </div>
      <p className="mt-2 text-sm text-[var(--text-secondary)] font-inter">
        {label}
      </p>
    </div>
  );
}

// Coach Analytics Overview
function CoachAnalyticsOverview() {
  const detailedStats = useQuery(api.admin.getDetailedCoachStats);

  const handleExportAnalytics = () => {
    if (detailedStats) {
      exportToJSON(detailedStats, "coach_analytics");
    }
  };

  if (!detailedStats) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-20 bg-[var(--surface-elevated)] rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Export Button Row */}
      <div className="flex justify-end">
        <button
          onClick={handleExportAnalytics}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] rounded-lg text-[var(--text-secondary)] transition-colors font-inter"
        >
          <Download className="w-4 h-4" />
          Export Analytics
        </button>
      </div>

      {/* Key Metrics - Row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          title="Total Profiles"
          value={detailedStats.totalProfiles}
          icon={Users}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-500/10"
        />
        <StatCard
          title="Onboarded"
          value={detailedStats.onboardedProfiles}
          icon={CheckCircle2}
          iconColor="text-green-500"
          iconBgColor="bg-green-500/10"
          subValue={`${detailedStats.totalProfiles > 0 ? ((detailedStats.onboardedProfiles / detailedStats.totalProfiles) * 100).toFixed(0) : 0}% of total`}
        />
        <StatCard
          title="New This Week"
          value={detailedStats.newProfilesThisWeek}
          icon={TrendingUp}
          iconColor="text-green-500"
          iconBgColor="bg-green-500/10"
          trend={{
            value: detailedStats.profileGrowthRate,
            label: "vs last week",
          }}
        />
        <StatCard
          title="New This Month"
          value={detailedStats.newProfilesThisMonth}
          icon={TrendingUp}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-500/10"
        />
      </div>

      {/* Journal Activity - Row 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          title="Journal Entries"
          value={detailedStats.totalJournalEntries}
          icon={BookOpen}
          iconColor="text-amber-500"
          iconBgColor="bg-amber-500/10"
        />
        <StatCard
          title="Entries This Week"
          value={detailedStats.journalEntriesThisWeek}
          icon={Activity}
          iconColor="text-green-500"
          iconBgColor="bg-green-500/10"
          trend={{
            value: detailedStats.weeklyJournalGrowth,
            label: "vs last week",
          }}
        />
        <StatCard
          title="Avg Practice"
          value={`${detailedStats.avgPracticeMinutes} min`}
          icon={Clock}
          iconColor="text-purple-500"
          iconBgColor="bg-purple-500/10"
          subValue="per session"
        />
        <StatCard
          title="Avg Solves"
          value={detailedStats.avgSolvesPerEntry}
          icon={Zap}
          iconColor="text-yellow-500"
          iconBgColor="bg-yellow-500/10"
          subValue="per entry"
        />
      </div>

      {/* Training Plans & Progress - Row 3 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          title="Training Plans"
          value={detailedStats.totalTrainingPlans}
          icon={Calendar}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-500/10"
        />
        <StatCard
          title="Active Plans"
          value={detailedStats.activePlans}
          icon={Activity}
          iconColor="text-green-500"
          iconBgColor="bg-green-500/10"
        />
        <StatCard
          title="Plan Completion"
          value={`${detailedStats.planCompletionRate}%`}
          icon={Percent}
          iconColor="text-cyan-500"
          iconBgColor="bg-cyan-500/10"
          subValue={`${detailedStats.completedDaysTotal} days completed`}
        />
        <StatCard
          title="With Media"
          value={detailedStats.entriesWithMedia}
          icon={Image}
          iconColor="text-pink-500"
          iconBgColor="bg-pink-500/10"
          subValue="journal entries"
        />
      </div>

      {/* Progress & Goals - Row 4 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          title="Progress Snapshots"
          value={detailedStats.totalProgressSnapshots}
          icon={BarChart3}
          iconColor="text-indigo-500"
          iconBgColor="bg-indigo-500/10"
        />
        <StatCard
          title="Users On Track"
          value={detailedStats.usersOnTrack}
          icon={Trophy}
          iconColor="text-yellow-500"
          iconBgColor="bg-yellow-500/10"
        />
        <StatCard
          title="Avg Progress"
          value={`${detailedStats.avgProgressPercentage}%`}
          icon={TrendingUp}
          iconColor="text-green-500"
          iconBgColor="bg-green-500/10"
        />
        <StatCard
          title="Goals Achieved"
          value={detailedStats.goalAchievementStats.achieved}
          icon={CheckCircle2}
          iconColor="text-green-500"
          iconBgColor="bg-green-500/10"
          subValue={`of ${detailedStats.totalGoalsHistory} total`}
        />
      </div>

      {/* Charts Grid - Row 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Weekly Journal Trend */}
        <CollapsibleCard
          title="Weekly Journal Activity"
          storageKey="admin-coach-journal-trend"
          defaultOpen={true}
        >
          <div className="mt-2">
            <BarChart
              data={detailedStats.weeklyJournalTrend.map((w) => ({
                label: w.week,
                value: w.count,
              }))}
            />
          </div>
        </CollapsibleCard>

        {/* Mood Distribution */}
        <CollapsibleCard
          title="Mood Distribution"
          storageKey="admin-coach-mood"
          defaultOpen={true}
        >
          <MoodDistributionChart
            distribution={detailedStats.moodDistribution}
          />
        </CollapsibleCard>
      </div>

      {/* Distributions Grid - Row 6 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Plan Status Distribution */}
        <CollapsibleCard
          title="Training Plan Status"
          storageKey="admin-coach-plan-status"
          defaultOpen={true}
        >
          <DistributionChart data={detailedStats.planStatusDistribution} />
        </CollapsibleCard>

        {/* Goal Achievement Stats */}
        <CollapsibleCard
          title="Goal Results"
          storageKey="admin-coach-goal-results"
          defaultOpen={true}
        >
          <DistributionChart data={detailedStats.goalAchievementStats} />
        </CollapsibleCard>
      </div>

      {/* Event & Practice Time - Row 7 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Primary Event Distribution */}
        <CollapsibleCard
          title="Primary Events"
          storageKey="admin-coach-events"
          defaultOpen={true}
        >
          <DistributionChart data={detailedStats.eventDistribution} />
        </CollapsibleCard>

        {/* Practice Time Distribution */}
        <CollapsibleCard
          title="Daily Practice Time"
          storageKey="admin-coach-practice-time"
          defaultOpen={true}
        >
          <DistributionChart data={detailedStats.practiceTimeDistribution} />
        </CollapsibleCard>
      </div>

      {/* Progress Overview - Row 8 */}
      <CollapsibleCard
        title="Progress Overview"
        storageKey="admin-coach-progress"
        defaultOpen={true}
      >
        <div className="flex flex-wrap justify-center gap-8 py-4">
          <ProgressRing
            percentage={
              detailedStats.totalProfiles > 0
                ? Math.round(
                    (detailedStats.onboardedProfiles /
                      detailedStats.totalProfiles) *
                      100,
                  )
                : 0
            }
            label="Onboarding Rate"
          />
          <ProgressRing
            percentage={detailedStats.planCompletionRate}
            label="Plan Completion"
          />
          <ProgressRing
            percentage={detailedStats.avgProgressPercentage}
            label="Avg Progress"
          />
          <ProgressRing
            percentage={
              detailedStats.totalGoalsHistory > 0
                ? Math.round(
                    (detailedStats.goalAchievementStats.achieved /
                      detailedStats.totalGoalsHistory) *
                      100,
                  )
                : 0
            }
            label="Goal Success"
          />
        </div>
      </CollapsibleCard>
    </div>
  );
}

export default function AdminCoach() {
  const {
    data: coachStats,
    isFetching: statsFetching,
    refetch: refetchStats,
  } = useCachedQuery(
    api.admin.getCoachStats,
    {},
    {
      cacheKey: ADMIN_CACHE_KEYS.coachStats,
      ttl: ADMIN_CACHE_TTLS.coach,
    },
  );
  const { data: allProfiles, isFetching: profilesFetching } = useCachedQuery(
    api.admin.getAllCoachProfiles,
    {},
    {
      cacheKey: ADMIN_CACHE_KEYS.coachProfiles,
      ttl: ADMIN_CACHE_TTLS.coach,
    },
  );
  const [selectedProfile, setSelectedProfile] = useState<
    (typeof allProfiles extends (infer T)[] | undefined ? T : never) | null
  >(null);

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleExportProfiles = () => {
    if (!allProfiles || allProfiles.length === 0) return;

    const exportData = allProfiles.map((p) => ({
      userName: p.userName,
      wcaId: p.wcaId,
      skillLevel: p.skillLevel,
      primaryEvent: p.primaryEvent,
      goalType: p.goalType,
      customGoalTime: p.customGoalTime || "",
      dailyPracticeMinutes: p.dailyPracticeMinutes,
      onboardingCompleted: p.onboardingCompleted ? "Yes" : "No",
      journalEntries: p.journalCount,
      trainingPlans: p.planCount,
      totalGoals: p.goalStats.total,
      achievedGoals: p.goalStats.achieved,
      expiredGoals: p.goalStats.expired,
      replacedGoals: p.goalStats.replaced,
      goalSuccessRate:
        p.goalStats.total > 0
          ? `${Math.round((p.goalStats.achieved / p.goalStats.total) * 100)}%`
          : "N/A",
      createdAt: formatDate(p.createdAt),
    }));

    exportToCSV(exportData, "coach_profiles");
  };

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8">
      {/* Detailed Analytics */}
      <CollapsibleCard
        title="Coach Analytics"
        storageKey="admin-coach-analytics"
        defaultOpen={true}
        className="mb-4 sm:mb-6"
      >
        <CoachAnalyticsOverview />
      </CollapsibleCard>

      {/* Skill Level & Goal Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6 items-start">
        {coachStats === undefined ? (
          [...Array(2)].map((_, i) => (
            <div key={i} className="timer-card animate-pulse">
              <div className="h-5 w-32 bg-[var(--surface-elevated)] rounded mb-4" />
              <div className="space-y-3">
                {[...Array(4)].map((_, j) => (
                  <div key={j}>
                    <div className="flex justify-between mb-1">
                      <div className="h-4 w-20 bg-[var(--surface-elevated)] rounded" />
                      <div className="h-4 w-16 bg-[var(--surface-elevated)] rounded" />
                    </div>
                    <div className="h-2 bg-[var(--surface-elevated)] rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <>
            <CollapsibleCard
              title="Skill Level Distribution"
              storageKey="admin-coach-skill-open"
              defaultOpen={true}
            >
              <DistributionChart data={coachStats.bySkillLevel} />
            </CollapsibleCard>
            <CollapsibleCard
              title="Goal Distribution"
              storageKey="admin-coach-goal-open"
              defaultOpen={true}
            >
              <DistributionChart data={coachStats.byGoalType} />
            </CollapsibleCard>
          </>
        )}
      </div>

      {/* Profiles List */}
      <CollapsibleCard
        title={`Coach Profiles${allProfiles ? ` (${allProfiles.length})` : ""}`}
        storageKey="admin-coach-profiles"
        defaultOpen={true}
        headerExtra={
          <button
            onClick={handleExportProfiles}
            disabled={!allProfiles || allProfiles.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[var(--surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] rounded-md text-[var(--text-secondary)] transition-colors font-inter disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export profiles as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        }
      >
        {allProfiles === undefined ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 animate-pulse py-3 border-b border-[var(--border)] last:border-0"
              >
                <div className="w-10 h-10 rounded-full bg-[var(--surface-elevated)] shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-[var(--surface-elevated)] rounded" />
                  <div className="h-3 w-24 bg-[var(--surface-elevated)] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : allProfiles.length === 0 ? (
          <div className="py-8 text-center">
            <GraduationCap className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-[var(--text-muted)] font-inter">
              No coach profiles found
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--surface-elevated)] border-y border-[var(--border)]">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-muted)] font-inter uppercase tracking-wider">
                      User
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-muted)] font-inter uppercase tracking-wider">
                      Skill
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-muted)] font-inter uppercase tracking-wider">
                      Event
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-muted)] font-inter uppercase tracking-wider">
                      Goal
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-muted)] font-inter uppercase tracking-wider">
                      Journals
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-muted)] font-inter uppercase tracking-wider">
                      Plans
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-muted)] font-inter uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-muted)] font-inter uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allProfiles.map((profile) => (
                    <tr
                      key={profile._id}
                      className="border-b border-[var(--border)] hover:bg-[var(--surface-elevated)] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)] font-inter">
                            {profile.userName}
                          </p>
                          <p className="text-xs text-[var(--primary)] font-inter">
                            {profile.wcaId}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full font-inter ${
                            profile.skillLevel === "beginner"
                              ? "bg-green-500/10 text-green-500"
                              : profile.skillLevel === "intermediate"
                                ? "bg-yellow-500/10 text-yellow-500"
                                : profile.skillLevel === "advanced"
                                  ? "bg-orange-500/10 text-orange-500"
                                  : "bg-[var(--primary)]/10 text-[var(--primary)]"
                          }`}
                        >
                          {profile.skillLevel}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[var(--text-secondary)] font-inter">
                          {profile.primaryEvent}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[var(--text-secondary)] font-inter">
                          {profile.goalType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[var(--text-primary)] font-inter">
                          {profile.journalCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[var(--text-primary)] font-inter">
                          {profile.planCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full font-inter ${
                            profile.onboardingCompleted
                              ? "bg-green-500/10 text-green-500"
                              : "bg-yellow-500/10 text-yellow-500"
                          }`}
                        >
                          {profile.onboardingCompleted ? "Active" : "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedProfile(profile)}
                          className="p-1.5 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--surface)] rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {allProfiles.map((profile) => (
                <div
                  key={profile._id}
                  className="bg-[var(--surface-elevated)] rounded-lg p-4 border border-[var(--border)]"
                  onClick={() => setSelectedProfile(profile)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-[var(--text-primary)] font-inter">
                        {profile.userName}
                      </p>
                      <p className="text-sm text-[var(--primary)] font-inter">
                        {profile.wcaId}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-inter ${
                        profile.onboardingCompleted
                          ? "bg-green-500/10 text-green-500"
                          : "bg-yellow-500/10 text-yellow-500"
                      }`}
                    >
                      {profile.onboardingCompleted ? "Active" : "Pending"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-[var(--text-muted)] font-inter">
                        Skill:{" "}
                      </span>
                      <span className="text-[var(--text-primary)] font-inter capitalize">
                        {profile.skillLevel}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] font-inter">
                        Event:{" "}
                      </span>
                      <span className="text-[var(--text-primary)] font-inter">
                        {profile.primaryEvent}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] font-inter">
                        Journals:{" "}
                      </span>
                      <span className="text-[var(--text-primary)] font-inter">
                        {profile.journalCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] font-inter">
                        Plans:{" "}
                      </span>
                      <span className="text-[var(--text-primary)] font-inter">
                        {profile.planCount}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CollapsibleCard>

      {/* Profile Details Modal */}
      {selectedProfile && (
        <ProfileDetailsModal
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
        />
      )}
    </div>
  );
}
