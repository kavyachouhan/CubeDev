import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export type Penalty = "none" | "+2" | "DNF" | null | undefined;

/** Text color for a solve with the given penalty, from the penalty tokens. */
export function penaltyTextClass(penalty: Penalty) {
  if (penalty === "DNF") return "penalty-dnf-text";
  if (penalty === "+2") return "penalty-plus2-text";
  return "text-(--text-primary)";
}

export interface TimeValueProps {
  /** Already-formatted time, e.g. "12.34", "12.34+" or "DNF". */
  children: ReactNode;
  penalty?: Penalty;
  /** Highlight as a personal best. */
  best?: boolean;
  /** Muted, for excluded (bracketed) times in averages. */
  muted?: boolean;
  className?: string;
}

/** A solve time: monospace, tabular digits, penalty-aware color. */
export function TimeValue({
  children,
  penalty,
  best,
  muted,
  className,
}: TimeValueProps) {
  return (
    <span
      className={cx(
        "type-time",
        muted
          ? "text-(--text-muted)"
          : best && (!penalty || penalty === "none")
            ? "text-(--success)"
            : penaltyTextClass(penalty),
        className,
      )}
    >
      {children}
    </span>
  );
}
