"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Settings, Eye, EyeOff } from "lucide-react";

// Persistent boolean that reads/writes localStorage on first render
function usePersistentBool(key: string, defaultValue: boolean) {
  const [state, setState] = useState<boolean>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? defaultValue : JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState] as const;
}

interface TimerDisplayProps {
  onSolveComplete: (time: number, notes?: string, tags?: string[]) => void;
  onApplyPenalty?: (penalty: "none" | "+2" | "DNF") => void;
  lastSolveId?: string | null;
  onTimerStateChange?: (isActive: boolean) => void;
}

type TimerState =
  | "idle"
  | "inspection"
  | "ready"
  | "running"
  | "stopped"
  | "holding";

export default function TimerDisplay({
  onSolveComplete,
  onApplyPenalty,
  lastSolveId,
  onTimerStateChange,
}: TimerDisplayProps) {
  const [state, setState] = useState<TimerState>("idle");
  const [time, setTime] = useState(0);
  const [inspectionTime, setInspectionTime] = useState(15);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [showPenaltyButtons, setShowPenaltyButtons] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentPenalty, setCurrentPenalty] = useState<"none" | "+2" | "DNF">(
    "none"
  );
  const [showTimer, setShowTimer] = usePersistentBool(
    "cubelab-timer-expanded",
    true
  );
  const [inspectionEnabled, setInspectionEnabled] = usePersistentBool(
    "cubelab-inspection-enabled",
    true
  );
  const [focusModeEnabled, setFocusModeEnabled] = usePersistentBool(
    "cubelab-focus-mode-enabled",
    false
  );

  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const inspectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerContentRef = useRef<HTMLDivElement>(null);
  const touchStartTimeRef = useRef<number>(0);
  const isTouchActiveRef = useRef<boolean>(false);
  const onSolveCompleteRef = useRef(onSolveComplete);
  const onTimerStateChangeRef = useRef(onTimerStateChange);

  // Keep refs updated to avoid stale closures
  useEffect(() => {
    onSolveCompleteRef.current = onSolveComplete;
  }, [onSolveComplete]);

  useEffect(() => {
    onTimerStateChangeRef.current = onTimerStateChange;
  }, [onTimerStateChange]);

  // Play beep sound
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

  // Timer logic
  useEffect(() => {
    if (state === "inspection") {
      inspectionIntervalRef.current = setInterval(() => {
        setInspectionTime((prev) => {
          const newTime = prev - 0.01;

          // Play alert at 8s and 3s
          if (Math.abs(newTime - 7) < 0.02 || Math.abs(newTime - 3) < 0.02) {
            playAlert();
          }

          if (newTime <= 0) {
            setState("running");
            setTime(0);
            setCurrentPenalty("none");
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

  // Notify parent of timer active state changes (for focus mode)
  useEffect(() => {
    if (onTimerStateChangeRef.current) {
      const isActive = state === "inspection" || state === "running";
      // Only trigger focus mode if it's enabled and timer is active
      onTimerStateChangeRef.current(isActive && focusModeEnabled);
    }
  }, [state, focusModeEnabled]); // Removed onTimerStateChange to prevent infinite loop

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (!isSpacePressed) {
          setIsSpacePressed(true);
          if (state === "idle" || state === "stopped") {
            setState("holding");
          } else if (state === "inspection") {
            setState("ready");
          } else if (state === "running") {
            // Allow spacebar to stop timer
            setState("stopped");
            const finalTime = Date.now() - startTimeRef.current;
            setTime(finalTime);
            playBeep();
            onSolveCompleteRef.current(finalTime);
            setShowPenaltyButtons(true);
          }
        }
      } else if (state === "running") {
        e.preventDefault();
        setState("stopped");
        const finalTime = Date.now() - startTimeRef.current;
        setTime(finalTime);
        playBeep();
        onSolveCompleteRef.current(finalTime);
        setShowPenaltyButtons(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsSpacePressed(false);
        if (state === "holding") {
          // Determine what to do based on inspection setting
          if (inspectionEnabled) {
            setState("inspection");
            setInspectionTime(15);
          } else {
            // When inspection is off, go directly to running
            setState("running");
            setTime(0);
            setCurrentPenalty("none");
            startTimeRef.current = Date.now();
            playBeep();
          }
        } else if (state === "ready") {
          setState("running");
          setTime(0);
          setCurrentPenalty("none");
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
  }, [state, isSpacePressed, inspectionEnabled, playBeep]); 

  // Touch and mouse handling
  const handleTouchStart = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      if (!isTouchActiveRef.current) {
        isTouchActiveRef.current = true;
        touchStartTimeRef.current = Date.now();

        if (state === "idle" || state === "stopped") {
          setState("holding");
        } else if (state === "inspection") {
          setState("ready");
        } else if (state === "running") {
          // Allow touch/mouse to stop timer
          setState("stopped");
          const finalTime = Date.now() - startTimeRef.current;
          setTime(finalTime);
          playBeep();
          onSolveCompleteRef.current(finalTime);
          setShowPenaltyButtons(true);
        }
      }
    },
    [state, playBeep]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      if (isTouchActiveRef.current) {
        isTouchActiveRef.current = false;

        if (state === "holding") {
          // Determine what to do based on inspection setting
          if (inspectionEnabled) {
            setState("inspection");
            setInspectionTime(15);
          } else {
            // When inspection is off, go directly to running
            setState("running");
            setTime(0);
            setCurrentPenalty("none");
            startTimeRef.current = Date.now();
            playBeep();
          }
        } else if (state === "ready") {
          setState("running");
          setTime(0);
          setCurrentPenalty("none");
          startTimeRef.current = Date.now();
          playBeep();
        }
      }
    },
    [state, inspectionEnabled, playBeep]
  );

  // Handle penalty button clicks
  const handlePenalty = (penalty: "none" | "+2" | "DNF") => {
    setCurrentPenalty(penalty);
    if (onApplyPenalty) {
      onApplyPenalty(penalty);
    }
    setShowPenaltyButtons(false);
  };

  // Start new solve
  const startNewSolve = () => {
    setShowPenaltyButtons(false);
    setCurrentPenalty("none");
    setState("idle");
  };

  // Format time
  const formatTime = (timeMs: number) => {
    if (timeMs === Infinity) return "DNF";
    const seconds = timeMs / 1000;
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return mins > 0 ? `${mins}:${secs.padStart(5, "0")}` : secs;
  };

  // Get displayed time with penalty applied
  const getDisplayTime = () => {
    if (currentPenalty === "DNF") {
      return "DNF";
    } else if (currentPenalty === "+2") {
      return formatTime(time + 2000); // Add 2 seconds
    } else {
      return formatTime(time);
    }
  };

  // Get timer color based on state
  const getTimerColor = () => {
    switch (state) {
      case "holding":
        return "text-orange-400";
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

  // Get status text based on state
  const getStatusText = () => {
    switch (state) {
      case "idle":
        return "Hold SPACE or touch and hold timer, then release to start";
      case "holding":
        return inspectionEnabled
          ? "Release to start inspection"
          : "Release to start timer";
      case "inspection":
        return "Get ready... (Hold SPACE/touch for timer)";
      case "ready":
        return "Release to start";
      case "running":
        return "Solving... (any key or touch to stop)";
      case "stopped":
        return "Great solve! (SPACE or touch for next)";
    }
  };

  return (
    <div className="timer-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement">
          Timer
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
            title="Timer Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowTimer(!showTimer)}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-md transition-colors"
            title={showTimer ? "Hide timer" : "Show timer"}
          >
            {showTimer ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <div
        ref={timerContentRef}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          height: showTimer ? "auto" : "0",
          opacity: showTimer ? 1 : 0,
        }}
      >
        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-4 p-4 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]">
            <div className="space-y-3">
              {/* Inspection Time Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[var(--primary)]/20 text-[var(--primary)] rounded-lg flex items-center justify-center">
                    <span className="text-xs font-bold">15</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-[var(--text-primary)] font-inter">
                      Inspection Time
                    </span>
                    <p className="text-xs text-[var(--text-muted)] font-inter">
                      15-second inspection before solving
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setInspectionEnabled(!inspectionEnabled)}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center ${
                    inspectionEnabled
                      ? "bg-[var(--primary)] justify-end"
                      : "bg-[var(--border)] justify-start"
                  }`}
                >
                  <div className="w-4 h-4 bg-white rounded-full mx-1 transition-all" />
                </button>
              </div>

              {/* Focus Mode Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[var(--primary)]/20 text-[var(--primary)] rounded-lg flex items-center justify-center">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-[var(--text-primary)] font-inter">
                      Focus Mode
                    </span>
                    <p className="text-xs text-[var(--text-muted)] font-inter">
                      Blur other areas during solve
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setFocusModeEnabled(!focusModeEnabled)}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center ${
                    focusModeEnabled
                      ? "bg-[var(--primary)] justify-end"
                      : "bg-[var(--border)] justify-start"
                  }`}
                >
                  <div className="w-4 h-4 bg-white rounded-full mx-1 transition-all" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div
          className="text-center space-y-6"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseUp={handleTouchEnd}
          onContextMenu={(e) => e.preventDefault()} // Disable context menu on long press
          style={{
            userSelect: "none",
            WebkitUserSelect: "none",
            touchAction: "none", // Disable double-tap to zoom
          }}
        >
          <div
            className={`font-bold timer-text ${getTimerColor()} transition-all duration-300 font-mono cursor-pointer select-none`}
          >
            {state === "inspection"
              ? `${inspectionTime.toFixed(2)}`
              : getDisplayTime()}
          </div>

          {/* Penalty Indicator */}
          {currentPenalty !== "none" && state === "stopped" && (
            <div
              className={`text-xs font-semibold px-2 py-1 rounded-full transition-all duration-300 ${
                currentPenalty === "+2"
                  ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                  : "bg-red-100 text-red-800 border border-red-300"
              }`}
            >
              {currentPenalty === "+2" ? "+2 Penalty Applied" : "DNF Applied"}
            </div>
          )}

          <div className="text-sm text-[var(--text-secondary)] font-inter select-none">
            {getStatusText()}
          </div>

          {/* Penalty Buttons */}
          {state === "stopped" && showPenaltyButtons && (
            <div className="flex justify-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handlePenalty(currentPenalty === "+2" ? "none" : "+2");
                }}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                className={`px-6 py-2 text-white text-sm rounded-lg font-semibold font-statement transition-all hover:scale-105 ${
                  currentPenalty === "+2"
                    ? "bg-yellow-600 ring-2 ring-yellow-300"
                    : "bg-[var(--warning)] hover:bg-yellow-500"
                }`}
              >
                +2 {currentPenalty === "+2" ? "✓" : ""}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handlePenalty(currentPenalty === "DNF" ? "none" : "DNF");
                }}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                className={`px-6 py-2 text-white text-sm rounded-lg font-semibold font-statement transition-all hover:scale-105 ${
                  currentPenalty === "DNF"
                    ? "bg-red-700 ring-2 ring-red-300"
                    : "bg-[var(--error)] hover:bg-red-500"
                }`}
              >
                DNF {currentPenalty === "DNF" ? "✓" : ""}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}