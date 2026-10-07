"use client";

import { Zap, TrendingUp } from "lucide-react";
import { Badge, CollapsibleCard, StatTile, useCollapsed } from "@/components/ui";
import { formatTime } from "./utils";
import { ProgressStats } from "./types";

interface LearningMetricsCardProps {
  progressStats: ProgressStats;
}

/** For times, a negative delta is an improvement, so green means "went down". */
function deltaTone(value: number) {
  if (value > 0) return "success" as const;
  if (value < 0) return "error" as const;
  return "default" as const;
}

function ComparisonRow({
  label,
  average,
  improvement,
}: {
  label: string;
  average: number;
  improvement: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-(--surface-elevated) rounded-(--radius-panel) border border-(--border)">
      <span className="type-caption min-w-0 truncate">{label}</span>
      <div className="flex items-center gap-2 shrink-0">
        <span className="type-time text-sm font-medium text-(--text-primary)">
          {formatTime(average)}
        </span>
        <Badge tone={improvement > 0 ? "success" : "danger"} size="sm">
          {improvement > 0 ? "-" : "+"}
          {formatTime(Math.abs(improvement))}
        </Badge>
      </div>
    </div>
  );
}

export default function LearningMetricsCard({
  progressStats,
}: LearningMetricsCardProps) {
  const collapsed = useCollapsed("coach-progress-learning", true);

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
    <CollapsibleCard
      title="Learning Metrics"
      variant="static"
      open={collapsed.open}
      onOpenChange={collapsed.onOpenChange}
    >
      {(hasLearningVelocity || hasConsistency) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {hasLearningVelocity && (
            <StatTile
              icon={<Zap />}
              label="Learning Velocity"
              tone={deltaTone(progressStats.learningVelocity!)}
              value={`${progressStats.learningVelocity! > 0 ? "-" : "+"}${formatTime(
                Math.abs(progressStats.learningVelocity!),
              )}`}
              hint={`per month — ${
                progressStats.learningVelocity! > 0
                  ? "Improving!"
                  : "Keep practicing"
              }`}
            />
          )}

          {hasConsistency && (
            <StatTile
              icon={<TrendingUp />}
              mono={false}
              label="Consistency Trend"
              tone={deltaTone(progressStats.consistencyImprovement!)}
              value={`${
                progressStats.consistencyImprovement! > 0 ? "+" : ""
              }${progressStats.consistencyImprovement!.toFixed(1)}%`}
              hint={
                progressStats.consistencyImprovement! > 0
                  ? "More consistent!"
                  : "More variable times"
              }
            />
          )}
        </div>
      )}

      {(hasMonthlyComparison || hasYearlyComparison) && (
        <div className="mt-4 space-y-2">
          <h4 className="type-label border-b border-(--border) pb-2">
            Comparison Stats
          </h4>

          {hasMonthlyComparison && (
            <ComparisonRow
              label="vs Last Month"
              average={progressStats.monthly.average!}
              improvement={progressStats.comparison.monthlyImprovement!}
            />
          )}

          {hasYearlyComparison && (
            <ComparisonRow
              label="vs Last Year"
              average={progressStats.monthly.average!}
              improvement={progressStats.comparison.yearlyImprovement!}
            />
          )}
        </div>
      )}
    </CollapsibleCard>
  );
}
