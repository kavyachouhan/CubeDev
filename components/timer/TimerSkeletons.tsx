export function ImportExportSkeleton() {
  return (
    <div className="timer-card animate-pulse">
      <div className="flex items-center justify-between gap-3">
        <div className="h-10 skeleton-box rounded-lg w-32" />
        <div className="h-10 skeleton-box rounded-lg w-32" />
      </div>
    </div>
  );
}

export function SessionManagerSkeleton() {
  return (
    <div className="timer-card animate-pulse">
      <div className="h-5 skeleton-box rounded w-24 mb-3" />
      <div className="space-y-3">
        <div className="h-10 skeleton-box rounded-lg w-full" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-8 skeleton-box rounded-lg" />
          <div className="h-8 skeleton-box rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function EventSelectorSkeleton() {
  return (
    <div className="timer-card animate-pulse">
      <div className="h-5 skeleton-box rounded w-24 mb-3" />
      <div className="h-10 skeleton-box rounded-lg w-full mb-3" />
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="aspect-square skeleton-box rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function ScrambleDisplaySkeleton() {
  return (
    <div className="timer-card animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 skeleton-box rounded w-32" />
        <div className="h-9 skeleton-box rounded-lg w-24" />
      </div>
      <div className="skeleton-box-subtle rounded-lg p-4 min-h-[80px] flex items-center justify-center">
        <div className="h-6 skeleton-box rounded w-3/4" />
      </div>
    </div>
  );
}

export function TimerDisplaySkeleton() {
  return (
    <div className="timer-card animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 skeleton-box rounded w-24" />
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 skeleton-box rounded" />
          <div className="w-6 h-6 skeleton-box rounded" />
        </div>
      </div>
      <div className="text-center space-y-6 min-h-[280px] sm:min-h-[320px] md:min-h-[360px] flex flex-col justify-center">
        {/* Timer Display */}
        <div className="h-24 sm:h-32 md:h-40 skeleton-box rounded-lg mx-auto w-3/4" />
        {/* Status Text */}
        <div className="h-4 skeleton-box rounded w-2/3 mx-auto" />
      </div>
    </div>
  );
}

export function ScramblePreviewSkeleton() {
  return (
    <div className="timer-card animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 skeleton-box rounded w-40" />
      </div>
      <div className="w-full min-h-[180px] sm:min-h-[200px] skeleton-box-subtle rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 skeleton-box rounded-lg mx-auto mb-2" />
          <div className="h-4 skeleton-box rounded w-32 mx-auto" />
        </div>
      </div>
    </div>
  );
}

export function StatsDisplaySkeleton() {
  return (
    <div className="timer-card animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 skeleton-box rounded w-32" />
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 skeleton-box rounded" />
          <div className="w-6 h-6 skeleton-box rounded" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="text-center">
            <div className="h-3 skeleton-box rounded w-20 mx-auto mb-2" />
            <div className="h-6 skeleton-box rounded w-16 mx-auto" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 mb-6">
        <div className="text-center">
          <div className="h-3 skeleton-box rounded w-24 mx-auto mb-2" />
          <div className="h-6 skeleton-box rounded w-12 mx-auto" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border)]">
        {[1, 2].map((i) => (
          <div key={i} className="text-center">
            <div className="h-3 skeleton-box rounded w-28 mx-auto mb-2" />
            <div className="h-5 skeleton-box rounded w-16 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TimerHistorySkeleton() {
  return (
    <div className="timer-card animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 skeleton-box rounded w-32" />
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 skeleton-box rounded" />
          <div className="w-4 h-4 skeleton-box rounded" />
        </div>
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="p-3 skeleton-box-subtle rounded-lg border border-[var(--border)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="h-5 skeleton-box rounded w-8" />
                <div className="h-6 skeleton-box rounded w-20" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 skeleton-box rounded" />
                <div className="w-8 h-8 skeleton-box rounded" />
                <div className="w-8 h-8 skeleton-box rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TimerPageSkeleton() {
  return (
    <div className="container-responsive py-4 md:py-8">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
        {/* Left Column - Controls */}
        <div className="xl:col-span-2 space-y-4 md:space-y-6">
          {/* Import/Export */}
          <ImportExportSkeleton />

          {/* Session & Event Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 items-start">
            <SessionManagerSkeleton />
            <EventSelectorSkeleton />
          </div>

          {/* Scramble */}
          <ScrambleDisplaySkeleton />

          {/* Timer */}
          <TimerDisplaySkeleton />
        </div>

        {/* Right Column - Stats & Visualization */}
        <div className="xl:col-span-2 space-y-4 md:space-y-6 order-last xl:order-none">
          {/* Scramble Preview */}
          <ScramblePreviewSkeleton />

          {/* Stats */}
          <StatsDisplaySkeleton />

          {/* History */}
          <TimerHistorySkeleton />
        </div>
      </div>
    </div>
  );
}