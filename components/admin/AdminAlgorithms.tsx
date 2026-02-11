"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  BookOpen,
  Users,
  CheckCircle2,
  TrendingUp,
  Star,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

// Collapsible Card Component
function CollapsibleCard({
  title,
  children,
  defaultOpen = true,
  storageKey,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  storageKey?: string;
}) {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== "undefined" && storageKey) {
      const saved = localStorage.getItem(storageKey);
      return saved !== null ? saved === "true" : defaultOpen;
    }
    return defaultOpen;
  });

  const toggleOpen = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (typeof window !== "undefined" && storageKey) {
      localStorage.setItem(storageKey, String(newState));
    }
  };

  return (
    <div className="timer-card">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={toggleOpen}
          className="flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
        >
          <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement hover:text-[var(--primary)] transition-colors">
            {title}
          </h3>
          {isOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={toggleOpen}
          className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-md transition-colors"
        >
          {isOpen ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>
      {isOpen && children}
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-[var(--primary)]",
  iconBgColor = "bg-[var(--primary)]/10",
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconColor?: string;
  iconBgColor?: string;
}) {
  return (
    <div className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)]">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className={`p-1.5 sm:p-2 ${iconBgColor} rounded-lg shrink-0`}>
          <Icon className={`w-3 h-3 sm:w-4 sm:h-4 ${iconColor}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide truncate font-inter">
            {title}
          </div>
          <div className="text-sm sm:text-lg font-bold text-[var(--text-primary)] font-statement">
            {typeof value === "number" ? value.toLocaleString() : value}
          </div>
        </div>
      </div>
    </div>
  );
}

// Algorithm Set Card
function AlgorithmSetCard({ set }: { set: any }) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "text-[var(--success)]";
      case "intermediate":
        return "text-[var(--warning)]";
      case "advanced":
        return "text-[var(--error)]";
      default:
        return "text-[var(--text-muted)]";
    }
  };

  const completionRate =
    set.totalProgress > 0
      ? Math.round((set.masteredCount / set.totalProgress) * 100)
      : 0;

  return (
    <div className="timer-card hover:border-[var(--border-hover)] transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 bg-[var(--surface-elevated)] text-[var(--text-muted)] rounded-full font-inter">
              {set.category}
            </span>
            <span
              className={`text-xs font-medium ${getDifficultyColor(set.difficulty)}`}
            >
              {set.difficulty.charAt(0).toUpperCase() + set.difficulty.slice(1)}
            </span>
          </div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] font-statement">
            {set.name}
          </h3>
          {set.description && (
            <p className="text-xs text-[var(--text-muted)] font-inter line-clamp-2 mt-1">
              {set.description}
            </p>
          )}
        </div>
        {set.isPublished ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--success)]/10 text-[var(--success)] rounded-full text-xs">
            <CheckCircle2 className="w-3 h-3" />
            Published
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--warning)]/10 text-[var(--warning)] rounded-full text-xs">
            Draft
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm mb-3">
        <div>
          <p className="text-xs text-[var(--text-muted)] font-inter">Cases</p>
          <p className="font-bold text-[var(--text-primary)] font-statement">
            {set.totalCases}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)] font-inter">
            Learning
          </p>
          <p className="font-bold text-[var(--text-primary)] font-statement">
            {set.totalProgress}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)] font-inter">
            Mastered
          </p>
          <p className="font-bold text-[var(--success)] font-statement">
            {set.masteredCount}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {set.totalProgress > 0 && (
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-xs text-[var(--text-muted)] font-inter">
              Mastery Rate
            </span>
            <span className="text-xs font-medium text-[var(--text-primary)] font-inter">
              {completionRate}%
            </span>
          </div>
          <div className="h-2 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--success)] rounded-full transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminAlgorithms() {
  const setsStats = useQuery(api.admin.getAlgorithmSetsStats);

  // Calculate totals
  const totals = setsStats
    ? {
        totalSets: setsStats.length,
        publishedSets: setsStats.filter((s) => s.isPublished).length,
        totalCases: setsStats.reduce((sum, s) => sum + s.totalCases, 0),
        totalProgress: setsStats.reduce((sum, s) => sum + s.totalProgress, 0),
        totalMastered: setsStats.reduce((sum, s) => sum + s.masteredCount, 0),
      }
    : null;

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] font-statement">
          Algorithms
        </h1>
        <p className="mt-1 text-[var(--text-muted)] font-inter">
          Algorithm sets and learning statistics
        </p>
      </div>

      {/* Stats Card */}
      <div className="mb-6">
        <CollapsibleCard
          title="Statistics"
          storageKey="admin-algorithms-stats-open"
          defaultOpen={true}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {totals === null ? (
              [...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)] animate-pulse"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[var(--surface)] rounded-lg" />
                    <div className="flex-1">
                      <div className="h-3 w-16 bg-[var(--surface)] rounded mb-1" />
                      <div className="h-5 w-10 bg-[var(--surface)] rounded" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <>
                <StatCard
                  title="Total Sets"
                  value={totals.totalSets}
                  icon={BookOpen}
                  iconColor="text-blue-500"
                  iconBgColor="bg-blue-500/10"
                />
                <StatCard
                  title="Published"
                  value={totals.publishedSets}
                  icon={CheckCircle2}
                  iconColor="text-green-500"
                  iconBgColor="bg-green-500/10"
                />
                <StatCard
                  title="Total Cases"
                  value={totals.totalCases}
                  icon={Star}
                  iconColor="text-yellow-500"
                  iconBgColor="bg-yellow-500/10"
                />
                <StatCard
                  title="Learning"
                  value={totals.totalProgress}
                  icon={Users}
                  iconColor="text-purple-500"
                  iconBgColor="bg-purple-500/10"
                />
                <StatCard
                  title="Mastered"
                  value={totals.totalMastered}
                  icon={TrendingUp}
                  iconColor="text-emerald-500"
                  iconBgColor="bg-emerald-500/10"
                />
              </>
            )}
          </div>
        </CollapsibleCard>
      </div>

      {/* Algorithm Sets Card */}
      <CollapsibleCard
        title="Algorithm Sets"
        storageKey="admin-algorithms-sets-open"
        defaultOpen={true}
      >
        {setsStats === undefined ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="timer-card animate-pulse">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-5 w-16 bg-[var(--surface-elevated)] rounded-full" />
                  <div className="h-5 w-20 bg-[var(--surface-elevated)] rounded-full" />
                </div>
                <div className="h-5 w-32 bg-[var(--surface-elevated)] rounded mb-2" />
                <div className="h-3 w-48 bg-[var(--surface-elevated)] rounded mb-3" />
                <div className="grid grid-cols-3 gap-3">
                  {[...Array(3)].map((_, j) => (
                    <div key={j}>
                      <div className="h-3 w-12 bg-[var(--surface-elevated)] rounded mb-1" />
                      <div className="h-5 w-8 bg-[var(--surface-elevated)] rounded" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : setsStats.length === 0 ? (
          <div className="timer-card text-center py-8">
            <BookOpen className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-[var(--text-muted)] font-inter">
              No algorithm sets yet
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
            {setsStats.map((set) => (
              <AlgorithmSetCard key={set._id} set={set} />
            ))}
          </div>
        )}
      </CollapsibleCard>
    </div>
  );
}
