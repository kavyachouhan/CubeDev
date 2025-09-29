"use client";

import { AlertTriangle, TrendingUp } from "lucide-react";
import {
  calculatePhaseTimes,
  findLargestStall,
  formatPhaseTime,
  getSplitMethod,
  type PhaseSplit,
} from "@/lib/phase-splits";

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
    <div className={`timer-card ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <h4 className="text-m font-semibold text-[var(--text-primary)] font-statement">
          Phase Breakdown
        </h4>
        <span className="text-sm text-[var(--text-muted)]">{method.name}</span>
      </div>

      {/* Phase Times Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        {phaseTimes.map((phase, index) => {
          const methodPhase = method.phases.find((p) => p.id === phase.phase);
          const isLargestStall = largestStall?.phase === phase.phase;

          return (
            <div
              key={phase.phase}
              className={`p-2 bg-[var(--surface-elevated)] rounded border ${
                isLargestStall
                  ? "border-orange-400/50 bg-orange-400/10"
                  : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-center gap-1 mb-1">
                <div
                  className={`w-2 h-2 rounded-full ${
                    methodPhase?.color?.replace("text-", "bg-") || "bg-gray-400"
                  }`}
                />
                <span className="text-xs font-medium text-[var(--text-primary)]">
                  {methodPhase?.name || phase.phase}
                </span>
                {isLargestStall && (
                  <AlertTriangle className="w-3 h-3 text-orange-500" />
                )}
              </div>
              <div className="text-sm font-bold font-mono text-[var(--text-primary)]">
                {formatPhaseTime(phase.duration)}s
              </div>
            </div>
          );
        })}
      </div>

      {/* Largest Stall Indicator */}
      {largestStall && (
        <div className="flex items-center gap-2 p-2 bg-orange-400/10 border border-orange-400/30 rounded text-xs">
          <TrendingUp className="w-3 h-3 text-orange-500" />
          <span className="text-[var(--text-primary)]">
            <strong>Largest stall:</strong>{" "}
            {method.phases.find((p) => p.id === largestStall.phase)?.name ||
              largestStall.phase}{" "}
            ({formatPhaseTime(largestStall.duration)}s)
          </span>
        </div>
      )}
    </div>
  );
}