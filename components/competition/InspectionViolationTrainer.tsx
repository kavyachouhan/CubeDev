"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Clock,
  AlertTriangle,
  Check,
  RotateCcw,
  Settings,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Eye,
  Timer,
  Volume2,
  Flame,
} from "lucide-react";

interface InspectionStats {
  totalAttempts: number;
  perfectStops: number; // Stopped between 12-15 seconds
  earlyStops: number; // Stopped before 12 seconds
  plus2s: number; // Stopped 15-17 seconds
  dnfs: number; // Stopped after 17 seconds
  averageTime: number;
}

interface InspectionViolationTrainerProps {
  onComplete?: (stats: InspectionStats) => void;
}

const STORAGE_KEY = "cubedev_inspection_stats";

// Simple toggle switch component
function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`w-11 h-6 rounded-full transition-colors flex items-center flex-shrink-0 ${
        enabled
          ? "bg-[var(--primary)] justify-end"
          : "bg-[var(--border)] justify-start"
      }`}
    >
      <div className="w-4 h-4 bg-white rounded-full mx-1 transition-all" />
    </button>
  );
}

export default function InspectionViolationTrainer({
  onComplete,
}: InspectionViolationTrainerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<{
    time: number;
    status: "perfect" | "early" | "+2" | "DNF";
  } | null>(null);
  const [stats, setStats] = useState<InspectionStats>({
    totalAttempts: 0,
    perfectStops: 0,
    earlyStops: 0,
    plus2s: 0,
    dnfs: 0,
    averageTime: 0,
  });

  // Settings
  const [hideTimer, setHideTimer] = useState(false);
  const [randomStart, setRandomStart] = useState(false);
  const [showWarnings, setShowWarnings] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastWarningRef = useRef<number | null>(null);

  // Initialize audio context
  const initializeAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      } catch (error) {
        console.log("Audio context not available:", error);
      }
    }
  }, []);

  // Play alert sound
  const playAlert = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        initializeAudioContext();
      }

      if (!audioContextRef.current) return;

      // Resume context if suspended
      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume();
      }

      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      oscillator.frequency.value = 1200;
      oscillator.type = "sine";
      gainNode.gain.setValueAtTime(0.4, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContextRef.current.currentTime + 0.2
      );

      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + 0.2);
    } catch (error) {
      console.log("Audio not available:", error);
    }
  }, [initializeAudioContext]);

  // Load stats from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setStats(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse inspection stats:", e);
      }
    }
  }, []);

  // Save stats
  useEffect(() => {
    if (stats.totalAttempts > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    }
  }, [stats]);

  // Timer warnings at 8 and 12 seconds (like WCA)
  useEffect(() => {
    if (isRunning && showWarnings) {
      const currentSecond = Math.floor(elapsedTime);

      // Play alert at 8 seconds (only once)
      if (currentSecond === 8 && lastWarningRef.current !== 8) {
        playAlert();
        lastWarningRef.current = 8;
      }
      // Play alert at 12 seconds (only once)
      if (currentSecond === 12 && lastWarningRef.current !== 12) {
        playAlert();
        lastWarningRef.current = 12;
      }
    }
  }, [elapsedTime, isRunning, showWarnings, playAlert]);

  const startInspection = useCallback(() => {
    // Reset
    setShowResult(false);
    setLastResult(null);
    lastWarningRef.current = null;
    initializeAudioContext(); // Initialize audio on user interaction

    // Start after random delay if enabled
    const delay = randomStart ? Math.random() * 2000 + 500 : 0;

    setTimeout(() => {
      setIsRunning(true);
      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setElapsedTime((Date.now() - startTimeRef.current) / 1000);
        }
      }, 10);
    }, delay);
  }, [randomStart]);

  const stopInspection = useCallback(() => {
    if (!isRunning) return;

    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const finalTime = elapsedTime;
    let status: "perfect" | "early" | "+2" | "DNF";

    if (finalTime < 12) {
      status = "early";
    } else if (finalTime >= 12 && finalTime <= 15) {
      status = "perfect";
    } else if (finalTime > 15 && finalTime <= 17) {
      status = "+2";
    } else {
      status = "DNF";
    }

    setLastResult({ time: finalTime, status });
    setShowResult(true);

    // Update stats
    setStats((prev) => {
      const newTotal = prev.totalAttempts + 1;
      const newAvg =
        (prev.averageTime * prev.totalAttempts + finalTime) / newTotal;
      return {
        totalAttempts: newTotal,
        perfectStops: prev.perfectStops + (status === "perfect" ? 1 : 0),
        earlyStops: prev.earlyStops + (status === "early" ? 1 : 0),
        plus2s: prev.plus2s + (status === "+2" ? 1 : 0),
        dnfs: prev.dnfs + (status === "DNF" ? 1 : 0),
        averageTime: newAvg,
      };
    });

    onComplete?.(stats);
  }, [isRunning, elapsedTime, stats, onComplete]);

  const resetStats = () => {
    setStats({
      totalAttempts: 0,
      perfectStops: 0,
      earlyStops: 0,
      plus2s: 0,
      dnfs: 0,
      averageTime: 0,
    });
    localStorage.removeItem(STORAGE_KEY);
  };

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && isExpanded) {
        e.preventDefault();
        if (isRunning) {
          stopInspection();
        } else if (!showResult) {
          startInspection();
        } else {
          setShowResult(false);
          setElapsedTime(0);
          startInspection();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRunning, showResult, isExpanded, startInspection, stopInspection]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "perfect":
        return "text-[var(--success)]";
      case "early":
        return "text-[var(--info)]";
      case "+2":
        return "text-[var(--warning)]";
      case "DNF":
        return "text-[var(--error)]";
      default:
        return "text-[var(--text-primary)]";
    }
  };

  // Get dynamic timer color based on elapsed time
  const getTimerColor = () => {
    if (elapsedTime >= 17) return "text-[var(--error)]";
    if (elapsedTime >= 15) return "text-[var(--warning)]";
    if (elapsedTime >= 12) return "text-[var(--success)]";
    if (elapsedTime >= 8) return "text-[var(--warning)]";
    return "text-[var(--text-primary)]";
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "perfect":
        return "Perfect!";
      case "early":
        return "Too Early";
      case "+2":
        return "+2 Penalty";
      case "DNF":
        return "DNF";
      default:
        return "";
    }
  };

  const perfectRate =
    stats.totalAttempts > 0
      ? Math.round((stats.perfectStops / stats.totalAttempts) * 100)
      : 0;

  return (
    <div className="timer-card">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[var(--warning)]/20 text-[var(--warning)] rounded-lg flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="text-left min-w-0">
            <h3 className="font-bold text-[var(--text-primary)] text-sm sm:text-base">
              Inspection Trainer
            </h3>
            <p className="text-xs text-[var(--text-muted)] truncate">
              Practice your 15-second inspection timing
            </p>
          </div>
        </div>
        <div className="flex-shrink-0 ml-2">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-[var(--text-muted)]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Stats Overview */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
            <div className="p-2 sm:p-3 bg-[var(--surface-elevated)] rounded-lg text-center">
              <div className="text-base sm:text-xl font-bold text-[var(--success)]">
                {stats.perfectStops}
              </div>
              <div className="text-[10px] sm:text-xs text-[var(--text-muted)]">
                Perfect
              </div>
            </div>
            <div className="p-2 sm:p-3 bg-[var(--surface-elevated)] rounded-lg text-center">
              <div className="text-base sm:text-xl font-bold text-[var(--info)]">
                {stats.earlyStops}
              </div>
              <div className="text-[10px] sm:text-xs text-[var(--text-muted)]">
                Early
              </div>
            </div>
            <div className="p-2 sm:p-3 bg-[var(--surface-elevated)] rounded-lg text-center">
              <div className="text-base sm:text-xl font-bold text-[var(--warning)]">
                {stats.plus2s}
              </div>
              <div className="text-[10px] sm:text-xs text-[var(--text-muted)]">
                +2
              </div>
            </div>
            <div className="p-2 sm:p-3 bg-[var(--surface-elevated)] rounded-lg text-center">
              <div className="text-base sm:text-xl font-bold text-[var(--error)]">
                {stats.dnfs}
              </div>
              <div className="text-[10px] sm:text-xs text-[var(--text-muted)]">
                DNF
              </div>
            </div>
          </div>

          {/* Main Timer Area */}
          <div
            className={`rounded-xl border-2 transition-all cursor-pointer select-none ${
              isRunning
                ? "border-[var(--warning)] bg-[var(--warning)]/5"
                : showResult
                  ? lastResult?.status === "perfect"
                    ? "border-[var(--success)] bg-[var(--success)]/5"
                    : lastResult?.status === "+2" ||
                        lastResult?.status === "DNF"
                      ? "border-[var(--error)] bg-[var(--error)]/5"
                      : "border-[var(--border)] bg-[var(--surface)]"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]"
            }`}
            onClick={() => {
              if (isRunning) {
                stopInspection();
              } else if (!showResult) {
                startInspection();
              } else {
                setShowResult(false);
                setElapsedTime(0);
              }
            }}
          >
            {/* Timer Display */}
            <div className="text-center py-6 sm:py-8 px-4">
              {isRunning ? (
                <>
                  {hideTimer ? (
                    <div
                      className={`text-3xl sm:text-5xl font-mono font-bold ${getTimerColor()}`}
                    >
                      Inspecting...
                    </div>
                  ) : (
                    <div
                      className={`text-3xl sm:text-5xl font-mono font-bold ${getTimerColor()}`}
                    >
                      {elapsedTime.toFixed(2)}s
                    </div>
                  )}
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-2">
                    Tap or press Space to stop
                  </p>
                  {showWarnings && (
                    <div className="flex justify-center gap-2 sm:gap-4 mt-3">
                      <span
                        className={`text-[10px] sm:text-xs px-2 py-1 rounded-full border ${
                          elapsedTime >= 8
                            ? "bg-[var(--warning)]/10 border-[var(--warning)]/30 text-[var(--warning)]"
                            : "bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--text-muted)]"
                        }`}
                      >
                        8s
                      </span>
                      <span
                        className={`text-[10px] sm:text-xs px-2 py-1 rounded-full border ${
                          elapsedTime >= 12
                            ? "bg-[var(--error)]/10 border-[var(--error)]/30 text-[var(--error)]"
                            : "bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--text-muted)]"
                        }`}
                      >
                        12s
                      </span>
                    </div>
                  )}
                </>
              ) : showResult && lastResult ? (
                <>
                  <div
                    className={`text-3xl sm:text-5xl font-mono font-bold ${getStatusColor(lastResult.status)}`}
                  >
                    {lastResult.time.toFixed(2)}s
                  </div>
                  <div
                    className={`flex items-center justify-center gap-2 mt-2 ${getStatusColor(lastResult.status)}`}
                  >
                    {lastResult.status === "perfect" ? (
                      <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                    <span className="font-medium text-sm sm:text-base">
                      {getStatusLabel(lastResult.status)}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-3">
                    Tap or press Space to try again
                  </p>
                </>
              ) : (
                <>
                  <div className="text-3xl sm:text-5xl font-mono font-bold text-[var(--text-muted)]">
                    0.00s
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-2">
                    Tap or press Space to start
                  </p>
                </>
              )}
            </div>

            {/* Progress Bar */}
            <div className="px-3 sm:px-4 pb-3 sm:pb-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs text-[var(--text-muted)] w-5 sm:w-6 text-center flex-shrink-0">
                  0s
                </span>
                <div className="flex-1 h-2.5 sm:h-3 bg-[var(--surface-elevated)] rounded-full overflow-hidden relative">
                  {/* Early zone: 0-12s = 70.6% of 17s */}
                  <div
                    className="absolute h-full bg-[var(--info)]/40"
                    style={{ left: "0%", width: "70.6%" }}
                  />
                  {/* Perfect zone: 12-15s = 17.6% of 17s */}
                  <div
                    className="absolute h-full bg-[var(--success)]/50"
                    style={{ left: "70.6%", width: "17.6%" }}
                  />
                  {/* +2 zone: 15-17s = 11.8% of 17s */}
                  <div
                    className="absolute h-full bg-[var(--warning)]/50"
                    style={{ left: "88.2%", width: "11.8%" }}
                  />
                  {/* 8s marker line */}
                  <div
                    className="absolute top-0 w-px h-full bg-[var(--text-muted)]/40"
                    style={{ left: "47%" }}
                  />
                  {/* Current position indicator */}
                  {isRunning && (
                    <div
                      className="absolute top-0 w-0.5 sm:w-1 h-full bg-[var(--text-primary)] rounded-full transition-all"
                      style={{
                        left: `${Math.min((elapsedTime / 17) * 100, 100)}%`,
                      }}
                    />
                  )}
                </div>
                <span className="text-[10px] sm:text-xs text-[var(--error)] w-5 sm:w-6 text-center flex-shrink-0">
                  DNF
                </span>
              </div>
              {/* Zone Labels - aligned with progress bar zones */}
              <div className="flex items-center mt-1.5">
                <span className="text-[10px] sm:text-xs w-5 sm:w-6 flex-shrink-0"></span>
                <div className="flex-1 relative h-4">
                  {/* 8s at 47% - where the marker line is */}
                  <span
                    className="absolute text-[9px] sm:text-[10px] text-[var(--text-muted)] -translate-x-1/2"
                    style={{ left: "46%" }}
                  >
                    8s
                  </span>
                  {/* 12-15s centered in green zone */}
                  <span
                    className="absolute text-[9px] sm:text-[10px] text-[var(--success)] -translate-x-1/2"
                    style={{ left: "72%" }}
                  >
                    12-15s
                  </span>
                  {/* +2 centered in yellow zone */}
                  <span
                    className="absolute text-[9px] sm:text-[10px] text-[var(--warning)] -translate-x-1/2"
                    style={{ left: "88%" }}
                  >
                    +2
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Section */}
          <div className="border-t border-[var(--border)] pt-4">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
              {showSettings ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showSettings && (
              <div className="mt-4 space-y-3">
                {/* Hide Timer Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-[var(--primary)]/20 text-[var(--primary)] rounded-lg flex items-center justify-center flex-shrink-0">
                      <Eye className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        Hide Timer
                      </span>
                      <p className="text-xs text-[var(--text-muted)]">
                        Hide time while running
                      </p>
                    </div>
                  </div>
                  <Toggle enabled={hideTimer} onChange={setHideTimer} />
                </div>

                {/* Random Start Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-[var(--primary)]/20 text-[var(--primary)] rounded-lg flex items-center justify-center flex-shrink-0">
                      <Timer className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        Random Delay
                      </span>
                      <p className="text-xs text-[var(--text-muted)]">
                        0-2s delay before start
                      </p>
                    </div>
                  </div>
                  <Toggle enabled={randomStart} onChange={setRandomStart} />
                </div>

                {/* Show Warnings Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-[var(--primary)]/20 text-[var(--primary)] rounded-lg flex items-center justify-center flex-shrink-0">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        Audio Warnings
                      </span>
                      <p className="text-xs text-[var(--text-muted)]">
                        Play 8s and 12s alerts
                      </p>
                    </div>
                  </div>
                  <Toggle enabled={showWarnings} onChange={setShowWarnings} />
                </div>
              </div>
            )}
          </div>

          {/* Footer with stats summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-[var(--border)]">
            <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-[var(--text-muted)]">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {perfectRate}% perfect
              </span>
              {stats.averageTime > 0 && (
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Avg: {stats.averageTime.toFixed(1)}s
                </span>
              )}
            </div>
            {stats.totalAttempts > 0 && (
              <button
                onClick={resetStats}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[var(--error)] hover:bg-[var(--error)]/10 rounded-lg transition-colors self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Stats
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}