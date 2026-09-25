"use client";

import { cx } from "@/lib/cx";
import { Skeleton, SkeletonCircle } from "@/components/ui/Skeleton";

/**
 * Loading placeholders shaped like the admin panels they stand in for. The
 * pulse and color come from the shared `Skeleton`; these only set the layout.
 */

/** @deprecated Use `Skeleton` from components/ui directly. */
export function SkeletonPulse({ className = "" }: { className?: string }) {
  return <Skeleton className={className} />;
}

/** Matches AdminStatCard. */
export function StatCardSkeleton() {
  return (
    <div className="bg-(--surface-elevated) rounded-(--radius-card) p-3 sm:p-4 border border-(--border)">
      <div className="flex items-center gap-2 sm:gap-3">
        <Skeleton radius="control" className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-3 w-20 mb-1.5" />
          <Skeleton className="h-5 w-16" />
        </div>
      </div>
    </div>
  );
}

export function StatCardsRowSkeleton({
  count = 4,
  className = "",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cx("grid grid-cols-2 lg:grid-cols-4 gap-3", className)}>
      {Array.from({ length: count }, (_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Matches AdminCollapsibleCard. */
export function CollapsibleCardSkeleton({
  height = "h-48",
  className = "",
}: {
  height?: string;
  className?: string;
}) {
  return (
    <div className={cx("timer-card", className)}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-6 w-6" />
      </div>
      <Skeleton radius="control" className={height} />
    </div>
  );
}

export function ListItemSkeleton({
  hasAvatar = false,
  className = "",
}: {
  hasAvatar?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex items-center gap-4 py-3 border-b border-(--border) last:border-0",
        className,
      )}
    >
      {hasAvatar && <SkeletonCircle className="w-10 h-10 shrink-0" />}
      <div className="flex-1 min-w-0">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

export function ListSkeleton({
  count = 5,
  hasAvatar = false,
  className = "",
}: {
  count?: number;
  hasAvatar?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }, (_, i) => (
        <ListItemSkeleton key={i} hasAvatar={hasAvatar} />
      ))}
    </div>
  );
}

export function BadgeCardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={cx(
        "bg-(--surface-elevated) rounded-(--radius-card) p-4 border border-(--border)",
        className,
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Skeleton radius="full" className="h-5 w-16" />
        <Skeleton radius="full" className="h-5 w-20" />
      </div>
      <Skeleton className="h-4 w-48 mb-1" />
      <Skeleton className="h-3 w-64" />
    </div>
  );
}

/** Bars of varied height, so a loading chart still reads as a chart. */
const CHART_BAR_HEIGHTS = ["45%", "70%", "35%", "80%", "55%", "65%", "40%"];

export function ChartSkeleton({
  height = "h-48",
  className = "",
}: {
  height?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cx(
        "bg-(--surface-elevated) rounded-(--radius-control)",
        height,
        className,
      )}
    >
      <div className="flex items-end justify-around h-full p-4 gap-2">
        {CHART_BAR_HEIGHTS.map((barHeight, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-b-none"
            style={{ height: barHeight }}
          />
        ))}
      </div>
    </div>
  );
}

export function FilterBarSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={cx("timer-card", className)}>
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton radius="control" className="flex-1 h-10" />
        <div className="flex gap-2">
          <Skeleton radius="control" className="h-10 w-24" />
          <Skeleton radius="control" className="h-10 w-24" />
        </div>
      </div>
    </div>
  );
}

/** Whole-page placeholder for an admin screen. */
export function AdminPageSkeleton({
  showStats = true,
  statsCount = 4,
  showCharts = true,
  showList = true,
}: {
  showStats?: boolean;
  statsCount?: number;
  showCharts?: boolean;
  showList?: boolean;
}) {
  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8">
      <div className="space-y-4 sm:space-y-6">
        <div className="timer-card">
          <Skeleton className="h-10 w-48" />
        </div>

        {showStats && <StatCardsRowSkeleton count={statsCount} />}

        {showCharts && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CollapsibleCardSkeleton height="h-56" />
            <CollapsibleCardSkeleton height="h-56" />
          </div>
        )}

        {showList && (
          <div className="timer-card">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-32" />
            </div>
            <ListSkeleton count={5} />
          </div>
        )}
      </div>
    </div>
  );
}
