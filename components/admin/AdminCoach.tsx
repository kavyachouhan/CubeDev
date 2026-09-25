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
import { Table } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { AdminStatCard } from "./AdminStatCard";
import { AdminCollapsibleCard } from "./AdminCollapsibleCard";
import { useEffectiveTheme, useThemeColors } from "@/lib/hooks/useThemeColors";
import type { LucideIcon } from "lucide-react";
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

// BarChart Component using Chart.js
function BarChart({
  data,
}: {
  data: Array<{ label: string; value: number }>;
  maxValue?: number;
}) {
  const effectiveTheme = useEffectiveTheme();
  const primaryColor = useThemeColors()["--primary"];
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
    { icon: LucideIcon; color: string; bgColor: string }
  > = {
    great: {
      icon: Heart,
      color: "text-(--success)",
      bgColor: "bg-(--success)/10",
    },
    good: { icon: Smile, color: "text-(--info)", bgColor: "bg-(--info)/10" },
    okay: {
      icon: Meh,
      color: "text-(--warning)",
      bgColor: "bg-(--warning)/10",
    },
    frustrated: {
      icon: Frown,
      color: "text-(--warning)",
      bgColor: "bg-(--warning)/10",
    },
    tired: {
      icon: Moon,
      color: "text-(--accent)",
      bgColor: "bg-(--accent)/10",
    },
  };

  const total = Object.values(distribution).reduce((sum, v) => sum + v, 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
      {Object.entries(distribution).map(([mood, count]) => {
        const config = moodConfig[mood] || {
          icon: Meh,
          color: "text-(--text-muted)",
          bgColor: "bg-(--border)/10",
        };
        const Icon = config.icon;
        const percentage = total > 0 ? ((count / total) * 100).toFixed(0) : 0;

        return (
          <div
            key={mood}
            className="bg-(--surface) rounded-(--radius-control) p-3 text-center border border-(--border)"
          >
            <div
              className={`p-2 ${config.bgColor} rounded-(--radius-control) inline-block mb-1`}
            >
              <Icon className={`w-4 h-4 ${config.color}`} />
            </div>
            <div className="text-lg font-bold text-(--text-primary) font-statement">
              {count}
            </div>
            <div className="text-xs text-(--text-muted) capitalize font-inter">
              {mood}
            </div>
            <div className="text-xs text-(--text-muted) font-inter">
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
    beginner: "bg-(--success)",
    intermediate: "bg-(--warning)",
    advanced: "bg-(--warning)",
    expert: "bg-(--primary)",
    "sub-60": "bg-(--success)",
    "sub-45": "bg-(--success)",
    "sub-30": "bg-(--info)",
    "sub-20": "bg-(--warning)",
    "sub-15": "bg-(--warning)",
    "sub-12": "bg-(--warning)",
    "sub-10": "bg-(--warning)",
    "sub-8": "bg-(--primary)",
    custom: "bg-(--accent)",
    active: "bg-(--success)",
    completed: "bg-(--info)",
    skipped: "bg-(--border)",
    achieved: "bg-(--success)",
    expired: "bg-(--error)",
    replaced: "bg-(--warning)",
    "333": "bg-(--primary)",
    "222": "bg-(--success)",
    "444": "bg-(--warning)",
    "555": "bg-(--accent)",
    pyram: "bg-(--warning)",
    skewb: "bg-(--primary)",
    "15-30 min": "bg-(--success)",
    "30-60 min": "bg-(--info)",
    "1-2 hours": "bg-(--warning)",
    "2+ hours": "bg-(--warning)",
  };

  const colors = colorMap || defaultColors;

  return (
    <div className="space-y-3">
      {Object.entries(data)
        .filter(([, count]) => count > 0)
        .map(([key, count]) => {
          const percentage = total > 0 ? (count / total) * 100 : 0;
          const colorClass = colors[key] || "bg-(--primary)";

          return (
            <div key={key}>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-(--text-secondary) font-inter capitalize">
                  {key.replace(/-/g, " ")}
                </span>
                <span className="text-sm font-medium text-(--text-primary) font-inter">
                  {count} ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 bg-(--surface) rounded-full overflow-hidden">
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
    <Modal open onClose={onClose} size="lg" mobile="fullscreen">
      <Modal.Body>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-(--text-primary) font-statement">
              {profile.userName}
            </h2>
            <p className="text-sm text-(--primary) font-inter">
              {profile.wcaId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-(--text-muted) hover:text-(--text-primary) transition-colors p-1 rounded-(--radius-control) hover:bg-(--surface-elevated)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Info */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <AdminStatCard
              title="Skill Level"
              value={profile.skillLevel}
              icon={GraduationCap}
              iconColor="text-(--info)"
              iconBgColor="bg-(--info)/10"
            />
            <AdminStatCard
              title="Primary Event"
              value={profile.primaryEvent}
              icon={Zap}
              iconColor="text-(--warning)"
              iconBgColor="bg-(--warning)/10"
            />
            <AdminStatCard
              title="Goal"
              value={
                profile.goalType === "custom" && profile.customGoalTime
                  ? formatTime(profile.customGoalTime)
                  : profile.goalType
              }
              icon={Target}
              iconColor="text-(--success)"
              iconBgColor="bg-(--success)/10"
            />
            <AdminStatCard
              title="Daily Practice"
              value={`${profile.dailyPracticeMinutes} min`}
              icon={Clock}
              iconColor="text-(--accent)"
              iconBgColor="bg-(--accent)/10"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <AdminStatCard
              title="Journal Entries"
              value={profile.journalCount}
              icon={BookOpen}
              iconColor="text-(--warning)"
              iconBgColor="bg-(--warning)/10"
            />
            <AdminStatCard
              title="Training Plans"
              value={profile.planCount}
              icon={Calendar}
              iconColor="text-(--primary)"
              iconBgColor="bg-(--primary)/10"
            />
          </div>

          {/* Goal History */}
          {profile.goalStats.total > 0 && (
            <div className="bg-(--surface-elevated) rounded-(--radius-card) p-4 border border-(--border)">
              <h4 className="text-sm font-medium text-(--text-primary) mb-3 font-statement">
                Goal History
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-(--text-primary) font-statement">
                    {profile.goalStats.total}
                  </div>
                  <div className="text-xs text-(--text-muted) font-inter">
                    Total Goals
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-(--success) font-statement">
                    {profile.goalStats.achieved}
                  </div>
                  <div className="text-xs text-(--text-muted) font-inter">
                    Achieved
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-(--error) font-statement">
                    {profile.goalStats.expired}
                  </div>
                  <div className="text-xs text-(--text-muted) font-inter">
                    Expired
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-(--warning) font-statement">
                    {profile.goalStats.replaced}
                  </div>
                  <div className="text-xs text-(--text-muted) font-inter">
                    Replaced
                  </div>
                </div>
              </div>
              {profile.goalStats.total > 0 && (
                <div className="mt-3 pt-3 border-t border-(--border)">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-(--text-muted) font-inter">
                      Success Rate
                    </span>
                    <span className="font-medium text-(--text-primary) font-inter">
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

          <div className="bg-(--surface-elevated) rounded-(--radius-card) p-4 border border-(--border)">
            <div className="flex justify-between text-sm">
              <span className="text-(--text-muted) font-inter">Status</span>
              <span
                className={`font-inter ${profile.onboardingCompleted ? "text-(--success)" : "text-(--warning)"}`}
              >
                {profile.onboardingCompleted ? "Onboarded" : "Pending"}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-(--text-muted) font-inter">Created</span>
              <span className="text-(--text-primary) font-inter">
                {formatDate(profile.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-(--surface-elevated) hover:bg-(--border) text-(--text-primary) font-medium rounded-(--radius-control) transition-colors font-inter"
          >
            Close
          </button>
        </div>
      </Modal.Body>
    </Modal>
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
          <span className="text-lg font-bold text-(--text-primary) font-statement">
            {percentage}%
          </span>
        </div>
      </div>
      <p className="mt-2 text-sm text-(--text-secondary) font-inter">{label}</p>
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
              className="h-20 bg-(--surface-elevated) rounded-(--radius-card) animate-pulse"
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
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-(--surface-elevated) hover:bg-(--border) border border-(--border) rounded-(--radius-control) text-(--text-secondary) transition-colors font-inter"
        >
          <Download className="w-4 h-4" />
          Export Analytics
        </button>
      </div>

      {/* Key Metrics - Row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <AdminStatCard
          title="Total Profiles"
          value={detailedStats.totalProfiles}
          icon={Users}
          iconColor="text-(--info)"
          iconBgColor="bg-(--info)/10"
        />
        <AdminStatCard
          title="Onboarded"
          value={detailedStats.onboardedProfiles}
          icon={CheckCircle2}
          iconColor="text-(--success)"
          iconBgColor="bg-(--success)/10"
          subValue={`${detailedStats.totalProfiles > 0 ? ((detailedStats.onboardedProfiles / detailedStats.totalProfiles) * 100).toFixed(0) : 0}% of total`}
        />
        <AdminStatCard
          title="New This Week"
          value={detailedStats.newProfilesThisWeek}
          icon={TrendingUp}
          iconColor="text-(--success)"
          iconBgColor="bg-(--success)/10"
          trend={{
            value: detailedStats.profileGrowthRate,
            label: "vs last week",
          }}
        />
        <AdminStatCard
          title="New This Month"
          value={detailedStats.newProfilesThisMonth}
          icon={TrendingUp}
          iconColor="text-(--info)"
          iconBgColor="bg-(--info)/10"
        />
      </div>

      {/* Journal Activity - Row 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <AdminStatCard
          title="Journal Entries"
          value={detailedStats.totalJournalEntries}
          icon={BookOpen}
          iconColor="text-(--warning)"
          iconBgColor="bg-(--warning)/10"
        />
        <AdminStatCard
          title="Entries This Week"
          value={detailedStats.journalEntriesThisWeek}
          icon={Activity}
          iconColor="text-(--success)"
          iconBgColor="bg-(--success)/10"
          trend={{
            value: detailedStats.weeklyJournalGrowth,
            label: "vs last week",
          }}
        />
        <AdminStatCard
          title="Avg Practice"
          value={`${detailedStats.avgPracticeMinutes} min`}
          icon={Clock}
          iconColor="text-(--accent)"
          iconBgColor="bg-(--accent)/10"
          subValue="per session"
        />
        <AdminStatCard
          title="Avg Solves"
          value={detailedStats.avgSolvesPerEntry}
          icon={Zap}
          iconColor="text-(--warning)"
          iconBgColor="bg-(--warning)/10"
          subValue="per entry"
        />
      </div>

      {/* Training Plans & Progress - Row 3 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <AdminStatCard
          title="Training Plans"
          value={detailedStats.totalTrainingPlans}
          icon={Calendar}
          iconColor="text-(--info)"
          iconBgColor="bg-(--info)/10"
        />
        <AdminStatCard
          title="Active Plans"
          value={detailedStats.activePlans}
          icon={Activity}
          iconColor="text-(--success)"
          iconBgColor="bg-(--success)/10"
        />
        <AdminStatCard
          title="Plan Completion"
          value={`${detailedStats.planCompletionRate}%`}
          icon={Percent}
          iconColor="text-(--primary)"
          iconBgColor="bg-(--primary)/10"
          subValue={`${detailedStats.completedDaysTotal} days completed`}
        />
        <AdminStatCard
          title="With Media"
          value={detailedStats.entriesWithMedia}
          icon={Image}
          iconColor="text-(--accent)"
          iconBgColor="bg-(--accent)/10"
          subValue="journal entries"
        />
      </div>

      {/* Progress & Goals - Row 4 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <AdminStatCard
          title="Progress Snapshots"
          value={detailedStats.totalProgressSnapshots}
          icon={BarChart3}
          iconColor="text-(--accent)"
          iconBgColor="bg-(--accent)/10"
        />
        <AdminStatCard
          title="Users On Track"
          value={detailedStats.usersOnTrack}
          icon={Trophy}
          iconColor="text-(--warning)"
          iconBgColor="bg-(--warning)/10"
        />
        <AdminStatCard
          title="Avg Progress"
          value={`${detailedStats.avgProgressPercentage}%`}
          icon={TrendingUp}
          iconColor="text-(--success)"
          iconBgColor="bg-(--success)/10"
        />
        <AdminStatCard
          title="Goals Achieved"
          value={detailedStats.goalAchievementStats.achieved}
          icon={CheckCircle2}
          iconColor="text-(--success)"
          iconBgColor="bg-(--success)/10"
          subValue={`of ${detailedStats.totalGoalsHistory} total`}
        />
      </div>

      {/* Charts Grid - Row 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Weekly Journal Trend */}
        <AdminCollapsibleCard
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
        </AdminCollapsibleCard>

        {/* Mood Distribution */}
        <AdminCollapsibleCard
          title="Mood Distribution"
          storageKey="admin-coach-mood"
          defaultOpen={true}
        >
          <MoodDistributionChart
            distribution={detailedStats.moodDistribution}
          />
        </AdminCollapsibleCard>
      </div>

      {/* Distributions Grid - Row 6 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Plan Status Distribution */}
        <AdminCollapsibleCard
          title="Training Plan Status"
          storageKey="admin-coach-plan-status"
          defaultOpen={true}
        >
          <DistributionChart data={detailedStats.planStatusDistribution} />
        </AdminCollapsibleCard>

        {/* Goal Achievement Stats */}
        <AdminCollapsibleCard
          title="Goal Results"
          storageKey="admin-coach-goal-results"
          defaultOpen={true}
        >
          <DistributionChart data={detailedStats.goalAchievementStats} />
        </AdminCollapsibleCard>
      </div>

      {/* Event & Practice Time - Row 7 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Primary Event Distribution */}
        <AdminCollapsibleCard
          title="Primary Events"
          storageKey="admin-coach-events"
          defaultOpen={true}
        >
          <DistributionChart data={detailedStats.eventDistribution} />
        </AdminCollapsibleCard>

        {/* Practice Time Distribution */}
        <AdminCollapsibleCard
          title="Daily Practice Time"
          storageKey="admin-coach-practice-time"
          defaultOpen={true}
        >
          <DistributionChart data={detailedStats.practiceTimeDistribution} />
        </AdminCollapsibleCard>
      </div>

      {/* Progress Overview - Row 8 */}
      <AdminCollapsibleCard
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
      </AdminCollapsibleCard>
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
      <AdminCollapsibleCard
        title="Coach Analytics"
        storageKey="admin-coach-analytics"
        defaultOpen={true}
        className="mb-4 sm:mb-6"
      >
        <CoachAnalyticsOverview />
      </AdminCollapsibleCard>

      {/* Skill Level & Goal Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6 items-start">
        {coachStats === undefined ? (
          [...Array(2)].map((_, i) => (
            <div key={i} className="timer-card animate-pulse">
              <div className="h-5 w-32 bg-(--surface-elevated) rounded mb-4" />
              <div className="space-y-3">
                {[...Array(4)].map((_, j) => (
                  <div key={j}>
                    <div className="flex justify-between mb-1">
                      <div className="h-4 w-20 bg-(--surface-elevated) rounded" />
                      <div className="h-4 w-16 bg-(--surface-elevated) rounded" />
                    </div>
                    <div className="h-2 bg-(--surface-elevated) rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <>
            <AdminCollapsibleCard
              title="Skill Level Distribution"
              storageKey="admin-coach-skill-open"
              defaultOpen={true}
            >
              <DistributionChart data={coachStats.bySkillLevel} />
            </AdminCollapsibleCard>
            <AdminCollapsibleCard
              title="Goal Distribution"
              storageKey="admin-coach-goal-open"
              defaultOpen={true}
            >
              <DistributionChart data={coachStats.byGoalType} />
            </AdminCollapsibleCard>
          </>
        )}
      </div>

      {/* Profiles List */}
      <AdminCollapsibleCard
        title={`Coach Profiles${allProfiles ? ` (${allProfiles.length})` : ""}`}
        storageKey="admin-coach-profiles"
        defaultOpen={true}
        headerExtra={
          <button
            onClick={handleExportProfiles}
            disabled={!allProfiles || allProfiles.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-(--surface-elevated) hover:bg-(--border) border border-(--border) rounded-md text-(--text-secondary) transition-colors font-inter disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="flex items-center gap-4 animate-pulse py-3 border-b border-(--border) last:border-0"
              >
                <div className="w-10 h-10 rounded-full bg-(--surface-elevated) shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-(--surface-elevated) rounded" />
                  <div className="h-3 w-24 bg-(--surface-elevated) rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : allProfiles.length === 0 ? (
          <div className="py-8 text-center">
            <GraduationCap className="w-12 h-12 text-(--text-muted) mx-auto mb-3" />
            <p className="text-(--text-muted) font-inter">
              No coach profiles found
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <Table.Scroll className="hidden md:block">
              <Table>
                <Table.Head>
                  <Table.Row>
                    <Table.HeaderCell>User</Table.HeaderCell>
                    <Table.HeaderCell>Skill</Table.HeaderCell>
                    <Table.HeaderCell>Event</Table.HeaderCell>
                    <Table.HeaderCell>Goal</Table.HeaderCell>
                    <Table.HeaderCell>Journals</Table.HeaderCell>
                    <Table.HeaderCell>Plans</Table.HeaderCell>
                    <Table.HeaderCell>Status</Table.HeaderCell>
                    <Table.HeaderCell>Actions</Table.HeaderCell>
                  </Table.Row>
                </Table.Head>
                <Table.Body>
                  {allProfiles.map((profile) => (
                    <Table.Row
                      key={profile._id}
                      className="border-b border-(--border) hover:bg-(--surface-elevated) transition-colors"
                    >
                      <Table.Cell>
                        <div>
                          <p className="text-sm font-medium text-(--text-primary) font-inter">
                            {profile.userName}
                          </p>
                          <p className="text-xs text-(--primary) font-inter">
                            {profile.wcaId}
                          </p>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full font-inter ${
                            profile.skillLevel === "beginner"
                              ? "bg-(--success)/10 text-(--success)"
                              : profile.skillLevel === "intermediate"
                                ? "bg-(--warning)/10 text-(--warning)"
                                : profile.skillLevel === "advanced"
                                  ? "bg-(--warning)/10 text-(--warning)"
                                  : "bg-(--primary)/10 text-(--primary)"
                          }`}
                        >
                          {profile.skillLevel}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm text-(--text-secondary) font-inter">
                          {profile.primaryEvent}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm text-(--text-secondary) font-inter">
                          {profile.goalType}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm text-(--text-primary) font-inter">
                          {profile.journalCount}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm text-(--text-primary) font-inter">
                          {profile.planCount}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full font-inter ${
                            profile.onboardingCompleted
                              ? "bg-(--success)/10 text-(--success)"
                              : "bg-(--warning)/10 text-(--warning)"
                          }`}
                        >
                          {profile.onboardingCompleted ? "Active" : "Pending"}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <button
                          onClick={() => setSelectedProfile(profile)}
                          className="p-1.5 text-(--text-muted) hover:text-(--primary) hover:bg-(--surface) rounded-(--radius-control) transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </Table.Scroll>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {allProfiles.map((profile) => (
                <div
                  key={profile._id}
                  className="bg-(--surface-elevated) rounded-(--radius-control) p-4 border border-(--border)"
                  onClick={() => setSelectedProfile(profile)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-(--text-primary) font-inter">
                        {profile.userName}
                      </p>
                      <p className="text-sm text-(--primary) font-inter">
                        {profile.wcaId}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-inter ${
                        profile.onboardingCompleted
                          ? "bg-(--success)/10 text-(--success)"
                          : "bg-(--warning)/10 text-(--warning)"
                      }`}
                    >
                      {profile.onboardingCompleted ? "Active" : "Pending"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-(--text-muted) font-inter">
                        Skill:{" "}
                      </span>
                      <span className="text-(--text-primary) font-inter capitalize">
                        {profile.skillLevel}
                      </span>
                    </div>
                    <div>
                      <span className="text-(--text-muted) font-inter">
                        Event:{" "}
                      </span>
                      <span className="text-(--text-primary) font-inter">
                        {profile.primaryEvent}
                      </span>
                    </div>
                    <div>
                      <span className="text-(--text-muted) font-inter">
                        Journals:{" "}
                      </span>
                      <span className="text-(--text-primary) font-inter">
                        {profile.journalCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-(--text-muted) font-inter">
                        Plans:{" "}
                      </span>
                      <span className="text-(--text-primary) font-inter">
                        {profile.planCount}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </AdminCollapsibleCard>

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
