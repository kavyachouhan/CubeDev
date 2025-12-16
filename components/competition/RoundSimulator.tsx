"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Volume2,
  VolumeX,
  ChevronRight,
  Hand,
} from "lucide-react";
import { WCACompetition } from "./CompetitionBrowser";
import {
  AtmosphereSettings,
  RoundResult,
  SolveResult,
} from "./CompetitionDetail";
import { scrambleGenerator } from "@/components/timer/ScrambleGenerator";
import ScramblePreview from "@/components/timer/ScramblePreview";

interface WCAEvent {
  id: string;
  name: string;
  icon: string;
}

interface RoundSimulatorProps {
  competition: WCACompetition;
  event: WCAEvent;
  roundNumber: number;
  maxRounds: number;
  atmosphere: AtmosphereSettings;
  onComplete: (result: RoundResult) => void;
  onBack: () => void;
}

type TimerState = "idle" | "inspection" | "ready" | "running" | "stopped";

export default function RoundSimulator({
  competition,
  event,
  roundNumber,
  maxRounds,
  atmosphere,
  onComplete,
  onBack,
}: RoundSimulatorProps) {
  const [currentSolve, setCurrentSolve] = useState(0);
  const [solves, setSolves] = useState<SolveResult[]>([]);
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [time, setTime] = useState(0);
  const [inspectionTime, setInspectionTime] = useState(15);
  const [scramble, setScramble] = useState<string>("");
  const [isLoadingScramble, setIsLoadingScramble] = useState(true);
  const [penalty, setPenalty] = useState<"none" | "+2" | "DNF">("none");
  const [inspectionPenalty, setInspectionPenalty] = useState<
    "+2" | "DNF" | null
  >(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showJudgePrompt, setShowJudgePrompt] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inspectionRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const holdStartRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const crowdAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // Crowd noise based on atmosphere
  useEffect(() => {
    if (atmosphere.crowdNoise > 0 && soundEnabled) {
      // In a real implementation, would play actual crowd sounds
      // For now, we simulate with occasional beeps/tones
    }
  }, [atmosphere.crowdNoise, soundEnabled]);

  // Play beep sound
  const playBeep = useCallback(
    (frequency: number, duration: number) => {
      if (!soundEnabled || !audioContextRef.current) return;

      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContextRef.current.currentTime + duration / 1000
      );

      oscillator.start();
      oscillator.stop(audioContextRef.current.currentTime + duration / 1000);
    },
    [soundEnabled]
  );

  // Generate new scramble using proper scramble generator
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

  // Start inspection
  const startInspection = useCallback(() => {
    setTimerState("inspection");
    setInspectionTime(15);
    setInspectionPenalty(null);
    playBeep(800, 100);

    inspectionRef.current = setInterval(() => {
      setInspectionTime((prev) => {
        const newTime = prev - 1;

        if (newTime === 8) {
          playBeep(600, 100);
        }
        if (newTime === 3) {
          playBeep(400, 100);
        }
        if (newTime === 0) {
          setInspectionPenalty("+2");
          playBeep(300, 200);
        }
        if (newTime === -2) {
          setInspectionPenalty("DNF");
          playBeep(200, 500);
          if (inspectionRef.current) {
            clearInterval(inspectionRef.current);
          }
          // Auto-stop if DNF from inspection
          handleInspectionDNF();
        }

        return newTime;
      });
    }, 1000);
  }, [playBeep]);

  const handleInspectionDNF = () => {
    if (inspectionRef.current) {
      clearInterval(inspectionRef.current);
    }
    // Record DNF solve
    const solve: SolveResult = {
      time: 0,
      scramble,
      penalty: "DNF",
      inspectionViolation: "DNF",
    };
    completeSolve(solve);
  };

  // Handle holding to start
  const handleHoldStart = useCallback(() => {
    if (timerState === "inspection") {
      setIsHolding(true);
      holdStartRef.current = Date.now();

      const checkHold = () => {
        const holdTime = Date.now() - holdStartRef.current;
        const progress = Math.min(holdTime / 550, 1); // 550ms hold
        setHoldProgress(progress);

        if (progress >= 1) {
          setTimerState("ready");
          playBeep(1000, 50);
        } else if (isHolding) {
          requestAnimationFrame(checkHold);
        }
      };
      requestAnimationFrame(checkHold);
    }
  }, [timerState, isHolding, playBeep]);

  const handleHoldEnd = useCallback(() => {
    setIsHolding(false);
    setHoldProgress(0);

    if (timerState === "ready") {
      // Start the timer
      if (inspectionRef.current) {
        clearInterval(inspectionRef.current);
      }

      setTimerState("running");
      startTimeRef.current = Date.now();

      // Add random delay if atmosphere setting enabled
      const delay = atmosphere.timerDelay ? Math.random() * 50 : 0;

      setTimeout(() => {
        timerRef.current = setInterval(() => {
          setTime(Date.now() - startTimeRef.current);
        }, 10);
      }, delay);
    }
  }, [timerState, atmosphere.timerDelay]);

  // Stop timer
  const stopTimer = useCallback(() => {
    if (timerState !== "running") return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const finalTime = Date.now() - startTimeRef.current;
    setTime(finalTime);
    setTimerState("stopped");
    playBeep(1200, 100);

    // Show judge prompt if enabled
    if (atmosphere.judgeInteractions) {
      setShowJudgePrompt(true);
    }
  }, [timerState, atmosphere.judgeInteractions, playBeep]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();

        if (timerState === "idle") {
          startInspection();
        } else if (timerState === "inspection") {
          handleHoldStart();
        } else if (timerState === "running") {
          stopTimer();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && isHolding) {
        handleHoldEnd();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    timerState,
    isHolding,
    startInspection,
    handleHoldStart,
    handleHoldEnd,
    stopTimer,
  ]);

  // Complete a solve
  const completeSolve = (solve: SolveResult) => {
    const newSolves = [...solves, solve];
    setSolves(newSolves);

    if (newSolves.length >= 5) {
      // Round complete
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
      resetForNextSolve();
    }
  };

  const confirmSolve = (applyPenalty: "none" | "+2" | "DNF") => {
    const solve: SolveResult = {
      time,
      scramble,
      penalty: applyPenalty,
      inspectionViolation: inspectionPenalty,
    };
    setShowJudgePrompt(false);
    completeSolve(solve);
  };

  const resetForNextSolve = () => {
    setTimerState("idle");
    setTime(0);
    setInspectionTime(15);
    setPenalty("none");
    setInspectionPenalty(null);
    setShowJudgePrompt(false);
    generateScramble();
  };

  // Format time display
  const formatTime = (ms: number): string => {
    if (ms === Infinity) return "DNF";
    const seconds = Math.floor(ms / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
    }
    return `${remainingSeconds}.${centiseconds.toString().padStart(2, "0")}`;
  };

  const getDisplayTime = () => {
    if (timerState === "inspection") {
      return inspectionTime > 0
        ? inspectionTime.toString()
        : inspectionTime === 0
          ? "+2"
          : "DNF";
    }
    return formatTime(time);
  };

  const getTimeColor = () => {
    if (timerState === "inspection") {
      if (inspectionTime <= 3) return "text-[var(--error)]";
      if (inspectionTime <= 8) return "text-[var(--warning)]";
      return "text-[var(--success)]";
    }
    if (timerState === "ready") return "text-[var(--success)]";
    return "text-[var(--text-primary)]";
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--primary)]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--primary)]"
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Competition/Event Info */}
        <div className="timer-card">
          <div className="flex items-center gap-4">
            <Image
              src={event.icon}
              alt={event.name}
              width={32}
              height={32}
              className="invert opacity-80"
            />
            <div>
              <h2 className="font-bold text-[var(--text-primary)]">
                {event.name}
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                Round {roundNumber} of {maxRounds} • {competition.name}
              </p>
            </div>
          </div>
        </div>

        {/* Solve Progress */}
        <div className="flex justify-center gap-2">
          {[0, 1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className={`w-3 h-3 rounded-full ${
                idx < solves.length
                  ? solves[idx].penalty === "DNF"
                    ? "bg-[var(--error)]"
                    : "bg-[var(--success)]"
                  : idx === currentSolve
                    ? "bg-[var(--primary)]"
                    : "bg-[var(--surface-elevated)]"
              }`}
            />
          ))}
        </div>

        {/* Scramble */}
        <div className="timer-card">
          <div className="text-center">
            <div className="text-xs text-[var(--text-muted)] mb-2">
              Scramble {currentSolve + 1}/5
            </div>
            {isLoadingScramble ? (
              <div className="py-4 text-[var(--text-muted)]">
                Generating scramble...
              </div>
            ) : (
              <div className="font-mono text-lg sm:text-xl text-[var(--text-primary)] break-words">
                {scramble}
              </div>
            )}
          </div>
        </div>

        {/* Cube Visualizer */}
        {scramble && !isLoadingScramble && (
          <ScramblePreview scramble={scramble} event={event.id} />
        )}

        {/* Timer Display */}
        <div
          className="timer-card cursor-pointer select-none"
          onMouseDown={() => {
            if (timerState === "idle") startInspection();
            else if (timerState === "inspection") handleHoldStart();
            else if (timerState === "running") stopTimer();
          }}
          onMouseUp={() => {
            if (isHolding) handleHoldEnd();
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            if (timerState === "idle") startInspection();
            else if (timerState === "inspection") handleHoldStart();
            else if (timerState === "running") stopTimer();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            if (isHolding) handleHoldEnd();
          }}
        >
          {/* Hold Progress Indicator */}
          {isHolding && (
            <div
              className="absolute top-0 left-0 h-1 bg-[var(--success)] transition-all"
              style={{ width: `${holdProgress * 100}%` }}
            />
          )}

          <div className="py-8 sm:py-12 text-center">
            <div
              className={`font-mono text-5xl sm:text-7xl lg:text-8xl font-bold tabular-nums ${getTimeColor()}`}
            >
              {getDisplayTime()}
            </div>

            <div className="mt-4 text-sm text-[var(--text-muted)]">
              {timerState === "idle" &&
                "Press SPACE or tap to start inspection"}
              {timerState === "inspection" &&
                "Hold SPACE or hold touch to ready timer"}
              {timerState === "ready" && "Release to start!"}
              {timerState === "running" && "Press SPACE or tap to stop"}
              {timerState === "stopped" && "Solve complete"}
            </div>

            {/* Inspection Penalty Warning */}
            {inspectionPenalty && timerState === "inspection" && (
              <div className="mt-2 flex items-center justify-center gap-2 text-[var(--error)]">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {inspectionPenalty} Penalty
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Judge Prompt */}
        {showJudgePrompt && (
          <div className="timer-card">
            <h3 className="font-bold text-[var(--text-primary)] mb-4 text-center">
              Judge Check - Confirm Result
            </h3>
            <div className="text-center mb-4">
              <span className="text-3xl font-mono font-bold text-[var(--text-primary)]">
                {formatTime(time)}
              </span>
              {inspectionPenalty && (
                <span className="ml-2 text-[var(--warning)]">
                  + {inspectionPenalty} inspection
                </span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => confirmSolve("none")}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--success)] text-white font-medium rounded-lg"
              >
                <CheckCircle className="w-5 h-5" />
                OK
              </button>
              <button
                onClick={() => confirmSolve("+2")}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--warning)] text-white font-medium rounded-lg"
              >
                +2 Penalty
              </button>
              <button
                onClick={() => confirmSolve("DNF")}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--error)] text-white font-medium rounded-lg"
              >
                DNF
              </button>
            </div>
          </div>
        )}

        {/* Completed Solves */}
        {solves.length > 0 && (
          <div className="timer-card">
            <h3 className="font-bold text-[var(--text-primary)] mb-3">
              Completed Solves
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {solves.map((solve, idx) => {
                let displayTime = formatTime(solve.time);
                if (solve.penalty === "DNF") displayTime = "DNF";
                else if (
                  solve.penalty === "+2" ||
                  solve.inspectionViolation === "+2"
                ) {
                  displayTime = formatTime(solve.time + 2000);
                  if (
                    solve.penalty === "+2" ||
                    solve.inspectionViolation === "+2"
                  ) {
                    displayTime += "+";
                  }
                }

                return (
                  <div
                    key={idx}
                    className={`text-center p-2 rounded-lg ${
                      solve.penalty === "DNF"
                        ? "bg-[var(--error)]/20 text-[var(--error)]"
                        : solve.penalty === "+2" ||
                            solve.inspectionViolation === "+2"
                          ? "bg-[var(--warning)]/20 text-[var(--warning)]"
                          : "bg-[var(--surface-elevated)] text-[var(--text-primary)]"
                    }`}
                  >
                    <div className="text-xs text-[var(--text-muted)]">
                      #{idx + 1}
                    </div>
                    <div className="font-mono font-medium text-sm">
                      {displayTime}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pressure Indicator */}
        {atmosphere.pressure > 50 && (
          <div className="timer-card border-[var(--warning)] bg-[var(--warning)]/5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-[var(--warning)]" />
              <div>
                <div className="font-medium text-[var(--text-primary)]">
                  High Pressure Mode
                </div>
                <div className="text-sm text-[var(--text-muted)]">
                  Simulating competition stress at {atmosphere.pressure}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
