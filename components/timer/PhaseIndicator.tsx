"use client";

import { Check } from "lucide-react";
import { cx } from "@/lib/cx";
import { getSplitMethod } from "@/lib/phase-splits";

interface PhaseIndicatorProps {
  phaseSplitsEnabled: boolean;
  isRunning: boolean;
  selectedSplitMethod: string;
  currentPhaseIndex: number;
}

export default function PhaseIndicator({
  phaseSplitsEnabled,
  isRunning,
  selectedSplitMethod,
  currentPhaseIndex,
}: PhaseIndicatorProps) {
  if (!phaseSplitsEnabled || !isRunning) return null;

  const splitMethod = getSplitMethod(selectedSplitMethod);
  if (!splitMethod) return null;

  return (
    <div className="space-y-2">
      <ol aria-label="Solve phases" className="flex flex-wrap justify-center gap-2">
        {splitMethod.phases.map((phase, index) => {
          const done = index < currentPhaseIndex;
          const current = index === currentPhaseIndex;
          return (
            <li
              key={phase.id}
              aria-current={current ? "step" : undefined}
              className={cx(
                "inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-medium font-inter transition-colors duration-(--duration-base)",
                done && "bg-(--success)/10 text-(--success) border-(--success)/30",
                current && "bg-(--primary)/15 text-(--primary) border-(--primary)/40",
                !done && !current && "bg-(--surface-elevated) text-(--text-muted) border-(--border)",
              )}
            >
              {done && <Check className="w-3 h-3" aria-hidden />}
              {phase.name}
            </li>
          );
        })}
      </ol>
      <p className="type-caption">Press spacebar or tap to advance to the next phase</p>
    </div>
  );
}
