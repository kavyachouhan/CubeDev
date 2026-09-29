import type { ComponentProps, ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cx } from "@/lib/cx";

export type StatTone =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "error"
  | "accent";

const VALUE_TONE: Record<StatTone, string> = {
  default: "text-(--text-primary)",
  primary: "text-(--primary)",
  success: "text-(--success)",
  warning: "text-(--warning)",
  error: "text-(--error)",
  accent: "text-(--accent)",
};

export interface StatTileProps {
  label: ReactNode;
  value: ReactNode;
  icon?: ReactNode;
  /** Secondary line under the value. */
  hint?: ReactNode;
  tone?: StatTone;
  /** Trend indicator. `good` decides color: for times, down is good. */
  trend?: { direction: "up" | "down" | "flat"; label: ReactNode; good?: boolean };
  /** Monospace + tabular numerals; on by default since most stats are times. */
  mono?: boolean;
  size?: "sm" | "md" | "lg";
  /**
   * Layout below `sm`. `row` puts the label and value on one line (label
   * left, value right) instead of stacking them in a narrow box — use it
   * whenever three or more tiles would otherwise share a phone row, since
   * `type-overline` is uppercase and tracked and wraps badly under ~110px.
   */
  mobileLayout?: "tile" | "row";
  className?: string;
  /** Extra attributes for the root element, e.g. `data-tour`. */
  rootProps?: ComponentProps<"div"> & Record<`data-${string}`, string>;
}

/** A single metric: label, big value, optional trend. Sits inside a card. */
export function StatTile({
  label,
  value,
  icon,
  hint,
  tone = "default",
  trend,
  mono = true,
  size = "md",
  mobileLayout = "tile",
  className,
  rootProps,
}: StatTileProps) {
  const asRow = mobileLayout === "row";
  const TrendIcon =
    trend?.direction === "up"
      ? ArrowUpRight
      : trend?.direction === "down"
        ? ArrowDownRight
        : Minus;

  return (
    <div
      {...rootProps}
      className={cx(
        "min-w-0 rounded-(--radius-panel) border border-(--border) bg-(--surface-elevated)",
        asRow
          ? cx(
              "flex items-center justify-between gap-3 px-3 py-2.5 sm:block",
              size === "sm" ? "sm:p-3" : "sm:p-4",
            )
          : size === "sm"
            ? "p-3"
            : "p-3 sm:p-4",
        className,
      )}
    >
      <div
        className={cx(
          "flex gap-1.5 min-w-0",
          asRow ? "items-center sm:items-start" : "items-start",
        )}
      >
        {icon && (
          <span
            className={cx(
              "shrink-0 text-(--text-muted) [&_svg]:w-3.5 [&_svg]:h-3.5",
              asRow ? "sm:mt-0.5" : "mt-0.5",
            )}
          >
            {icon}
          </span>
        )}
        {/* Wraps rather than truncates: an ellipsis on an uppercase, tracked
            label eats most of the word ("SUC…" for "Success"). */}
        <span
          className="type-overline leading-tight wrap-anywhere"
          title={typeof label === "string" ? label : undefined}
        >
          {label}
        </span>
      </div>
      <div className={cx(asRow && "flex items-baseline gap-2 min-w-0 sm:block")}>
        <div
          className={cx(
            "font-bold truncate",
            asRow ? "sm:mt-1" : "mt-1",
            mono ? "type-time" : "font-inter",
            size === "sm" ? "text-base" : size === "lg" ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl",
            VALUE_TONE[tone],
          )}
        >
          {value}
        </div>
        {(hint || trend) && (
          <div
            className={cx(
              "flex items-center gap-2 min-w-0",
              asRow ? "sm:mt-1" : "mt-1",
            )}
          >
            {trend && (
              <span
                className={cx(
                  "inline-flex items-center gap-0.5 text-xs font-medium whitespace-nowrap",
                  trend.good === undefined
                    ? "text-(--text-muted)"
                    : trend.good
                      ? "text-(--success)"
                      : "text-(--error)",
                )}
              >
                <TrendIcon className="w-3.5 h-3.5" aria-hidden />
                {trend.label}
              </span>
            )}
            {hint && <span className="type-caption truncate">{hint}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
