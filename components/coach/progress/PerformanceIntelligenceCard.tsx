"use client";

import type { ComponentType } from "react";
import {
  Brain,
  Coffee,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { CollapsibleSection } from "./utils";
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

function getToneClasses(tone: InsightTone) {
  switch (tone) {
    case "success":
      return {
        iconWrap: "bg-(--success)/10 text-(--success)",
        border: "border-(--success)/30",
      };
    case "warning":
      return {
        iconWrap: "bg-(--warning)/10 text-(--warning)",
        border: "border-(--warning)/30",
      };
    case "error":
      return {
        iconWrap: "bg-(--error)/10 text-(--error)",
        border: "border-(--error)/30",
      };
    default:
      return {
        iconWrap: "bg-(--primary)/10 text-(--primary)",
        border: "border-(--border)",
      };
  }
}

interface PerformanceIntelligenceCardProps {
  progressStats: ProgressStats;
}

export default function PerformanceIntelligenceCard({
  progressStats,
}: PerformanceIntelligenceCardProps) {
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
    <CollapsibleSection
      title="Performance Intelligence"
      storageKey="coach-progress-intelligence"
      defaultExpanded={true}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3">
        {insights.map((insight) => {
          const toneClasses = getToneClasses(insight.tone);
          const Icon = insight.icon;

          return (
            <div
              key={insight.key}
              className={`bg-(--surface-elevated) rounded-lg p-3 sm:p-4 border ${toneClasses.border}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded ${toneClasses.iconWrap}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-(--text-primary)">
                  {insight.title}
                </span>
              </div>
              <p className="text-sm text-(--text-secondary) leading-relaxed">
                {insight.message}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-(--text-muted)">
        <Brain className="w-3.5 h-3.5" />
        <span>
          Insights are shown only when there is enough data for reliable
          analysis.
        </span>
      </div>
    </CollapsibleSection>
  );
}
