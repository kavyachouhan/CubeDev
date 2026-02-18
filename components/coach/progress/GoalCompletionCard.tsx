"use client";

import { useState, useEffect } from "react";
import {
  Trophy,
  Target,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CoachProfile, GOAL_TIMES } from "./types";
import { formatTime, getDaysRemaining } from "./utils";
import GoalCelebration from "../GoalCelebration";
import GoalSetupModal from "../GoalSetupModal";

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

// Get next logical goal based on current goal - used for suggestions
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

export default function GoalCompletionCard({
  profile,
  currentAverage,
  onDismiss,
}: GoalCompletionCardProps) {
  const [showGoalSetup, setShowGoalSetup] = useState(false);
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

  if (status === "active") {
    return null;
  }

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

          {!showGoalSetup && (
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowGoalSetup(true)}
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
          )}
        </div>

        <GoalSetupModal
          isOpen={showGoalSetup}
          onClose={() => {
            setShowGoalSetup(false);
            onDismiss?.();
          }}
          profile={profile}
          currentAverage={currentAverage}
          mode="new"
        />
      </>
    );
  }

  // Expired status
  return (
    <>
      <div className="timer-card border-[var(--warning)]">
        <div className="flex flex-col items-center text-center sm:items-start sm:text-left sm:flex-row gap-4">
          <div className="w-14 h-14 sm:w-12 sm:h-12 rounded-full bg-[var(--warning)]/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-7 h-7 sm:w-6 sm:h-6 text-[var(--warning)]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1 font-statement">
              Target Date Passed
            </h3>
            <p className="text-sm text-[var(--text-muted)] mb-3">
              Your deadline for{" "}
              {profile.goalType.replace("-", " ").toUpperCase()} has passed.
              Don&apos;t worry, progress takes time! You can extend your
              deadline or set a new goal.
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

            {currentAverage > targetTime && (
              <div className="mt-3 p-2 bg-[var(--surface-elevated)] rounded-lg">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[var(--text-muted)]">
                    Gap to target:
                  </span>
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

        <div className="mt-6 space-y-4">
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
            onClick={() => setShowGoalSetup(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-white rounded-lg font-medium hover:bg-[var(--primary-hover)] transition-colors"
          >
            <Target className="w-4 h-4" />
            Set a Different Goal
          </button>
        </div>
      </div>

      <GoalSetupModal
        isOpen={showGoalSetup}
        onClose={() => {
          setShowGoalSetup(false);
          onDismiss?.();
        }}
        profile={profile}
        currentAverage={currentAverage}
        mode="new"
      />
    </>
  );
}
