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
import Image from "next/image";

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

// Collapsible Card Component
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

// Stat Card Component
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

// Progress Bar for analytics
function ProgressBar({
  label,
  value,
  total,
  color = "bg-[var(--primary)]",
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
        <span className="text-[var(--text-secondary)] font-inter">{label}</span>
        <span className="text-[var(--text-primary)] font-medium font-inter">
          {value.toLocaleString()} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="h-2 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
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
            className="w-full bg-[var(--primary)] rounded-t transition-all duration-500 min-h-[4px]"
            style={{
              height: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
            }}
          />
          <span className="text-[10px] text-[var(--text-muted)] font-inter truncate max-w-full">
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
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    green: "bg-green-500",
    orange: "bg-orange-500",
    cyan: "bg-cyan-500",
  };
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-2">
      {Object.entries(distribution).map(([scheme, count]) => (
        <div key={scheme} className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${colors[scheme] || "bg-gray-500"}`}
          />
          <span className="text-sm text-[var(--text-secondary)] font-inter capitalize flex-1">
            {scheme}
          </span>
          <span className="text-sm text-[var(--text-primary)] font-medium font-inter">
            {count}
          </span>
          <span className="text-xs text-[var(--text-muted)] font-inter w-12 text-right">
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
  const icons: Record<string, React.ElementType> = {
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
            className="bg-[var(--surface)] rounded-lg p-3 text-center border border-[var(--border)]"
          >
            <Icon className="w-5 h-5 mx-auto mb-1 text-[var(--text-secondary)]" />
            <div className="text-lg font-bold text-[var(--text-primary)] font-statement">
              {count}
            </div>
            <div className="text-xs text-[var(--text-muted)] capitalize font-inter">
              {mode}
            </div>
            <div className="text-xs text-[var(--text-muted)] font-inter">
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
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="timer-card max-w-lg w-full">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-[var(--surface-elevated)] rounded" />
            <div className="h-4 w-32 bg-[var(--surface-elevated)] rounded" />
            <div className="grid grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-[var(--surface-elevated)] rounded-lg"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { user, stats } = userActivity;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="timer-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.name}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover border-2 border-[var(--primary)]"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                <User className="w-6 h-6 text-[var(--primary)]" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] font-statement">
                {user.name}
              </h2>
              <div className="flex items-center gap-2">
                <a
                  href={`https://www.worldcubeassociation.org/persons/${user.wcaId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--primary)] hover:underline font-inter flex items-center gap-1"
                >
                  {user.wcaId}
                  <ExternalLink className="w-3 h-3" />
                </a>
                {user.isDeleted && (
                  <span className="px-2 py-0.5 text-xs bg-[var(--error)]/10 text-[var(--error)] rounded-full">
                    Deleted
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-lg hover:bg-[var(--surface-elevated)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-[var(--text-muted)] mb-3 font-inter uppercase tracking-wide">
              Account Information
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard
                title="Country"
                value={user.countryIso2}
                icon={Globe}
                iconColor="text-blue-500"
                iconBgColor="bg-blue-500/10"
              />
              <StatCard
                title="Joined"
                value={new Date(user.createdAt).toLocaleDateString()}
                icon={Calendar}
                iconColor="text-green-500"
                iconBgColor="bg-green-500/10"
              />
              <StatCard
                title="Last Active"
                value={new Date(user.lastLoginAt).toLocaleDateString()}
                icon={Calendar}
                iconColor="text-yellow-500"
                iconBgColor="bg-yellow-500/10"
              />
            </div>
          </div>

          {/* Email */}
          <div className="bg-[var(--surface-elevated)] rounded-xl p-4 border border-[var(--border)]">
            <div className="flex items-center gap-2 text-[var(--text-muted)] mb-2">
              <Mail className="w-4 h-4" />
              <span className="text-sm font-inter">Email</span>
            </div>
            <p className="text-sm font-medium text-[var(--text-primary)] font-inter">
              {user.email || "Not provided"}
            </p>
          </div>

          {/* Activity Stats */}
          <div>
            <h4 className="text-sm font-medium text-[var(--text-muted)] mb-3 font-inter uppercase tracking-wide">
              Activity Stats
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard
                title="Total Solves"
                value={stats.totalSolves}
                icon={Timer}
                iconColor="text-blue-500"
                iconBgColor="bg-blue-500/10"
              />
              <StatCard
                title="Sessions"
                value={stats.totalSessions}
                icon={Timer}
                iconColor="text-green-500"
                iconBgColor="bg-green-500/10"
              />
              <StatCard
                title="Challenges"
                value={stats.challengeRoomsJoined}
                icon={Trophy}
                iconColor="text-yellow-500"
                iconBgColor="bg-yellow-500/10"
              />
              <StatCard
                title="Algs Mastered"
                value={stats.algorithmsLearned}
                icon={BookOpen}
                iconColor="text-purple-500"
                iconBgColor="bg-purple-500/10"
              />
              <StatCard
                title="Algs Learning"
                value={stats.algorithmsInProgress}
                icon={BookOpen}
                iconColor="text-pink-500"
                iconBgColor="bg-pink-500/10"
              />
              <StatCard
                title="Coach Profile"
                value={stats.hasCoachProfile ? "Active" : "None"}
                icon={User}
                iconColor={
                  stats.hasCoachProfile ? "text-emerald-500" : "text-gray-500"
                }
                iconBgColor={
                  stats.hasCoachProfile ? "bg-emerald-500/10" : "bg-gray-500/10"
                }
              />
            </div>
          </div>

          {/* Settings */}
          <div className="bg-[var(--surface-elevated)] rounded-xl p-4 border border-[var(--border)]">
            <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3 font-statement">
              User Settings
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)] font-inter">
                  Theme Mode
                </span>
                <span className="text-[var(--text-primary)] font-inter capitalize">
                  {user.themeMode || "auto"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)] font-inter">
                  Color Scheme
                </span>
                <span className="text-[var(--text-primary)] font-inter capitalize">
                  {user.colorScheme || "blue"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)] font-inter">
                  Profile Hidden
                </span>
                <span className="text-[var(--text-primary)] font-inter">
                  {user.hideProfile ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)] font-inter">
                  Challenge Stats Hidden
                </span>
                <span className="text-[var(--text-primary)] font-inter">
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
            className="px-4 py-2 bg-[var(--surface-elevated)] hover:bg-[var(--border)] text-[var(--text-primary)] font-medium rounded-lg transition-colors font-inter"
          >
            Close
          </button>
        </div>
      </div>
    </div>
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
      <div className="flex h-3 rounded-full overflow-hidden bg-[var(--surface)]">
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
            <span className="text-xs text-[var(--text-secondary)] font-inter">
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
    icon?: React.ElementType;
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
          className="flex items-center gap-2 bg-[var(--surface-elevated)] rounded-lg p-2.5 border border-[var(--border)]"
        >
          {item.icon && (
            <item.icon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          )}
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide truncate font-inter">
              {item.label}
            </div>
            <div className="text-sm font-semibold text-[var(--text-primary)] font-statement">
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
  const primaryColor = usePrimaryColor();
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
          title="Total Users"
          value={analytics.totalUsers}
          icon={Users}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-500/10"
        />
        <StatCard
          title="Active Today"
          value={analytics.activity.activeToday}
          icon={Activity}
          iconColor="text-green-500"
          iconBgColor="bg-green-500/10"
          subValue={`${analytics.totalUsers > 0 ? ((analytics.activity.activeToday / analytics.totalUsers) * 100).toFixed(1) : 0}% of total`}
        />
        <StatCard
          title="Active This Week"
          value={analytics.activity.activeThisWeek}
          icon={Activity}
          iconColor="text-yellow-500"
          iconBgColor="bg-yellow-500/10"
        />
        <StatCard
          title="Active This Month"
          value={analytics.activity.activeThisMonth}
          icon={Activity}
          iconColor="text-purple-500"
          iconBgColor="bg-purple-500/10"
        />
      </div>

      {/* Growth & Retention Metrics - Row 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          title="New This Week"
          value={analytics.registration.newThisWeek}
          icon={TrendingUp}
          iconColor="text-green-500"
          iconBgColor="bg-green-500/10"
          trend={{
            value: analytics.registration.weekOverWeekGrowth,
            label: "vs last week",
          }}
        />
        <StatCard
          title="New This Month"
          value={analytics.registration.newThisMonth}
          icon={TrendingUp}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-500/10"
          trend={{
            value: analytics.registration.monthOverMonthGrowth,
            label: "vs last month",
          }}
        />
        <StatCard
          title="Inactive (30d)"
          value={analytics.activity.inactiveUsers}
          icon={UserMinus}
          iconColor="text-orange-500"
          iconBgColor="bg-orange-500/10"
          subValue={`${analytics.totalUsers > 0 ? ((analytics.activity.inactiveUsers / analytics.totalUsers) * 100).toFixed(1) : 0}% of total`}
        />
        <StatCard
          title="Weekly Retention"
          value={`${analytics.activity.weeklyRetentionRate || 0}%`}
          icon={UserCheck}
          iconColor="text-cyan-500"
          iconBgColor="bg-cyan-500/10"
          subValue="Week-over-week"
        />
      </div>

      {/* Additional Metrics - Row 3 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          title="Countries"
          value={analytics.geography.totalCountries}
          icon={Globe}
          iconColor="text-cyan-500"
          iconBgColor="bg-cyan-500/10"
        />
        <StatCard
          title="Churned Users"
          value={analytics.activity.churnedUsers}
          icon={UserMinus}
          iconColor="text-red-500"
          iconBgColor="bg-red-500/10"
          subValue="Active 30-60d ago"
        />
        <StatCard
          title="Avg Days Idle"
          value={analytics.activity.avgDaysSinceLogin || 0}
          icon={Clock}
          iconColor="text-amber-500"
          iconBgColor="bg-amber-500/10"
          subValue="Active users"
        />
        <StatCard
          title="Profile Hidden"
          value={analytics.demographics?.privacySettings?.profileHidden || 0}
          icon={Shield}
          iconColor="text-gray-500"
          iconBgColor="bg-gray-500/10"
        />
      </div>

      {/* Charts Grid - Row 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Weekly Registration Trend */}
        <CollapsibleCard
          title="Weekly Registrations"
          storageKey="admin-users-weekly-trend"
          defaultOpen={true}
        >
          <div className="h-48 sm:h-56 mt-4">
            {weeklyChartData ? (
              <Bar data={weeklyChartData} options={barChartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">
                No registration data
              </div>
            )}
          </div>
        </CollapsibleCard>

        {/* Monthly Registration Trend */}
        <CollapsibleCard
          title="Monthly Registrations"
          storageKey="admin-users-monthly-trend"
          defaultOpen={true}
        >
          <div className="h-48 sm:h-56 mt-4">
            {monthlyChartData ? (
              <Bar data={monthlyChartData} options={barChartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">
                No monthly data
              </div>
            )}
          </div>
        </CollapsibleCard>
      </div>

      {/* Top Countries - Row 5 */}
      <CollapsibleCard
        title="Top Countries"
        storageKey="admin-users-countries"
        defaultOpen={true}
      >
        <div className="space-y-2 mt-2">
          {analytics.geography.topCountries.slice(0, 8).map((c, idx) => (
            <div key={c.country} className="flex items-center gap-3">
              <span className="text-xs text-[var(--text-muted)] font-inter w-4">
                {idx + 1}
              </span>
              <span className="text-sm font-medium text-[var(--text-primary)] font-inter w-8">
                {c.country}
              </span>
              <div className="flex-1 h-2 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--primary)] rounded-full"
                  style={{
                    width: `${analytics.totalUsers > 0 ? (c.count / analytics.totalUsers) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="text-sm text-[var(--text-secondary)] font-inter w-12 text-right">
                {c.count}
              </span>
            </div>
          ))}
        </div>
      </CollapsibleCard>

      {/* Demographics & Preferences - Row 6 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Gender Distribution - Doughnut Chart */}
        <CollapsibleCard
          title="Gender Distribution"
          storageKey="admin-users-gender"
          defaultOpen={true}
        >
          <div className="h-56 sm:h-64 mt-4">
            {genderDoughnutData ? (
              <Doughnut data={genderDoughnutData} options={doughnutOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">
                No gender data
              </div>
            )}
          </div>
        </CollapsibleCard>

        {/* Privacy Settings - Grid 3 */}
        {analytics.demographics?.privacySettings && (
          <CollapsibleCard
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
                  className="flex flex-col items-center gap-2 bg-[var(--surface-elevated)] rounded-lg p-3 border border-[var(--border)] text-center"
                >
                  {item.icon && (
                    <item.icon className="w-4 h-4 text-[var(--text-muted)]" />
                  )}
                  <div className="text-lg font-bold text-[var(--text-primary)] font-statement">
                    {typeof item.value === "number"
                      ? item.value.toLocaleString()
                      : item.value}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide font-inter leading-tight">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleCard>
        )}
      </div>

      {/* Preferences Grid - Row 7 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Theme Distribution */}
        <CollapsibleCard
          title="Theme Preferences"
          storageKey="admin-users-theme"
          defaultOpen={true}
        >
          <ThemeDistributionChart
            distribution={analytics.preferences.themeDistribution}
          />
        </CollapsibleCard>

        {/* Color Scheme Distribution - Doughnut Chart */}
        <CollapsibleCard
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
              <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">
                No color scheme data
              </div>
            )}
          </div>
        </CollapsibleCard>
      </div>

      {/* Timer Settings - Row 7 */}
      {analytics.timerSettings && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          <CollapsibleCard
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
          </CollapsibleCard>

          <CollapsibleCard
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
          </CollapsibleCard>

          <CollapsibleCard
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
          </CollapsibleCard>
        </div>
      )}

      {/* Accessibility Settings - Row 8 */}
      {analytics.accessibility && (
        <CollapsibleCard
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
        </CollapsibleCard>
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
      wcaId: user.wcaId,
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
      <CollapsibleCard
        title="User Analytics"
        defaultOpen={true}
        storageKey="admin-users-analytics"
        className="mb-4 sm:mb-6"
      >
        <UserAnalyticsOverview />
      </CollapsibleCard>

      {/* Filters */}
      <div className="timer-card mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search by name, WCA ID, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent font-inter text-sm transition-all"
            />
          </div>

          {/* Include Deleted Toggle */}
          <label className="flex items-center gap-2 cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => setIncludeDeleted(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--primary)] focus:ring-[var(--primary)]"
            />
            <span className="text-sm text-[var(--text-secondary)] font-inter">
              Include deleted
            </span>
          </label>
        </div>
      </div>

      {/* Users List */}
      <CollapsibleCard
        title={`User List${users ? ` (${users.length})` : ""}`}
        defaultOpen={true}
        storageKey="admin-users-list"
        headerExtra={
          <button
            onClick={handleExportUsers}
            disabled={!users || users.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[var(--surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] rounded-md text-[var(--text-secondary)] transition-colors font-inter disabled:opacity-50 disabled:cursor-not-allowed"
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
        ) : users.length === 0 ? (
          <div className="py-8 text-center">
            <User className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-[var(--text-muted)] font-inter">
              No users found
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
                      WCA ID
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-muted)] font-inter uppercase tracking-wider">
                      Country
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-muted)] font-inter uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-muted)] font-inter uppercase tracking-wider">
                      Last Active
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--text-muted)] font-inter uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {users.map((user) => (
                    <tr
                      key={user._id}
                      className={`hover:bg-[var(--surface-elevated)] transition-colors ${user.isDeleted ? "opacity-50" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {user.avatar ? (
                            <Image
                              src={user.avatar}
                              alt={user.name}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full object-cover border border-[var(--border)] shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
                              <User className="w-5 h-5 text-[var(--primary)]" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[var(--text-primary)] font-inter truncate">
                              {user.name}
                              {user.isDeleted && (
                                <span className="ml-2 text-xs text-[var(--error)]">
                                  (deleted)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`https://www.worldcubeassociation.org/persons/${user.wcaId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[var(--primary)] hover:underline font-inter"
                        >
                          {user.wcaId}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[var(--text-secondary)] font-inter">
                          {user.countryIso2}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[var(--text-secondary)] font-inter">
                          {formatDate(user.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[var(--text-secondary)] font-inter">
                          {getTimeAgo(user.lastLoginAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedUserId(user._id)}
                          className="p-2 hover:bg-[var(--primary)]/10 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4 text-[var(--primary)]" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden space-y-3">
              {users.map((user) => (
                <div
                  key={user._id}
                  className={`bg-[var(--surface-elevated)] rounded-lg p-3 border border-[var(--border)] ${user.isDeleted ? "opacity-50" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    {user.avatar ? (
                      <Image
                        src={user.avatar}
                        alt={user.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover border border-[var(--border)] shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-[var(--primary)]" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-[var(--text-primary)] font-inter truncate">
                          {user.name}
                          {user.isDeleted && (
                            <span className="ml-1 text-xs text-[var(--error)]">
                              (deleted)
                            </span>
                          )}
                        </p>
                        <button
                          onClick={() => setSelectedUserId(user._id)}
                          className="p-1.5 hover:bg-[var(--primary)]/10 rounded-lg transition-colors shrink-0"
                          title="View details"
                        >
                          <Eye className="w-4 h-4 text-[var(--primary)]" />
                        </button>
                      </div>
                      <a
                        href={`https://www.worldcubeassociation.org/persons/${user.wcaId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[var(--primary)] hover:underline font-inter"
                      >
                        {user.wcaId}
                      </a>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-[var(--text-muted)] font-inter">
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
      </CollapsibleCard>

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
