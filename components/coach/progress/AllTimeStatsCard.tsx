"use client";

import { Clock, BarChart3, Calendar } from "lucide-react";
import { CollapsibleSection, StatCard, formatDuration } from "./utils";
import { ProgressStats } from "./types";

interface AllTimeStatsCardProps {
  progressStats: ProgressStats;
}

export default function AllTimeStatsCard({
  progressStats,
}: AllTimeStatsCardProps) {
  return (
    <CollapsibleSection
      title="All-Time Stats"
      storageKey="coach-progress-alltime"
      defaultExpanded={false}
    >
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
        <StatCard
          icon={Clock}
          iconColor="bg-(--primary)/10 text-(--primary)"
          label="Practice"
          value={formatDuration(progressStats.allTime.practiceMinutes)}
        />
        <StatCard
          icon={BarChart3}
          iconColor="bg-(--accent)/10 text-(--accent)"
          label="Solves"
          value={progressStats.allTime.solves.toLocaleString()}
        />
        <StatCard
          icon={Calendar}
          iconColor="bg-(--success)/10 text-(--success)"
          label="Entries"
          value={progressStats.allTime.entries.toLocaleString()}
        />
      </div>
    </CollapsibleSection>
  );
}
