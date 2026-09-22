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
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";

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
      puzzleType={set.puzzleType}
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
        <div className="container-responsive py-4 md:py-8">
          <div className="space-y-6 md:space-y-8">
            {/* Product Tour */}
            <AlgorithmTrainerTour
              hasProgress={(userStats?.dueToday || 0) > 0}
              hasPracticeModes={(userStats?.totalLearned || 0) > 0}
              hasHeatmap={reviewHistory && reviewHistory.length > 0}
            />

            {/* User Stats Dashboard */}
            <div data-tour="progress-section">
              <PageHeader
                title="Algorithm Trainer"
                description="Learn cases, drill recognition and keep reviews on schedule."
                hideTitleOnMobile
                actions={
                  (userStats?.totalLearned || 0) > 0 ? (
                    <ButtonLink
                      href="/cube-lab/algorithm-trainer/stats"
                      data-tour="analytics-button"
                      iconLeft={<TrendingUp className="w-4 h-4" />}
                      className="w-full sm:w-auto"
                    >
                      <span className="hidden sm:inline">View Detailed Analytics</span>
                      <span className="sm:hidden">View Analytics</span>
                    </ButtonLink>
                  ) : undefined
                }
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                <StatTile
                  rootProps={{ "data-tour": "total-learned" }}
                  label="Total Learning"
                  icon={<Brain />}
                  mono={false}
                  size="lg"
                  value={userStats?.totalLearned || 0}
                />
                <StatTile
                  rootProps={{ "data-tour": "mastered" }}
                  label="Mastered"
                  icon={<Target />}
                  mono={false}
                  size="lg"
                  tone="success"
                  value={userStats?.mastered || 0}
                />
                <StatTile
                  rootProps={{ "data-tour": "due-today" }}
                  label="Due Today"
                  icon={<Calendar />}
                  mono={false}
                  size="lg"
                  tone={userStats?.dueToday ? "error" : "default"}
                  value={userStats?.dueToday || 0}
                />
                <StatTile
                  rootProps={{ "data-tour": "reviewed-today" }}
                  label="Reviewed Today"
                  icon={<Flame />}
                  mono={false}
                  size="lg"
                  tone="primary"
                  value={userStats?.reviewedToday || 0}
                />
              </div>
            </div>

            {/* Quick Actions */}
            {(userStats?.dueToday || 0) > 0 && (
              <div
                className="timer-card border-l-4 border-(--primary)"
                data-tour="srs-review-prompt"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-(--text-primary) font-statement mb-1">
                      You have {userStats?.dueToday} review
                      {userStats?.dueToday !== 1 ? "s" : ""} due
                    </h3>
                    <p className="text-sm text-(--text-muted)">
                      Keep your learning momentum going with spaced repetition
                    </p>
                  </div>
                  <Link
                    href="/cube-lab/algorithm-trainer/practice?mode=srs"
                    className="px-6 py-3 bg-(--primary) hover:bg-(--primary-hover) text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium whitespace-nowrap"
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
                <h2 className="text-xl font-bold text-(--text-primary) font-statement mb-4">
                  Practice Modes
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Link
                    href="/cube-lab/algorithm-trainer/practice?mode=drill&type=rec"
                    data-tour="recognition-drill"
                    className="timer-card hover:scale-[1.02] transition-all cursor-pointer border-2 border-transparent hover:border-(--primary)"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-(--primary)/10 rounded-lg">
                        <Brain className="w-8 h-8 text-(--primary)" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-(--text-primary) font-statement">
                          Recognition Drill
                        </h3>
                        <p className="text-sm text-(--text-muted)">
                          Practice identifying cases quickly
                        </p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/cube-lab/algorithm-trainer/practice?mode=drill&type=exec"
                    data-tour="execution-drill"
                    className="timer-card hover:scale-[1.02] transition-all cursor-pointer border-2 border-transparent hover:border-(--primary)"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-(--primary)/10 rounded-lg">
                        <Flame className="w-8 h-8 text-(--primary)" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-(--text-primary) font-statement">
                          Execution Drill
                        </h3>
                        <p className="text-sm text-(--text-muted)">
                          Improve algorithm execution speed
                        </p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/cube-lab/algorithm-trainer/practice?mode=drill&type=blind"
                    data-tour="blind-recognition"
                    className="timer-card hover:scale-[1.02] transition-all cursor-pointer border-2 border-transparent hover:border-(--primary)"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-(--accent)/10 rounded-lg">
                        <EyeOff className="w-8 h-8 text-(--accent)" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-(--text-primary) font-statement">
                          Blind Recognition
                        </h3>
                        <p className="text-sm text-(--text-muted)">
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
                <h2 className="text-2xl font-bold text-(--text-primary) font-statement">
                  Algorithm Sets
                </h2>
                <Link
                  href="/cube-lab/algorithm-trainer/custom"
                  data-tour="custom-sets-button"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-(--text-primary) bg-(--surface-elevated) hover:bg-(--surface) border border-(--border) rounded-lg transition-colors"
                >
                  <FolderPlus className="w-4 h-4" />
                  Custom Sets
                </Link>
              </div>

              {sets.length === 0 ? (
                /* Empty State */
                <div className="timer-card text-center py-12">
                  <Brain className="w-16 h-16 text-(--text-muted) mx-auto mb-4" />
                  <p className="text-(--text-muted)">
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
