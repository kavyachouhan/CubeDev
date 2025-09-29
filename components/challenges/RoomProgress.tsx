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
        <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement">
          Your Progress
        </h3>
        <span className="text-sm text-[var(--text-muted)] font-inter">
          {currentSolveIndex} / {totalSolves}
        </span>
      </div>

      <div className="space-y-4">
        <div className="w-full bg-[var(--surface-elevated)] rounded-full h-3">
          <div
            className="bg-[var(--primary)] h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {isCompleted && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-medium text-green-800 font-inter">
                Challenge Completed!
              </div>
              <div className="text-xs text-green-600 font-inter">
                Check the leaderboard for your ranking
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}