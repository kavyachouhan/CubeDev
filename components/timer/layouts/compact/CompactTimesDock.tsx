"use client";

import { BarChart3, ChevronRight } from "lucide-react";
import { cx } from "@/lib/cx";
import { IconButton } from "@/components/ui/IconButton";
import { TimeValue } from "@/components/ui/TimeValue";
import type { TimerRecord } from "@/lib/stats-utils";
import { formatSolveTime } from "../../SolveDetailsModal";
import { formatStatMs, type SessionStats } from "../../StatsDisplay";

/** How many solves fit a scroll row before it stops being a glance. */
const VISIBLE_SOLVES = 12;

function StripStat({
  label,
  value,
  tone = "default",
  className,
}: {
  label: string;
  value?: number | null;
  tone?: "primary" | "accent" | "default";
  className?: string;
}) {
  const isDnf = value === Infinity;
  const display =
    value == null ? "–" : isFinite(value) ? formatStatMs(value) : "DNF";

  return (
    <div className={cx("flex items-baseline gap-1.5 min-w-0", className)}>
      <span className="type-overline shrink-0">{label}</span>
      <span
        className={cx(
          "type-time text-base font-semibold tabular-nums",
          isDnf
            ? "text-(--error)"
            : value == null
              ? "text-(--text-muted)"
              : tone === "accent"
                ? "text-(--accent)"
                : "text-(--primary)",
        )}
      >
        {display}
      </span>
    </div>
  );
}

interface CompactTimesDockProps {
  solves: TimerRecord[];
  stats: SessionStats;
  selectedEvent: string;
  /** Opens the full solve list. */
  onOpenHistory: () => void;
  /** Opens the full session statistics. */
  onOpenStats: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * The bottom dock on phones: recent times, then the session averages.
 *
 * The times are shown rather than hidden behind a button. A solve list you
 * have to go looking for is a solve list nobody looks at, and the first thing
 * anyone wants after stopping the timer is to see the time land next to the
 * previous ones.
 */
export default function CompactTimesDock({
  solves,
  stats,
  selectedEvent,
  onOpenHistory,
  onOpenStats,
  disabled = false,
  className,
}: CompactTimesDockProps) {
  const eventSolves = solves
    .filter((solve) => solve.event === selectedEvent)
    .slice(0, VISIBLE_SOLVES);

  return (
    <div
      className={cx("flex flex-col", className)}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      {/* Recent times, newest first */}
      <div className="flex items-center gap-1 h-11">
        {eventSolves.length === 0 ? (
          <p className="type-caption px-1">
            Your times will appear here as you solve.
          </p>
        ) : (
          <>
            <ol
              aria-label="Recent times"
              className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto scrollbar-hide"
            >
              {eventSolves.map((solve, index) => (
                <li key={solve.id} className="shrink-0">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={onOpenHistory}
                    aria-label={`Solve ${eventSolves.length - index}: ${formatSolveTime(
                      solve.finalTime,
                      solve.penalty,
                    )}. Open solve list`}
                    className="px-2.5 py-1 rounded-(--radius-control) bg-(--surface-elevated) border border-(--border) hover:border-(--border-hover) transition-colors disabled:opacity-50"
                  >
                    <TimeValue
                      penalty={solve.penalty}
                      className="text-sm font-semibold tabular-nums"
                    >
                      {formatSolveTime(solve.finalTime, solve.penalty)}
                      {solve.penalty === "+2" && "+"}
                    </TimeValue>
                  </button>
                </li>
              ))}
            </ol>
            <IconButton
              size="sm"
              disabled={disabled}
              aria-label="All recent times"
              icon={<ChevronRight />}
              onClick={onOpenHistory}
            />
          </>
        )}
      </div>

      {/* Session averages */}
      <div className="flex items-center gap-2 h-11 border-t border-(--border)">
        <button
          type="button"
          onClick={onOpenStats}
          disabled={disabled}
          aria-label="Open session statistics"
          className="flex-1 min-w-0 flex items-center justify-center gap-5 rounded-(--radius-panel) py-1 hover:bg-(--surface-elevated) transition-colors disabled:opacity-50"
        >
          <StripStat label="Best" value={stats.bestTime} />
          <StripStat label="Ao5" value={stats.ao5} />
          <StripStat label="Ao12" value={stats.ao12} />
          <StripStat
            label="Mean"
            value={stats.mean}
            tone="accent"
            className="hidden sm:flex"
          />
        </button>
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
