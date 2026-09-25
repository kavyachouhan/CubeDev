"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import { Mic, MicOff, AlertCircle, Info, Wifi } from "lucide-react";
import { useStackmatAudio } from "./hooks/useStackmatAudio";
import ConfettiCelebration from "./ConfettiCelebration";
import { formatTime as formatMs } from "@/lib/stats-utils";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CardIcon } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";

interface StackmatTimerCoreProps {
  onSolveComplete: (time: number, penalty: "none" | "+2" | "DNF") => void;
  inspectionEnabled: boolean;
  playBeep: () => void;
  playAlert: () => void;
  children?: ReactNode;
  showCelebration?: boolean;
  celebrationType?: "single" | "ao5" | "ao12" | "ao100";
  celebrationTime?: string;
  onCelebrationComplete?: () => void;
}

export default function StackmatTimerCore({
  onSolveComplete,
  inspectionEnabled,
  playBeep,
  playAlert,
  children,
  showCelebration = false,
  celebrationType = "single",
  celebrationTime = "",
  onCelebrationComplete,
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
  const formatTime = (timeMs: number) => formatMs(timeMs);

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
      if (inspectionTime <= 3) return "text-(--timer-running)";
      if (inspectionTime <= 8) return "text-(--warning)";
      return "text-(--timer-ready)";
    }
    if (stackmatData.state === "ready") return "text-(--timer-ready)";
    if (stackmatData.state === "running") return "text-(--timer-running)";
    if (stackmatData.state === "stopped") return "text-(--primary)";
    return "text-(--text-muted)";
  };

  return (
    <div className="relative space-y-4">
      {/* Confetti Celebration */}
      <ConfettiCelebration
        show={showCelebration}
        achievementType={celebrationType}
        timeValue={celebrationTime}
        onComplete={onCelebrationComplete}
      />

      {/* Connection Status */}
      <div className="flex items-center justify-between gap-3 p-3 bg-(--surface-elevated) rounded-(--radius-panel) border border-(--border)">
        <div className="flex items-center gap-3 min-w-0">
          <CardIcon tone={isConnected ? "success" : "neutral"}>
            {isConnected ? <Wifi /> : <AlertCircle />}
          </CardIcon>
          <div className="min-w-0" role="status">
            <p className="type-label">
              {isConnected ? "Stackmat connected" : "Stackmat disconnected"}
            </p>
            <p className="type-caption">
              {hasPermission
                ? isConnected
                  ? "Receiving timer signals"
                  : "Waiting for timer signal"
                : "Microphone permission required"}
            </p>
          </div>
        </div>
        <IconButton
          variant={isActive ? "primary" : "subtle"}
          pressed={isActive}
          aria-label={isActive ? "Stop listening to microphone" : "Listen to microphone"}
          icon={isActive ? <MicOff /> : <Mic />}
          onClick={toggleMicrophone}
        />
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {inspectionEnabled &&
        !isInspecting &&
        isActive &&
        !showPenaltyButtons && (
          <div className="flex justify-center">
            <Button variant="secondary" onClick={handleStartInspection}>
              Start Inspection (Space)
            </Button>
          </div>
        )}

      {isInspecting && (
        <div className="text-center p-4 sm:p-6 bg-(--surface-elevated) rounded-(--radius-panel) border border-(--border)">
          <div
            role="timer"
            aria-live="off"
            className={`text-5xl sm:text-6xl font-bold type-time mb-2 transition-colors ${
              inspectionTime <= 3
                ? "text-(--error)"
                : inspectionTime <= 8
                  ? "text-(--warning)"
                  : "text-(--success)"
            }`}
          >
            {inspectionTime.toFixed(2)}
          </div>
          <p className="type-caption mb-4">Place hands on timer when ready</p>
          <Button variant="danger" onClick={handleStopInspection}>
            Stop Inspection
          </Button>
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
            <div className="space-y-2 max-w-md mx-auto w-full">
              <p className="type-caption">Apply penalty if needed</p>
              <div className="grid grid-cols-3 gap-2">
                <Button size="lg" onClick={() => handlePenalty("none")}>
                  OK
                </Button>
                <button
                  type="button"
                  onClick={() => handlePenalty("+2")}
                  className="btn btn-lg text-(--on-primary) bg-(--penalty-plus2) hover:bg-(--penalty-plus2-hover)"
                >
                  +2
                </button>
                <button
                  type="button"
                  onClick={() => handlePenalty("DNF")}
                  className="btn btn-lg text-(--on-primary) bg-(--penalty-dnf) hover:bg-(--penalty-dnf-hover)"
                >
                  DNF
                </button>
              </div>
            </div>
          )}

          {currentPenalty !== "none" && !showPenaltyButtons && (
            <Badge
              tone={currentPenalty === "+2" ? "warning" : "danger"}
              shape="pill"
              size="md"
              className="self-center"
            >
              {currentPenalty === "+2" ? "+2 penalty applied" : "DNF applied"}
            </Badge>
          )}

          <p role="status" className="text-sm text-(--text-secondary) font-inter select-none">
            {getStatusText()}
          </p>
        </div>
      )}

      {isActive && !error && !isInspecting && (
        <Alert tone="info" title="Using a Stackmat timer" icon={<Info />}>
          <ol className="list-decimal pl-4 space-y-0.5 text-xs sm:text-sm">
            <li>Connect your Stackmat timer to your computer&apos;s microphone input</li>
            <li>
              {inspectionEnabled
                ? "Click Start Inspection or press Space to begin inspection"
                : "Place hands on timer to prepare"}
            </li>
            <li>
              {inspectionEnabled
                ? "Place hands on timer after inspection starts"
                : "Release hands to start solving"}
            </li>
            <li>Stop timer with hands, then apply penalty if needed</li>
          </ol>
        </Alert>
      )}
    </div>
  );
}