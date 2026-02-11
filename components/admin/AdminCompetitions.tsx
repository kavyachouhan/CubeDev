"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Medal,
  Trophy,
  CheckCircle2,
  Clock,
  Calendar,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  BarChart3,
  Activity,
  Layers,
} from "lucide-react";

// CollapsibleCard Component
function CollapsibleCard({
  title,
  children,
  defaultOpen = true,
  storageKey,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  storageKey?: string;
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
    <div className="timer-card">
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
        <button
          onClick={toggleOpen}
          className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-md transition-colors"
        >
          {isOpen ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
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
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconColor?: string;
  iconBgColor?: string;
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
          <div className="text-sm sm:text-lg font-bold text-[var(--text-primary)] font-statement">
            {typeof value === "number" ? value.toLocaleString() : value}
          </div>
        </div>
      </div>
    </div>
  );
}

// Event Popularity Chart
function EventPopularityChart({
  events,
}: {
  events: Array<{ event: string; count: number }>;
}) {
  const maxCount =
    events.length > 0 ? Math.max(...events.map((e) => e.count)) : 1;

  const getEventName = (event: string) => {
    const eventNames: Record<string, string> = {
      "333": "3x3x3",
      "222": "2x2x2",
      "444": "4x4x4",
      "555": "5x5x5",
      "666": "6x6x6",
      "777": "7x7x7",
      "333bf": "3BLD",
      "333oh": "3x3 OH",
      pyram: "Pyraminx",
      skewb: "Skewb",
      sq1: "Square-1",
      clock: "Clock",
      minx: "Megaminx",
    };
    return eventNames[event] || event;
  };

  const getEventColor = (index: number) => {
    const colors = [
      "var(--primary)",
      "var(--success)",
      "var(--warning)",
      "var(--error)",
      "var(--accent)",
    ];
    return colors[index % colors.length];
  };

  return (
    <>
      {events.length === 0 ? (
        <p className="text-[var(--text-muted)] font-inter text-sm">
          No event data available
        </p>
      ) : (
        <div className="space-y-3">
          {events.map((event, index) => (
            <div key={event.event}>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-[var(--text-secondary)] font-inter">
                  {getEventName(event.event)}
                </span>
                <span className="text-sm font-medium text-[var(--text-primary)] font-inter">
                  {event.count} simulations
                </span>
              </div>
              <div className="h-3 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(event.count / maxCount) * 100}%`,
                    backgroundColor: getEventColor(index),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// Status Distribution Component
function StatusDistribution({
  byStatus,
}: {
  byStatus: { inProgress: number; completed: number; abandoned: number };
}) {
  const total = byStatus.inProgress + byStatus.completed + byStatus.abandoned;

  const segments = [
    {
      key: "completed",
      value: byStatus.completed,
      color: "var(--success)",
      label: "Completed",
    },
    {
      key: "inProgress",
      value: byStatus.inProgress,
      color: "var(--warning)",
      label: "In Progress",
    },
    {
      key: "abandoned",
      value: byStatus.abandoned,
      color: "var(--error)",
      label: "Abandoned",
    },
  ];

  return (
    <>
      {/* Horizontal stacked bar */}
      <div className="h-4 bg-[var(--surface-elevated)] rounded-full overflow-hidden flex mb-4">
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
      <div className="grid grid-cols-3 gap-4">
        {segments.map((segment) => (
          <div key={segment.key} className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-xs text-[var(--text-muted)] font-inter">
                {segment.label}
              </span>
            </div>
            <p className="text-lg font-bold text-[var(--text-primary)] font-statement">
              {segment.value}
            </p>
            <p className="text-xs text-[var(--text-muted)] font-inter">
              {total > 0 ? ((segment.value / total) * 100).toFixed(1) : 0}%
            </p>
          </div>
        ))}
      </div>
    </>
  );
}

export default function AdminCompetitions() {
  const competitionStats = useQuery(api.admin.getCompetitionStats);

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] font-statement">
          Competitions
        </h1>
        <p className="mt-1 text-[var(--text-muted)] font-inter">
          Competition simulation statistics
        </p>
      </div>

      {/* Overview Stats */}
      <CollapsibleCard
        title="Overview Statistics"
        storageKey="admin-competitions-overview"
        defaultOpen={true}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {competitionStats === undefined ? (
            [...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)] animate-pulse"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[var(--surface)] rounded-lg" />
                  <div className="flex-1">
                    <div className="h-3 w-16 bg-[var(--surface)] rounded mb-2" />
                    <div className="h-5 w-12 bg-[var(--surface)] rounded" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <>
              <StatCard
                title="Total Simulations"
                value={competitionStats.totalSimulations}
                icon={Medal}
                iconColor="text-blue-500"
                iconBgColor="bg-blue-500/10"
              />
              <StatCard
                title="Completed"
                value={competitionStats.byStatus.completed}
                icon={CheckCircle2}
                iconColor="text-green-500"
                iconBgColor="bg-green-500/10"
              />
              <StatCard
                title="In Progress"
                value={competitionStats.byStatus.inProgress}
                icon={Clock}
                iconColor="text-yellow-500"
                iconBgColor="bg-yellow-500/10"
              />
              <StatCard
                title="Unique Comps"
                value={competitionStats.uniqueCompetitions}
                icon={Trophy}
                iconColor="text-purple-500"
                iconBgColor="bg-purple-500/10"
              />
            </>
          )}
        </div>
      </CollapsibleCard>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 items-start">
        <CollapsibleCard
          title="Popular Events"
          storageKey="admin-competitions-events"
          defaultOpen={true}
        >
          {competitionStats === undefined ? (
            <div className="animate-pulse space-y-3">
              {[...Array(5)].map((_, j) => (
                <div key={j}>
                  <div className="flex justify-between mb-1">
                    <div className="h-4 w-20 bg-[var(--surface-elevated)] rounded" />
                    <div className="h-4 w-16 bg-[var(--surface-elevated)] rounded" />
                  </div>
                  <div className="h-3 bg-[var(--surface-elevated)] rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <EventPopularityChart events={competitionStats.popularEvents} />
          )}
        </CollapsibleCard>

        <CollapsibleCard
          title="Simulation Status"
          storageKey="admin-competitions-status"
          defaultOpen={true}
        >
          {competitionStats === undefined ? (
            <div className="animate-pulse">
              <div className="h-4 bg-[var(--surface-elevated)] rounded-full mb-4" />
              <div className="grid grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="text-center">
                    <div className="h-3 w-16 mx-auto bg-[var(--surface-elevated)] rounded mb-2" />
                    <div className="h-6 w-8 mx-auto bg-[var(--surface-elevated)] rounded" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <StatusDistribution byStatus={competitionStats.byStatus} />
          )}
        </CollapsibleCard>
      </div>

      {/* Feature Overview */}
      <div className="mt-6">
        <CollapsibleCard
          title="Competition Simulation Features"
          storageKey="admin-competitions-features"
          defaultOpen={true}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[var(--surface-elevated)] rounded-lg p-4 text-center border border-[var(--border)]">
              <div className="p-2 bg-blue-500/10 rounded-lg w-fit mx-auto mb-2">
                <Trophy className="w-6 h-6 text-blue-500" />
              </div>
              <p className="text-sm font-medium text-[var(--text-primary)] font-inter">
                Real Competitions
              </p>
              <p className="text-xs text-[var(--text-muted)] font-inter mt-1">
                Simulate actual WCA events
              </p>
            </div>
            <div className="bg-[var(--surface-elevated)] rounded-lg p-4 text-center border border-[var(--border)]">
              <div className="p-2 bg-green-500/10 rounded-lg w-fit mx-auto mb-2">
                <Calendar className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-sm font-medium text-[var(--text-primary)] font-inter">
                Multi-Event
              </p>
              <p className="text-xs text-[var(--text-muted)] font-inter mt-1">
                Practice multiple events
              </p>
            </div>
            <div className="bg-[var(--surface-elevated)] rounded-lg p-4 text-center border border-[var(--border)]">
              <div className="p-2 bg-yellow-500/10 rounded-lg w-fit mx-auto mb-2">
                <TrendingUp className="w-6 h-6 text-yellow-500" />
              </div>
              <p className="text-sm font-medium text-[var(--text-primary)] font-inter">
                Atmosphere Settings
              </p>
              <p className="text-xs text-[var(--text-muted)] font-inter mt-1">
                Crowd noise, pressure, distractions
              </p>
            </div>
            <div className="bg-[var(--surface-elevated)] rounded-lg p-4 text-center border border-[var(--border)]">
              <div className="p-2 bg-red-500/10 rounded-lg w-fit mx-auto mb-2">
                <Medal className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-sm font-medium text-[var(--text-primary)] font-inter">
                Results Tracking
              </p>
              <p className="text-xs text-[var(--text-muted)] font-inter mt-1">
                Save and compare performances
              </p>
            </div>
          </div>
        </CollapsibleCard>
      </div>
    </div>
  );
}
