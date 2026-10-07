"use client";

import { Clock, BarChart3, Calendar } from "lucide-react";
import { CollapsibleCard, StatTile, useCollapsed } from "@/components/ui";
import { formatDuration } from "./utils";
import { ProgressStats } from "./types";

interface AllTimeStatsCardProps {
  progressStats: ProgressStats;
}

export default function AllTimeStatsCard({
  progressStats,
}: AllTimeStatsCardProps) {
  const collapsed = useCollapsed("coach-progress-alltime", false);

  return (
    <CollapsibleCard
      title="All-Time Stats"
      variant="static"
      open={collapsed.open}
      onOpenChange={collapsed.onOpenChange}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
        <StatTile
          size="sm"
          mobileLayout="row"
          mono={false}
          icon={<Clock />}
          tone="primary"
          label="Practice"
          value={formatDuration(progressStats.allTime.practiceMinutes)}
        />
        <StatTile
          size="sm"
          mobileLayout="row"
          mono={false}
          icon={<BarChart3 />}
          tone="accent"
          label="Solves"
          value={progressStats.allTime.solves.toLocaleString()}
        />
        <StatTile
          size="sm"
          mobileLayout="row"
          mono={false}
          icon={<Calendar />}
          tone="success"
          label="Entries"
          value={progressStats.allTime.entries.toLocaleString()}
        />
      </div>
    </CollapsibleCard>
  );
}
