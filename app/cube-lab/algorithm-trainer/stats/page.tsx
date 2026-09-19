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
import { BarChart3 } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

export default function AlgorithmStatsPage() {
  const { user } = useUser();

  // Get recognition metrics
  const metrics = useQuery(
    api.algorithms.getRecognitionMetrics,
    user?.convexId ? { userId: user.convexId } : "skip",
  );

  // Get user stats
  const userStats = useQuery(
    api.algorithms.getUserStats,
    user?.convexId ? { userId: user.convexId } : "skip",
  );

  // Get recent practice sessions
  const recentSessions = useQuery(
    api.algorithms.getRecentSessions,
    user?.convexId ? { userId: user.convexId, limit: 20 } : "skip",
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

  // The queries return null when there is nothing to report for this user.
  const sessions = recentSessions ?? [];
  const hasCases = (metrics?.totalCases ?? 0) > 0;

  if (!metrics || !userStats || (!hasCases && sessions.length === 0)) {
    return (
      <ProtectedRoute>
        <CubeLabLayout activeSection="algorithm-trainer">
          <div className="container-responsive py-4 md:py-8">
            <PageHeader
              back={{ href: "/cube-lab/algorithm-trainer", label: "Algorithm Trainer" }}
              title="Algorithm Statistics"
            />
            <Card variant="static">
              <EmptyState
                size="page"
                icon={<BarChart3 />}
                title="No statistics yet"
                description="Start learning algorithm cases or practicing custom sets to see your analytics and progress here."
                action={
                  <ButtonLink href="/cube-lab/algorithm-trainer">
                    Browse algorithm sets
                  </ButtonLink>
                }
              />
            </Card>
          </div>
        </CubeLabLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <CubeLabLayout activeSection="algorithm-trainer">
        <div className="container-responsive py-4 md:py-8">
          <PageHeader
            back={{ href: "/cube-lab/algorithm-trainer", label: "Algorithm Trainer" }}
            title="Algorithm Statistics"
            description="Recognition speed, mastery and practice history across your sets."
          />
          <div className="space-y-4 md:space-y-6">
            {/* Quick Stats Overview - show only if there are learned cases */}
            {metrics.totalCases > 0 && (
              <RecognitionOverview
                metrics={metrics}
                recentSessions={sessions}
              />
            )}

            {/* Two Column Layout for Medium Stats - show only if there are learned cases */}
            {metrics.totalCases > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <TimeBreakdown metrics={metrics} />
                <MasteryProgress
                  totalCases={metrics.totalCases}
                  mastered={metrics.mastered}
                  learning={userStats.learning}
                  reviewing={userStats.reviewing}
                />
              </div>
            )}

            {/* Recognition Benchmarks - show only if there are learned cases */}
            {metrics.totalCases > 0 && (
              <RecognitionBenchmarks
                averageRecognitionTime={metrics.averageRecognitionTime}
                fastestRecognition={metrics.fastestRecognition}
                totalCases={metrics.totalCases}
              />
            )}

            {/* Overall Session Statistics */}
            {sessions.length > 0 && <SessionStats sessions={sessions} />}

            {/* Practice Session History */}
            {sessions.length > 0 && (
              <SessionHistory sessions={sessions} maxSessions={15} />
            )}
          </div>
        </div>
      </CubeLabLayout>
    </ProtectedRoute>
  );
}