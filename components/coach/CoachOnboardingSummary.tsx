"use client";

import { Target, Calendar, Clock, CheckCircle2, BarChart3 } from "lucide-react";
import { OnboardingData } from "./CoachOnboarding";

interface CoachOnboardingSummaryProps {
  data: OnboardingData;
}

const eventNames: Record<string, string> = {
  "333": "3x3 Cube",
  "222": "2x2 Cube",
  "444": "4x4 Cube",
  "555": "5x5 Cube",
  "666": "6x6 Cube",
  "777": "7x7 Cube",
  "333oh": "3x3 One-Handed",
  pyram: "Pyraminx",
  minx: "Megaminx",
  skewb: "Skewb",
  clock: "Clock",
  sq1: "Square-1",
};

const goalLabels: Record<string, string> = {
  "sub-60": "Sub 60 seconds",
  "sub-45": "Sub 45 seconds",
  "sub-30": "Sub 30 seconds",
  "sub-20": "Sub 20 seconds",
  "sub-15": "Sub 15 seconds",
  "sub-12": "Sub 12 seconds",
  "sub-10": "Sub 10 seconds",
  "sub-8": "Sub 8 seconds",
  custom: "Custom Goal",
};

const skillLabels: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
};

function formatTime(ms: number): string {
  const seconds = ms / 1000;
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(2);
  return mins > 0 ? `${mins}:${secs.padStart(5, "0")}` : secs;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getDaysUntil(timestamp: number): number {
  const now = Date.now();
  return Math.ceil((timestamp - now) / (24 * 60 * 60 * 1000));
}

export default function CoachOnboardingSummary({
  data,
}: CoachOnboardingSummaryProps) {
  const daysUntilTarget = getDaysUntil(data.targetDate);
  const weeksUntilTarget = Math.floor(daysUntilTarget / 7);
  const totalWeeklyMinutes =
    data.dailyPracticeMinutes * data.practiceSchedule.length;
  const totalWeeklyHours = totalWeeklyMinutes / 60;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="timer-card text-center">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          Ready to Start Your Training!
        </h2>
        <p className="text-[var(--text-secondary)]">
          Review your training plan before we generate your personalized weekly
          schedule.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Current Level */}
        <div className="timer-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <div>
              <span className="text-xs text-[var(--text-muted)]">
                Current Level
              </span>
              <span className="font-bold text-[var(--text-primary)] block">
                {skillLabels[data.skillLevel]}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm p-2 bg-[var(--surface-elevated)] rounded">
              <span className="text-[var(--text-muted)]">Event</span>
              <span className="font-medium text-[var(--text-primary)]">
                3x3 Cube
              </span>
            </div>
            {data.currentAverage && (
              <div className="flex items-center justify-between text-sm p-2 bg-[var(--surface-elevated)] rounded">
                <span className="text-[var(--text-muted)]">Average</span>
                <span className="font-medium text-[var(--primary)]">
                  {formatTime(data.currentAverage)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Goal */}
        <div className="timer-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[var(--success)]/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-[var(--success)]" />
            </div>
            <div>
              <span className="text-xs text-[var(--text-muted)]">
                Your Goal
              </span>
              <span className="font-bold text-[var(--text-primary)] block">
                {goalLabels[data.goalType]}
              </span>
            </div>
          </div>
          {data.customGoalTime && data.goalType === "custom" && (
            <div className="flex items-center justify-between text-sm p-2 bg-[var(--surface-elevated)] rounded">
              <span className="text-[var(--text-muted)]">Target Time</span>
              <span className="font-medium text-[var(--success)]">
                {formatTime(data.customGoalTime)}
              </span>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="timer-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[var(--warning)]/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[var(--warning)]" />
            </div>
            <div>
              <span className="text-xs text-[var(--text-muted)]">
                Target Date
              </span>
              <span className="font-bold text-[var(--text-primary)] block">
                {formatDate(data.targetDate)}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm p-2 bg-[var(--surface-elevated)] rounded">
            <span className="text-[var(--text-muted)]">Time Remaining</span>
            <span className="font-medium text-[var(--primary)]">
              {daysUntilTarget} days
            </span>
          </div>
        </div>

        {/* Schedule */}
        <div className="timer-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[var(--info)]/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-[var(--info)]" />
            </div>
            <div>
              <span className="text-xs text-[var(--text-muted)]">
                Weekly Commitment
              </span>
              <span className="font-bold text-[var(--text-primary)] block">
                {totalWeeklyHours.toFixed(1)} hours/week
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm p-2 bg-[var(--surface-elevated)] rounded">
              <span className="text-[var(--text-muted)]">Daily</span>
              <span className="font-medium text-[var(--text-primary)]">
                {data.dailyPracticeMinutes} min
              </span>
            </div>
            <div className="flex items-center justify-between text-sm p-2 bg-[var(--surface-elevated)] rounded">
              <span className="text-[var(--text-muted)]">Days</span>
              <span className="font-medium text-[var(--text-primary)]">
                {data.practiceSchedule.length} days/week
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* What to Expect Card */}
      <div className="timer-card !bg-[var(--primary)]/5 !border-[var(--primary)]/20">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-5 h-5 text-[var(--primary)]" />
          <h3 className="font-semibold text-[var(--text-primary)]">
            What to Expect
          </h3>
        </div>
        <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
          <li className="flex items-start gap-2">
            <span className="text-[var(--primary)] font-bold">1.</span>
            <span>
              Personalized weekly training plans based on your schedule and
              goals
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--primary)] font-bold">2.</span>
            <span>
              Daily activities focused on different aspects of solving
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--primary)] font-bold">3.</span>
            <span>Journal entries to track your progress and reflections</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--primary)] font-bold">4.</span>
            <span>
              Adaptive plans that adjust based on your actual progress
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
