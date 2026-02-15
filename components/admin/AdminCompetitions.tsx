"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCachedQuery } from "@/lib/hooks/useAdminCache";
import { ADMIN_CACHE_KEYS, ADMIN_CACHE_TTLS } from "@/lib/admin-cache";
import {
  Medal,
  Trophy,
  CheckCircle2,
  Clock,
  Calendar,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Activity,
  Users,
  Globe,
  Percent,
  BarChart3,
  Zap,
  Target,
  Volume2,
  Timer,
  MapPin,
  XCircle,
  Download,
  Search,
  X,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";
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

// Helper to export data
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

// Bar Chart Component using Chart.js with completed overlay support
function BarChart({
  data,
  showCompletedOverlay,
}: {
  data: Array<{ label: string; value: number; completedCount?: number }>;
  maxValue?: number;
  showCompletedOverlay?: boolean;
}) {
  const effectiveTheme = useEffectiveTheme();
  const primaryColor = usePrimaryColor();
  const isLight = effectiveTheme === "light";
  const textColor = isLight
    ? "rgba(17, 24, 39, 0.8)"
    : "rgba(255, 255, 255, 0.8)";
  const gridColor = isLight ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)";

  // Helper to add alpha to hex color
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const chartData = useMemo(() => {
    if (showCompletedOverlay) {
      // Show incomplete (total - completed) stacked with completed
      return {
        labels: data.map((d) => d.label),
        datasets: [
          {
            label: "Completed",
            data: data.map((d) => d.completedCount || 0),
            backgroundColor: primaryColor,
            borderRadius: 4,
            barThickness: 18,
          },
          {
            label: "Incomplete",
            data: data.map((d) => d.value - (d.completedCount || 0)),
            backgroundColor: hexToRgba(primaryColor, 0.3),
            borderRadius: 4,
            barThickness: 18,
          },
        ],
      };
    }
    return {
      labels: data.map((d) => d.label),
      datasets: [
        {
          label: "Simulations",
          data: data.map((d) => d.value),
          backgroundColor: primaryColor,
          borderRadius: 4,
          barThickness: 20,
        },
      ],
    };
  }, [data, primaryColor, showCompletedOverlay]);

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
          stacked: showCompletedOverlay,
          ticks: { color: textColor, font: { size: 10 } },
          grid: { display: false },
          border: { display: false },
        },
        y: {
          stacked: showCompletedOverlay,
          beginAtZero: true,
          ticks: { color: textColor, font: { size: 10 }, stepSize: 1 },
          grid: { color: gridColor },
          border: { display: false },
        },
      },
    }),
    [isLight, textColor, gridColor, showCompletedOverlay],
  );

  return (
    <div className="h-40">
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
}

// Event Popularity Bar
function EventBar({
  event,
  eventName,
  count,
  maxCount,
  completionRate,
  results,
}: {
  event: string;
  eventName: string;
  count: number;
  maxCount: number;
  completionRate: number;
  results: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--text-secondary)] font-inter">
          {eventName}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)] font-inter">
            {results} results
          </span>
          <span className="text-[var(--text-primary)] font-medium font-inter">
            {count}
          </span>
        </div>
      </div>
      <div className="h-2 bg-[var(--surface-elevated)] rounded-full overflow-hidden flex">
        <div
          className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
          style={{ width: `${(count / maxCount) * 100}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--text-muted)] font-inter">
          {completionRate}% completion
        </span>
      </div>
    </div>
  );
}

// Status Distribution Component
function StatusDistribution({
  byStatus,
  completionRate,
  abandonmentRate,
}: {
  byStatus: { inProgress: number; completed: number; abandoned: number };
  completionRate: number;
  abandonmentRate: number;
}) {
  const total = byStatus.inProgress + byStatus.completed + byStatus.abandoned;

  const segments = [
    {
      key: "completed",
      value: byStatus.completed,
      color: "var(--success)",
      bgClass: "bg-green-500",
      label: "Completed",
    },
    {
      key: "inProgress",
      value: byStatus.inProgress,
      color: "var(--warning)",
      bgClass: "bg-amber-500",
      label: "In Progress",
    },
    {
      key: "abandoned",
      value: byStatus.abandoned,
      color: "var(--error)",
      bgClass: "bg-red-500",
      label: "Abandoned",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Horizontal stacked bar */}
      <div className="h-3 bg-[var(--surface-elevated)] rounded-full overflow-hidden flex">
        {segments.map((segment) => (
          <div
            key={segment.key}
            className="h-full transition-all"
            style={{
              width: total > 0 ? `${(segment.value / total) * 100}%` : "0%",
              backgroundColor: segment.color,
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-3">
        {segments.map((segment) => (
          <div key={segment.key} className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <div className={`w-2.5 h-2.5 rounded-full ${segment.bgClass}`} />
              <span className="text-lg font-bold text-[var(--text-primary)] font-statement">
                {segment.value}
              </span>
            </div>
            <span className="text-xs text-[var(--text-muted)] font-inter">
              {segment.label}
            </span>
          </div>
        ))}
      </div>

      {/* Rates */}
      <div className="flex items-center justify-center gap-6 pt-2 border-t border-[var(--border)]">
        <div className="text-center">
          <span className="text-lg font-bold text-green-500 font-statement">
            {completionRate}%
          </span>
          <p className="text-xs text-[var(--text-muted)] font-inter">
            Completion Rate
          </p>
        </div>
        <div className="text-center">
          <span className="text-lg font-bold text-red-500 font-statement">
            {abandonmentRate}%
          </span>
          <p className="text-xs text-[var(--text-muted)] font-inter">
            Abandonment Rate
          </p>
        </div>
      </div>
    </div>
  );
}

// Atmosphere Settings Overview
function AtmosphereStats({
  stats,
  totalSimulations,
}: {
  stats: {
    avgCrowdNoise: number;
    avgPressure: number;
    distractionsEnabled: number;
    timerDelayEnabled: number;
    judgeInteractionsEnabled: number;
  };
  totalSimulations: number;
}) {
  const items = [
    {
      label: "Avg Crowd Noise",
      value: `${stats.avgCrowdNoise}%`,
      icon: Volume2,
    },
    {
      label: "Avg Pressure",
      value: `${stats.avgPressure}%`,
      icon: Zap,
    },
    {
      label: "Distractions On",
      value: `${totalSimulations > 0 ? Math.round((stats.distractionsEnabled / totalSimulations) * 100) : 0}%`,
      icon: Activity,
    },
    {
      label: "Timer Delay On",
      value: `${totalSimulations > 0 ? Math.round((stats.timerDelayEnabled / totalSimulations) * 100) : 0}%`,
      icon: Timer,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="flex items-center gap-2 bg-[var(--surface-elevated)] rounded-lg p-2.5 border border-[var(--border)]"
        >
          <item.icon className="w-4 h-4 text-[var(--text-muted)]" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide truncate font-inter">
              {item.label}
            </div>
            <div className="text-sm font-semibold text-[var(--text-primary)] font-statement">
              {item.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Competition Item for list
function CompetitionItem({
  competition,
  onViewDetails,
}: {
  competition: {
    id: string;
    name: string;
    country?: string;
    city?: string;
    date: string;
    totalSimulations: number;
    completedCount: number;
    inProgressCount: number;
    abandonedCount: number;
    uniqueUsers: number;
    completionRate: number;
    events: Array<{ id: string; name: string }>;
  };
  onViewDetails: () => void;
}) {
  return (
    <div className="bg-[var(--surface-elevated)] rounded-lg p-3 sm:p-4 border border-[var(--border)] hover:border-[var(--primary)]/30 transition-colors">
      {/* Header with name and view button */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-[var(--text-primary)] font-statement truncate">
              {competition.name}
            </h4>
            <a
              href={`https://www.worldcubeassociation.org/competitions/${competition.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-muted)] font-inter">
            {competition.country && (
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {competition.city ? `${competition.city}, ` : ""}
                {competition.country}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {competition.date}
            </span>
          </div>
        </div>
        <button
          onClick={onViewDetails}
          className="p-2 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--surface)] rounded-lg transition-colors shrink-0"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Stats row - responsive grid */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        <div className="text-center bg-[var(--surface)] rounded-lg py-2 px-1">
          <div className="text-base sm:text-lg font-bold text-[var(--text-primary)] font-statement">
            {competition.totalSimulations}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] font-inter">
            Simulations
          </div>
        </div>
        <div className="text-center bg-[var(--surface)] rounded-lg py-2 px-1">
          <div className="text-base sm:text-lg font-bold text-[var(--primary)] font-statement">
            {competition.uniqueUsers}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] font-inter">
            Users
          </div>
        </div>
        <div className="text-center bg-[var(--surface)] rounded-lg py-2 px-1">
          <div
            className={`text-base sm:text-lg font-bold font-statement ${
              competition.completionRate >= 70
                ? "text-green-500"
                : competition.completionRate >= 40
                  ? "text-amber-500"
                  : "text-red-500"
            }`}
          >
            {competition.completionRate}%
          </div>
          <div className="text-[10px] text-[var(--text-muted)] font-inter">
            Complete
          </div>
        </div>
      </div>

      {/* Events row */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {competition.events.slice(0, 6).map((event) => (
          <span
            key={event.id}
            className="px-2 py-0.5 text-[10px] bg-[var(--surface)] text-[var(--text-secondary)] rounded font-inter"
          >
            {event.name}
          </span>
        ))}
        {competition.events.length > 6 && (
          <span className="px-2 py-0.5 text-[10px] bg-[var(--surface)] text-[var(--text-muted)] rounded font-inter">
            +{competition.events.length - 6} more
          </span>
        )}
      </div>
    </div>
  );
}

// Competition Details Modal
function CompetitionDetailsModal({
  competition,
  onClose,
}: {
  competition: {
    id: string;
    name: string;
    country?: string;
    city?: string;
    venue?: string;
    date: string;
    totalSimulations: number;
    completedCount: number;
    inProgressCount: number;
    abandonedCount: number;
    uniqueUsers: number;
    completionRate: number;
    events: Array<{ id: string; name: string }>;
    latestActivity: number;
  };
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="timer-card max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-xl font-bold text-[var(--text-primary)] font-statement">
              {competition.name}
            </h2>
            <a
              href={`https://www.worldcubeassociation.org/competitions/${competition.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--primary)] hover:underline font-inter inline-flex items-center gap-1 mt-1"
            >
              {competition.id}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-lg hover:bg-[var(--surface-elevated)] shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Competition Info */}
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-[var(--text-muted)] mb-2 font-inter uppercase tracking-wide">
              Competition Details
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[var(--surface-elevated)] rounded-lg p-3 border border-[var(--border)]">
                <div className="flex items-center gap-2 text-[var(--text-muted)] mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="text-xs font-inter uppercase">Location</span>
                </div>
                <p className="text-sm font-semibold text-[var(--text-primary)] font-statement">
                  {competition.city || competition.country || "Unknown"}
                </p>
              </div>
              <div className="bg-[var(--surface-elevated)] rounded-lg p-3 border border-[var(--border)]">
                <div className="flex items-center gap-2 text-[var(--text-muted)] mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-xs font-inter uppercase">Date</span>
                </div>
                <p className="text-sm font-semibold text-[var(--text-primary)] font-statement">
                  {competition.date}
                </p>
              </div>
            </div>
            {competition.venue && (
              <div className="mt-2 bg-[var(--surface-elevated)] rounded-lg p-3 border border-[var(--border)]">
                <div className="flex items-center gap-2 text-[var(--text-muted)] mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="text-xs font-inter uppercase">Venue</span>
                </div>
                <p className="text-sm font-medium text-[var(--text-primary)] font-inter">
                  {competition.venue}
                </p>
              </div>
            )}
          </div>

          {/* Simulation Stats */}
          <div>
            <h4 className="text-sm font-medium text-[var(--text-muted)] mb-2 font-inter uppercase tracking-wide">
              Simulation Statistics
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[var(--surface-elevated)] rounded-lg p-3 border border-[var(--border)]">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1 bg-blue-500/10 rounded">
                    <Medal className="w-3 h-3 text-blue-500" />
                  </div>
                  <span className="text-xs text-[var(--text-muted)] font-inter uppercase">
                    Total
                  </span>
                </div>
                <p className="text-lg font-bold text-[var(--text-primary)] font-statement">
                  {competition.totalSimulations}
                </p>
              </div>
              <div className="bg-[var(--surface-elevated)] rounded-lg p-3 border border-[var(--border)]">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1 bg-green-500/10 rounded">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                  </div>
                  <span className="text-xs text-[var(--text-muted)] font-inter uppercase">
                    Completed
                  </span>
                </div>
                <p className="text-lg font-bold text-[var(--text-primary)] font-statement">
                  {competition.completedCount}
                </p>
              </div>
              <div className="bg-[var(--surface-elevated)] rounded-lg p-3 border border-[var(--border)]">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1 bg-amber-500/10 rounded">
                    <Clock className="w-3 h-3 text-amber-500" />
                  </div>
                  <span className="text-xs text-[var(--text-muted)] font-inter uppercase">
                    In Progress
                  </span>
                </div>
                <p className="text-lg font-bold text-[var(--text-primary)] font-statement">
                  {competition.inProgressCount}
                </p>
              </div>
              <div className="bg-[var(--surface-elevated)] rounded-lg p-3 border border-[var(--border)]">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1 bg-red-500/10 rounded">
                    <XCircle className="w-3 h-3 text-red-500" />
                  </div>
                  <span className="text-xs text-[var(--text-muted)] font-inter uppercase">
                    Abandoned
                  </span>
                </div>
                <p className="text-lg font-bold text-[var(--text-primary)] font-statement">
                  {competition.abandonedCount}
                </p>
              </div>
            </div>
          </div>

          {/* User Engagement */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[var(--surface-elevated)] rounded-lg p-3 border border-[var(--border)]">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1 bg-purple-500/10 rounded">
                  <Users className="w-3 h-3 text-purple-500" />
                </div>
                <span className="text-xs text-[var(--text-muted)] font-inter uppercase">
                  Unique Users
                </span>
              </div>
              <p className="text-lg font-bold text-[var(--text-primary)] font-statement">
                {competition.uniqueUsers}
              </p>
            </div>
            <div className="bg-[var(--surface-elevated)] rounded-lg p-3 border border-[var(--border)]">
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`p-1 rounded ${competition.completionRate >= 70 ? "bg-green-500/10" : competition.completionRate >= 40 ? "bg-amber-500/10" : "bg-red-500/10"}`}
                >
                  <Target
                    className={`w-3 h-3 ${competition.completionRate >= 70 ? "text-green-500" : competition.completionRate >= 40 ? "text-amber-500" : "text-red-500"}`}
                  />
                </div>
                <span className="text-xs text-[var(--text-muted)] font-inter uppercase">
                  Completion
                </span>
              </div>
              <p
                className={`text-lg font-bold font-statement ${competition.completionRate >= 70 ? "text-green-500" : competition.completionRate >= 40 ? "text-amber-500" : "text-red-500"}`}
              >
                {competition.completionRate}%
              </p>
            </div>
          </div>

          {/* Events */}
          <div>
            <h4 className="text-sm font-medium text-[var(--text-muted)] mb-2 font-inter uppercase tracking-wide">
              Events Practiced ({competition.events.length})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {competition.events.map((event) => (
                <span
                  key={event.id}
                  className="px-2.5 py-1 text-xs bg-[var(--surface-elevated)] text-[var(--text-secondary)] rounded-lg border border-[var(--border)] font-inter"
                >
                  {event.name}
                </span>
              ))}
            </div>
          </div>

          {/* Last Activity */}
          <div className="bg-[var(--surface-elevated)] rounded-lg p-3 border border-[var(--border)]">
            <div className="flex items-center gap-2 text-[var(--text-muted)] mb-1">
              <Activity className="w-3.5 h-3.5" />
              <span className="text-xs font-inter uppercase">
                Latest Activity
              </span>
            </div>
            <p className="text-sm font-medium text-[var(--text-primary)] font-inter">
              {new Date(competition.latestActivity).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6 pt-4 border-t border-[var(--border)]">
          <button onClick={onClose} className="flex-1 btn-secondary py-3">
            Close
          </button>
          <a
            href={`https://www.worldcubeassociation.org/competitions/${competition.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
          >
            View on WCA
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

// Recent Simulation Item
function RecentSimulationItem({
  simulation,
}: {
  simulation: {
    id: string;
    competitionId: string;
    competitionName: string;
    competitionCountry?: string;
    selectedEvents: Array<{ id: string; name: string }>;
    status: string;
    startedAt: number;
    completedAt?: number;
    lastActivityAt: number;
    userName: string;
    userWcaId: string | null;
    userAvatar: string | null;
    completedEvents: number;
    totalEvents: number;
  };
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-500";
      case "in-progress":
        return "bg-amber-500/10 text-amber-500";
      case "abandoned":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  return (
    <div className="bg-[var(--surface-elevated)] rounded-lg p-3 border border-[var(--border)]">
      <div className="flex items-start gap-3">
        {simulation.userAvatar ? (
          <Image
            src={simulation.userAvatar}
            alt={simulation.userName}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-[var(--primary)]" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-[var(--text-primary)] font-inter truncate">
              {simulation.userName}
            </span>
            <span
              className={`px-2 py-0.5 text-[10px] rounded-full font-inter capitalize ${getStatusColor(simulation.status)}`}
            >
              {simulation.status.replace("-", " ")}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] font-inter truncate mt-0.5">
            {simulation.competitionName}
          </p>
          <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--text-muted)] font-inter">
            <span>
              {simulation.completedEvents}/{simulation.totalEvents} events
            </span>
            <span>
              {new Date(simulation.lastActivityAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// User Activity Item
function UserActivityItem({
  user,
}: {
  user: {
    userId: string;
    userName: string;
    userWcaId: string | null;
    userAvatar: string | null;
    totalSimulations: number;
    completedSimulations: number;
    totalResults: number;
    totalSolves: number;
    eventsCount: number;
    competitionsCount: number;
    lastActivity: number;
  };
}) {
  const completionRate =
    user.totalSimulations > 0
      ? Math.round((user.completedSimulations / user.totalSimulations) * 100)
      : 0;

  return (
    <div className="bg-[var(--surface-elevated)] rounded-lg p-3 border border-[var(--border)]">
      <div className="flex items-start gap-3">
        {user.userAvatar ? (
          <Image
            src={user.userAvatar}
            alt={user.userName}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-[var(--primary)]" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--text-primary)] font-inter truncate">
              {user.userName}
            </span>
            {user.userWcaId && (
              <a
                href={`https://www.worldcubeassociation.org/persons/${user.userWcaId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--primary)] hover:underline font-inter"
              >
                {user.userWcaId}
              </a>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2 mt-2">
            <div className="text-center">
              <div className="text-sm font-bold text-[var(--text-primary)] font-statement">
                {user.totalSimulations}
              </div>
              <div className="text-[10px] text-[var(--text-muted)] font-inter">
                Sims
              </div>
            </div>
            <div className="text-center">
              <div
                className={`text-sm font-bold font-statement ${
                  completionRate >= 70
                    ? "text-green-500"
                    : completionRate >= 40
                      ? "text-amber-500"
                      : "text-red-500"
                }`}
              >
                {completionRate}%
              </div>
              <div className="text-[10px] text-[var(--text-muted)] font-inter">
                Rate
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-[var(--text-primary)] font-statement">
                {user.totalSolves}
              </div>
              <div className="text-[10px] text-[var(--text-muted)] font-inter">
                Solves
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-[var(--text-primary)] font-statement">
                {user.eventsCount}
              </div>
              <div className="text-[10px] text-[var(--text-muted)] font-inter">
                Events
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Country Distribution
function CountryDistribution({
  countries,
}: {
  countries: Array<{ country: string; count: number }>;
}) {
  const total = countries.reduce((acc, c) => acc + c.count, 0);
  const maxCount = Math.max(...countries.map((c) => c.count), 1);

  return (
    <div className="space-y-2">
      {countries.map((item) => (
        <div key={item.country} className="flex items-center gap-3">
          <span className="w-24 text-sm text-[var(--text-secondary)] font-inter truncate">
            {item.country}
          </span>
          <div className="flex-1 h-2 bg-[var(--surface)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
              style={{ width: `${(item.count / maxCount) * 100}%` }}
            />
          </div>
          <span className="w-10 text-sm text-[var(--text-primary)] font-inter text-right">
            {item.count}
          </span>
          <span className="w-12 text-xs text-[var(--text-muted)] font-inter text-right">
            {total > 0 ? ((item.count / total) * 100).toFixed(0) : 0}%
          </span>
        </div>
      ))}
    </div>
  );
}

// Skeleton loader for stats
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="h-20 bg-[var(--surface-elevated)] rounded-xl animate-pulse border border-[var(--border)]"
        />
      ))}
    </div>
  );
}

export default function AdminCompetitions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompetition, setSelectedCompetition] = useState<any>(null);

  const {
    data: analytics,
    isFetching: analyticsFetching,
    refetch: refetchAnalytics,
  } = useCachedQuery(
    api.adminCompetitions.getCompetitionAnalytics,
    {},
    {
      cacheKey: ADMIN_CACHE_KEYS.competitionAnalytics,
      ttl: ADMIN_CACHE_TTLS.competitions,
    },
  );
  const { data: competitionsList, isFetching: listFetching } = useCachedQuery(
    api.adminCompetitions.getCompetitionsList,
    {},
    {
      cacheKey: ADMIN_CACHE_KEYS.competitionsList,
      ttl: ADMIN_CACHE_TTLS.competitions,
    },
  );
  const userActivity = useQuery(
    api.adminCompetitions.getCompetitionUserActivity,
  );
  const recentSimulations = useQuery(
    api.adminCompetitions.getRecentSimulations,
  );

  const isLoading = analytics === undefined;

  const handleExportAnalytics = () => {
    if (analytics) {
      exportToJSON(analytics, "competition_analytics");
    }
  };

  // Filter competitions by search
  const filteredCompetitions = competitionsList?.filter(
    (comp) =>
      comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.city?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Overview Statistics */}
      <CollapsibleCard
        title="Overview Statistics"
        storageKey="admin-competitions-overview"
        defaultOpen={true}
        headerExtra={
          <button
            onClick={handleExportAnalytics}
            disabled={!analytics}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] rounded-lg text-[var(--text-secondary)] transition-colors font-inter disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        }
      >
        {isLoading ? (
          <StatsSkeleton />
        ) : (
          <div className="space-y-4">
            {/* Primary Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                title="Total Simulations"
                value={analytics.totalSimulations}
                icon={Medal}
                iconColor="text-blue-500"
                iconBgColor="bg-blue-500/10"
              />
              <StatCard
                title="Total Results"
                value={analytics.totalResults}
                icon={BarChart3}
                iconColor="text-green-500"
                iconBgColor="bg-green-500/10"
              />
              <StatCard
                title="Total Solves"
                value={analytics.totalSolves}
                icon={Timer}
                iconColor="text-purple-500"
                iconBgColor="bg-purple-500/10"
              />
              <StatCard
                title="Unique Comps"
                value={analytics.uniqueCompetitions}
                icon={Trophy}
                iconColor="text-amber-500"
                iconBgColor="bg-amber-500/10"
              />
            </div>

            {/* Secondary Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                title="Unique Users"
                value={analytics.uniqueUsers}
                icon={Users}
                iconColor="text-cyan-500"
                iconBgColor="bg-cyan-500/10"
              />
              <StatCard
                title="This Week"
                value={analytics.simulationsThisWeek}
                icon={TrendingUp}
                iconColor="text-green-500"
                iconBgColor="bg-green-500/10"
                trend={{
                  value: analytics.weekOverWeekGrowth,
                  label: "vs last week",
                }}
              />
              <StatCard
                title="This Month"
                value={analytics.simulationsThisMonth}
                icon={TrendingUp}
                iconColor="text-blue-500"
                iconBgColor="bg-blue-500/10"
                trend={{
                  value: analytics.monthOverMonthGrowth,
                  label: "vs last month",
                }}
              />
              <StatCard
                title="Avg Events/Sim"
                value={analytics.avgEventsPerSimulation}
                icon={Activity}
                iconColor="text-pink-500"
                iconBgColor="bg-pink-500/10"
              />
            </div>

            {/* User Engagement Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                title="Power Users"
                value={analytics.powerUsers}
                icon={Zap}
                iconColor="text-amber-500"
                iconBgColor="bg-amber-500/10"
                subValue="5+ simulations"
              />
              <StatCard
                title="Casual Users"
                value={analytics.casualUsers}
                icon={Users}
                iconColor="text-gray-500"
                iconBgColor="bg-gray-500/10"
                subValue="&lt;5 simulations"
              />
              <StatCard
                title="Avg Sims/User"
                value={analytics.avgSimulationsPerUser}
                icon={Percent}
                iconColor="text-purple-500"
                iconBgColor="bg-purple-500/10"
              />
              <StatCard
                title="Avg 3x3 Time"
                value={analytics.avgThreeByThreeTime}
                icon={Timer}
                iconColor="text-orange-500"
                iconBgColor="bg-orange-500/10"
              />
            </div>
          </div>
        )}
      </CollapsibleCard>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Status Distribution */}
        <CollapsibleCard
          title="Simulation Status"
          storageKey="admin-competitions-status"
          defaultOpen={true}
        >
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-3 bg-[var(--surface-elevated)] rounded-full" />
              <div className="grid grid-cols-3 gap-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-[var(--surface-elevated)] rounded-lg"
                  />
                ))}
              </div>
            </div>
          ) : (
            <StatusDistribution
              byStatus={analytics.byStatus}
              completionRate={analytics.completionRate}
              abandonmentRate={analytics.abandonmentRate}
            />
          )}
        </CollapsibleCard>

        {/* Weekly Trend */}
        <CollapsibleCard
          title="Weekly Trend"
          storageKey="admin-competitions-trend"
          defaultOpen={true}
        >
          {isLoading ? (
            <div className="h-32 bg-[var(--surface-elevated)] rounded-lg animate-pulse" />
          ) : (
            <>
              <BarChart
                data={analytics.weeklyTrend.map((w) => ({
                  label: w.week,
                  value: w.count,
                  completedCount: w.completedCount,
                }))}
                showCompletedOverlay={true}
              />
              <div className="flex items-center justify-center gap-4 mt-3 text-xs text-[var(--text-muted)]">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-2 bg-[var(--primary)]/30 rounded" />
                  <span>Incomplete</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-2 bg-[var(--primary)] rounded" />
                  <span>Completed</span>
                </div>
              </div>
            </>
          )}
        </CollapsibleCard>
      </div>

      {/* Event Analytics */}
      <CollapsibleCard
        title="Event Analytics"
        storageKey="admin-competitions-events"
        defaultOpen={true}
      >
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-12 bg-[var(--surface-elevated)] rounded-lg"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-[var(--text-muted)] font-inter uppercase tracking-wide">
                Event Popularity
              </h4>
              <div className="space-y-4">
                {analytics.popularEvents.slice(0, 5).map((event) => (
                  <EventBar
                    key={event.event}
                    event={event.event}
                    eventName={event.eventName}
                    count={event.count}
                    maxCount={analytics.popularEvents[0]?.count || 1}
                    completionRate={event.completionRate}
                    results={event.results}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {analytics.popularEvents.length > 5 && (
                <>
                  <h4 className="text-sm font-medium text-[var(--text-muted)] font-inter uppercase tracking-wide">
                    More Events
                  </h4>
                  <div className="space-y-4">
                    {analytics.popularEvents.slice(5, 10).map((event) => (
                      <EventBar
                        key={event.event}
                        event={event.event}
                        eventName={event.eventName}
                        count={event.count}
                        maxCount={analytics.popularEvents[0]?.count || 1}
                        completionRate={event.completionRate}
                        results={event.results}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </CollapsibleCard>

      {/* Atmosphere & Country Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Atmosphere Settings */}
        <CollapsibleCard
          title="Atmosphere Settings"
          storageKey="admin-competitions-atmosphere"
          defaultOpen={true}
        >
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-[var(--surface-elevated)] rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : (
            <AtmosphereStats
              stats={analytics.atmosphereStats}
              totalSimulations={analytics.totalSimulations}
            />
          )}
        </CollapsibleCard>

        {/* Country Distribution */}
        <CollapsibleCard
          title="Competition Locations"
          storageKey="admin-competitions-countries"
          defaultOpen={true}
        >
          {isLoading ? (
            <div className="animate-pulse space-y-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-6 bg-[var(--surface-elevated)] rounded"
                />
              ))}
            </div>
          ) : analytics.topCountries.length > 0 ? (
            <CountryDistribution countries={analytics.topCountries} />
          ) : (
            <p className="text-sm text-[var(--text-muted)] font-inter">
              No location data available
            </p>
          )}
        </CollapsibleCard>
      </div>

      {/* Competitions List */}
      <CollapsibleCard
        title="Competitions"
        storageKey="admin-competitions-list"
        defaultOpen={true}
        headerExtra={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 text-sm bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] font-inter w-32 sm:w-48"
            />
          </div>
        }
      >
        {competitionsList === undefined ? (
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-[var(--surface-elevated)] rounded-lg"
              />
            ))}
          </div>
        ) : filteredCompetitions && filteredCompetitions.length > 0 ? (
          <div className="space-y-3">
            {filteredCompetitions.slice(0, 15).map((comp) => (
              <CompetitionItem
                key={comp.id}
                competition={comp}
                onViewDetails={() => setSelectedCompetition(comp)}
              />
            ))}
            {filteredCompetitions.length > 15 && (
              <p className="text-center text-sm text-[var(--text-muted)] font-inter pt-2">
                Showing 15 of {filteredCompetitions.length} competitions
              </p>
            )}
          </div>
        ) : (
          <p className="text-center text-sm text-[var(--text-muted)] font-inter py-8">
            {searchQuery
              ? "No competitions match your search"
              : "No competitions found"}
          </p>
        )}
      </CollapsibleCard>

      {/* User Activity & Recent Simulations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Top Users */}
        <CollapsibleCard
          title="Top Users by Activity"
          storageKey="admin-competitions-users"
          defaultOpen={true}
        >
          {userActivity === undefined ? (
            <div className="animate-pulse space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 bg-[var(--surface-elevated)] rounded-lg"
                />
              ))}
            </div>
          ) : userActivity.length > 0 ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {userActivity.slice(0, 10).map((user) => (
                <UserActivityItem key={user.userId} user={user} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)] font-inter">
              No user activity data
            </p>
          )}
        </CollapsibleCard>

        {/* Recent Simulations */}
        <CollapsibleCard
          title="Recent Simulations"
          storageKey="admin-competitions-recent"
          defaultOpen={true}
        >
          {recentSimulations === undefined ? (
            <div className="animate-pulse space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 bg-[var(--surface-elevated)] rounded-lg"
                />
              ))}
            </div>
          ) : recentSimulations.length > 0 ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {recentSimulations.slice(0, 10).map((sim) => (
                <RecentSimulationItem key={sim.id} simulation={sim} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)] font-inter">
              No recent simulations
            </p>
          )}
        </CollapsibleCard>
      </div>

      {/* Competition Details Modal */}
      {selectedCompetition && (
        <CompetitionDetailsModal
          competition={selectedCompetition}
          onClose={() => setSelectedCompetition(null)}
        />
      )}
    </div>
  );
}
