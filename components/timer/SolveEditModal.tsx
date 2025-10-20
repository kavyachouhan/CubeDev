"use client";

import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";

interface SolveEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTime: number; // in milliseconds
  currentPenalty: "none" | "+2" | "DNF";
  onSave: (time: number, penalty: "none" | "+2" | "DNF") => void;
}

export default function SolveEditModal({
  isOpen,
  onClose,
  currentTime,
  currentPenalty,
  onSave,
}: SolveEditModalProps) {
  const [timeInput, setTimeInput] = useState("");
  const [penalty, setPenalty] = useState<"none" | "+2" | "DNF">(currentPenalty);
  const [error, setError] = useState("");
  const [parsedTime, setParsedTime] = useState<number | null>(null);

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeInput(formatTimeForInput(currentTime));
      setPenalty(currentPenalty);
      setError("");
      setParsedTime(currentTime);
    }
  }, [isOpen, currentTime, currentPenalty]);

  // Format time for input field
  const formatTimeForInput = (timeMs: number): string => {
    if (timeMs === Infinity || timeMs === 0) return "DNF";

    const seconds = timeMs / 1000;
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);

    return mins > 0 ? `${mins}:${secs.padStart(5, "0")}` : secs;
  };

  // Format time for display in the preview
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

    // Handle format: MM:SS.mm (e.g., 1:23.45)
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
          secondsPart = secondsPart + ".00"; // 1:5 -> 1:5.00
        } else if (secondsPart.length === 2) {
          secondsPart = secondsPart + ".00"; // 1:23 -> 1:23.00
        } else if (secondsPart.length === 3) {
          secondsPart = secondsPart.slice(0, 2) + "." + secondsPart.slice(2); // 1:234 -> 1:23.4
        } else if (secondsPart.length === 4) {
          secondsPart = secondsPart.slice(0, 2) + "." + secondsPart.slice(2); // 1:2345 -> 1:23.45
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
    // Smart decimal handling for times without decimal point or colon
    if (!cleanInput.includes(".")) {
      const digitsOnly = cleanInput.replace(/[^\d]/g, "");

      if (digitsOnly.length === 1) {
        cleanInput = digitsOnly + ".00"; // 5 -> 5.00
      } else if (digitsOnly.length === 2) {
        cleanInput = digitsOnly + ".00"; // 12 -> 12.00
      } else if (digitsOnly.length === 3) {
        cleanInput = digitsOnly.slice(0, 1) + "." + digitsOnly.slice(1); // 123 -> 1.23
      } else if (digitsOnly.length === 4) {
        cleanInput = digitsOnly.slice(0, 2) + "." + digitsOnly.slice(2); // 1234 -> 12.34
      } else if (digitsOnly.length === 5) {
        // 12345 -> 1:23.45 (M:SS.mm format)
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
        // 123456 -> 12:34.56 (MM:SS.mm format)
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
        // For 7+ digits, treat as MM...M:SS.mm (minutes can be any length)
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

  // Handle input change with live validation
  const handleInputChange = (value: string) => {
    setTimeInput(value);
    const result = parseTimeInput(value);

    if (result.error) {
      setError(result.error);
      setParsedTime(null);
    } else {
      setError("");
      // For DNF only input, set parsedTime to 0 for preview purposes
      if (result.isDnfOnly) {
        setParsedTime(0); // Use 0 to represent DNF-only state in preview
        setPenalty("DNF");
      } else {
        setParsedTime(result.time);
        // Auto-detect penalty from input
        if (result.penalty !== "none") {
          setPenalty(result.penalty);
        }
      }
    }
  };

  // Handle save
  const handleSave = () => {
    const result = parseTimeInput(timeInput);

    if (result.error) {
      setError(result.error);
      return;
    }

    // For DNF only input, keep the original raw time, just change penalty
    if (result.isDnfOnly) {
      onSave(currentTime, "DNF");
      onClose();
      return;
    }

    if (result.time === null || result.time === 0) {
      setError("Invalid time");
      return;
    }

    // Use the detected penalty if not manually set
    const finalPenalty = result.penalty !== "none" ? result.penalty : penalty;

    onSave(result.time, finalPenalty);
    onClose();
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
    // Prevent spacebar from triggering timer
    if (e.key === " ") {
      e.stopPropagation();
    }
  };

  if (!isOpen) return null;

  // Calculate final time with penalty for preview
  const getFinalTime = (): number => {
    if (parsedTime === null) return 0;
    // If penalty is DNF or parsedTime is 0 (DNF-only input), return Infinity
    if (penalty === "DNF" || parsedTime === 0) return Infinity;
    if (penalty === "+2") return parsedTime + 2000;
    return parsedTime;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onKeyDown={(e) => {
        // Prevent all keyboard events from bubbling to timer
        e.stopPropagation();
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement">
            Edit Solve Time
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Time Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Time
            </label>
            <input
              type="text"
              value={timeInput}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., 12.34 or 1:23.45"
              className="w-full px-4 py-3 text-lg font-mono bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              autoFocus
            />

            {/* Format hints */}
            <div className="mt-2 text-xs text-[var(--text-muted)] space-y-1">
              <div>Supported formats:</div>
              <div className="pl-2">
                • <span className="font-mono">12.34</span> (seconds with
                decimals)
              </div>
              <div className="pl-2">
                • <span className="font-mono">12</span>,{" "}
                <span className="font-mono">123</span>, or{" "}
                <span className="font-mono">1234</span> (auto-formats: 12.00,
                1.23, 12.34)
              </div>
              <div className="pl-2">
                • <span className="font-mono">12.34+2</span> or{" "}
                <span className="font-mono">12.34 + 2</span> (with +2 penalty)
              </div>
              <div className="pl-2">
                • <span className="font-mono">12.34(DNF)</span> or{" "}
                <span className="font-mono">DNF</span> (DNF penalty)
              </div>
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
            <div className="flex gap-2">
              <button
                onClick={() => setPenalty("none")}
                className={`flex-1 px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                  penalty === "none"
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--border)] border border-[var(--border)]"
                }`}
              >
                OK
              </button>
              <button
                onClick={() => setPenalty("+2")}
                className={`flex-1 px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                  penalty === "+2"
                    ? "bg-[var(--warning)] text-white"
                    : "bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--border)] border border-[var(--border)]"
                }`}
              >
                +2
              </button>
              <button
                onClick={() => setPenalty("DNF")}
                className={`flex-1 px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
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
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={!!error || !timeInput.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--primary)]"
            >
              <Check className="w-4 h-4" />
              Save Changes
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[var(--surface-elevated)] hover:bg-[var(--border)] text-[var(--text-secondary)] rounded-lg font-medium transition-colors border border-[var(--border)]"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}