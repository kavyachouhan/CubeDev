"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
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

interface TimerRecord {
  id: string;
  time: number;
  timestamp: Date;
  scramble: string;
  penalty: "none" | "+2" | "DNF";
  finalTime: number;
  event: string;
  sessionId: string;
  notes?: string;
  tags?: string[];
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

// Helpers to truncate/round to nearest centisecond (10 ms)
const truncToCentisMs = (ms: number) => Math.floor(ms / 10) * 10; // singles: truncate
const roundToCentisMs = (ms: number) => Math.round(ms / 10) * 10; // averages: round

// Format milliseconds to string (M:SS.ss or SS.ss)
const formatMs = (ms: number) => {
  if (!isFinite(ms)) return "DNF";
  const total = ms / 1000;
  const m = Math.floor(total / 60);
  const s = (total % 60).toFixed(2);
  return m > 0 ? `${m}:${s.padStart(5, "0")}` : s;
};

// Calculate WCA Average of N
const wcaAverageN = (solves: TimerRecord[], n: number): number | null => {
  if (solves.length < n) return null;

  // Last N consecutive results (DNFs included)
  const lastN = solves.slice(-n);

  // Use truncated singles for calculation
  const values = lastN.map((r) =>
    isFinite(r.finalTime) ? truncToCentisMs(r.finalTime) : Infinity
  );

  const dnfs = values.filter((v) => !isFinite(v)).length;
  if (dnfs >= 2) return Infinity; // average is DNF if 2 or more DNFs

  // Sort values to drop best and worst
  const sorted = [...values].sort((a, b) => a - b);

  // Drop best and worst
  sorted.shift(); // drop best
  sorted.pop(); // drop worst

  // Calculate average of remaining
  const sum = sorted.reduce((acc, v) => acc + (isFinite(v) ? v : 0), 0);
  const avg = sum / (n - 2);

  // Average of N is rounded to 0.01 s
  return roundToCentisMs(avg);
};

// Calculate statistics for an event
const calculateEventStats = (solves: TimerRecord[]) => {
  if (solves.length === 0) {
    return {
      totalSolves: 0,
      bestSingle: null,
      ao5: null,
      overallAverage: null,
    };
  }

  // Order by timestamp ascending
  const ordered = [...solves].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  // Extract truncated singles (ignore DNFs) for calculations
  const truncatedSingles = ordered
    .filter((r) => isFinite(r.finalTime))
    .map((r) => truncToCentisMs(r.finalTime));

  const bestSingle = truncatedSingles.length
    ? Math.min(...truncatedSingles)
    : null;

  const ao5 = wcaAverageN(ordered, 5);

  // Overall average (session mean)
  const overallAverage = truncatedSingles.length
    ? roundToCentisMs(
        truncatedSingles.reduce((a, b) => a + b, 0) / truncatedSingles.length
      )
    : null;

  return {
    totalSolves: solves.length,
    bestSingle,
    ao5,
    overallAverage,
  };
};

// Calculate activity statistics
const calculateActivityStats = (solves: TimerRecord[]) => {
  if (solves.length === 0) {
    return { activeDays: 0, longestStreak: 0, currentStreak: 0 };
  }

  // Get unique days with solves
  const solveDays = new Set<string>();
  const solveDaysList: string[] = [];

  solves.forEach((solve) => {
    const date = new Date(solve.timestamp);
    // Format as YYYY-MM-DD for consistent comparison
    const dateKey = date.toISOString().split("T")[0];
    if (!solveDays.has(dateKey)) {
      solveDays.add(dateKey);
      solveDaysList.push(dateKey);
    }
  });

  // Sort days chronologically
  const sortedDays = solveDaysList.sort();

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
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (dayDiff === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  // Calculate current streak (count backwards from today)
  let currentStreak = 0;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const todayKey = today.toISOString().split("T")[0];
  const yesterdayKey = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // Start checking from today if solved today, otherwise from yesterday
  let checkDate = new Date(today);
  if (!solveDays.has(todayKey) && solveDays.has(yesterdayKey)) {
    checkDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  } else if (!solveDays.has(todayKey) && !solveDays.has(yesterdayKey)) {
    currentStreak = 0;
  }

  if (solveDays.has(todayKey) || solveDays.has(yesterdayKey)) {
    while (checkDate >= new Date(sortedDays[0])) {
      const dateKey = checkDate.toISOString().split("T")[0];
      if (solveDays.has(dateKey)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  return {
    activeDays: solveDays.size,
    longestStreak: solveDays.size === 0 ? 0 : longestStreak,
    currentStreak: currentStreak,
  };
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

  // Query user's solves
  const solves = useQuery(
    api.users.getUserSolves,
    cubeDevUser?._id ? { userId: cubeDevUser._id } : "skip"
  );

  // Query challenge stats
  const challengeStats = useQuery(
    api.challengeStats.getUserChallengeStats,
    cubeDevUser?._id ? { userId: cubeDevUser._id } : "skip"
  );

  // Query room participations for room list
  const roomParticipations = useQuery(
    api.challengeRooms.getUserRoomParticipations,
    cubeDevUser?._id ? { userId: cubeDevUser._id } : "skip"
  );

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
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Account Not Found
          </h3>
          <p className="text-[var(--text-secondary)]">
            This user account is no longer available.
          </p>
        </div>
      </div>
    );
  }

  // Convert Convex solves to TimerRecord format
  const timerSolves: TimerRecord[] =
    solves?.map((solve) => ({
      id: solve._id,
      time: solve.time,
      timestamp: new Date(solve.solveDate),
      scramble: solve.scramble,
      penalty: solve.penalty,
      finalTime: solve.finalTime,
      event: solve.event,
      sessionId: solve.sessionId,
      notes: solve.comment,
      tags: solve.tags,
    })) || [];

  // Get unique events that user has attempted
  const attemptedEvents = Array.from(
    new Set(timerSolves.map((solve) => solve.event))
  ).sort();

  // Filter solves by selected event
  const eventSolves = timerSolves.filter(
    (solve) => solve.event === selectedEvent
  );

  // Calculate event-specific stats
  const eventStats = calculateEventStats(eventSolves);

  // Calculate activity stats from all solves
  const activityStats = calculateActivityStats(timerSolves);

  // Show skeleton loaders while data is loading
  const isLoadingData = !solves || !challengeStats || !roomParticipations;

  return (
    <div className="space-y-8">
      {/* Event Selector */}
      {privacySettings?.hideProfile ? (
        <div className="timer-card">
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-[var(--primary)]/10 rounded-full">
                <EyeOff className="w-8 h-8 text-[var(--primary)]" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Event Statistics Hidden
            </h3>
            <p className="text-[var(--text-secondary)]">
              User has chosen to hide their profile from public view.
            </p>
          </div>
        </div>
      ) : isLoadingData ? (
        <EventStatsSkeleton />
      ) : (
        attemptedEvents.length > 0 && (
          <div className="timer-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement">
                Event Statistics
              </h3>
              <div className="relative">
                <button
                  onClick={() => setShowEventDropdown(!showEventDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--border)] transition-colors"
                >
                  <span className="font-medium">
                    {EVENT_NAMES[selectedEvent as keyof typeof EVENT_NAMES] ||
                      selectedEvent}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showEventDropdown && (
                  <div className="absolute top-full right-0 mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg z-10 min-w-[200px]">
                    {attemptedEvents.map((event) => (
                      <button
                        key={event}
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowEventDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-[var(--surface-elevated)] transition-colors first:rounded-t-lg last:rounded-b-lg ${
                          selectedEvent === event
                            ? "bg-[var(--primary)]/20 text-[var(--primary)]"
                            : "text-[var(--text-primary)]"
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
              <div className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)]">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg">
                    <Target className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide truncate">
                      Total Solves
                    </div>
                    <div className="text-sm sm:text-lg font-bold text-[var(--text-primary)]">
                      {eventStats.totalSolves.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)]">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-green-500/10 rounded-lg">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide truncate">
                      Overall AVG
                    </div>
                    <div className="text-sm sm:text-lg font-bold text-[var(--text-primary)] font-mono">
                      {eventStats.overallAverage
                        ? formatMs(eventStats.overallAverage)
                        : "--:--"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)]">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-yellow-500/10 rounded-lg">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide truncate">
                      Best Single
                    </div>
                    <div className="text-sm sm:text-lg font-bold text-[var(--text-primary)] font-mono">
                      {eventStats.bestSingle
                        ? formatMs(eventStats.bestSingle)
                        : "--:--"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)]">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-purple-500/10 rounded-lg">
                    <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide truncate">
                      Best Ao5
                    </div>
                    <div
                      className={`text-sm sm:text-lg font-bold font-mono ${
                        eventStats.ao5 === Infinity
                          ? "text-[var(--error)]"
                          : "text-[var(--text-primary)]"
                      }`}
                    >
                      {eventStats.ao5 == null
                        ? "--:--"
                        : isFinite(eventStats.ao5)
                          ? formatMs(eventStats.ao5)
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
      {privacySettings?.hideProfile ? (
        <div className="timer-card">
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-[var(--primary)]/10 rounded-full">
                <EyeOff className="w-8 h-8 text-[var(--primary)]" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Platform Statistics Hidden
            </h3>
            <p className="text-[var(--text-secondary)]">
              User has chosen to hide their profile from public view.
            </p>
          </div>
        </div>
      ) : isLoadingData ? (
        <PlatformStatsSkeleton />
      ) : (
        <div className="timer-card">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement mb-4 flex items-center gap-2">
            CubeDev Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)]">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-orange-500/10 rounded-lg">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide truncate">
                    Active Days
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-[var(--text-primary)]">
                    {activityStats.activeDays}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)]">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-red-500/10 rounded-lg">
                  <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide truncate">
                    Current Streak
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-[var(--text-primary)]">
                    {activityStats.currentStreak}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)]">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-green-500/10 rounded-lg">
                  <Target className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide truncate">
                    Events Practiced
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-[var(--text-primary)]">
                    {attemptedEvents.length}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)]">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg">
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide truncate">
                    Total Solves
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-[var(--text-primary)]">
                    {timerSolves.length.toLocaleString()}
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
              <div className="p-4 bg-[var(--primary)]/10 rounded-full">
                <EyeOff className="w-8 h-8 text-[var(--primary)]" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Challenge Room Stats are Private
            </h3>
            <p className="text-[var(--text-secondary)]">
              This user has chosen to keep their challenge room statistics
              private.
            </p>
          </div>
        </div>
      ) : (
        <div className="timer-card">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement mb-4 flex items-center gap-2">
            Challenge Room Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-6">
            <div className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)]">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-yellow-500/10 rounded-lg">
                  <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide truncate">
                    Rooms Won
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-[var(--text-primary)]">
                    {challengeStats?.roomsWon ?? 0}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)]">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide truncate">
                    Rooms Participated
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-[var(--text-primary)]">
                    {challengeStats?.roomsParticipated ?? 0}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)]">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-green-500/10 rounded-lg">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide truncate">
                    Rooms Created
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-[var(--text-primary)]">
                    {challengeStats?.roomsCreated ?? 0}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Room Participations */}
          {roomParticipations && roomParticipations.length > 0 && (
            <div>
              <h4 className="text-md font-semibold text-[var(--text-primary)] font-statement mb-3">
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
                      className="flex items-center justify-between p-3 bg-[var(--surface-elevated)] rounded border border-[var(--border)] hover:bg-[var(--surface-elevated)]/80 transition-colors"
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
                          <div className="font-medium text-[var(--text-primary)]">
                            {participation.roomName}
                          </div>
                          <div className="text-sm text-[var(--text-muted)]">
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
                            `/cube-lab/challenges/room/${participation.roomPublicId}`
                          )
                        }
                        className="px-3 py-1 text-xs bg-[var(--primary)] text-white rounded hover:bg-[var(--primary-hover)] transition-colors"
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
      {privacySettings?.hideProfile ? (
        <div className="timer-card">
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-[var(--primary)]/10 rounded-full">
                <EyeOff className="w-8 h-8 text-[var(--primary)]" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Solve Activity Hidden
            </h3>
            <p className="text-[var(--text-secondary)]">
              User has chosen to hide their profile from public view.
            </p>
          </div>
        </div>
      ) : (
        <div className="timer-card">
          <SolveHeatmap solves={timerSolves} />
        </div>
      )}
    </div>
  );
}