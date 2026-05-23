"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  MapPin,
  ChevronRight,
  Play,
  CircleCheck,
  AlertCircle,
  Trophy,
  RefreshCw,
} from "lucide-react";
import { useUser } from "@/components/UserProvider";
import { WCA_EVENTS } from "./CompetitionBrowser";
import {
  formatCompetitionDateRange,
  getLocalTodayStart,
  parseCompetitionDate,
} from "@/lib/date-utils";
import { isWcaIdentifier } from "@/lib/identifier-utils";
import { RegisteredCompetitionsSkeleton } from "@/components/SkeletonLoaders";
import { getFromCacheWithStaleCheck, saveToCache } from "@/lib/wca-cache";
import { useTheme } from "@/lib/theme-context";

type RegistrationStatus = "accepted" | "pending" | "waitlisted";

interface UpcomingCompetition {
  id: string;
  name: string;
  city: string;
  country_iso2: string;
  start_date: string;
  end_date: string;
  event_ids?: string[];
  registrationStatus?: RegistrationStatus;
}

// Cache key for registered competitions
const getRegisteredCacheKey = (wcaId: string) => `registered_comps_v2_${wcaId}`;

export default function UpcomingCompetitionsSuggestions() {
  const { user } = useUser();
  const { effectiveTheme } = useTheme();
  const [competitions, setCompetitions] = useState<UpcomingCompetition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUpcoming = useCallback(
    async (forceRefresh = false) => {
      const linkedWcaId = user?.wcaId;

      if (!isWcaIdentifier(linkedWcaId)) {
        setIsLoading(false);
        return;
      }

      const cacheKey = getRegisteredCacheKey(linkedWcaId);

      // Check cache first
      const { data: cached, isStale } = getFromCacheWithStaleCheck<
        UpcomingCompetition[]
      >(
        cacheKey,
        15 * 60 * 1000, // 15 minutes stale threshold
      );

      // Use cached data if fresh
      if (cached && !isStale && !forceRefresh) {
        setCompetitions(cached);
        setIsLoading(false);

        // If data is stale but we have it, show it while we refresh in background. Only set refreshing state if we have something to show, otherwise it will just show a loading state.
        if (cached.length > 0) {
          return;
        }

        setIsRefreshing(true);
      }

      // Use stale data while refreshing in background
      if (cached && isStale && !forceRefresh) {
        setCompetitions(cached);
        setIsLoading(false);
        setIsRefreshing(true);
      } else if (!cached) {
        setIsLoading(true);
      }

      try {
        setError(null);

        const response = await fetch(
          `/api/competition/upcoming?wcaId=${encodeURIComponent(linkedWcaId)}`,
        );

        if (!response.ok) {
          const data = await response.json();
          // Only show error if we don't have cached data
          if (!cached) {
            setError(data.error || "Could not load upcoming competitions");
          }
          return;
        }

        const data = await response.json();
        if (data.success) {
          const nextCompetitions = Array.isArray(data.competitions)
            ? data.competitions
            : [];

          setCompetitions(nextCompetitions);
          // Cache the data for 24 hours
          saveToCache(cacheKey, nextCompetitions, 24 * 60 * 60 * 1000);
        }
      } catch (err) {
        console.error("Failed to fetch upcoming competitions:", err);
        // Only show error if we don't have cached data
        if (!cached) {
          setError("Failed to load upcoming competitions");
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user?.wcaId],
  );

  useEffect(() => {
    fetchUpcoming();
  }, [fetchUpcoming]);

  const handleRefresh = () => {
    fetchUpcoming(true);
  };

  const getDaysUntil = (startDate: string): number => {
    const start = parseCompetitionDate(startDate);
    const today = getLocalTodayStart();
    const startDay = Date.UTC(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
    );
    const todayDay = Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    return Math.round((startDay - todayDay) / (1000 * 60 * 60 * 24));
  };

  const getRegistrationStatusLabel = (status?: RegistrationStatus): string => {
    switch (status) {
      case "pending":
        return "Pending";
      case "waitlisted":
        return "Waitlist";
      default:
        return "Accepted";
    }
  };

  const getRegistrationStatusClasses = (
    status?: RegistrationStatus,
  ): string => {
    switch (status) {
      case "pending":
        return "bg-(--warning)/10 text-(--warning) border-(--warning)/30";
      case "waitlisted":
        return "bg-(--text-muted)/10 text-(--text-muted) border-(--border)";
      default:
        return "bg-(--success)/10 text-(--success) border-(--success)/30";
    }
  };

  const getCountdownText = (startDate: string): string => {
    const days = getDaysUntil(startDate);
    if (days < 0) return "Ongoing";
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    if (days <= 7) return `${days} days`;
    if (days <= 30) {
      const weeks = Math.floor(days / 7);
      return `${weeks} week${weeks > 1 ? "s" : ""}`;
    }
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? "s" : ""}`;
  };

  const getCountdownClasses = (startDate: string): string => {
    const daysUntil = getDaysUntil(startDate);

    if (daysUntil < 0) {
      return "bg-(--success)/10 text-(--success) border-(--success)/30";
    }

    if (daysUntil <= 7) {
      return "bg-(--warning)/10 text-(--warning) border-(--warning)/30";
    }

    return "bg-(--surface-elevated) text-(--text-muted) border-(--border)";
  };

  const isDarkTheme = effectiveTheme === "dark";
  const actionButtonClasses =
    "inline-flex items-center gap-2 rounded-lg bg-(--primary) px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-(--primary-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary) focus-visible:ring-offset-2 focus-visible:ring-offset-(--surface)";

  // Loading state
  if (isLoading) {
    return <RegisteredCompetitionsSkeleton />;
  }

  // Not logged in
  if (!isWcaIdentifier(user?.wcaId)) {
    return (
      <div className="timer-card">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-(--text-muted) mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-(--text-primary) mb-2">
            WCA ID Required
          </h3>
          <p className="text-sm text-(--text-secondary) mb-4">
            Link your WCA ID from Settings to see your registered competitions.
          </p>
          <Link href="/me" className={actionButtonClasses}>
            Open Settings
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="timer-card">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-(--error) mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-(--text-primary) mb-2">
            Unable to Load
          </h3>
          <p className="text-sm text-(--text-secondary) mb-4">{error}</p>
          <button onClick={handleRefresh} className={actionButtonClasses}>
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No competitions
  if (competitions.length === 0) {
    return (
      <div className="timer-card">
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 text-(--text-muted) mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-(--text-primary) mb-2">
            No Upcoming Competitions
          </h3>
          <p className="text-sm text-(--text-secondary) mb-4">
            You&apos;re not registered for any upcoming wca competitions yet.
          </p>
          <Link
            href="/cube-lab/competitions?tab=browse"
            className={actionButtonClasses}
          >
            Browse Competitions
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="space-y-3 border-b border-(--border) pb-4 sm:space-y-4 sm:pb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <div className="flex items-center gap-2">
              <CircleCheck className="h-5 w-5 shrink-0 text-(--primary)" />
              <h2 className="text-base font-semibold text-(--text-primary) sm:text-lg md:text-xl">
                Your Registered Competitions
              </h2>
            </div>
            <p className="max-w-2xl text-sm text-(--text-secondary) sm:text-base">
              Practice for your upcoming competitions by running simulations.
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2 self-start">
            <span className="inline-flex items-center rounded-lg border border-(--border) bg-(--surface-elevated) px-2.5 py-1.5 text-xs font-medium text-(--text-secondary) sm:px-3 sm:py-2 sm:text-sm">
              {competitions.length} competition
              {competitions.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-(--border) bg-(--surface-elevated) text-(--text-secondary) transition-colors hover:border-(--primary) hover:text-(--primary) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary) focus-visible:ring-offset-2 focus-visible:ring-offset-(--surface) disabled:cursor-not-allowed disabled:opacity-50"
              title="Refresh registered competitions"
              aria-label="Refresh registered competitions"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Competition Cards */}
      <div className="grid gap-3 sm:gap-4 md:gap-5">
        {competitions.map((comp) => {
          const registrationStatus = comp.registrationStatus;

          return (
            <Link
              key={comp.id}
              href={`/cube-lab/competitions/${comp.id}`}
              className="group timer-card block hover:border-(--primary)/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary) focus-visible:ring-offset-2 focus-visible:ring-offset-(--surface)"
            >
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <h3 className="line-clamp-2 text-sm font-semibold text-(--text-primary) transition-colors group-hover:text-(--primary) sm:text-base md:text-lg">
                      {comp.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getRegistrationStatusClasses(registrationStatus)}`}
                      >
                        {getRegistrationStatusLabel(registrationStatus)}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getCountdownClasses(comp.start_date)}`}
                      >
                        {getCountdownText(comp.start_date)}
                      </span>
                    </div>
                  </div>

                  <span className="inline-flex min-h-9 min-w-10 items-center justify-center gap-1.5 rounded-lg bg-(--primary) px-3 py-2 text-xs font-semibold text-white transition-colors group-hover:bg-(--primary-hover) sm:min-w-28 sm:px-4 sm:text-sm">
                    <Play className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Simulate</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                  <span className="inline-flex min-w-0 items-center gap-1.5 rounded-lg border border-(--border) bg-(--surface-elevated) px-2.5 py-2 text-xs text-(--text-secondary) sm:text-sm">
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-(--text-muted)" />
                    <span className="truncate">
                      {formatCompetitionDateRange(
                        comp.start_date,
                        comp.end_date,
                      )}
                    </span>
                  </span>
                  <span className="inline-flex min-w-0 items-center gap-1.5 rounded-lg border border-(--border) bg-(--surface-elevated) px-2.5 py-2 text-xs text-(--text-secondary) sm:text-sm">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-(--text-muted)" />
                    <span className="truncate">
                      {comp.city}, {comp.country_iso2}
                    </span>
                  </span>
                </div>

                {/* Event icons */}
                {comp.event_ids && comp.event_ids.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 border-t border-(--border) pt-3 sm:gap-2 sm:pt-4">
                    {comp.event_ids.slice(0, 10).map((eventId) => {
                      const event = WCA_EVENTS.find((e) => e.id === eventId);
                      return event ? (
                        <div
                          key={eventId}
                          title={event.name}
                          className="rounded-md border border-(--border) bg-(--surface-elevated) p-1.5"
                        >
                          <Image
                            src={event.icon}
                            alt={event.name}
                            width={16}
                            height={16}
                            className={`h-4 w-4 ${
                              isDarkTheme ? "invert opacity-80" : "opacity-80"
                            }`}
                          />
                        </div>
                      ) : null;
                    })}
                    {comp.event_ids.length > 10 && (
                      <span className="inline-flex items-center rounded-md border border-(--border) bg-(--surface-elevated) px-2 py-1 text-xs font-medium text-(--text-muted)">
                        +{comp.event_ids.length - 10}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
