"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Target,
  Clock,
  TrendingUp,
  Zap,
  Calendar,
  Flame,
  ChevronDown,
  Users,
  EyeOff,
} from "lucide-react";
import { medalBadgeStyle } from "@/components/ui/medal";
import { SelectMenu } from "@/components/ui/Menu";
import { StatTile } from "@/components/ui/StatTile";
import SolveHeatmap from "../stats/SolveHeatmap";
import { EventStatsSkeleton, PlatformStatsSkeleton } from "../SkeletonLoaders";
import { useUser } from "@/components/UserProvider";
import { formatTime as formatMs } from "@/lib/stats-utils";

interface CubeDevStatsProps {
  wcaId: string;
  cubeDevUserId?: string;
}

const EVENT_NAMES = {
  "333": "3×3",
  "222": "2×2",
  "444": "4×4",
  "555": "5×5",
  "666": "6×6",
  "777": "7×7",
  "333bf": "3×3 BLD",
  "333fm": "3×3 FM",
  "333oh": "3×3 OH",
  clock: "Clock",
  minx: "Megaminx",
  pyram: "Pyraminx",
  skewb: "Skewb",
  sq1: "Square-1",
};

export default function CubeDevStats({
  wcaId,
  cubeDevUserId,
}: CubeDevStatsProps) {
  const [selectedEvent, setSelectedEvent] = useState<string>("333");
  const [showEventDropdown, setShowEventDropdown] = useState(false);
  const router = useRouter();
  const { user: currentUser } = useUser();

  // Check privacy settings first
  const privacySettings = useQuery(api.users.isUserProfilePrivate, { wcaId });

  // Query user's CubeDev data
  const cubeDevUser = useQuery(api.users.getUserByWcaId, { wcaId });

  // Determine if we should skip data queries based on privacy settings
  // Skip if: privacy settings haven't loaded, profile is private/hidden, user is deleted, or user doesn't exist
  const shouldSkipDataQueries =
    privacySettings === undefined ||
    cubeDevUser === undefined ||
    privacySettings?.isPrivate ||
    privacySettings?.hideProfile ||
    privacySettings?.isDeleted ||
    !cubeDevUser?._id;

  // Query pre-computed event stats (efficient - doesn't load all solves)
  const eventStats = useQuery(
    api.users.getUserEventStats,
    shouldSkipDataQueries ? "skip" : { userId: cubeDevUser!._id },
  );

  // Mutation to recalculate stats for existing users who don't have cached stats
  const recalculateAllStats = useMutation(api.users.recalculateAllUserStats);
  const hasTriggeredRecalc = useRef(false);

  // Query lightweight heatmap data (only dates and counts, not full solve objects)
  const heatmapData = useQuery(
    api.users.getSolveHeatmapData,
    shouldSkipDataQueries
      ? "skip"
      : { userId: cubeDevUser!._id, daysBack: 365 },
  );

  const isOwnProfile = Boolean(
    currentUser?.convexId &&
      cubeDevUser?._id &&
      currentUser.convexId === cubeDevUser._id,
  );

  // If user has heatmap data (solves exist) but no cached stats, trigger a recalculation
  useEffect(() => {
    if (
      isOwnProfile &&
      !shouldSkipDataQueries &&
      cubeDevUser?._id &&
      eventStats !== undefined &&
      eventStats.length === 0 &&
      heatmapData !== undefined &&
      heatmapData.length > 0 &&
      !hasTriggeredRecalc.current
    ) {
      hasTriggeredRecalc.current = true;
      recalculateAllStats({ userId: cubeDevUser._id }).catch(console.error);
    }
  }, [
    isOwnProfile,
    shouldSkipDataQueries,
    cubeDevUser?._id,
    eventStats,
    heatmapData,
    recalculateAllStats,
  ]);

  // Query challenge stats
  const challengeStats = useQuery(
    api.challengeStats.getUserChallengeStats,
    shouldSkipDataQueries ? "skip" : { userId: cubeDevUser!._id },
  );

  // Query room participations for room list
  const roomParticipations = useQuery(
    api.challengeRooms.getUserRoomParticipations,
    shouldSkipDataQueries ? "skip" : { userId: cubeDevUser!._id },
  );

  // Prepare heatmap data for SolveHeatmap component (only date and count)
  const heatmapDataForComponent =
    heatmapData?.map((point) => ({
      date: point.date,
      count: point.count,
      events: point.events,
    })) || [];

  // Get unique events from pre-computed stats (more accurate than recent solves)
  const attemptedEvents = eventStats
    ? eventStats.map((stat) => stat.event).sort()
    : [];

  // Compute overall activity stats (active days, longest streak, current streak) using heatmap data for accuracy
  const activityStats = useMemo(() => {
    if (!eventStats || eventStats.length === 0) {
      return { activeDays: 0, longestStreak: 0, currentStreak: 0 };
    }

    // Use heatmap data for accurate streak and active day calculations
    if (heatmapData && heatmapData.length > 0) {
      // Get all unique active days from heatmap data
      const activeDaysSet = new Set(heatmapData.map((d) => d.date));
      const activeDays = activeDaysSet.size;

      // Sort dates for streak calculation
      const sortedDays = Array.from(activeDaysSet).sort();

      // Calculate longest streak
      let longestStreak = 0;
      let tempStreak = 0;
      for (let i = 0; i < sortedDays.length; i++) {
        if (i === 0) {
          tempStreak = 1;
        } else {
          const prevDate = new Date(sortedDays[i - 1]);
          const currDate = new Date(sortedDays[i]);
          const dayDiff = Math.floor(
            (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24),
          );
          tempStreak = dayDiff === 1 ? tempStreak + 1 : 1;
        }
        longestStreak = Math.max(longestStreak, tempStreak);
      }

      // Calculate current streak
      let currentStreak = 0;
      const today = new Date();
      const todayKey = today.toISOString().split("T")[0];
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayKey = yesterday.toISOString().split("T")[0];

      let checkDate = new Date(today);
      if (!activeDaysSet.has(todayKey) && activeDaysSet.has(yesterdayKey)) {
        checkDate = new Date(yesterday);
      } else if (
        !activeDaysSet.has(todayKey) &&
        !activeDaysSet.has(yesterdayKey)
      ) {
        currentStreak = 0;
      }

      if (activeDaysSet.has(todayKey) || activeDaysSet.has(yesterdayKey)) {
        while (true) {
          const dateKey = checkDate.toISOString().split("T")[0];
          if (activeDaysSet.has(dateKey)) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }

      return { activeDays, longestStreak, currentStreak };
    }

    // Fallback to using eventStats if heatmap data isn't available for some reason (less accurate)
    const totalActiveDays = eventStats.reduce(
      (sum, s) => sum + (s.activeDays || 0),
      0,
    );
    return { activeDays: totalActiveDays, longestStreak: 0, currentStreak: 0 };
  }, [eventStats, heatmapData]);

  // Ensure selected event is valid
  useEffect(() => {
    if (attemptedEvents.length > 0) {
      if (!attemptedEvents.includes(selectedEvent)) {
        const defaultEvent = attemptedEvents.includes("333")
          ? "333"
          : attemptedEvents[0];
        setSelectedEvent(defaultEvent);
      }
    }
  }, [attemptedEvents.join(",")]);

  // Get pre-computed stats for selected event
  const selectedEventStats = eventStats?.find(
    (stat) => stat.event === selectedEvent,
  );

  // Show loading state while privacy settings are loading
  if (privacySettings === undefined || cubeDevUser === undefined) {
    return <EventStatsSkeleton />;
  }

  // If user is deleted, show appropriate message
  if (privacySettings?.isDeleted) {
    return (
      <div className="timer-card">
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-(--text-muted)/10 rounded-full">
              <Users className="w-8 h-8 text-(--text-muted)" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-(--text-primary) mb-2">
            Account Not Found
          </h3>
          <p className="text-(--text-secondary)">
            This user account is no longer available.
          </p>
        </div>
      </div>
    );
  }

  // Show skeleton loaders while data is loading
  const isLoadingData = !eventStats || !challengeStats || !roomParticipations;

  return (
    <div className="space-y-8">
      {/* Event Selector */}
      {privacySettings?.hideProfile || privacySettings?.isPrivate ? (
        <div className="timer-card">
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-(--primary)/10 rounded-full">
                <EyeOff className="w-8 h-8 text-(--primary)" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-(--text-primary) mb-2">
              {cubeDevUser ? "Event Statistics Hidden" : "User Not Registered"}
            </h3>
            <p className="text-(--text-secondary)">
              {cubeDevUser
                ? "User has chosen to hide their profile from public view."
                : "This user is not registered on CubeDev."}
            </p>
          </div>
        </div>
      ) : isLoadingData ? (
        <EventStatsSkeleton />
      ) : (
        attemptedEvents.length > 0 && (
          <div className="timer-card">
            <div className="flex flex-col items-stretch gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <h3 className="type-card-title">Event Statistics</h3>
              <SelectMenu
                label="Event"
                placement="bottom-end"
                fullWidth={false}
                value={selectedEvent}
                onChange={setSelectedEvent}
                className="w-full sm:w-44 sm:shrink-0"
                options={attemptedEvents.map((event) => ({
                  value: event,
                  label:
                    EVENT_NAMES[event as keyof typeof EVENT_NAMES] || event,
                }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
              <StatTile
                mobileLayout="row"
                size="sm"
                mono={false}
                icon={<Target />}
                label="Total Solves"
                value={(selectedEventStats?.totalSolves ?? 0).toLocaleString()}
              />
              <StatTile
                mobileLayout="row"
                size="sm"
                icon={<Clock />}
                label="Overall Average"
                value={
                  selectedEventStats?.overallAverage
                    ? formatMs(selectedEventStats.overallAverage)
                    : "--:--"
                }
              />
              <StatTile
                mobileLayout="row"
                size="sm"
                icon={<Zap />}
                label="Best Single"
                value={
                  selectedEventStats?.bestSingle
                    ? formatMs(selectedEventStats.bestSingle)
                    : "--:--"
                }
              />
              <StatTile
                mobileLayout="row"
                size="sm"
                icon={<Trophy />}
                label="Best Ao5"
                tone={
                  selectedEventStats?.bestAo5 === Infinity ? "error" : "default"
                }
                value={
                  selectedEventStats?.bestAo5 == null
                    ? "--:--"
                    : isFinite(selectedEventStats.bestAo5)
                      ? formatMs(selectedEventStats.bestAo5)
                      : "DNF"
                }
              />
            </div>
          </div>
        )
      )}

      {/* CubeDev Platform Stats */}
      {privacySettings?.hideProfile || privacySettings?.isPrivate ? (
        <div className="timer-card">
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-(--primary)/10 rounded-full">
                <EyeOff className="w-8 h-8 text-(--primary)" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-(--text-primary) mb-2">
              {cubeDevUser
                ? "Platform Statistics Hidden"
                : "User Not Registered"}
            </h3>
            <p className="text-(--text-secondary)">
              {cubeDevUser
                ? "User has chosen to hide their profile from public view."
                : "This user is not registered on CubeDev."}
            </p>
          </div>
        </div>
      ) : isLoadingData ? (
        <PlatformStatsSkeleton />
      ) : (
        <div className="timer-card">
          <h3 className="type-card-title mb-4">CubeDev Statistics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            <StatTile
              mobileLayout="row"
              size="sm"
              mono={false}
              icon={<Calendar />}
              label="Active Days"
              value={activityStats.activeDays}
            />
            <StatTile
              mobileLayout="row"
              size="sm"
              mono={false}
              icon={<Flame />}
              label="Current Streak"
              value={activityStats.currentStreak}
            />
            <StatTile
              mobileLayout="row"
              size="sm"
              mono={false}
              icon={<Target />}
              label="Events Practiced"
              value={attemptedEvents.length}
            />
            <StatTile
              mobileLayout="row"
              size="sm"
              mono={false}
              icon={<TrendingUp />}
              label="Total Solves"
              value={(
                eventStats?.reduce((sum, stat) => sum + stat.totalSolves, 0) ?? 0
              ).toLocaleString()}
            />
          </div>
        </div>
      )}

      {/* Challenge Room Stats */}
      {privacySettings?.hideChallengeStats ? (
        <div className="timer-card">
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-(--primary)/10 rounded-full">
                <EyeOff className="w-8 h-8 text-(--primary)" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-(--text-primary) mb-2">
              Challenge Room Stats are Private
            </h3>
            <p className="text-(--text-secondary)">
              This user has chosen to keep their challenge room statistics
              private.
            </p>
          </div>
        </div>
      ) : (
        <div className="timer-card">
          <h3 className="type-card-title mb-4">Challenge Room Statistics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-6">
            <StatTile
              mobileLayout="row"
              size="sm"
              mono={false}
              icon={<Trophy />}
              label="Rooms Won"
              value={challengeStats?.roomsWon ?? 0}
            />
            <StatTile
              mobileLayout="row"
              size="sm"
              mono={false}
              icon={<Users />}
              label="Rooms Participated"
              value={challengeStats?.roomsParticipated ?? 0}
            />
            <StatTile
              mobileLayout="row"
              size="sm"
              mono={false}
              icon={<Calendar />}
              label="Rooms Created"
              value={challengeStats?.roomsCreated ?? 0}
            />
          </div>

          {/* Recent Room Participations */}
          {roomParticipations && roomParticipations.length > 0 && (
            <div>
              <h4 className="text-md font-semibold text-(--text-primary) font-statement mb-3">
                Recent Room Participations
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {roomParticipations.slice(0, 10).map((participation) => {
                  const isExpired =
                    Date.now() > participation.roomExpiresAt ||
                    participation.roomStatus === "expired";
                  const isIncomplete =
                    !participation.isCompleted ||
                    participation.solvesCompleted === 0;
                  const showIncomplete = isExpired && isIncomplete;

                  return (
                    <div
                      key={participation._id}
                      className="flex items-center justify-between p-3 bg-(--surface-elevated) rounded border border-(--border) hover:bg-(--surface-elevated)/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={
                            showIncomplete
                              ? { background: "var(--error)" }
                              : medalBadgeStyle(participation.finalRank)
                          }
                        />
                        <div>
                          <div className="font-medium text-(--text-primary)">
                            {participation.roomName}
                          </div>
                          <div className="text-sm text-(--text-muted)">
                            {showIncomplete ? (
                              <>
                                <span className="text-(--primary) font-medium">
                                  Incomplete
                                </span>{" "}
                                •{" "}
                                {EVENT_NAMES[
                                  participation.event as keyof typeof EVENT_NAMES
                                ] || participation.event}
                              </>
                            ) : (
                              <>
                                Rank #{participation.finalRank || "TBD"} •{" "}
                                {EVENT_NAMES[
                                  participation.event as keyof typeof EVENT_NAMES
                                ] || participation.event}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          router.push(
                            `/cube-lab/challenges/room/${participation.roomPublicId}`,
                          )
                        }
                        className="px-3 py-1 text-xs bg-(--primary) text-(--on-primary) rounded hover:bg-(--primary-hover) transition-colors"
                      >
                        View Room
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Solve Heatmap */}
      {privacySettings?.hideProfile || privacySettings?.isPrivate ? (
        <div className="timer-card">
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-(--primary)/10 rounded-full">
                <EyeOff className="w-8 h-8 text-(--primary)" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-(--text-primary) mb-2">
              {cubeDevUser ? "Solve Activity Hidden" : "User Not Registered"}
            </h3>
            <p className="text-(--text-secondary)">
              {cubeDevUser
                ? "User has chosen to hide their profile from public view."
                : "This user is not registered on CubeDev."}
            </p>
          </div>
        </div>
      ) : (
        <SolveHeatmap heatmapData={heatmapDataForComponent} />
      )}
    </div>
  );
}
