"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Check, AlertCircle, RotateCcw } from "lucide-react";
import { useStackmatAudio } from "../timer/hooks/useStackmatAudio";

interface CompetitionStackmatTimerProps {
  onSolveComplete: (
    time: number,
    penalty: "none" | "+2" | "DNF",
    inspectionViolation: "+2" | "DNF" | null
  ) => void;
  inspectionEnabled?: boolean;
  isDisabled?: boolean;
  onStateChange?: (
    state: "idle" | "inspecting" | "running" | "stopped"
  ) => void;
}

export default function CompetitionStackmatTimer({
  onSolveComplete,
  inspectionEnabled = true,
  isDisabled = false,
  onStateChange,
}: CompetitionStackmatTimerProps) {
  const {
    isConnected,
    hasPermission,
    error,
    stackmatData,
    startListening,
    stopListening,
    reset: resetStackmat,
  } = useStackmatAudio();

  const [isListening, setIsListening] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectionTime, setInspectionTime] = useState(15);
  const [inspectionPenalty, setInspectionPenalty] = useState<
    "+2" | "DNF" | null
  >(null);
  const [penalty, setPenalty] = useState<"none" | "+2" | "DNF">("none");
  const [showPenaltyButtons, setShowPenaltyButtons] = useState(false);
  const [lastCompletedTime, setLastCompletedTime] = useState<number | null>(
    null
  );
  const [wasRunning, setWasRunning] = useState(false);

  const inspectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioContextRef.current = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
    }
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // Play beep sound
  const playBeep = useCallback(() => {
    if (!audioContextRef.current) return;

    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContextRef.current.currentTime + 0.1
      );

      oscillator.start();
      oscillator.stop(audioContextRef.current.currentTime + 0.1);
    } catch (e) {
      // Audio context may not be available
    }
  }, []);

  // Play alert sound
  const playAlert = useCallback(() => {
    if (!audioContextRef.current) return;

    try {
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

      oscillator.start();
      oscillator.stop(audioContextRef.current.currentTime + 0.2);
    } catch (e) {
      // Audio context may not be available
    }
  }, []);

  // Handle microphone toggle
  const handleMicToggle = async () => {
    if (isListening) {
      stopListening();
      setIsListening(false);
    } else {
      await startListening();
      setIsListening(true);
    }
  };

  // Start inspection
  const handleStartInspection = useCallback(() => {
    if (isDisabled || !isConnected) return;

    setIsInspecting(true);
    setInspectionTime(15);
    setInspectionPenalty(null);
    playBeep();

    inspectionIntervalRef.current = setInterval(() => {
      setInspectionTime((prev) => {
        const newTime = prev - 0.01;

        // Play alert at 8s and 3s
        if (Math.abs(newTime - 7) < 0.02) playAlert();
        if (Math.abs(newTime - 3) < 0.02) playAlert();

        if (newTime <= -2) {
          setInspectionPenalty("DNF");
          playAlert();
          return -2;
        }

        if (newTime <= 0 && prev > 0) {
          setInspectionPenalty("+2");
          playAlert();
        }

        return newTime;
      });
    }, 10);
  }, [isDisabled, isConnected, playBeep, playAlert]);

  // Stop inspection
  const handleStopInspection = useCallback(() => {
    setIsInspecting(false);
    if (inspectionIntervalRef.current) {
      clearInterval(inspectionIntervalRef.current);
      inspectionIntervalRef.current = null;
    }
  }, []);

  // Track stackmat state changes
  useEffect(() => {
    if (!isConnected) return;

    const currentState = stackmatData.state;

    // When timer starts running
    if (currentState === "running" && !wasRunning) {
      setWasRunning(true);
      handleStopInspection();
      onStateChange?.("running");
    }

    // When timer stops
    if (currentState === "stopped" && wasRunning && stackmatData.time > 0) {
      setWasRunning(false);
      setLastCompletedTime(stackmatData.time);
      setShowPenaltyButtons(true);
      onStateChange?.("stopped");
    }

    // When timer is reset
    if (stackmatData.isReset && !stackmatData.time) {
      setWasRunning(false);
      onStateChange?.("idle");
    }
  }, [
    stackmatData,
    isConnected,
    wasRunning,
    handleStopInspection,
    onStateChange,
  ]);

  // Notify parent of state changes
  useEffect(() => {
    if (isInspecting) {
      onStateChange?.("inspecting");
    } else if (!isConnected && !showPenaltyButtons) {
      onStateChange?.("idle");
    }
  }, [isInspecting, isConnected, showPenaltyButtons, onStateChange]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (inspectionIntervalRef.current) {
        clearInterval(inspectionIntervalRef.current);
      }
    };
  }, []);

  // Handle penalty selection and submit
  const handlePenaltySelect = (selectedPenalty: "none" | "+2" | "DNF") => {
    if (lastCompletedTime === null) return;

    onSolveComplete(lastCompletedTime, selectedPenalty, inspectionPenalty);

    // Reset for next solve
    setShowPenaltyButtons(false);
    setLastCompletedTime(null);
    setPenalty("none");
    setInspectionPenalty(null);
    setInspectionTime(15);
    resetStackmat();
    playBeep();
  };

  // Format time for display
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

  // Get timer color based on state
  const getTimerColor = () => {
    if (showPenaltyButtons) return "text-[var(--primary)]";
    if (stackmatData.state === "running") return "text-[var(--timer-running)]";
    if (stackmatData.state === "ready") return "text-[var(--timer-ready)]";
    if (stackmatData.state === "stopped") return "text-[var(--success)]";
    if (isInspecting) {
      if (inspectionTime <= 3) return "text-[var(--error)]";
      if (inspectionTime <= 8) return "text-[var(--warning)]";
      return "text-[var(--timer-ready)]";
    }
    return "text-[var(--text-muted)]";
  };

  // Get status text
  const getStatusText = () => {
    if (!isListening) return "Microphone off";
    if (error) return error;
    if (!isConnected) return "Waiting for Stackmat signal...";

    switch (stackmatData.state) {
      case "ready":
        return "Ready - Hands on timer";
      case "running":
        return "Timer running...";
      case "stopped":
        return "Timer stopped";
      case "leftHand":
        return "Left hand on timer";
      case "rightHand":
        return "Right hand on timer";
      default:
        return "Stackmat connected";
    }
  };

  return (
    <div
      className={`timer-card relative overflow-hidden ${
        isDisabled ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      {/* Connection Status */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <button
            onClick={handleMicToggle}
            className={`p-3 rounded-lg transition-colors ${
              isListening
                ? isConnected
                  ? "bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/30"
                  : "bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/30"
                : "bg-[var(--surface-elevated)] text-[var(--text-muted)] border border-[var(--border)]"
            }`}
            title={isListening ? "Disconnect microphone" : "Connect microphone"}
          >
            {isListening ? (
              <Mic className="w-5 h-5" />
            ) : (
              <MicOff className="w-5 h-5" />
            )}
          </button>
          <div>
            <div className="text-sm font-medium text-[var(--text-primary)]">
              {isListening
                ? isConnected
                  ? "Stackmat Connected"
                  : "Listening..."
                : "Stackmat Timer"}
            </div>
            <div className="text-xs text-[var(--text-muted)]">
              {getStatusText()}
            </div>
          </div>
        </div>

        {isConnected && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
            <span className="text-xs text-[var(--success)]">Connected</span>
          </div>
        )}
      </div>

      {/* Inspection Display */}
      {isInspecting && (
        <div className="text-center py-6">
          <div
            className={`text-6xl font-bold font-mono mb-2 transition-colors ${getTimerColor()}`}
          >
            {inspectionTime <= 0
              ? inspectionTime <= -2
                ? "DNF"
                : "+2"
              : inspectionTime.toFixed(2)}
          </div>
          <div className="text-sm text-[var(--text-muted)] mb-4">
            Inspection - Start timer to begin solve
          </div>
          {inspectionPenalty && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--error)]/10 border border-[var(--error)]/30">
              <AlertCircle className="w-4 h-4 text-[var(--error)]" />
              <span className="text-sm font-medium text-[var(--error)]">
                {inspectionPenalty} Inspection Penalty
              </span>
            </div>
          )}
          <div className="mt-4">
            <button
              onClick={handleStopInspection}
              className="px-4 py-2 bg-[var(--surface-elevated)] hover:bg-[var(--border)] text-[var(--text-primary)] rounded-lg font-medium transition-colors border border-[var(--border)]"
            >
              Cancel Inspection
            </button>
          </div>
        </div>
      )}

      {/* Timer Display */}
      {!isInspecting && (
        <div className="text-center py-6 sm:py-8">
          <div
            className={`font-mono timer-text font-bold tabular-nums transition-colors duration-200 ${getTimerColor()}`}
          >
            {formatTime(
              showPenaltyButtons && lastCompletedTime
                ? lastCompletedTime
                : stackmatData.time
            )}
          </div>

          {/* Penalty buttons after solve completion */}
          {showPenaltyButtons && lastCompletedTime !== null && (
            <div className="mt-6 space-y-4">
              {inspectionPenalty && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--warning)]/10 border border-[var(--warning)]/30 mb-4">
                  <span className="text-sm font-medium text-[var(--warning)]">
                    {inspectionPenalty} Inspection Penalty Applied
                  </span>
                </div>
              )}
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Confirm your solve result
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                <button
                  onClick={() => handlePenaltySelect("none")}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--success)] text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  <Check className="w-4 h-4" />
                  OK
                </button>
                <button
                  onClick={() => handlePenaltySelect("+2")}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--warning)] text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  +2
                </button>
                <button
                  onClick={() => handlePenaltySelect("DNF")}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--error)] text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  DNF
                </button>
              </div>
            </div>
          )}

          {/* Inspection button when not solving */}
          {!showPenaltyButtons && isConnected && inspectionEnabled && (
            <div className="mt-6">
              <button
                onClick={handleStartInspection}
                className="px-6 py-3 bg-[var(--surface-elevated)] hover:bg-[var(--border)] text-[var(--text-primary)] font-medium rounded-lg transition-colors border border-[var(--border)]"
              >
                Start Inspection
              </button>
            </div>
          )}

          {/* Instructions when not connected */}
          {!isListening && (
            <div className="mt-6 text-sm text-[var(--text-muted)]">
              <p>Click the microphone button to connect your Stackmat timer</p>
            </div>
          )}

          {isListening && !isConnected && (
            <div className="mt-6 text-sm text-[var(--text-muted)] space-y-2">
              <p>Plug your Stackmat timer into the microphone input</p>
              <p className="text-xs">
                Make sure your audio input is set correctly
              </p>
            </div>
          )}
        </div>
      )}

      {/* Reset button */}
      {isConnected && !showPenaltyButtons && stackmatData.time > 0 && (
        <div className="border-t border-[var(--border)] pt-4 mt-4">
          <button
            onClick={() => {
              resetStackmat();
              setInspectionTime(15);
              setInspectionPenalty(null);
            }}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-[var(--surface-elevated)] hover:bg-[var(--border)] text-[var(--text-secondary)] rounded-lg font-medium transition-colors border border-[var(--border)]"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Display
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-4 p-3 bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-[var(--error)]">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}
