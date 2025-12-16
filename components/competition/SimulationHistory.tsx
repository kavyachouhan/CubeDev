"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Clock,
  Trophy,
  ChevronRight,
  Play,
  Pause,
  Check,
  AlertTriangle,
  History,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@/components/UserProvider";
import { WCA_EVENTS } from "./CompetitionBrowser";
import { formatTime } from "@/lib/stats-utils";
import { SimulationHistorySkeleton } from "@/components/SkeletonLoaders";

// Helper to get max rounds for an event (matches SimulationRunner logic)
const getMaxRounds = (eventId: string): number => {
  const majorEvents = ["333", "222", "444", "333oh", "pyram", "skewb"];
  return majorEvents.includes(eventId) ? 3 : 2;
};

// Calculate total rounds for a simulation
const getTotalRounds = (selectedEvents: string[]): number => {
  return selectedEvents.reduce(
    (total, eventId) => total + getMaxRounds(eventId),
    0
  );
};

// Calculate completed rounds from eventProgress
const getCompletedRounds = (
  eventProgress: Record<string, number> | undefined
): number => {
  if (!eventProgress) return 0;
  return Object.values(eventProgress).reduce(
    (total, rounds) => total + (rounds || 0),
    0
  );
};

interface SimulationHistoryProps {
  limit?: number;
  showTitle?: boolean;
  compact?: boolean;
}

export default function SimulationHistory({
  limit = 5,
  showTitle = true,
  compact = false,
}: SimulationHistoryProps) {
  const { user } = useUser();

  // Fetch recent simulations
  const recentSimulations = useQuery(
    api.competitionSimulations.getUserRecentSimulations,
    user?.wcaId ? { wcaId: user.wcaId, limit } : "skip"
  );

  // Fetch in-progress simulations
  const inProgressSimulations = useQuery(
    api.competitionSimulations.getInProgressSimulations,
    user?.wcaId ? { wcaId: user.wcaId } : "skip"
  );

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in-progress":
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/30">
            <Pause className="w-3 h-3" />
            In Progress
          </span>
        );
      case "completed":
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/30">
            <Check className="w-3 h-3" />
            Completed
          </span>
        );
      case "abandoned":
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-[var(--text-muted)]/10 text-[var(--text-muted)] border border-[var(--text-muted)]/30">
            <AlertTriangle className="w-3 h-3" />
            Abandoned
          </span>
        );
      default:
        return null;
    }
  };

  // Show skeleton while loading
  if (recentSimulations === undefined) {
    return <SimulationHistorySkeleton />;
  }

  if (recentSimulations.length === 0) {
    return (
      <div className={`timer-card ${compact ? "p-3" : ""}`}>
        {showTitle && (
          <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-[var(--primary)]" />
            Recent Simulations
          </h3>
        )}
        <div className="text-center py-8">
          <History className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
          <h4 className="text-sm font-medium text-[var(--text-primary)] mb-1">
            No Simulations Yet
          </h4>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            Start practicing for an upcoming competition
          </p>
          <Link
            href="/cube-lab/competitions"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
          >
            <Play className="w-3 h-3" />
            Browse Competitions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`timer-card ${compact ? "p-3" : ""}`}>
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--primary)]" />
            Recent Simulations
          </h3>
          {recentSimulations.length > 3 && (
            <Link
              href="/cube-lab/competitions?tab=history"
              className="text-xs text-[var(--primary)] hover:underline"
            >
              View All
            </Link>
          )}
        </div>
      )}

      <div className="space-y-2">
        {recentSimulations.slice(0, limit).map((sim: any) => {
          const isInProgress = sim.status === "in-progress";
          const totalRounds = getTotalRounds(sim.selectedEvents || []);
          const completedRounds = getCompletedRounds(sim.eventProgress);
          const progress =
            totalRounds > 0
              ? Math.round((completedRounds / totalRounds) * 100)
              : 0;

          return (
            <Link
              key={sim._id}
              href={`/cube-lab/competitions/${sim.competitionId}/simulate/${sim._id}`}
              className="block p-3 rounded-lg border border-[var(--border)] hover:border-[var(--primary)]/50 bg-[var(--surface)] hover:bg-[var(--surface-elevated)] transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-[var(--text-primary)] text-sm truncate">
                      {sim.competitionName}
                    </span>
                    {getStatusBadge(sim.status)}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-muted)]">
                    <span>{formatDate(sim.startedAt)}</span>
                    <span>
                      {completedRounds}/{totalRounds} rounds
                    </span>
                  </div>

                  {/* Event icons */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(sim.selectedEvents as string[])
                      .slice(0, 6)
                      .map((eventId: string) => {
                        const event = WCA_EVENTS.find((e) => e.id === eventId);
                        const isCompleted =
                          sim.completedEvents?.includes(eventId);
                        return event ? (
                          <div
                            key={eventId}
                            className={`p-1 rounded ${
                              isCompleted
                                ? "bg-[var(--success)]/20"
                                : "bg-[var(--surface-elevated)]"
                            }`}
                            title={`${event.name}${isCompleted ? " (completed)" : ""}`}
                          >
                            <Image
                              src={event.icon}
                              alt={event.name}
                              width={14}
                              height={14}
                              className={`invert ${isCompleted ? "opacity-100" : "opacity-60"}`}
                            />
                          </div>
                        ) : null;
                      })}
                    {sim.selectedEvents.length > 6 && (
                      <span className="px-1.5 text-[10px] text-[var(--text-muted)] bg-[var(--surface-elevated)] rounded flex items-center">
                        +{sim.selectedEvents.length - 6}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isInProgress && (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--primary)] transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-[var(--text-muted)]">
                        {progress}%
                      </span>
                    </div>
                  )}
                  {sim.status === "completed" && (
                    <span className="text-xs text-[var(--success)]">
                      View Results
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Continue in-progress simulations */}
      {inProgressSimulations && inProgressSimulations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--text-muted)] mb-2">
            You have {inProgressSimulations.length} simulation
            {inProgressSimulations.length > 1 ? "s" : ""} in progress
          </p>
          <Link
            href={`/cube-lab/competitions/${inProgressSimulations[0].competitionId}/simulate/${inProgressSimulations[0]._id}`}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[var(--primary)] border border-[var(--primary)] rounded-lg hover:bg-[var(--primary)]/10 transition-colors"
          >
            <Play className="w-3 h-3" />
            Continue
          </Link>
        </div>
      )}
    </div>
  );
}
