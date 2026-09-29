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
import {
  Button,
  CalloutCard,
  ProgressBar,
  ProgressLabel,
} from "@/components/ui";
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
        <CalloutCard
          tone="primary"
          icon={<Trophy />}
          title="Goal Achieved!"
          description={
            <>
              Congratulations! You&apos;ve reached your{" "}
              {profile.goalType.replace("-", " ").toUpperCase()} goal with an
              average of {formatTime(currentAverage)}.
              <span className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                <span className="flex items-center gap-1">
                  <Target aria-hidden className="w-3.5 h-3.5" />
                  Target: {formatTime(targetTime)}
                </span>
                <span className="flex items-center gap-1 text-(--success)">
                  <CheckCircle2 aria-hidden className="w-3.5 h-3.5" />
                  Current: {formatTime(currentAverage)}
                </span>
              </span>
            </>
          }
          action={
            showGoalSetup ? undefined : (
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  className="w-full sm:w-auto"
                  iconLeft={<Target className="w-4 h-4" />}
                  onClick={() => setShowGoalSetup(true)}
                >
                  Set New Goal
                </Button>
                {onDismiss && (
                  <Button
                    variant="ghost"
                    className="w-full sm:w-auto"
                    onClick={onDismiss}
                  >
                    Dismiss
                  </Button>
                )}
              </div>
            )
          }
        />

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
      <CalloutCard
        tone="warning"
        icon={<AlertTriangle />}
        title="Target Date Passed"
        description={
          <>
            Your deadline for{" "}
            {profile.goalType.replace("-", " ").toUpperCase()} has passed.
            Don&apos;t worry, progress takes time! You can extend your deadline
            or set a new goal.
            <span className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
              <span className="flex items-center gap-1">
                <Target aria-hidden className="w-3.5 h-3.5" />
                Target: {formatTime(targetTime)}
              </span>
              <span className="flex items-center gap-1">
                <Clock aria-hidden className="w-3.5 h-3.5" />
                Current: {formatTime(currentAverage)}
              </span>
              <span className="flex items-center gap-1 text-(--warning)">
                <Calendar aria-hidden className="w-3.5 h-3.5" />
                {Math.abs(daysRemaining)} days overdue
              </span>
            </span>
          </>
        }
      >

        {currentAverage > targetTime && (
          <div className="mt-4 p-3 bg-(--surface-elevated) rounded-(--radius-panel) border border-(--border)">
            <ProgressLabel
              value={
                <span className="text-(--warning)">
                  {formatTime(currentAverage - targetTime)} to go
                </span>
              }
            >
              Gap to target
            </ProgressLabel>
            <ProgressBar
              size="sm"
              label="Gap to target"
              value={Math.min(100, (targetTime / currentAverage) * 100)}
            />
          </div>
        )}

        <div className="mt-4 space-y-4">
          <div>
            <p className="type-caption mb-2">Extend deadline:</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[14, 30, 60, 90].map((days) => (
                <Button
                  key={days}
                  size="sm"
                  variant="secondary"
                  fullWidth
                  disabled={isSubmitting}
                  onClick={() => handleExtendDeadline(days)}
                >
                  +{days} days
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-(--border)" />
            <span className="type-caption">or</span>
            <div className="flex-1 h-px bg-(--border)" />
          </div>

          <Button
            fullWidth
            iconLeft={<Target className="w-4 h-4" />}
            onClick={() => setShowGoalSetup(true)}
          >
            Set a Different Goal
          </Button>
        </div>
      </CalloutCard>

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
