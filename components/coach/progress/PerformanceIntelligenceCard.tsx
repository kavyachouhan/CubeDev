"use client";

import type { ComponentType } from "react";
import {
  Brain,
  Coffee,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardIcon,
  CollapsibleCard,
  useCollapsed,
} from "@/components/ui";
import { ProgressStats } from "./types";

type InsightTone = "success" | "warning" | "error" | "neutral";

interface InsightItem {
  key: string;
  title: string;
  message: string;
  tone: InsightTone;
  icon: ComponentType<{ className?: string }>;
}

function formatSeconds(ms: number) {
  return (ms / 1000).toFixed(1);
}

/** Maps an insight's tone onto a `CardIcon` tone and a matching border. */
function getToneClasses(tone: InsightTone) {
  switch (tone) {
    case "success":
      return { icon: "success" as const, border: "border-(--success)/30" };
    case "warning":
      return { icon: "warning" as const, border: "border-(--warning)/30" };
    case "error":
      return { icon: "error" as const, border: "border-(--error)/30" };
    default:
      return { icon: "primary" as const, border: "" };
  }
}

interface PerformanceIntelligenceCardProps {
  progressStats: ProgressStats;
}

export default function PerformanceIntelligenceCard({
  progressStats,
}: PerformanceIntelligenceCardProps) {
  const collapsed = useCollapsed("coach-progress-intelligence", true);
  const intelligence = progressStats.intelligence;
  if (!intelligence) return null;

  const insights: InsightItem[] = [];

  if (
    intelligence.weekly.prevAverage !== null &&
    intelligence.weekly.average !== null &&
    intelligence.weekly.improvementMs !== null
  ) {
    const fromAvg = formatSeconds(intelligence.weekly.prevAverage);
    const toAvg = formatSeconds(intelligence.weekly.average);

    if (intelligence.weekly.improvementMs > 0) {
      insights.push({
        key: "avg-drop",
        title: "Weekly Average",
        message: `Your avg dropped from ${fromAvg}s to ${toAvg}s this week.`,
        tone: "success",
        icon: TrendingDown,
      });
    } else if (intelligence.weekly.improvementMs < 0) {
      insights.push({
        key: "avg-rise",
        title: "Weekly Average",
        message: `Your avg rose from ${fromAvg}s to ${toAvg}s this week.`,
        tone: "warning",
        icon: TrendingUp,
      });
    }
  }

  if (intelligence.slowdownAfterTen.detected) {
    const slowdownDelta =
      intelligence.slowdownAfterTen.deltaMs !== null
        ? `${formatSeconds(intelligence.slowdownAfterTen.deltaMs)}s`
        : "a noticeable amount";

    insights.push({
      key: "slowdown",
      title: "Session Pacing",
      message: `You slow down after 10 solves (about +${slowdownDelta}). Take short breaks between sets.`,
      tone: "warning",
      icon: Coffee,
    });
  }

  if (
    intelligence.consistency.isLow &&
    intelligence.consistency.stdDevMs !== null
  ) {
    insights.push({
      key: "consistency",
      title: "Consistency",
      message: `Your consistency is low (std dev ${formatSeconds(intelligence.consistency.stdDevMs)}s this week).`,
      tone: "error",
      icon: ShieldAlert,
    });
  }

  if (insights.length === 0) {
    return null;
  }

  return (
    <CollapsibleCard
      title="Performance Intelligence"
      variant="static"
      open={collapsed.open}
      onOpenChange={collapsed.onOpenChange}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3">
        {insights.map((insight) => {
          const toneClasses = getToneClasses(insight.tone);
          const Icon = insight.icon;

          return (
            <Card
              key={insight.key}
              variant="nested"
              className={toneClasses.border}
            >
              <div className="flex items-center gap-2 mb-2">
                <CardIcon tone={toneClasses.icon} className="w-7 h-7 [&_svg]:w-4 [&_svg]:h-4">
                  <Icon />
                </CardIcon>
                <h4 className="type-label min-w-0">{insight.title}</h4>
              </div>
              <p className="type-body">{insight.message}</p>
            </Card>
          );
        })}
      </div>

      <div className="mt-3 flex items-start gap-2 type-caption">
        <Brain aria-hidden className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          Insights are shown only when there is enough data for reliable
          analysis.
        </span>
      </div>
    </CollapsibleCard>
  );
}
