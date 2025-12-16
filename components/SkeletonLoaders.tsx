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

{
  /* Algorithm Trainer Skeletons */
}
export function AlgorithmTrainerSkeleton() {
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
        {/* Your Progress Section */}
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div className="h-8 skeleton-box rounded w-40" />
            <div className="h-10 skeleton-box rounded-lg w-48" />
          </div>

          {/* Stats Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="timer-card">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-[var(--surface-elevated)] rounded-lg">
                    <div className="w-5 h-5 skeleton-box rounded" />
                  </div>
                </div>
                <div className="h-8 skeleton-box rounded w-12 mb-2" />
                <div className="h-4 skeleton-box rounded w-24" />
              </div>
            ))}
          </div>
        </div>

        {/* Practice Modes Section */}
        <div>
          <div className="h-7 skeleton-box rounded w-40 mb-4" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="timer-card">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[var(--surface-elevated)] rounded-lg">
                    <div className="w-8 h-8 skeleton-box rounded" />
                  </div>
                  <div className="flex-1">
                    <div className="h-5 skeleton-box rounded w-36 mb-2" />
                    <div className="h-4 skeleton-box rounded w-48" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Algorithm Sets Section */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="h-8 skeleton-box rounded w-40" />
            <div className="h-10 skeleton-box rounded-lg w-32" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="timer-card">
                {/* Set Header */}
                <div className="h-7 skeleton-box rounded w-16 mb-1" />
                <div className="h-5 skeleton-box rounded w-24 mb-3" />

                {/* Description */}
                <div className="h-4 skeleton-box rounded w-full mb-2" />
                <div className="h-4 skeleton-box rounded w-4/5 mb-4" />

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="text-center">
                      <div className="h-6 skeleton-box rounded w-8 mx-auto mb-1" />
                      <div className="h-3 skeleton-box rounded w-14 mx-auto" />
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div className="flex items-center justify-between mb-2">
                  <div className="h-3 skeleton-box rounded w-28" />
                  <div className="h-3 skeleton-box rounded w-8" />
                </div>
                <div className="h-2 skeleton-box rounded w-full" />
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

export function CustomSetsSkeleton() {
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
        {/* Header */}
        <div>
          <div className="h-10 skeleton-box rounded-lg w-48 mb-4" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="h-8 skeleton-box rounded w-64 mb-2" />
              <div className="h-5 skeleton-box rounded w-80" />
            </div>
            <div className="flex gap-2">
              <div className="h-10 skeleton-box rounded-lg w-24" />
              <div className="h-10 skeleton-box rounded-lg w-28" />
            </div>
          </div>
        </div>

        {/* Custom Sets List */}
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="timer-card">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-6 skeleton-box rounded w-40" />
                    <div className="w-4 h-4 skeleton-box rounded" />
                  </div>
                  <div className="h-4 skeleton-box rounded w-64 mb-2" />
                  <div className="flex items-center gap-4">
                    <div className="h-3 skeleton-box rounded w-16" />
                    <div className="h-3 skeleton-box rounded w-32" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-10 skeleton-box rounded-lg w-24" />
                  <div className="h-10 skeleton-box rounded-lg w-10" />
                  <div className="h-10 skeleton-box rounded-lg w-10" />
                  <div className="h-10 skeleton-box rounded-lg w-10" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function EditCustomSetSkeleton() {
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
        {/* Header */}
        <div>
          <div className="h-10 skeleton-box rounded-lg w-48 mb-4" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 skeleton-box rounded w-48" />
                <div className="w-4 h-4 skeleton-box rounded" />
              </div>
              <div className="h-4 skeleton-box rounded w-64" />
            </div>
            <div className="flex gap-2">
              <div className="h-10 skeleton-box rounded-lg w-24" />
              <div className="h-10 skeleton-box rounded-lg w-28" />
            </div>
          </div>
        </div>

        {/* Cases in Set */}
        <div className="timer-card">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 skeleton-box rounded w-32" />
            <div className="h-10 skeleton-box rounded-lg w-32" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="p-3 skeleton-box-subtle rounded-lg border border-[var(--border)]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-5 skeleton-box rounded w-24 mb-1" />
                    <div className="h-3 skeleton-box rounded w-16" />
                  </div>
                  <div className="w-8 h-8 skeleton-box rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AlgorithmStatsSkeleton() {
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="h-10 skeleton-box rounded-lg w-48" />
          <div className="h-8 skeleton-box rounded w-64" />
        </div>

        {/* Quick Stats Overview */}
        <div className="timer-card">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center">
                <div className="h-8 skeleton-box rounded w-16 mx-auto mb-2" />
                <div className="h-4 skeleton-box rounded w-24 mx-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Time Breakdown */}
          <div className="timer-card">
            <div className="h-6 skeleton-box rounded w-40 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-4 skeleton-box rounded w-32" />
                  <div className="h-4 skeleton-box rounded w-20" />
                </div>
              ))}
            </div>
          </div>

          {/* Mastery Progress */}
          <div className="timer-card">
            <div className="h-6 skeleton-box rounded w-40 mb-4" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-4 skeleton-box rounded w-24" />
                    <div className="h-4 skeleton-box rounded w-12" />
                  </div>
                  <div className="h-3 skeleton-box rounded w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recognition Benchmarks */}
        <div className="timer-card">
          <div className="h-6 skeleton-box rounded w-48 mb-4" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="text-center p-4 skeleton-box-subtle rounded-lg"
              >
                <div className="h-8 skeleton-box rounded w-20 mx-auto mb-2" />
                <div className="h-4 skeleton-box rounded w-24 mx-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Session History */}
        <div className="timer-card">
          <div className="h-6 skeleton-box rounded w-40 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 skeleton-box-subtle rounded-lg border border-[var(--border)]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 skeleton-box rounded-lg" />
                  <div>
                    <div className="h-4 skeleton-box rounded w-32 mb-1" />
                    <div className="h-3 skeleton-box rounded w-24" />
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-4 skeleton-box rounded w-16 mb-1" />
                  <div className="h-3 skeleton-box rounded w-12" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Full Competition Browser Skeleton
export function CompetitionBrowserSkeleton() {
  return (
    <div className="h-full overflow-y-auto p-3 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 animate-pulse">
        {/* Tab Navigation */}
        <div className="border-b border-[var(--border)]">
          <nav className="flex space-x-6 sm:space-x-8">
            <div className="py-3 sm:py-4 px-1 border-b-2 border-[var(--primary)]">
              <div className="h-5 skeleton-box rounded w-36" />
            </div>
            <div className="py-3 sm:py-4 px-1">
              <div className="h-5 skeleton-box rounded w-28" />
            </div>
          </nav>
        </div>

        {/* Filters Card */}
        <div className="timer-card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 skeleton-box rounded" />
              <div className="h-6 skeleton-box rounded w-20" />
            </div>
            <div className="h-5 skeleton-box rounded w-24" />
          </div>

          {/* Filter Controls */}
          <div className="space-y-4">
            {/* Search and Region */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 h-10 skeleton-box rounded-lg" />
              <div className="w-full sm:w-48 h-10 skeleton-box rounded-lg" />
            </div>

            {/* Time Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-9 skeleton-box rounded-full w-24" />
              ))}
            </div>

            {/* Event Icons Grid */}
            <div>
              <div className="h-4 skeleton-box rounded w-28 mb-3" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 17 }).map((_, i) => (
                  <div key={i} className="w-9 h-9 skeleton-box rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between">
          <div className="h-6 skeleton-box rounded w-40" />
          <div className="h-5 skeleton-box rounded w-24" />
        </div>

        {/* Competition Cards */}
        <div className="grid gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="timer-card p-4 border border-[var(--border)]"
            >
              <div className="flex flex-col sm:flex-row items-start gap-4">
                {/* Date Badge */}
                <div className="flex sm:flex-col items-center gap-2 sm:gap-0 sm:text-center sm:min-w-[60px]">
                  <div className="h-4 skeleton-box rounded w-8" />
                  <div className="h-7 skeleton-box rounded w-8 sm:mt-1" />
                </div>

                {/* Competition Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-6 skeleton-box rounded w-16" />
                    <div className="h-5 skeleton-box rounded w-48 sm:w-64" />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <div className="h-4 skeleton-box rounded w-32" />
                    <div className="h-4 skeleton-box rounded w-20" />
                  </div>
                  {/* Event Icons */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <div key={j} className="w-6 h-6 skeleton-box rounded" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="timer-card">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="h-10 skeleton-box rounded-lg w-28" />
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-10 h-10 skeleton-box rounded-lg" />
              ))}
            </div>
            <div className="h-10 skeleton-box rounded-lg w-28" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Competition Cards Skeleton used in Competition Browser
export function CompetitionCardsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid gap-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="timer-card p-4 border border-[var(--border)]">
          <div className="flex flex-col gap-3">
            {/* Header Row - Date, Status, CTA */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 skeleton-box rounded" />
                  <div className="h-4 skeleton-box rounded w-28" />
                </div>
                <div className="h-5 skeleton-box rounded-full w-20" />
              </div>
              <div className="h-9 skeleton-box rounded-lg w-24" />
            </div>

            {/* Competition Info */}
            <div className="space-y-2">
              <div className="h-5 skeleton-box rounded w-64 sm:w-80" />
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <div className="h-4 skeleton-box rounded w-36" />
                <div className="h-4 skeleton-box rounded w-24" />
              </div>
            </div>

            {/* Events */}
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: 10 }).map((_, j) => (
                <div key={j} className="w-6 h-6 skeleton-box rounded" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Simulation History skeleton
export function SimulationHistorySkeleton() {
  return (
    <div className="timer-card animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 skeleton-box rounded" />
          <div className="h-5 skeleton-box rounded w-36" />
        </div>
        <div className="h-4 skeleton-box rounded w-16" />
      </div>

      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <div className="h-5 skeleton-box rounded w-40" />
                  <div className="h-5 skeleton-box rounded-full w-24" />
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="h-3 skeleton-box rounded w-16" />
                  <div className="h-3 skeleton-box rounded w-20" />
                </div>
                {/* Event icons */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <div key={j} className="w-5 h-5 skeleton-box rounded" />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 skeleton-box rounded-full" />
                <div className="h-3 skeleton-box rounded w-8" />
                <div className="w-4 h-4 skeleton-box rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Competition Overview Skeleton
export function CompetitionOverviewSkeleton() {
  return (
    <div className="h-full overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 animate-pulse">
        {/* Back Link */}
        <div className="h-5 skeleton-box rounded w-36" />

        {/* Competition Header */}
        <div className="timer-card">
          <div className="flex flex-col gap-4">
            {/* Title and Status */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <div className="h-8 sm:h-10 skeleton-box rounded w-64 sm:w-80" />
                  <div className="h-6 skeleton-box rounded-full w-20" />
                </div>
                {/* Meta info */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="h-4 skeleton-box rounded w-32" />
                  <div className="h-4 skeleton-box rounded w-36" />
                  <div className="h-4 skeleton-box rounded w-28" />
                </div>
                <div className="h-4 skeleton-box rounded w-48 mt-2" />
              </div>
              {/* WCA Link Button */}
              <div className="h-10 skeleton-box rounded-lg w-full sm:w-32" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-[var(--border)] mb-4 sm:mb-6">
          <nav className="flex space-x-6 sm:space-x-8 overflow-x-auto">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="py-3 sm:py-4 px-1">
                <div className="h-5 skeleton-box rounded w-20 sm:w-24" />
              </div>
            ))}
          </nav>
        </div>

        {/* Tab Content - Info */}
        <div className="space-y-6">
          <div>
            <div className="h-6 skeleton-box rounded w-40 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="p-3 sm:p-4 bg-[var(--surface-elevated)] rounded-lg"
                >
                  <div className="h-3 skeleton-box rounded w-16 mb-2" />
                  <div className="h-5 skeleton-box rounded w-32" />
                </div>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          <div>
            <div className="h-5 skeleton-box rounded w-44 mb-3" />
            <div className="space-y-3">
              <div className="h-4 skeleton-box rounded w-full" />
              <div className="h-4 skeleton-box rounded w-5/6" />
              <div className="h-4 skeleton-box rounded w-4/5" />
            </div>
          </div>
        </div>

        {/* Start Simulation Button */}
        <div className="h-14 skeleton-box rounded-xl w-full" />
      </div>
    </div>
  );
}

// Competition Overview Events Tab skeleton
export function CompetitionEventsTabSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 animate-pulse">
      <div className="h-6 skeleton-box rounded w-40" />
      <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2 sm:gap-3">
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)]"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 skeleton-box rounded-lg" />
            <div className="h-3 skeleton-box rounded w-12" />
          </div>
        ))}
      </div>

      <div className="p-3 sm:p-4 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 skeleton-box rounded" />
          <div className="h-5 skeleton-box rounded w-40" />
        </div>
        <div className="h-4 skeleton-box rounded w-full" />
        <div className="h-4 skeleton-box rounded w-4/5 mt-2" />
      </div>
    </div>
  );
}

// Simulation Config skeleton
export function SimulationConfigSkeleton() {
  return (
    <div className="h-full overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 animate-pulse">
        {/* Back Link */}
        <div className="h-5 skeleton-box rounded w-36" />

        {/* Header */}
        <div className="timer-card">
          <div className="h-8 sm:h-10 skeleton-box rounded w-56 mb-2" />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <div className="h-4 skeleton-box rounded w-40" />
            <div className="h-4 skeleton-box rounded w-28" />
            <div className="h-4 skeleton-box rounded w-32" />
          </div>
        </div>

        {/* Event Selection */}
        <div className="timer-card">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="h-6 skeleton-box rounded w-48" />
            <div className="flex gap-2">
              <div className="h-4 skeleton-box rounded w-16" />
              <div className="h-4 skeleton-box rounded w-12" />
            </div>
          </div>

          <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2 sm:gap-3">
            {Array.from({ length: 14 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 skeleton-box rounded-lg" />
                <div className="h-3 skeleton-box rounded w-10" />
              </div>
            ))}
          </div>

          <div className="h-4 skeleton-box rounded w-36 mt-3 sm:mt-4" />
        </div>

        {/* Atmosphere Settings */}
        <div className="timer-card">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <div className="w-5 h-5 skeleton-box rounded" />
            <div className="h-6 skeleton-box rounded w-44" />
          </div>

          <div className="space-y-4 sm:space-y-6">
            {/* Crowd Noise */}
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 skeleton-box rounded" />
                  <div className="h-4 skeleton-box rounded w-24" />
                </div>
                <div className="h-6 skeleton-box rounded w-12" />
              </div>
              <div className="h-3 skeleton-box rounded-lg w-full" />
              <div className="flex justify-between">
                <div className="h-3 skeleton-box rounded w-12" />
                <div className="h-3 skeleton-box rounded w-16" />
                <div className="h-3 skeleton-box rounded w-10" />
              </div>
            </div>

            {/* Pressure */}
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 skeleton-box rounded" />
                  <div className="h-4 skeleton-box rounded w-36" />
                </div>
                <div className="h-6 skeleton-box rounded w-12" />
              </div>
              <div className="h-3 skeleton-box rounded-lg w-full" />
              <div className="flex justify-between">
                <div className="h-3 skeleton-box rounded w-14" />
                <div className="h-3 skeleton-box rounded w-14" />
                <div className="h-3 skeleton-box rounded w-14" />
              </div>
              <div className="h-3 skeleton-box rounded w-64" />
            </div>

            {/* Toggles */}
            <div className="space-y-4 pt-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 skeleton-box rounded" />
                    <div className="h-4 skeleton-box rounded w-28" />
                  </div>
                  <div className="w-11 h-6 skeleton-box rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="h-14 skeleton-box rounded-xl w-full" />
      </div>
    </div>
  );
}

// Simulation Event Select skeleton
export function SimulationEventSelectSkeleton() {
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        {/* Back Link */}
        <div className="h-5 skeleton-box rounded w-28" />

        {/* Header Card */}
        <div className="timer-card">
          <div className="h-7 skeleton-box rounded w-64 mb-2" />
          <div className="h-5 skeleton-box rounded w-44" />

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between mb-2">
              <div className="h-4 skeleton-box rounded w-36" />
              <div className="h-4 skeleton-box rounded w-10" />
            </div>
            <div className="w-full h-2 skeleton-box rounded-full" />
          </div>
        </div>

        {/* Event Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)]"
            >
              <div className="w-10 h-10 skeleton-box rounded" />
              <div className="h-5 skeleton-box rounded w-20" />
              <div className="h-4 skeleton-box rounded w-16" />
            </div>
          ))}
        </div>

        {/* View Results Button */}
        <div className="flex justify-center">
          <div className="h-12 skeleton-box rounded-lg w-44" />
        </div>
      </div>
    </div>
  );
}

// Simulation Event Select skeleton
export function SimulationRoundSkeleton() {
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="h-5 skeleton-box rounded w-28" />
          <div className="h-6 skeleton-box rounded-full w-24" />
        </div>

        {/* Event Info Card */}
        <div className="timer-card">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 skeleton-box rounded-lg" />
            <div>
              <div className="h-7 skeleton-box rounded w-32 mb-1" />
              <div className="h-5 skeleton-box rounded w-24" />
            </div>
          </div>

          {/* Round Progress */}
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex-1">
                <div className="h-2 skeleton-box rounded-full" />
                <div className="h-3 skeleton-box rounded w-8 mx-auto mt-1" />
              </div>
            ))}
          </div>
        </div>

        {/* Scramble Card */}
        <div className="timer-card">
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 skeleton-box rounded w-20" />
            <div className="h-8 skeleton-box rounded-lg w-24" />
          </div>
          <div className="p-4 bg-[var(--surface-elevated)] rounded-lg">
            <div className="h-5 skeleton-box rounded w-full mb-2" />
            <div className="h-5 skeleton-box rounded w-4/5" />
          </div>
        </div>

        {/* Timer Display */}
        <div className="timer-card text-center py-8">
          <div className="h-20 sm:h-24 skeleton-box rounded w-48 mx-auto mb-4" />
          <div className="h-5 skeleton-box rounded w-56 mx-auto" />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <div className="flex-1 h-12 skeleton-box rounded-lg" />
          <div className="flex-1 h-12 skeleton-box rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// Competition Analytics skeleton
export function CompetitionAnalyticsSkeleton() {
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        {/* Back Button */}
        <div className="h-5 skeleton-box rounded w-36" />

        {/* Header */}
        <div className="timer-card">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 skeleton-box rounded" />
            <div>
              <div className="h-7 skeleton-box rounded w-48 mb-1" />
              <div className="h-5 skeleton-box rounded w-64" />
            </div>
          </div>
        </div>

        {/* Overall Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="timer-card text-center">
              <div className="w-6 h-6 skeleton-box rounded mx-auto mb-2" />
              <div className="h-8 skeleton-box rounded w-20 mx-auto mb-2" />
              <div className="h-4 skeleton-box rounded w-16 mx-auto" />
            </div>
          ))}
        </div>

        {/* Event Results */}
        <div className="timer-card">
          <div className="h-6 skeleton-box rounded w-36 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 skeleton-box rounded" />
                  <div className="h-6 skeleton-box rounded w-32" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map((j) => (
                    <div key={j}>
                      <div className="h-3 skeleton-box rounded w-16 mb-1" />
                      <div className="h-5 skeleton-box rounded w-20" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Round Details */}
        <div className="timer-card">
          <div className="h-6 skeleton-box rounded w-32 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-[var(--surface-elevated)] rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="h-5 skeleton-box rounded w-16" />
                  <div className="h-5 skeleton-box rounded w-20" />
                </div>
                <div className="h-5 skeleton-box rounded w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Competition Training Tab skeleton
export function CompetitionTrainingTabSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 animate-pulse">
      <div className="h-6 skeleton-box rounded w-40" />

      {/* Training Cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="timer-card border border-[var(--border)]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 skeleton-box rounded-lg" />
              <div>
                <div className="h-5 skeleton-box rounded w-40 mb-1" />
                <div className="h-4 skeleton-box rounded w-56" />
              </div>
            </div>
            <div className="h-10 skeleton-box rounded-lg w-full mt-4" />
          </div>
        ))}
      </div>

      {/* Expandable Training Sections */}
      {[1, 2].map((i) => (
        <div key={i} className="timer-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 skeleton-box rounded-lg" />
              <div>
                <div className="h-5 skeleton-box rounded w-44 mb-1" />
                <div className="h-4 skeleton-box rounded w-64" />
              </div>
            </div>
            <div className="w-5 h-5 skeleton-box rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Mock Schedule skeleton
export function MockScheduleSkeleton() {
  return (
    <div className="timer-card animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 skeleton-box rounded" />
          <div className="h-6 skeleton-box rounded w-36" />
        </div>
        <div className="w-5 h-5 skeleton-box rounded" />
      </div>

      {/* Schedule Blocks */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]"
          >
            <div className="h-5 skeleton-box rounded w-12" />
            <div className="flex-1">
              <div className="h-5 skeleton-box rounded w-32 mb-1" />
              <div className="h-4 skeleton-box rounded w-20" />
            </div>
            <div className="flex gap-2">
              <div className="w-8 h-8 skeleton-box rounded" />
              <div className="w-8 h-8 skeleton-box rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Start Button */}
      <div className="h-10 skeleton-box rounded-lg w-full mt-4" />
    </div>
  );
}

// WCA Scorecard skeleton
export function WCAScorecardSkeleton() {
  return (
    <div className="timer-card animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 skeleton-box rounded" />
          <div>
            <div className="h-6 skeleton-box rounded w-32 mb-1" />
            <div className="h-4 skeleton-box rounded w-20" />
          </div>
        </div>
        <div className="h-8 skeleton-box rounded-lg w-20" />
      </div>

      {/* Solve Grid */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="text-center">
            <div className="h-3 skeleton-box rounded w-full mb-2" />
            <div className="h-8 skeleton-box rounded w-full" />
          </div>
        ))}
      </div>

      {/* Results Row */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
        <div>
          <div className="h-3 skeleton-box rounded w-12 mb-1" />
          <div className="h-6 skeleton-box rounded w-20" />
        </div>
        <div>
          <div className="h-3 skeleton-box rounded w-16 mb-1" />
          <div className="h-6 skeleton-box rounded w-20" />
        </div>
      </div>
    </div>
  );
}