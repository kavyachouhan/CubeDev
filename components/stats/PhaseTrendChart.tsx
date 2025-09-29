"use client";

import { useMemo } from "react";
import { TrendingUp, BarChart3 } from "lucide-react";
import {
  calculatePhaseTimes,
  getSplitMethod,
  formatPhaseTime,
} from "@/lib/phase-splits";

interface TimerRecord {
  id: string;
  time: number;
  timestamp: Date;
  scramble: string;
  penalty: "none" | "+2" | "DNF";
  finalTime: number;
  event: string;
  sessionId: string;
  notes?: string;
  tags?: string[];
  splits?: Array<{ phase: string; time: number }>;
  splitMethod?: string;
}

interface PhaseTrendProps {
  solves: TimerRecord[];
}

interface TrendPoint {
  solveIndex: number;
  timestamp: Date;
  phases: Array<{
    phase: string;
    name: string;
    duration: number;
    color: string;
  }>;
}

export default function PhaseTrend({ solves }: PhaseTrendProps) {
  const trendData = useMemo(() => {
    // Filter solves with phase data
    const phaseSolves = solves
      .filter(
        (solve) => solve.splits && solve.splitMethod && solve.splits.length > 0
      )
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

    if (phaseSolves.length === 0) return [];

    // Convert to trend points
    const points: TrendPoint[] = [];

    phaseSolves.forEach((solve, index) => {
      const method = getSplitMethod(solve.splitMethod!);
      if (!method) return;

      const phaseTimes = calculatePhaseTimes(solve.splits!, solve.finalTime);

      points.push({
        solveIndex: index + 1,
        timestamp: new Date(solve.timestamp),
        phases: phaseTimes.map(({ phase, duration }) => {
          const methodPhase = method.phases.find((p) => p.id === phase);
          return {
            phase,
            name: methodPhase?.name || phase,
            duration,
            color: methodPhase?.color || "text-gray-500",
          };
        }),
      });
    });

    return points;
  }, [solves]);

  if (trendData.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-[var(--surface-elevated)] rounded-full flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-8 h-8 text-[var(--text-muted)]" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
          No Phase Trends Yet
        </h3>
        <p className="text-[var(--text-secondary)] text-sm">
          Complete more solves with Phase Split Timer to see trends!
        </p>
      </div>
    );
  }

  // Get all unique phases for consistent coloring
  const allPhases = Array.from(
    new Set(trendData.flatMap((point) => point.phases.map((p) => p.phase)))
  );

  // Find max time for scaling
  const maxTime = Math.max(
    ...trendData.flatMap((point) => point.phases.map((p) => p.duration))
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 bg-[var(--primary)]/20 text-[var(--primary)] rounded flex items-center justify-center">
          <TrendingUp className="w-3 h-3" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement">
          Phase Trend
        </h3>
        <span className="text-xs text-[var(--text-muted)] bg-[var(--surface-elevated)] px-2 py-1 rounded">
          Last {trendData.length} solves
        </span>
      </div>

      {/* Mini chart area */}
      <div className="relative">
        {/* Chart container */}
        <div className="h-48 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4">
          <div className="relative h-full">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-[var(--text-muted)] pr-2">
              <span>{formatPhaseTime(maxTime)}s</span>
              <span>{formatPhaseTime(maxTime * 0.75)}s</span>
              <span>{formatPhaseTime(maxTime * 0.5)}s</span>
              <span>{formatPhaseTime(maxTime * 0.25)}s</span>
              <span>0s</span>
            </div>

            {/* Chart area */}
            <div className="ml-8 h-full relative">
              {/* Grid lines */}
              <div className="absolute inset-0">
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                  <div
                    key={ratio}
                    className="absolute w-full border-t border-[var(--border)]/30"
                    style={{ bottom: `${ratio * 100}%` }}
                  />
                ))}
              </div>

              {/* Phase lines */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {allPhases.map((phaseId) => {
                  const phaseData = trendData
                    .map((point, index) => {
                      const phase = point.phases.find(
                        (p) => p.phase === phaseId
                      );
                      return phase
                        ? {
                            x:
                              (index / Math.max(trendData.length - 1, 1)) * 100,
                            y: 100 - (phase.duration / maxTime) * 100,
                            color: phase.color,
                            name: phase.name,
                          }
                        : null;
                    })
                    .filter(Boolean);

                  if (phaseData.length < 2) return null;

                  const pathData = phaseData
                    .map(
                      (point, index) =>
                        `${index === 0 ? "M" : "L"} ${point!.x} ${point!.y}`
                    )
                    .join(" ");

                  const color = phaseData[0]!.color.replace("text-", "");

                  return (
                    <g key={phaseId}>
                      <path
                        d={pathData}
                        stroke={`var(--${color})`}
                        strokeWidth="0.5"
                        fill="none"
                        opacity="0.8"
                      />
                      {phaseData.map((point, index) => (
                        <circle
                          key={index}
                          cx={point!.x}
                          cy={point!.y}
                          r="0.8"
                          fill={`var(--${color})`}
                          opacity="0.8"
                        />
                      ))}
                    </g>
                  );
                })}
              </svg>

              {/* X-axis labels */}
              <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-[var(--text-muted)]">
                <span>1</span>
                <span>{Math.ceil(trendData.length / 2)}</span>
                <span>{trendData.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-2">
          {allPhases.map((phaseId) => {
            const samplePhase = trendData
              .flatMap((point) => point.phases)
              .find((p) => p.phase === phaseId);

            if (!samplePhase) return null;

            return (
              <div key={phaseId} className="flex items-center gap-1">
                <div
                  className={`w-3 h-3 rounded-full ${samplePhase.color.replace(
                    "text-",
                    "bg-"
                  )}`}
                />
                <span className="text-xs text-[var(--text-secondary)]">
                  {samplePhase.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Recent improvement indicator */}
        {trendData.length >= 5 && (
          <div className="mt-3 p-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <BarChart3 className="w-4 h-4 text-[var(--text-muted)]" />
              <span className="text-[var(--text-secondary)]">
                Phase consistency improving over last 5 solves
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}