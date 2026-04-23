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

const WCA_PERSON_ID_REGEX = /^\d{4}[A-Z]{4}\d{2}$/;
const hasLinkedWcaId = (identifier?: string): identifier is string =>
  !!identifier && WCA_PERSON_ID_REGEX.test(identifier.toUpperCase());

// Helper to get max rounds for an event, with fallback for older simulations
const getMaxRoundsWithFallback = (
  eventId: string,
  eventRounds?: Record<string, number> | null,
): number => {
  // Use stored eventRounds if available
  if (eventRounds && typeof eventRounds === "object") {
    const rounds = eventRounds[eventId];
    if (typeof rounds === "number" && rounds > 0) {
      return rounds;
    }
  }
  // Fallback for older simulations without eventRounds data
  const majorEvents = ["333", "222", "444", "333oh", "pyram", "skewb"];
  return majorEvents.includes(eventId) ? 3 : 2;
};

// Calculate total rounds for a simulation using stored eventRounds or fallback
const getTotalRounds = (
  selectedEvents: string[],
  eventRounds?: Record<string, number> | null,
): number => {
  return selectedEvents.reduce(
    (total, eventId) => total + getMaxRoundsWithFallback(eventId, eventRounds),
    0,
  );
};

// Calculate completed rounds from eventProgress
const getCompletedRounds = (
  eventProgress: Record<string, number> | undefined,
): number => {
  if (!eventProgress) return 0;
  return Object.values(eventProgress).reduce(
    (total, rounds) => total + (rounds || 0),
    0,
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
  const canFetchSimulations = hasLinkedWcaId(user?.wcaId);

  // Fetch recent simulations
  const recentSimulations = useQuery(
    api.competitionSimulations.getUserRecentSimulations,
    canFetchSimulations && user?.wcaId ? { wcaId: user.wcaId, limit } : "skip",
  );

  // Fetch in-progress simulations
  const inProgressSimulations = useQuery(
    api.competitionSimulations.getInProgressSimulations,
    canFetchSimulations && user?.wcaId ? { wcaId: user.wcaId } : "skip",
  );

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
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
          <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-(--warning)/10 text-(--warning) border border-(--warning)/30">
            <Pause className="w-3 h-3" />
            In Progress
          </span>
        );
      case "completed":
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-(--success)/10 text-(--success) border border-(--success)/30">
            <Check className="w-3 h-3" />
            Completed
          </span>
        );
      case "abandoned":
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-(--text-muted)/10 text-(--text-muted) border border-(--text-muted)/30">
            <AlertTriangle className="w-3 h-3" />
            Abandoned
          </span>
        );
      default:
        return null;
    }
  };

  // Show skeleton while loading
  if (canFetchSimulations && recentSimulations === undefined) {
    return <SimulationHistorySkeleton />;
  }

  if (!canFetchSimulations) {
    return (
      <div className={`timer-card ${compact ? "p-3" : ""}`}>
        {showTitle && (
          <h3 className="font-bold text-(--text-primary) flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-(--primary)" />
            Recent Simulations
          </h3>
        )}
        <div className="text-center py-8">
          <AlertTriangle className="w-10 h-10 text-(--text-muted) mx-auto mb-3" />
          <h4 className="text-sm font-medium text-(--text-primary) mb-1">
            WCA ID Required
          </h4>
          <p className="text-xs text-(--text-muted) mb-4">
            Link your WCA ID in Settings to unlock competition simulations.
          </p>
          <Link
            href="/me"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-(--primary) text-white rounded-lg hover:bg-(--primary-hover) transition-colors"
          >
            Open Settings
          </Link>
        </div>
      </div>
    );
  }

  const safeRecentSimulations = recentSimulations ?? [];

  if (safeRecentSimulations.length === 0) {
    return (
      <div className={`timer-card ${compact ? "p-3" : ""}`}>
        {showTitle && (
          <h3 className="font-bold text-(--text-primary) flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-(--primary)" />
            Recent Simulations
          </h3>
        )}
        <div className="text-center py-8">
          <History className="w-10 h-10 text-(--text-muted) mx-auto mb-3" />
          <h4 className="text-sm font-medium text-(--text-primary) mb-1">
            No Simulations Yet
          </h4>
          <p className="text-xs text-(--text-muted) mb-4">
            Start practicing for an upcoming competition
          </p>
          <Link
            href="/cube-lab/competitions"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-(--primary) text-white rounded-lg hover:bg-(--primary-hover) transition-colors"
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
          <h3 className="font-bold text-(--text-primary) flex items-center gap-2">
            <Clock className="w-4 h-4 text-(--primary)" />
            Recent Simulations
          </h3>
          {safeRecentSimulations.length > 3 && (
            <Link
              href="/cube-lab/competitions?tab=history"
              className="text-xs text-(--primary) hover:underline"
            >
              View All
            </Link>
          )}
        </div>
      )}

      <div className="space-y-2">
        {safeRecentSimulations.slice(0, limit).map((sim: any) => {
          const isInProgress = sim.status === "in-progress";
          const totalRounds = getTotalRounds(
            sim.selectedEvents || [],
            sim.eventRounds,
          );
          const completedRounds = getCompletedRounds(sim.eventProgress);
          const progress =
            totalRounds > 0
              ? Math.round((completedRounds / totalRounds) * 100)
              : 0;

          return (
            <Link
              key={sim._id}
              href={`/cube-lab/competitions/${sim.competitionId}/simulate/${sim._id}`}
              className="block p-3 rounded-lg border border-(--border) hover:border-(--primary)/50 bg-(--surface) hover:bg-(--surface-elevated) transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-(--text-primary) text-sm truncate">
                      {sim.competitionName}
                    </span>
                    {getStatusBadge(sim.status)}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-(--text-muted)">
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
                                ? "bg-(--success)/20"
                                : "bg-(--surface-elevated)"
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
                      <span className="px-1.5 text-[10px] text-(--text-muted) bg-(--surface-elevated) rounded flex items-center">
                        +{sim.selectedEvents.length - 6}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isInProgress && (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-(--surface-elevated) rounded-full overflow-hidden">
                        <div
                          className="h-full bg-(--primary) transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-(--text-muted)">
                        {progress}%
                      </span>
                    </div>
                  )}
                  {sim.status === "completed" && (
                    <span className="text-xs text-(--success)">
                      View Results
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-(--text-muted) group-hover:text-(--primary) transition-colors" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Continue in-progress simulations */}
      {inProgressSimulations && inProgressSimulations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-(--border)">
          <p className="text-xs text-(--text-muted) mb-2">
            You have {inProgressSimulations.length} simulation
            {inProgressSimulations.length > 1 ? "s" : ""} in progress
          </p>
          <Link
            href={`/cube-lab/competitions/${inProgressSimulations[0].competitionId}/simulate/${inProgressSimulations[0]._id}`}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-(--primary) border border-(--primary) rounded-lg hover:bg-(--primary)/10 transition-colors"
          >
            <Play className="w-3 h-3" />
            Continue
          </Link>
        </div>
      )}
    </div>
  );
}
