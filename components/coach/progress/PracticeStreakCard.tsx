"use client";

import { Flame, Award, Calendar, CheckCircle2 } from "lucide-react";
import { CollapsibleCard, StatTile, useCollapsed } from "@/components/ui";
import { ProgressStats } from "./types";

interface PracticeStreakCardProps {
  progressStats: ProgressStats;
}

export default function PracticeStreakCard({
  progressStats,
}: PracticeStreakCardProps) {
  const collapsed = useCollapsed("coach-progress-streak", true);

  return (
    <CollapsibleCard
      title="Practice Streak"
      variant="static"
      open={collapsed.open}
      onOpenChange={collapsed.onOpenChange}
      rootProps={{ "data-tour": "practice-streak" }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <StatTile
          size="sm"
          mobileLayout="row"
          mono={false}
          icon={<Flame />}
          tone="warning"
          label="Current"
          value={`${progressStats.currentStreak} days`}
          hint={
            progressStats.currentStreak > 0 ? "Keep it going!" : "Start today"
          }
        />
        <StatTile
          size="sm"
          mobileLayout="row"
          mono={false}
          icon={<Award />}
          tone="success"
          label="Longest"
          value={`${progressStats.longestStreak} days`}
          hint="Personal best"
        />
        <StatTile
          size="sm"
          mobileLayout="row"
          mono={false}
          icon={<Calendar />}
          tone="primary"
          label="This Week"
          value={`${progressStats.weekly.activeDays}/7`}
          hint={`${progressStats.weekly.entries} entries`}
        />
        <StatTile
          size="sm"
          mobileLayout="row"
          mono={false}
          icon={<CheckCircle2 />}
          tone="accent"
          label="Completion"
          value={`${progressStats.completionRate.toFixed(0)}%`}
          hint={`${progressStats.completedPlans} plans done`}
        />
      </div>
    </CollapsibleCard>
  );
}
