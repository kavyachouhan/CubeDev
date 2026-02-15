"use client";

import React from "react";

// Base skeleton with animation
export function SkeletonPulse({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-[var(--surface-elevated)] rounded animate-pulse ${className}`}
    />
  );
}

// Stat card skeleton - matches the structure of the StatCard component
export function StatCardSkeleton() {
  return (
    <div className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)] animate-pulse">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="p-1.5 sm:p-2 bg-[var(--surface)] rounded-lg">
          <div className="w-3 h-3 sm:w-4 sm:h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="h-3 w-20 bg-[var(--surface)] rounded mb-1.5" />
          <div className="h-5 w-16 bg-[var(--surface)] rounded" />
        </div>
      </div>
    </div>
  );
}

// Row of stat cards - can specify how many cards to show
export function StatCardsRowSkeleton({
  count = 4,
  className = "",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 ${className}`}>
      {[...Array(count)].map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Collapsible card skeleton - matches the structure of the CollapsibleCard component
export function CollapsibleCardSkeleton({
  height = "h-48",
  className = "",
}: {
  height?: string;
  className?: string;
}) {
  return (
    <div className={`timer-card animate-pulse ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-40 bg-[var(--surface-elevated)] rounded" />
        <div className="h-6 w-6 bg-[var(--surface-elevated)] rounded" />
      </div>
      <div className={`bg-[var(--surface-elevated)] rounded-lg ${height}`} />
    </div>
  );
}

// List item skeleton - matches the structure of list items in the admin panel, with optional avatar
export function ListItemSkeleton({
  hasAvatar = false,
  className = "",
}: {
  hasAvatar?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-4 animate-pulse py-3 border-b border-[var(--border)] last:border-0 ${className}`}
    >
      {hasAvatar && (
        <div className="w-10 h-10 bg-[var(--surface-elevated)] rounded-full shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="h-4 w-32 bg-[var(--surface-elevated)] rounded mb-2" />
        <div className="h-3 w-48 bg-[var(--surface-elevated)] rounded" />
      </div>
      <div className="h-4 w-16 bg-[var(--surface-elevated)] rounded" />
    </div>
  );
}

// List skeleton - renders multiple list item skeletons, can specify count and whether items have avatars
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
      {[...Array(count)].map((_, i) => (
        <ListItemSkeleton key={i} hasAvatar={hasAvatar} />
      ))}
    </div>
  );
}

// Badge card skeleton - matches the structure of the BadgeCard component, with title, description, and badge placeholders
export function BadgeCardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-[var(--surface-elevated)] rounded-xl p-4 border border-[var(--border)] animate-pulse ${className}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="h-5 w-16 bg-[var(--surface)] rounded-full" />
        <div className="h-5 w-20 bg-[var(--surface)] rounded-full" />
      </div>
      <div className="h-4 w-48 bg-[var(--surface)] rounded mb-1" />
      <div className="h-3 w-64 bg-[var(--surface)] rounded" />
    </div>
  );
}

// Chart skeleton
export function ChartSkeleton({
  height = "h-48",
  className = "",
}: {
  height?: string;
  className?: string;
}) {
  return (
    <div
      className={`bg-[var(--surface-elevated)] rounded-lg animate-pulse ${height} ${className}`}
    >
      <div className="flex items-end justify-around h-full p-4 gap-2">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="bg-[var(--surface)] rounded-t flex-1"
            style={{ height: `${30 + Math.random() * 50}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// Filter bar skeleton
export function FilterBarSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`timer-card animate-pulse ${className}`}>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 h-10 bg-[var(--surface-elevated)] rounded-lg" />
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-[var(--surface-elevated)] rounded-lg" />
          <div className="h-10 w-24 bg-[var(--surface-elevated)] rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// Admin page skeleton - combines multiple skeleton components to create a full-page loading state for admin pages
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
        {/* Header skeleton */}
        <div className="timer-card">
          <div className="h-10 w-48 bg-[var(--surface-elevated)] rounded animate-pulse" />
        </div>

        {/* Stats grid */}
        {showStats && <StatCardsRowSkeleton count={statsCount} />}

        {/* Charts row */}
        {showCharts && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CollapsibleCardSkeleton height="h-56" />
            <CollapsibleCardSkeleton height="h-56" />
          </div>
        )}

        {/* List section */}
        {showList && (
          <div className="timer-card">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 w-32 bg-[var(--surface-elevated)] rounded animate-pulse" />
            </div>
            <ListSkeleton count={5} />
          </div>
        )}
      </div>
    </div>
  );
}

// Empty state component - consistent empty state design
export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-[var(--text-muted)]" />
      </div>
      <p className="text-sm font-medium text-[var(--text-secondary)] font-inter">
        {title}
      </p>
      {description && (
        <p className="text-xs text-[var(--text-muted)] font-inter mt-1">
          {description}
        </p>
      )}
    </div>
  );
}