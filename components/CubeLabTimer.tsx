"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Settings,
  Trash2,
  ChevronDown,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { useUser } from "@/components/UserProvider";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

interface TimerRecord {
  id: string;
  time: number;
  timestamp: Date;
  scramble: string;
  penalty: "none" | "+2" | "DNF";
  finalTime: number;
  event: string;
}

type TimerState = "idle" | "inspection" | "ready" | "running" | "stopped";

export default function CubeLabTimer() {
  const { user } = useUser();
  const saveSolve = useMutation(api.users.saveSolve);

  const [state, setState] = useState<TimerState>("idle");
  const [time, setTime] = useState(0);
  const [inspectionTime, setInspectionTime] = useState(15);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [history, setHistory] = useState<TimerRecord[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [inspectionEnabled, setInspectionEnabled] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState("3x3");
  const [lastSolveId, setLastSolveId] = useState<string | null>(null);
  const [currentScramble, setCurrentScramble] = useState("R U R' U' F R F'");

  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const inspectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const events = [
    "3x3",
    "2x2",
    "4x4",
    "5x5",
    "6x6",
    "7x7",
    "3x3 OH",
    "3x3 BLD",
    "4x4 BLD",
    "5x5 BLD",
    "3x3 MBLD",
    "FMC",
    "Pyraminx",
    "Megaminx",
    "Skewb",
    "Clock",
    "Square-1",
  ];

  // Generate scramble function (simplified for demo)
  const generateScramble = useCallback(() => {
    const moves = ["R", "L", "U", "D", "F", "B"];
    const modifiers = ["", "'", "2"];
    const scrambleLength =
      selectedEvent === "2x2x2" ? 9 : selectedEvent === "4x4x4" ? 40 : 20;

    let scramble = "";
    for (let i = 0; i < scrambleLength; i++) {
      const move = moves[Math.floor(Math.random() * moves.length)];
      const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
      scramble += move + modifier + " ";
    }
    return scramble.trim();
  }, [selectedEvent]);

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

  // Save time function
  const saveTime = useCallback(
    async (timeMs: number) => {
      const record: TimerRecord = {
        id: Date.now().toString(),
        time: timeMs,
        timestamp: new Date(),
        scramble: currentScramble,
        penalty: "none",
        finalTime: timeMs,
        event: selectedEvent,
      };

      setHistory((prev) => {
        const newHistory = [record, ...prev].slice(0, 100);
        localStorage.setItem(
          "cubelab-timer-history",
          JSON.stringify(newHistory)
        );
        return newHistory;
      });

      setLastSolveId(record.id);

      // Save to Convex if user is logged in
      if (user?.convexId) {
        try {
          await saveSolve({
            userId: user.convexId,
            event: selectedEvent,
            scramble: currentScramble,
            time: timeMs,
            penalty: "none",
            finalTime: timeMs,
          });
        } catch (error) {
          console.error("Failed to save solve to database:", error);
        }
      }

      // Generate new scramble for next solve
      setCurrentScramble(generateScramble());
    },
    [currentScramble, selectedEvent, user, saveSolve, generateScramble]
  );

  // Timer logic
  useEffect(() => {
    if (state === "inspection") {
      inspectionIntervalRef.current = setInterval(() => {
        setInspectionTime((prev) => {
          const newTime = prev - 0.01;
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
  }, [state, playBeep]);

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (!isSpacePressed) {
          setIsSpacePressed(true);
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
        }
      } else if (state === "running") {
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

  // Load history
  useEffect(() => {
    const saved = localStorage.getItem("cubelab-timer-history");
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

  // Generate initial scramble
  useEffect(() => {
    setCurrentScramble(generateScramble());
  }, [generateScramble]);

  // Format time
  const formatTime = (timeMs: number) => {
    if (timeMs === Infinity) return "DNF";
    const seconds = timeMs / 1000;
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return mins > 0 ? `${mins}:${secs.padStart(5, "0")}` : secs;
  };

  // Get timer color
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

  // Calculate stats
  const eventHistory = history.filter((r) => r.event === selectedEvent);
  const validTimes = eventHistory
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
    <div className="container-responsive py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Timer Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Selector */}
          <div className="timer-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement">
                Event
              </h3>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {events.map((event) => (
                <button
                  key={event}
                  onClick={() => setSelectedEvent(event)}
                  className={`p-3 rounded-lg text-sm font-medium transition-all font-button ${
                    selectedEvent === event
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]"
                  }`}
                >
                  {event}
                </button>
              ))}
            </div>
          </div>

          {/* Scramble */}
          <div className="timer-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement">
                Scramble
              </h3>
              <button
                onClick={() => setCurrentScramble(generateScramble())}
                className="p-2 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-[var(--surface-elevated)] rounded-lg">
              <p className="text-lg font-mono text-[var(--text-primary)] text-center leading-relaxed">
                {currentScramble}
              </p>
            </div>
          </div>

          {/* Timer */}
          <div className="timer-card">
            <div className="text-center space-y-6">
              {state === "inspection" && (
                <div className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider font-statement">
                  Inspection: {inspectionTime.toFixed(2)}s
                </div>
              )}

              <div
                className={`font-bold timer-text ${getTimerColor()} transition-all duration-300 font-mono`}
              >
                {state === "inspection"
                  ? `${inspectionTime.toFixed(2)}`
                  : formatTime(time)}
              </div>

              <div className="text-sm text-[var(--text-secondary)] font-inter">
                {state === "idle" &&
                  (inspectionEnabled
                    ? "Press SPACE for inspection"
                    : "Press SPACE to start")}
                {state === "inspection" && "Get ready..."}
                {state === "ready" && "Release SPACE to start"}
                {state === "running" && "Solving... (any key to stop)"}
                {state === "stopped" && "Great solve! (SPACE for next)"}
              </div>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="timer-card">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 font-statement">
                Settings
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)] font-inter">
                    Inspection Time
                  </span>
                  <button
                    onClick={() => setInspectionEnabled(!inspectionEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      inspectionEnabled
                        ? "bg-[var(--primary)]"
                        : "bg-[var(--border)]"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        inspectionEnabled ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Stats & History */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="timer-card">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 font-statement">
              {selectedEvent} Statistics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-inter">
                  Best
                </div>
                <div className="text-lg font-bold text-[var(--primary)] font-mono">
                  {bestTime ? formatTime(bestTime) : "-"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-inter">
                  Ao5
                </div>
                <div className="text-lg font-bold text-[var(--primary)] font-mono">
                  {ao5 ? formatTime(ao5) : "-"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-inter">
                  Solves
                </div>
                <div className="text-lg font-bold text-[var(--primary)] font-mono">
                  {eventHistory.length}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-inter">
                  Session
                </div>
                <div className="text-lg font-bold text-[var(--primary)] font-mono">
                  {
                    eventHistory.filter(
                      (r) =>
                        new Date().getTime() - r.timestamp.getTime() < 3600000
                    ).length
                  }
                </div>
              </div>
            </div>
          </div>

          {/* History */}
          <div className="timer-card">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-lg font-semibold text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors font-statement flex items-center gap-2"
              >
                Recent Times{" "}
                {showHistory ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              {eventHistory.length > 0 && (
                <button
                  onClick={() => {
                    setHistory([]);
                    localStorage.removeItem("cubelab-timer-history");
                  }}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--error)] transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {showHistory && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {eventHistory.slice(0, 20).map((record, index) => (
                  <div
                    key={record.id}
                    className="flex justify-between items-center py-2 px-3 bg-[var(--surface-elevated)] rounded border border-[var(--border)]"
                  >
                    <span className="text-sm text-[var(--text-muted)] font-inter">
                      #{index + 1}
                    </span>
                    <span className="font-mono text-[var(--text-primary)]">
                      {formatTime(record.finalTime)}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] font-inter">
                      {record.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                ))}
                {eventHistory.length === 0 && (
                  <div className="text-center py-4 text-[var(--text-muted)] font-inter">
                    No solves yet for {selectedEvent}
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