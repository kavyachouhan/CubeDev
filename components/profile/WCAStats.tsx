"use client";

import { useMemo, useState } from "react";
import { MapPin, Calendar, Loader2, ExternalLink, Medal } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { CardIcon } from "@/components/ui/Card";
import { EventIcon } from "@/components/ui/EventIcon";
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

/** WCA ranks are 1-based; 0 or undefined means "no rank in this event". */
function rankText(rank?: number): string {
  return rank && rank > 0 ? String(rank) : "—";
}

/** One result line on the phone layout: time first, then its three ranks. */
function RecordRow({
  label,
  value,
  nr,
  cr,
  wr,
}: {
  label: string;
  value: string | null;
  nr?: number;
  cr?: number;
  wr?: number;
}) {
  // The time and the three ranks each get their own line: side by side, the
  // rank badges squeezed the time until it overlapped them.
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="type-overline">{label}</span>
        <span className="type-time font-bold text-base text-(--text-primary)">
          {value ?? "—"}
        </span>
      </div>
      {value && (nr || cr || wr) ? (
        <div className="flex flex-wrap items-center justify-end gap-1">
          {nr && nr > 0 ? (
            <Badge title={`National rank ${nr}`}>NR {nr}</Badge>
          ) : null}
          {cr && cr > 0 ? (
            <Badge title={`Continental rank ${cr}`}>CR {cr}</Badge>
          ) : null}
          {wr && wr > 0 ? (
            <Badge tone="primary" title={`World rank ${wr}`}>
              WR {wr}
            </Badge>
          ) : null}
        </div>
      ) : null}
    </div>
  );
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

  // Best world rank first, matching how the WCA profile leads with strengths.
  const sortedRecords = useMemo(() => {
    if (!personalRecords) return [];
    return [...personalRecords]
      .filter(
        (record) =>
          record.world_ranking > 0 ||
          (record.average_world_ranking ?? 0) > 0,
      )
      .sort(
        (a, b) =>
          Math.min(a.world_ranking || Infinity, a.average_world_ranking || Infinity) -
          Math.min(b.world_ranking || Infinity, b.average_world_ranking || Infinity),
      );
  }, [personalRecords]);

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

  // Calculate WCA achievements - memoized to prevent recalculation
  const achievements = useMemo(() => {
    if (!personalRecords) return null;

    const totalEvents = personalRecords.length;
    const podiumFinishes =
      competitionResults?.filter((r) => r.pos <= 3).length || 0;
    const firstPlaces =
      competitionResults?.filter((r) => r.pos === 1).length || 0;

    // Only recalculate totalCompetitions when competitionDetails actually changes
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
  }, [personalRecords, competitionResults, competitionDetails.size]);

  const getIntensityColor = (level: number) => {
    const colors = {
      0: "bg-(--surface) border-(--border)",
      1: "bg-(--primary)/25 border-(--primary)/30",
      2: "bg-(--primary)/50 border-(--primary)/55",
      3: "bg-(--primary)/75 border-(--primary)/80",
      4: "bg-(--primary) border-(--primary)",
    };
    return colors[level as keyof typeof colors] || colors[0];
  };

  return (
    <div className="space-y-8">
      {/* WCA Achievements */}
      {/* <div className="timer-card">
        <h3 className="text-lg font-semibold text-(--text-primary) font-statement mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-(--primary)" />
          WCA Achievements
        </h3>
        {achievements ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
            <div className="bg-(--surface-elevated) rounded-(--radius-panel) p-3 sm:p-4 border border-(--border)">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-(--primary)/10 rounded-(--radius-control)">
                  <Target className="w-3 h-3 sm:w-4 sm:h-4 text-(--primary)" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-(--text-muted) uppercase tracking-wide truncate">
                    Events
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-(--text-primary)">
                    {achievements.totalEvents}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-(--surface-elevated) rounded-(--radius-panel) p-3 sm:p-4 border border-(--border)">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-(--primary)/10 rounded-(--radius-control)">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-(--primary)" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-(--text-muted) uppercase tracking-wide truncate">
                    Competitions
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-(--text-primary)">
                    {achievements.totalCompetitions}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-(--surface-elevated) rounded-(--radius-panel) p-3 sm:p-4 border border-(--border)">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-(--primary)/10 rounded-(--radius-control)">
                  <Medal className="w-3 h-3 sm:w-4 sm:h-4 text-(--primary)" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-(--text-muted) uppercase tracking-wide truncate">
                    Podiums
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-(--text-primary)">
                    {achievements.podiumFinishes}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-(--surface-elevated) rounded-(--radius-panel) p-3 sm:p-4 border border-(--border)">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-(--primary)/10 rounded-(--radius-control)">
                  <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-(--primary)" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-(--text-muted) uppercase tracking-wide truncate">
                    WRs
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-(--text-primary)">
                    {achievements.worldRecords}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-(--surface-elevated) rounded-(--radius-panel) p-3 sm:p-4 border border-(--border)">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-(--primary)/10 rounded-(--radius-control)">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-(--primary)" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-(--text-muted) uppercase tracking-wide truncate">
                    NRs
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-(--text-primary)">
                    {achievements.nationalRecords}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-(--surface-elevated) rounded-(--radius-panel) p-3 sm:p-4 border border-(--border)">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-(--primary)/10 rounded-(--radius-control)">
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-(--primary)" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-(--text-muted) uppercase tracking-wide truncate">
                    CRs
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-(--text-primary)">
                    {achievements.continentalRecords}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-(--surface-elevated) rounded-(--radius-panel) p-3 sm:p-4 border border-(--border)">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-(--primary)/10 rounded-(--radius-control)">
                  <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-(--primary)" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-(--text-muted) uppercase tracking-wide truncate">
                    Best WR
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-(--text-primary)">
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
            <div className="bg-(--surface-elevated) rounded-(--radius-panel) p-3 sm:p-4 border border-(--border)">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-(--primary)/10 rounded-(--radius-control)">
                  <Target className="w-3 h-3 sm:w-4 sm:h-4 text-(--primary)" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-(--text-muted) uppercase tracking-wide truncate">
                    Events
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-(--text-primary)">
                    0
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-(--surface-elevated) rounded-(--radius-panel) p-3 sm:p-4 border border-(--border)">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-(--primary)/10 rounded-(--radius-control)">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-(--primary)" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-(--text-muted) uppercase tracking-wide truncate">
                    Competitions
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-(--text-primary)">
                    0
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-(--surface-elevated) rounded-(--radius-panel) p-3 sm:p-4 border border-(--border)">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-(--primary)/10 rounded-(--radius-control)">
                  <Medal className="w-3 h-3 sm:w-4 sm:h-4 text-(--primary)" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-(--text-muted) uppercase tracking-wide truncate">
                    Podiums
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-(--text-primary)">
                    0
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-(--surface-elevated) rounded-(--radius-panel) p-3 sm:p-4 border border-(--border)">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-(--primary)/10 rounded-(--radius-control)">
                  <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-(--primary)" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-(--text-muted) uppercase tracking-wide truncate">
                    WRs
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-(--text-primary)">
                    0
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-(--surface-elevated) rounded-(--radius-panel) p-3 sm:p-4 border border-(--border)">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-(--primary)/10 rounded-(--radius-control)">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-(--primary)" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-(--text-muted) uppercase tracking-wide truncate">
                    NRs
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-(--text-primary)">
                    0
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-(--surface-elevated) rounded-(--radius-panel) p-3 sm:p-4 border border-(--border)">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-(--primary)/10 rounded-(--radius-control)">
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-(--primary)" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-(--text-muted) uppercase tracking-wide truncate">
                    CRs
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-(--text-primary)">
                    0
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-(--surface-elevated) rounded-(--radius-panel) p-3 sm:p-4 border border-(--border)">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-(--primary)/10 rounded-(--radius-control)">
                  <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-(--primary)" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-(--text-muted) uppercase tracking-wide truncate">
                    Best WR
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-(--text-primary)">
                    --
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div> */}

      {/* Current Personal Records */}
      {personalRecords && personalRecords.length > 0 && (
        <div className="timer-card">
          <div className="flex items-center gap-3 mb-4">
            <CardIcon>
              <Medal />
            </CardIcon>
            <div className="min-w-0">
              <h3 className="type-card-title">Current Personal Records</h3>
              <p className="type-caption">
                Official WCA results with national, continental and world rank
              </p>
            </div>
          </div>

          {/*
            Two presentations of one dataset. The table mirrors the WCA
            profile and needs the width; below `lg` each event becomes a card
            with its single and average stacked, because an eight-column table
            cannot be read on a phone without horizontal scrolling.
          */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm font-inter">
              <thead>
                <tr className="border-b border-(--border)">
                  <th className="py-2 pr-3 text-left type-overline font-semibold">
                    Event
                  </th>
                  <th className="py-2 px-2 text-right type-overline">NR</th>
                  <th className="py-2 px-2 text-right type-overline">CR</th>
                  <th className="py-2 px-2 text-right type-overline">WR</th>
                  <th className="py-2 px-3 text-right type-overline font-semibold">
                    Single
                  </th>
                  <th className="py-2 px-3 text-right type-overline font-semibold">
                    Average
                  </th>
                  <th className="py-2 px-2 text-right type-overline">WR</th>
                  <th className="py-2 px-2 text-right type-overline">CR</th>
                  <th className="py-2 pl-2 text-right type-overline">NR</th>
                </tr>
              </thead>
              <tbody>
                {sortedRecords.map((record) => (
                  <tr
                    key={record.event_id}
                    className="border-b border-(--border) last:border-0"
                  >
                    <td className="py-2 pr-3">
                      <span className="flex items-center gap-2 min-w-0">
                        <EventIcon size="sm" eventId={record.event_id} />
                        <span className="truncate text-(--text-primary)">
                          {EVENT_NAMES[
                            record.event_id as keyof typeof EVENT_NAMES
                          ] || record.event_id}
                        </span>
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right type-caption">
                      {rankText(record.national_ranking)}
                    </td>
                    <td className="py-2 px-2 text-right type-caption">
                      {rankText(record.continental_ranking)}
                    </td>
                    <td className="py-2 px-2 text-right type-caption">
                      {rankText(record.world_ranking)}
                    </td>
                    <td className="py-2 px-3 text-right type-time font-bold text-(--text-primary)">
                      {record.best > 0
                        ? formatTimeOrMoves(record.event_id, record.best)
                        : "—"}
                    </td>
                    <td className="py-2 px-3 text-right type-time font-bold text-(--text-primary)">
                      {record.average && record.average > 0
                        ? formatTimeOrMoves(record.event_id, record.average)
                        : "—"}
                    </td>
                    <td className="py-2 px-2 text-right type-caption">
                      {rankText(record.average_world_ranking)}
                    </td>
                    <td className="py-2 px-2 text-right type-caption">
                      {rankText(record.average_continental_ranking)}
                    </td>
                    <td className="py-2 pl-2 text-right type-caption">
                      {rankText(record.average_national_ranking)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="lg:hidden space-y-3">
            {sortedRecords.map((record) => (
              <li
                key={record.event_id}
                className="rounded-(--radius-panel) border border-(--border) bg-(--surface-elevated) p-3"
              >
                <div className="flex items-center gap-2 mb-3 min-w-0">
                  <EventIcon size="sm" eventId={record.event_id} />
                  <span className="type-label truncate">
                    {EVENT_NAMES[
                      record.event_id as keyof typeof EVENT_NAMES
                    ] || record.event_id}
                  </span>
                </div>

                <div className="divide-y divide-(--border) [&>*]:py-2 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0">
                  <RecordRow
                    label="Single"
                    value={
                      record.best > 0
                        ? formatTimeOrMoves(record.event_id, record.best)
                        : null
                    }
                    nr={record.national_ranking}
                    cr={record.continental_ranking}
                    wr={record.world_ranking}
                  />
                  <RecordRow
                    label="Average"
                    value={
                      record.average && record.average > 0
                        ? formatTimeOrMoves(record.event_id, record.average)
                        : null
                    }
                    nr={record.average_national_ranking}
                    cr={record.average_continental_ranking}
                    wr={record.average_world_ranking}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Competition Activity Heatmap */}
      {isLoadingCompetitions && competitionDetails.size === 0 ? (
        <HeatmapSkeleton />
      ) : (
        <div className="timer-card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h3 className="text-lg font-semibold text-(--text-primary) font-statement flex items-center gap-2">
              Competition Activity
            </h3>
            <div className="flex items-center gap-1 p-1 bg-(--surface-elevated) rounded-(--radius-control) border border-(--border) sm:overflow-x-auto">
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
                  className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-(--radius-badge) transition-all whitespace-nowrap flex-1 sm:flex-none ${
                    selectedPeriod === period
                      ? "bg-(--primary) text-(--on-primary) shadow-sm"
                      : "text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--surface)"
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
              <div className="flex items-center gap-2 text-xs text-(--text-muted)">
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
              <div className="text-xs text-(--text-muted)">
                Total: {competitionDetails.size} competitions
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Competition List */}
      <div className="timer-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-(--text-primary) font-statement flex items-center gap-2">
            Recent Competitions
          </h3>
          <div className="text-sm text-(--text-muted) font-medium">
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
            <MapPin className="w-12 h-12 text-(--text-muted) mx-auto mb-3" />
            <p className="text-(--text-secondary) font-inter">
              No competition data available
            </p>
          </div>
        )}
      </div>
    </div>
  );
}