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
import { useTheme } from "@/lib/theme-context";

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
  const { effectiveTheme } = useTheme();
  const userIdentifier = user?.wcaId;
  const canFetchSimulations = !!userIdentifier;
  const isDarkTheme = effectiveTheme === "dark";

  // Fetch recent simulations
  const recentSimulations = useQuery(
    api.competitionSimulations.getUserRecentSimulations,
    canFetchSimulations && userIdentifier
      ? { wcaId: userIdentifier, limit }
      : "skip",
  );

  // Fetch in-progress simulations
  const inProgressSimulations = useQuery(
    api.competitionSimulations.getInProgressSimulations,
    canFetchSimulations && userIdentifier ? { wcaId: userIdentifier } : "skip",
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
            Sign In Required
          </h4>
          <p className="text-xs text-(--text-muted) mb-4">
            Sign in to unlock competition simulations.
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
    <div className={`${compact ? "p-3" : ""}`}>
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
              className="group timer-card block hover:border-(--primary)/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary) focus-visible:ring-offset-2 focus-visible:ring-offset-(--surface)"
            >
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <h4 className="line-clamp-2 text-sm font-semibold text-(--text-primary) transition-colors group-hover:text-(--primary) sm:text-base md:text-lg">
                      {sim.competitionName}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2">
                      {getStatusBadge(sim.status)}
                      <span className="inline-flex items-center rounded-full border border-(--border) bg-(--surface-elevated) px-2 py-0.5 text-xs font-medium text-(--text-secondary)">
                        {completedRounds}/{totalRounds} rounds
                      </span>
                    </div>
                  </div>

                  <span className="inline-flex min-h-9 min-w-10 items-center justify-center gap-1.5 rounded-lg bg-(--primary) px-3 py-2 text-xs font-semibold text-white transition-colors group-hover:bg-(--primary-hover) sm:min-w-28 sm:px-4 sm:text-sm">
                    <Play className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">
                      {isInProgress ? "Continue" : "Open"}
                    </span>
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                  <span className="inline-flex min-w-0 items-center gap-1.5 rounded-lg border border-(--border) bg-(--surface-elevated) px-2.5 py-2 text-xs text-(--text-secondary) sm:text-sm">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-(--text-muted)" />
                    <span className="truncate">
                      {formatDate(sim.startedAt)}
                    </span>
                  </span>
                  <span className="inline-flex min-w-0 items-center gap-1.5 rounded-lg border border-(--border) bg-(--surface-elevated) px-2.5 py-2 text-xs text-(--text-secondary) sm:text-sm">
                    <Trophy className="h-3.5 w-3.5 shrink-0 text-(--text-muted)" />
                    <span className="truncate">
                      {sim.status === "completed"
                        ? `Best ${formatTime(sim.bestTime || 0)}`
                        : `${progress}% complete`}
                    </span>
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 border-t border-(--border) pt-3 sm:gap-2 sm:pt-4">
                  {(sim.selectedEvents as string[])
                    .slice(0, 6)
                    .map((eventId: string) => {
                      const event = WCA_EVENTS.find((e) => e.id === eventId);
                      const isCompleted =
                        sim.completedEvents?.includes(eventId);
                      return event ? (
                        <div
                          key={eventId}
                          className={`rounded-md border p-1.5 ${
                            isCompleted
                              ? "border-(--success)/40 bg-(--success)/10"
                              : "border-(--border) bg-(--surface-elevated)"
                          }`}
                          title={`${event.name}${isCompleted ? " (completed)" : ""}`}
                        >
                          <Image
                            src={event.icon}
                            alt={event.name}
                            width={16}
                            height={16}
                            className={`h-4 w-4 ${
                              isDarkTheme ? "invert" : ""
                            } ${isCompleted ? "opacity-100" : "opacity-70"}`}
                          />
                        </div>
                      ) : null;
                    })}
                  {sim.selectedEvents.length > 6 && (
                    <span className="inline-flex items-center rounded-md border border-(--border) bg-(--surface-elevated) px-2 py-1 text-xs font-medium text-(--text-muted)">
                      +{sim.selectedEvents.length - 6}
                    </span>
                  )}
                </div>

                {isInProgress && (
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-(--surface-elevated) overflow-hidden">
                      <div
                        className="h-full bg-(--primary) transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-(--text-muted)">
                      {progress}%
                    </span>
                  </div>
                )}

                {sim.status === "completed" && (
                  <div className="flex items-center justify-end">
                    <span className="text-xs font-medium text-(--success)">
                      View Results
                    </span>
                    <ChevronRight className="ml-1 h-4 w-4 text-(--text-muted) transition-colors group-hover:text-(--primary)" />
                  </div>
                )}
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
