"use client";

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
    <div className="phase-indicator space-y-2">
      <div className="flex flex-wrap justify-center gap-2">
        {splitMethod.phases.map((phase, index) => (
          <div
            key={phase.id}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
              index < currentPhaseIndex
                ? `bg-green-100 text-green-800 border border-green-300` // Completed phases
                : index === currentPhaseIndex
                  ? `bg-blue-100 text-blue-800 border border-blue-300 animate-pulse` // Current phase
                  : `bg-gray-100 text-gray-500 border border-gray-300` // Upcoming phases
            }`}
          >
            {phase.name}
          </div>
        ))}
      </div>
      <div className="text-xs text-[var(--text-muted)]">
        Press spacebar or tap to advance to next phase
      </div>
    </div>
  );
}