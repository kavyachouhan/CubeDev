"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  GoalProgressCard,
  GoalCompletionCard,
  GoalTimelineCard,
  PracticeStreakCard,
  WeeklySummaryCard,
  LearningMetricsCard,
  PerformanceIntelligenceCard,
  MonthlyOverviewCard,
  ProgressHistoryCard,
  AllTimeStatsCard,
  CoachProfile,
  ProgressSnapshot,
  CurrentStats,
  ProgressStats,
  GOAL_TIMES,
} from "./progress";
import {
  CoachGoalProgressSkeleton,
  CoachPracticeStreakSkeleton,
  CoachWeeklySummarySkeleton,
  CoachLearningMetricsSkeleton,
  CoachPerformanceIntelligenceSkeleton,
  CoachMonthlyOverviewSkeleton,
} from "@/components/SkeletonLoaders";

interface CoachProgressProps {
  profile: CoachProfile;
  snapshots: ProgressSnapshot[];
  currentStats?: CurrentStats;
}

export default function CoachProgress({
  profile,
  snapshots,
  currentStats,
}: CoachProgressProps) {
  // Fetch progress stats for the user. This includes weekly/monthly averages, streaks, and other metrics.
  const progressStats = useQuery(api.coach.getProgressStats, {
    userId: profile.userId,
  }) as ProgressStats | undefined;

  const isLoading = progressStats === undefined;

  const targetTime =
    profile.customGoalTime || GOAL_TIMES[profile.goalType] || 20000;
  const startingAverage = profile.currentAverage || targetTime * 1.5;

  // Use monthly average from progressStats for accurate current average
  const currentAverage = useMemo(() => {
    if (progressStats?.monthly?.average) {
      return progressStats.monthly.average;
    }
    if (progressStats?.weekly?.average) {
      return progressStats.weekly.average;
    }
    return currentStats?.average || startingAverage;
  }, [progressStats, currentStats, startingAverage]);

  // Show skeleton loaders while data is loading
  if (isLoading) {
    return (
      <div className="space-y-4">
        <CoachGoalProgressSkeleton />
        <CoachPracticeStreakSkeleton />
        <CoachWeeklySummarySkeleton />
        <CoachLearningMetricsSkeleton />
        <CoachPerformanceIntelligenceSkeleton />
        <CoachMonthlyOverviewSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Goal Completion/Expired Card - Shows when goal is achieved or deadline passed */}
      <GoalCompletionCard profile={profile} currentAverage={currentAverage} />

      {/* Goal Progress */}
      <GoalProgressCard
        profile={profile}
        currentAverage={currentAverage}
        startingAverage={startingAverage}
      />

      {/* Practice Streak */}
      {progressStats && <PracticeStreakCard progressStats={progressStats} />}

      {/* Weekly Summary */}
      {progressStats && <WeeklySummaryCard progressStats={progressStats} />}

      {/* Learning Metrics - Only shows if data available */}
      {progressStats && <LearningMetricsCard progressStats={progressStats} />}

      {/* Performance Intelligence */}
      {progressStats && (
        <PerformanceIntelligenceCard progressStats={progressStats} />
      )}

      {/* Monthly Overview */}
      {progressStats && <MonthlyOverviewCard progressStats={progressStats} />}

      {/* Progress History */}
      {snapshots.length > 0 && (
        <ProgressHistoryCard snapshots={snapshots} targetTime={targetTime} />
      )}

      {/* All-Time Stats */}
      {progressStats && <AllTimeStatsCard progressStats={progressStats} />}

      {/* Goal Timeline */}
      <GoalTimelineCard profile={profile} currentAverage={currentAverage} />
    </div>
  );
}
