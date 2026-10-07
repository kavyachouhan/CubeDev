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
import { SearchInput } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { AdminStatCard } from "./AdminStatCard";
import { AdminCollapsibleCard } from "./AdminCollapsibleCard";
import { useEffectiveTheme, useThemeColors } from "@/lib/hooks/useThemeColors";
import type { LucideIcon } from "lucide-react";
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
import { canOpenWcaProfile } from "@/lib/identifier-utils";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

// Helper to export data
function exportToJSON(data: unknown, filename: string) {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.json`;
  link.click();
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
  const primaryColor = useThemeColors()["--primary"];
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
        <span className="text-(--text-secondary) font-inter">{eventName}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-(--text-muted) font-inter">
            {results} results
          </span>
          <span className="text-(--text-primary) font-medium font-inter">
            {count}
          </span>
        </div>
      </div>
      <div className="h-2 bg-(--surface-elevated) rounded-full overflow-hidden flex">
        <div
          className="h-full bg-(--primary) rounded-full transition-all duration-500"
          style={{ width: `${(count / maxCount) * 100}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-(--text-muted) font-inter">
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
      bgClass: "bg-(--success)",
      label: "Completed",
    },
    {
      key: "inProgress",
      value: byStatus.inProgress,
      color: "var(--warning)",
      bgClass: "bg-(--warning)",
      label: "In Progress",
    },
    {
      key: "abandoned",
      value: byStatus.abandoned,
      color: "var(--error)",
      bgClass: "bg-(--error)",
      label: "Abandoned",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Horizontal stacked bar */}
      <div className="h-3 bg-(--surface-elevated) rounded-full overflow-hidden flex">
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
              <span className="text-lg font-bold text-(--text-primary) font-statement">
                {segment.value}
              </span>
            </div>
            <span className="text-xs text-(--text-muted) font-inter">
              {segment.label}
            </span>
          </div>
        ))}
      </div>

      {/* Rates */}
      <div className="flex items-center justify-center gap-6 pt-2 border-t border-(--border)">
        <div className="text-center">
          <span className="text-lg font-bold text-(--success) font-statement">
            {completionRate}%
          </span>
          <p className="text-xs text-(--text-muted) font-inter">
            Completion Rate
          </p>
        </div>
        <div className="text-center">
          <span className="text-lg font-bold text-(--error) font-statement">
            {abandonmentRate}%
          </span>
          <p className="text-xs text-(--text-muted) font-inter">
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
          className="flex items-center gap-2 bg-(--surface-elevated) rounded-(--radius-control) p-2.5 border border-(--border)"
        >
          <item.icon className="w-4 h-4 text-(--text-muted)" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-(--text-muted) uppercase tracking-wide truncate font-inter">
              {item.label}
            </div>
            <div className="text-sm font-semibold text-(--text-primary) font-statement">
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
    <div className="bg-(--surface-elevated) rounded-(--radius-control) p-3 sm:p-4 border border-(--border) hover:border-(--primary)/30 transition-colors">
      {/* Header with name and view button */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-(--text-primary) font-statement truncate">
              {competition.name}
            </h4>
            <a
              href={`https://www.worldcubeassociation.org/competitions/${competition.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-(--primary) hover:text-(--primary-hover) transition-colors shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-(--text-muted) font-inter">
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
          className="p-2 text-(--text-muted) hover:text-(--primary) hover:bg-(--surface) rounded-(--radius-control) transition-colors shrink-0"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Stats row - responsive grid */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        <div className="text-center bg-(--surface) rounded-(--radius-control) py-2 px-1">
          <div className="text-base sm:text-lg font-bold text-(--text-primary) font-statement">
            {competition.totalSimulations}
          </div>
          <div className="text-[10px] text-(--text-muted) font-inter">
            Simulations
          </div>
        </div>
        <div className="text-center bg-(--surface) rounded-(--radius-control) py-2 px-1">
          <div className="text-base sm:text-lg font-bold text-(--primary) font-statement">
            {competition.uniqueUsers}
          </div>
          <div className="text-[10px] text-(--text-muted) font-inter">
            Users
          </div>
        </div>
        <div className="text-center bg-(--surface) rounded-(--radius-control) py-2 px-1">
          <div
            className={`text-base sm:text-lg font-bold font-statement ${
              competition.completionRate >= 70
                ? "text-(--success)"
                : competition.completionRate >= 40
                  ? "text-(--warning)"
                  : "text-(--error)"
            }`}
          >
            {competition.completionRate}%
          </div>
          <div className="text-[10px] text-(--text-muted) font-inter">
            Complete
          </div>
        </div>
      </div>

      {/* Events row */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {competition.events.slice(0, 6).map((event) => (
          <span
            key={event.id}
            className="px-2 py-0.5 text-[10px] bg-(--surface) text-(--text-secondary) rounded font-inter"
          >
            {event.name}
          </span>
        ))}
        {competition.events.length > 6 && (
          <span className="px-2 py-0.5 text-[10px] bg-(--surface) text-(--text-muted) rounded font-inter">
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
    <Modal open onClose={onClose} size="md" mobile="fullscreen">
      <Modal.Body>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-xl font-bold text-(--text-primary) font-statement">
              {competition.name}
            </h2>
            <a
              href={`https://www.worldcubeassociation.org/competitions/${competition.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-(--primary) hover:underline font-inter inline-flex items-center gap-1 mt-1"
            >
              {competition.id}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <button
            onClick={onClose}
            className="text-(--text-muted) hover:text-(--text-primary) transition-colors p-1 rounded-(--radius-control) hover:bg-(--surface-elevated) shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Competition Info */}
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-(--text-muted) mb-2 font-inter uppercase tracking-wide">
              Competition Details
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-(--surface-elevated) rounded-(--radius-control) p-3 border border-(--border)">
                <div className="flex items-center gap-2 text-(--text-muted) mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="text-xs font-inter uppercase">Location</span>
                </div>
                <p className="text-sm font-semibold text-(--text-primary) font-statement">
                  {competition.city || competition.country || "Unknown"}
                </p>
              </div>
              <div className="bg-(--surface-elevated) rounded-(--radius-control) p-3 border border-(--border)">
                <div className="flex items-center gap-2 text-(--text-muted) mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-xs font-inter uppercase">Date</span>
                </div>
                <p className="text-sm font-semibold text-(--text-primary) font-statement">
                  {competition.date}
                </p>
              </div>
            </div>
            {competition.venue && (
              <div className="mt-2 bg-(--surface-elevated) rounded-(--radius-control) p-3 border border-(--border)">
                <div className="flex items-center gap-2 text-(--text-muted) mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="text-xs font-inter uppercase">Venue</span>
                </div>
                <p className="text-sm font-medium text-(--text-primary) font-inter">
                  {competition.venue}
                </p>
              </div>
            )}
          </div>

          {/* Simulation Stats */}
          <div>
            <h4 className="text-sm font-medium text-(--text-muted) mb-2 font-inter uppercase tracking-wide">
              Simulation Statistics
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-(--surface-elevated) rounded-(--radius-control) p-3 border border-(--border)">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1 bg-(--info)/10 rounded">
                    <Medal className="w-3 h-3 text-(--info)" />
                  </div>
                  <span className="text-xs text-(--text-muted) font-inter uppercase">
                    Total
                  </span>
                </div>
                <p className="text-lg font-bold text-(--text-primary) font-statement">
                  {competition.totalSimulations}
                </p>
              </div>
              <div className="bg-(--surface-elevated) rounded-(--radius-control) p-3 border border-(--border)">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1 bg-(--success)/10 rounded">
                    <CheckCircle2 className="w-3 h-3 text-(--success)" />
                  </div>
                  <span className="text-xs text-(--text-muted) font-inter uppercase">
                    Completed
                  </span>
                </div>
                <p className="text-lg font-bold text-(--text-primary) font-statement">
                  {competition.completedCount}
                </p>
              </div>
              <div className="bg-(--surface-elevated) rounded-(--radius-control) p-3 border border-(--border)">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1 bg-(--warning)/10 rounded">
                    <Clock className="w-3 h-3 text-(--warning)" />
                  </div>
                  <span className="text-xs text-(--text-muted) font-inter uppercase">
                    In Progress
                  </span>
                </div>
                <p className="text-lg font-bold text-(--text-primary) font-statement">
                  {competition.inProgressCount}
                </p>
              </div>
              <div className="bg-(--surface-elevated) rounded-(--radius-control) p-3 border border-(--border)">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1 bg-(--error)/10 rounded">
                    <XCircle className="w-3 h-3 text-(--error)" />
                  </div>
                  <span className="text-xs text-(--text-muted) font-inter uppercase">
                    Abandoned
                  </span>
                </div>
                <p className="text-lg font-bold text-(--text-primary) font-statement">
                  {competition.abandonedCount}
                </p>
              </div>
            </div>
          </div>

          {/* User Engagement */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-(--surface-elevated) rounded-(--radius-control) p-3 border border-(--border)">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1 bg-(--accent)/10 rounded">
                  <Users className="w-3 h-3 text-(--accent)" />
                </div>
                <span className="text-xs text-(--text-muted) font-inter uppercase">
                  Unique Users
                </span>
              </div>
              <p className="text-lg font-bold text-(--text-primary) font-statement">
                {competition.uniqueUsers}
              </p>
            </div>
            <div className="bg-(--surface-elevated) rounded-(--radius-control) p-3 border border-(--border)">
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`p-1 rounded ${competition.completionRate >= 70 ? "bg-(--success)/10" : competition.completionRate >= 40 ? "bg-(--warning)/10" : "bg-(--error)/10"}`}
                >
                  <Target
                    className={`w-3 h-3 ${competition.completionRate >= 70 ? "text-(--success)" : competition.completionRate >= 40 ? "text-(--warning)" : "text-(--error)"}`}
                  />
                </div>
                <span className="text-xs text-(--text-muted) font-inter uppercase">
                  Completion
                </span>
              </div>
              <p
                className={`text-lg font-bold font-statement ${competition.completionRate >= 70 ? "text-(--success)" : competition.completionRate >= 40 ? "text-(--warning)" : "text-(--error)"}`}
              >
                {competition.completionRate}%
              </p>
            </div>
          </div>

          {/* Events */}
          <div>
            <h4 className="text-sm font-medium text-(--text-muted) mb-2 font-inter uppercase tracking-wide">
              Events Practiced ({competition.events.length})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {competition.events.map((event) => (
                <span
                  key={event.id}
                  className="px-2.5 py-1 text-xs bg-(--surface-elevated) text-(--text-secondary) rounded-(--radius-control) border border-(--border) font-inter"
                >
                  {event.name}
                </span>
              ))}
            </div>
          </div>

          {/* Last Activity */}
          <div className="bg-(--surface-elevated) rounded-(--radius-control) p-3 border border-(--border)">
            <div className="flex items-center gap-2 text-(--text-muted) mb-1">
              <Activity className="w-3.5 h-3.5" />
              <span className="text-xs font-inter uppercase">
                Latest Activity
              </span>
            </div>
            <p className="text-sm font-medium text-(--text-primary) font-inter">
              {new Date(competition.latestActivity).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6 pt-4 border-t border-(--border)">
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
      </Modal.Body>
    </Modal>
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
        return "bg-(--success)/10 text-(--success)";
      case "in-progress":
        return "bg-(--warning)/10 text-(--warning)";
      case "abandoned":
        return "bg-(--error)/10 text-(--error)";
      default:
        return "bg-(--border)/10 text-(--text-muted)";
    }
  };

  return (
    <div className="bg-(--surface-elevated) rounded-(--radius-control) p-3 border border-(--border)">
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
          <div className="w-8 h-8 rounded-full bg-(--primary)/10 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-(--primary)" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-(--text-primary) font-inter truncate">
              {simulation.userName}
            </span>
            <span
              className={`px-2 py-0.5 text-[10px] rounded-full font-inter capitalize ${getStatusColor(simulation.status)}`}
            >
              {simulation.status.replace("-", " ")}
            </span>
          </div>
          <p className="text-xs text-(--text-muted) font-inter truncate mt-0.5">
            {simulation.competitionName}
          </p>
          <div className="flex items-center gap-3 mt-2 text-[10px] text-(--text-muted) font-inter">
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
    <div className="bg-(--surface-elevated) rounded-(--radius-control) p-3 border border-(--border)">
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
          <div className="w-10 h-10 rounded-full bg-(--primary)/10 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-(--primary)" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-(--text-primary) font-inter truncate">
              {user.userName}
            </span>
            {user.userWcaId &&
              (canOpenWcaProfile(user.userWcaId) ? (
                <a
                  href={`https://www.worldcubeassociation.org/persons/${user.userWcaId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-(--primary) hover:underline font-inter"
                >
                  {user.userWcaId}
                </a>
              ) : (
                <span className="text-xs text-(--text-muted) font-inter">
                  {user.userWcaId}
                </span>
              ))}
          </div>
          <div className="grid grid-cols-4 gap-2 mt-2">
            <div className="text-center">
              <div className="text-sm font-bold text-(--text-primary) font-statement">
                {user.totalSimulations}
              </div>
              <div className="text-[10px] text-(--text-muted) font-inter">
                Sims
              </div>
            </div>
            <div className="text-center">
              <div
                className={`text-sm font-bold font-statement ${
                  completionRate >= 70
                    ? "text-(--success)"
                    : completionRate >= 40
                      ? "text-(--warning)"
                      : "text-(--error)"
                }`}
              >
                {completionRate}%
              </div>
              <div className="text-[10px] text-(--text-muted) font-inter">
                Rate
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-(--text-primary) font-statement">
                {user.totalSolves}
              </div>
              <div className="text-[10px] text-(--text-muted) font-inter">
                Solves
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-(--text-primary) font-statement">
                {user.eventsCount}
              </div>
              <div className="text-[10px] text-(--text-muted) font-inter">
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
          <span className="w-24 text-sm text-(--text-secondary) font-inter truncate">
            {item.country}
          </span>
          <div className="flex-1 h-2 bg-(--surface) rounded-full overflow-hidden">
            <div
              className="h-full bg-(--primary) rounded-full transition-all duration-500"
              style={{ width: `${(item.count / maxCount) * 100}%` }}
            />
          </div>
          <span className="w-10 text-sm text-(--text-primary) font-inter text-right">
            {item.count}
          </span>
          <span className="w-12 text-xs text-(--text-muted) font-inter text-right">
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
          className="h-20 bg-(--surface-elevated) rounded-(--radius-card) animate-pulse border border-(--border)"
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
    {},
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
      <AdminCollapsibleCard
        title="Overview Statistics"
        storageKey="admin-competitions-overview"
        defaultOpen={true}
        headerExtra={
          <button
            onClick={handleExportAnalytics}
            disabled={!analytics}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-(--surface-elevated) hover:bg-(--border) border border-(--border) rounded-(--radius-control) text-(--text-secondary) transition-colors font-inter disabled:opacity-50"
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
              <AdminStatCard
                title="Total Simulations"
                value={analytics.totalSimulations}
                icon={Medal}
                iconColor="text-(--info)"
                iconBgColor="bg-(--info)/10"
              />
              <AdminStatCard
                title="Total Results"
                value={analytics.totalResults}
                icon={BarChart3}
                iconColor="text-(--success)"
                iconBgColor="bg-(--success)/10"
              />
              <AdminStatCard
                title="Total Solves"
                value={analytics.totalSolves}
                icon={Timer}
                iconColor="text-(--accent)"
                iconBgColor="bg-(--accent)/10"
              />
              <AdminStatCard
                title="Unique Comps"
                value={analytics.uniqueCompetitions}
                icon={Trophy}
                iconColor="text-(--warning)"
                iconBgColor="bg-(--warning)/10"
              />
            </div>

            {/* Secondary Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <AdminStatCard
                title="Unique Users"
                value={analytics.uniqueUsers}
                icon={Users}
                iconColor="text-(--primary)"
                iconBgColor="bg-(--primary)/10"
              />
              <AdminStatCard
                title="This Week"
                value={analytics.simulationsThisWeek}
                icon={TrendingUp}
                iconColor="text-(--success)"
                iconBgColor="bg-(--success)/10"
                trend={{
                  value: analytics.weekOverWeekGrowth,
                  label: "vs last week",
                }}
              />
              <AdminStatCard
                title="This Month"
                value={analytics.simulationsThisMonth}
                icon={TrendingUp}
                iconColor="text-(--info)"
                iconBgColor="bg-(--info)/10"
                trend={{
                  value: analytics.monthOverMonthGrowth,
                  label: "vs last month",
                }}
              />
              <AdminStatCard
                title="Avg Events/Sim"
                value={analytics.avgEventsPerSimulation}
                icon={Activity}
                iconColor="text-(--accent)"
                iconBgColor="bg-(--accent)/10"
              />
            </div>

            {/* User Engagement Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <AdminStatCard
                title="Power Users"
                value={analytics.powerUsers}
                icon={Zap}
                iconColor="text-(--warning)"
                iconBgColor="bg-(--warning)/10"
                subValue="5+ simulations"
              />
              <AdminStatCard
                title="Casual Users"
                value={analytics.casualUsers}
                icon={Users}
                iconColor="text-(--text-muted)"
                iconBgColor="bg-(--border)/10"
                subValue="&lt;5 simulations"
              />
              <AdminStatCard
                title="Avg Sims/User"
                value={analytics.avgSimulationsPerUser}
                icon={Percent}
                iconColor="text-(--accent)"
                iconBgColor="bg-(--accent)/10"
              />
              <AdminStatCard
                title="Avg 3x3 Time"
                value={analytics.avgThreeByThreeTime}
                icon={Timer}
                iconColor="text-(--warning)"
                iconBgColor="bg-(--warning)/10"
              />
            </div>
          </div>
        )}
      </AdminCollapsibleCard>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Status Distribution */}
        <AdminCollapsibleCard
          title="Simulation Status"
          storageKey="admin-competitions-status"
          defaultOpen={true}
        >
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-3 bg-(--surface-elevated) rounded-full" />
              <div className="grid grid-cols-3 gap-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-(--surface-elevated) rounded-(--radius-control)"
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
        </AdminCollapsibleCard>

        {/* Weekly Trend */}
        <AdminCollapsibleCard
          title="Weekly Trend"
          storageKey="admin-competitions-trend"
          defaultOpen={true}
        >
          {isLoading ? (
            <div className="h-32 bg-(--surface-elevated) rounded-(--radius-control) animate-pulse" />
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
              <div className="flex items-center justify-center gap-4 mt-3 text-xs text-(--text-muted)">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-2 bg-(--primary)/30 rounded" />
                  <span>Incomplete</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-2 bg-(--primary) rounded" />
                  <span>Completed</span>
                </div>
              </div>
            </>
          )}
        </AdminCollapsibleCard>
      </div>

      {/* Event Analytics */}
      <AdminCollapsibleCard
        title="Event Analytics"
        storageKey="admin-competitions-events"
        defaultOpen={true}
      >
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-12 bg-(--surface-elevated) rounded-(--radius-control)"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-(--text-muted) font-inter uppercase tracking-wide">
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
                  <h4 className="text-sm font-medium text-(--text-muted) font-inter uppercase tracking-wide">
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
      </AdminCollapsibleCard>

      {/* Atmosphere & Country Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Atmosphere Settings */}
        <AdminCollapsibleCard
          title="Atmosphere Settings"
          storageKey="admin-competitions-atmosphere"
          defaultOpen={true}
        >
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-(--surface-elevated) rounded-(--radius-control) animate-pulse"
                />
              ))}
            </div>
          ) : (
            <AtmosphereStats
              stats={analytics.atmosphereStats}
              totalSimulations={analytics.totalSimulations}
            />
          )}
        </AdminCollapsibleCard>

        {/* Country Distribution */}
        <AdminCollapsibleCard
          title="Competition Locations"
          storageKey="admin-competitions-countries"
          defaultOpen={true}
        >
          {isLoading ? (
            <div className="animate-pulse space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-6 bg-(--surface-elevated) rounded" />
              ))}
            </div>
          ) : analytics.topCountries.length > 0 ? (
            <CountryDistribution countries={analytics.topCountries} />
          ) : (
            <p className="text-sm text-(--text-muted) font-inter">
              No location data available
            </p>
          )}
        </AdminCollapsibleCard>
      </div>

      {/* Competitions List */}
      <AdminCollapsibleCard
        title="Competitions"
        storageKey="admin-competitions-list"
        defaultOpen={true}
        headerExtra={
          <SearchInput
            size="sm"
            placeholder="Search..."
            aria-label="Search"
            value={searchQuery}
            onChange={setSearchQuery}
          />
        }
      >
        {competitionsList === undefined ? (
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-(--surface-elevated) rounded-(--radius-control)"
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
              <p className="text-center text-sm text-(--text-muted) font-inter pt-2">
                Showing 15 of {filteredCompetitions.length} competitions
              </p>
            )}
          </div>
        ) : (
          <p className="text-center text-sm text-(--text-muted) font-inter py-8">
            {searchQuery
              ? "No competitions match your search"
              : "No competitions found"}
          </p>
        )}
      </AdminCollapsibleCard>

      {/* User Activity & Recent Simulations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Top Users */}
        <AdminCollapsibleCard
          title="Top Users by Activity"
          storageKey="admin-competitions-users"
          defaultOpen={true}
        >
          {userActivity === undefined ? (
            <div className="animate-pulse space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 bg-(--surface-elevated) rounded-(--radius-control)"
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
            <p className="text-sm text-(--text-muted) font-inter">
              No user activity data
            </p>
          )}
        </AdminCollapsibleCard>

        {/* Recent Simulations */}
        <AdminCollapsibleCard
          title="Recent Simulations"
          storageKey="admin-competitions-recent"
          defaultOpen={true}
        >
          {recentSimulations === undefined ? (
            <div className="animate-pulse space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 bg-(--surface-elevated) rounded-(--radius-control)"
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
            <p className="text-sm text-(--text-muted) font-inter">
              No recent simulations
            </p>
          )}
        </AdminCollapsibleCard>
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
