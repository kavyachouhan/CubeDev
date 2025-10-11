/**
 * Skeleton Loader Components
 * Reusable skeleton loaders for better perceived performance
 */

export function ProfileSidebarSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Profile Card */}
      <div className="timer-card text-center">
        {/* Avatar */}
        <div className="mb-6">
          <div className="relative mx-auto w-32 h-32 rounded-full bg-[var(--surface-elevated)] border-4 border-[var(--border)]" />
        </div>

        {/* Name */}
        <div className="mb-4">
          <div className="h-8 bg-[var(--surface-elevated)] rounded w-3/4 mx-auto mb-2" />
          <div className="h-6 bg-[var(--surface-elevated)] rounded w-1/2 mx-auto" />
        </div>

        {/* Country */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="h-4 bg-[var(--surface-elevated)] rounded w-32" />
        </div>

        {/* Button */}
        <div className="mt-6">
          <div className="h-10 bg-[var(--surface-elevated)] rounded-lg w-48 mx-auto" />
        </div>
      </div>

      {/* Best Events Card */}
      <div className="timer-card">
        <div className="h-6 bg-[var(--surface-elevated)] rounded w-32 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]"
            >
              <div className="min-w-0 flex-1">
                <div className="h-4 bg-[var(--surface)] rounded w-24 mb-2" />
                <div className="h-3 bg-[var(--surface)] rounded w-16" />
              </div>
              <div className="text-right">
                <div className="h-4 bg-[var(--surface)] rounded w-12 mb-2" />
                <div className="h-3 bg-[var(--surface)] rounded w-8" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function EventStatsSkeleton() {
  return (
    <div className="timer-card animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-[var(--surface-elevated)] rounded w-40" />
        <div className="h-10 bg-[var(--surface-elevated)] rounded-lg w-32" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)]"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 bg-[var(--surface)] rounded-lg" />
              <div className="min-w-0 flex-1">
                <div className="h-3 bg-[var(--surface)] rounded w-16 mb-2" />
                <div className="h-5 bg-[var(--surface)] rounded w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PlatformStatsSkeleton() {
  return (
    <div className="timer-card animate-pulse">
      <div className="h-6 bg-[var(--surface-elevated)] rounded w-48 mb-4" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)]"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 bg-[var(--surface)] rounded-lg" />
              <div className="min-w-0 flex-1">
                <div className="h-3 bg-[var(--surface)] rounded w-16 mb-2" />
                <div className="h-5 bg-[var(--surface)] rounded w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CompetitionListSkeleton() {
  return (
    <div className="timer-card animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-[var(--surface-elevated)] rounded w-48" />
        <div className="h-5 bg-[var(--surface-elevated)] rounded w-20" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="p-4 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="h-5 bg-[var(--surface)] rounded w-3/4 mb-2" />
                <div className="flex items-center gap-4 mb-2">
                  <div className="h-4 bg-[var(--surface)] rounded w-32" />
                  <div className="h-4 bg-[var(--surface)] rounded w-24" />
                </div>
              </div>
              <div className="w-8 h-8 bg-[var(--surface)] rounded-lg ml-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeatmapSkeleton() {
  return (
    <div className="timer-card animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="h-6 bg-[var(--surface-elevated)] rounded w-48" />
        <div className="h-10 bg-[var(--surface-elevated)] rounded-lg w-64" />
      </div>

      <div className="space-y-4">
        {/* Heatmap grid */}
        <div className="grid grid-cols-12 gap-2">
          {Array.from({ length: 36 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded bg-[var(--surface-elevated)] border border-[var(--border)]"
            />
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between">
          <div className="h-4 bg-[var(--surface-elevated)] rounded w-32" />
          <div className="h-4 bg-[var(--surface-elevated)] rounded w-24" />
        </div>
      </div>
    </div>
  );
}
