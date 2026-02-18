"use client";

import { useState } from "react";
import { Target, Trophy, AlertTriangle, Pencil, Plus } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import GoalSetupModal from "./GoalSetupModal";

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
  practiceSchedule?: string[];
}

const GOAL_TIMES: Record<string, number> = {
  "sub-60": 60000,
  "sub-45": 45000,
  "sub-30": 30000,
  "sub-20": 20000,
  "sub-15": 15000,
  "sub-12": 12000,
  "sub-10": 10000,
  "sub-8": 8000,
};

interface GoalSummaryCardProps {
  profile: CoachProfile;
  currentAverage?: number;
}

type GoalStatus = "achieved" | "expired" | "active";

function getDaysRemaining(targetDate: number): number {
  return Math.ceil((targetDate - Date.now()) / (24 * 60 * 60 * 1000));
}

function getGoalStatus(
  profile: CoachProfile,
  currentAverage?: number,
): GoalStatus {
  const targetTime =
    profile.customGoalTime || GOAL_TIMES[profile.goalType] || 20000;
  const daysRemaining = getDaysRemaining(profile.targetDate);

  // Check if goal is achieved
  if (currentAverage && currentAverage <= targetTime) {
    return "achieved";
  }

  // Check if deadline has passed
  if (daysRemaining <= 0) {
    return "expired";
  }

  return "active";
}

export default function GoalSummaryCard({
  profile,
  currentAverage,
}: GoalSummaryCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const status = getGoalStatus(profile, currentAverage);
  const daysRemaining = getDaysRemaining(profile.targetDate);

  const getStatusBadge = () => {
    switch (status) {
      case "achieved":
        return (
          <span className="flex items-center gap-1 text-xs text-[var(--success)] px-1.5 py-0.5 bg-[var(--success)]/10 rounded-full whitespace-nowrap shrink-0">
            <Trophy className="w-3 h-3" />
            Achieved
          </span>
        );
      case "expired":
        return (
          <span className="flex items-center gap-1 text-xs text-[var(--warning)] px-1.5 py-0.5 bg-[var(--warning)]/10 rounded-full whitespace-nowrap shrink-0">
            <AlertTriangle className="w-3 h-3" />
            Overdue
          </span>
        );
      default:
        return null;
    }
  };

  const getTargetDateDisplay = () => {
    if (status === "expired") {
      return (
        <span className="font-medium text-[var(--warning)]">
          {Math.abs(daysRemaining)} days overdue
        </span>
      );
    }
    if (status === "achieved") {
      return (
        <span className="font-medium text-[var(--success)]">Goal reached!</span>
      );
    }
    return (
      <span className="font-medium text-[var(--primary)]">
        {new Date(profile.targetDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </span>
    );
  };

  const getIconStyles = () => {
    switch (status) {
      case "achieved":
        return {
          bg: "bg-[var(--success)]/10",
          icon: "text-[var(--success)]",
        };
      case "expired":
        return {
          bg: "bg-[var(--warning)]/10",
          icon: "text-[var(--warning)]",
        };
      default:
        return {
          bg: "bg-[var(--primary)]/10",
          icon: "text-[var(--primary)]",
        };
    }
  };

  const iconStyles = getIconStyles();
  const StatusIcon =
    status === "achieved"
      ? Trophy
      : status === "expired"
        ? AlertTriangle
        : Target;

  return (
    <>
      <div
        className={`timer-card ${status === "achieved" ? "border-[var(--success)]" : status === "expired" ? "border-[var(--warning)]" : ""}`}
        data-tour="goal-summary"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full ${iconStyles.bg} flex items-center justify-center shrink-0`}
            >
              <StatusIcon className={`w-5 h-5 ${iconStyles.icon}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-[var(--text-muted)]">
                  Your Goal
                </span>
                {getStatusBadge()}
              </div>
              <span className="font-bold text-[var(--text-primary)] block truncate">
                {profile.goalType === "custom"
                  ? `CUSTOM (${profile.customGoalTime ? (profile.customGoalTime / 1000).toFixed(2) + "s" : "Set"})`
                  : profile.goalType.replace("-", " ").toUpperCase()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 pl-13 sm:pl-0">
            <div>
              <span className="text-xs text-[var(--text-muted)] block">
                {status === "expired"
                  ? "Status"
                  : status === "achieved"
                    ? "Status"
                    : "Target Date"}
              </span>
              {getTargetDateDisplay()}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowEditModal(true)}
                className="p-1.5 rounded-lg hover:bg-[var(--surface-elevated)] transition-colors"
                title="Edit goal"
              >
                <Pencil className="w-4 h-4 text-[var(--text-muted)] hover:text-[var(--primary)]" />
              </button>
              <button
                onClick={() => setShowNewGoalModal(true)}
                className="p-1.5 rounded-lg hover:bg-[var(--surface-elevated)] transition-colors"
                title="Set new goal"
              >
                <Plus className="w-4 h-4 text-[var(--text-muted)] hover:text-[var(--primary)]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <GoalSetupModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        profile={profile}
        currentAverage={currentAverage}
        mode="edit"
      />

      <GoalSetupModal
        isOpen={showNewGoalModal}
        onClose={() => setShowNewGoalModal(false)}
        profile={profile}
        currentAverage={currentAverage}
        mode="new"
      />
    </>
  );
}
