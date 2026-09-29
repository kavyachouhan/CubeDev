"use client";

import { useState } from "react";
import { Target, Trophy, AlertTriangle, Pencil, Plus } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { Badge, CalloutCard, IconButton } from "@/components/ui";
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
          <Badge tone="success" size="sm" shape="pill" icon={<Trophy />}>
            Achieved
          </Badge>
        );
      case "expired":
        return (
          <Badge tone="warning" size="sm" shape="pill" icon={<AlertTriangle />}>
            Overdue
          </Badge>
        );
      default:
        return null;
    }
  };

  const getTargetDateDisplay = () => {
    if (status === "expired") {
      return (
        <span className="font-medium text-(--warning)">
          {Math.abs(daysRemaining)} days overdue
        </span>
      );
    }
    if (status === "achieved") {
      return (
        <span className="font-medium text-(--success)">Goal reached!</span>
      );
    }
    return (
      <span className="font-medium text-(--primary)">
        {new Date(profile.targetDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </span>
    );
  };

  const tone =
    status === "achieved"
      ? "success"
      : status === "expired"
        ? "warning"
        : "primary";
  const StatusIcon =
    status === "achieved"
      ? Trophy
      : status === "expired"
        ? AlertTriangle
        : Target;
  const targetLabel =
    status === "expired"
      ? "Status"
      : status === "achieved"
        ? "Status"
        : "Target Date";

  return (
    <>
      <CalloutCard
        tone={tone}
        rootProps={{ "data-tour": "goal-summary" }}
        icon={<StatusIcon />}
        title={
          <span className="flex flex-wrap items-center gap-2">
            <span className="min-w-0 truncate">
              {profile.goalType === "custom"
                ? `CUSTOM (${profile.customGoalTime ? (profile.customGoalTime / 1000).toFixed(2) + "s" : "Set"})`
                : profile.goalType.replace("-", " ").toUpperCase()}
            </span>
            {getStatusBadge()}
          </span>
        }
        description="Your goal"
        action={
          <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
            <span className="flex items-center gap-2 min-w-0">
              <span className="type-caption shrink-0">{targetLabel}</span>
              {getTargetDateDisplay()}
            </span>
            <span className="flex items-center gap-1 shrink-0">
              <IconButton
                size="sm"
                aria-label="Edit goal"
                icon={<Pencil />}
                onClick={() => setShowEditModal(true)}
              />
              <IconButton
                size="sm"
                aria-label="Set new goal"
                icon={<Plus />}
                onClick={() => setShowNewGoalModal(true)}
              />
            </span>
          </div>
        }
      />

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