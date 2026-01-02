"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  ExternalLink,
  Play,
  Trophy,
  Settings,
  ArrowRight,
  Check,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { WCA_CONFIG } from "@/lib/wca-config";
import { getFromCache, saveToCache } from "@/lib/wca-cache";
import { isCompetitionPast } from "@/lib/date-utils";
import { WCA_EVENTS, WCACompetition } from "./CompetitionBrowser";
import RoundSimulator from "./RoundSimulator";
import WCAScorecard from "./WCAScorecard";
import AtmosphereControls from "./AtmosphereControls";
import CompetitionAnalytics from "./CompetitionAnalytics";
import { CompetitionOverviewSkeleton } from "@/components/SkeletonLoaders";

export interface RoundResult {
  eventId: string;
  roundNumber: number;
  solves: SolveResult[];
  average: number;
  best: number;
  completedAt: string;
}

export interface SolveResult {
  time: number;
  scramble: string;
  penalty: "none" | "+2" | "DNF";
  inspectionViolation: "+2" | "DNF" | null;
}

export interface AtmosphereSettings {
  crowdNoise: number; // 0-100
  pressure: number; // 0-100
  distractions: boolean;
  timerDelay: boolean; // true = random delay before start
  judgeInteractions: boolean;
}

type SimulationPhase =
  | "overview"
  | "event-select"
  | "round"
  | "round-complete"
  | "event-complete"
  | "competition-complete";

const DEFAULT_ATMOSPHERE: AtmosphereSettings = {
  crowdNoise: 30,
  pressure: 50,
  distractions: false,
  timerDelay: true,
  judgeInteractions: true,
};

export default function CompetitionDetail() {
  const params = useParams();
  const competitionId = params.competitionId as string;

  const [competition, setCompetition] = useState<WCACompetition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulation state
  const [phase, setPhase] = useState<SimulationPhase>("overview");
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [maxRounds, setMaxRounds] = useState(1); // Most events have 1-3 rounds
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [atmosphere, setAtmosphere] =
    useState<AtmosphereSettings>(DEFAULT_ATMOSPHERE);
  const [showSettings, setShowSettings] = useState(false);

  // Track completed events
  const [completedEvents, setCompletedEvents] = useState<Set<string>>(
    new Set()
  );
  const [eventProgress, setEventProgress] = useState<Map<string, number>>(
    new Map()
  ); // eventId -> rounds completed
  const [eventRounds, setEventRounds] = useState<Record<string, number>>({}); // eventId -> actual rounds from WCIF

  // Fetch competition details
  useEffect(() => {
    const fetchCompetition = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const cacheKey = `comp_detail_${competitionId}`;
        const wcifCacheKey = `comp_wcif_${competitionId}`;
        const cached = getFromCache<WCACompetition>(cacheKey);
        const cachedWcif = getFromCache<Record<string, number>>(wcifCacheKey);

        if (cached) {
          setCompetition(cached);
          if (cachedWcif) {
            setEventRounds(cachedWcif);
          }
          setIsLoading(false);
          // Fetch WCIF data if not cached
          if (!cachedWcif) {
            fetchWcifData(cached.event_ids);
          }
          return;
        }

        const response = await fetch(
          `${WCA_CONFIG.API_BASE_URL}/competitions/${competitionId}`
        );
        if (!response.ok) throw new Error("Competition not found");

        const data = await response.json();
        const comp: WCACompetition = {
          id: data.id,
          name: data.name,
          city: data.city,
          country_iso2: data.country_iso2,
          start_date: data.start_date,
          end_date: data.end_date,
          venue: data.venue || "",
          event_ids: data.event_ids || [],
          competitor_limit: data.competitor_limit,
          url: data.url,
          cancelled_at: data.cancelled_at,
        };

        saveToCache(cacheKey, comp, 60 * 60 * 1000); // 1hr cache
        setCompetition(comp);

        // Fetch WCIF data to get actual round counts
        fetchWcifData(comp.event_ids);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load competition"
        );
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch WCIF data for round counts
    const fetchWcifData = async (eventIds: string[]) => {
      try {
        const wcifCacheKey = `comp_wcif_${competitionId}`;
        const wcifResponse = await fetch(
          `${WCA_CONFIG.API_BASE_URL}/competitions/${competitionId}/wcif/public`
        );

        if (wcifResponse.ok) {
          const wcifData = await wcifResponse.json();
          const rounds: Record<string, number> = {};

          // Extract rounds from WCIF events data
          if (wcifData.events && Array.isArray(wcifData.events)) {
            wcifData.events.forEach(
              (event: { id: string; rounds?: unknown[] }) => {
                if (event.rounds && Array.isArray(event.rounds)) {
                  rounds[event.id] = event.rounds.length;
                }
              }
            );
          }

          // For any events without WCIF data, use fallback
          eventIds.forEach((eventId) => {
            if (!rounds[eventId]) {
              // Fallback: major events get 3 rounds, others get 2
              const majorEvents = [
                "333",
                "222",
                "444",
                "333oh",
                "pyram",
                "skewb",
              ];
              rounds[eventId] = majorEvents.includes(eventId) ? 3 : 2;
            }
          });

          setEventRounds(rounds);
          saveToCache(wcifCacheKey, rounds, 60 * 60 * 1000); // 1hr cache
        } else {
          // Fallback if WCIF fetch fails
          const fallbackRounds: Record<string, number> = {};
          eventIds.forEach((eventId) => {
            const majorEvents = [
              "333",
              "222",
              "444",
              "333oh",
              "pyram",
              "skewb",
            ];
            fallbackRounds[eventId] = majorEvents.includes(eventId) ? 3 : 2;
          });
          setEventRounds(fallbackRounds);
        }
      } catch (wcifErr) {
        console.warn(
          "Failed to fetch WCIF data, using fallback rounds:",
          wcifErr
        );
        // Fallback if WCIF fetch fails
        const fallbackRounds: Record<string, number> = {};
        eventIds.forEach((eventId) => {
          const majorEvents = ["333", "222", "444", "333oh", "pyram", "skewb"];
          fallbackRounds[eventId] = majorEvents.includes(eventId) ? 3 : 2;
        });
        setEventRounds(fallbackRounds);
      }
    };

    if (competitionId) {
      fetchCompetition();
    }
  }, [competitionId]);

  // Load saved progress
  useEffect(() => {
    if (!competitionId) return;
    const saved = localStorage.getItem(`sim_progress_${competitionId}`);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setRoundResults(data.roundResults || []);
        setCompletedEvents(new Set(data.completedEvents || []));
        setEventProgress(new Map(Object.entries(data.eventProgress || {})));
        setAtmosphere(data.atmosphere || DEFAULT_ATMOSPHERE);
      } catch (e) {
        console.error("Failed to load progress:", e);
      }
    }
  }, [competitionId]);

  // Save progress
  const saveProgress = useCallback(() => {
    if (!competitionId) return;
    const data = {
      roundResults,
      completedEvents: Array.from(completedEvents),
      eventProgress: Object.fromEntries(eventProgress),
      atmosphere,
    };
    localStorage.setItem(`sim_progress_${competitionId}`, JSON.stringify(data));
  }, [competitionId, roundResults, completedEvents, eventProgress, atmosphere]);

  useEffect(() => {
    saveProgress();
  }, [saveProgress]);

  // Helpers
  const getMaxRounds = (eventId: string): number => {
    // Use actual rounds from WCIF data if available
    if (eventRounds[eventId] && eventRounds[eventId] > 0) {
      return eventRounds[eventId];
    }
    // Fallback: major events get 3 rounds, others get 2
    const majorEvents = ["333", "222", "444", "333oh", "pyram", "skewb"];
    return majorEvents.includes(eventId) ? 3 : 2;
  };

  const handleSelectEvent = (eventId: string) => {
    setSelectedEvent(eventId);
    const progress = eventProgress.get(eventId) || 0;
    setCurrentRound(progress + 1);
    setMaxRounds(getMaxRounds(eventId));
    setPhase("round");
  };

  const handleRoundComplete = (result: RoundResult) => {
    setRoundResults((prev) => [...prev, result]);

    // Update progress
    const newProgress = new Map(eventProgress);
    newProgress.set(result.eventId, result.roundNumber);
    setEventProgress(newProgress);

    if (result.roundNumber >= maxRounds) {
      // Event complete
      setCompletedEvents((prev) => new Set([...prev, result.eventId]));
      setPhase("event-complete");
    } else {
      setPhase("round-complete");
    }
  };

  const handleNextRound = () => {
    setCurrentRound((prev) => prev + 1);
    setPhase("round");
  };

  const handleBackToEvents = () => {
    setSelectedEvent(null);
    setPhase("event-select");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isPastCompetition = () => {
    if (!competition) return false;
    // The competition is past if the end date is before today
    return isCompetitionPast(competition.start_date, competition.end_date);
  };

  // Get results for current event
  const getCurrentEventResults = () => {
    if (!selectedEvent) return [];
    return roundResults.filter((r) => r.eventId === selectedEvent);
  };

  if (isLoading) {
    return <CompetitionOverviewSkeleton />;
  }

  if (error || !competition) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="timer-card text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-[var(--error)] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
            Competition Not Found
          </h2>
          <p className="text-[var(--text-muted)] mb-4">
            {error || "The competition could not be loaded."}
          </p>
          <Link
            href="/cube-lab/competitions"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Competitions
          </Link>
        </div>
      </div>
    );
  }

  // Overview Phase
  if (phase === "overview") {
    return (
      <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Back Link */}
          <Link
            href="/cube-lab/competitions"
            className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Competitions
          </Link>

          {/* Competition Header */}
          <div className="timer-card">
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] font-statement">
                  {competition.name}
                </h1>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-[var(--text-muted)]">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {formatDate(competition.start_date)}
                    {competition.start_date !== competition.end_date &&
                      ` - ${formatDate(competition.end_date)}`}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {competition.city}, {competition.country_iso2}
                  </span>
                  {competition.competitor_limit && (
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      {competition.competitor_limit} competitors
                    </span>
                  )}
                </div>
                {competition.venue && (
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    {competition.venue}
                  </p>
                )}
              </div>

              {competition.url && (
                <a
                  href={competition.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--primary)] border border-[var(--primary)] rounded-lg hover:bg-[var(--primary)]/10 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View on WCA
                </a>
              )}
            </div>
          </div>

          {/* Events */}
          <div className="timer-card">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">
              Events
            </h2>
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
              {competition.event_ids.map((eventId) => {
                const event = WCA_EVENTS.find((e) => e.id === eventId);
                const isCompleted = completedEvents.has(eventId);
                const progress = eventProgress.get(eventId) || 0;

                return event ? (
                  <div
                    key={eventId}
                    className={`relative flex flex-col items-center gap-2 p-3 rounded-lg border ${
                      isCompleted
                        ? "border-[var(--success)] bg-[var(--success)]/10"
                        : progress > 0
                          ? "border-[var(--warning)] bg-[var(--warning)]/10"
                          : "border-[var(--border)] bg-[var(--surface)]"
                    }`}
                  >
                    {isCompleted && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--success)] rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <Image
                      src={event.icon}
                      alt={event.name}
                      width={24}
                      height={24}
                      className="invert opacity-80"
                    />
                    <span className="text-xs text-[var(--text-secondary)] text-center">
                      {event.name}
                    </span>
                    {progress > 0 && !isCompleted && (
                      <span className="text-xs text-[var(--warning)]">
                        R{progress}
                      </span>
                    )}
                  </div>
                ) : null;
              })}
            </div>
          </div>

          {/* Atmosphere Settings Preview */}
          <div className="timer-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                Simulation Atmosphere
              </h2>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 text-sm text-[var(--primary)]"
              >
                <Settings className="w-4 h-4" />
                {showSettings ? "Hide" : "Configure"}
              </button>
            </div>

            {showSettings ? (
              <AtmosphereControls
                atmosphere={atmosphere}
                onChange={setAtmosphere}
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-[var(--surface-elevated)] rounded-lg">
                  <div className="text-2xl font-bold text-[var(--primary)]">
                    {atmosphere.crowdNoise}%
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    Crowd Noise
                  </div>
                </div>
                <div className="text-center p-3 bg-[var(--surface-elevated)] rounded-lg">
                  <div className="text-2xl font-bold text-[var(--warning)]">
                    {atmosphere.pressure}%
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    Pressure
                  </div>
                </div>
                <div className="text-center p-3 bg-[var(--surface-elevated)] rounded-lg">
                  <div className="text-2xl font-bold text-[var(--text-primary)]">
                    {atmosphere.distractions ? "On" : "Off"}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    Distractions
                  </div>
                </div>
                <div className="text-center p-3 bg-[var(--surface-elevated)] rounded-lg">
                  <div className="text-2xl font-bold text-[var(--text-primary)]">
                    {atmosphere.judgeInteractions ? "On" : "Off"}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    Judge Sim
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Start Button */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setPhase("event-select")}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-[var(--primary)] text-white text-lg font-bold rounded-xl hover:bg-[var(--primary-hover)] transition-colors"
            >
              <Play className="w-6 h-6" />
              Start Competition Simulation
            </button>

            {roundResults.length > 0 && (
              <button
                onClick={() => setPhase("competition-complete")}
                className="flex items-center justify-center gap-2 px-6 py-4 border border-[var(--border)] text-[var(--text-primary)] font-medium rounded-xl hover:bg-[var(--surface-elevated)] transition-colors"
              >
                <BarChart3 className="w-5 h-5" />
                View Results & Analytics
              </button>
            )}
          </div>

          {/* Progress Summary */}
          {completedEvents.size > 0 && (
            <div className="timer-card">
              <h3 className="font-bold text-[var(--text-primary)] mb-3">
                Your Progress
              </h3>
              <div className="text-sm text-[var(--text-muted)]">
                {completedEvents.size} of {competition.event_ids.length} events
                completed
              </div>
              <div className="w-full h-2 bg-[var(--surface-elevated)] rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-[var(--success)] transition-all"
                  style={{
                    width: `${(completedEvents.size / competition.event_ids.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Event Selection Phase
  if (phase === "event-select") {
    return (
      <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <button
            onClick={() => setPhase("overview")}
            className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--primary)]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Overview
          </button>

          <div className="timer-card">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
              {competition.name}
            </h2>
            <p className="text-[var(--text-muted)]">
              Select an event to simulate
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {competition.event_ids.map((eventId) => {
              const event = WCA_EVENTS.find((e) => e.id === eventId);
              const isCompleted = completedEvents.has(eventId);
              const progress = eventProgress.get(eventId) || 0;
              const rounds = getMaxRounds(eventId);

              return event ? (
                <button
                  key={eventId}
                  onClick={() => !isCompleted && handleSelectEvent(eventId)}
                  disabled={isCompleted}
                  className={`relative flex flex-col items-center gap-3 p-6 rounded-xl border transition-all ${
                    isCompleted
                      ? "border-[var(--success)] bg-[var(--success)]/10 cursor-default"
                      : progress > 0
                        ? "border-[var(--warning)] bg-[var(--warning)]/5 hover:border-[var(--primary)]"
                        : "border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5"
                  }`}
                >
                  {isCompleted && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-[var(--success)] rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <Image
                    src={event.icon}
                    alt={event.name}
                    width={40}
                    height={40}
                    className="invert opacity-80"
                  />
                  <span className="font-medium text-[var(--text-primary)]">
                    {event.name}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    {isCompleted
                      ? "Completed"
                      : progress > 0
                        ? `Round ${progress}/${rounds}`
                        : `${rounds} rounds`}
                  </span>
                </button>
              ) : null;
            })}
          </div>

          {completedEvents.size === competition.event_ids.length && (
            <div className="timer-card text-center">
              <Trophy className="w-16 h-16 text-[var(--warning)] mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                Competition Complete!
              </h3>
              <p className="text-[var(--text-muted)] mb-4">
                You've completed all events in this competition simulation.
              </p>
              <button
                onClick={() => setPhase("competition-complete")}
                className="px-6 py-3 bg-[var(--primary)] text-white font-medium rounded-lg"
              >
                View Full Results & Analytics
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Round Simulation Phase
  if (phase === "round" && selectedEvent) {
    const event = WCA_EVENTS.find((e) => e.id === selectedEvent);

    return (
      <RoundSimulator
        competition={competition}
        event={event!}
        roundNumber={currentRound}
        maxRounds={maxRounds}
        atmosphere={atmosphere}
        onComplete={handleRoundComplete}
        onBack={handleBackToEvents}
      />
    );
  }

  // Round Complete Phase
  if (phase === "round-complete" && selectedEvent) {
    const event = WCA_EVENTS.find((e) => e.id === selectedEvent);
    const latestResult = roundResults[roundResults.length - 1];

    return (
      <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="timer-card text-center">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              Round {currentRound} Complete!
            </h2>
            <p className="text-[var(--text-muted)]">
              {event?.name} • {competition.name}
            </p>
          </div>

          {/* WCA Result Card */}
          <WCAScorecard
            competition={competition}
            event={event!}
            roundNumber={currentRound}
            result={latestResult}
          />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {currentRound < maxRounds && (
              <button
                onClick={handleNextRound}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--primary)] text-white font-medium rounded-lg"
              >
                Continue to Round {currentRound + 1}
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={handleBackToEvents}
              className="px-6 py-3 border border-[var(--border)] text-[var(--text-primary)] font-medium rounded-lg"
            >
              Back to Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Event Complete Phase
  if (phase === "event-complete" && selectedEvent) {
    const event = WCA_EVENTS.find((e) => e.id === selectedEvent);
    const eventResults = getCurrentEventResults();
    const finalResult = eventResults[eventResults.length - 1];

    return (
      <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="timer-card text-center">
            <Trophy className="w-16 h-16 text-[var(--warning)] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              {event?.name} Complete!
            </h2>
            <p className="text-[var(--text-muted)]">{competition.name}</p>
          </div>

          <WCAScorecard
            competition={competition}
            event={event!}
            roundNumber={finalResult.roundNumber}
            result={finalResult}
          />

          {/* Continue */}
          <div className="flex justify-center">
            <button
              onClick={handleBackToEvents}
              className="flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white font-medium rounded-lg"
            >
              Continue to Next Event
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Competition Complete Phase
  if (phase === "competition-complete") {
    return (
      <CompetitionAnalytics
        competition={competition}
        results={roundResults}
        isPast={isPastCompetition()}
        onBack={() => setPhase("overview")}
      />
    );
  }

  return null;
}
