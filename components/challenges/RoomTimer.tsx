"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface RoomTimerProps {
  onSolveComplete: (time: number, penalty: "none" | "+2" | "DNF") => void;
  scramble: string;
  solveNumber: number;
  totalSolves: number;
  isDisabled?: boolean;
}

type TimerState =
  | "idle"
  | "holding"
  | "inspection"
  | "ready"
  | "running"
  | "stopped";

export default function RoomTimer({
  onSolveComplete,
  solveNumber,
  totalSolves,
  isDisabled = false,
}: RoomTimerProps) {
  const [state, setState] = useState<TimerState>("idle");
  const [time, setTime] = useState(0);
  const [inspectionTime, setInspectionTime] = useState(15);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [showPenaltySelection, setShowPenaltySelection] = useState(false);
  const [currentPenalty, setCurrentPenalty] = useState<"none" | "+2" | "DNF">(
    "none"
  );
  const [finalTime, setFinalTime] = useState(0);
  const [liveTime, setLiveTime] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const inspectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerContentRef = useRef<HTMLDivElement>(null);
  const touchStartTimeRef = useRef<number>(0);
  const isTouchActiveRef = useRef<boolean>(false);

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
        const currentTime = Date.now() - startTimeRef.current;
        setTime(currentTime);
        setLiveTime(currentTime); // Update live time for display
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
    if (isDisabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (!isSpacePressed && !isCompleted) {
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
            setFinalTime(finalTime);
            setIsCompleted(true);
            playBeep();
            setShowPenaltySelection(true);
          }
        }
      } else if (state === "running" && !isCompleted) {
        e.preventDefault();
        setState("stopped");
        const finalTime = Date.now() - startTimeRef.current;
        setTime(finalTime);
        setFinalTime(finalTime);
        setIsCompleted(true);
        playBeep();
        setShowPenaltySelection(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsSpacePressed(false);
        if (state === "holding" && !isCompleted) {
          setState("inspection");
          setInspectionTime(15);
        } else if (state === "ready" && !isCompleted) {
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
  }, [state, isSpacePressed, playBeep, isDisabled]);

  // Touch and mouse handling
  const handleTouchStart = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (isDisabled || isCompleted) return;
      e.preventDefault();
      if (!isTouchActiveRef.current) {
        isTouchActiveRef.current = true;
        touchStartTimeRef.current = Date.now();

        if (state === "idle" || state === "stopped") {
          setState("holding");
        } else if (state === "inspection") {
          setState("ready");
        } else if (state === "running") {
          setState("stopped");
          const finalTime = Date.now() - startTimeRef.current;
          setTime(finalTime);
          setFinalTime(finalTime);
          setIsCompleted(true);
          playBeep();
          setShowPenaltySelection(true);
        }
      }
    },
    [state, playBeep, isDisabled, isCompleted]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (isDisabled || isCompleted) return;
      e.preventDefault();
      if (isTouchActiveRef.current) {
        isTouchActiveRef.current = false;

        if (state === "holding") {
          setState("inspection");
          setInspectionTime(15);
        } else if (state === "ready") {
          setState("running");
          setTime(0);
          setCurrentPenalty("none");
          startTimeRef.current = Date.now();
          playBeep();
        }
      }
    },
    [state, playBeep, isDisabled, isCompleted]
  );

  // Handle penalty selection
  const handlePenalty = (penalty: "none" | "+2" | "DNF") => {
    setCurrentPenalty(penalty);
  };

  // Confirm and submit solve
  const handleConfirmSolve = () => {
    // Apply penalty
    onSolveComplete(finalTime, currentPenalty);

    // Reset everything for next solve
    setShowPenaltySelection(false);
    setIsCompleted(false);
    setState("idle");
    setTime(0);
    setLiveTime(0);
    setFinalTime(0);
    setCurrentPenalty("none");
  };

  // Format time
  const formatTime = (timeMs: number) => {
    if (timeMs === Infinity) return "DNF";
    const seconds = timeMs / 1000;
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return mins > 0 ? `${mins}:${secs.padStart(5, "0")}` : secs;
  };

  // Get display time based on state and penalty
  const getDisplayTime = () => {
    if (currentPenalty === "DNF") {
      return "DNF";
    } else if (currentPenalty === "+2") {
      return formatTime(time + 2000);
    } else {
      return formatTime(time);
    }
  };

  // Get timer color based on state
  const getTimerColor = () => {
    if (isDisabled) return "text-gray-400";

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
    if (isDisabled) return "Timer disabled - complete current solve first";

    if (isCompleted) {
      return "Select penalty and click OK to save solve";
    }

    switch (state) {
      case "idle":
        return "Hold SPACE or touch and hold timer, then release to start inspection";
      case "holding":
        return "Release to start inspection";
      case "inspection":
        return "Get ready... (Hold SPACE/touch for timer)";
      case "ready":
        return "Release to start";
      case "running":
        return "Solving... (any key or touch to stop)";
      case "stopped":
        return "Select penalty and click OK to save solve";
    }
  };

  return (
    <div className="timer-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement">
          Solve {solveNumber} of {totalSolves}
        </h3>
      </div>

      <div
        ref={timerContentRef}
        className={`text-center space-y-6 ${isDisabled || isCompleted ? "opacity-50 pointer-events-none" : ""}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          userSelect: "none",
          WebkitUserSelect: "none",
          touchAction: "none",
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
      </div>

      {/* Penalty Selection */}
      {state === "stopped" && showPenaltySelection && (
        <div className="space-y-4 mt-6">
          <div className="text-center">
            <p className="text-sm text-[var(--text-secondary)] font-inter mb-3">
              Select penalty for this solve:
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handlePenalty("+2");
              }}
              className={`px-6 py-2 text-sm rounded-lg font-semibold font-statement transition-all hover:scale-105 ${
                currentPenalty === "+2"
                  ? "bg-[var(--warning)] text-white ring-2 ring-yellow-300"
                  : "bg-[var(--surface-elevated)] text-[var(--text-primary)] hover:bg-[var(--border)]"
              }`}
            >
              +2 {currentPenalty === "+2" ? "✓" : ""}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handlePenalty("DNF");
              }}
              className={`px-6 py-2 text-sm rounded-lg font-semibold font-statement transition-all hover:scale-105 ${
                currentPenalty === "DNF"
                  ? "bg-[var(--error)] text-white ring-2 ring-red-300"
                  : "bg-[var(--surface-elevated)] text-[var(--text-primary)] hover:bg-[var(--border)]"
              }`}
            >
              DNF {currentPenalty === "DNF" ? "✓" : ""}
            </button>
          </div>

          {/* OK Button */}
          <div className="flex justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleConfirmSolve();
              }}
              className="px-8 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-lg rounded-lg font-bold font-statement transition-all hover:scale-105 shadow-lg"
            >
              OK - Save Solve
            </button>
          </div>
        </div>
      )}
    </div>
  );
}