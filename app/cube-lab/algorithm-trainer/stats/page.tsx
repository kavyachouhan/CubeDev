"use client";

import { useUser } from "@/components/UserProvider";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import CubeLabLayout from "@/components/CubeLabLayout";
import {
  RecognitionOverview,
  TimeBreakdown,
  MasteryProgress,
  SessionHistory,
  SessionStats,
  RecognitionBenchmarks,
} from "@/components/algorithm";
import { AlgorithmStatsSkeleton } from "@/components/SkeletonLoaders";
import { BarChart3, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AlgorithmStatsPage() {
  const { user } = useUser();

  // Get recognition metrics
  const metrics = useQuery(
    api.algorithms.getRecognitionMetrics,
    user?.convexId ? { userId: user.convexId } : "skip"
  );

  // Get user stats
  const userStats = useQuery(
    api.algorithms.getUserStats,
    user?.convexId ? { userId: user.convexId } : "skip"
  );

  // Get recent practice sessions
  const recentSessions = useQuery(
    api.algorithms.getRecentSessions,
    user?.convexId ? { userId: user.convexId, limit: 20 } : "skip"
  );

  if (!user) {
    return null;
  }

  if (
    metrics === undefined ||
    recentSessions === undefined ||
    userStats === undefined
  ) {
    return (
      <ProtectedRoute>
        <CubeLabLayout activeSection="algorithm-trainer">
          <AlgorithmStatsSkeleton />
        </CubeLabLayout>
      </ProtectedRoute>
    );
  }

  // If no cases learned yet, show placeholder
  if (metrics.totalCases === 0) {
    return (
      <ProtectedRoute>
        <CubeLabLayout activeSection="algorithm-trainer">
          <div className="h-full flex items-center justify-center p-4">
            <div className="timer-card max-w-md text-center">
              <BarChart3 className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-[var(--text-primary)] font-statement mb-4">
                No Statistics Yet
              </h2>
              <p className="text-[var(--text-muted)] mb-6">
                Start learning algorithm cases to see your recognition analytics
                and progress tracking here.
              </p>
              <Link
                href="/cube-lab/algorithm-trainer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors"
              >
                Browse Algorithm Sets
              </Link>
            </div>
          </div>
        </CubeLabLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <CubeLabLayout activeSection="algorithm-trainer">
        <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <Link
                href="/cube-lab/algorithm-trainer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[var(--border)] hover:bg-[var(--surface-elevated)] text-[var(--text-primary)] rounded-lg transition-colors w-fit"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Algorithm Trainer
              </Link>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] font-statement">
                Algorothm Trainer Statistics
              </h1>
            </div>

            {/* Quick Stats Overview */}
            <RecognitionOverview
              metrics={metrics}
              recentSessions={recentSessions}
            />

            {/* Two Column Layout for Medium Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TimeBreakdown metrics={metrics} />
              <MasteryProgress
                totalCases={metrics.totalCases}
                mastered={metrics.mastered}
                learning={userStats.learning}
                reviewing={userStats.reviewing}
              />
            </div>

            {/* Recognition Benchmarks */}
            <RecognitionBenchmarks
              averageRecognitionTime={metrics.averageRecognitionTime}
              fastestRecognition={metrics.fastestRecognition}
              totalCases={metrics.totalCases}
            />

            {/* Overall Session Statistics */}
            {recentSessions.length > 0 && (
              <SessionStats sessions={recentSessions} />
            )}

            {/* Practice Session History */}
            {recentSessions.length > 0 && (
              <SessionHistory sessions={recentSessions} maxSessions={15} />
            )}
          </div>
        </div>
      </CubeLabLayout>
    </ProtectedRoute>
  );
}