"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Trophy, Check, BarChart3, ArrowRight } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { WCA_EVENTS } from "./CompetitionBrowser";
import RoundSimulatorRedesigned from "./RoundSimulatorRedesigned";
import WCAScorecard from "./WCAScorecard";
import CompetitionAnalytics from "./CompetitionAnalytics";
import { useUser } from "@/components/UserProvider";
import { SimulationEventSelectSkeleton } from "@/components/SkeletonLoaders";

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

interface AtmosphereSettings {
  crowdNoise: number;
  pressure: number;
  distractions: boolean;
  timerDelay: boolean;
  judgeInteractions: boolean;
}

type SimulationPhase =
  | "loading"
  | "event-select"
  | "round"
  | "round-complete"
  | "event-complete"
  | "competition-complete";

export default function SimulationRunner() {
  const params = useParams();
  const router = useRouter();
  const competitionId = params.competitionId as string;
  const simulationId = params.simulationId as string;

  // Convex queries and mutations
  const simulation = useQuery(
    api.competitionSimulations.getSimulation,
    simulationId
      ? { simulationId: simulationId as Id<"competitionSimulations"> }
      : "skip"
  );
  const savedResults = useQuery(
    api.competitionSimulations.getSimulationResults,
    simulationId
      ? { simulationId: simulationId as Id<"competitionSimulations"> }
      : "skip"
  );
  const updateProgress = useMutation(
    api.competitionSimulations.updateSimulationProgress
  );
  const saveRoundResult = useMutation(
    api.competitionSimulations.saveRoundResult
  );
  const completeSimulation = useMutation(
    api.competitionSimulations.completeSimulation
  );

  // Local state
  const [phase, setPhase] = useState<SimulationPhase>("loading");
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [maxRounds, setMaxRounds] = useState(1);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [completedEvents, setCompletedEvents] = useState<Set<string>>(
    new Set()
  );
  const [eventProgress, setEventProgress] = useState<Map<string, number>>(
    new Map()
  );
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from simulation data - only once on first load
  useEffect(() => {
    if (simulation && savedResults && !isInitialized) {
      // Restore progress from saved data
      setCompletedEvents(new Set(simulation.completedEvents || []));
      setEventProgress(new Map(Object.entries(simulation.eventProgress || {})));

      // Convert saved results to local format
      const localResults: RoundResult[] = savedResults.map((r: any) => ({
        eventId: r.eventId,
        roundNumber: r.roundNumber,
        solves: r.solves.map((s: any) => ({
          time: s.time,
          scramble: s.scramble,
          penalty: s.penalty,
          inspectionViolation: s.inspectionViolation || null,
        })),
        average: r.average,
        best: r.best,
        completedAt: new Date(r.completedAt).toISOString(),
      }));
      setRoundResults(localResults);

      setPhase("event-select");
      setIsInitialized(true);
    }
  }, [simulation, savedResults, isInitialized]);

  // Helper to get max rounds for an event
  const getMaxRounds = (eventId: string): number => {
    // Use stored eventRounds from simulation if available
    if (simulation?.eventRounds && typeof simulation.eventRounds === "object") {
      const rounds = (simulation.eventRounds as Record<string, number>)[
        eventId
      ];
      if (typeof rounds === "number" && rounds > 0) {
        return rounds;
      }
    }
    // Fallback for older simulations without eventRounds data
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

  const handleRoundComplete = async (result: RoundResult) => {
    setRoundResults((prev) => [...prev, result]);

    // Update progress
    const newProgress = new Map(eventProgress);
    newProgress.set(result.eventId, result.roundNumber);
    setEventProgress(newProgress);

    // Save to Convex
    if (simulationId) {
      try {
        // Save the round result
        await saveRoundResult({
          simulationId: simulationId as Id<"competitionSimulations">,
          eventId: result.eventId,
          roundNumber: result.roundNumber,
          solves: result.solves.map((s) => ({
            time: s.time,
            scramble: s.scramble,
            penalty: s.penalty,
            inspectionViolation: s.inspectionViolation,
            solvedAt: Date.now(),
          })),
          average: result.average,
          best: result.best,
        });

        // Check if event is complete
        const isEventComplete = result.roundNumber >= maxRounds;
        const newCompletedEvents = isEventComplete
          ? [...completedEvents, result.eventId]
          : Array.from(completedEvents);

        // Update simulation progress
        await updateProgress({
          simulationId: simulationId as Id<"competitionSimulations">,
          completedEvents: newCompletedEvents,
          eventProgress: Object.fromEntries(newProgress),
        });

        if (isEventComplete) {
          setCompletedEvents(new Set(newCompletedEvents));
          setPhase("event-complete");
        } else {
          setPhase("round-complete");
        }
      } catch (err) {
        console.error("Failed to save result:", err);
        // Still update local state even if save fails
        if (result.roundNumber >= maxRounds) {
          setCompletedEvents((prev) => new Set([...prev, result.eventId]));
          setPhase("event-complete");
        } else {
          setPhase("round-complete");
        }
      }
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

  const handleCompleteSimulation = async () => {
    if (simulationId) {
      try {
        await completeSimulation({
          simulationId: simulationId as Id<"competitionSimulations">,
        });
      } catch (err) {
        console.error("Failed to complete simulation:", err);
      }
    }
    setPhase("competition-complete");
  };

  // Get results for current event
  const getCurrentEventResults = () => {
    if (!selectedEvent) return [];
    return roundResults.filter((r) => r.eventId === selectedEvent);
  };

  if (phase === "loading" || !simulation) {
    return <SimulationEventSelectSkeleton />;
  }

  // Build a mock competition object from simulation data
  const competition = {
    id: simulation.competitionId,
    name: simulation.competitionName,
    city: simulation.competitionCity || "",
    country_iso2: simulation.competitionCountry || "",
    start_date: simulation.competitionDate,
    end_date: simulation.competitionDate,
    venue: simulation.competitionVenue || "",
    event_ids: simulation.selectedEvents,
  };

  const atmosphere: AtmosphereSettings = simulation.atmosphereSettings;

  // Event Selection Phase
  if (phase === "event-select") {
    const allEventsCompleted = (simulation.selectedEvents as string[]).every(
      (e: string) => completedEvents.has(e)
    );

    return (
      <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Link
            href={`/cube-lab/competitions/${competitionId}`}
            className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--primary)]"
          >
            <ArrowLeft className="w-4 h-4" />
            Exit Simulation
          </Link>

          <div className="timer-card">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
              {competition.name}
            </h2>
            <p className="text-[var(--text-muted)]">
              Select an event to simulate
            </p>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-[var(--text-muted)] mb-2">
                <span>
                  {completedEvents.size} of {simulation.selectedEvents.length}{" "}
                  events completed
                </span>
                <span>
                  {Math.round(
                    (completedEvents.size / simulation.selectedEvents.length) *
                      100
                  )}
                  %
                </span>
              </div>
              <div className="w-full h-2 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--success)] transition-all"
                  style={{
                    width: `${(completedEvents.size / simulation.selectedEvents.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {(simulation.selectedEvents as string[]).map((eventId: string) => {
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

          {allEventsCompleted && (
            <div className="timer-card text-center">
              <Trophy className="w-16 h-16 text-[var(--warning)] mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                Competition Complete!
              </h3>
              <p className="text-[var(--text-muted)] mb-4">
                You've completed all events in this competition simulation.
              </p>
              <button
                onClick={handleCompleteSimulation}
                className="px-6 py-3 bg-[var(--primary)] text-white font-medium rounded-lg"
              >
                View Full Results & Analytics
              </button>
            </div>
          )}

          {roundResults.length > 0 && !allEventsCompleted && (
            <div className="flex justify-center">
              <button
                onClick={() => setPhase("competition-complete")}
                className="flex items-center gap-2 px-6 py-3 border border-[var(--border)] text-[var(--text-primary)] font-medium rounded-lg hover:bg-[var(--surface-elevated)] transition-colors"
              >
                <BarChart3 className="w-5 h-5" />
                View Current Results
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
      <RoundSimulatorRedesigned
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

          <WCAScorecard
            competition={competition}
            event={event!}
            roundNumber={currentRound}
            result={latestResult}
          />

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
        isPast={false}
        onBack={() => setPhase("event-select")}
      />
    );
  }

  return null;
}
