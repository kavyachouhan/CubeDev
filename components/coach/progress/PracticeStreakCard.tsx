"use client";

import { Flame, Award, Calendar, CheckCircle2 } from "lucide-react";
import { CollapsibleSection, StatCard } from "./utils";
import { ProgressStats } from "./types";

interface PracticeStreakCardProps {
  progressStats: ProgressStats;
}

export default function PracticeStreakCard({
  progressStats,
}: PracticeStreakCardProps) {
  return (
    <CollapsibleSection
      title="Practice Streak"
      storageKey="coach-progress-streak"
      defaultExpanded={true}
      dataTour="practice-streak"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <StatCard
          icon={Flame}
          iconColor="bg-(--warning)/10 text-(--warning)"
          label="Current"
          value={`${progressStats.currentStreak} days`}
          valueColor="text-(--warning)"
          subtitle={
            progressStats.currentStreak > 0 ? "Keep it going!" : "Start today"
          }
        />
        <StatCard
          icon={Award}
          iconColor="bg-(--success)/10 text-(--success)"
          label="Longest"
          value={`${progressStats.longestStreak} days`}
          valueColor="text-(--success)"
          subtitle="Personal best"
        />
        <StatCard
          icon={Calendar}
          iconColor="bg-(--primary)/10 text-(--primary)"
          label="This Week"
          value={`${progressStats.weekly.activeDays}/7`}
          valueColor="text-(--primary)"
          subtitle={`${progressStats.weekly.entries} entries`}
        />
        <StatCard
          icon={CheckCircle2}
          iconColor="bg-(--accent)/10 text-(--accent)"
          label="Completion"
          value={`${progressStats.completionRate.toFixed(0)}%`}
          valueColor="text-(--accent)"
          subtitle={`${progressStats.completedPlans} plans done`}
        />
      </div>
    </CollapsibleSection>
  );
}
