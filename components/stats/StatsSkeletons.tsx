import { Skeleton, SkeletonCard, SkeletonStats } from "@/components/ui/Skeleton";

export function StatsFiltersSkeleton() {
  return (
    <SkeletonCard label="Loading filters">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton radius="control" className="h-10" />
          </div>
        ))}
      </div>
    </SkeletonCard>
  );
}

export function TimeProgressChartSkeleton() {
  return (
    <SkeletonCard label="Loading time progress">
      <Skeleton className="h-5 w-40 mb-4" />
      <SkeletonStats count={4} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4" />
      <Skeleton radius="panel" className="h-48 lg:h-64" />
    </SkeletonCard>
  );
}

export function PersonalBestsCardSkeleton() {
  return (
    <SkeletonCard label="Loading personal bests">
      <Skeleton className="h-5 w-36 mb-4" />
      <SkeletonStats count={3} className="grid grid-cols-3 gap-3 mb-4" />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} radius="control" className="h-16" />
        ))}
      </div>
    </SkeletonCard>
  );
}

export function TimeDistributionChartSkeleton() {
  return (
    <SkeletonCard label="Loading time distribution">
      <Skeleton className="h-5 w-40 mb-4" />
      <SkeletonStats count={2} className="grid grid-cols-2 gap-3 mb-4" />
      <Skeleton radius="panel" className="h-56" />
    </SkeletonCard>
  );
}

export function SolveHeatmapSkeleton() {
  return (
    <SkeletonCard label="Loading solve activity">
      <Skeleton className="h-5 w-36 mb-4" />
      <SkeletonStats count={4} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4" />
      <Skeleton radius="panel" className="h-40" />
    </SkeletonCard>
  );
}

export function StatsPageSkeleton() {
  return (
    <div className="container-responsive py-4 md:py-8 space-y-4 md:space-y-6">
      <StatsFiltersSkeleton />
      <TimeProgressChartSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <PersonalBestsCardSkeleton />
        <TimeDistributionChartSkeleton />
      </div>
      <SolveHeatmapSkeleton />
    </div>
  );
}
