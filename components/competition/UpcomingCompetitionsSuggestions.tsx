"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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
import { Badge } from "@/components/ui/Badge";
import type { BadgeTone } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { buttonClasses } from "@/components/ui/button-styles";
import { CalloutCard } from "@/components/ui/CalloutCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { EventIcon } from "@/components/ui/EventIcon";
import { IconButton } from "@/components/ui/IconButton";
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

  const getRegistrationStatusTone = (status?: RegistrationStatus): BadgeTone => {
    switch (status) {
      case "pending":
        return "warning";
      case "waitlisted":
        return "neutral";
      default:
        return "success";
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

  const getCountdownTone = (startDate: string): BadgeTone => {
    const daysUntil = getDaysUntil(startDate);
    if (daysUntil < 0) return "success";
    if (daysUntil <= 7) return "warning";
    return "neutral";
  };

  // Loading state
  if (isLoading) {
    return <RegisteredCompetitionsSkeleton />;
  }

  // Not logged in
  if (!isWcaIdentifier(user?.wcaId)) {
    return (
      <div className="timer-card">
        <EmptyState
          icon={<AlertCircle />}
          title="WCA ID Required"
          description="Link your WCA ID from Settings to see your registered competitions."
          action={
            <ButtonLink
              size="sm"
              href="/me"
              iconRight={<ChevronRight className="w-4 h-4" />}
            >
              Open Settings
            </ButtonLink>
          }
        />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="timer-card">
        <EmptyState
          icon={<AlertCircle />}
          title="Unable to Load"
          description={error}
          action={
            <Button
              size="sm"
              onClick={handleRefresh}
              iconLeft={<RefreshCw className="w-4 h-4" />}
            >
              Try Again
            </Button>
          }
        />
      </div>
    );
  }

  // No competitions
  if (competitions.length === 0) {
    return (
      <div className="timer-card">
        <EmptyState
          icon={<Trophy />}
          title="No Upcoming Competitions"
          description="You're not registered for any upcoming WCA competitions yet."
          action={
            <ButtonLink
              size="sm"
              href="/cube-lab/competitions?tab=browse"
              iconRight={<ChevronRight className="w-4 h-4" />}
            >
              Browse Competitions
            </ButtonLink>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <CalloutCard
        icon={<CircleCheck />}
        title={
          <>
            You have {competitions.length} registered competition
            {competitions.length !== 1 ? "s" : ""} on WCA
          </>
        }
        description="Practice for your upcoming competitions by running simulations."
        adornment={
          <IconButton
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="subtle"
            aria-label="Refresh registered competitions"
            icon={<RefreshCw className={isRefreshing ? "animate-spin" : ""} />}
          />
        }
      />

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
                      <Badge
                        shape="pill"
                        tone={getRegistrationStatusTone(registrationStatus)}
                      >
                        {getRegistrationStatusLabel(registrationStatus)}
                      </Badge>
                      <Badge shape="pill" tone={getCountdownTone(comp.start_date)}>
                        {getCountdownText(comp.start_date)}
                      </Badge>
                    </div>
                  </div>

                  <span
                    aria-hidden
                    className={buttonClasses({
                      size: "sm",
                      className: "shrink-0 group-hover:bg-(--primary-hover)",
                    })}
                  >
                    <Play className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">Simulate</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                  <Badge size="md" className="min-w-0 justify-start">
                    <Calendar className="text-(--text-muted)" />
                    <span className="truncate font-normal">
                      {formatCompetitionDateRange(
                        comp.start_date,
                        comp.end_date,
                      )}
                    </span>
                  </Badge>
                  <Badge size="md" className="min-w-0 justify-start">
                    <MapPin className="text-(--text-muted)" />
                    <span className="truncate font-normal">
                      {comp.city}, {comp.country_iso2}
                    </span>
                  </Badge>
                </div>

                {/* Event icons */}
                {comp.event_ids && comp.event_ids.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 border-t border-(--border) pt-3 sm:gap-2 sm:pt-4">
                    {comp.event_ids.slice(0, 10).map((eventId) => {
                      const event = WCA_EVENTS.find((e) => e.id === eventId);
                      return event ? (
                        <EventIcon
                          key={eventId}
                          size="sm"
                          eventId={eventId}
                          src={event.icon}
                          alt={event.name}
                          className="shrink-0"
                        />
                      ) : null;
                    })}
                    {comp.event_ids.length > 10 && (
                      <Badge>+{comp.event_ids.length - 10}</Badge>
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
