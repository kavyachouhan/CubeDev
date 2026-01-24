"use client";

import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Calendar, 
  Clock, 
  BookOpen,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface ProgressSnapshot {
  _id: Id<"coachProgressSnapshots">;
  userId: Id<"users">;
  profileId: Id<"coachProfiles">;
  snapshotDate: number;
  weekNumber: number;
  averageTime: number;
  bestSingle?: number;
  bestAo5?: number;
  bestAo12?: number;
  totalSolves: number;
  totalPracticeMinutes: number;
  journalEntries: number;
  progressPercentage: number;
  onTrack: boolean;
  createdAt: number;
}

interface CoachProfile {
  _id: Id<"coachProfiles">;
  userId: Id<"users">;
  currentAverage?: number;
  skillLevel: string;
  primaryEvent: string;
  goalType: string;
  customGoalTime?: number;
  targetDate: number;
  dailyPracticeMinutes: number;
}

interface CoachProgressProps {
  profile: CoachProfile;
  snapshots: ProgressSnapshot[];
  currentStats?: {
    average: number;
    bestSingle?: number;
    bestAo5?: number;
    bestAo12?: number;
    totalSolves: number;
  };
}

const goalTimes: Record<string, number> = {
  "sub-60": 60000,
  "sub-45": 45000,
  "sub-30": 30000,
  "sub-20": 20000,
  "sub-15": 15000,
  "sub-12": 12000,
  "sub-10": 10000,
  "sub-8": 8000,
};

function formatTime(ms: number): string {
  const seconds = ms / 1000;
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(2);
  return mins > 0 ? `${mins}:${secs.padStart(5, "0")}` : secs;
}

function getDaysRemaining(targetDate: number): number {
  return Math.ceil((targetDate - Date.now()) / (24 * 60 * 60 * 1000));
}

function getProgressPercentage(currentAvg: number, startAvg: number, goalTime: number): number {
  if (currentAvg <= goalTime) return 100;
  if (currentAvg >= startAvg) return 0;
  
  const totalImprovement = startAvg - goalTime;
  const currentImprovement = startAvg - currentAvg;
  return Math.min(100, Math.max(0, (currentImprovement / totalImprovement) * 100));
}

export default function CoachProgress({
  profile,
  snapshots,
  currentStats,
}: CoachProgressProps) {
  const targetTime = profile.customGoalTime || goalTimes[profile.goalType] || 20000;
  const startingAverage = profile.currentAverage || targetTime * 1.5;
  const currentAverage = currentStats?.average || startingAverage;
  
  const progressPercentage = getProgressPercentage(currentAverage, startingAverage, targetTime);
  const daysRemaining = getDaysRemaining(profile.targetDate);
  const isOnTrack = progressPercentage >= (100 - daysRemaining / 90 * 100);
  
  const improvement = startingAverage - currentAverage;
  const improvementPercentage = ((improvement / startingAverage) * 100).toFixed(1);
  
  // Get latest snapshot for comparison
  const latestSnapshot = snapshots[0];
  const previousAverage = latestSnapshot?.averageTime || startingAverage;
  const weeklyChange = previousAverage - currentAverage;

  return (
    <div className="space-y-6">
      {/* Main Progress Card */}
      <div className="timer-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[var(--text-primary)]">Goal Progress</h3>
          {isOnTrack ? (
            <span className="flex items-center gap-1 text-sm text-[var(--success)] px-2 py-1 bg-[var(--success)]/10 rounded-full">
              <CheckCircle2 className="w-4 h-4" />
              On Track
            </span>
          ) : (
            <span className="flex items-center gap-1 text-sm text-[var(--warning)] px-2 py-1 bg-[var(--warning)]/10 rounded-full">
              <AlertCircle className="w-4 h-4" />
              Needs Focus
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-[var(--text-muted)]">
              Start: {formatTime(startingAverage)}
            </span>
            <span className="font-bold text-[var(--primary)] text-lg">
              {progressPercentage.toFixed(0)}%
            </span>
            <span className="text-[var(--success)]">
              Goal: {formatTime(targetTime)}
            </span>
          </div>
          <div className="h-3 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[var(--primary)] transition-all duration-500 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Current Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center p-3 bg-[var(--surface-elevated)] rounded-lg">
            <span className="text-xs text-[var(--text-muted)] block mb-1">Current Avg</span>
            <span className="text-xl font-bold text-[var(--primary)]">
              {formatTime(currentAverage)}
            </span>
          </div>
          <div className="text-center p-3 bg-[var(--surface-elevated)] rounded-lg">
            <span className="text-xs text-[var(--text-muted)] block mb-1">Improvement</span>
            <span className={`text-xl font-bold ${improvement > 0 ? "text-[var(--success)]" : "text-[var(--text-primary)]"}`}>
              {improvement > 0 ? "-" : "+"}{formatTime(Math.abs(improvement))}
            </span>
          </div>
          <div className="text-center p-3 bg-[var(--surface-elevated)] rounded-lg">
            <span className="text-xs text-[var(--text-muted)] block mb-1">Days Left</span>
            <span className="text-xl font-bold text-[var(--text-primary)]">
              {daysRemaining}
            </span>
          </div>
          <div className="text-center p-3 bg-[var(--surface-elevated)] rounded-lg">
            <span className="text-xs text-[var(--text-muted)] block mb-1">Total Solves</span>
            <span className="text-xl font-bold text-[var(--text-primary)]">
              {currentStats?.totalSolves || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Personal Bests Card */}
      {currentStats && (currentStats.bestSingle || currentStats.bestAo5 || currentStats.bestAo12) && (
        <div className="timer-card">
          <h4 className="font-semibold text-[var(--text-primary)] mb-4">Personal Bests</h4>
          <div className="grid grid-cols-3 gap-4">
            {currentStats.bestSingle && (
              <div className="text-center p-3 bg-[var(--surface-elevated)] rounded-lg">
                <span className="text-xs text-[var(--text-muted)] block mb-1">Single</span>
                <span className="font-bold text-[var(--success)]">
                  {formatTime(currentStats.bestSingle)}
                </span>
              </div>
            )}
            {currentStats.bestAo5 && (
              <div className="text-center p-3 bg-[var(--surface-elevated)] rounded-lg">
                <span className="text-xs text-[var(--text-muted)] block mb-1">Ao5</span>
                <span className="font-bold text-[var(--text-primary)]">
                  {formatTime(currentStats.bestAo5)}
                </span>
              </div>
            )}
            {currentStats.bestAo12 && (
              <div className="text-center p-3 bg-[var(--surface-elevated)] rounded-lg">
                <span className="text-xs text-[var(--text-muted)] block mb-1">Ao12</span>
                <span className="font-bold text-[var(--text-primary)]">
                  {formatTime(currentStats.bestAo12)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Weekly Trend Card */}
      {weeklyChange !== 0 && (
        <div className={`timer-card ${
          weeklyChange > 0 
            ? "!bg-[var(--success)]/5 !border-[var(--success)]/30" 
            : "!bg-[var(--warning)]/5 !border-[var(--warning)]/30"
        }`}>
          <div className="flex items-center gap-3">
            {weeklyChange > 0 ? (
              <div className="w-10 h-10 rounded-full bg-[var(--success)]/10 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-[var(--success)]" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-[var(--warning)]/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[var(--warning)]" />
              </div>
            )}
            <div>
              <span className={`font-semibold block ${
                weeklyChange > 0 ? "text-[var(--success)]" : "text-[var(--warning)]"
              }`}>
                {weeklyChange > 0 ? "Improving!" : "Slower this week"}
              </span>
              <span className="text-sm text-[var(--text-secondary)]">
                {weeklyChange > 0 
                  ? `You improved by ${formatTime(weeklyChange)} since last snapshot`
                  : `Your average went up by ${formatTime(Math.abs(weeklyChange))}`
                }
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Progress History Card */}
      {snapshots.length > 0 && (
        <div className="timer-card">
          <h4 className="font-semibold text-[var(--text-primary)] mb-4">Progress History</h4>
          <div className="space-y-2">
            {snapshots.slice(0, 5).map((snapshot, index) => (
              <div 
                key={snapshot._id}
                className="flex items-center justify-between p-3 bg-[var(--surface-elevated)] rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[var(--text-muted)]">
                    Week {snapshot.weekNumber}
                  </span>
                  <span className="font-bold text-[var(--primary)]">
                    {formatTime(snapshot.averageTime)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                  <span>{snapshot.totalSolves} solves</span>
                  <span>{snapshot.journalEntries} entries</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
