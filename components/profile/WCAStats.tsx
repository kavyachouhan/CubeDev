"use client";

import { useMemo, useState } from "react";
import { MapPin, Calendar, Loader2, ExternalLink } from "lucide-react";
import VirtualCompetitionList from "../VirtualCompetitionList";
import { CompetitionListSkeleton, HeatmapSkeleton } from "../SkeletonLoaders";

interface WCAPersonalRecord {
  event_id: string;
  best: number;
  world_ranking: number;
  continental_ranking: number;
  national_ranking: number;
  average?: number;
  average_world_ranking?: number;
  average_continental_ranking?: number;
  average_national_ranking?: number;
}

interface WCACompetitionResult {
  id: number;
  pos: number;
  best: number;
  average: number;
  competition_id: string;
  event_id: string;
  regional_single_record?: string;
  regional_average_record?: string;
  national_single_record?: string;
  national_average_record?: string;
  world_single_record?: string;
  world_average_record?: string;
}

interface CompetitionInfo {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  city?: string;
  venue?: string;
  country_iso2: string;
  events: string[];
  bestResult: number;
  mainEvent?: string;
}

interface WCAStatsProps {
  wcaId: string;
  person: {
    name: string;
    wcaId: string;
    country: {
      name: string;
      iso2: string;
    };
    personal_records?: Record<string, any>;
  };
  personalRecords: WCAPersonalRecord[] | null;
  competitionResults: WCACompetitionResult[] | null;
  competitionDetails: Map<string, CompetitionInfo>;
  isLoadingCompetitions: boolean;
}

interface CompetitionHeatmapData {
  date: Date;
  count: number;
  level: number;
  competitions: string[];
  formattedDate: string;
}

const EVENT_NAMES = {
  "333": "3×3×3 Cube",
  "222": "2×2×2 Cube",
  "444": "4×4×4 Cube",
  "555": "5×5×5 Cube",
  "666": "6×6×6 Cube",
  "777": "7×7×7 Cube",
  "333bf": "3×3×3 Blindfolded",
  "333fm": "3×3×3 Fewest Moves",
  "333oh": "3×3×3 One-Handed",
  clock: "Clock",
  minx: "Megaminx",
  pyram: "Pyraminx",
  skewb: "Skewb",
  sq1: "Square-1",
  "444bf": "4×4×4 Blindfolded",
  "555bf": "5×5×5 Blindfolded",
  "333mbf": "3×3×3 Multi-Blind",
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatTime(centiseconds: number): string {
  if (!centiseconds || centiseconds <= 0) return "--";

  const totalMs = centiseconds * 10;
  const minutes = Math.floor(totalMs / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const milliseconds = totalMs % 1000;

  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`;
  } else {
    return `${seconds}.${milliseconds.toString().padStart(3, "0")}`;
  }
}

function formatMoves(moves: number): string {
  return moves.toString();
}

function formatTimeOrMoves(eventId: string, centiseconds: number): string {
  if (eventId === "333fm" || eventId.includes("mbf")) {
    return formatMoves(centiseconds);
  }
  return formatTime(centiseconds);
}

export default function WCAStats({
  personalRecords,
  competitionResults,
  competitionDetails,
  isLoadingCompetitions,
}: WCAStatsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<"1y" | "3y" | "all">(
    "3y"
  );

  // Sort competitions by date (most recent first)
  const sortedCompetitions = useMemo(() => {
    return Array.from(competitionDetails.values()).sort(
      (a, b) =>
        new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );
  }, [competitionDetails]);

  // Generate competition heatmap data
  const competitionHeatmap = useMemo(() => {
    if (!competitionResults || !competitionDetails.size) return [];

    const today = new Date();
    const yearsBack =
      selectedPeriod === "1y" ? 1 : selectedPeriod === "3y" ? 3 : 10;
    const startDate = new Date(today);
    startDate.setFullYear(today.getFullYear() - yearsBack);
    startDate.setMonth(0, 1); // Start from January 1st

    const data: CompetitionHeatmapData[] = [];
    const competitionsByMonth = new Map<string, string[]>();

    // Group competitions by month
    competitionResults.forEach((result) => {
      const competition = competitionDetails.get(result.competition_id);
      if (competition) {
        const compDate = new Date(competition.start_date);
        if (compDate >= startDate && compDate <= today) {
          const monthKey = `${compDate.getFullYear()}-${compDate.getMonth()}`;
          if (!competitionsByMonth.has(monthKey)) {
            competitionsByMonth.set(monthKey, []);
          }
          if (!competitionsByMonth.get(monthKey)!.includes(competition.name)) {
            competitionsByMonth.get(monthKey)!.push(competition.name);
          }
        }
      }
    });

    // Generate monthly data
    const currentDate = new Date(startDate);
    while (currentDate <= today) {
      const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
      const competitions = competitionsByMonth.get(monthKey) || [];
      const count = competitions.length;

      // Calculate intensity level (0-4) based on competition count
      let level = 0;
      if (count > 0) {
        if (count >= 4) level = 4;
        else if (count >= 3) level = 3;
        else if (count >= 2) level = 2;
        else level = 1;
      }

      data.push({
        date: new Date(currentDate),
        count,
        level,
        competitions,
        formattedDate: `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`,
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return data;
  }, [competitionResults, competitionDetails, selectedPeriod]);

  // Calculate WCA achievements
  const achievements = useMemo(() => {
    if (!personalRecords) return null;

    const totalEvents = personalRecords.length;
    const podiumFinishes =
      competitionResults?.filter((r) => r.pos <= 3).length || 0;
    const firstPlaces =
      competitionResults?.filter((r) => r.pos === 1).length || 0;
    const totalCompetitions = competitionDetails.size;

    const bestWorldRanking = personalRecords
      .filter((r) => r.world_ranking > 0)
      .reduce(
        (best, current) =>
          current.world_ranking < best ? current.world_ranking : best,
        Infinity
      );

    // Calculate records breakdown
    const worldRecords =
      competitionResults?.filter(
        (r) => r.world_single_record || r.world_average_record
      ).length || 0;

    const nationalRecords =
      competitionResults?.filter(
        (r) => r.national_single_record || r.national_average_record
      ).length || 0;

    const continentalRecords =
      competitionResults?.filter(
        (r) => r.regional_single_record || r.regional_average_record
      ).length || 0;

    const totalRecords = worldRecords + nationalRecords + continentalRecords;

    return {
      totalEvents,
      podiumFinishes,
      firstPlaces,
      totalCompetitions,
      bestWorldRanking: isFinite(bestWorldRanking) ? bestWorldRanking : null,
      worldRecords,
      nationalRecords,
      continentalRecords,
      totalRecords,
    };
  }, [personalRecords, competitionResults, competitionDetails]);

  const getIntensityColor = (level: number) => {
    const colors = {
      0: "bg-[var(--surface)] border-[var(--border)]",
      1: "bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800",
      2: "bg-blue-300 dark:bg-blue-700/50 border-blue-400 dark:border-blue-600",
      3: "bg-blue-500 dark:bg-blue-600/70 border-blue-600 dark:border-blue-500",
      4: "bg-blue-700 dark:bg-blue-400 border-blue-800 dark:border-blue-300",
    };
    return colors[level as keyof typeof colors] || colors[0];
  };

  return (
    <div className="space-y-8">
      {/* WCA Achievements */}
      {/* <div className="timer-card">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[var(--primary)]" />
          WCA Achievements
        </h3>
        {achievements ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
            <div className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)]">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg">
                  <Target className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide truncate">
                    Events
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-[var(--text-primary)]">
                    {achievements.totalEvents}
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
                    Competitions
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-[var(--text-primary)]">
                    {achievements.totalCompetitions}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)]">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-yellow-500/10 rounded-lg">
                  <Medal className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide truncate">
                    Podiums
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-[var(--text-primary)]">
                    {achievements.podiumFinishes}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)]">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-purple-500/10 rounded-lg">
                  <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide truncate">
                    WRs
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-[var(--text-primary)]">
                    {achievements.worldRecords}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)]">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-red-500/10 rounded-lg">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide truncate">
                    NRs
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-[var(--text-primary)]">
                    {achievements.nationalRecords}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)]">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-orange-500/10 rounded-lg">
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide truncate">
                    CRs
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-[var(--text-primary)]">
                    {achievements.continentalRecords}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)]">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-indigo-500/10 rounded-lg">
                  <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide truncate">
                    Best WR
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-[var(--text-primary)]">
                    {achievements.bestWorldRanking
                      ? `#${achievements.bestWorldRanking}`
                      : "--"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
            <div className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)]">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg">
                  <Target className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide truncate">
                    Events
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-[var(--text-primary)]">
                    0
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
                    Competitions
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-[var(--text-primary)]">
                    0
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)]">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-yellow-500/10 rounded-lg">
                  <Medal className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide truncate">
                    Podiums
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-[var(--text-primary)]">
                    0
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)]">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-purple-500/10 rounded-lg">
                  <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide truncate">
                    WRs
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-[var(--text-primary)]">
                    0
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)]">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-red-500/10 rounded-lg">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide truncate">
                    NRs
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-[var(--text-primary)]">
                    0
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)]">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-orange-500/10 rounded-lg">
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide truncate">
                    CRs
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-[var(--text-primary)]">
                    0
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)]">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-indigo-500/10 rounded-lg">
                  <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide truncate">
                    Best WR
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-[var(--text-primary)]">
                    --
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div> */}

      {/* Personal Records */}
      {/* <div className="timer-card">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement mb-4 flex items-center gap-2">
          <Medal className="w-5 h-5 text-[var(--primary)]" />
          Personal Records
        </h3>
        {personalRecords && personalRecords.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {personalRecords
              .filter(
                (record) =>
                  record.world_ranking > 0 ||
                  (record.average_world_ranking &&
                    record.average_world_ranking > 0)
              )
              .sort((a, b) => {
                const aRank = Math.min(
                  a.world_ranking || Infinity,
                  a.average_world_ranking || Infinity
                );
                const bRank = Math.min(
                  b.world_ranking || Infinity,
                  b.average_world_ranking || Infinity
                );
                return aRank - bRank;
              })
              .map((record) => (
                <div
                  key={record.event_id}
                  className="p-4 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-[var(--text-primary)] font-inter">
                      {EVENT_NAMES[
                        record.event_id as keyof typeof EVENT_NAMES
                      ] || record.event_id}
                    </h4>
                    <div className="flex gap-2">
                      {record.world_ranking > 0 && (
                        <span className="text-xs bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-1 rounded">
                          #{record.world_ranking} WR
                        </span>
                      )}
                      {record.average_world_ranking &&
                        record.average_world_ranking > 0 && (
                          <span className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded">
                            #{record.average_world_ranking} WR Avg
                          </span>
                        )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {record.best > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[var(--text-muted)]">
                          Single:
                        </span>
                        <div className="text-right">
                          <div className="text-sm font-bold text-[var(--text-primary)] font-mono">
                            {formatTimeOrMoves(record.event_id, record.best)}
                          </div>
                          <div className="text-xs text-[var(--text-muted)]">
                            {record.national_ranking > 0 &&
                              `#${record.national_ranking} NR`}
                            {record.continental_ranking > 0 &&
                              record.national_ranking > 0 &&
                              " • "}
                            {record.continental_ranking > 0 &&
                              `#${record.continental_ranking} CR`}
                          </div>
                        </div>
                      </div>
                    )}

                    {record.average && record.average > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[var(--text-muted)]">
                          Average:
                        </span>
                        <div className="text-right">
                          <div className="text-sm font-bold text-[var(--text-primary)] font-mono">
                            {formatTimeOrMoves(record.event_id, record.average)}
                          </div>
                          <div className="text-xs text-[var(--text-muted)]">
                            {record.average_national_ranking &&
                              record.average_national_ranking > 0 &&
                              `#${record.average_national_ranking} NR`}
                            {record.average_continental_ranking &&
                              record.average_continental_ranking > 0 &&
                              record.average_national_ranking &&
                              record.average_national_ranking > 0 &&
                              " • "}
                            {record.average_continental_ranking &&
                              record.average_continental_ranking > 0 &&
                              `#${record.average_continental_ranking} CR`}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)]">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm sm:text-lg font-bold text-[var(--text-primary)]">
                  0
                </div>
              </div>
            </div>
          </div>
        )}
      </div> */}

      {/* Competition Activity Heatmap */}
      {isLoadingCompetitions && competitionDetails.size === 0 ? (
        <HeatmapSkeleton />
      ) : (
        <div className="timer-card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement flex items-center gap-2">
              Competition Activity
            </h3>
            <div className="flex items-center gap-1 p-1 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)] sm:overflow-x-auto">
              {(
                [
                  ["1y", "1 year"],
                  ["3y", "3 years"],
                  ["all", "All time"],
                ] as const
              ).map(([period, label]) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all whitespace-nowrap flex-1 sm:flex-none ${
                    selectedPeriod === period
                      ? "bg-[var(--primary)] text-white shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {/* Heatmap grid */}
            <div className="grid grid-cols-12 gap-2">
              {competitionHeatmap.map((month) => (
                <div
                  key={month.formattedDate}
                  className={`aspect-square rounded border transition-colors cursor-pointer ${getIntensityColor(month.level)}`}
                  title={`${MONTHS[month.date.getMonth()]} ${month.date.getFullYear()}: ${month.count} competitions`}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xs font-medium text-center">
                      {MONTHS[month.date.getMonth()].charAt(0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <span>Less</span>
                <div className="flex items-center gap-1">
                  {[0, 1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`w-3 h-3 rounded border ${getIntensityColor(level)}`}
                    />
                  ))}
                </div>
                <span>More</span>
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                Total: {competitionDetails.size} competitions
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Competition List */}
      <div className="timer-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement flex items-center gap-2">
            Recent Competitions
          </h3>
          <div className="text-sm text-[var(--text-muted)] font-medium">
            {competitionDetails.size} total
          </div>
        </div>
        {isLoadingCompetitions && competitionDetails.size === 0 ? (
          <CompetitionListSkeleton />
        ) : competitionDetails.size > 0 ? (
          <VirtualCompetitionList
            competitions={sortedCompetitions}
            itemHeight={100}
            containerHeight={400}
          />
        ) : (
          <div className="text-center py-8">
            <MapPin className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-[var(--text-secondary)] font-inter">
              No competition data available
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
