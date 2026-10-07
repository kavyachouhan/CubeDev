"use client";

import { BarChart3 } from "lucide-react";
import { cx } from "@/lib/cx";
import { IconButton } from "@/components/ui/IconButton";
import { formatStatMs, type SessionStats } from "../../StatsDisplay";

/** One number in the strip: label and value side by side, so the row stays short. */
function StripStat({
  label,
  value,
  text,
  tone = "default",
  className,
}: {
  label: string;
  value?: number | null;
  text?: string;
  tone?: "primary" | "accent" | "muted" | "default";
  className?: string;
}) {
  const isDnf = value === Infinity;
  const display =
    text ??
    (value == null ? "–" : isFinite(value) ? formatStatMs(value) : "DNF");

  return (
    <div className={cx("flex items-baseline gap-1.5 min-w-0", className)}>
      <span className="type-overline shrink-0">{label}</span>
      <span
        className={cx(
          "type-time text-base font-semibold tabular-nums truncate",
          isDnf
            ? "text-(--error)"
            : value == null && !text
              ? "text-(--text-muted)"
              : tone === "primary"
                ? "text-(--primary)"
                : tone === "accent"
                  ? "text-(--accent)"
                  : tone === "muted"
                    ? "text-(--text-secondary)"
                    : "text-(--text-primary)",
        )}
      >
        {display}
      </span>
    </div>
  );
}

interface CompactStatsStripProps {
  stats: SessionStats;
  /** Opens the full session statistics dialog. */
  onOpenStats: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * One line of session numbers along the bottom edge.
 *
 * It sits at the natural thumb rest, so it carries no destructive action;
 * clearing times lives behind the recent-times sheet and a confirmation.
 * Narrow screens drop to the three numbers people actually glance at.
 */
export default function CompactStatsStrip({
  stats,
  onOpenStats,
  disabled = false,
  className,
}: CompactStatsStripProps) {
  const { bestTime, ao5, ao12, mean, standardDeviation, solveCount } = stats;

  return (
    <div
      className={cx("grid grid-cols-[1fr_auto] items-center gap-2", className)}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={onOpenStats}
        disabled={disabled}
        aria-label="Open session statistics"
        className="min-w-0 flex items-center justify-center gap-4 sm:gap-6 px-2 py-1.5 rounded-(--radius-panel) hover:bg-(--surface-elevated) transition-colors disabled:opacity-50"
      >
        <StripStat label="Best" value={bestTime} tone="primary" />
        <StripStat label="Ao5" value={ao5} tone="primary" />
        <StripStat
          label="Ao12"
          value={ao12}
          tone="primary"
          className="hidden sm:flex"
        />
        <StripStat label="Mean" value={mean} tone="accent" className="hidden sm:flex" />
        <StripStat
          label="σ"
          text={
            standardDeviation != null
              ? `±${formatStatMs(Math.round(standardDeviation / 10) * 10)}`
              : "–"
          }
          tone="muted"
          className="hidden md:flex"
        />
        <StripStat
          label="Solves"
          text={String(solveCount)}
          className="hidden sm:flex"
        />
      </button>

      <div className="flex items-center gap-1">
        <IconButton
          size="sm"
          disabled={disabled}
          aria-label="Session statistics"
          icon={<BarChart3 />}
          onClick={onOpenStats}
        />
      </div>
    </div>
  );
}
