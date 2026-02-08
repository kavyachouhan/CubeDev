"use client";

import { Zap, TrendingUp } from "lucide-react";
import { CollapsibleSection, formatTime } from "./utils";
import { ProgressStats } from "./types";

interface LearningMetricsCardProps {
  progressStats: ProgressStats;
}

export default function LearningMetricsCard({
  progressStats,
}: LearningMetricsCardProps) {
  // Only render if we have enough data for at least one metric
  const hasLearningVelocity = progressStats.learningVelocity !== null;
  const hasConsistency = progressStats.consistencyImprovement !== null;
  const hasMonthlyComparison =
    progressStats.comparison.prevMonthAverage &&
    progressStats.monthly.average &&
    progressStats.comparison.monthlyImprovement !== null;
  const hasYearlyComparison =
    progressStats.comparison.prevYearAverage &&
    progressStats.monthly.average &&
    progressStats.comparison.yearlyImprovement !== null;

  // Don't render if no data available
  if (
    !hasLearningVelocity &&
    !hasConsistency &&
    !hasMonthlyComparison &&
    !hasYearlyComparison
  ) {
    return null;
  }

  return (
    <CollapsibleSection
      title="Learning Metrics"
      storageKey="coach-progress-learning"
      defaultExpanded={true}
    >
      {/* Learning Velocity & Consistency */}
      {(hasLearningVelocity || hasConsistency) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {/* Learning Velocity */}
          {hasLearningVelocity && (
            <div className="bg-[var(--surface-elevated)] rounded-lg p-3 sm:p-4 border border-[var(--border)]">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-[var(--primary)]/10 rounded">
                  <Zap className="w-4 h-4 text-[var(--primary)]" />
                </div>
                <span className="text-sm text-[var(--text-muted)]">
                  Learning Velocity
                </span>
              </div>
              <p
                className={`text-xl sm:text-2xl font-bold font-mono ${
                  progressStats.learningVelocity! > 0
                    ? "text-[var(--success)]"
                    : progressStats.learningVelocity! < 0
                      ? "text-[var(--error)]"
                      : "text-[var(--text-primary)]"
                }`}
              >
                {progressStats.learningVelocity! > 0 ? "-" : "+"}
                {formatTime(Math.abs(progressStats.learningVelocity!))}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                per month -{" "}
                {progressStats.learningVelocity! > 0
                  ? "Improving!"
                  : "Keep practicing"}
              </p>
            </div>
          )}

          {/* Consistency */}
          {hasConsistency && (
            <div className="bg-[var(--surface-elevated)] rounded-lg p-3 sm:p-4 border border-[var(--border)]">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-[var(--accent)]/10 rounded">
                  <TrendingUp className="w-4 h-4 text-[var(--accent)]" />
                </div>
                <span className="text-sm text-[var(--text-muted)]">
                  Consistency Trend
                </span>
              </div>
              <p
                className={`text-xl sm:text-2xl font-bold font-mono ${
                  progressStats.consistencyImprovement! > 0
                    ? "text-[var(--success)]"
                    : progressStats.consistencyImprovement! < 0
                      ? "text-[var(--error)]"
                      : "text-[var(--text-primary)]"
                }`}
              >
                {progressStats.consistencyImprovement! > 0 ? "+" : ""}
                {progressStats.consistencyImprovement!.toFixed(1)}%
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {progressStats.consistencyImprovement! > 0
                  ? "More consistent!"
                  : "More variable times"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Comparison Stats */}
      {(hasMonthlyComparison || hasYearlyComparison) && (
        <div className="mt-4 space-y-2">
          <div className="text-sm font-medium text-[var(--text-primary)] border-b border-[var(--border)] pb-2">
            Comparison Stats
          </div>

          {hasMonthlyComparison && (
            <div className="flex items-center justify-between p-3 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]">
              <span className="text-sm text-[var(--text-secondary)]">
                vs Last Month
              </span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-[var(--text-primary)] font-mono text-sm">
                  {formatTime(progressStats.monthly.average!)}
                </span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                    progressStats.comparison.monthlyImprovement! > 0
                      ? "bg-[var(--success)]/10 text-[var(--success)]"
                      : "bg-[var(--error)]/10 text-[var(--error)]"
                  }`}
                >
                  {progressStats.comparison.monthlyImprovement! > 0 ? "-" : "+"}
                  {formatTime(
                    Math.abs(progressStats.comparison.monthlyImprovement!),
                  )}
                </span>
              </div>
            </div>
          )}

          {hasYearlyComparison && (
            <div className="flex items-center justify-between p-3 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]">
              <span className="text-sm text-[var(--text-secondary)]">
                vs Last Year
              </span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-[var(--text-primary)] font-mono text-sm">
                  {formatTime(progressStats.monthly.average!)}
                </span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                    progressStats.comparison.yearlyImprovement! > 0
                      ? "bg-[var(--success)]/10 text-[var(--success)]"
                      : "bg-[var(--error)]/10 text-[var(--error)]"
                  }`}
                >
                  {progressStats.comparison.yearlyImprovement! > 0 ? "-" : "+"}
                  {formatTime(
                    Math.abs(progressStats.comparison.yearlyImprovement!),
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </CollapsibleSection>
  );
}
