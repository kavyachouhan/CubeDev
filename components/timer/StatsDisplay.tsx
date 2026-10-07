"use client";

import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { cx } from "@/lib/cx";
import { CollapsibleCard, useCollapsed } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { TimerRecord } from "../../lib/stats-utils";
import SessionStatsModal from "./SessionStatsModal";
import {
  ExtendedStatsVisibility,
  DEFAULT_EXTENDED_STATS,
} from "./StatsVisibilitySettings";

interface StatsDisplayProps {
  history: TimerRecord[];
  selectedEvent: string;
  extendedStatsVisibility?: ExtendedStatsVisibility;
}

// Helpers to truncate/round to nearest centisecond (10 ms)
const truncToCentisMs = (ms: number) => Math.floor(ms / 10) * 10; // singles: truncate
const roundToCentisMs = (ms: number) => Math.round(ms / 10) * 10; // averages: round

// Format milliseconds to string (M:SS.ss or SS.ss)
export const formatStatMs = (ms: number) => {
  if (!isFinite(ms)) return "DNF";
  const total = ms / 1000;
  const m = Math.floor(total / 60);
  const s = (total % 60).toFixed(2);
  return m > 0 ? `${m}:${s.padStart(5, "0")}` : s;
};

const METRIC_TONE = {
  primary: "text-(--primary)",
  accent: "text-(--accent)",
  error: "text-(--error)",
  muted: "text-(--text-secondary)",
  default: "text-(--text-primary)",
} as const;

/** One statistic: overline label over a monospace value. DNF averages turn red. */
export function Metric({
  label,
  value,
  text,
  tone = "default",
  size = "md",
}: {
  label: string;
  /** Milliseconds; null renders a dash, Infinity renders DNF. */
  value?: number | null;
  /** Preformatted value (counts, ± deviation). */
  text?: string;
  tone?: keyof typeof METRIC_TONE;
  size?: "sm" | "md";
}) {
  const isDnf = value === Infinity;
  const display =
    text ?? (value == null ? "–" : isFinite(value) ? formatStatMs(value) : "DNF");
  return (
    <div className="text-center min-w-0">
      <p className="type-overline truncate">{label}</p>
      <p
        className={cx(
          "type-time font-bold mt-0.5 truncate",
          size === "sm" ? "text-base" : "text-lg sm:text-xl",
          isDnf ? "text-(--error)" : value == null && !text ? "text-(--text-muted)" : METRIC_TONE[tone],
        )}
      >
        {display}
      </p>
    </div>
  );
}

/**
 * Session statistics for one event.
 *
 * Pure derivation, so any layout can render the same numbers in whatever shape
 * it needs (a card grid, a one-line strip) without recomputing them differently.
 */
export function useSessionStats(
  history: TimerRecord[],
  selectedEvent: string,
) {
  // Filter history to selected event
  const eventHistory = history.filter((r) => r.event === selectedEvent);

  // Order by timestamp ascending
  const ordered = [...eventHistory].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  // Extract truncated singles (ignore DNFs) for best/worst/mean calculations
  const truncatedSingles = ordered
    .filter((r) => isFinite(r.finalTime))
    .map((r) => truncToCentisMs(r.finalTime));

  const bestTime = truncatedSingles.length
    ? Math.min(...truncatedSingles)
    : null;
  const worstTime = truncatedSingles.length
    ? Math.max(...truncatedSingles)
    : null;

  // WCA Average of N calculation (N=5 or 12)
  const wcaAverageN = (n: number): number | null => {
    if (ordered.length < n) return null;

    // Last N consecutive results (DNFs included)
    const lastN = ordered.slice(-n);

    // Use truncated singles for calculation
    const values = lastN.map((r) =>
      isFinite(r.finalTime) ? truncToCentisMs(r.finalTime) : Infinity
    );

    const dnfs = values.filter((v) => !isFinite(v)).length;
    if (dnfs >= 2) return Infinity; // average is DNF if 2 or more DNFs

    // Sort values to drop best and worst
    const sorted = [...values].sort((a, b) => a - b);

    // Drop best and worst
    sorted.shift(); // drop best
    sorted.pop(); // drop worst

    // Calculate average of remaining
    const sum = sorted.reduce((acc, v) => acc + (isFinite(v) ? v : 0), 0);
    const avg = sum / (n - 2);

    // Average of N is rounded to 0.01 s
    return roundToCentisMs(avg);
  };

  const ao5 = wcaAverageN(5);
  const ao12 = wcaAverageN(12);
  const ao25 = wcaAverageN(25);
  const ao50 = wcaAverageN(50);
  const ao100 = wcaAverageN(100);

  // Current mean of 3 (rounded to 0.01 s for display)
  const mo3 = (() => {
    if (ordered.length < 3) return null;

    // Last 3 consecutive results (DNFs included)
    const last3 = ordered.slice(-3);

    // Use truncated singles for calculation
    const values = last3.map((r) =>
      isFinite(r.finalTime) ? truncToCentisMs(r.finalTime) : Infinity
    );

    // If any DNF, mean of 3 is DNF
    if (values.some((v) => !isFinite(v))) return Infinity;

    // Calculate mean of 3
    const sum = values.reduce((acc, v) => acc + v, 0);
    const mean = sum / 3;

    // Mean of 3 is rounded to 0.01 s
    return roundToCentisMs(mean);
  })();

  // Session mean (rounded to 0.01 s for display)
  const mean = truncatedSingles.length
    ? roundToCentisMs(
        truncatedSingles.reduce((a, b) => a + b, 0) / truncatedSingles.length
      )
    : null;

  // Standard deviation (Rounded to 0.01 s for display)
  const standardDeviation =
    truncatedSingles.length > 1 && mean != null
      ? Math.sqrt(
          truncatedSingles.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) /
            (truncatedSingles.length - 1)
        )
      : null;

  const dnfCount = ordered.filter((r) => !isFinite(r.finalTime)).length;
  const currentSessionSolves = ordered.length;

  return {
    bestTime,
    worstTime,
    ao5,
    ao12,
    ao25,
    ao50,
    ao100,
    mo3,
    mean,
    standardDeviation,
    dnfCount,
    solveCount: currentSessionSolves,
  };
}

export type SessionStats = ReturnType<typeof useSessionStats>;

/** The statistics grid, without any card chrome. */
export function StatsBody({
  stats,
  extendedStatsVisibility = DEFAULT_EXTENDED_STATS,
}: {
  stats: SessionStats;
  extendedStatsVisibility?: ExtendedStatsVisibility;
}) {
  const {
    bestTime,
    worstTime,
    ao5,
    ao12,
    ao25,
    ao50,
    ao100,
    mo3,
    mean,
    standardDeviation,
    dnfCount,
    solveCount: currentSessionSolves,
  } = stats;

  const extended = (
    [
      ["ao25", "Current Ao25", ao25],
      ["ao50", "Current Ao50", ao50],
      ["ao100", "Current Ao100", ao100],
    ] as const
  ).filter(([key]) => extendedStatsVisibility[key]);

  return (
    <div className="space-y-5">
    <div className="grid grid-cols-3 gap-x-3 gap-y-4">
      <Metric label="Best Single" value={bestTime} tone="primary" />
      <Metric label="Current Mo3" value={mo3} tone="primary" />
      <Metric label="Current Ao5" value={ao5} tone="primary" />
      <Metric label="Worst Single" value={worstTime} tone="error" />
      <Metric label="Current Ao12" value={ao12} tone="primary" />
      <Metric label="Session Mean" value={mean} tone="accent" />
    </div>

    {extended.length > 0 && (
      <div
        className={`grid gap-3 pt-4 border-t border-(--border) ${
          extended.length === 1
            ? "grid-cols-1"
            : extended.length === 2
              ? "grid-cols-2"
              : "grid-cols-3"
        }`}
      >
        {extended.map(([key, label, value]) => (
          <Metric key={key} label={label} value={value} tone="primary" />
        ))}
      </div>
    )}

    <div className="grid grid-cols-3 gap-3 pt-4 border-t border-(--border)">
      <Metric label="Solves" text={String(currentSessionSolves)} size="sm" />
      <Metric
        label="Std Dev"
        text={
          standardDeviation != null
            ? `± ${formatStatMs(roundToCentisMs(standardDeviation))}`
            : "–"
        }
        size="sm"
        tone="muted"
      />
      <Metric
        label="DNFs"
        text={String(dnfCount)}
        size="sm"
        tone={dnfCount > 0 ? "error" : "muted"}
      />
      </div>
    </div>
  );
}

export default function StatsDisplay({
  history,
  selectedEvent,
  extendedStatsVisibility = DEFAULT_EXTENDED_STATS,
}: StatsDisplayProps) {
  const { open: showStats, onOpenChange: setShowStats } = useCollapsed(
    "cubelab-stats-display-expanded",
    true,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const stats = useSessionStats(history, selectedEvent);

  return (
    <>
      <CollapsibleCard
        title="Statistics"
        open={showStats}
        onOpenChange={setShowStats}
        actions={
          <IconButton
            size="sm"
            aria-label="Session statistics"
            icon={<BarChart3 />}
            onClick={() => setIsModalOpen(true)}
          />
        }
      >
        <StatsBody
          stats={stats}
          extendedStatsVisibility={extendedStatsVisibility}
        />
      </CollapsibleCard>

      <SessionStatsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        history={history}
        selectedEvent={selectedEvent}
        extendedStatsVisibility={extendedStatsVisibility}
      />
    </>
  );
}
