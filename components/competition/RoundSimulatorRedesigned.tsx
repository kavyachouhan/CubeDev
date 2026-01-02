"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { WCACompetition } from "./CompetitionBrowser";
import {
  AtmosphereSettings,
  RoundResult,
  SolveResult,
} from "./CompetitionDetail";
import { scrambleGenerator } from "@/components/timer/ScrambleGenerator";
import CompetitionTimer from "./CompetitionTimer";
import CompetitionManualTimer from "./CompetitionManualTimer";
import CompetitionStackmatTimer from "./CompetitionStackmatTimer";
import CompetitionTimerModeSelector, {
  CompetitionTimerMode,
} from "./CompetitionTimerModeSelector";
import CompetitionScramblePanel from "./CompetitionScramblePanel";
import SolveProgressIndicator from "./SolveProgressIndicator";
import SimulationAtmospherePanel from "./SimulationAtmospherePanel";
import { useCompetitionAudio } from "./CompetitionAudioManager";

interface WCAEvent {
  id: string;
  name: string;
  icon: string;
}

interface RoundSimulatorRedesignedProps {
  competition: WCACompetition;
  event: WCAEvent;
  roundNumber: number;
  maxRounds: number;
  atmosphere: AtmosphereSettings;
  onComplete: (result: RoundResult) => void;
  onBack: () => void;
}

export default function RoundSimulatorRedesigned({
  competition,
  event,
  roundNumber,
  maxRounds,
  atmosphere,
  onComplete,
  onBack,
}: RoundSimulatorRedesignedProps) {
  const [currentSolve, setCurrentSolve] = useState(0);
  const [solves, setSolves] = useState<SolveResult[]>([]);
  const [scramble, setScramble] = useState<string>("");
  const [isLoadingScramble, setIsLoadingScramble] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<CompetitionTimerMode>(() => {
    if (typeof window === "undefined") return "normal";
    try {
      const saved = localStorage.getItem("cubelab-competition-timer-mode");
      return (saved as CompetitionTimerMode) || "normal";
    } catch {
      return "normal";
    }
  });

  // Persist timer mode
  useEffect(() => {
    try {
      localStorage.setItem("cubelab-competition-timer-mode", timerMode);
    } catch {}
  }, [timerMode]);

  // Competition audio
  const { startCrowdNoise, stopCrowdNoise, playEffect } = useCompetitionAudio(
    atmosphere,
    soundEnabled
  );

  // Start crowd noise on mount
  useEffect(() => {
    if (soundEnabled && atmosphere.crowdNoise > 0) {
      startCrowdNoise();
    }
    return () => {
      stopCrowdNoise();
    };
  }, [soundEnabled, atmosphere.crowdNoise, startCrowdNoise, stopCrowdNoise]);

  // Generate scramble
  const generateScramble = useCallback(async () => {
    setIsLoadingScramble(true);
    try {
      const newScramble = await scrambleGenerator.generateScramble(event.id);
      setScramble(newScramble);
    } catch (error) {
      console.error("Failed to generate scramble:", error);
      // Fallback scramble
      setScramble("R U R' U' R' F R2 U' R' U' R U R' F'");
    } finally {
      setIsLoadingScramble(false);
    }
  }, [event.id]);

  // Generate initial scramble on mount
  useEffect(() => {
    generateScramble();
  }, [generateScramble]);

  // Complete a solve
  const handleSolveComplete = useCallback(
    (
      time: number,
      penalty: "none" | "+2" | "DNF",
      inspectionViolation: "+2" | "DNF" | null
    ) => {
      const solve: SolveResult = {
        time,
        scramble,
        penalty,
        inspectionViolation,
      };

      const newSolves = [...solves, solve];
      setSolves(newSolves);

      if (newSolves.length >= 5) {
        // Round complete - calculate results
        const times = newSolves.map((s) => {
          if (s.penalty === "DNF") return Infinity;
          let t = s.time;
          if (s.penalty === "+2" || s.inspectionViolation === "+2") {
            t += 2000;
          }
          return t;
        });

        const sorted = [...times].sort((a, b) => a - b);
        const middle3 = sorted.slice(1, 4);
        const avg = middle3.includes(Infinity)
          ? Infinity
          : middle3.reduce((a, b) => a + b, 0) / 3;

        const result: RoundResult = {
          eventId: event.id,
          roundNumber,
          solves: newSolves,
          average: avg,
          best: Math.min(...times.filter((t) => t !== Infinity)),
          completedAt: new Date().toISOString(),
        };

        onComplete(result);
      } else {
        // Next solve
        setCurrentSolve(newSolves.length);
        generateScramble();
      }
    },
    [solves, scramble, event.id, roundNumber, onComplete, generateScramble]
  );

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="flex items-center gap-3">
            <CompetitionTimerModeSelector
              timerMode={timerMode}
              onTimerModeChange={setTimerMode}
              disabled={isTimerRunning}
            />
            <SimulationAtmospherePanel
              atmosphere={atmosphere}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled(!soundEnabled)}
              isCompact
            />
          </div>
        </div>

        {/* Competition/Event Header */}
        <div className="timer-card mb-6">
          <div className="flex items-center gap-4">
            <Image
              src={event.icon}
              alt={event.name}
              width={32}
              height={32}
              className="invert opacity-80"
            />
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-[var(--text-primary)] truncate">
                {event.name}
              </h2>
              <p className="text-sm text-[var(--text-muted)] truncate">
                Round {roundNumber} of {maxRounds} • {competition.name}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content - Two Column Layout on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Scramble and Progress */}
          <div className="lg:col-span-5 space-y-6">
            {/* Scramble Panel */}
            <CompetitionScramblePanel
              scramble={scramble}
              eventId={event.id}
              solveNumber={currentSolve + 1}
              totalSolves={5}
              isLoading={isLoadingScramble}
            />

            {/* Solve Progress - Hidden on mobile, shown on desktop */}
            <div className="hidden lg:block">
              <div className="timer-card">
                <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">
                  Round Progress
                </h3>
                <SolveProgressIndicator
                  currentSolve={currentSolve}
                  totalSolves={5}
                  solves={solves}
                  size="md"
                  variant="status"
                />
              </div>
            </div>

            {/* Atmosphere Details - Hidden on mobile */}
            <div className="hidden lg:block">
              <SimulationAtmospherePanel
                atmosphere={atmosphere}
                soundEnabled={soundEnabled}
                onToggleSound={() => setSoundEnabled(!soundEnabled)}
              />
            </div>
          </div>

          {/* Right Column - Timer */}
          <div className="lg:col-span-7 space-y-6">
            {/* Solve Progress - Mobile only */}
            <div className="lg:hidden">
              <SolveProgressIndicator
                currentSolve={currentSolve}
                totalSolves={5}
                solves={solves}
                size="sm"
                variant="dots"
              />
            </div>

            {/* Timer - Render based on selected mode */}
            {timerMode === "normal" ? (
              <CompetitionTimer
                onSolveComplete={handleSolveComplete}
                inspectionEnabled={true}
                timerDelay={atmosphere.timerDelay}
                soundEnabled={soundEnabled}
                isDisabled={isLoadingScramble}
                onStateChange={(state) => {
                  setIsTimerRunning(state === "running");
                  // Play applause effect when solve completes
                  if (state === "stopped" && atmosphere.crowdNoise > 30) {
                    playEffect("applause");
                  }
                }}
              />
            ) : timerMode === "manual" ? (
              <CompetitionManualTimer
                onSolveComplete={handleSolveComplete}
                inspectionEnabled={true}
                isDisabled={isLoadingScramble}
                onStateChange={(state) => {
                  setIsTimerRunning(
                    state === "input" || state === "inspecting"
                  );
                  // Play applause effect when solve completes
                  if (
                    state === "idle" &&
                    solves.length > 0 &&
                    atmosphere.crowdNoise > 30
                  ) {
                    playEffect("applause");
                  }
                }}
              />
            ) : (
              <CompetitionStackmatTimer
                onSolveComplete={handleSolveComplete}
                inspectionEnabled={true}
                isDisabled={isLoadingScramble}
                onStateChange={(state) => {
                  setIsTimerRunning(
                    state === "running" || state === "inspecting"
                  );
                  // Play applause effect when solve completes
                  if (state === "stopped" && atmosphere.crowdNoise > 30) {
                    playEffect("applause");
                  }
                }}
              />
            )}

            {/* Completed Solves Summary */}
            {solves.length > 0 && (
              <div className="timer-card">
                <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">
                  Completed Solves
                </h3>
                <div className="grid grid-cols-5 gap-2">
                  {solves.map((solve, idx) => {
                    let displayTime = formatTime(solve.time);
                    let cardStyle =
                      "bg-[var(--surface-elevated)] text-[var(--text-primary)]";

                    if (solve.penalty === "DNF") {
                      displayTime = "DNF";
                      cardStyle = "bg-[var(--error)]/10 text-[var(--error)]";
                    } else if (
                      solve.penalty === "+2" ||
                      solve.inspectionViolation === "+2"
                    ) {
                      displayTime = formatTime(solve.time + 2000) + "+";
                      cardStyle =
                        "bg-[var(--warning)]/10 text-[var(--warning)]";
                    }

                    return (
                      <div
                        key={idx}
                        className={`text-center p-2 sm:p-3 rounded-lg ${cardStyle}`}
                      >
                        <div className="text-xs text-[var(--text-muted)] mb-0.5">
                          #{idx + 1}
                        </div>
                        <div className="font-mono font-medium text-sm">
                          {displayTime}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Current Average */}
                {solves.length >= 3 && (
                  <div className="mt-4 pt-4 border-t border-[var(--border)]">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[var(--text-muted)]">
                        Current Avg ({solves.length}/5)
                      </span>
                      <span className="font-mono font-medium text-[var(--text-primary)]">
                        {calculateCurrentAverage(solves)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to format time
function formatTime(ms: number): string {
  if (ms === Infinity) return "DNF";
  const seconds = Math.floor(ms / 1000);
  const centiseconds = Math.floor((ms % 1000) / 10);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
  }
  return `${remainingSeconds}.${centiseconds.toString().padStart(2, "0")}`;
}

// Helper function to calculate current average
function calculateCurrentAverage(solves: SolveResult[]): string {
  if (solves.length < 3) return "--";

  const times = solves.map((s) => {
    if (s.penalty === "DNF") return Infinity;
    let t = s.time;
    if (s.penalty === "+2" || s.inspectionViolation === "+2") {
      t += 2000;
    }
    return t;
  });

  // For partial averages, just calculate mean of available solves
  const validTimes = times.filter((t) => t !== Infinity);
  if (validTimes.length === 0) return "DNF";

  const avg = validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
  return formatTime(avg);
}
