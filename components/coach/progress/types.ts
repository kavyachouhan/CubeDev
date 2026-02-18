import { Id } from "@/convex/_generated/dataModel";

export interface ProgressSnapshot {
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

export interface CoachProfile {
  _id: Id<"coachProfiles">;
  userId: Id<"users">;
  currentAverage?: number;
  skillLevel: string;
  primaryEvent: string;
  goalType: string;
  customGoalTime?: number;
  targetDate: number;
  dailyPracticeMinutes: number;
  practiceSchedule?: string[];
  createdAt?: number;
}

export interface CurrentStats {
  average: number;
  bestSingle?: number;
  bestAo5?: number;
  bestAo12?: number;
  totalSolves: number;
}

export interface ProgressStats {
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  completedPlans: number;
  learningVelocity: number | null;
  consistencyImprovement: number | null;
  moodDistribution: {
    great: number;
    good: number;
    okay: number;
    frustrated: number;
    tired: number;
  };
  weekly: {
    solves: number;
    practiceMinutes: number;
    entries: number;
    activeDays: number;
    average: number | null;
  };
  monthly: {
    solves: number;
    practiceMinutes: number;
    entries: number;
    activeDays: number;
    average: number | null;
  };
  allTime: {
    solves: number;
    practiceMinutes: number;
    entries: number;
  };
  comparison: {
    prevMonthAverage: number | null;
    prevYearAverage: number | null;
    monthlyImprovement: number | null;
    yearlyImprovement: number | null;
  };
}

export const GOAL_TIMES: Record<string, number> = {
  "sub-60": 60000,
  "sub-45": 45000,
  "sub-30": 30000,
  "sub-20": 20000,
  "sub-15": 15000,
  "sub-12": 12000,
  "sub-10": 10000,
  "sub-8": 8000,
};
