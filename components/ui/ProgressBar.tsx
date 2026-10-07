import type { ComponentProps, ReactNode } from "react";
import { cx } from "@/lib/cx";

export type ProgressTone = "primary" | "success" | "warning" | "error" | "accent";

const FILL: Record<ProgressTone, string> = {
  primary: "bg-(--primary)",
  success: "bg-(--success)",
  warning: "bg-(--warning)",
  error: "bg-(--error)",
  accent: "bg-(--accent)",
};

export interface ProgressBarProps {
  /** Current value, in the same unit as `max`. Clamped to 0…max. */
  value: number;
  max?: number;
  tone?: ProgressTone;
  size?: "sm" | "md";
  /**
   * A second position drawn as a thin rule across the track — the "where you
   * should be by now" tick on a goal, not a second fill.
   */
  marker?: { value: number; label?: string };
  /** Names the bar for screen readers; required since the track has no text. */
  label: string;
  /** Overrides the announced value, e.g. "3 of 5 solves". */
  valueText?: string;
  className?: string;
  rootProps?: ComponentProps<"div"> & Record<`data-${string}`, string>;
}

/**
 * A determinate progress track. Use it for anything that fills toward a known
 * total — goal progress, solves completed, tasks done. Transient work with no
 * known total is `Spinner`.
 */
export function ProgressBar({
  value,
  max = 100,
  tone = "primary",
  size = "md",
  marker,
  label,
  valueText,
  className,
  rootProps,
}: ProgressBarProps) {
  const safeMax = max > 0 ? max : 100;
  const clamped = Math.min(safeMax, Math.max(0, value));
  const percent = (clamped / safeMax) * 100;

  return (
    <div
      {...rootProps}
      role="progressbar"
      aria-label={label}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuetext={valueText}
      className={cx(
        "relative w-full overflow-hidden bg-(--surface-elevated) rounded-(--radius-badge)",
        size === "sm" ? "h-2" : "h-3 sm:h-4",
        className,
      )}
    >
      <div
        className={cx(
          "absolute inset-y-0 left-0 rounded-(--radius-badge) transition-[width] duration-(--duration-slow) ease-out",
          FILL[tone],
        )}
        style={{ width: `${percent}%` }}
      />
      {marker && (
        <div
          aria-hidden
          title={marker.label}
          className="absolute top-0 h-full w-0.5 bg-(--text-muted)"
          style={{
            left: `${Math.min(100, Math.max(0, (marker.value / safeMax) * 100))}%`,
          }}
        />
      )}
    </div>
  );
}

/** Label row above a bar: a name on the left, the readout on the right. */
export function ProgressLabel({
  children,
  value,
  className,
}: {
  children: ReactNode;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx("flex items-center justify-between gap-2 mb-2", className)}
    >
      <span className="type-caption min-w-0 truncate">{children}</span>
      <span className="type-caption shrink-0 font-medium">{value}</span>
    </div>
  );
}
