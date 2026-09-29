"use client";

import { Check } from "lucide-react";
import { Card, CardHeader, ProgressBar } from "@/components/ui";

interface RoomProgressProps {
  userHasJoined: any;
  currentSolveIndex: number;
  totalSolves: number;
  isCompleted: boolean;
}

export default function RoomProgress({
  userHasJoined,
  currentSolveIndex,
  totalSolves,
  isCompleted,
}: RoomProgressProps) {
  if (!userHasJoined) return null;

  return (
    <Card>
      <CardHeader
        title="Your Progress"
        actions={
          <span className="type-caption">
            {currentSolveIndex} / {totalSolves}
          </span>
        }
      />

      <div className="space-y-4">
        <ProgressBar
          label="Solves completed"
          max={totalSolves}
          value={currentSolveIndex}
          valueText={`${currentSolveIndex} of ${totalSolves} solves`}
          tone={isCompleted ? "success" : "primary"}
        />

        {isCompleted && (
          <div className="flex items-center gap-2 p-3 bg-(--success)/10 border border-(--success)/25 rounded-(--radius-panel)">
            <span className="w-8 h-8 shrink-0 bg-(--success) rounded-full flex items-center justify-center">
              <Check aria-hidden className="w-5 h-5 text-(--on-media)" />
            </span>
            <div className="min-w-0">
              <p className="type-label text-(--success)!">
                Challenge Completed!
              </p>
              <p className="type-caption text-(--success)!">
                Check the leaderboard for your ranking
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
