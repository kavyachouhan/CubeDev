"use client";

import { useUser } from "@/components/UserProvider";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import CubeLabLayout from "@/components/CubeLabLayout";
import { AlgorithmSetCard, AlgorithmHeatmap } from "@/components/algorithm";
import AlgorithmTrainerTour from "@/components/algorithm/AlgorithmTrainerTour";
import { AlgorithmTrainerSkeleton } from "@/components/SkeletonLoaders";
import {
  Brain,
  Calendar,
  Target,
  TrendingUp,
  Play,
  Flame,
  FolderPlus,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";

// Wrapper component to fetch user progress for an algorithm set
function AlgorithmSetCardWrapper({
  set,
  userId,
}: {
  set: any;
  userId: Id<"users">;
}) {
  const progress = useQuery(api.algorithms.getUserSetProgress, {
    userId,
    setId: set._id,
  });

  return (
    <AlgorithmSetCard
      setId={set._id}
      setSlug={set.slug || set.name.toLowerCase()}
      name={set.name}
      description={set.description}
      caseCount={set.caseCount}
      difficulty={set.difficulty}
      learned={progress?.learned || 0}
      mastered={progress?.mastered || 0}
      isLocked={false}
    />
  );
}

export default function AlgorithmTrainerPage() {
  const { user } = useUser();

  // Queries
  const sets = useQuery(api.algorithms.getAllSets);

  // Queries dependent on user
  const userStats = useQuery(
    api.algorithms.getUserStats,
    user?.convexId ? { userId: user.convexId } : "skip"
  );

  // Queries dependent on user
  const dueReviews = useQuery(
    api.algorithms.getDueReviews,
    user?.convexId ? { userId: user.convexId } : "skip"
  );

  // Queries dependent on user
  const reviewHistory = useQuery(
    api.algorithms.getUserReviewHistory,
    user?.convexId ? { userId: user.convexId } : "skip"
  );

  if (!user) {
    return null; // Let ProtectedRoute handle redirect
  }

  // Loading state
  if (
    userStats === undefined ||
    sets === undefined ||
    reviewHistory === undefined
  ) {
    return (
      <ProtectedRoute>
        <CubeLabLayout activeSection="algorithm-trainer">
          <AlgorithmTrainerSkeleton />
        </CubeLabLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <CubeLabLayout activeSection="algorithm-trainer">
        <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Product Tour */}
            <AlgorithmTrainerTour
              hasProgress={(userStats?.dueToday || 0) > 0}
              hasPracticeModes={(userStats?.totalLearned || 0) > 0}
              hasHeatmap={reviewHistory && reviewHistory.length > 0}
            />

            {/* User Stats Dashboard */}
            <div data-tour="progress-section">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] font-statement">
                  Your Progress
                </h2>
                {(userStats?.totalLearned || 0) > 0 && (
                  <Link
                    href="/cube-lab/algorithm-trainer/stats"
                    data-tour="analytics-button"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg transition-colors w-full sm:w-auto"
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      View Detailed Analytics
                    </span>
                    <span className="sm:hidden">View Analytics</span>
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Total Learned */}
                <div className="timer-card" data-tour="total-learned">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-[var(--primary)]/10 rounded-lg">
                      <Brain className="w-5 h-5 text-[var(--primary)]" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-[var(--text-primary)] font-statement">
                    {userStats?.totalLearned || 0}
                  </div>
                  <div className="text-sm text-[var(--text-muted)]">
                    Total Learning
                  </div>
                </div>

                {/* Mastered */}
                <div className="timer-card" data-tour="mastered">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <Target className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-500 font-statement">
                    {userStats?.mastered || 0}
                  </div>
                  <div className="text-sm text-[var(--text-muted)]">
                    Mastered
                  </div>
                </div>

                {/* Due Today */}
                <div className="timer-card" data-tour="due-today">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-red-500/10 rounded-lg">
                      <Calendar className="w-5 h-5 text-red-500" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-red-500 font-statement">
                    {userStats?.dueToday || 0}
                  </div>
                  <div className="text-sm text-[var(--text-muted)]">
                    Due Today
                  </div>
                </div>

                {/* Reviewed Today */}
                <div className="timer-card" data-tour="reviewed-today">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Flame className="w-5 h-5 text-blue-500" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-500 font-statement">
                    {userStats?.reviewedToday || 0}
                  </div>
                  <div className="text-sm text-[var(--text-muted)]">
                    Reviewed Today
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            {(userStats?.dueToday || 0) > 0 && (
              <div
                className="timer-card border-l-4 border-[var(--primary)]"
                data-tour="srs-review-prompt"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)] font-statement mb-1">
                      You have {userStats?.dueToday} review
                      {userStats?.dueToday !== 1 ? "s" : ""} due
                    </h3>
                    <p className="text-sm text-[var(--text-muted)]">
                      Keep your learning momentum going with spaced repetition
                    </p>
                  </div>
                  <Link
                    href="/cube-lab/algorithm-trainer/practice?mode=srs"
                    className="px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium whitespace-nowrap"
                  >
                    <Play className="w-5 h-5" />
                    Start SRS Review
                  </Link>
                </div>
              </div>
            )}

            {/* Practice Options */}
            {(userStats?.totalLearned || 0) > 0 && (
              <div data-tour="practice-modes">
                <h2 className="text-xl font-bold text-[var(--text-primary)] font-statement mb-4">
                  Practice Modes
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Link
                    href="/cube-lab/algorithm-trainer/practice?mode=drill&type=rec"
                    data-tour="recognition-drill"
                    className="timer-card hover:scale-[1.02] transition-all cursor-pointer border-2 border-transparent hover:border-[var(--primary)]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-[var(--primary)]/10 rounded-lg">
                        <Brain className="w-8 h-8 text-[var(--primary)]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[var(--text-primary)] font-statement">
                          Recognition Drill
                        </h3>
                        <p className="text-sm text-[var(--text-muted)]">
                          Practice identifying cases quickly
                        </p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/cube-lab/algorithm-trainer/practice?mode=drill&type=exec"
                    data-tour="execution-drill"
                    className="timer-card hover:scale-[1.02] transition-all cursor-pointer border-2 border-transparent hover:border-[var(--primary)]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-[var(--primary)]/10 rounded-lg">
                        <Flame className="w-8 h-8 text-[var(--primary)]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[var(--text-primary)] font-statement">
                          Execution Drill
                        </h3>
                        <p className="text-sm text-[var(--text-muted)]">
                          Improve algorithm execution speed
                        </p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/cube-lab/algorithm-trainer/practice?mode=drill&type=blind"
                    data-tour="blind-recognition"
                    className="timer-card hover:scale-[1.02] transition-all cursor-pointer border-2 border-transparent hover:border-[var(--primary)]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-500/10 rounded-lg">
                        <EyeOff className="w-8 h-8 text-purple-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[var(--text-primary)] font-statement">
                          Blind Recognition
                        </h3>
                        <p className="text-sm text-[var(--text-muted)]">
                          Recall case names from memory
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            )}

            {/* Custom Sets & Algorithm Sets */}
            <div className="space-y-6">
              {/* Custom Sets & Algorithm Sets Header */}
              <div
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                data-tour="algorithm-sets-header"
              >
                <h2 className="text-2xl font-bold text-[var(--text-primary)] font-statement">
                  Algorithm Sets
                </h2>
                <Link
                  href="/cube-lab/algorithm-trainer/custom"
                  data-tour="custom-sets-button"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--surface-elevated)] hover:bg-[var(--surface)] border border-[var(--border)] rounded-lg transition-colors"
                >
                  <FolderPlus className="w-4 h-4" />
                  Custom Sets
                </Link>
              </div>

              {sets.length === 0 ? (
                /* Empty State */
                <div className="timer-card text-center py-12">
                  <Brain className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
                  <p className="text-[var(--text-muted)]">
                    No algorithm sets available yet
                  </p>
                </div>
              ) : (
                /* Algorithm Sets Grid */
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sets.map((set: any, index: number) => (
                    <div
                      key={set._id}
                      data-tour={index === 0 ? "algorithm-set-card" : undefined}
                    >
                      <AlgorithmSetCardWrapper
                        set={set}
                        userId={user.convexId as Id<"users">}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity Heatmap */}
            {reviewHistory && reviewHistory.length > 0 && (
              <div className="timer-card" data-tour="heatmap">
                <AlgorithmHeatmap reviews={reviewHistory} />
              </div>
            )}
          </div>
        </div>
      </CubeLabLayout>
    </ProtectedRoute>
  );
}