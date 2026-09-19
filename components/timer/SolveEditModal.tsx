"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { formatTime, secondsToCentisMs, truncToCentisMs } from "@/lib/stats-utils";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { TimeValue } from "@/components/ui/TimeValue";

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
      setParsedTime(
        !isFinite(currentTime) || currentTime === 0
          ? currentTime
          : truncToCentisMs(currentTime),
      );
    }
  }, [isOpen, currentTime, currentPenalty]);

  // Format time for input field
  const formatTimeForInput = (timeMs: number): string => {
    if (timeMs === Infinity || timeMs === 0) return "DNF";
    return formatTime(timeMs);
  };

  const formatTimeDisplay = (
    timeMs: number,
    penalty: "none" | "+2" | "DNF"
  ): string => {
    if (penalty === "DNF" || timeMs === Infinity || timeMs === 0) return "DNF";
    const formatted = formatTime(timeMs);
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

      const timeMs = secondsToCentisMs(minutes * 60 + seconds);
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

        const timeMs = secondsToCentisMs(minutes * 60 + seconds);
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

        const timeMs = secondsToCentisMs(minutes * 60 + seconds);
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

        const timeMs = secondsToCentisMs(minutes * 60 + seconds);
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

    const timeMs = secondsToCentisMs(seconds);
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

  // Enter saves; Escape and timer isolation are handled by Modal.
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  };

  // Calculate final time with penalty for preview
  const getFinalTime = (): number => {
    if (parsedTime === null) return 0;
    // If penalty is DNF or parsedTime is 0 (DNF-only input), return Infinity
    if (penalty === "DNF" || parsedTime === 0) return Infinity;
    if (penalty === "+2") return parsedTime + 2000;
    return parsedTime;
  };

  const finalPenaltyForPreview =
    parsedTime === 0 ? "DNF" : penalty;

  return (
    <Modal open={isOpen} onClose={onClose} size="md" mobile="sheet">
      <Modal.Header title="Edit Solve Time" />
      <Modal.Body className="space-y-5">
        <Field
          label="Time"
          error={error || undefined}
          hint={
            <span className="block space-y-0.5">
              <span className="block">Supported formats:</span>
              <span className="block pl-2">
                <span className="type-time">12.34</span> — seconds with decimals
              </span>
              <span className="block pl-2">
                <span className="type-time">12</span>, <span className="type-time">123</span>,{" "}
                <span className="type-time">1234</span> — auto-formats to 12.00, 1.23, 12.34
              </span>
              <span className="block pl-2">
                <span className="type-time">12.34+2</span> — with +2 penalty
              </span>
              <span className="block pl-2">
                <span className="type-time">12.34(DNF)</span> or{" "}
                <span className="type-time">DNF</span> — DNF penalty
              </span>
            </span>
          }
        >
          <Input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={timeInput}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. 12.34 or 1:23.45"
            size="lg"
            className="type-time text-xl!"
            data-autofocus
          />
        </Field>

        {parsedTime !== null && !error && (
          <div
            aria-live="polite"
            className="rounded-(--radius-panel) border border-(--border) bg-(--surface-elevated) p-4"
          >
            <p className="type-overline mb-3">Preview</p>
            <dl className="space-y-2 text-sm font-inter">
              <div className="flex justify-between">
                <dt className="text-(--text-secondary)">Raw time</dt>
                <dd>
                  <TimeValue>
                    {parsedTime === 0 && penalty === "DNF"
                      ? "DNF"
                      : formatTimeDisplay(parsedTime, "none")}
                  </TimeValue>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-(--text-secondary)">Penalty</dt>
                <dd>
                  <TimeValue penalty={penalty}>
                    {penalty === "none" ? "None" : penalty}
                  </TimeValue>
                </dd>
              </div>
              <div className="flex justify-between border-t border-(--border) pt-2">
                <dt className="font-semibold text-(--text-primary)">Final time</dt>
                <dd>
                  <TimeValue penalty={finalPenaltyForPreview} className="font-semibold text-base">
                    {formatTimeDisplay(getFinalTime(), penalty)}
                  </TimeValue>
                </dd>
              </div>
            </dl>
          </div>
        )}

        <div className="space-y-1.5">
          <p className="type-label" aria-hidden>
            Penalty
          </p>
          <SegmentedControl
            aria-label="Penalty"
            value={penalty}
            onChange={setPenalty}
            fullWidth
            size="lg"
            options={[
              { value: "none", label: "OK" },
              { value: "+2", label: "+2", tone: "warning" },
              { value: "DNF", label: "DNF", tone: "error" },
            ]}
          />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!!error || !timeInput.trim()}
          iconLeft={<Check className="w-4 h-4" />}
        >
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
}