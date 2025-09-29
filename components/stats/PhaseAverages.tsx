"use client";

import { useMemo } from "react";
import { Clock, TrendingUp, BarChart3 } from "lucide-react";
import {
  calculatePhaseTimes,
  getSplitMethod,
  formatPhaseTime,
  SPLIT_METHODS,
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

interface PhaseAveragesProps {
  solves: TimerRecord[];
}

interface PhaseStats {
  phase: string;
  mean: number;
  stdDev: number;
  count: number;
  best: number;
  worst: number;
  color: string;
  name: string;
}

export default function PhaseAverages({ solves }: PhaseAveragesProps) {
  const phaseStats = useMemo(() => {
    console.log("PhaseAverages: Processing solves:", solves.length, solves);

    // Group solves by split method and calculate stats for each phase
    const methodStats = new Map<string, Map<string, number[]>>();

    // Collect all phase times by method
    solves.forEach((solve) => {
      console.log("PhaseAverages: Processing solve:", {
        id: solve.id,
        splits: solve.splits,
        splitMethod: solve.splitMethod,
        hasSplits: !!solve.splits,
        splitCount: solve.splits?.length || 0,
      });

      if (!solve.splits || !solve.splitMethod || solve.splits.length === 0)
        return;

      const phaseTimes = calculatePhaseTimes(solve.splits, solve.finalTime);

      if (!methodStats.has(solve.splitMethod)) {
        methodStats.set(solve.splitMethod, new Map());
      }

      const methodMap = methodStats.get(solve.splitMethod)!;

      phaseTimes.forEach(({ phase, duration }) => {
        if (!methodMap.has(phase)) {
          methodMap.set(phase, []);
        }
        methodMap.get(phase)!.push(duration);
      });
    });

    // Calculate statistics for each phase
    const allStats: Array<PhaseStats & { method: string }> = [];

    methodStats.forEach((phases, methodId) => {
      const method = getSplitMethod(methodId);
      if (!method) return;

      phases.forEach((times, phaseId) => {
        if (times.length === 0) return;

        const mean = times.reduce((sum, time) => sum + time, 0) / times.length;
        const variance =
          times.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) /
          times.length;
        const stdDev = Math.sqrt(variance);
        const best = Math.min(...times);
        const worst = Math.max(...times);

        const methodPhase = method.phases.find((p) => p.id === phaseId);

        allStats.push({
          phase: phaseId,
          mean,
          stdDev,
          count: times.length,
          best,
          worst,
          color: methodPhase?.color || "text-gray-500",
          name: methodPhase?.name || phaseId,
          method: method.name,
        });
      });
    });

    return allStats;
  }, [solves]);

  if (phaseStats.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-[var(--surface-elevated)] rounded-full flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-8 h-8 text-[var(--text-muted)]" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
          No Phase Data Yet
        </h3>
        <p className="text-[var(--text-secondary)] text-sm">
          Enable Phase Split Timer in timer settings and start solving to see
          phase statistics!
        </p>
      </div>
    );
  }

  // Group by method for display
  const groupedStats = phaseStats.reduce(
    (groups, stat) => {
      if (!groups[stat.method]) {
        groups[stat.method] = [];
      }
      groups[stat.method].push(stat);
      return groups;
    },
    {} as Record<string, PhaseStats[]>
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 bg-[var(--primary)]/20 text-[var(--primary)] rounded flex items-center justify-center">
          <Clock className="w-3 h-3" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement">
          Phase Averages
        </h3>
        <span className="text-xs text-[var(--text-muted)] bg-[var(--surface-elevated)] px-2 py-1 rounded">
          {phaseStats.reduce((sum, stat) => sum + stat.count, 0)} total splits
        </span>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedStats).map(([methodName, stats]) => (
          <div key={methodName} className="space-y-3">
            <h4 className="text-sm font-medium text-[var(--text-primary)] border-b border-[var(--border)] pb-2">
              {methodName}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats.map((stat) => (
                <div
                  key={stat.phase}
                  className="p-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-3 h-3 rounded-full ${stat.color.replace(
                        "text-",
                        "bg-"
                      )}`}
                    />
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {stat.name}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      ({stat.count})
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[var(--text-muted)]">
                        Mean
                      </span>
                      <span className="text-sm font-mono font-semibold text-[var(--text-primary)]">
                        {formatPhaseTime(stat.mean)}s
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[var(--text-muted)]">
                        Std Dev
                      </span>
                      <span className="text-sm font-mono text-[var(--text-secondary)]">
                        ±{formatPhaseTime(stat.stdDev)}s
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[var(--text-muted)]">
                        Range
                      </span>
                      <span className="text-sm font-mono text-[var(--text-secondary)]">
                        {formatPhaseTime(stat.best)}s -{" "}
                        {formatPhaseTime(stat.worst)}s
                      </span>
                    </div>
                  </div>

                  {/* Consistency indicator */}
                  <div className="mt-2 pt-2 border-t border-[var(--border)]">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-[var(--text-muted)]" />
                      <span className="text-xs text-[var(--text-muted)]">
                        Consistency:{" "}
                        {((1 - stat.stdDev / stat.mean) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}