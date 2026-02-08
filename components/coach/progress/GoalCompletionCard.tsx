"use client";

import { useState, useEffect } from "react";
import {
  Trophy,
  Target,
  Calendar,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  X,
} from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CoachProfile, GOAL_TIMES } from "./types";
import { formatTime, getDaysRemaining } from "./utils";
import GoalCelebration from "../GoalCelebration";

interface GoalCompletionCardProps {
  profile: CoachProfile;
  currentAverage: number;
  onDismiss?: () => void;
}

type GoalStatus = "achieved" | "expired" | "active";

function getGoalStatus(
  profile: CoachProfile,
  currentAverage: number,
): GoalStatus {
  const targetTime =
    profile.customGoalTime || GOAL_TIMES[profile.goalType] || 20000;
  const daysRemaining = getDaysRemaining(profile.targetDate);

  // Check if goal is achieved
  if (currentAverage <= targetTime) {
    return "achieved";
  }

  // Check if deadline has passed
  if (daysRemaining <= 0) {
    return "expired";
  }

  return "active";
}

type GoalType =
  | "sub-60"
  | "sub-45"
  | "sub-30"
  | "sub-20"
  | "sub-15"
  | "sub-12"
  | "sub-10"
  | "sub-8"
  | "custom";

// Get next logical goal based on current goal
function getNextGoal(currentGoal: string): GoalType {
  const goalProgression: GoalType[] = [
    "sub-60",
    "sub-45",
    "sub-30",
    "sub-20",
    "sub-15",
    "sub-12",
    "sub-10",
    "sub-8",
  ];
  const currentIndex = goalProgression.indexOf(currentGoal as GoalType);
  if (currentIndex >= 0 && currentIndex < goalProgression.length - 1) {
    return goalProgression[currentIndex + 1];
  }
  return (currentGoal as GoalType) || "sub-20";
}

export default function GoalCompletionCard({
  profile,
  currentAverage,
  onDismiss,
}: GoalCompletionCardProps) {
  const [showNewGoalForm, setShowNewGoalForm] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<GoalType>(() =>
    getNextGoal(profile.goalType),
  );
  const [customTime, setCustomTime] = useState<string>("");
  const [targetDays, setTargetDays] = useState<number>(90);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [hasShownCelebration, setHasShownCelebration] = useState(false);

  const updateGoal = useMutation(api.coach.updateGoal);

  const status = getGoalStatus(profile, currentAverage);
  const targetTime =
    profile.customGoalTime || GOAL_TIMES[profile.goalType] || 20000;
  const daysRemaining = getDaysRemaining(profile.targetDate);

  // Show celebration when goal is first achieved
  // Use createdAt to uniquely identify each goal instance so celebration shows for each new goal
  useEffect(() => {
    if (status === "achieved" && !hasShownCelebration) {
      // Check if we've already celebrated this specific goal (using createdAt for uniqueness)
      const goalIdentifier = profile.createdAt || profile._id;
      const celebratedKey = `goal-celebrated-${profile._id}-${goalIdentifier}`;
      const alreadyCelebrated = localStorage.getItem(celebratedKey);

      if (!alreadyCelebrated) {
        setShowCelebration(true);
        localStorage.setItem(celebratedKey, Date.now().toString());
      }
      setHasShownCelebration(true);
    }
  }, [status, hasShownCelebration, profile._id, profile.createdAt]);

  // Don't render if goal is still active
  if (status === "active") {
    return null;
  }

  const handleSetNewGoal = async () => {
    setIsSubmitting(true);
    try {
      const newTargetDate = Date.now() + targetDays * 24 * 60 * 60 * 1000;
      const newCustomTime =
        selectedGoal === "custom" && customTime
          ? parseFloat(customTime) * 1000
          : undefined;

      await updateGoal({
        userId: profile.userId,
        goalType: selectedGoal,
        customGoalTime: newCustomTime,
        targetDate: newTargetDate,
        currentAverage: currentAverage,
      });

      setShowNewGoalForm(false);
      onDismiss?.();
    } catch (error) {
      console.error("Failed to update goal:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExtendDeadline = async (days: number) => {
    setIsSubmitting(true);
    try {
      const newTargetDate = Date.now() + days * 24 * 60 * 60 * 1000;
      await updateGoal({
        userId: profile.userId,
        goalType: profile.goalType as GoalType,
        customGoalTime: profile.customGoalTime,
        targetDate: newTargetDate,
      });
      onDismiss?.();
    } catch (error) {
      console.error("Failed to extend deadline:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // All goals matching coach onboarding
  const allGoals = [
    {
      id: "sub-60",
      label: "Sub 60",
      time: 60000,
      description: "Great starting goal",
    },
    {
      id: "sub-45",
      label: "Sub 45",
      time: 45000,
      description: "Building consistency",
    },
    {
      id: "sub-30",
      label: "Sub 30",
      time: 30000,
      description: "Intermediate territory",
    },
    {
      id: "sub-20",
      label: "Sub 20",
      time: 20000,
      description: "Solid intermediate",
    },
    {
      id: "sub-15",
      label: "Sub 15",
      time: 15000,
      description: "Advanced milestone",
    },
    {
      id: "sub-12",
      label: "Sub 12",
      time: 12000,
      description: "Competition-ready",
    },
    { id: "sub-10", label: "Sub 10", time: 10000, description: "Elite level" },
    { id: "sub-8", label: "Sub 8", time: 8000, description: "World-class" },
    {
      id: "custom",
      label: "Custom",
      time: null,
      description: "Set your own target",
    },
  ];

  // Filter to goals that make sense (faster than current average)
  const goalOptions = allGoals.filter(
    (g) => !g.time || g.time < currentAverage,
  );

  if (status === "achieved") {
    return (
      <>
        <GoalCelebration
          show={showCelebration}
          goalType={profile.goalType}
          timeValue={formatTime(currentAverage)}
          customGoalTime={profile.customGoalTime}
          onComplete={() => setShowCelebration(false)}
        />
        <div className="timer-card border-[var(--success)]">
          {/* Mobile: stacked layout, Desktop: side by side */}
          <div className="flex flex-col items-center text-center sm:items-start sm:text-left sm:flex-row gap-4">
            <div className="w-14 h-14 sm:w-12 sm:h-12 rounded-full bg-[var(--success)]/10 flex items-center justify-center shrink-0">
              <Trophy className="w-7 h-7 sm:w-6 sm:h-6 text-[var(--success)]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                Goal Achieved!
              </h3>
              <p className="text-sm text-[var(--text-muted)] mb-3">
                Congratulations! You&apos;ve reached your{" "}
                {profile.goalType.replace("-", " ").toUpperCase()} goal with an
                average of {formatTime(currentAverage)}.
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <Target className="w-3.5 h-3.5" />
                  Target: {formatTime(targetTime)}
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />
                  Current: {formatTime(currentAverage)}
                </span>
              </div>
            </div>
          </div>

          {!showNewGoalForm ? (
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowNewGoalForm(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-white rounded-lg font-medium hover:bg-[var(--primary-hover)] transition-colors"
              >
                <Target className="w-4 h-4" />
                Set New Goal
              </button>
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="px-4 py-2.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Dismiss
                </button>
              )}
            </div>
          ) : (
            <NewGoalForm
              goalOptions={goalOptions}
              selectedGoal={selectedGoal}
              setSelectedGoal={setSelectedGoal}
              customTime={customTime}
              setCustomTime={setCustomTime}
              targetDays={targetDays}
              setTargetDays={setTargetDays}
              isSubmitting={isSubmitting}
              onSubmit={handleSetNewGoal}
              onCancel={() => setShowNewGoalForm(false)}
            />
          )}
        </div>
      </>
    );
  }

  // Expired status
  return (
    <div className="timer-card border-[var(--warning)]">
      {/* Mobile: stacked layout, Desktop: side by side */}
      <div className="flex flex-col items-center text-center sm:items-start sm:text-left sm:flex-row gap-4">
        <div className="w-14 h-14 sm:w-12 sm:h-12 rounded-full bg-[var(--warning)]/10 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-7 h-7 sm:w-6 sm:h-6 text-[var(--warning)]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1 font-statement">
            Target Date Passed
          </h3>
          <p className="text-sm text-[var(--text-muted)] mb-3">
            Your deadline for {profile.goalType.replace("-", " ").toUpperCase()}{" "}
            has passed. Don&apos;t worry, progress takes time! You can extend
            your deadline or set a new goal.
          </p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <Target className="w-3.5 h-3.5" />
              Target: {formatTime(targetTime)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Current: {formatTime(currentAverage)}
            </span>
            <span className="flex items-center gap-1 text-[var(--warning)]">
              <Calendar className="w-3.5 h-3.5" />
              {Math.abs(daysRemaining)} days overdue
            </span>
          </div>

          {/* Progress indicator - how close to goal */}
          {currentAverage > targetTime && (
            <div className="mt-3 p-2 bg-[var(--surface-elevated)] rounded-lg">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[var(--text-muted)]">Gap to target:</span>
                <span className="font-medium text-[var(--warning)]">
                  {formatTime(currentAverage - targetTime)} to go
                </span>
              </div>
              <div className="h-1.5 bg-[var(--surface)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--primary)] transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (targetTime / currentAverage) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {!showNewGoalForm ? (
        <div className="mt-6 space-y-4">
          {/* Quick extend options */}
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-2">
              Extend deadline:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[14, 30, 60, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => handleExtendDeadline(days)}
                  disabled={isSubmitting}
                  className="px-3 sm:px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors disabled:opacity-50"
                >
                  +{days} days
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-xs text-[var(--text-muted)]">or</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          <button
            onClick={() => setShowNewGoalForm(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-white rounded-lg font-medium hover:bg-[var(--primary-hover)] transition-colors"
          >
            <Target className="w-4 h-4" />
            Set a Different Goal
          </button>
        </div>
      ) : (
        <NewGoalForm
          goalOptions={goalOptions}
          selectedGoal={selectedGoal}
          setSelectedGoal={setSelectedGoal}
          customTime={customTime}
          setCustomTime={setCustomTime}
          targetDays={targetDays}
          setTargetDays={setTargetDays}
          isSubmitting={isSubmitting}
          onSubmit={handleSetNewGoal}
          onCancel={() => setShowNewGoalForm(false)}
        />
      )}
    </div>
  );
}

interface NewGoalFormProps {
  goalOptions: {
    id: string;
    label: string;
    time: number | null;
    description: string;
  }[];
  selectedGoal: GoalType;
  setSelectedGoal: (goal: GoalType) => void;
  customTime: string;
  setCustomTime: (time: string) => void;
  targetDays: number;
  setTargetDays: (days: number) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

function NewGoalForm({
  goalOptions,
  selectedGoal,
  setSelectedGoal,
  customTime,
  setCustomTime,
  targetDays,
  setTargetDays,
  isSubmitting,
  onSubmit,
  onCancel,
}: NewGoalFormProps) {
  return (
    <div className="mt-6 space-y-4">
      {/* Goal Selection */}
      <div>
        <label className="text-sm font-medium text-[var(--text-primary)] mb-3 block">
          Select New Goal
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {goalOptions.map((goal) => (
            <button
              key={goal.id}
              onClick={() => setSelectedGoal(goal.id as GoalType)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                selectedGoal === goal.id
                  ? "border-[var(--primary)] bg-[var(--primary)]/10"
                  : "border-[var(--border)] hover:border-[var(--primary)]"
              }`}
            >
              <span
                className={`font-medium block ${
                  selectedGoal === goal.id
                    ? "text-[var(--primary)]"
                    : "text-[var(--text-primary)]"
                }`}
              >
                {goal.label}
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                {goal.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Time Input */}
      {selectedGoal === "custom" && (
        <div>
          <label className="text-sm font-medium text-[var(--text-primary)] mb-2 block">
            Target Time (seconds)
          </label>
          <input
            type="number"
            value={customTime}
            onChange={(e) => setCustomTime(e.target.value)}
            placeholder="e.g., 25"
            min="1"
            step="0.1"
            className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>
      )}

      {/* Timeline Selection */}
      <div>
        <label className="text-sm font-medium text-[var(--text-primary)] mb-2 block">
          Target Timeline
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[30, 60, 90].map((days) => (
            <button
              key={days}
              onClick={() => setTargetDays(days)}
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                targetDays === days
                  ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                  : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]"
              }`}
            >
              {days} days
            </button>
          ))}
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-2">
          Target date:{" "}
          {new Date(
            Date.now() + targetDays * 24 * 60 * 60 * 1000,
          ).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={onSubmit}
          disabled={isSubmitting || (selectedGoal === "custom" && !customTime)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-white rounded-lg font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
        >
          {isSubmitting ? (
            "Saving..."
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Confirm New Goal
            </>
          )}
        </button>
        <button
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2.5 border border-[var(--border)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
