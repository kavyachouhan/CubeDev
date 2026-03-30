"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  Volume2,
  VolumeX,
  Settings,
  Trophy,
  Clock,
  Target,
  Zap,
  ChevronDown,
  Check,
  X,
} from "lucide-react";
import Image from "next/image";
import { WCA_EVENTS, WCACompetition } from "./CompetitionSimulator";
import { formatTime } from "@/lib/stats-utils";

interface SimulationModeProps {
  competition: WCACompetition | null;
  eventId: string;
  onComplete: (results: number[]) => void;
  onSelectCompetition: () => void;
}

type SimulationState =
  | "idle"
  | "inspection"
  | "ready"
  | "running"
  | "stopped"
  | "completed";
type PressureLevel = "none" | "low" | "medium" | "high";

interface SolveResult {
  time: number;
  penalty: "none" | "+2" | "DNF";
  inspectionViolation: "+2" | "DNF" | null;
  judgeError: boolean;
}

// Pressure sounds and effects
const PRESSURE_CONFIGS = {
  none: { crowdVolume: 0, tickVolume: 0, label: "No Pressure" },
  low: { crowdVolume: 0.1, tickVolume: 0.2, label: "Light Pressure" },
  medium: { crowdVolume: 0.3, tickVolume: 0.4, label: "Moderate Pressure" },
  high: { crowdVolume: 0.5, tickVolume: 0.6, label: "High Pressure" },
};

export default function SimulationMode({
  competition,
  eventId,
  onComplete,
  onSelectCompetition,
}: SimulationModeProps) {
  // Simulation state
  const [state, setState] = useState<SimulationState>("idle");
  const [currentSolve, setCurrentSolve] = useState(0);
  const [results, setResults] = useState<SolveResult[]>([]);
  const [time, setTime] = useState(0);
  const [inspectionTime, setInspectionTime] = useState(15);

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [pressureLevel, setPressureLevel] = useState<PressureLevel>("low");
  const [judgeErrorsEnabled, setJudgeErrorsEnabled] = useState(true);
  const [inspectionViolationsEnabled, setInspectionViolationsEnabled] =
    useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [solvesPerRound, setSolvesPerRound] = useState(5);
  const [customInspectionTime, setCustomInspectionTime] = useState(15);

  // Refs
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const inspectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Key press state
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const spaceHeldTimeRef = useRef<number>(0);

  const event = WCA_EVENTS.find((e) => e.id === eventId);

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Play beep sound
  const playBeep = useCallback(
    (frequency: number, duration: number, volume: number = 0.3) => {
      if (!soundEnabled || !audioContextRef.current) return;

      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = "sine";
      gainNode.gain.value = volume;

      oscillator.start();
      oscillator.stop(ctx.currentTime + duration);
    },
    [soundEnabled]
  );

  // Simulate random judge error (rare)
  const checkForJudgeError = useCallback(() => {
    if (!judgeErrorsEnabled) return false;
    // 5% chance of judge error simulation
    return Math.random() < 0.05;
  }, [judgeErrorsEnabled]);

  // Simulate inspection violations
  const checkInspectionViolation = useCallback(
    (inspTime: number): "+2" | "DNF" | null => {
      if (!inspectionViolationsEnabled) return null;
      if (inspTime > 17) return "DNF";
      if (inspTime > 15) return "+2";
      return null;
    },
    [inspectionViolationsEnabled]
  );

  // Start inspection
  const startInspection = useCallback(() => {
    setState("inspection");
    setInspectionTime(customInspectionTime);
    playBeep(800, 0.15);

    inspectionIntervalRef.current = setInterval(() => {
      setInspectionTime((prev) => {
        const newTime = prev - 1;

        // Warning sounds
        if (newTime === 8) playBeep(600, 0.1);
        if (newTime === 3) playBeep(700, 0.15);
        if (newTime === 0) playBeep(400, 0.3);

        return newTime;
      });
    }, 1000);
  }, [customInspectionTime, playBeep]);

  // Stop inspection and prepare timer
  const stopInspection = useCallback(() => {
    if (inspectionIntervalRef.current) {
      clearInterval(inspectionIntervalRef.current);
      inspectionIntervalRef.current = null;
    }
    setState("ready");
  }, []);

  // Start timer
  const startTimer = useCallback(() => {
    setState("running");
    startTimeRef.current = Date.now();
    playBeep(1000, 0.1);

    intervalRef.current = setInterval(() => {
      setTime(Date.now() - startTimeRef.current);
    }, 10);
  }, [playBeep]);

  // Stop timer
  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const finalTime = Date.now() - startTimeRef.current;
    setTime(finalTime);
    setState("stopped");

    // Check for violations and errors
    const inspectionViolation = checkInspectionViolation(
      customInspectionTime - inspectionTime
    );
    const judgeError = checkForJudgeError();

    const result: SolveResult = {
      time: finalTime,
      penalty:
        inspectionViolation === "DNF"
          ? "DNF"
          : inspectionViolation === "+2"
            ? "+2"
            : "none",
      inspectionViolation,
      judgeError,
    };

    setResults((prev) => [...prev, result]);

    // Check if round complete
    if (currentSolve + 1 >= solvesPerRound) {
      setState("completed");
      onComplete([...results.map((r) => r.time), finalTime]);
    }
  }, [
    currentSolve,
    solvesPerRound,
    inspectionTime,
    customInspectionTime,
    checkInspectionViolation,
    checkForJudgeError,
    results,
    onComplete,
  ]);

  // Handle space key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();

        if (state === "idle") {
          startInspection();
        } else if (state === "inspection") {
          setIsSpacePressed(true);
          spaceHeldTimeRef.current = Date.now();
          stopInspection();
        } else if (state === "running") {
          stopTimer();
        } else if (state === "stopped") {
          // Next solve
          setCurrentSolve((prev) => prev + 1);
          setTime(0);
          setInspectionTime(customInspectionTime);
          startInspection();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();

        if (state === "ready" && isSpacePressed) {
          const heldTime = Date.now() - spaceHeldTimeRef.current;
          if (heldTime >= 300) {
            startTimer();
          } else {
            // Need to hold longer
            playBeep(300, 0.1);
          }
        }
        setIsSpacePressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    state,
    isSpacePressed,
    startInspection,
    stopInspection,
    startTimer,
    stopTimer,
    customInspectionTime,
    playBeep,
  ]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (inspectionIntervalRef.current)
        clearInterval(inspectionIntervalRef.current);
    };
  }, []);

  // Reset simulation
  const resetSimulation = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (inspectionIntervalRef.current)
      clearInterval(inspectionIntervalRef.current);
    setState("idle");
    setCurrentSolve(0);
    setResults([]);
    setTime(0);
    setInspectionTime(customInspectionTime);
  };

  // Apply penalty to last solve
  const applyPenalty = (penalty: "+2" | "DNF") => {
    if (results.length === 0) return;
    setResults((prev) => {
      const newResults = [...prev];
      const lastIdx = newResults.length - 1;
      newResults[lastIdx] = { ...newResults[lastIdx], penalty };
      return newResults;
    });
  };

  // Calculate statistics
  const calculateStats = () => {
    const validTimes = results
      .filter((r) => r.penalty !== "DNF")
      .map((r) => r.time + (r.penalty === "+2" ? 2000 : 0));

    if (validTimes.length === 0) return null;

    const dnfCount = results.filter((r) => r.penalty === "DNF").length;

    // Calculate average (excluding best and worst if 5 solves)
    let average = 0;
    if (validTimes.length >= 3 && dnfCount <= 1) {
      const sorted = [...validTimes].sort((a, b) => a - b);
      const trimmed = sorted.slice(1, -1);
      average = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
    }

    return {
      best: Math.min(...validTimes),
      worst: Math.max(...validTimes),
      average,
      dnfCount,
    };
  };

  const stats = calculateStats();

  // Get display time
  const getDisplayTime = () => {
    if (state === "inspection") {
      return inspectionTime.toString();
    }
    return formatTime(time);
  };

  // Get timer color
  const getTimerColor = () => {
    if (state === "inspection") {
      if (inspectionTime <= 3) return "text-(--error)";
      if (inspectionTime <= 8) return "text-(--warning)";
      return "text-(--timer-inspection)";
    }
    if (state === "ready") return "text-(--timer-ready)";
    if (state === "running") return "text-(--timer-running)";
    return "text-(--text-primary)";
  };

  if (!competition) {
    return (
      <div className="timer-card text-center py-12">
        <Trophy className="w-16 h-16 text-(--text-muted) mx-auto mb-4" />
        <h3 className="text-xl font-bold text-(--text-primary) mb-2">
          No Competition Selected
        </h3>
        <p className="text-(--text-muted) mb-6">
          Select a competition to start your simulation practice.
        </p>
        <button
          onClick={onSelectCompetition}
          className="px-6 py-3 bg-(--primary) text-white font-medium rounded-lg hover:bg-(--primary-hover) transition-colors"
        >
          Browse Competitions
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Competition Info */}
      <div className="timer-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {event && (
              <div className="p-3 bg-(--surface-elevated) rounded-lg">
                <Image
                  src={event.icon}
                  alt={event.name}
                  width={32}
                  height={32}
                />
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-(--text-primary)">
                {competition.name}
              </h2>
              <p className="text-sm text-(--text-muted)">
                {event?.name} • {competition.city}, {competition.country_iso2}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-lg border border-(--border) text-(--text-secondary) hover:bg-(--surface-elevated) transition-colors"
              title={soundEnabled ? "Mute sounds" : "Enable sounds"}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg border border-(--border) text-(--text-secondary) hover:bg-(--surface-elevated) transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={resetSimulation}
              className="p-2 rounded-lg border border-(--border) text-(--text-secondary) hover:bg-(--surface-elevated) transition-colors"
              title="Reset simulation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="timer-card">
          <h3 className="font-bold text-(--text-primary) mb-4">
            Simulation Settings
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pressure Level */}
            <div>
              <label className="text-sm text-(--text-secondary) block mb-2">
                Pressure Level
              </label>
              <select
                value={pressureLevel}
                onChange={(e) =>
                  setPressureLevel(e.target.value as PressureLevel)
                }
                className="w-full px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--primary)"
              >
                {Object.entries(PRESSURE_CONFIGS).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Solves per round */}
            <div>
              <label className="text-sm text-(--text-secondary) block mb-2">
                Solves per Round
              </label>
              <select
                value={solvesPerRound}
                onChange={(e) => setSolvesPerRound(Number(e.target.value))}
                className="w-full px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--primary)"
              >
                <option value={3}>3 solves (Mean of 3)</option>
                <option value={5}>5 solves (Average of 5)</option>
              </select>
            </div>

            {/* Inspection Time */}
            <div>
              <label className="text-sm text-(--text-secondary) block mb-2">
                Inspection Time (seconds)
              </label>
              <input
                type="number"
                min={10}
                max={20}
                value={customInspectionTime}
                onChange={(e) =>
                  setCustomInspectionTime(Number(e.target.value))
                }
                className="w-full px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--primary)"
              />
            </div>

            {/* Toggle Options */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={judgeErrorsEnabled}
                  onChange={(e) => setJudgeErrorsEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-(--border) text-(--primary) focus:ring-(--primary)"
                />
                <span className="text-sm text-(--text-secondary)">
                  Simulate judge errors (random +2s)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inspectionViolationsEnabled}
                  onChange={(e) =>
                    setInspectionViolationsEnabled(e.target.checked)
                  }
                  className="w-4 h-4 rounded border-(--border) text-(--primary) focus:ring-(--primary)"
                />
                <span className="text-sm text-(--text-secondary)">
                  Enforce inspection violations
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Main Timer Area */}
      <div className="timer-card">
        {/* Round Progress */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-(--text-muted)">
            Solve {Math.min(currentSolve + 1, solvesPerRound)} of{" "}
            {solvesPerRound}
          </div>
          <div className="flex gap-1">
            {Array.from({ length: solvesPerRound }, (_, i) => (
              <div
                key={i}
                className={`w-8 h-2 rounded-full ${
                  i < results.length
                    ? results[i].penalty === "DNF"
                      ? "bg-(--error)"
                      : results[i].penalty === "+2"
                        ? "bg-(--warning)"
                        : "bg-(--success)"
                    : i === currentSolve && state !== "idle"
                      ? "bg-(--primary)"
                      : "bg-(--border)"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Timer Display */}
        <div className="text-center py-8">
          {state === "completed" ? (
            <div>
              <div className="text-6xl sm:text-8xl font-bold font-mono text-(--success) mb-4">
                Done!
              </div>
              <p className="text-(--text-muted)">Round completed</p>
            </div>
          ) : (
            <>
              <div
                className={`text-6xl sm:text-8xl font-bold font-mono ${getTimerColor()} transition-colors`}
              >
                {getDisplayTime()}
              </div>
              {state === "inspection" && (
                <p className="text-(--text-muted) mt-2">Inspection</p>
              )}
              {state === "ready" && isSpacePressed && (
                <p className="text-(--timer-ready) mt-2">
                  Hold to start...
                </p>
              )}
              {state === "idle" && (
                <p className="text-(--text-muted) mt-2">
                  Press Space to start inspection
                </p>
              )}
              {state === "running" && (
                <p className="text-(--text-muted) mt-2">
                  Press Space to stop
                </p>
              )}
              {state === "stopped" && (
                <p className="text-(--text-muted) mt-2">
                  Press Space for next solve
                </p>
              )}
            </>
          )}
        </div>

        {/* Penalty Buttons (when stopped) */}
        {state === "stopped" && (
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={() => applyPenalty("+2")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                results[results.length - 1]?.penalty === "+2"
                  ? "bg-(--warning) text-white"
                  : "border border-(--warning) text-(--warning) hover:bg-(--warning)/10"
              }`}
            >
              +2
            </button>
            <button
              onClick={() => applyPenalty("DNF")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                results[results.length - 1]?.penalty === "DNF"
                  ? "bg-(--error) text-white"
                  : "border border-(--error) text-(--error) hover:bg-(--error)/10"
              }`}
            >
              DNF
            </button>
          </div>
        )}

        {/* Inspection Violation Warning */}
        {results.length > 0 &&
          results[results.length - 1]?.inspectionViolation && (
            <div className="flex items-center justify-center gap-2 text-(--warning) mb-4">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">
                Inspection violation:{" "}
                {results[results.length - 1].inspectionViolation}
              </span>
            </div>
          )}

        {/* Judge Error Notification */}
        {results.length > 0 && results[results.length - 1]?.judgeError && (
          <div className="flex items-center justify-center gap-2 text-(--warning) mb-4">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">
              Simulated judge error - practice handling penalties!
            </span>
          </div>
        )}
      </div>

      {/* Results Table */}
      {results.length > 0 && (
        <div className="timer-card">
          <h3 className="font-bold text-(--text-primary) mb-4">Results</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-(--text-muted) border-b border-(--border)">
                  <th className="pb-2 pr-4">#</th>
                  <th className="pb-2 pr-4">Time</th>
                  <th className="pb-2 pr-4">Penalty</th>
                  <th className="pb-2">Final</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-(--border) last:border-0"
                  >
                    <td className="py-2 pr-4 text-(--text-secondary)">
                      {idx + 1}
                    </td>
                    <td className="py-2 pr-4 font-mono text-(--text-primary)">
                      {formatTime(result.time)}
                    </td>
                    <td className="py-2 pr-4">
                      {result.penalty === "+2" && (
                        <span className="text-(--warning)">+2</span>
                      )}
                      {result.penalty === "DNF" && (
                        <span className="text-(--error)">DNF</span>
                      )}
                      {result.penalty === "none" && (
                        <span className="text-(--text-muted)">-</span>
                      )}
                    </td>
                    <td className="py-2 font-mono font-medium text-(--text-primary)">
                      {result.penalty === "DNF"
                        ? "DNF"
                        : formatTime(
                            result.time + (result.penalty === "+2" ? 2000 : 0)
                          )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-(--border)">
              <div>
                <div className="text-xs text-(--text-muted) mb-1">
                  Best
                </div>
                <div className="font-mono font-bold text-(--success)">
                  {formatTime(stats.best)}
                </div>
              </div>
              <div>
                <div className="text-xs text-(--text-muted) mb-1">
                  Worst
                </div>
                <div className="font-mono font-bold text-(--error)">
                  {formatTime(stats.worst)}
                </div>
              </div>
              <div>
                <div className="text-xs text-(--text-muted) mb-1">
                  Average
                </div>
                <div className="font-mono font-bold text-(--primary)">
                  {stats.average > 0 ? formatTime(stats.average) : "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-(--text-muted) mb-1">
                  DNFs
                </div>
                <div className="font-mono font-bold text-(--text-primary)">
                  {stats.dnfCount}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Completed Actions */}
      {state === "completed" && (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={resetSimulation}
            className="px-6 py-3 bg-(--primary) text-white font-medium rounded-lg hover:bg-(--primary-hover) transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Start New Round
          </button>
          <button
            onClick={onSelectCompetition}
            className="px-6 py-3 border border-(--border) text-(--text-primary) font-medium rounded-lg hover:bg-(--surface-elevated) transition-colors"
          >
            Choose Different Competition
          </button>
        </div>
      )}
    </div>
  );
}
