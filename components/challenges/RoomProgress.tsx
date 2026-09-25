"use client";

import { Check } from "lucide-react";

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

  const progress = (currentSolveIndex / totalSolves) * 100;

  return (
    <div className="timer-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-(--text-primary) font-statement">
          Your Progress
        </h3>
        <span className="text-sm text-(--text-muted) font-inter">
          {currentSolveIndex} / {totalSolves}
        </span>
      </div>

      <div className="space-y-4">
        <div className="w-full bg-(--surface-elevated) rounded-full h-3">
          <div
            className="bg-(--primary) h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {isCompleted && (
          <div className="flex items-center gap-2 p-3 bg-(--success)/10 border border-(--success)/25 rounded-(--radius-control)">
            <div className="w-8 h-8 bg-(--success) rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-(--on-primary)" />
            </div>
            <div>
              <div className="text-sm font-medium text-(--success) font-inter">
                Challenge Completed!
              </div>
              <div className="text-xs text-(--success) font-inter">
                Check the leaderboard for your ranking
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}