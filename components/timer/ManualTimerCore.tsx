"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import { Plus } from "lucide-react";
import ConfettiCelebration from "./ConfettiCelebration";

interface ManualTimerCoreProps {
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

export default function ManualTimerCore({
  onSolveComplete,
  inspectionEnabled,
  playBeep,
  playAlert,
  children,
  showCelebration = false,
  celebrationType = "single",
  celebrationTime = "",
  onCelebrationComplete,
}: ManualTimerCoreProps) {
  const [timeInput, setTimeInput] = useState("");
  const [penalty, setPenalty] = useState<"none" | "+2" | "DNF">("none");
  const [error, setError] = useState("");
  const [parsedTime, setParsedTime] = useState<number | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectionTime, setInspectionTime] = useState(15);
  const inspectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start inspection
  const handleStartInspection = () => {
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

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (inspectionIntervalRef.current) {
        clearInterval(inspectionIntervalRef.current);
      }
    };
  }, []);

  // Keyboard handler for spacebar inspection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Start inspection on spacebar if enabled
      if (e.code === "Space" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        if (inspectionEnabled && !isInspecting) {
          handleStartInspection();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inspectionEnabled, isInspecting]);

  // Parse time input
  const parseTimeInput = (
    input: string
  ): {
    time: number | null;
    penalty: "none" | "+2" | "DNF";
    error: string;
    isDnfOnly: boolean;
  } => {
    if (!input.trim()) {
      return {
        time: null,
        penalty: "none",
        error: "Please enter a time",
        isDnfOnly: false,
      };
    }

    let cleanInput = input.trim().toLowerCase();
    let detectedPenalty: "none" | "+2" | "DNF" = "none";

    // Check for DNF only input
    if (cleanInput === "dnf" || cleanInput === "(dnf)") {
      return { time: null, penalty: "DNF", error: "", isDnfOnly: true };
    }

    // Check for +2 penalty in various formats
    if (cleanInput.includes("+2") || cleanInput.includes("+ 2")) {
      detectedPenalty = "+2";
      cleanInput = cleanInput.replace(/\+\s*2/g, "").trim();
    }

    // Check for DNF penalty in various formats
    if (cleanInput.includes("(dnf)") || cleanInput.includes("dnf")) {
      detectedPenalty = "DNF";
      cleanInput = cleanInput.replace(/\(dnf\)|dnf/g, "").trim();
    }

    // Remove any surrounding parentheses or extra characters
    cleanInput = cleanInput.replace(/[()]/g, "").trim();

    // If nothing left after removing DNF, it was DNF only
    if (!cleanInput) {
      return { time: null, penalty: "DNF", error: "", isDnfOnly: true };
    }

    // Handle format: M:SS.mm (e.g., 1:23.45)
    if (cleanInput.includes(":")) {
      const parts = cleanInput.split(":");
      if (parts.length !== 2) {
        return {
          time: null,
          penalty: detectedPenalty,
          error: "Invalid time format. Use MM:SS.mm",
          isDnfOnly: false,
        };
      }

      const minutes = parseFloat(parts[0]);
      let secondsPart = parts[1];

      // Smart decimal handling for seconds part after colon
      if (!secondsPart.includes(".")) {
        if (secondsPart.length === 1) {
          secondsPart = secondsPart + ".00";
        } else if (secondsPart.length === 2) {
          secondsPart = secondsPart + ".00";
        } else if (secondsPart.length === 3) {
          secondsPart = secondsPart.slice(0, 2) + "." + secondsPart.slice(2);
        } else if (secondsPart.length === 4) {
          secondsPart = secondsPart.slice(0, 2) + "." + secondsPart.slice(2);
        }
      }

      const seconds = parseFloat(secondsPart);

      if (
        isNaN(minutes) ||
        isNaN(seconds) ||
        minutes < 0 ||
        seconds < 0 ||
        seconds >= 60
      ) {
        return {
          time: null,
          penalty: detectedPenalty,
          error: "Invalid time values",
          isDnfOnly: false,
        };
      }

      const timeMs = (minutes * 60 + seconds) * 1000;
      return {
        time: timeMs,
        penalty: detectedPenalty,
        error: "",
        isDnfOnly: false,
      };
    }

    // Handle format: SS.mm (e.g., 12.34) or SS (e.g., 12) or SSMM (e.g., 1234)
    if (!cleanInput.includes(".")) {
      const digitsOnly = cleanInput.replace(/[^\d]/g, "");

      if (digitsOnly.length === 1) {
        cleanInput = digitsOnly + ".00";
      } else if (digitsOnly.length === 2) {
        cleanInput = digitsOnly + ".00";
      } else if (digitsOnly.length === 3) {
        cleanInput = digitsOnly.slice(0, 1) + "." + digitsOnly.slice(1);
      } else if (digitsOnly.length === 4) {
        cleanInput = digitsOnly.slice(0, 2) + "." + digitsOnly.slice(2);
      } else if (digitsOnly.length === 5) {
        const mins = digitsOnly.slice(0, 1);
        const secs = digitsOnly.slice(1, 3);
        const ms = digitsOnly.slice(3);
        const minutes = parseFloat(mins);
        const seconds = parseFloat(secs + "." + ms);

        if (
          isNaN(minutes) ||
          isNaN(seconds) ||
          minutes < 0 ||
          seconds < 0 ||
          seconds >= 60
        ) {
          return {
            time: null,
            penalty: detectedPenalty,
            error: "Invalid time values",
            isDnfOnly: false,
          };
        }

        const timeMs = (minutes * 60 + seconds) * 1000;
        return {
          time: timeMs,
          penalty: detectedPenalty,
          error: "",
          isDnfOnly: false,
        };
      } else if (digitsOnly.length === 6) {
        const mins = digitsOnly.slice(0, 2);
        const secs = digitsOnly.slice(2, 4);
        const ms = digitsOnly.slice(4);
        const minutes = parseFloat(mins);
        const seconds = parseFloat(secs + "." + ms);

        if (
          isNaN(minutes) ||
          isNaN(seconds) ||
          minutes < 0 ||
          seconds < 0 ||
          seconds >= 60
        ) {
          return {
            time: null,
            penalty: detectedPenalty,
            error: "Invalid time values",
            isDnfOnly: false,
          };
        }

        const timeMs = (minutes * 60 + seconds) * 1000;
        return {
          time: timeMs,
          penalty: detectedPenalty,
          error: "",
          isDnfOnly: false,
        };
      } else if (digitsOnly.length >= 7) {
        const ms = digitsOnly.slice(-2);
        const secs = digitsOnly.slice(-4, -2);
        const mins = digitsOnly.slice(0, -4);
        const minutes = parseFloat(mins);
        const seconds = parseFloat(secs + "." + ms);

        if (
          isNaN(minutes) ||
          isNaN(seconds) ||
          minutes < 0 ||
          seconds < 0 ||
          seconds >= 60
        ) {
          return {
            time: null,
            penalty: detectedPenalty,
            error: "Invalid time values",
            isDnfOnly: false,
          };
        }

        const timeMs = (minutes * 60 + seconds) * 1000;
        return {
          time: timeMs,
          penalty: detectedPenalty,
          error: "",
          isDnfOnly: false,
        };
      }
    }

    const seconds = parseFloat(cleanInput);
    if (isNaN(seconds) || seconds < 0) {
      return {
        time: null,
        penalty: detectedPenalty,
        error: "Invalid time format. Use SS.mm or MM:SS.mm",
        isDnfOnly: false,
      };
    }

    const timeMs = seconds * 1000;
    return {
      time: timeMs,
      penalty: detectedPenalty,
      error: "",
      isDnfOnly: false,
    };
  };

  // Format time for display
  const formatTimeDisplay = (
    timeMs: number,
    penalty: "none" | "+2" | "DNF"
  ): string => {
    if (penalty === "DNF" || timeMs === Infinity || timeMs === 0) return "DNF";

    const seconds = timeMs / 1000;
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    const formatted = mins > 0 ? `${mins}:${secs.padStart(5, "0")}` : secs;

    return penalty === "+2" ? `${formatted}+` : formatted;
  };

  // Handle input change
  const handleInputChange = (value: string) => {
    setTimeInput(value);
    const result = parseTimeInput(value);

    if (result.error) {
      setError(result.error);
      setParsedTime(null);
    } else {
      setError("");
      if (result.isDnfOnly) {
        setParsedTime(0); // Use 0 to represent DNF-only state
        setPenalty("DNF");
      } else {
        setParsedTime(result.time);
        if (result.penalty !== "none") {
          setPenalty(result.penalty);
        }
      }
    }
  };

  // Handle submit
  const handleSubmit = () => {
    try {
      handleStopInspection(); // Stop inspection if running

      const result = parseTimeInput(timeInput);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.isDnfOnly) {
        // For DNF-only input, use 0 as the time value
        onSolveComplete(0, "DNF");
        setTimeInput("");
        setPenalty("none");
        setError("");
        setParsedTime(null);
        playBeep();
        return;
      }

      if (result.time === null || result.time === 0) {
        setError("Invalid time");
        return;
      }

      const finalPenalty = result.penalty !== "none" ? result.penalty : penalty;
      onSolveComplete(result.time, finalPenalty);

      // Reset form
      setTimeInput("");
      setPenalty("none");
      setError("");
      setParsedTime(null);
      playBeep();
    } catch (error) {
      console.error("Error submitting manual time:", error);
      setError("Failed to submit time. Please try again.");
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      handleSubmit();
    } else if (e.key === " " || e.code === "Space") {
      // Prevent spacebar from triggering timer
      e.stopPropagation();
    } else if (e.key === "Escape") {
      e.stopPropagation();
    }
  };

  // Get final time with penalty
  const getFinalTime = (): number => {
    if (parsedTime === null) return 0;
    // If penalty is DNF or parsedTime is 0 (DNF-only input), return Infinity
    if (penalty === "DNF" || parsedTime === 0) return Infinity;
    if (penalty === "+2") return parsedTime + 2000;
    return parsedTime;
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

      {/* Inspection Display */}
      {isInspecting && (
        <div className="text-center p-6 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]">
          <div
            className={`text-6xl font-bold font-mono mb-2 transition-colors ${
              inspectionTime <= 3
                ? "text-red-400"
                : inspectionTime <= 8
                  ? "text-yellow-400"
                  : "text-green-400"
            }`}
          >
            {inspectionTime.toFixed(2)}
          </div>
          <div className="text-sm text-[var(--text-muted)]">
            Inspection time remaining
          </div>
          <button
            onClick={handleStopInspection}
            className="mt-4 px-4 py-2 bg-[var(--error)] hover:bg-[var(--error)]/80 text-white rounded-lg font-medium transition-colors"
          >
            Stop Inspection
          </button>
        </div>
      )}

      {/* Manual Entry Form */}
      {!isInspecting && (
        <div className="space-y-4">
          {/* Time Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Enter Time
            </label>
            <input
              type="text"
              value={timeInput}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., 12.34 or 1:23.45 or DNF"
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg font-mono bg-[var(--background)] border-2 border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--text-primary)] transition-colors"
              autoFocus
            />

            {/* Format hints */}
            <div className="mt-2 text-xs text-[var(--text-muted)] space-y-1">
              <div>Formats: 12.34, 1:23.45, 1234, DNF, 12.34+2</div>
            </div>

            {/* Error message */}
            {error && (
              <div className="mt-2 text-sm text-[var(--error)]">{error}</div>
            )}
          </div>

          {/* Preview */}
          {parsedTime !== null && !error && (
            <div className="bg-[var(--surface-elevated)] rounded-lg p-4 border border-[var(--border)]">
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-2">
                Preview
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">
                    Raw Time:
                  </span>
                  <span className="font-mono text-[var(--text-primary)]">
                    {parsedTime === 0 && penalty === "DNF"
                      ? "DNF"
                      : formatTimeDisplay(parsedTime, "none")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Penalty:</span>
                  <span
                    className={`font-mono ${
                      penalty === "+2"
                        ? "text-yellow-400"
                        : penalty === "DNF"
                          ? "text-red-400"
                          : "text-[var(--text-primary)]"
                    }`}
                  >
                    {penalty === "none" ? "None" : penalty}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t border-[var(--border)] pt-2">
                  <span className="text-[var(--text-secondary)] font-semibold">
                    Final Time:
                  </span>
                  <span
                    className={`font-mono font-semibold ${
                      penalty === "+2"
                        ? "text-yellow-400"
                        : penalty === "DNF" || parsedTime === 0
                          ? "text-red-400"
                          : "text-[var(--text-primary)]"
                    }`}
                  >
                    {formatTimeDisplay(getFinalTime(), penalty)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Penalty Buttons */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Penalty
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setPenalty("none")}
                className={`px-3 sm:px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                  penalty === "none"
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--border)] border border-[var(--border)]"
                }`}
              >
                OK
              </button>
              <button
                onClick={() => setPenalty("+2")}
                className={`px-3 sm:px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                  penalty === "+2"
                    ? "bg-[var(--warning)] text-white"
                    : "bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--border)] border border-[var(--border)]"
                }`}
              >
                +2
              </button>
              <button
                onClick={() => setPenalty("DNF")}
                className={`px-3 sm:px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                  penalty === "DNF"
                    ? "bg-[var(--error)] text-white"
                    : "bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--border)] border border-[var(--border)]"
                }`}
              >
                DNF
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {inspectionEnabled && (
              <button
                onClick={handleStartInspection}
                className="flex items-center justify-center gap-2 px-4 py-2 sm:py-3 bg-[var(--surface-elevated)] hover:bg-[var(--border)] text-[var(--text-primary)] rounded-lg font-medium transition-colors border border-[var(--border)]"
              >
                <span className="text-sm sm:text-base">Start Inspection</span>
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={!!error || !timeInput.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 sm:py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--primary)]"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm sm:text-base">Add Solve</span>
            </button>
          </div>

          {children}
        </div>
      )}
    </div>
  );
}