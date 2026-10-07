export function ImportExportSkeleton() {
  return (
    <div className="timer-card animate-pulse">
      <div className="flex items-center justify-between gap-3">
        <div className="h-10 skeleton-box rounded-(--radius-control) w-32" />
        <div className="h-10 skeleton-box rounded-(--radius-control) w-32" />
      </div>
    </div>
  );
}

export function SessionManagerSkeleton() {
  return (
    <div className="timer-card animate-pulse">
      {/* Header with title and show/hide button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          <div className="h-6 skeleton-box rounded w-24" />
        </div>
        <div className="h-7 w-7 skeleton-box rounded-(--radius-badge)" />
      </div>

      {/* Dropdown skeleton */}
      <div className="pb-4">
        <div className="h-14 skeleton-box rounded-(--radius-control) w-full" />
      </div>
    </div>
  );
}

export function EventSelectorSkeleton() {
  return (
    <div className="timer-card animate-pulse">
      {/* Header with title and show/hide button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          <div className="h-6 skeleton-box rounded w-20" />
        </div>
        <div className="h-7 w-7 skeleton-box rounded-(--radius-badge)" />
      </div>

      {/* Dropdown skeleton */}
      <div className="pb-4">
        <div className="h-14 skeleton-box rounded-(--radius-control) w-full" />
      </div>
    </div>
  );
}

export function ScrambleDisplaySkeleton() {
  return (
    <div className="timer-card animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 skeleton-box rounded w-32" />
        <div className="h-9 skeleton-box rounded-(--radius-control) w-24" />
      </div>
      <div className="skeleton-box-subtle rounded-(--radius-control) p-4 min-h-[80px] flex items-center justify-center">
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
        <div className="h-8 skeleton-box rounded-(--radius-control) w-20" />
      </div>
      <div className="text-center space-y-6 min-h-[280px] sm:min-h-[320px] md:min-h-[360px] flex flex-col justify-center">
        {/* Timer Display */}
        <div className="h-24 sm:h-32 md:h-40 skeleton-box rounded-(--radius-control) mx-auto w-3/4" />
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
      <div className="w-full min-h-[180px] sm:min-h-[200px] skeleton-box-subtle rounded-(--radius-control) flex items-center justify-center border border-(--border)">
        <div className="h-10 skeleton-box rounded-(--radius-badge) w-40" />
      </div>
    </div>
  );
}

export function StatsDisplaySkeleton() {
  return (
    <div className="timer-card animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 skeleton-box rounded w-32" />
        <div className="h-8 skeleton-box rounded-(--radius-control) w-20" />
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
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-(--border)">
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
        <div className="h-8 skeleton-box rounded-(--radius-control) w-20" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="p-3 skeleton-box-subtle rounded-(--radius-control) border border-(--border)"
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

function CardsTimerSkeleton() {
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

/** Mirrors the compact grid, so the shell does not jump when data arrives. */
function CompactTimerSkeleton() {
  return (
    <div className="h-full overflow-hidden flex flex-col animate-pulse">
      <div className="shrink-0 h-14 px-3 flex items-center gap-2 border-b border-(--border)">
        <div className="h-9 w-24 skeleton-box rounded-(--radius-control)" />
        <div className="h-9 w-36 skeleton-box rounded-(--radius-control)" />
        <div className="flex-1" />
        <div className="h-9 w-9 skeleton-box rounded-(--radius-control)" />
      </div>

      <div className="shrink-0 px-3 py-3 border-b border-(--border)">
        <div className="h-5 w-3/4 mx-auto skeleton-box rounded-(--radius-badge)" />
      </div>

      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 min-w-0 flex items-center justify-center p-3">
          <div className="h-24 w-56 skeleton-box rounded-(--radius-panel)" />
        </div>
        <div className="hidden lg:flex w-72 xl:w-80 shrink-0 flex-col gap-3 border-l border-(--border) p-3">
          <div className="h-45 skeleton-box rounded-(--radius-panel)" />
          <div className="flex-1 skeleton-box rounded-(--radius-panel)" />
        </div>
      </div>

      <div className="shrink-0 h-14 px-3 flex items-center gap-6 border-t border-(--border)">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-6 w-14 skeleton-box rounded-(--radius-badge)" />
        ))}
      </div>
    </div>
  );
}

/**
 * The loading shell, shaped like whichever layout is about to render.
 *
 * The layout attribute is set pre-hydration by the blocking script in the root
 * layout, so even the skeleton has the right shape on the first paint.
 */
export function TimerPageSkeleton() {
  const layout =
    typeof document !== "undefined"
      ? document.documentElement.dataset.timerLayout
      : "compact";

  return layout === "cards" ? <CardsTimerSkeleton /> : <CompactTimerSkeleton />;
}
