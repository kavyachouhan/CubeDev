"use client";

import { useState } from "react";
import { useUser } from "@/components/UserProvider";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import CubeLabLayout from "@/components/CubeLabLayout";
import { AlgorithmSetCard, AlgorithmHeatmap } from "@/components/algorithm";
import { AlgorithmTrainerSkeleton } from "@/components/SkeletonLoaders";
import { Brain, Calendar, Target, TrendingUp, Play, Flame } from "lucide-react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";

// Helper component to fetch and display a single set card
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

  // Get all algorithm sets
  const sets = useQuery(api.algorithms.getAllSets);

  // Get user's overall stats - conditionally skip if no user yet
  const userStats = useQuery(
    api.algorithms.getUserStats,
    user?.convexId ? { userId: user.convexId } : "skip"
  );

  // Get due reviews
  const dueReviews = useQuery(
    api.algorithms.getDueReviews,
    user?.convexId ? { userId: user.convexId } : "skip"
  );

  // Get review history for heatmap
  const reviewHistory = useQuery(
    api.algorithms.getUserReviewHistory,
    user?.convexId ? { userId: user.convexId } : "skip"
  );

  if (!user) {
    return null; // ProtectedRoute will handle redirect
  }

  // Show skeleton loader while data is loading
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
            {/* User Stats Dashboard */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Total Learned */}
              <div className="timer-card">
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
              <div className="timer-card">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Target className="w-5 h-5 text-green-500" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-500 font-statement">
                  {userStats?.mastered || 0}
                </div>
                <div className="text-sm text-[var(--text-muted)]">Mastered</div>
              </div>

              {/* Due Today */}
              <div className="timer-card">
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
              <div className="timer-card">
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

            {/* Quick Actions */}
            {(userStats?.dueToday || 0) > 0 && (
              <div className="timer-card border-l-4 border-[var(--primary)]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)] font-statement mb-1">
                      You have {userStats?.dueToday} review
                      {userStats?.dueToday !== 1 ? "s" : ""} due
                    </h3>
                    <p className="text-sm text-[var(--text-muted)]">
                      Keep your learning momentum going
                    </p>
                  </div>
                  <Link
                    href="/cube-lab/algorithm-trainer/practice"
                    className="px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium whitespace-nowrap"
                  >
                    <Play className="w-5 h-5" />
                    Start Practice
                  </Link>
                </div>
              </div>
            )}

            {/* Practice Options */}
            {(userStats?.totalLearned || 0) > 0 && (
              <div className="grid sm:grid-cols-2 gap-4">
                <Link
                  href="/cube-lab/algorithm-trainer/practice?mode=recognition"
                  className="timer-card hover:scale-[1.02] transition-all cursor-pointer border-2 border-transparent hover:border-[var(--primary)]"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 rounded-lg">
                      <Brain className="w-8 h-8 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[var(--text-primary)] font-statement">
                        Recognition Training
                      </h3>
                      <p className="text-sm text-[var(--text-muted)]">
                        Practice identifying cases quickly
                      </p>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/cube-lab/algorithm-trainer/practice?mode=execution"
                  className="timer-card hover:scale-[1.02] transition-all cursor-pointer border-2 border-transparent hover:border-[var(--primary)]"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <TrendingUp className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[var(--text-primary)] font-statement">
                        Execution Practice
                      </h3>
                      <p className="text-sm text-[var(--text-muted)]">
                        Improve algorithm execution speed
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* Algorithm Sets */}
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] font-statement mb-4">
                Algorithm Sets
              </h2>

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
                  {sets.map((set: any) => (
                    <AlgorithmSetCardWrapper
                      key={set._id}
                      set={set}
                      userId={user.convexId as Id<"users">}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity Heatmap */}
            {reviewHistory && reviewHistory.length > 0 && (
              <div className="timer-card">
                <AlgorithmHeatmap reviews={reviewHistory} />
              </div>
            )}
          </div>
        </div>
      </CubeLabLayout>
    </ProtectedRoute>
  );
}
