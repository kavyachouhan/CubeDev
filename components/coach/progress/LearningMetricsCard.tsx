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
            <div className="bg-(--surface-elevated) rounded-lg p-3 sm:p-4 border border-(--border)">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-(--primary)/10 rounded">
                  <Zap className="w-4 h-4 text-(--primary)" />
                </div>
                <span className="text-sm text-(--text-muted)">
                  Learning Velocity
                </span>
              </div>
              <p
                className={`text-xl sm:text-2xl font-bold font-mono ${
                  progressStats.learningVelocity! > 0
                    ? "text-(--success)"
                    : progressStats.learningVelocity! < 0
                      ? "text-(--error)"
                      : "text-(--text-primary)"
                }`}
              >
                {progressStats.learningVelocity! > 0 ? "-" : "+"}
                {formatTime(Math.abs(progressStats.learningVelocity!))}
              </p>
              <p className="text-xs text-(--text-muted) mt-1">
                per month -{" "}
                {progressStats.learningVelocity! > 0
                  ? "Improving!"
                  : "Keep practicing"}
              </p>
            </div>
          )}

          {/* Consistency */}
          {hasConsistency && (
            <div className="bg-(--surface-elevated) rounded-lg p-3 sm:p-4 border border-(--border)">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-(--accent)/10 rounded">
                  <TrendingUp className="w-4 h-4 text-(--accent)" />
                </div>
                <span className="text-sm text-(--text-muted)">
                  Consistency Trend
                </span>
              </div>
              <p
                className={`text-xl sm:text-2xl font-bold font-mono ${
                  progressStats.consistencyImprovement! > 0
                    ? "text-(--success)"
                    : progressStats.consistencyImprovement! < 0
                      ? "text-(--error)"
                      : "text-(--text-primary)"
                }`}
              >
                {progressStats.consistencyImprovement! > 0 ? "+" : ""}
                {progressStats.consistencyImprovement!.toFixed(1)}%
              </p>
              <p className="text-xs text-(--text-muted) mt-1">
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
          <div className="text-sm font-medium text-(--text-primary) border-b border-(--border) pb-2">
            Comparison Stats
          </div>

          {hasMonthlyComparison && (
            <div className="flex items-center justify-between p-3 bg-(--surface-elevated) rounded-lg border border-(--border)">
              <span className="text-sm text-(--text-secondary)">
                vs Last Month
              </span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-(--text-primary) font-mono text-sm">
                  {formatTime(progressStats.monthly.average!)}
                </span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                    progressStats.comparison.monthlyImprovement! > 0
                      ? "bg-(--success)/10 text-(--success)"
                      : "bg-(--error)/10 text-(--error)"
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
            <div className="flex items-center justify-between p-3 bg-(--surface-elevated) rounded-lg border border-(--border)">
              <span className="text-sm text-(--text-secondary)">
                vs Last Year
              </span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-(--text-primary) font-mono text-sm">
                  {formatTime(progressStats.monthly.average!)}
                </span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                    progressStats.comparison.yearlyImprovement! > 0
                      ? "bg-(--success)/10 text-(--success)"
                      : "bg-(--error)/10 text-(--error)"
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
