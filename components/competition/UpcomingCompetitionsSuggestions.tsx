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
import { formatCompetitionDateRange } from "@/lib/date-utils";
import { RegisteredCompetitionsSkeleton } from "@/components/SkeletonLoaders";
import { getFromCacheWithStaleCheck, saveToCache } from "@/lib/wca-cache";

interface UpcomingCompetition {
  id: string;
  name: string;
  city: string;
  country_iso2: string;
  start_date: string;
  end_date: string;
  event_ids?: string[];
}

// Cache key for registered competitions
const getRegisteredCacheKey = (wcaId: string) => `registered_comps_${wcaId}`;

export default function UpcomingCompetitionsSuggestions() {
  const { user } = useUser();
  const [competitions, setCompetitions] = useState<UpcomingCompetition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUpcoming = useCallback(
    async (forceRefresh = false) => {
      if (!user?.wcaId) {
        setIsLoading(false);
        return;
      }

      const cacheKey = getRegisteredCacheKey(user.wcaId);

      // Check cache first
      const { data: cached, isStale } = getFromCacheWithStaleCheck<
        UpcomingCompetition[]
      >(
        cacheKey,
        15 * 60 * 1000 // 15 minutes stale threshold
      );

      // Use cached data if fresh
      if (cached && !isStale && !forceRefresh) {
        setCompetitions(cached);
        setIsLoading(false);
        return;
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
          `/api/competition/upcoming?wcaId=${encodeURIComponent(user.wcaId)}`
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
          setCompetitions(data.competitions);
          // Cache the data for 24 hours
          saveToCache(cacheKey, data.competitions, 24 * 60 * 60 * 1000);
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
    [user?.wcaId]
  );

  useEffect(() => {
    fetchUpcoming();
  }, [fetchUpcoming]);

  const handleRefresh = () => {
    fetchUpcoming(true);
  };

  const getDaysUntil = (startDate: string): number => {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = start.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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

  // Loading state
  if (isLoading) {
    return <RegisteredCompetitionsSkeleton />;
  }

  // Not logged in
  if (!user?.wcaId) {
    return (
      <div className="timer-card">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-(--text-muted) mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-(--text-primary) mb-2">
            Sign in Required
          </h3>
          <p className="text-sm text-(--text-secondary) mb-4">
            Sign in with your WCA account to see your registered competitions.
          </p>
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
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-4 py-2 bg-(--primary) text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
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
            className="inline-flex items-center gap-2 px-4 py-2 bg-(--primary) text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Browse Competitions
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CircleCheck className="w-5 h-5 text-(--primary)" />
          <h2 className="text-lg font-bold text-(--text-primary)">
            Your Registered Competitions
          </h2>
          {isRefreshing && (
            <RefreshCw className="w-4 h-4 text-(--text-muted) animate-spin" />
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1.5 text-(--text-muted) hover:text-(--text-secondary) transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>
          <span className="text-sm text-(--text-muted)">
            {competitions.length} competition
            {competitions.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <p className="text-sm text-(--text-secondary)">
        Practice for your upcoming competitions by running simulations
      </p>

      {/* Competition Cards */}
      <div className="grid gap-3 sm:gap-4">
        {competitions.map((comp) => {
          const daysUntil = getDaysUntil(comp.start_date);
          const isUrgent = daysUntil >= 0 && daysUntil <= 7;
          const isOngoing = daysUntil < 0;

          return (
            <Link
              key={comp.id}
              href={`/cube-lab/competitions/${comp.id}/setup`}
              className="group timer-card hover:border-(--primary)/50 transition-all"
            >
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start sm:items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-(--text-primary) group-hover:text-(--primary) transition-colors text-sm sm:text-base">
                      {comp.name}
                    </h3>
                    <span
                      className={`shrink-0 px-2 py-0.5 text-xs font-medium rounded-full border ${
                        isOngoing
                          ? "bg-(--success)/10 text-(--success) border-(--success)/30"
                          : isUrgent
                            ? "bg-(--warning)/10 text-(--warning) border-(--warning)/30"
                            : "bg-(--surface-elevated) text-(--text-muted) border-(--border)"
                      }`}
                    >
                      {getCountdownText(comp.start_date)}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2 text-xs sm:text-sm text-(--text-muted)">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {formatCompetitionDateRange(
                          comp.start_date,
                          comp.end_date
                        )}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {comp.city}, {comp.country_iso2}
                      </span>
                    </span>
                  </div>

                  {/* Event icons */}
                  {comp.event_ids && comp.event_ids.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {comp.event_ids.slice(0, 10).map((eventId) => {
                        const event = WCA_EVENTS.find((e) => e.id === eventId);
                        return event ? (
                          <div
                            key={eventId}
                            title={event.name}
                            className="p-1.5 rounded bg-(--surface-elevated) border border-(--border)"
                          >
                            <Image
                              src={event.icon}
                              alt={event.name}
                              width={16}
                              height={16}
                              className="invert opacity-70"
                            />
                          </div>
                        ) : null;
                      })}
                      {comp.event_ids.length > 10 && (
                        <span className="px-2 py-1 text-xs text-(--text-muted) bg-(--surface-elevated) rounded border border-(--border)">
                          +{comp.event_ids.length - 10}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="shrink-0">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-(--primary) text-white text-xs sm:text-sm font-medium rounded-lg group-hover:opacity-90 transition-opacity">
                    <Play className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Simulate</span>
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
