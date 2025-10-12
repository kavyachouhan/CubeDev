"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Settings,
  BarChart3,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useUser } from "@/components/UserProvider";
import { getWCAOAuthUrl } from "@/lib/wca-config";

interface TimerRecord {
  id: string;
  time: number;
  timestamp: Date;
  scramble: string;
  penalty: "none" | "+2" | "DNF";
  finalTime: number;
}

type TimerState = "idle" | "inspection" | "ready" | "running" | "stopped";

export default function TimerHero() {
  const { user } = useUser();
  const [state, setState] = useState<TimerState>("idle");
  const [time, setTime] = useState(0);
  const [inspectionTime, setInspectionTime] = useState(15);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [history, setHistory] = useState<TimerRecord[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [inspectionEnabled, setInspectionEnabled] = useState(true);
  const [lastSolveId, setLastSolveId] = useState<string | null>(null);
  const [showPenaltyButtons, setShowPenaltyButtons] = useState(false);
  const [currentPenalty, setCurrentPenalty] = useState<"none" | "+2" | "DNF">(
    "none"
  );

  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const inspectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleWCASignIn = () => {
    const wcaAuthUrl = getWCAOAuthUrl();
    window.location.href = wcaAuthUrl;
  };

  // Sound effects
  const playBeep = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.1
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.log("Audio not available");
    }
  }, []);

  const playAlert = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 1200;
      oscillator.type = "sine";
      gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.2
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.log("Audio not available");
    }
  }, []);

  // Save time to history
  const saveTime = useCallback((timeMs: number) => {
    const record: TimerRecord = {
      id: Date.now().toString(),
      time: timeMs,
      timestamp: new Date(),
      scramble: "R U R' U' F R F'",
      penalty: "none",
      finalTime: timeMs,
    };

    setHistory((prev) => {
      const newHistory = [record, ...prev].slice(0, 50);
      localStorage.setItem("cubedev-timer-history", JSON.stringify(newHistory));
      return newHistory;
    });
    setLastSolveId(record.id);
    setShowPenaltyButtons(true); // Show penalty buttons after a solve
    setCurrentPenalty("none"); // Reset penalty for new solve
  }, []);

  // Timer logic
  useEffect(() => {
    if (state === "inspection") {
      inspectionIntervalRef.current = setInterval(() => {
        setInspectionTime((prev) => {
          const newTime = prev - 0.01;

          // Play alert at 8 and 3 seconds
          if (Math.abs(newTime - 7) < 0.02 || Math.abs(newTime - 3) < 0.02) {
            playAlert();
          }

          if (newTime <= 0) {
            setState("running");
            setTime(0);
            startTimeRef.current = Date.now();
            playBeep();
            return 15;
          }
          return newTime;
        });
      }, 10);
    } else if (state === "running") {
      intervalRef.current = setInterval(() => {
        setTime(Date.now() - startTimeRef.current);
      }, 10);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (inspectionIntervalRef.current)
        clearInterval(inspectionIntervalRef.current);
    };
  }, [state, playBeep, playAlert]);

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (!isSpacePressed) {
          setIsSpacePressed(true);
          if (state === "idle" || state === "stopped") {
            setShowPenaltyButtons(false); // Hide penalty buttons when starting new solve
            if (inspectionEnabled) {
              setState("inspection");
              setInspectionTime(15);
            } else {
              setState("ready");
            }
          } else if (state === "inspection") {
            setState("ready");
          }
        }
      } else if (state === "running") {
        // Any key to stop the timer
        e.preventDefault();
        setState("stopped");
        const finalTime = Date.now() - startTimeRef.current;
        setTime(finalTime);
        playBeep();
        saveTime(finalTime);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsSpacePressed(false);
        if (state === "ready") {
          setState("running");
          setTime(0);
          startTimeRef.current = Date.now();
          playBeep();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [state, isSpacePressed, inspectionEnabled, playBeep, saveTime]);

  // Mouse handling
  const handleMouseDown = () => {
    if (state === "idle" || state === "stopped") {
      if (inspectionEnabled) {
        setState("inspection");
        setInspectionTime(15);
      } else {
        setState("ready");
      }
    } else if (state === "inspection") {
      setState("ready");
    }
  };

  const handleMouseUp = () => {
    if (state === "ready") {
      setState("running");
      setTime(0);
      startTimeRef.current = Date.now();
      playBeep();
    } else if (state === "running") {
      setState("stopped");
      const finalTime = Date.now() - startTimeRef.current;
      setTime(finalTime);
      playBeep();
      saveTime(finalTime);
    }
  };

  // Apply penalty
  const applyPenalty = (penalty: "+2" | "DNF") => {
    if (!lastSolveId) return;

    const newHistory = history.map((record) => {
      if (record.id === lastSolveId) {
        return {
          ...record,
          penalty,
          finalTime:
            penalty === "+2"
              ? record.time + 2000
              : penalty === "DNF"
                ? Infinity
                : record.time,
        };
      }
      return record;
    });

    setHistory(newHistory);
    localStorage.setItem("cubedev-timer-history", JSON.stringify(newHistory));
    setShowPenaltyButtons(false); // Hide penalty buttons after applying
  };

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("cubedev-timer-history");
    if (saved) {
      try {
        const parsedHistory = JSON.parse(saved).map((record: any) => ({
          ...record,
          timestamp: new Date(record.timestamp),
        }));
        setHistory(parsedHistory);
      } catch (e) {
        console.error("Failed to load timer history:", e);
      }
    }
  }, []);

  // Format time in ms to mm:ss.SS
  const formatTime = (timeMs: number) => {
    if (timeMs === Infinity) return "DNF";
    const seconds = timeMs / 1000;
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return mins > 0 ? `${mins}:${secs.padStart(5, "0")}` : secs;
  };

  // Get timer color based on state
  const getTimerColor = () => {
    switch (state) {
      case "inspection":
        if (inspectionTime <= 3) return "text-red-400";
        if (inspectionTime <= 8) return "text-yellow-400";
        return "text-green-400";
      case "ready":
        return "text-green-400";
      case "running":
        return "text-red-400";
      case "stopped":
        return "text-blue-400";
      default:
        return "text-gray-400";
    }
  };

  // Get status text
  const getStatusText = () => {
    switch (state) {
      case "idle":
        return inspectionEnabled
          ? "Press SPACE for inspection"
          : "Press SPACE to start";
      case "inspection":
        return "Get ready...";
      case "ready":
        return "Release SPACE to start";
      case "running":
        return "Solving... (any key to stop)";
      case "stopped":
        return "Great solve! (SPACE for next)";
    }
  };

  // Calculate stats
  const validTimes = history
    .filter((r) => r.finalTime !== Infinity)
    .map((r) => r.finalTime);
  const bestTime = validTimes.length > 0 ? Math.min(...validTimes) : null;
  const ao5 =
    validTimes.length >= 5
      ? validTimes
          .slice(0, 5)
          .sort((a, b) => a - b)
          .slice(1, 4)
          .reduce((a, b) => a + b, 0) / 3
      : null;

  return (
    <section className="min-h-screen bg-[var(--background)] flex items-center">
      <div className="container-responsive">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left side - Headings */}
          <div className="space-y-6 lg:space-y-8">
            {/* Beta Badge */}
            <div className="inline-flex items-center px-3 py-1 bg-[var(--warning)]/10 border border-[var(--warning)]/20 rounded-full">
              <span className="text-sm font-medium text-[var(--warning)] font-inter">
                Beta Version
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-[var(--text-primary)] leading-tight font-statement">
                Master your <span className="text-[var(--primary)]">cube.</span>
              </h1>
              <p className="text-xl md:text-2xl text-[var(--text-secondary)] max-w-lg font-inter">
                Advanced timer with phase analysis, comprehensive statistics,
                challenge rooms, and WCA integration.
              </p>
            </div>

            <div className="flex justify-center sm:justify-start">
              {user ? (
                <a
                  href="/cube-lab/timer"
                  className="px-8 py-4 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold rounded-lg transition-all duration-200 font-button text-lg text-center"
                >
                  Go to Timer
                </a>
              ) : (
                <button
                  onClick={handleWCASignIn}
                  className="px-8 py-4 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold rounded-lg transition-all duration-200 font-button text-lg flex items-center justify-center gap-2"
                >
                  <img src="/wca_logo.png" alt="WCA" className="w-5 h-5" />
                  Sign in with WCA
                </button>
              )}
            </div>
          </div>

          {/* Right side - Timer Card */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-xl">
              <div className="timer-card">
                {/* Timer Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-[var(--text-primary)] font-statement">
                    CubeDev Timer
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="p-2 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowStats(!showStats)}
                      className="p-2 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Settings Panel */}
                {showSettings && (
                  <div className="mb-6 p-4 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[var(--text-secondary)] font-inter">
                          Inspection
                        </span>
                        <button
                          onClick={() =>
                            setInspectionEnabled(!inspectionEnabled)
                          }
                          className={`w-10 h-6 rounded-full transition-colors ${
                            inspectionEnabled
                              ? "bg-[var(--primary)]"
                              : "bg-[var(--border)]"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 bg-white rounded-full transition-transform ${
                              inspectionEnabled
                                ? "translate-x-5"
                                : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Timer Display */}
                <div
                  className="text-center space-y-6 cursor-pointer select-none"
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                >
                  {state === "inspection" && (
                    <div className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider font-statement">
                      Inspection
                    </div>
                  )}

                  <div
                    className={`font-bold timer-text ${getTimerColor()} transition-all duration-300 font-mono`}
                  >
                    {state === "inspection"
                      ? `${inspectionTime.toFixed(2).padStart(5, "0")}`
                      : formatTime(time)}
                  </div>

                  <div className="text-sm text-[var(--text-secondary)] font-inter">
                    {getStatusText()}
                  </div>
                </div>

                {/* Penalty Buttons */}
                {state === "stopped" && lastSolveId && showPenaltyButtons && (
                  <div className="mt-6 flex justify-center gap-3">
                    <button
                      onClick={() => applyPenalty("+2")}
                      className="px-6 py-2 bg-[var(--warning)] hover:bg-yellow-500 text-white text-sm rounded-lg font-semibold font-statement transition-all hover:scale-105"
                    >
                      +2
                    </button>
                    <button
                      onClick={() => applyPenalty("DNF")}
                      className="px-6 py-2 bg-[var(--error)] hover:bg-red-500 text-white text-sm rounded-lg font-semibold font-statement transition-all hover:scale-105"
                    >
                      DNF
                    </button>
                  </div>
                )}

                {/* Stats */}
                {showStats && (
                  <div className="mt-6 grid grid-cols-3 gap-4 p-4 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]">
                    <div className="text-center">
                      <div className="text-sm text-[var(--text-muted)] uppercase tracking-wide font-inter">
                        Best
                      </div>
                      <div className="text-xl font-bold text-[var(--primary)] font-mono">
                        {bestTime ? formatTime(bestTime) : "-"}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-base text-[var(--text-muted)] uppercase tracking-wide font-inter">
                        AO5
                      </div>
                      <div className="text-xl font-bold text-[var(--primary)] font-mono">
                        {ao5 ? formatTime(ao5) : "-"}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-base text-[var(--text-muted)] uppercase tracking-wide font-inter">
                        Solves
                      </div>
                      <div className="text-xl font-bold text-[var(--primary)] font-mono">
                        {history.length}
                      </div>
                    </div>
                  </div>
                )}

                {/* History */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors font-inter flex items-center gap-2"
                    >
                      Recent Times
                      {showHistory ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    {history.length > 0 && (
                      <button
                        onClick={() => {
                          setHistory([]);
                          localStorage.removeItem("cubedev-timer-history");
                        }}
                        className="p-1 text-[var(--text-muted)] hover:text-[var(--error)] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {showHistory && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {history.slice(0, 10).map((record, index) => (
                        <div
                          key={record.id}
                          className="flex justify-between items-center py-2 px-3 bg-[var(--surface-elevated)] rounded border border-[var(--border)]"
                        >
                          <span className="text-sm text-[var(--text-muted)] font-inter">
                            #{index + 1}
                          </span>
                          <span
                            className={`font-mono text-[var(--text-primary)] ${
                              record.penalty === "+2"
                                ? "text-yellow-400"
                                : record.penalty === "DNF"
                                  ? "text-red-400"
                                  : ""
                            }`}
                          >
                            {formatTime(record.finalTime)}
                            {record.penalty === "+2" && "+"}
                          </span>
                          <span className="text-xs text-[var(--text-muted)] font-inter">
                            {record.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                      {history.length === 0 && (
                        <div className="text-center py-4 text-[var(--text-muted)] font-inter">
                          No solves yet
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}