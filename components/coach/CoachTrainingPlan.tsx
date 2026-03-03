"use client";

import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  ChevronDown,
  ChevronRight,
  Target,
  Dumbbell,
  Brain,
  Zap,
  Eye,
  Pause,
  SkipForward,
  Plus,
} from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface Activity {
  type: string;
  title: string;
  description: string;
  durationMinutes: number;
  targetSolves?: number;
  completed: boolean;
  completedAt?: number;
}

interface DailyPlan {
  dayOfWeek: number;
  date: number;
  focus: string;
  activities: Activity[];
  isCompleted: boolean;
  isRestDay: boolean;
}

interface TrainingPlan {
  _id: Id<"coachTrainingPlans">;
  userId: Id<"users">;
  profileId: Id<"coachProfiles">;
  weekNumber: number;
  weekStartDate: number;
  weekEndDate: number;
  status: "active" | "completed" | "skipped";
  dailyPlans: DailyPlan[];
  completedDays: number;
  totalDays: number;
  createdAt: number;
  updatedAt: number;
}

interface CoachTrainingPlanProps {
  plan: TrainingPlan;
  onActivityComplete?: (dayIndex: number, activityIndex: number) => void;
  onOpenJournal?: (dayDate: number) => void;
}

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const activityIcons: Record<string, React.ElementType> = {
  "timed-solves": Clock,
  "untimed-practice": Pause,
  "algorithm-drill": Brain,
  "slow-solves": Eye,
  reconstruction: Target,
  "cross-practice": Target,
  "f2l-practice": Dumbbell,
  "lookahead-training": Eye,
  "competition-sim": Zap,
  rest: Pause,
};

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function isToday(timestamp: number): boolean {
  const today = new Date();
  const date = new Date(timestamp);
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function isPast(timestamp: number): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return timestamp < today.getTime();
}

export default function CoachTrainingPlan({
  plan,
  onActivityComplete,
  onOpenJournal,
}: CoachTrainingPlanProps) {
  const [expandedDay, setExpandedDay] = useState<number | null>(() => {
    // Auto-expand today's plan
    const todayIndex = plan.dailyPlans.findIndex((d) => isToday(d.date));
    return todayIndex >= 0 ? todayIndex : null;
  });

  const updateActivity = useMutation(api.coach.updateActivityCompletion);
  const skipDay = useMutation(api.coach.skipTrainingDay);

  const handleActivityToggle = async (
    dayIndex: number,
    activityIndex: number,
    completed: boolean,
  ) => {
    try {
      await updateActivity({
        planId: plan._id,
        dayIndex,
        activityIndex,
        completed,
      });
      // Invalidate training plan cache to ensure consistency across components
      if (typeof window !== "undefined") {
        const { invalidateTrainingPlan } = await import("@/lib/coach-cache");
        invalidateTrainingPlan(plan.userId);
      }
      onActivityComplete?.(dayIndex, activityIndex);
    } catch (error) {
      console.error("Failed to update activity:", error);
    }
  };

  const handleSkipDay = async (dayIndex: number, reason?: string) => {
    try {
      await skipDay({
        planId: plan._id,
        dayIndex,
        reason,
      });
      // Invalidate training plan cache to ensure consistency
      if (typeof window !== "undefined") {
        const { invalidateTrainingPlan } = await import("@/lib/coach-cache");
        invalidateTrainingPlan(plan.userId);
      }
    } catch (error) {
      console.error("Failed to skip day:", error);
    }
  };

  const toggleDay = (index: number) => {
    setExpandedDay(expandedDay === index ? null : index);
  };

  const progressPercentage =
    plan.totalDays > 0
      ? Math.round((plan.completedDays / plan.totalDays) * 100)
      : 0;

  return (
    <div className="space-y-4">
      {/* Week Header Card */}
      <div className="timer-card" data-tour="week-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full bg-(--primary)/10 flex items-center justify-center"
              data-tour="recommendation-engine"
            >
              <Calendar className="w-5 h-5 text-(--primary)" />
            </div>
            <div>
              <span className="font-bold text-(--text-primary) block font-statement">
                Week {plan.weekNumber}
              </span>
              <span className="text-sm text-(--text-muted)">
                {formatDate(plan.weekStartDate)} -{" "}
                {formatDate(plan.weekEndDate)}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-(--primary)">
              {progressPercentage}%
            </span>
            <span className="text-xs text-(--text-muted) block">
              {plan.completedDays}/{plan.totalDays} days
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 h-2 bg-(--surface-elevated) rounded-full overflow-hidden">
          <div
            className="h-full bg-(--primary) transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Daily Plans */}
      <div className="space-y-2">
        {plan.dailyPlans.map((day, dayIndex) => {
          const isExpanded = expandedDay === dayIndex;
          const isTodayPlan = isToday(day.date);
          const isPastDay = isPast(day.date);
          const completedActivities = day.activities.filter(
            (a) => a.completed,
          ).length;
          const totalActivities = day.activities.length;

          return (
            <div
              key={dayIndex}
              data-tour={dayIndex === 0 ? "daily-plan" : undefined}
              className={`timer-card !p-0 overflow-hidden ${
                isTodayPlan
                  ? "!border-(--primary) !bg-(--primary)/5"
                  : ""
              }`}
            >
              {/* Day Header */}
              <div className="w-full flex items-center justify-between p-4">
                <button
                  onClick={() => toggleDay(dayIndex)}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      day.isCompleted
                        ? "bg-(--success) text-white"
                        : day.isRestDay
                          ? "bg-(--surface) text-(--text-muted)"
                          : isTodayPlan
                            ? "bg-(--primary) text-white"
                            : isPastDay
                              ? "bg-(--warning)/20 text-(--warning)"
                              : "bg-(--surface) text-(--text-muted)"
                    }`}
                  >
                    {day.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-medium">
                        {SHORT_DAYS[day.dayOfWeek][0]}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-(--text-primary) font-statement">
                        {DAYS_OF_WEEK[day.dayOfWeek]}
                      </span>
                      {isTodayPlan && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-(--primary) text-white rounded-full">
                          Today
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-(--text-muted)">
                      {day.isRestDay ? "Rest Day" : day.focus}
                    </span>
                  </div>
                </button>
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Add Journal Entry Button */}
                  {!day.isRestDay && onOpenJournal && (
                    <button
                      onClick={() => onOpenJournal(day.date)}
                      className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-medium transition-colors bg-(--surface-elevated) text-(--text-secondary) hover:bg-(--primary)/10 hover:text-(--primary) border border-(--border) flex items-center gap-1"
                      title="Add journal entry"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Add</span>
                    </button>
                  )}
                  {!day.isRestDay && (
                    <span className="text-sm text-(--text-muted)">
                      {completedActivities}/{totalActivities}
                    </span>
                  )}
                  <button
                    onClick={() => toggleDay(dayIndex)}
                    className="p-1"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-(--text-muted)" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-(--text-muted)" />
                    )}
                  </button>
                </div>
              </div>

              {/* Activities */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-2">
                  {day.activities.map((activity, activityIndex) => {
                    const Icon = activityIcons[activity.type] || Circle;

                    return (
                      <div
                        key={activityIndex}
                        data-tour={
                          dayIndex === 0 && activityIndex === 0
                            ? "activity-item"
                            : undefined
                        }
                        className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                          activity.completed
                            ? "bg-(--success)/10"
                            : "bg-(--surface)"
                        }`}
                      >
                        <button
                          onClick={() =>
                            handleActivityToggle(
                              dayIndex,
                              activityIndex,
                              !activity.completed,
                            )
                          }
                          className={`mt-0.5 shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            activity.completed
                              ? "bg-(--success) border-(--success) text-white"
                              : "border-(--border) hover:border-(--primary)"
                          }`}
                        >
                          {activity.completed && (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Icon
                              className={`w-4 h-4 ${
                                activity.completed
                                  ? "text-(--success)"
                                  : "text-(--primary)"
                              }`}
                            />
                            <span
                              className={`font-medium ${
                                activity.completed
                                  ? "text-(--text-muted) line-through"
                                  : "text-(--text-primary)"
                              }`}
                            >
                              {activity.title}
                            </span>
                          </div>
                          <p className="text-sm text-(--text-muted) mt-1">
                            {activity.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-(--text-muted)">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {activity.durationMinutes} min
                            </span>
                            {activity.targetSolves && (
                              <span className="flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                {activity.targetSolves} solves
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Skip Day Button - show for non-rest, non-completed days */}
                  {!day.isRestDay && !day.isCompleted && (
                    <div className="mt-3 pt-3 border-t border-(--border)">
                      <button
                        onClick={() => handleSkipDay(dayIndex, "Skipped")}
                        className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2 px-3 py-2 text-sm text-(--text-muted) hover:text-(--warning) hover:bg-(--surface) rounded-lg transition-colors"
                      >
                        <SkipForward className="w-4 h-4" />
                        Skip this day
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}