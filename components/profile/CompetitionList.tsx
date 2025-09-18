"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Trophy,
  ExternalLink,
  Loader2,
  ChevronDown,
} from "lucide-react";

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

interface CompetitionListProps {
  competitionResults: WCACompetitionResult[] | null;
  competitionDetails: Map<string, CompetitionInfo>;
  isLoadingCompetitions: boolean;
}

export default function CompetitionList({
  competitionResults,
  competitionDetails,
  isLoadingCompetitions,
}: CompetitionListProps) {
  const [displayLimit, setDisplayLimit] = useState(10);

  const showMore = () => {
    setDisplayLimit((prev) => prev + 10);
  };
  const getEventName = (eventId: string) => {
    const events: Record<string, string> = {
      "333": "3x3",
      "222": "2x2",
      "444": "4x4",
      "555": "5x5",
      "666": "6x6",
      "777": "7x7",
      "333oh": "3x3 One-Handed",
      "333bf": "3x3 Blindfolded",
      "333fm": "3x3 Fewest Moves",
      "333ft": "3x3 With Feet",
      clock: "Clock",
      minx: "Megaminx",
      pyram: "Pyraminx",
      skewb: "Skewb",
      sq1: "Square-1",
      "444bf": "4x4 Blindfolded",
      "555bf": "5x5 Blindfolded",
      "333mbf": "3x3 Multi-Blind",
    };
    return events[eventId] || eventId;
  };

  const formatCompetitionName = (competitionId: string): string => {
    return competitionId
      .replace(/([A-Z])/g, " $1")
      .replace(/([0-9]+)/g, " $1")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^./, (str) => str.toUpperCase());
  };

  const getMainEvent = (events: string[]): string => {
    // Priority order for main events (most common/important first)
    const priority = [
      "333",
      "222",
      "444",
      "555",
      "333oh",
      "pyram",
      "skewb",
      "minx",
    ];

    for (const event of priority) {
      if (events.includes(event)) {
        return event;
      }
    }

    // If none of the priority events are found, return the first event
    return events[0] || "333";
  };

  const getUniqueCompetitions = () => {
    if (!competitionResults) return [];

    const competitionMap = new Map<string, CompetitionInfo>();
    competitionResults.forEach((result) => {
      if (!result.competition_id || !result.event_id) return;

      const compId = result.competition_id;
      if (!competitionMap.has(compId)) {
        const details = competitionDetails.get(compId);
        if (details) {
          competitionMap.set(compId, {
            ...details,
            events: [result.event_id],
            bestResult: result.pos || 999,
            mainEvent: result.event_id,
          });
        } else {
          competitionMap.set(compId, {
            id: result.competition_id,
            name: formatCompetitionName(result.competition_id),
            start_date: "",
            end_date: "",
            city: undefined,
            venue: undefined,
            country_iso2: "",
            events: [result.event_id],
            bestResult: result.pos || 999,
            mainEvent: result.event_id,
          });
        }
      } else {
        const existing = competitionMap.get(compId);
        if (existing && !existing.events.includes(result.event_id)) {
          existing.events.push(result.event_id);
          existing.bestResult = Math.min(
            existing.bestResult,
            result.pos || 999
          );
        }
      }
    });

    // Set main event for each competition
    competitionMap.forEach((competition) => {
      competition.mainEvent = getMainEvent(competition.events);
    });

    return Array.from(competitionMap.values()).sort((a, b) => {
      if (a.start_date && b.start_date) {
        return (
          new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
        );
      }
      return a.id.localeCompare(b.id);
    });
  };

  if (isLoadingCompetitions) {
    return (
      <div className="timer-card">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 font-statement flex items-center gap-3">
          <Calendar className="w-6 h-6 text-[var(--primary)]" />
          Competition History
        </h2>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-[var(--primary)] animate-spin mr-2" />
          <span className="text-[var(--text-secondary)] font-inter">
            Loading competition history...
          </span>
        </div>
      </div>
    );
  }

  if (!competitionResults || competitionResults.length === 0) {
    return (
      <div className="timer-card">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 font-statement flex items-center gap-3">
          <Calendar className="w-6 h-6 text-[var(--primary)]" />
          Competition History
        </h2>
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)] font-inter text-lg">
            No competition history found.
          </p>
          <p className="text-[var(--text-muted)] font-inter text-sm mt-2">
            This cuber hasn't participated in any WCA competitions yet.
          </p>
        </div>
      </div>
    );
  }

  const competitions = getUniqueCompetitions();
  const displayedCompetitions = competitions.slice(0, displayLimit);
  const hasMoreCompetitions = competitions.length > displayLimit;

  return (
    <div className="timer-card">
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 font-statement flex items-center gap-3">
        <Calendar className="w-6 h-6 text-[var(--primary)]" />
        Competition History
        <span className="text-sm font-normal text-[var(--text-muted)] ml-2">
          ({competitions.length} competitions)
        </span>
      </h2>

      <div className="space-y-4">
        {displayedCompetitions.map((competition) => (
          <div
            key={competition.id}
            className="p-4 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg hover:border-[var(--primary)]/50 transition-all duration-200 group"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-semibold text-[var(--text-primary)] font-statement group-hover:text-[var(--primary)] transition-colors">
                    {competition.name}
                  </h3>
                  {competition.bestResult && competition.bestResult <= 3 && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 text-yellow-200 border border-yellow-500/30 rounded-full text-xs">
                      <Trophy className="w-3 h-3" />
                      <span className="font-bold">
                        #{competition.bestResult}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)] mb-3">
                  {competition.start_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span className="font-inter">
                        {new Date(competition.start_date).toLocaleDateString()}
                        {competition.end_date &&
                          competition.start_date !== competition.end_date &&
                          ` - ${new Date(competition.end_date).toLocaleDateString()}`}
                      </span>
                    </div>
                  )}
                  {competition.city && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span className="font-inter">{competition.city}</span>
                    </div>
                  )}
                </div>

                {/* Main Event Display */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-muted)] font-inter">
                      Main Event:
                    </span>
                    <span className="px-2 py-1 bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 rounded text-sm font-inter">
                      {getEventName(competition.mainEvent || "Not Available")}
                    </span>
                  </div>

                  <Link
                    href={`https://www.worldcubeassociation.org/competitions/${competition.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30 rounded transition-all duration-200 font-inter text-xs"
                  >
                    Results <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {hasMoreCompetitions && (
          <div className="text-center py-4">
            <button
              onClick={showMore}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30 rounded-lg transition-all duration-200 font-inter text-sm"
            >
              <span>Show More Competitions</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            <p className="text-xs text-[var(--text-muted)] mt-2">
              Showing {displayedCompetitions.length} of {competitions.length}{" "}
              competitions
            </p>
          </div>
        )}
      </div>
    </div>
  );
}