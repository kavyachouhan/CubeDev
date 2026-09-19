"use client";

import { AlertTriangle, TrendingUp } from "lucide-react";
import {
  calculatePhaseTimes,
  findLargestStall,
  formatPhaseTime,
  getSplitMethod,
  type PhaseSplit,
} from "@/lib/phase-splits";
import { Alert } from "@/components/ui/Alert";

interface PhaseResultsProps {
  splits: PhaseSplit[];
  totalTime: number;
  splitMethod: string;
  className?: string;
}

export default function PhaseResults({
  splits,
  totalTime,
  splitMethod,
  className = "",
}: PhaseResultsProps) {
  if (!splits || splits.length === 0 || !splitMethod) {
    return null;
  }

  const method = getSplitMethod(splitMethod);
  if (!method) {
    return null;
  }

  const phaseTimes = calculatePhaseTimes(splits, totalTime);
  const largestStall = findLargestStall(phaseTimes, splitMethod);

  return (
    <div className={`bg-(--surface-elevated) border border-(--border) rounded-(--radius-panel) p-3 sm:p-4 ${className}`}>
      <div className="flex items-baseline gap-2 mb-3">
        <h4 className="type-card-title text-base!">Phase Breakdown</h4>
        <span className="type-caption">{method.name}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        {phaseTimes.map((phase) => {
          const phaseIndex = method.phases.findIndex((p) => p.id === phase.phase);
          const methodPhase = method.phases[phaseIndex];
          const isLargestStall = largestStall?.phase === phase.phase;

          return (
            <div
              key={phase.phase}
              className={`p-2 rounded-(--radius-control) border ${
                isLargestStall
                  ? "border-(--warning)/50 bg-(--warning)/10"
                  : "border-(--border) bg-(--surface)"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  aria-hidden
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: `var(--chart-${(Math.max(phaseIndex, 0) % 5) + 1})` }}
                />
                <span className="text-xs font-medium text-(--text-primary) truncate">
                  {methodPhase?.name || phase.phase}
                </span>
                {isLargestStall && (
                  <AlertTriangle
                    className="w-3 h-3 shrink-0 text-(--warning)"
                    aria-label="Largest stall"
                  />
                )}
              </div>
              <div className="text-sm font-bold type-time text-(--text-primary)">
                {formatPhaseTime(phase.duration)}s
              </div>
            </div>
          );
        })}
      </div>

      {largestStall && (
        <Alert tone="warning" size="sm" icon={<TrendingUp />}>
          <strong className="text-(--text-primary)">Largest stall:</strong>{" "}
          {method.phases.find((p) => p.id === largestStall.phase)?.name ||
            largestStall.phase}{" "}
          ({formatPhaseTime(largestStall.duration)}s)
        </Alert>
      )}
    </div>
  );
}