"use client";

import { useState, useEffect, useMemo } from "react";
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
  Timer,
  Users,
  Trophy,
  Clock,
  Target,
  Download,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Layers,
  X,
  ExternalLink,
  Award,
  AlertCircle,
  LucideIcon,
  FileJson,
} from "lucide-react";
import { EventIcon } from "@/components/ui/EventIcon";
import { SelectMenu } from "@/components/ui/Menu";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { AdminStatCard } from "./AdminStatCard";
import { AdminCollapsibleCard } from "./AdminCollapsibleCard";
import { useEffectiveTheme, useThemeColors } from "@/lib/hooks/useThemeColors";
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

import { StatCardSkeleton, CollapsibleCardSkeleton } from "./AdminSkeletons";

// WCA Event names mapping
const WCA_EVENTS: Record<string, string> = {
  "333": "3x3",
  "222": "2x2",
  "444": "4x4",
  "555": "5x5",
  "666": "6x6",
  "777": "7x7",
  "333oh": "3x3 OH",
  "333bf": "3x3 BLD",
  "444bf": "4x4 BLD",
  "555bf": "5x5 BLD",
  "333mbf": "Multi-BLD",
  "333fm": "FMC",
  sq1: "Square-1",
  clock: "Clock",
  pyram: "Pyraminx",
  skewb: "Skewb",
  minx: "Megaminx",
};

// Export utilities
function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers.map((h) => JSON.stringify(row[h] ?? "")).join(","),
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
}

function exportToJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.json`;
  link.click();
}

// Distribution Bar Component
function DistributionBar({
  items,
  total,
}: {
  items: Array<{ label: string; value: number; color: string }>;
  total: number;
}) {
  if (total === 0) {
    return <EmptyState title="No data available" icon={<BarChart3 />} />;
  }

  return (
    <div className="space-y-4">
      <div className="h-3 bg-(--surface-elevated) rounded-full overflow-hidden flex">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="h-full transition-all"
            style={{
              width: total > 0 ? `${(item.value / total) * 100}%` : "0%",
              backgroundColor: item.color,
            }}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-(--text-muted) font-inter truncate">
              {item.label}: {item.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// User Card Component for leaderboards
function UserCard({
  rank,
  name,
  wcaId,
  value,
  valueLabel,
}: {
  rank: number;
  name: string;
  wcaId?: string;
  value: string | number;
  valueLabel: string;
}) {
  const rankColors =
    rank === 1
      ? "bg-(--warning)/10 text-(--warning) border-(--warning)/30"
      : rank === 2
        ? "bg-(--border)/10 text-(--text-muted) border-(--border)/30"
        : rank === 3
          ? "bg-(--warning)/10 text-(--warning) border-(--warning)/30"
          : "bg-(--surface-elevated) text-(--text-muted) border-(--border)";

  return (
    <div
      className={`flex items-center gap-3 p-2.5 rounded-(--radius-control) border ${rankColors}`}
    >
      <div
        className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
          rank <= 3 ? "" : "bg-(--surface) border border-(--border)"
        }`}
      >
        {rank}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-(--text-primary) font-inter truncate">
            {name}
          </span>
          {wcaId && canOpenWcaProfile(wcaId) && (
            <a
              href={`https://www.worldcubeassociation.org/persons/${wcaId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-(--primary) hover:text-(--primary-hover) shrink-0"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        <span className="text-xs text-(--text-muted) font-inter">
          {valueLabel}
        </span>
      </div>
      <div className="text-sm font-bold text-(--text-primary) font-statement shrink-0">
        {value}
      </div>
    </div>
  );
}

// Event Selector Dropdown
function EventFilterSelector({
  selectedEvent,
  onEventChange,
  events,
}: {
  selectedEvent: string;
  onEventChange: (event: string) => void;
  events: Array<{ event: string; eventName: string; count: number }>;
}) {
  return (
    <SelectMenu
      label="Event"
      value={selectedEvent}
      onChange={onEventChange}
      fullWidth={false}
      searchable={events.length > 8}
      options={events.map((event) => ({
        value: event.event,
        label: event.eventName,
        textLabel: event.eventName,
        icon: (
          <EventIcon eventId={event.event} size="sm" alt={event.eventName} />
        ),
        description: `${event.count.toLocaleString()} solves`,
      }))}
    />
  );
}

// Event Category Modal
function EventCategoryModal({
  event,
  eventName,
  categories,
  onClose,
}: {
  event: string;
  eventName: string;
  categories: Array<{
    category: string;
    count: number;
    users: string[];
  }>;
  onClose: () => void;
}) {
  return (
    <Modal open onClose={onClose} size="md" mobile="fullscreen">
      <Modal.Body>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-(--text-primary) font-statement">
            {eventName} Categories
          </h2>
          <button
            onClick={onClose}
            className="text-(--text-muted) hover:text-(--text-primary) transition-colors p-1 rounded-(--radius-control) hover:bg-(--surface-elevated)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {categories.length === 0 ? (
          <EmptyState
            title="No category data"
            description="No users have recorded averages for this event yet."
            icon={<Users />}
          />
        ) : (
          <div className="space-y-3">
            {categories.map((cat) => (
              <div
                key={cat.category}
                className="bg-(--surface-elevated) rounded-(--radius-control) p-3 border border-(--border)"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-(--text-primary) font-statement">
                    {cat.category}
                  </span>
                  <span className="text-sm font-bold text-(--primary) font-statement">
                    {cat.count} {cat.count === 1 ? "user" : "users"}
                  </span>
                </div>
                {cat.users.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {cat.users.map((user, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-xs bg-(--surface) text-(--text-secondary) rounded font-inter"
                      >
                        {user}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
}

// Main component
export default function AdminTimerStats() {
  const [selectedFilterEvent, setSelectedFilterEvent] = useState("333");
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const {
    data: analytics,
    isFetching: analyticsFetching,
    refetch: refetchAnalytics,
  } = useCachedQuery(
    api.adminTimers.getTimerAnalytics,
    {},
    {
      cacheKey: ADMIN_CACHE_KEYS.timerAnalytics,
      ttl: ADMIN_CACHE_TTLS.timer,
    },
  );
  const filteredAnalytics = useQuery(
    api.adminTimers.getFilteredTimerAnalytics,
    {
      event: selectedFilterEvent,
    },
  );
  const { data: exportData } = useCachedQuery(
    api.adminTimers.exportTimerData,
    {},
    {
      cacheKey: ADMIN_CACHE_KEYS.timerExportData,
      ttl: ADMIN_CACHE_TTLS.timer,
    },
  );
  const eventCategories = useQuery(
    api.adminTimers.getEventCategoryBreakdown,
    showCategoryModal ? { event: selectedFilterEvent } : "skip",
  );

  const effectiveTheme = useEffectiveTheme();
  const primaryColor = useThemeColors()["--primary"];
  const isLight = effectiveTheme === "light";
  const textColor = isLight
    ? "rgba(17, 24, 39, 0.8)"
    : "rgba(255, 255, 255, 0.8)";
  const gridColor = isLight ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)";

  // Export handlers
  const handleExportJSON = () => {
    if (exportData) {
      exportToJSON(exportData, "timer_data_export");
    }
  };

  const handleExportSolvesCSV = () => {
    if (exportData?.solves) {
      exportToCSV(
        exportData.solves as Record<string, unknown>[],
        "timer_solves",
      );
    }
  };

  const handleExportSessionsCSV = () => {
    if (exportData?.sessions) {
      exportToCSV(
        exportData.sessions as Record<string, unknown>[],
        "timer_sessions",
      );
    }
  };

  const handleExportStatsCSV = () => {
    if (exportData?.userStats) {
      exportToCSV(
        exportData.userStats as Record<string, unknown>[],
        "timer_user_stats",
      );
    }
  };

  // Chart data and options
  const dailyChartData = useMemo(() => {
    if (!analytics?.dailyTrend || analytics.dailyTrend.length === 0)
      return null;

    const recentDays = analytics.dailyTrend.slice(-14);

    return {
      labels: recentDays.map((d) => {
        const date = new Date(d.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }),
      datasets: [
        {
          label: "Solves",
          data: recentDays.map((d) => d.count),
          backgroundColor: primaryColor,
          borderColor: primaryColor,
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [analytics, primaryColor]);

  const chartOptions = useMemo(
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

  const weeklyChartData = useMemo(() => {
    if (!analytics?.weeklyTrend || analytics.weeklyTrend.length === 0)
      return null;

    return {
      labels: analytics.weeklyTrend.map((w) => w.week),
      datasets: [
        {
          label: "Solves",
          data: analytics.weeklyTrend.map((w) => w.count),
          backgroundColor: primaryColor,
          borderColor: primaryColor,
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [analytics, primaryColor]);

  const eventDoughnutData = useMemo(() => {
    if (
      !analytics?.eventDistribution ||
      analytics.eventDistribution.length === 0
    )
      return null;

    const topEvents = analytics.eventDistribution.slice(0, 8);
    const colors = [
      "rgba(59, 130, 246, 0.8)",
      "rgba(168, 85, 247, 0.8)",
      "rgba(34, 197, 94, 0.8)",
      "rgba(249, 115, 22, 0.8)",
      "rgba(236, 72, 153, 0.8)",
      "rgba(14, 165, 233, 0.8)",
      "rgba(234, 179, 8, 0.8)",
      "rgba(107, 114, 128, 0.8)",
    ];

    return {
      labels: topEvents.map((e) => e.eventName),
      datasets: [
        {
          data: topEvents.map((e) => e.count),
          backgroundColor: colors.slice(0, topEvents.length),
          borderColor: isLight ? "rgba(255,255,255,1)" : "rgba(30,30,30,1)",
          borderWidth: 2,
        },
      ],
    };
  }, [analytics, isLight]);

  const categoriesDoughnutData = useMemo(() => {
    if (
      !filteredAnalytics?.userCategories ||
      filteredAnalytics.userCategories.length === 0
    )
      return null;

    const colors = [
      "rgba(239, 68, 68, 0.8)",
      "rgba(249, 115, 22, 0.8)",
      "rgba(234, 179, 8, 0.8)",
      "rgba(34, 197, 94, 0.8)",
      "rgba(14, 165, 233, 0.8)",
      "rgba(59, 130, 246, 0.8)",
      "rgba(168, 85, 247, 0.8)",
    ];

    return {
      labels: filteredAnalytics.userCategories.map((c) => c.category),
      datasets: [
        {
          data: filteredAnalytics.userCategories.map((c) => c.count),
          backgroundColor: colors.slice(
            0,
            filteredAnalytics.userCategories.length,
          ),
          borderColor: isLight ? "rgba(255,255,255,1)" : "rgba(30,30,30,1)",
          borderWidth: 2,
        },
      ],
    };
  }, [filteredAnalytics, isLight]);

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

  // Loading state
  if (!analytics) {
    return (
      <div className="min-h-full p-4 sm:p-6 lg:p-8">
        <div className="space-y-4 sm:space-y-6">
          {/* Header skeleton */}
          <div className="timer-card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center justify-center sm:justify-start gap-3 w-full sm:w-auto">
                <div className="h-4 w-12 bg-(--surface-elevated) rounded animate-pulse" />
                <div className="h-10 w-28 bg-(--surface-elevated) rounded-(--radius-control) animate-pulse" />
              </div>
              <div className="grid grid-cols-4 sm:flex gap-2 w-full sm:w-auto">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-10 w-full sm:w-20 bg-(--surface-elevated) rounded-(--radius-control) animate-pulse"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Stats row 1 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>

          {/* Stats row 2 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CollapsibleCardSkeleton height="h-56" />
            <CollapsibleCardSkeleton height="h-56" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CollapsibleCardSkeleton height="h-64" />
            <CollapsibleCardSkeleton height="h-64" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8">
      <div className="space-y-4 sm:space-y-6">
        {/* Header with Export and Event Filter */}
        <div className="timer-card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center justify-center sm:justify-start gap-3 w-full sm:w-auto">
              <span className="text-sm text-(--text-secondary) font-inter">
                Event:
              </span>
              <EventFilterSelector
                selectedEvent={selectedFilterEvent}
                onEventChange={setSelectedFilterEvent}
                events={analytics.eventDistribution}
              />
            </div>

            <div className="grid grid-cols-4 sm:flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleExportJSON}
                disabled={!exportData}
                className="flex items-center justify-center gap-2 px-3 py-2 sm:py-1.5 text-sm bg-(--surface-elevated) hover:bg-(--border) border border-(--border) rounded-(--radius-control) text-(--text-secondary) transition-colors font-inter disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export JSON"
              >
                <FileJson className="w-4 h-4" />
                <span className="hidden sm:inline">JSON</span>
              </button>
              <button
                onClick={handleExportSolvesCSV}
                disabled={!exportData}
                className="flex items-center justify-center gap-2 px-3 py-2 sm:py-1.5 text-sm bg-(--surface-elevated) hover:bg-(--border) border border-(--border) rounded-(--radius-control) text-(--text-secondary) transition-colors font-inter disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export Solves"
              >
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">Solves</span>
              </button>
              <button
                onClick={handleExportSessionsCSV}
                disabled={!exportData}
                className="flex items-center justify-center gap-2 px-3 py-2 sm:py-1.5 text-sm bg-(--surface-elevated) hover:bg-(--border) border border-(--border) rounded-(--radius-control) text-(--text-secondary) transition-colors font-inter disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export Sessions"
              >
                <Layers className="w-4 h-4" />
                <span className="hidden sm:inline">Sessions</span>
              </button>
              <button
                onClick={handleExportStatsCSV}
                disabled={!exportData}
                className="flex items-center justify-center gap-2 px-3 py-2 sm:py-1.5 text-sm bg-(--surface-elevated) hover:bg-(--border) border border-(--border) rounded-(--radius-control) text-(--text-secondary) transition-colors font-inter disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export Stats"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Stats</span>
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics - Row 1: Global Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <AdminStatCard
            title="Total Solves"
            value={analytics.totalSolves}
            icon={Timer}
            iconColor="text-(--info)"
            iconBgColor="bg-(--info)/10"
            subValue={`${analytics.todaySolves} today`}
          />
          <AdminStatCard
            title="Total Sessions"
            value={analytics.totalSessions}
            icon={Layers}
            iconColor="text-(--accent)"
            iconBgColor="bg-(--accent)/10"
            subValue={`${analytics.activeSessions} active`}
          />
          <AdminStatCard
            title="Active Users"
            value={analytics.totalUsers}
            icon={Users}
            iconColor="text-(--success)"
            iconBgColor="bg-(--success)/10"
            subValue={`${analytics.totalActiveUsers} this month`}
          />
          <AdminStatCard
            title="Avg/Session"
            value={analytics.avgSolvesPerSession}
            icon={BarChart3}
            iconColor="text-(--warning)"
            iconBgColor="bg-(--warning)/10"
            subValue="solves per session"
          />
        </div>

        {/* Key Metrics - Row 2: Event-Filtered Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <AdminStatCard
            title={`Best Single (${filteredAnalytics?.eventName || selectedFilterEvent})`}
            value={filteredAnalytics?.bestOverallSingle || "N/A"}
            icon={Trophy}
            iconColor="text-(--warning)"
            iconBgColor="bg-(--warning)/10"
          />
          <AdminStatCard
            title={`Best Ao5 (${filteredAnalytics?.eventName || selectedFilterEvent})`}
            value={filteredAnalytics?.bestOverallAo5 || "N/A"}
            icon={Award}
            iconColor="text-(--primary)"
            iconBgColor="bg-(--primary)/10"
          />
          <AdminStatCard
            title="Median Single"
            value={filteredAnalytics?.medianSingle || "N/A"}
            icon={Target}
            iconColor="text-(--accent)"
            iconBgColor="bg-(--accent)/10"
            subValue={`${filteredAnalytics?.eventName || selectedFilterEvent} across users`}
          />
          <AdminStatCard
            title="Split Usage"
            value={`${analytics.splitUsageRate}%`}
            icon={Activity}
            iconColor="text-(--accent)"
            iconBgColor="bg-(--accent)/10"
            subValue="solves with splits"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <AdminCollapsibleCard
            title="Daily Solve Activity"
            storageKey="admin-timer-daily"
            defaultOpen={true}
          >
            <div className="h-48 sm:h-56 mt-4">
              {dailyChartData ? (
                <Bar data={dailyChartData} options={chartOptions} />
              ) : (
                <EmptyState
                  title="No activity data"
                  description="No solves recorded in the last 14 days"
                  icon={<BarChart3 />}
                />
              )}
            </div>
          </AdminCollapsibleCard>

          <AdminCollapsibleCard
            title="Weekly Trend"
            storageKey="admin-timer-weekly"
            defaultOpen={true}
          >
            <div className="h-48 sm:h-56 mt-4">
              {weeklyChartData ? (
                <Bar data={weeklyChartData} options={chartOptions} />
              ) : (
                <EmptyState
                  title="No activity data"
                  description="No solves recorded in the last 8 weeks"
                  icon={<TrendingUp />}
                />
              )}
            </div>
          </AdminCollapsibleCard>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <AdminCollapsibleCard
            title="Event Distribution"
            storageKey="admin-timer-events"
            defaultOpen={true}
          >
            <div className="h-56 sm:h-64 mt-4">
              {eventDoughnutData ? (
                <Doughnut data={eventDoughnutData} options={doughnutOptions} />
              ) : (
                <EmptyState
                  title="No event data"
                  description="No solves recorded yet"
                  icon={<Layers />}
                />
              )}
            </div>
          </AdminCollapsibleCard>

          <AdminCollapsibleCard
            title={`${filteredAnalytics?.eventName || selectedFilterEvent} User Distribution`}
            storageKey="admin-timer-categories"
            defaultOpen={true}
            headerExtra={
              <button
                onClick={() => setShowCategoryModal(true)}
                className="text-xs text-(--primary) hover:underline font-inter"
              >
                View Details
              </button>
            }
          >
            <div className="h-56 sm:h-64 mt-4">
              {categoriesDoughnutData ? (
                <Doughnut
                  data={categoriesDoughnutData}
                  options={doughnutOptions}
                />
              ) : (
                <EmptyState
                  title="No category data"
                  description={`No users have recorded averages for ${filteredAnalytics?.eventName || selectedFilterEvent} yet`}
                  icon={<Users />}
                />
              )}
            </div>
          </AdminCollapsibleCard>
        </div>

        {/* Penalty & Timer Mode Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <AdminCollapsibleCard
            title="Penalty Distribution"
            storageKey="admin-timer-penalties"
            defaultOpen={true}
          >
            <div className="space-y-4 mt-4">
              <DistributionBar
                items={[
                  {
                    label: "Clean",
                    value: analytics.cleanSolves,
                    color: "var(--success, #22c55e)",
                  },
                  {
                    label: "+2",
                    value: analytics.plusTwoCount,
                    color: "var(--warning, #f59e0b)",
                  },
                  {
                    label: "DNF",
                    value: analytics.dnfCount,
                    color: "var(--error, #ef4444)",
                  },
                ]}
                total={analytics.totalSolves}
              />
              {analytics.totalSolves > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="text-center bg-(--surface-elevated) rounded-(--radius-control) py-2 px-1 border border-(--border)">
                    <div className="text-sm sm:text-lg font-bold text-(--success) font-statement">
                      {100 - analytics.dnfRate - analytics.plusTwoRate}%
                    </div>
                    <div className="text-[10px] text-(--text-muted) font-inter">
                      Clean Rate
                    </div>
                  </div>
                  <div className="text-center bg-(--surface-elevated) rounded-(--radius-control) py-2 px-1 border border-(--border)">
                    <div className="text-sm sm:text-lg font-bold text-(--warning) font-statement">
                      {analytics.plusTwoRate}%
                    </div>
                    <div className="text-[10px] text-(--text-muted) font-inter">
                      +2 Rate
                    </div>
                  </div>
                  <div className="text-center bg-(--surface-elevated) rounded-(--radius-control) py-2 px-1 border border-(--border)">
                    <div className="text-sm sm:text-lg font-bold text-(--error) font-statement">
                      {analytics.dnfRate}%
                    </div>
                    <div className="text-[10px] text-(--text-muted) font-inter">
                      DNF Rate
                    </div>
                  </div>
                </div>
              )}
            </div>
          </AdminCollapsibleCard>

          <AdminCollapsibleCard
            title="Timer Mode Usage"
            storageKey="admin-timer-modes"
            defaultOpen={true}
          >
            <div className="space-y-4 mt-4">
              <DistributionBar
                items={[
                  {
                    label: "Normal",
                    value: analytics.timerModeDistribution.normal,
                    color: "rgba(59, 130, 246, 0.8)",
                  },
                  {
                    label: "Manual",
                    value: analytics.timerModeDistribution.manual,
                    color: "rgba(168, 85, 247, 0.8)",
                  },
                  {
                    label: "Stackmat",
                    value: analytics.timerModeDistribution.stackmat,
                    color: "rgba(34, 197, 94, 0.8)",
                  },
                ]}
                total={analytics.totalSolves}
              />
              {analytics.totalSolves > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="text-center bg-(--surface-elevated) rounded-(--radius-control) py-2 px-1 border border-(--border)">
                    <div className="text-sm sm:text-lg font-bold text-(--info) font-statement">
                      {analytics.timerModeDistribution.normal.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-(--text-muted) font-inter">
                      Normal
                    </div>
                  </div>
                  <div className="text-center bg-(--surface-elevated) rounded-(--radius-control) py-2 px-1 border border-(--border)">
                    <div className="text-sm sm:text-lg font-bold text-(--accent) font-statement">
                      {analytics.timerModeDistribution.manual.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-(--text-muted) font-inter">
                      Manual
                    </div>
                  </div>
                  <div className="text-center bg-(--surface-elevated) rounded-(--radius-control) py-2 px-1 border border-(--border)">
                    <div className="text-sm sm:text-lg font-bold text-(--success) font-statement">
                      {analytics.timerModeDistribution.stackmat.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-(--text-muted) font-inter">
                      Stackmat
                    </div>
                  </div>
                </div>
              )}
            </div>
          </AdminCollapsibleCard>
        </div>

        {/* Session Statistics */}
        <AdminCollapsibleCard
          title="Session Statistics"
          storageKey="admin-timer-sessions"
          defaultOpen={true}
        >
          {analytics.totalSessions > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
              {Object.entries(analytics.sessionSizes).map(([range, count]) => (
                <div
                  key={range}
                  className="text-center bg-(--surface-elevated) rounded-(--radius-control) py-3 px-2 border border-(--border)"
                >
                  <div className="text-lg sm:text-xl font-bold text-(--text-primary) font-statement">
                    {count}
                  </div>
                  <div className="text-xs text-(--text-muted) font-inter">
                    {range} solves
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No sessions yet"
              description="Sessions will appear here once users start practicing"
              icon={<Layers />}
            />
          )}
        </AdminCollapsibleCard>

        {/* Leaderboards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <AdminCollapsibleCard
            title={`Top Performers (${filteredAnalytics?.eventName || selectedFilterEvent})`}
            storageKey="admin-timer-top"
            defaultOpen={true}
          >
            <div className="space-y-2 mt-4">
              {filteredAnalytics?.topPerformers &&
              filteredAnalytics.topPerformers.length > 0 ? (
                filteredAnalytics.topPerformers.map((user, idx) => (
                  <UserCard
                    key={user.userId}
                    rank={idx + 1}
                    name={user.name}
                    value={user.averageFormatted}
                    valueLabel={`Avg: ${user.category}`}
                  />
                ))
              ) : (
                <EmptyState
                  title="No performance data"
                  description={`No users have recorded averages for ${filteredAnalytics?.eventName || selectedFilterEvent} yet`}
                  icon={<Trophy />}
                />
              )}
            </div>
          </AdminCollapsibleCard>

          <AdminCollapsibleCard
            title="Most Active Users"
            storageKey="admin-timer-active"
            defaultOpen={true}
          >
            <div className="space-y-2 mt-4">
              {analytics.mostActiveUsers.length > 0 ? (
                analytics.mostActiveUsers.map((user, idx) => (
                  <UserCard
                    key={user.userId}
                    rank={idx + 1}
                    name={user.name}
                    wcaId={user.wcaId}
                    value={user.solveCount.toLocaleString()}
                    valueLabel="total solves"
                  />
                ))
              ) : (
                <EmptyState
                  title="No activity data"
                  description="No users have recorded solves yet"
                  icon={<Activity />}
                />
              )}
            </div>
          </AdminCollapsibleCard>
        </div>

        {/* Event Best Times */}
        <AdminCollapsibleCard
          title="Event Best Times"
          storageKey="admin-timer-event-bests"
          defaultOpen={false}
        >
          {analytics.eventBestTimes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
              {analytics.eventBestTimes.map((event) => (
                <button
                  key={event.event}
                  onClick={() => {
                    setSelectedFilterEvent(event.event);
                    setShowCategoryModal(true);
                  }}
                  className="text-left bg-(--surface-elevated) rounded-(--radius-control) p-3 border border-(--border) hover:border-(--primary) transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-(--text-primary) font-statement">
                      {event.eventName}
                    </span>
                    <span className="text-xs text-(--text-muted) font-inter">
                      {event.userCount} users
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-(--text-muted) font-inter">
                        Best Single
                      </div>
                      <div className="text-sm font-bold text-(--primary) font-statement">
                        {event.bestSingle
                          ? formatTimeDisplay(event.bestSingle)
                          : "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-(--text-muted) font-inter">
                        Best Ao5
                      </div>
                      <div className="text-sm font-bold text-(--text-secondary) font-statement">
                        {event.bestAo5
                          ? formatTimeDisplay(event.bestAo5)
                          : "N/A"}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No event data"
              description="No best times recorded yet"
              icon={<Clock />}
            />
          )}
        </AdminCollapsibleCard>

        {/* Time Period Summary */}
        <AdminCollapsibleCard
          title="Time Period Summary"
          storageKey="admin-timer-periods"
          defaultOpen={false}
        >
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="text-center bg-(--surface-elevated) rounded-(--radius-control) py-4 px-2 border border-(--border)">
              <div className="text-xl sm:text-2xl font-bold text-(--primary) font-statement">
                {analytics.todaySolves.toLocaleString()}
              </div>
              <div className="text-xs text-(--text-muted) font-inter mt-1">
                Today
              </div>
            </div>
            <div className="text-center bg-(--surface-elevated) rounded-(--radius-control) py-4 px-2 border border-(--border)">
              <div className="text-xl sm:text-2xl font-bold text-(--text-primary) font-statement">
                {analytics.thisWeekSolves.toLocaleString()}
              </div>
              <div className="text-xs text-(--text-muted) font-inter mt-1">
                This Week
              </div>
            </div>
            <div className="text-center bg-(--surface-elevated) rounded-(--radius-control) py-4 px-2 border border-(--border)">
              <div className="text-xl sm:text-2xl font-bold text-(--text-secondary) font-statement">
                {analytics.thisMonthSolves.toLocaleString()}
              </div>
              <div className="text-xs text-(--text-muted) font-inter mt-1">
                This Month
              </div>
            </div>
          </div>
        </AdminCollapsibleCard>

        {/* Event Category Modal */}
        {showCategoryModal && eventCategories && (
          <EventCategoryModal
            event={eventCategories.event}
            eventName={eventCategories.eventName}
            categories={eventCategories.categories}
            onClose={() => setShowCategoryModal(false)}
          />
        )}
      </div>
    </div>
  );
}

// Helper to format time for display (from milliseconds)
function formatTimeDisplay(ms: number): string {
  if (ms < 0) return "DNF";
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toFixed(2);
  return minutes > 0 ? `${minutes}:${seconds.padStart(5, "0")}` : seconds;
}
