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
import SolveHeatmap from "../stats/SolveHeatmap";
import { EventStatsSkeleton, PlatformStatsSkeleton } from "../SkeletonLoaders";

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

// Format milliseconds to string (M:SS.ss or SS.ss)
const formatMs = (ms: number) => {
  if (!isFinite(ms)) return "DNF";
  const total = ms / 1000;
  const m = Math.floor(total / 60);
  const s = (total % 60).toFixed(2);
  return m > 0 ? `${m}:${s.padStart(5, "0")}` : s;
};

export default function CubeDevStats({
  wcaId,
  cubeDevUserId,
}: CubeDevStatsProps) {
  const [selectedEvent, setSelectedEvent] = useState<string>("333");
  const [showEventDropdown, setShowEventDropdown] = useState(false);
  const router = useRouter();

  // Check privacy settings first
  const privacySettings = useQuery(api.users.isUserProfilePrivate, { wcaId });

  // Query user's CubeDev data
  const users = useQuery(api.users.getAllUsers);
  const cubeDevUser = users?.find((user) => user.wcaId === wcaId);

  // Determine if we should skip data queries based on privacy settings
  // Skip if: privacy settings haven't loaded, profile is private/hidden, user is deleted, or user doesn't exist
  const shouldSkipDataQueries =
    privacySettings === undefined ||
    users === undefined ||
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
    shouldSkipDataQueries ? "skip" : { userId: cubeDevUser!._id, daysBack: 365 },
  );

  // If user has heatmap data (solves exist) but no cached stats, trigger a recalculation
  useEffect(() => {
    if (
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

  // Show loading state while privacy settings are loading
  if (privacySettings === undefined || users === undefined) {
    return <EventStatsSkeleton />;
  }

  // If user is deleted, show appropriate message
  if (privacySettings?.isDeleted) {
    return (
      <div className="timer-card">
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gray-500/10 rounded-full">
              <Users className="w-8 h-8 text-gray-500" />
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

  // Prepare heatmap data for SolveHeatmap component (only date and count)
  const heatmapDataForComponent = heatmapData?.map((point) => ({
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
      } else if (!activeDaysSet.has(todayKey) && !activeDaysSet.has(yesterdayKey)) {
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
    const totalActiveDays = eventStats.reduce((sum, s) => sum + (s.activeDays || 0), 0);
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-(--text-primary) font-statement">
                Event Statistics
              </h3>
              <div className="relative">
                <button
                  onClick={() => setShowEventDropdown(!showEventDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) hover:bg-(--border) transition-colors"
                >
                  <span className="font-medium">
                    {EVENT_NAMES[selectedEvent as keyof typeof EVENT_NAMES] ||
                      selectedEvent}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showEventDropdown && (
                  <div className="absolute top-full right-0 mt-2 bg-(--surface) border border-(--border) rounded-lg shadow-lg z-10 min-w-[200px]">
                    {attemptedEvents.map((event) => (
                      <button
                        key={event}
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowEventDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-(--surface-elevated) transition-colors first:rounded-t-lg last:rounded-b-lg ${
                          selectedEvent === event
                            ? "bg-(--primary)/20 text-(--primary)"
                            : "text-(--text-primary)"
                        }`}
                      >
                        {EVENT_NAMES[event as keyof typeof EVENT_NAMES] ||
                          event}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Event Statistics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-(--surface-elevated) rounded-xl p-3 sm:p-4 border border-(--border)">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg">
                    <Target className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-(--text-muted) uppercase tracking-wide truncate">
                      Total Solves
                    </div>
                    <div className="text-sm sm:text-lg font-bold text-(--text-primary)">
                      {(selectedEventStats?.totalSolves ?? 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-(--surface-elevated) rounded-xl p-3 sm:p-4 border border-(--border)">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-green-500/10 rounded-lg">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-(--text-muted) uppercase tracking-wide truncate">
                      Overall AVG
                    </div>
                    <div className="text-sm sm:text-lg font-bold text-(--text-primary) font-mono">
                      {selectedEventStats?.overallAverage
                        ? formatMs(selectedEventStats.overallAverage)
                        : "--:--"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-(--surface-elevated) rounded-xl p-3 sm:p-4 border border-(--border)">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-yellow-500/10 rounded-lg">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-(--text-muted) uppercase tracking-wide truncate">
                      Best Single
                    </div>
                    <div className="text-sm sm:text-lg font-bold text-(--text-primary) font-mono">
                      {selectedEventStats?.bestSingle
                        ? formatMs(selectedEventStats.bestSingle)
                        : "--:--"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-(--surface-elevated) rounded-xl p-3 sm:p-4 border border-(--border)">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-purple-500/10 rounded-lg">
                    <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-(--text-muted) uppercase tracking-wide truncate">
                      Best Ao5
                    </div>
                    <div
                      className={`text-sm sm:text-lg font-bold font-mono ${
                        selectedEventStats?.bestAo5 === Infinity
                          ? "text-(--error)"
                          : "text-(--text-primary)"
                      }`}
                    >
                      {selectedEventStats?.bestAo5 == null
                        ? "--:--"
                        : isFinite(selectedEventStats.bestAo5)
                          ? formatMs(selectedEventStats.bestAo5)
                          : "DNF"}
                    </div>
                  </div>
                </div>
              </div>
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
          <h3 className="text-lg font-semibold text-(--text-primary) font-statement mb-4 flex items-center gap-2">
            CubeDev Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-(--surface-elevated) rounded-xl p-3 sm:p-4 border border-(--border)">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-orange-500/10 rounded-lg">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-(--text-muted) uppercase tracking-wide truncate">
                    Active Days
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-(--text-primary)">
                    {activityStats.activeDays}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-(--surface-elevated) rounded-xl p-3 sm:p-4 border border-(--border)">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-red-500/10 rounded-lg">
                  <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-(--text-muted) uppercase tracking-wide truncate">
                    Current Streak
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-(--text-primary)">
                    {activityStats.currentStreak}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-(--surface-elevated) rounded-xl p-3 sm:p-4 border border-(--border)">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-green-500/10 rounded-lg">
                  <Target className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-(--text-muted) uppercase tracking-wide truncate">
                    Events Practiced
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-(--text-primary)">
                    {attemptedEvents.length}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-(--surface-elevated) rounded-xl p-3 sm:p-4 border border-(--border)">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg">
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-(--text-muted) uppercase tracking-wide truncate">
                    Total Solves
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-(--text-primary)">
                    {(
                      eventStats?.reduce(
                        (sum, stat) => sum + stat.totalSolves,
                        0,
                      ) ?? 0
                    ).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
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
          <h3 className="text-lg font-semibold text-(--text-primary) font-statement mb-4 flex items-center gap-2">
            Challenge Room Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-6">
            <div className="bg-(--surface-elevated) rounded-xl p-3 sm:p-4 border border-(--border)">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-yellow-500/10 rounded-lg">
                  <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-(--text-muted) uppercase tracking-wide truncate">
                    Rooms Won
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-(--text-primary)">
                    {challengeStats?.roomsWon ?? 0}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-(--surface-elevated) rounded-xl p-3 sm:p-4 border border-(--border)">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-(--text-muted) uppercase tracking-wide truncate">
                    Rooms Participated
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-(--text-primary)">
                    {challengeStats?.roomsParticipated ?? 0}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-(--surface-elevated) rounded-xl p-3 sm:p-4 border border-(--border)">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-green-500/10 rounded-lg">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-(--text-muted) uppercase tracking-wide truncate">
                    Rooms Created
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-(--text-primary)">
                    {challengeStats?.roomsCreated ?? 0}
                  </div>
                </div>
              </div>
            </div>
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
                          className={`w-3 h-3 rounded-full ${
                            showIncomplete
                              ? "bg-red-500"
                              : participation.finalRank === 1
                                ? "bg-yellow-500"
                                : participation.finalRank &&
                                    participation.finalRank <= 3
                                  ? "bg-gray-400"
                                  : "bg-gray-600"
                          }`}
                        />
                        <div>
                          <div className="font-medium text-(--text-primary)">
                            {participation.roomName}
                          </div>
                          <div className="text-sm text-(--text-muted)">
                            {showIncomplete ? (
                              <>
                                <span className="text-red-500 font-medium">
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
                        className="px-3 py-1 text-xs bg-(--primary) text-white rounded hover:bg-(--primary-hover) transition-colors"
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
        <div className="timer-card">
          <SolveHeatmap heatmapData={heatmapDataForComponent} />
        </div>
      )}
    </div>
  );
}