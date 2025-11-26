export function ProfileSidebarSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Profile Card */}
      <div className="timer-card text-center">
        {/* Avatar */}
        <div className="mb-6">
          <div className="relative mx-auto w-32 h-32 rounded-full skeleton-box border-4 border-[var(--border)]" />
        </div>

        {/* Name */}
        <div className="mb-4">
          <div className="h-8 skeleton-box rounded w-3/4 mx-auto mb-2" />
          <div className="h-6 skeleton-box rounded w-1/2 mx-auto" />
        </div>

        {/* Country */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="h-4 skeleton-box rounded w-32" />
        </div>

        {/* Button */}
        <div className="mt-6">
          <div className="h-10 skeleton-box rounded-lg w-48 mx-auto" />
        </div>
      </div>

      {/* Best Events Card */}
      <div className="timer-card">
        <div className="h-6 skeleton-box rounded w-32 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 skeleton-box-subtle rounded-lg border border-[var(--border)]"
            >
              <div className="min-w-0 flex-1">
                <div className="h-4 skeleton-box rounded w-24 mb-2" />
                <div className="h-3 skeleton-box rounded w-16" />
              </div>
              <div className="text-right">
                <div className="h-4 skeleton-box rounded w-12 mb-2" />
                <div className="h-3 skeleton-box rounded w-8" />
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
        <div className="h-6 skeleton-box rounded w-40" />
        <div className="h-10 skeleton-box rounded-lg w-32" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="skeleton-box-subtle rounded-xl p-3 sm:p-4 border border-[var(--border)]"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 skeleton-box rounded-lg" />
              <div className="min-w-0 flex-1">
                <div className="h-3 skeleton-box rounded w-16 mb-2" />
                <div className="h-5 skeleton-box rounded w-20" />
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
      <div className="h-6 skeleton-box rounded w-48 mb-4" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="skeleton-box-subtle rounded-xl p-3 sm:p-4 border border-[var(--border)]"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 skeleton-box rounded-lg" />
              <div className="min-w-0 flex-1">
                <div className="h-3 skeleton-box rounded w-16 mb-2" />
                <div className="h-5 skeleton-box rounded w-12" />
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
        <div className="h-6 skeleton-box rounded w-48" />
        <div className="h-5 skeleton-box rounded w-20" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="p-4 skeleton-box-subtle rounded-lg border border-[var(--border)]"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="h-5 skeleton-box rounded w-3/4 mb-2" />
                <div className="flex items-center gap-4 mb-2">
                  <div className="h-4 skeleton-box rounded w-32" />
                  <div className="h-4 skeleton-box rounded w-24" />
                </div>
              </div>
              <div className="w-8 h-8 skeleton-box rounded-lg ml-3" />
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
        <div className="h-6 skeleton-box rounded w-48" />
        <div className="h-10 skeleton-box rounded-lg w-64" />
      </div>

      <div className="space-y-4">
        {/* Heatmap grid */}
        <div className="grid grid-cols-12 gap-2">
          {Array.from({ length: 36 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded skeleton-box-subtle border border-[var(--border)]"
            />
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between">
          <div className="h-4 skeleton-box rounded w-32" />
          <div className="h-4 skeleton-box rounded w-24" />
        </div>
      </div>
    </div>
  );
}

export function CubieWelcomeSkeleton() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-8">
      <div className="max-w-3xl w-full text-center space-y-8 animate-pulse">
        {/* Welcome Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-full mb-4">
            <div className="w-10 h-10 skeleton-box rounded-full" />
          </div>
          <div className="h-10 skeleton-box rounded w-64 mx-auto mb-4" />
          <div className="h-6 skeleton-box rounded w-96 max-w-full mx-auto" />
          <div className="h-6 skeleton-box rounded w-80 max-w-full mx-auto" />
        </div>

        {/* Suggestion Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 skeleton-box rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 skeleton-box rounded w-32" />
                  <div className="h-3 skeleton-box rounded w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CubieMessagesSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-3 md:px-4 lg:px-6 py-4 md:py-6 space-y-4 md:space-y-6 animate-pulse">
        {/* User message */}
        <div className="flex items-start gap-2 md:gap-3 justify-end">
          <div className="flex-1 max-w-[85%]">
            <div className="px-3 md:px-4 py-2 md:py-3 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20">
              <div className="h-4 skeleton-box rounded w-3/4 mb-2" />
              <div className="h-4 skeleton-box rounded w-full" />
            </div>
          </div>
          <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full skeleton-box" />
        </div>

        {/* Bot message */}
        <div className="flex items-start gap-2 md:gap-3">
          <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full skeleton-box" />
          <div className="flex-1 max-w-[85%]">
            <div className="px-3 md:px-4 py-2 md:py-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
              <div className="h-4 skeleton-box rounded w-full mb-2" />
              <div className="h-4 skeleton-box rounded w-full mb-2" />
              <div className="h-4 skeleton-box rounded w-3/4" />
            </div>
          </div>
        </div>

        {/* User message */}
        <div className="flex items-start gap-2 md:gap-3 justify-end">
          <div className="flex-1 max-w-[85%]">
            <div className="px-3 md:px-4 py-2 md:py-3 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20">
              <div className="h-4 skeleton-box rounded w-2/3" />
            </div>
          </div>
          <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full skeleton-box" />
        </div>

        {/* Bot message */}
        <div className="flex items-start gap-2 md:gap-3">
          <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full skeleton-box" />
          <div className="flex-1 max-w-[85%]">
            <div className="px-3 md:px-4 py-2 md:py-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
              <div className="h-4 skeleton-box rounded w-full mb-2" />
              <div className="h-4 skeleton-box rounded w-5/6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

{/* Algorithm Trainer Skeletons */ }
export function AlgorithmTrainerSkeleton() {
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="timer-card">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-[var(--surface-elevated)] rounded-lg">
                  <div className="w-5 h-5 skeleton-box rounded" />
                </div>
              </div>
              <div className="h-8 skeleton-box rounded w-16 mb-2" />
              <div className="h-4 skeleton-box rounded w-24" />
            </div>
          ))}
        </div>

        {/* Algorithm Sets Section */}
        <div>
          <div className="h-8 skeleton-box rounded w-48 mb-4" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="timer-card">
                <div className="h-6 skeleton-box rounded w-3/4 mb-3" />
                <div className="h-4 skeleton-box rounded w-full mb-2" />
                <div className="h-4 skeleton-box rounded w-5/6 mb-4" />

                {/* Progress bar */}
                <div className="h-3 skeleton-box rounded w-full mb-3" />

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-4 skeleton-box rounded w-full" />
                  <div className="h-4 skeleton-box rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AlgorithmPracticeSkeleton() {
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        {/* Header */}
        <div>
          <div className="h-4 skeleton-box rounded w-48 mb-4" />
          <div className="h-10 skeleton-box rounded w-64 mb-2" />
          <div className="h-5 skeleton-box rounded w-40" />
        </div>

        {/* Progress Bar */}
        <div className="timer-card">
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 skeleton-box rounded w-20" />
            <div className="h-4 skeleton-box rounded w-16" />
          </div>
          <div className="h-3 skeleton-box rounded w-full mb-4" />

          {/* Session Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center">
                <div className="h-7 skeleton-box rounded w-12 mx-auto mb-1" />
                <div className="h-3 skeleton-box rounded w-16 mx-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Flash Card */}
        <div className="timer-card">
          <div className="aspect-square max-w-sm mx-auto skeleton-box rounded-lg mb-4" />

          {/* Action Buttons */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 skeleton-box rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AlgorithmCaseDetailSkeleton() {
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
        {/* Header */}
        <div>
          <div className="h-4 skeleton-box rounded w-40 mb-4" />
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="h-10 skeleton-box rounded w-48 mb-2" />
              <div className="h-5 skeleton-box rounded w-32" />
            </div>
          </div>
        </div>

        {/* Progress Stats */}
        <div className="timer-card">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <div className="h-3 skeleton-box rounded w-16 mb-1" />
                <div className="h-6 skeleton-box rounded w-20" />
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* 3D Visualization */}
          <div className="timer-card">
            <div className="h-6 skeleton-box rounded w-40 mb-4" />
            <div className="aspect-square skeleton-box rounded-lg" />
          </div>

          {/* Case Info */}
          <div className="space-y-4">
            <div className="timer-card">
              <div className="h-6 skeleton-box rounded w-32 mb-3" />
              <div className="space-y-2">
                <div className="h-4 skeleton-box rounded w-full" />
                <div className="h-4 skeleton-box rounded w-5/6" />
                <div className="h-4 skeleton-box rounded w-4/5" />
              </div>
            </div>

            <div className="timer-card">
              <div className="h-6 skeleton-box rounded w-32 mb-3" />
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div className="h-4 skeleton-box rounded w-24" />
                  <div className="h-4 skeleton-box rounded w-20" />
                </div>
                <div className="flex justify-between">
                  <div className="h-4 skeleton-box rounded w-24" />
                  <div className="h-4 skeleton-box rounded w-20" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Algorithm */}
        <div className="timer-card">
          <div className="h-6 skeleton-box rounded w-40 mb-4" />
          <div className="p-4 bg-[var(--surface-elevated)] rounded-lg mb-4">
            <div className="h-6 skeleton-box rounded w-3/4 mx-auto" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="text-center p-3 bg-[var(--surface-elevated)] rounded"
              >
                <div className="h-6 skeleton-box rounded w-12 mx-auto mb-1" />
                <div className="h-3 skeleton-box rounded w-16 mx-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="h-12 skeleton-box rounded-lg" />
      </div>
    </div>
  );
}

export function AlgorithmSetDetailSkeleton() {
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
        {/* Header */}
        <div>
          <div className="h-4 skeleton-box rounded w-48 mb-4" />
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="h-10 skeleton-box rounded w-64 mb-2" />
              <div className="h-5 skeleton-box rounded w-96 max-w-full" />
            </div>
            <div className="text-right">
              <div className="h-8 skeleton-box rounded w-16 mb-1" />
              <div className="h-4 skeleton-box rounded w-20" />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="timer-card">
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 skeleton-box rounded w-32" />
            <div className="h-4 skeleton-box rounded w-12" />
          </div>
          <div className="h-3 skeleton-box rounded w-full mb-4" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center">
                <div className="h-6 skeleton-box rounded w-8 mx-auto mb-1" />
                <div className="h-3 skeleton-box rounded w-16 mx-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 h-10 skeleton-box rounded-lg" />
          <div className="h-10 skeleton-box rounded-lg w-40" />
        </div>

        {/* Cases Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="timer-card">
              <div className="flex items-center justify-between mb-3">
                <div className="h-6 skeleton-box rounded w-24" />
                <div className="h-5 skeleton-box rounded w-16" />
              </div>
              <div className="h-4 skeleton-box rounded w-full mb-2" />
              <div className="h-4 skeleton-box rounded w-3/4 mb-4" />
              <div className="flex gap-2">
                <div className="h-6 skeleton-box rounded w-16" />
                <div className="h-6 skeleton-box rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}