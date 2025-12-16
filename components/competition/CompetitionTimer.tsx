"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "@/lib/theme-context";

type TimerState =
  | "idle"
  | "inspection"
  | "holding"
  | "ready"
  | "running"
  | "stopped";

interface CompetitionTimerProps {
  onSolveComplete: (
    time: number,
    penalty: "none" | "+2" | "DNF",
    inspectionViolation: "+2" | "DNF" | null
  ) => void;
  inspectionEnabled?: boolean;
  timerDelay?: boolean;
  soundEnabled?: boolean;
  isDisabled?: boolean;
  onStateChange?: (state: TimerState) => void;
}

export default function CompetitionTimer({
  onSolveComplete,
  inspectionEnabled = true,
  timerDelay = false,
  soundEnabled = true,
  isDisabled = false,
  onStateChange,
}: CompetitionTimerProps) {
  const { timerUpdateMode, reduceMotion } = useTheme();

  const [state, setState] = useState<TimerState>("idle");
  const [time, setTime] = useState(0);
  const [inspectionTime, setInspectionTime] = useState(15);
  const [inspectionPenalty, setInspectionPenalty] = useState<
    "+2" | "DNF" | null
  >(null);
  const [holdProgress, setHoldProgress] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inspectionRef = useRef<NodeJS.Timeout | null>(null);
  const holdRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const holdStartRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isTouchActiveRef = useRef<boolean>(false);

  // Notify parent of state changes
  useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (inspectionRef.current) clearInterval(inspectionRef.current);
      if (holdRef.current) clearInterval(holdRef.current);
    };
  }, []);

  // Play beep sound
  const playBeep = useCallback(
    (frequency: number, duration: number) => {
      if (!soundEnabled || !audioContextRef.current) return;

      try {
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
      } catch (e) {
        // Audio context may not be available
      }
    },
    [soundEnabled]
  );

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

  // Format time in seconds only (no centiseconds)
  const formatTimeSecondsOnly = (ms: number): string => {
    if (ms === Infinity) return "DNF";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return minutes > 0
      ? `${minutes}:${secs.toString().padStart(2, "0")}`
      : secs.toString();
  };

  // Start inspection phase
  const startInspection = useCallback(() => {
    if (isDisabled) return;

    setState("inspection");
    setInspectionTime(15);
    setInspectionPenalty(null);
    playBeep(800, 100);

    inspectionRef.current = setInterval(() => {
      setInspectionTime((prev) => {
        const newTime = prev - 1;

        if (newTime === 8) playBeep(600, 100);
        if (newTime === 3) playBeep(400, 100);
        if (newTime === 0) {
          setInspectionPenalty("+2");
          playBeep(300, 200);
        }
        if (newTime <= -2) {
          setInspectionPenalty("DNF");
          playBeep(200, 500);
          if (inspectionRef.current) {
            clearInterval(inspectionRef.current);
          }
        }

        return newTime;
      });
    }, 1000);
  }, [isDisabled, playBeep]);

  // Start timer (skip inspection if disabled)
  const startTimer = useCallback(() => {
    if (inspectionRef.current) {
      clearInterval(inspectionRef.current);
    }

    setState("running");
    startTimeRef.current = Date.now();

    // Add random delay if atmosphere setting enabled
    const delay = timerDelay ? Math.random() * 50 : 0;

    setTimeout(() => {
      timerRef.current = setInterval(() => {
        setTime(Date.now() - startTimeRef.current);
      }, 10);
    }, delay);
  }, [timerDelay]);

  // Handle hold start
  const handleHoldStart = useCallback(() => {
    if (isDisabled) return;

    if (state === "idle") {
      if (inspectionEnabled) {
        startInspection();
      } else {
        // Skip inspection, go directly to holding
        setState("holding");
        holdStartRef.current = Date.now();

        const checkHold = () => {
          if (holdRef.current) clearInterval(holdRef.current);

          holdRef.current = setInterval(() => {
            const holdTime = Date.now() - holdStartRef.current;
            const progress = Math.min(holdTime / 550, 1);
            setHoldProgress(progress);

            if (progress >= 1) {
              setState("ready");
              playBeep(1000, 50);
              if (holdRef.current) clearInterval(holdRef.current);
            }
          }, 16);
        };
        checkHold();
      }
    } else if (state === "inspection") {
      setState("holding");
      holdStartRef.current = Date.now();

      const checkHold = () => {
        if (holdRef.current) clearInterval(holdRef.current);

        holdRef.current = setInterval(() => {
          const holdTime = Date.now() - holdStartRef.current;
          const progress = Math.min(holdTime / 550, 1);
          setHoldProgress(progress);

          if (progress >= 1) {
            setState("ready");
            playBeep(1000, 50);
            if (holdRef.current) clearInterval(holdRef.current);
          }
        }, 16);
      };
      checkHold();
    } else if (state === "running") {
      stopTimer();
    }
  }, [state, isDisabled, inspectionEnabled, startInspection, playBeep]);

  // Handle hold end
  const handleHoldEnd = useCallback(() => {
    if (holdRef.current) {
      clearInterval(holdRef.current);
    }
    setHoldProgress(0);

    if (state === "ready") {
      startTimer();
    } else if (state === "holding") {
      // Abort hold, return to previous state
      if (inspectionEnabled && inspectionTime > -2) {
        setState("inspection");
      } else {
        setState("idle");
      }
    }
  }, [state, inspectionEnabled, inspectionTime, startTimer]);

  // Stop timer
  const stopTimer = useCallback(() => {
    if (state !== "running") return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const finalTime = Date.now() - startTimeRef.current;
    setTime(finalTime);
    setState("stopped");
    playBeep(1200, 100);

    // Automatically confirm DNF if inspection penalty is DNF
    if (inspectionPenalty === "DNF") {
      onSolveComplete(finalTime, "DNF", "DNF");
    }
  }, [state, inspectionPenalty, playBeep, onSolveComplete]);

  // Confirm solve with penalty
  const confirmSolve = useCallback(
    (penalty: "none" | "+2" | "DNF") => {
      onSolveComplete(time, penalty, inspectionPenalty);
      resetTimer();
    },
    [time, inspectionPenalty, onSolveComplete]
  );

  // Reset timer for next solve
  const resetTimer = useCallback(() => {
    setState("idle");
    setTime(0);
    setInspectionTime(15);
    setInspectionPenalty(null);
    setHoldProgress(0);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        e.stopPropagation();
        if (!isTouchActiveRef.current) {
          handleHoldStart();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        e.stopPropagation();
        if (!isTouchActiveRef.current) {
          handleHoldEnd();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    window.addEventListener("keyup", handleKeyUp, { passive: false });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleHoldStart, handleHoldEnd]);

  // Touch/Mouse handlers
  const handlePointerDown = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if ("touches" in e) {
      isTouchActiveRef.current = true;
    }
    handleHoldStart();
  };

  const handlePointerUp = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    handleHoldEnd();
    if ("touches" in e) {
      setTimeout(() => {
        isTouchActiveRef.current = false;
      }, 100);
    }
  };

  // Get display time based on state
  const getDisplayTime = () => {
    if (state === "inspection") {
      return inspectionTime > 0
        ? inspectionTime.toString()
        : inspectionTime === 0
          ? "+2"
          : "DNF";
    }

    if (state === "running") {
      if (timerUpdateMode === "seconds") {
        return formatTimeSecondsOnly(time);
      }
      // Default to full time format
    }

    return formatTime(time);
  };

  // Get timer color based on state
  const getTimerColor = () => {
    switch (state) {
      case "holding":
        return "text-[var(--warning)]";
      case "inspection":
        if (inspectionTime <= 3) return "text-[var(--error)]";
        if (inspectionTime <= 8) return "text-[var(--warning)]";
        return "text-[var(--timer-ready)]";
      case "ready":
        return "text-[var(--timer-ready)]";
      case "running":
        return "text-[var(--timer-running)]";
      case "stopped":
        return "text-[var(--primary)]";
      default:
        return "text-[var(--text-muted)]";
    }
  };

  // Get status text
  const getStatusText = () => {
    switch (state) {
      case "idle":
        return inspectionEnabled
          ? "Press SPACE or tap to start inspection"
          : "Hold SPACE or tap and hold to ready";
      case "inspection":
        return "Hold SPACE or hold to ready timer";
      case "holding":
        return "Keep holding...";
      case "ready":
        return "Release to start!";
      case "running":
        return "Press SPACE or tap to stop";
      case "stopped":
        return "Confirm your solve below";
    }
  };

  return (
    <div className="space-y-4">
      {/* Timer Display */}
      <div
        className={`timer-card relative overflow-hidden cursor-pointer select-none ${
          isDisabled ? "opacity-50 pointer-events-none" : ""
        }`}
        onMouseDown={handlePointerDown}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchEnd={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          userSelect: "none",
          WebkitUserSelect: "none",
          touchAction: "none",
        }}
      >
        {/* Hold Progress Bar */}
        {(state === "holding" || holdProgress > 0) && (
          <div
            className="absolute top-0 left-0 h-1 bg-[var(--timer-ready)] transition-all duration-75"
            style={{ width: `${holdProgress * 100}%` }}
          />
        )}

        <div className="py-8 sm:py-12 text-center">
          {/* Main Timer Display */}
          <div
            className={`font-mono timer-text font-bold tabular-nums ${getTimerColor()} transition-colors duration-200`}
            style={{
              animation:
                state === "running" &&
                timerUpdateMode === "solving" &&
                !reduceMotion
                  ? "pulse 2s infinite"
                  : "none",
            }}
          >
            {getDisplayTime()}
          </div>

          {/* Inspection Penalty Warning */}
          {inspectionPenalty && state !== "stopped" && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--error)]/10 border border-[var(--error)]/30">
              <span className="text-sm font-medium text-[var(--error)]">
                {inspectionPenalty} Inspection Penalty
              </span>
            </div>
          )}

          {/* Status Text */}
          <div className="mt-4 text-sm text-[var(--text-secondary)]">
            {getStatusText()}
          </div>
        </div>
      </div>

      {/* Penalty Buttons - shown when stopped */}
      {state === "stopped" && (
        <div className="timer-card">
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4 text-center">
            Confirm Result
          </h3>
          <div className="text-center mb-4">
            <span className="text-2xl font-mono font-bold text-[var(--text-primary)]">
              {formatTime(time)}
            </span>
            {inspectionPenalty && (
              <span className="ml-2 text-sm text-[var(--warning)]">
                + {inspectionPenalty} inspection
              </span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => confirmSolve("none")}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--success)] text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              OK
            </button>
            <button
              onClick={() => confirmSolve("+2")}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--warning)] text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              +2 Penalty
            </button>
            <button
              onClick={() => confirmSolve("DNF")}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--error)] text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              DNF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}