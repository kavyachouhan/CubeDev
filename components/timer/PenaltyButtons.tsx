"use client";

import type { SyntheticEvent } from "react";
import { Check } from "lucide-react";
import { cx } from "@/lib/cx";

interface PenaltyButtonsProps {
  showPenaltyButtons: boolean;
  currentPenalty: "none" | "+2" | "DNF";
  onPenaltyChange: (penalty: "none" | "+2" | "DNF") => void;
}

// The timer starts on pointer/touch anywhere on the card; these buttons must
// not leak those events or tapping a penalty would arm the next solve.
const stop = (e: SyntheticEvent) => e.stopPropagation();

export default function PenaltyButtons({
  showPenaltyButtons,
  currentPenalty,
  onPenaltyChange,
}: PenaltyButtonsProps) {
  if (!showPenaltyButtons) return null;

  const toggle = (penalty: "+2" | "DNF") =>
    onPenaltyChange(currentPenalty === penalty ? "none" : penalty);

  const options = [
    { value: "+2" as const, label: "+2", tone: "plus2" },
    { value: "DNF" as const, label: "DNF", tone: "dnf" },
  ];

  return (
    <div role="group" aria-label="Penalty for this solve" className="flex justify-center gap-3">
      {options.map(({ value, label, tone }) => {
        const active = currentPenalty === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              toggle(value);
            }}
            onTouchStart={stop}
            onTouchEnd={stop}
            onMouseDown={stop}
            onMouseUp={stop}
            className={cx(
              "inline-flex items-center justify-center gap-1.5 min-w-24 min-h-11 px-5 rounded-(--radius-control) text-white font-statement text-base transition-colors",
              tone === "plus2"
                ? active
                  ? "bg-(--penalty-plus2-hover) ring-2 ring-offset-2 ring-offset-(--surface) ring-(--penalty-plus2)"
                  : "bg-(--penalty-plus2) hover:bg-(--penalty-plus2-hover)"
                : active
                  ? "bg-(--penalty-dnf-hover) ring-2 ring-offset-2 ring-offset-(--surface) ring-(--penalty-dnf)"
                  : "bg-(--penalty-dnf) hover:bg-(--penalty-dnf-hover)",
            )}
          >
            {label}
            {active && <Check className="w-4 h-4" strokeWidth={3} aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}
