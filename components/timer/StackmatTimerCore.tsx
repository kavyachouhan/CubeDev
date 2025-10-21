"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import { Mic, MicOff, AlertCircle, Info, Wifi } from "lucide-react";
import { useStackmatAudio } from "./hooks/useStackmatAudio";

interface StackmatTimerCoreProps {
  onSolveComplete: (time: number, penalty: "none" | "+2" | "DNF") => void;
  inspectionEnabled: boolean;
  playBeep: () => void;
  playAlert: () => void;
  children?: ReactNode;
}

export default function StackmatTimerCore({
  onSolveComplete,
  inspectionEnabled,
  playBeep,
  playAlert,
  children,
}: StackmatTimerCoreProps) {
  const {
    isConnected,
    hasPermission,
    error,
    stackmatData,
    startListening,
    stopListening,
    reset,
  } = useStackmatAudio();

  const [isActive, setIsActive] = useState(false);
  const [currentPenalty, setCurrentPenalty] = useState<"none" | "+2" | "DNF">(
    "none"
  );
  const [showPenaltyButtons, setShowPenaltyButtons] = useState(false);
  const [inspectionTime, setInspectionTime] = useState(15);
  const [isInspecting, setIsInspecting] = useState(false);
  const [solveStartTime, setSolveStartTime] = useState<number>(0);
  const [displayTime, setDisplayTime] = useState<number>(0);

  const inspectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastStateRef = useRef<string>("idle");
  const solveCompletedRef = useRef<boolean>(false);

  // Start inspection manually
  const handleStartInspection = () => {
    if (!isActive) return; // Cannot start if not active

    setIsInspecting(true);
    setInspectionTime(15);
    playBeep();

    inspectionIntervalRef.current = setInterval(() => {
      setInspectionTime((prev) => {
        const newTime = prev - 0.01;

        // Play alert at 8s and 3s
        if (Math.abs(newTime - 7) < 0.02 || Math.abs(newTime - 3) < 0.02) {
          playAlert();
        }

        if (newTime <= 0) {
          setIsInspecting(false);
          playAlert();
          return 15;
        }
        return newTime;
      });
    }, 10);
  };

  // Stop inspection
  const handleStopInspection = () => {
    setIsInspecting(false);
    if (inspectionIntervalRef.current) {
      clearInterval(inspectionIntervalRef.current);
      inspectionIntervalRef.current = null;
    }
    setInspectionTime(15);
  };

  // Format time
  const formatTime = (timeMs: number) => {
    if (timeMs === Infinity) return "DNF";
    const seconds = timeMs / 1000;
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return mins > 0 ? `${mins}:${secs.padStart(5, "0")}` : secs;
  };

  // Handle inspection
  useEffect(() => {
    if (isInspecting) {
      inspectionIntervalRef.current = setInterval(() => {
        setInspectionTime((prev) => {
          const newTime = prev - 0.01;

          // Play alert at 8s and 3s
          if (Math.abs(newTime - 7) < 0.02 || Math.abs(newTime - 3) < 0.02) {
            playAlert();
          }

          if (newTime <= 0) {
            setIsInspecting(false);
            playAlert();
            return 15;
          }
          return newTime;
        });
      }, 10);
    } else {
      if (inspectionIntervalRef.current) {
        clearInterval(inspectionIntervalRef.current);
        inspectionIntervalRef.current = null;
      }
    }

    return () => {
      if (inspectionIntervalRef.current) {
        clearInterval(inspectionIntervalRef.current);
      }
    };
  }, [isInspecting, playAlert]);

  // Keyboard handler for spacebar inspection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle spacebar for starting inspection
      if (e.code === "Space") {
        e.preventDefault();
        if (inspectionEnabled && !isInspecting && isActive) {
          handleStartInspection();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inspectionEnabled, isInspecting, isActive]);

  // Handle Stackmat state changes
  useEffect(() => {
    if (!isConnected || !isActive) return;

    const currentState = stackmatData.state;

    // State machine for Stackmat timer
    if (lastStateRef.current === "idle" && currentState === "ready") {
      // Hands placed on timer
      if (inspectionEnabled && !isInspecting && solveStartTime === 0) {
        // Start inspection
        setIsInspecting(true);
        setInspectionTime(15);
        playBeep();
      }
    } else if (lastStateRef.current === "ready" && currentState === "running") {
      // Timer started - only if we're not already timing
      if (solveStartTime === 0 && !solveCompletedRef.current) {
        if (isInspecting) {
          setIsInspecting(false);
          if (inspectionIntervalRef.current) {
            clearInterval(inspectionIntervalRef.current);
            inspectionIntervalRef.current = null;
          }
        }
        setSolveStartTime(Date.now());
        setDisplayTime(0);
        setCurrentPenalty("none");
        setShowPenaltyButtons(false);
        solveCompletedRef.current = false;
        playBeep();
      }
    } else if (currentState === "running") {
      // Update display time while running - only if we have a valid start time
      if (solveStartTime > 0 && !solveCompletedRef.current) {
        setDisplayTime(Date.now() - solveStartTime);
      }
    } else if (
      lastStateRef.current === "running" &&
      currentState === "stopped"
    ) {
      // Timer stopped - only process if we haven't already completed this solve
      if (!solveCompletedRef.current && solveStartTime > 0) {
        const finalTime = Date.now() - solveStartTime;
        // Only accept times greater than 100ms to avoid false stops
        if (finalTime > 100) {
          // Complete the solve
          setDisplayTime(finalTime);
          setShowPenaltyButtons(true);
          solveCompletedRef.current = true;
          playBeep();
        } else {
          console.warn(
            "Stackmat timer stopped too quickly, ignoring solve:",
            finalTime
          );
          // Reset to ready state
          setSolveStartTime(0);
          setDisplayTime(0);
        }
      }
    } else if (currentState === "idle" && stackmatData.isReset) {
      // Timer reset, prepare for next solve
      if (solveCompletedRef.current && displayTime > 0) {
        // Reset for next solve
        setSolveStartTime(0);
        setShowPenaltyButtons(false);
        solveCompletedRef.current = false;
      }
    }

    lastStateRef.current = currentState;
  }, [
    stackmatData,
    isConnected,
    isActive,
    inspectionEnabled,
    isInspecting,
    solveStartTime,
    displayTime,
    playBeep,
    playAlert,
  ]);

  // Handle penalty button clicks
  const handlePenalty = (penalty: "none" | "+2" | "DNF") => {
    try {
      setCurrentPenalty(penalty);

      // Finalize solve based on penalty
      let finalTime = displayTime;
      if (penalty === "DNF") {
        finalTime = 0; // Will be treated as DNF in the system
      }
      // Note: For +2, we pass the raw time and penalty separately
      // The parent handler will calculate finalTime = displayTime + 2000

      onSolveComplete(displayTime, penalty);
      setShowPenaltyButtons(false);

      // Reset for next solve
      setTimeout(() => {
        reset();
        setSolveStartTime(0);
        setDisplayTime(0);
        setCurrentPenalty("none");
        solveCompletedRef.current = false;
      }, 500);
    } catch (error) {
      console.error("Error handling penalty:", error);
      // Still try to reset state
      setShowPenaltyButtons(false);
      setTimeout(() => {
        reset();
        setSolveStartTime(0);
        setDisplayTime(0);
        setCurrentPenalty("none");
        solveCompletedRef.current = false;
      }, 1000); // Longer delay on error
    }
  };

  // Toggle microphone
  const toggleMicrophone = async () => {
    if (isActive) {
      stopListening();
      setIsActive(false);
      setIsInspecting(false);
      if (inspectionIntervalRef.current) {
        clearInterval(inspectionIntervalRef.current);
      }
    } else {
      await startListening();
      setIsActive(true);
    }
  };

  // Get display time with penalty
  const getDisplayTime = () => {
    if (currentPenalty === "DNF") {
      return "DNF";
    } else if (currentPenalty === "+2") {
      return formatTime(displayTime + 2000);
    } else {
      return formatTime(displayTime);
    }
  };

  // Get status text
  const getStatusText = () => {
    if (!isActive) {
      return "Click the microphone button to connect your Stackmat timer";
    }
    if (error) {
      return error;
    }
    if (!isConnected) {
      return "Listening for Stackmat timer...";
    }
    if (isInspecting) {
      return "Inspection time - Place hands on timer when ready";
    }
    if (stackmatData.state === "ready") {
      return "Hands detected - Release to start";
    }
    if (stackmatData.state === "running") {
      return "Solving...";
    }
    if (stackmatData.state === "stopped" && showPenaltyButtons) {
      return "Apply penalty if needed";
    }
    return "Place hands on timer to begin";
  };

  // Get timer color based on state
  const getTimerColor = () => {
    if (isInspecting) {
      if (inspectionTime <= 3) return "text-[var(--timer-running)]";
      if (inspectionTime <= 8) return "text-[var(--warning)]";
      return "text-[var(--timer-ready)]";
    }
    if (stackmatData.state === "ready") return "text-[var(--timer-ready)]";
    if (stackmatData.state === "running") return "text-[var(--timer-running)]";
    if (stackmatData.state === "stopped") return "text-[var(--primary)]";
    return "text-[var(--text-muted)]";
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-center justify-between p-3 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isConnected
                ? "bg-[var(--success)]/20 text-[var(--success)]"
                : "bg-[var(--text-muted)]/20 text-[var(--text-muted)]"
            }`}
          >
            {isConnected ? (
              <Wifi className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="text-sm font-medium text-[var(--text-primary)]">
              {isConnected ? "Stackmat Connected" : "Stackmat Disconnected"}
            </div>
            <div className="text-xs text-[var(--text-muted)]">
              {hasPermission
                ? isConnected
                  ? "Receiving timer signals"
                  : "Waiting for timer signal"
                : "Microphone permission required"}
            </div>
          </div>
        </div>
        <button
          onClick={toggleMicrophone}
          className={`p-2 rounded-lg font-medium transition-colors ${
            isActive
              ? "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
              : "bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--border)] border border-[var(--border)]"
          }`}
        >
          {isActive ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-[var(--error)] flex-shrink-0 mt-0.5" />
          <div className="text-sm text-[var(--error)]">{error}</div>
        </div>
      )}

      {/* Inspection Button */}
      {inspectionEnabled &&
        !isInspecting &&
        isActive &&
        !showPenaltyButtons && (
          <div className="flex justify-center">
            <button
              onClick={handleStartInspection}
              className="flex items-center justify-center gap-2 px-4 py-2 sm:py-3 bg-[var(--surface-elevated)] hover:bg-[var(--border)] text-[var(--text-primary)] rounded-lg font-medium transition-colors border border-[var(--border)]"
            >
              <span className="text-sm sm:text-base">
                Start Inspection (Space)
              </span>
            </button>
          </div>
        )}

      {/* Inspection Display */}
      {isInspecting && (
        <div className="text-center p-4 sm:p-6 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]">
          <div
            className={`text-5xl sm:text-6xl font-bold font-mono mb-2 transition-colors ${
              inspectionTime <= 3
                ? "text-red-400"
                : inspectionTime <= 8
                  ? "text-yellow-400"
                  : "text-green-400"
            }`}
          >
            {inspectionTime.toFixed(2)}
          </div>
          <div className="text-sm text-[var(--text-muted)] mb-4">
            Place hands on timer when ready
          </div>
          <button
            onClick={handleStopInspection}
            className="px-4 py-2 bg-[var(--error)] hover:bg-[var(--error)]/80 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
          >
            Stop Inspection
          </button>
        </div>
      )}

      {/* Timer Display */}
      {!isInspecting && (
        <div className="text-center space-y-4 min-h-[280px] sm:min-h-[320px] md:min-h-[360px] flex flex-col justify-center">
          {/* Main Timer Display */}
          <div
            className={`font-bold timer-text ${getTimerColor()} transition-all duration-300 font-mono select-none py-4`}
          >
            {getDisplayTime()}
          </div>

          {children}

          {/* Penalty Buttons */}
          {showPenaltyButtons && (
            <div className="space-y-2">
              <div className="text-sm text-[var(--text-muted)] mb-2">
                Apply penalty if needed
              </div>
              <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
                <button
                  onClick={() => handlePenalty("none")}
                  className="px-4 sm:px-6 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
                >
                  OK
                </button>
                <button
                  onClick={() => handlePenalty("+2")}
                  className="px-4 sm:px-6 py-2 bg-[var(--warning)] hover:bg-[var(--warning)]/80 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
                >
                  +2
                </button>
                <button
                  onClick={() => handlePenalty("DNF")}
                  className="px-4 sm:px-6 py-2 bg-[var(--error)] hover:bg-[var(--error)]/80 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
                >
                  DNF
                </button>
              </div>
            </div>
          )}

          {/* Penalty Indicator */}
          {currentPenalty !== "none" && !showPenaltyButtons && (
            <div
              className={`text-xs font-semibold px-2 py-1 rounded-full transition-all duration-300 ${
                currentPenalty === "+2"
                  ? "bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/30"
                  : "bg-[var(--error)]/10 text-[var(--error)] border border-[var(--error)]/30"
              }`}
            >
              {currentPenalty === "+2" ? "+2 Penalty Applied" : "DNF Applied"}
            </div>
          )}

          {/* Status Text */}
          <div className="text-sm text-[var(--text-secondary)] font-inter select-none">
            {getStatusText()}
          </div>
        </div>
      )}

      {/* Instructions */}
      {isActive && !error && !isInspecting && (
        <div className="p-3 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-[var(--primary)] flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-[var(--text-muted)] space-y-1">
              <div className="font-medium text-[var(--text-primary)]">
                Stackmat Timer Instructions:
              </div>
              <div>
                1. Connect your Stackmat timer to your computer's microphone
                input
              </div>
              <div>
                2.{" "}
                {inspectionEnabled
                  ? "Click 'Start Inspection' or press Space to begin inspection"
                  : "Place hands on timer to prepare"}
              </div>
              <div>
                3.{" "}
                {inspectionEnabled
                  ? "Place hands on timer after inspection starts"
                  : "Release hands to start solving"}
              </div>
              <div>4. Stop timer with hands, then apply penalty if needed</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}