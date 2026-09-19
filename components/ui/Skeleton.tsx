import type { CSSProperties, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { cardClasses } from "./card-styles";

type Radius = "badge" | "control" | "panel" | "card" | "full";

const RADIUS: Record<Radius, string> = {
  badge: "rounded-(--radius-badge)",
  control: "rounded-(--radius-control)",
  panel: "rounded-(--radius-panel)",
  card: "rounded-(--radius-card)",
  full: "rounded-full",
};

export interface SkeletonProps {
  className?: string;
  radius?: Radius;
  style?: CSSProperties;
}

/**
 * A placeholder block. Size it with width/height utilities so it matches the
 * content it stands in for; the pulse and color come from `.skeleton`.
 */
export function Skeleton({ className, radius = "badge", style }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cx("skeleton", RADIUS[radius], className)}
      style={style}
    />
  );
}

/** Lines of text; the last line is shorter so it reads as a paragraph. */
export function SkeletonText({
  lines = 3,
  className,
  lineClassName = "h-3.5",
}: {
  lines?: number;
  className?: string;
  lineClassName?: string;
}) {
  return (
    <div aria-hidden className={cx("space-y-2", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={cx(lineClassName, i === lines - 1 && lines > 1 ? "w-3/5" : "w-full")}
        />
      ))}
    </div>
  );
}

export function SkeletonCircle({ className = "w-10 h-10" }: { className?: string }) {
  return <Skeleton radius="full" className={className} />;
}

/** A card shell with a title bar and body lines — the default panel skeleton. */
export function SkeletonCard({
  lines = 3,
  className,
  children,
  label = "Loading",
}: {
  lines?: number;
  className?: string;
  children?: ReactNode;
  label?: string;
}) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cardClasses({ variant: "static", className })}
    >
      {children ?? (
        <>
          <Skeleton className="h-5 w-32 mb-4" />
          <SkeletonText lines={lines} />
        </>
      )}
    </div>
  );
}

/** Rows of list items: avatar/icon, two lines, trailing value. */
export function SkeletonList({
  rows = 5,
  className,
  withAvatar = false,
}: {
  rows?: number;
  className?: string;
  withAvatar?: boolean;
}) {
  return (
    <div aria-hidden className={cx("space-y-2", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-(--radius-control) border border-(--border)"
        >
          {withAvatar && <SkeletonCircle className="w-8 h-8 shrink-0" />}
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-4 w-14" />
        </div>
      ))}
    </div>
  );
}

/** Grid of stat tiles. */
export function SkeletonStats({
  count = 4,
  className = "grid grid-cols-2 sm:grid-cols-4 gap-3",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div aria-hidden className={className}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="p-3 sm:p-4 rounded-(--radius-panel) border border-(--border) bg-(--surface-elevated)"
        >
          <Skeleton className="h-2.5 w-16 mb-2" />
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}

/** Table-like rows with fixed columns. */
export function SkeletonTable({
  rows = 6,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div aria-hidden className={cx("space-y-3", className)}>
      <div className="flex gap-4 pb-2 border-b border-(--border)">
        {Array.from({ length: columns }, (_, c) => (
          <Skeleton key={c} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: columns }, (_, c) => (
            <Skeleton key={c} className={cx("h-4 flex-1", c === 0 && "max-w-40")} />
          ))}
        </div>
      ))}
    </div>
  );
}
