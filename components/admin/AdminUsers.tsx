"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
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
  Search,
  User,
  Calendar,
  Globe,
  Timer,
  Trophy,
  BookOpen,
  Eye,
  EyeOff,
  X,
  ExternalLink,
  Mail,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  UserMinus,
  Sun,
  Moon,
  Monitor,
  Download,
  Shield,
  UserCheck,
  Percent,
  Clock,
} from "lucide-react";
import { Table } from "@/components/ui/Table";
import { Checkbox, SearchInput } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { AdminStatCard } from "./AdminStatCard";
import { AdminCollapsibleCard } from "./AdminCollapsibleCard";
import { useEffectiveTheme, useThemeColors } from "@/lib/hooks/useThemeColors";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import { canOpenWcaProfile } from "@/lib/identifier-utils";

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

// Progress Bar for analytics
function ProgressBar({
  label,
  value,
  total,
  color = "bg-(--primary)",
}: {
  label: string;
  value: number;
  total: number;
  color?: string;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-(--text-secondary) font-inter">{label}</span>
        <span className="text-(--text-primary) font-medium font-inter">
          {value.toLocaleString()} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="h-2 bg-(--surface-elevated) rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Bar Chart Component for registration trends
function BarChart({
  data,
  maxValue,
}: {
  data: Array<{ label: string; value: number }>;
  maxValue: number;
}) {
  return (
    <div className="flex items-end gap-1 h-24 sm:h-32">
      {data.map((item, idx) => (
        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-(--primary) rounded-t transition-all duration-500 min-h-[4px]"
            style={{
              height: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
            }}
          />
          <span className="text-[10px] text-(--text-muted) font-inter truncate max-w-full">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// Color Scheme Distribution
function ColorSchemeChart({
  distribution,
}: {
  distribution: Record<string, number>;
}) {
  const colors: Record<string, string> = {
    blue: "bg-(--info)",
    purple: "bg-(--accent)",
    green: "bg-(--success)",
    orange: "bg-(--warning)",
    cyan: "bg-(--primary)",
  };
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-2">
      {Object.entries(distribution).map(([scheme, count]) => (
        <div key={scheme} className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${colors[scheme] || "bg-(--border)"}`}
          />
          <span className="text-sm text-(--text-secondary) font-inter capitalize flex-1">
            {scheme}
          </span>
          <span className="text-sm text-(--text-primary) font-medium font-inter">
            {count}
          </span>
          <span className="text-xs text-(--text-muted) font-inter w-12 text-right">
            {total > 0 ? ((count / total) * 100).toFixed(0) : 0}%
          </span>
        </div>
      ))}
    </div>
  );
}

// Theme Distribution Chart
function ThemeDistributionChart({
  distribution,
}: {
  distribution: Record<string, number>;
}) {
  const icons: Record<string, LucideIcon> = {
    light: Sun,
    dark: Moon,
    auto: Monitor,
  };
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);

  return (
    <div className="grid grid-cols-3 gap-2">
      {Object.entries(distribution).map(([mode, count]) => {
        const Icon = icons[mode] || Monitor;
        return (
          <div
            key={mode}
            className="bg-(--surface) rounded-(--radius-control) p-3 text-center border border-(--border)"
          >
            <Icon className="w-5 h-5 mx-auto mb-1 text-(--text-secondary)" />
            <div className="text-lg font-bold text-(--text-primary) font-statement">
              {count}
            </div>
            <div className="text-xs text-(--text-muted) capitalize font-inter">
              {mode}
            </div>
            <div className="text-xs text-(--text-muted) font-inter">
              {total > 0 ? ((count / total) * 100).toFixed(0) : 0}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

// User Details Modal
function UserDetailsModal({
  userId,
  onClose,
}: {
  userId: Id<"users">;
  onClose: () => void;
}) {
  const userActivity = useQuery(api.admin.getUserActivitySummary, { userId });

  if (!userActivity) {
    return (
      <Modal open onClose={onClose} size="lg" mobile="fullscreen">
        <Modal.Body>
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-(--surface-elevated) rounded" />
            <div className="h-4 w-32 bg-(--surface-elevated) rounded" />
            <div className="grid grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-(--surface-elevated) rounded-(--radius-control)"
                />
              ))}
            </div>
          </div>
        </Modal.Body>
      </Modal>
    );
  }

  const { user, stats } = userActivity;

  return (
    <Modal open onClose={onClose} size="2xl" mobile="fullscreen">
      <Modal.Body>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.name}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover border-2 border-(--primary)"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-(--primary)/10 flex items-center justify-center">
                <User className="w-6 h-6 text-(--primary)" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-(--text-primary) font-statement">
                {user.name}
              </h2>
              <div className="flex items-center gap-2">
                {canOpenWcaProfile(user.wcaId) ? (
                  <a
                    href={`https://www.worldcubeassociation.org/persons/${user.wcaId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-(--primary) hover:underline font-inter flex items-center gap-1"
                  >
                    {user.wcaId}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-sm text-(--text-secondary) font-inter">
                    {user.wcaId}
                  </span>
                )}
                {user.isDeleted && (
                  <span className="px-2 py-0.5 text-xs bg-(--error)/10 text-(--error) rounded-full">
                    Deleted
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-(--text-muted) hover:text-(--text-primary) transition-colors p-1 rounded-(--radius-control) hover:bg-(--surface-elevated)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-(--text-muted) mb-3 font-inter uppercase tracking-wide">
              Account Information
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <AdminStatCard
                title="Country"
                value={user.countryIso2}
                icon={Globe}
                iconColor="text-(--info)"
                iconBgColor="bg-(--info)/10"
              />
              <AdminStatCard
                title="Joined"
                value={new Date(user.createdAt).toLocaleDateString()}
                icon={Calendar}
                iconColor="text-(--success)"
                iconBgColor="bg-(--success)/10"
              />
              <AdminStatCard
                title="Last Active"
                value={new Date(user.lastLoginAt).toLocaleDateString()}
                icon={Calendar}
                iconColor="text-(--warning)"
                iconBgColor="bg-(--warning)/10"
              />
            </div>
          </div>

          {/* Email */}
          <div className="bg-(--surface-elevated) rounded-(--radius-card) p-4 border border-(--border)">
            <div className="flex items-center gap-2 text-(--text-muted) mb-2">
              <Mail className="w-4 h-4" />
              <span className="text-sm font-inter">Email</span>
            </div>
            <p className="text-sm font-medium text-(--text-primary) font-inter">
              {user.email || "Not provided"}
            </p>
          </div>

          {/* Activity Stats */}
          <div>
            <h4 className="text-sm font-medium text-(--text-muted) mb-3 font-inter uppercase tracking-wide">
              Activity Stats
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <AdminStatCard
                title="Total Solves"
                value={stats.totalSolves}
                icon={Timer}
                iconColor="text-(--info)"
                iconBgColor="bg-(--info)/10"
              />
              <AdminStatCard
                title="Sessions"
                value={stats.totalSessions}
                icon={Timer}
                iconColor="text-(--success)"
                iconBgColor="bg-(--success)/10"
              />
              <AdminStatCard
                title="Challenges"
                value={stats.challengeRoomsJoined}
                icon={Trophy}
                iconColor="text-(--warning)"
                iconBgColor="bg-(--warning)/10"
              />
              <AdminStatCard
                title="Algs Mastered"
                value={stats.algorithmsLearned}
                icon={BookOpen}
                iconColor="text-(--accent)"
                iconBgColor="bg-(--accent)/10"
              />
              <AdminStatCard
                title="Algs Learning"
                value={stats.algorithmsInProgress}
                icon={BookOpen}
                iconColor="text-(--accent)"
                iconBgColor="bg-(--accent)/10"
              />
              <AdminStatCard
                title="Coach Profile"
                value={stats.hasCoachProfile ? "Active" : "None"}
                icon={User}
                iconColor={
                  stats.hasCoachProfile
                    ? "text-(--success)"
                    : "text-(--text-muted)"
                }
                iconBgColor={
                  stats.hasCoachProfile
                    ? "bg-(--success)/10"
                    : "bg-(--border)/10"
                }
              />
            </div>
          </div>

          {/* Settings */}
          <div className="bg-(--surface-elevated) rounded-(--radius-card) p-4 border border-(--border)">
            <h4 className="text-sm font-medium text-(--text-primary) mb-3 font-statement">
              User Settings
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-(--text-muted) font-inter">
                  Theme Mode
                </span>
                <span className="text-(--text-primary) font-inter capitalize">
                  {user.themeMode || "auto"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-(--text-muted) font-inter">
                  Color Scheme
                </span>
                <span className="text-(--text-primary) font-inter capitalize">
                  {user.colorScheme || "blue"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-(--text-muted) font-inter">
                  Profile Hidden
                </span>
                <span className="text-(--text-primary) font-inter">
                  {user.hideProfile ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-(--text-muted) font-inter">
                  Challenge Stats Hidden
                </span>
                <span className="text-(--text-primary) font-inter">
                  {user.hideChallengeStats ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
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

// User Analytics Overview Component
// Export helper function
function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          if (typeof value === "string" && value.includes(",")) {
            return `"${value}"`;
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

function exportAnalyticsToJSON(
  analytics: Record<string, unknown>,
  filename: string,
) {
  const jsonContent = JSON.stringify(analytics, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.json`;
  link.click();
}

// Horizontal Distribution Bar Component
function DistributionBar({
  items,
  total,
}: {
  items: Array<{ label: string; value: number; color: string }>;
  total: number;
}) {
  return (
    <div className="space-y-3">
      <div className="flex h-3 rounded-full overflow-hidden bg-(--surface)">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`${item.color} transition-all duration-500`}
            style={{
              width: total > 0 ? `${(item.value / total) * 100}%` : "0%",
            }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
            <span className="text-xs text-(--text-secondary) font-inter">
              {item.label}: {item.value} (
              {total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Compact Stat Row Component
function CompactStatRow({
  items,
  gridCols = 4,
}: {
  items: Array<{
    label: string;
    value: string | number;
    icon?: LucideIcon;
  }>;
  gridCols?: 3 | 4;
}) {
  const gridClass =
    gridCols === 3
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
      : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3";

  return (
    <div className={gridClass}>
      {items.map((item, idx) => (
        <div
          key={idx}
          className="flex items-center gap-2 bg-(--surface-elevated) rounded-(--radius-control) p-2.5 border border-(--border)"
        >
          {item.icon && (
            <item.icon className="w-3.5 h-3.5 text-(--text-muted)" />
          )}
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-(--text-muted) uppercase tracking-wide truncate font-inter">
              {item.label}
            </div>
            <div className="text-sm font-semibold text-(--text-primary) font-statement">
              {typeof item.value === "number"
                ? item.value.toLocaleString()
                : item.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function UserAnalyticsOverview() {
  const {
    data: analytics,
    isFetching,
    refetch,
  } = useCachedQuery(
    api.admin.getUserAnalytics,
    {},
    {
      cacheKey: ADMIN_CACHE_KEYS.userAnalytics,
      ttl: ADMIN_CACHE_TTLS.analytics,
    },
  );
  const effectiveTheme = useEffectiveTheme();
  const primaryColor = useThemeColors()["--primary"];
  const isLight = effectiveTheme === "light";
  const textColor = isLight
    ? "rgba(17, 24, 39, 0.8)"
    : "rgba(255, 255, 255, 0.8)";
  const gridColor = isLight ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)";

  const handleExportAnalytics = () => {
    if (analytics) {
      exportAnalyticsToJSON(
        analytics as unknown as Record<string, unknown>,
        "user_analytics",
      );
    }
  };

  // Weekly Registration Bar Chart Data
  const weeklyChartData = useMemo(() => {
    if (!analytics?.registration?.weeklyTrend) return null;

    return {
      labels: analytics.registration.weeklyTrend.map((w) => w.week),
      datasets: [
        {
          label: "Registrations",
          data: analytics.registration.weeklyTrend.map((w) => w.count),
          backgroundColor: primaryColor,
          borderColor: primaryColor,
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [analytics, primaryColor]);

  // Monthly Registration Bar Chart Data (last 6 months)
  const monthlyChartData = useMemo(() => {
    if (!analytics?.registration?.monthlyTrend) return null;

    return {
      labels: analytics.registration.monthlyTrend.map((m) => m.month),
      datasets: [
        {
          label: "Registrations",
          data: analytics.registration.monthlyTrend.map((m) => m.count),
          backgroundColor: primaryColor,
          borderColor: primaryColor,
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [analytics, primaryColor]);

  const barChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
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

  // Gender Distribution Doughnut Data
  const genderDoughnutData = useMemo(() => {
    if (!analytics?.demographics?.genderDistribution) return null;

    const { male, female, other, unspecified } =
      analytics.demographics.genderDistribution;
    const total =
      (male || 0) + (female || 0) + (other || 0) + (unspecified || 0);
    if (total === 0) return null;

    return {
      labels: ["Male", "Female", "Other", "Unspecified"],
      datasets: [
        {
          data: [male || 0, female || 0, other || 0, unspecified || 0],
          backgroundColor: [
            "rgba(59, 130, 246, 0.8)", // blue
            "rgba(236, 72, 153, 0.8)", // pink
            "rgba(168, 85, 247, 0.8)", // purple
            "rgba(107, 114, 128, 0.8)", // gray
          ],
          borderColor: isLight ? "rgba(255,255,255,1)" : "rgba(30,30,30,1)",
          borderWidth: 2,
        },
      ],
    };
  }, [analytics, isLight]);

  // Color Scheme Doughnut Data
  const colorSchemeDoughnutData = useMemo(() => {
    if (!analytics?.preferences?.colorSchemeDistribution) return null;

    const distribution = analytics.preferences.colorSchemeDistribution;
    const entries = Object.entries(distribution);
    if (entries.length === 0) return null;

    const colorMap: Record<string, string> = {
      blue: "rgba(59, 130, 246, 0.8)",
      purple: "rgba(168, 85, 247, 0.8)",
      green: "rgba(34, 197, 94, 0.8)",
      orange: "rgba(249, 115, 22, 0.8)",
      cyan: "rgba(14, 165, 233, 0.8)",
    };

    return {
      labels: entries.map(
        ([scheme]) => scheme.charAt(0).toUpperCase() + scheme.slice(1),
      ),
      datasets: [
        {
          data: entries.map(([, count]) => count),
          backgroundColor: entries.map(
            ([scheme]) => colorMap[scheme] || "rgba(107, 114, 128, 0.8)",
          ),
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
          title="Total Users"
          value={analytics.totalUsers}
          icon={Users}
          iconColor="text-(--info)"
          iconBgColor="bg-(--info)/10"
        />
        <AdminStatCard
          title="Active Today"
          value={analytics.activity.activeToday}
          icon={Activity}
          iconColor="text-(--success)"
          iconBgColor="bg-(--success)/10"
          subValue={`${analytics.totalUsers > 0 ? ((analytics.activity.activeToday / analytics.totalUsers) * 100).toFixed(1) : 0}% of total`}
        />
        <AdminStatCard
          title="Active This Week"
          value={analytics.activity.activeThisWeek}
          icon={Activity}
          iconColor="text-(--warning)"
          iconBgColor="bg-(--warning)/10"
        />
        <AdminStatCard
          title="Active This Month"
          value={analytics.activity.activeThisMonth}
          icon={Activity}
          iconColor="text-(--accent)"
          iconBgColor="bg-(--accent)/10"
        />
      </div>

      {/* Growth & Retention Metrics - Row 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <AdminStatCard
          title="New This Week"
          value={analytics.registration.newThisWeek}
          icon={TrendingUp}
          iconColor="text-(--success)"
          iconBgColor="bg-(--success)/10"
          trend={{
            value: analytics.registration.weekOverWeekGrowth,
            label: "vs last week",
          }}
        />
        <AdminStatCard
          title="New This Month"
          value={analytics.registration.newThisMonth}
          icon={TrendingUp}
          iconColor="text-(--info)"
          iconBgColor="bg-(--info)/10"
          trend={{
            value: analytics.registration.monthOverMonthGrowth,
            label: "vs last month",
          }}
        />
        <AdminStatCard
          title="Inactive (30d)"
          value={analytics.activity.inactiveUsers}
          icon={UserMinus}
          iconColor="text-(--warning)"
          iconBgColor="bg-(--warning)/10"
          subValue={`${analytics.totalUsers > 0 ? ((analytics.activity.inactiveUsers / analytics.totalUsers) * 100).toFixed(1) : 0}% of total`}
        />
        <AdminStatCard
          title="Weekly Retention"
          value={`${analytics.activity.weeklyRetentionRate || 0}%`}
          icon={UserCheck}
          iconColor="text-(--primary)"
          iconBgColor="bg-(--primary)/10"
          subValue="Week-over-week"
        />
      </div>

      {/* Additional Metrics - Row 3 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <AdminStatCard
          title="Countries"
          value={analytics.geography.totalCountries}
          icon={Globe}
          iconColor="text-(--primary)"
          iconBgColor="bg-(--primary)/10"
        />
        <AdminStatCard
          title="Churned Users"
          value={analytics.activity.churnedUsers}
          icon={UserMinus}
          iconColor="text-(--error)"
          iconBgColor="bg-(--error)/10"
          subValue="Active 30-60d ago"
        />
        <AdminStatCard
          title="Avg Days Idle"
          value={analytics.activity.avgDaysSinceLogin || 0}
          icon={Clock}
          iconColor="text-(--warning)"
          iconBgColor="bg-(--warning)/10"
          subValue="Active users"
        />
        <AdminStatCard
          title="Profile Hidden"
          value={analytics.demographics?.privacySettings?.profileHidden || 0}
          icon={Shield}
          iconColor="text-(--text-muted)"
          iconBgColor="bg-(--border)/10"
        />
      </div>

      {/* Charts Grid - Row 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Weekly Registration Trend */}
        <AdminCollapsibleCard
          title="Weekly Registrations"
          storageKey="admin-users-weekly-trend"
          defaultOpen={true}
        >
          <div className="h-48 sm:h-56 mt-4">
            {weeklyChartData ? (
              <Bar data={weeklyChartData} options={barChartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-(--text-muted) text-sm">
                No registration data
              </div>
            )}
          </div>
        </AdminCollapsibleCard>

        {/* Monthly Registration Trend */}
        <AdminCollapsibleCard
          title="Monthly Registrations"
          storageKey="admin-users-monthly-trend"
          defaultOpen={true}
        >
          <div className="h-48 sm:h-56 mt-4">
            {monthlyChartData ? (
              <Bar data={monthlyChartData} options={barChartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-(--text-muted) text-sm">
                No monthly data
              </div>
            )}
          </div>
        </AdminCollapsibleCard>
      </div>

      {/* Top Countries - Row 5 */}
      <AdminCollapsibleCard
        title="Top Countries"
        storageKey="admin-users-countries"
        defaultOpen={true}
      >
        <div className="space-y-2 mt-2">
          {analytics.geography.topCountries.slice(0, 8).map((c, idx) => (
            <div key={c.country} className="flex items-center gap-3">
              <span className="text-xs text-(--text-muted) font-inter w-4">
                {idx + 1}
              </span>
              <span className="text-sm font-medium text-(--text-primary) font-inter w-8">
                {c.country}
              </span>
              <div className="flex-1 h-2 bg-(--surface-elevated) rounded-full overflow-hidden">
                <div
                  className="h-full bg-(--primary) rounded-full"
                  style={{
                    width: `${analytics.totalUsers > 0 ? (c.count / analytics.totalUsers) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="text-sm text-(--text-secondary) font-inter w-12 text-right">
                {c.count}
              </span>
            </div>
          ))}
        </div>
      </AdminCollapsibleCard>

      {/* Demographics & Preferences - Row 6 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Gender Distribution - Doughnut Chart */}
        <AdminCollapsibleCard
          title="Gender Distribution"
          storageKey="admin-users-gender"
          defaultOpen={true}
        >
          <div className="h-56 sm:h-64 mt-4">
            {genderDoughnutData ? (
              <Doughnut data={genderDoughnutData} options={doughnutOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-(--text-muted) text-sm">
                No gender data
              </div>
            )}
          </div>
        </AdminCollapsibleCard>

        {/* Privacy Settings - Grid 3 */}
        {analytics.demographics?.privacySettings && (
          <AdminCollapsibleCard
            title="Privacy Settings"
            storageKey="admin-users-privacy"
            defaultOpen={true}
          >
            <div className="grid grid-cols-3 gap-3 mt-2">
              {[
                {
                  label: "Profile Public",
                  value: analytics.demographics.privacySettings.profilePublic,
                  icon: Eye,
                },
                {
                  label: "Profile Hidden",
                  value: analytics.demographics.privacySettings.profileHidden,
                  icon: EyeOff,
                },
                {
                  label: "Stats Hidden",
                  value:
                    analytics.demographics.privacySettings.challengeStatsHidden,
                  icon: Shield,
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center gap-2 bg-(--surface-elevated) rounded-(--radius-control) p-3 border border-(--border) text-center"
                >
                  {item.icon && (
                    <item.icon className="w-4 h-4 text-(--text-muted)" />
                  )}
                  <div className="text-lg font-bold text-(--text-primary) font-statement">
                    {typeof item.value === "number"
                      ? item.value.toLocaleString()
                      : item.value}
                  </div>
                  <div className="text-[10px] text-(--text-muted) uppercase tracking-wide font-inter leading-tight">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </AdminCollapsibleCard>
        )}
      </div>

      {/* Preferences Grid - Row 7 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Theme Distribution */}
        <AdminCollapsibleCard
          title="Theme Preferences"
          storageKey="admin-users-theme"
          defaultOpen={true}
        >
          <ThemeDistributionChart
            distribution={analytics.preferences.themeDistribution}
          />
        </AdminCollapsibleCard>

        {/* Color Scheme Distribution - Doughnut Chart */}
        <AdminCollapsibleCard
          title="Color Schemes"
          storageKey="admin-users-colors"
          defaultOpen={true}
        >
          <div className="h-56 sm:h-64 mt-4">
            {colorSchemeDoughnutData ? (
              <Doughnut
                data={colorSchemeDoughnutData}
                options={doughnutOptions}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-(--text-muted) text-sm">
                No color scheme data
              </div>
            )}
          </div>
        </AdminCollapsibleCard>
      </div>

      {/* Timer Settings - Row 7 */}
      {analytics.timerSettings && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          <AdminCollapsibleCard
            title="Font Size"
            storageKey="admin-users-font-size"
            defaultOpen={true}
          >
            <CompactStatRow
              items={Object.entries(
                analytics.timerSettings.fontSizeDistribution,
              ).map(([size, count]) => ({
                label: size.toUpperCase(),
                value: count as number,
              }))}
            />
          </AdminCollapsibleCard>

          <AdminCollapsibleCard
            title="Font Family"
            storageKey="admin-users-font-family"
            defaultOpen={true}
          >
            <CompactStatRow
              gridCols={3}
              items={Object.entries(
                analytics.timerSettings.fontFamilyDistribution,
              ).map(([family, count]) => ({
                label: family.charAt(0).toUpperCase() + family.slice(1),
                value: count as number,
              }))}
            />
          </AdminCollapsibleCard>

          <AdminCollapsibleCard
            title="Update Mode"
            storageKey="admin-users-update-mode"
            defaultOpen={true}
          >
            <CompactStatRow
              gridCols={3}
              items={Object.entries(
                analytics.timerSettings.updateModeDistribution,
              ).map(([mode, count]) => ({
                label: mode.charAt(0).toUpperCase() + mode.slice(1),
                value: count as number,
              }))}
            />
          </AdminCollapsibleCard>
        </div>
      )}

      {/* Accessibility Settings - Row 8 */}
      {analytics.accessibility && (
        <AdminCollapsibleCard
          title="Accessibility Settings"
          storageKey="admin-users-accessibility"
          defaultOpen={true}
        >
          <CompactStatRow
            gridCols={3}
            items={[
              {
                label: "Reduce Motion",
                value: analytics.accessibility.reduceMotion,
              },
              {
                label: "Disable Glow",
                value: analytics.accessibility.disableGlow,
              },
              {
                label: "High Contrast",
                value: analytics.accessibility.highContrast,
              },
            ]}
          />
        </AdminCollapsibleCard>
      )}
    </div>
  );
}

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(
    null,
  );

  const users = useQuery(api.admin.getAllUsersAdmin, {
    includeDeleted,
    searchQuery: searchQuery.trim() || undefined,
  });

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTimeAgo = (ts: number) => {
    const seconds = Math.floor((Date.now() - ts) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return formatDate(ts);
  };

  const handleExportUsers = () => {
    if (!users || users.length === 0) return;

    const exportData = users.map((user) => ({
      name: user.name,
      identifier: user.wcaId,
      email: user.email || "",
      country: user.countryIso2,
      createdAt: formatDate(user.createdAt),
      lastLoginAt: formatDate(user.lastLoginAt),
      themeMode: user.themeMode || "auto",
      colorScheme: user.colorScheme || "blue",
      isDeleted: user.isDeleted ? "Yes" : "No",
    }));

    exportToCSV(exportData, "cubedev_users");
  };

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8">
      {/* Analytics Overview */}
      <AdminCollapsibleCard
        title="User Analytics"
        defaultOpen={true}
        storageKey="admin-users-analytics"
        className="mb-4 sm:mb-6"
      >
        <UserAnalyticsOverview />
      </AdminCollapsibleCard>

      {/* Filters */}
      <div className="timer-card mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <SearchInput
            size="sm"
            placeholder="Search by name, identifier, or email..."
            aria-label="Search by name, identifier, or email"
            value={searchQuery}
            onChange={setSearchQuery}
            className="flex-1"
          />

          {/* Include Deleted Toggle */}
          <label className="flex items-center gap-2 cursor-pointer shrink-0">
            <Checkbox
              checked={includeDeleted}
              onChange={(e) => setIncludeDeleted(e.target.checked)}
            />
            <span className="text-sm text-(--text-secondary) font-inter">
              Include deleted
            </span>
          </label>
        </div>
      </div>

      {/* Users List */}
      <AdminCollapsibleCard
        title={`User List${users ? ` (${users.length})` : ""}`}
        defaultOpen={true}
        storageKey="admin-users-list"
        headerExtra={
          <button
            onClick={handleExportUsers}
            disabled={!users || users.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-(--surface-elevated) hover:bg-(--border) border border-(--border) rounded-(--radius-badge) text-(--text-secondary) transition-colors font-inter disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export user list as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        }
      >
        {users === undefined ? (
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
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
        ) : users.length === 0 ? (
          <div className="py-8 text-center">
            <User className="w-12 h-12 text-(--text-muted) mx-auto mb-3" />
            <p className="text-(--text-muted) font-inter">No users found</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <Table.Scroll className="hidden md:block">
              <Table>
                <Table.Head>
                  <Table.Row>
                    <Table.HeaderCell>User</Table.HeaderCell>
                    <Table.HeaderCell>Identifier</Table.HeaderCell>
                    <Table.HeaderCell>Country</Table.HeaderCell>
                    <Table.HeaderCell>Joined</Table.HeaderCell>
                    <Table.HeaderCell>Last Active</Table.HeaderCell>
                    <Table.HeaderCell align="right">Actions</Table.HeaderCell>
                  </Table.Row>
                </Table.Head>
                <Table.Body>
                  {users.map((user) => (
                    <Table.Row
                      key={user._id}
                      className={`hover:bg-(--surface-elevated) transition-colors ${user.isDeleted ? "opacity-50" : ""}`}
                    >
                      <Table.Cell>
                        <div className="flex items-center gap-3">
                          {user.avatar ? (
                            <Image
                              src={user.avatar}
                              alt={user.name}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full object-cover border border-(--border) shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-(--primary)/10 flex items-center justify-center shrink-0">
                              <User className="w-5 h-5 text-(--primary)" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-(--text-primary) font-inter truncate">
                              {user.name}
                              {user.isDeleted && (
                                <span className="ml-2 text-xs text-(--error)">
                                  (deleted)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        {canOpenWcaProfile(user.wcaId) ? (
                          <a
                            href={`https://www.worldcubeassociation.org/persons/${user.wcaId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-(--primary) hover:underline font-inter"
                          >
                            {user.wcaId}
                          </a>
                        ) : (
                          <span className="text-sm text-(--text-secondary) font-inter">
                            {user.wcaId}
                          </span>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm text-(--text-secondary) font-inter">
                          {user.countryIso2}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm text-(--text-secondary) font-inter">
                          {formatDate(user.createdAt)}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm text-(--text-secondary) font-inter">
                          {getTimeAgo(user.lastLoginAt)}
                        </span>
                      </Table.Cell>
                      <Table.Cell align="right">
                        <button
                          onClick={() => setSelectedUserId(user._id)}
                          className="p-2 hover:bg-(--primary)/10 rounded-(--radius-control) transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4 text-(--primary)" />
                        </button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </Table.Scroll>

            {/* Mobile Card List */}
            <div className="md:hidden space-y-3">
              {users.map((user) => (
                <div
                  key={user._id}
                  className={`bg-(--surface-elevated) rounded-(--radius-control) p-3 border border-(--border) ${user.isDeleted ? "opacity-50" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    {user.avatar ? (
                      <Image
                        src={user.avatar}
                        alt={user.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover border border-(--border) shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-(--primary)/10 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-(--primary)" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-(--text-primary) font-inter truncate">
                          {user.name}
                          {user.isDeleted && (
                            <span className="ml-1 text-xs text-(--error)">
                              (deleted)
                            </span>
                          )}
                        </p>
                        <button
                          onClick={() => setSelectedUserId(user._id)}
                          className="p-1.5 hover:bg-(--primary)/10 rounded-(--radius-control) transition-colors shrink-0"
                          title="View details"
                        >
                          <Eye className="w-4 h-4 text-(--primary)" />
                        </button>
                      </div>
                      {canOpenWcaProfile(user.wcaId) ? (
                        <a
                          href={`https://www.worldcubeassociation.org/persons/${user.wcaId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-(--primary) hover:underline font-inter"
                        >
                          {user.wcaId}
                        </a>
                      ) : (
                        <p className="text-xs text-(--text-secondary) font-inter">
                          {user.wcaId}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-(--text-muted) font-inter">
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {user.countryIso2}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(user.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          {getTimeAgo(user.lastLoginAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </AdminCollapsibleCard>

      {/* User Details Modal */}
      {selectedUserId && (
        <UserDetailsModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
}
