export function StatsFiltersSkeleton() {
  return (
    <div className="timer-card animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <div className="h-4 skeleton-box rounded w-20 mb-2" />
            <div className="h-10 skeleton-box rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TimeProgressChartSkeleton() {
  return (
    <div className="timer-card animate-pulse">
      <div className="h-6 skeleton-box rounded w-48 mb-4" />
      <div className="h-64 skeleton-box-subtle rounded-lg" />
    </div>
  );
}

export function PersonalBestsCardSkeleton() {
  return (
    <div className="timer-card animate-pulse">
      <div className="h-6 skeleton-box rounded w-40 mb-4" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-4 skeleton-box rounded w-24" />
            <div className="h-4 skeleton-box rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TimeDistributionChartSkeleton() {
  return (
    <div className="timer-card animate-pulse">
      <div className="h-6 skeleton-box rounded w-48 mb-4" />
      <div className="h-64 skeleton-box-subtle rounded-lg" />
    </div>
  );
}

export function SolveHeatmapSkeleton() {
  return (
    <div className="timer-card animate-pulse">
      <div className="h-6 skeleton-box rounded w-40 mb-4" />
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 52 }).map((_, i) => (
          <div key={i} className="aspect-square skeleton-box rounded" />
        ))}
      </div>
      <div className="flex items-center justify-between mt-4">
        <div className="h-4 skeleton-box rounded w-32" />
        <div className="h-4 skeleton-box rounded w-24" />
      </div>
    </div>
  );
}

export function StatsPageSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Filters Skeleton */}
      <StatsFiltersSkeleton />

      {/* Time Progress Chart Skeleton */}
      <TimeProgressChartSkeleton />

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PersonalBestsCardSkeleton />
        <TimeDistributionChartSkeleton />
      </div>

      {/* Heatmap Skeleton */}
      <SolveHeatmapSkeleton />
    </div>
  );
}