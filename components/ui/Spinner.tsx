import { Loader2 } from "lucide-react";
import { cx } from "@/lib/cx";

const SIZES = {
  xs: "w-3.5 h-3.5",
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
} as const;

export interface SpinnerProps {
  size?: keyof typeof SIZES;
  /** Accessible label. Omit when a parent already announces the busy state. */
  label?: string;
  className?: string;
}

/** The one loading indicator. Inherits color from `currentColor`. */
export function Spinner({ size = "sm", label, className }: SpinnerProps) {
  return (
    <Loader2
      className={cx("animate-spin shrink-0", SIZES[size], className)}
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}

/** Centered spinner with an optional caption, for page and panel loading. */
export function LoadingState({
  label = "Loading…",
  className,
  size = "lg",
}: {
  label?: string;
  className?: string;
  size?: keyof typeof SIZES;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cx(
        "flex flex-col items-center justify-center gap-3 py-12 text-(--text-muted)",
        className,
      )}
    >
      <Spinner size={size} className="text-(--primary)" />
      <p className="type-caption">{label}</p>
    </div>
  );
}
