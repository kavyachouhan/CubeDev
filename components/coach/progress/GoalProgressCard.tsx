"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import {
  Target,
  TrendingDown,
  Calendar,
  Zap,
  CheckCircle2,
  AlertCircle,
  Trophy,
  AlertTriangle,
  Pencil,
  Plus,
} from "lucide-react";
import {
  Badge,
  CollapsibleCard,
  IconButton,
  ProgressBar,
  StatTile,
  useCollapsed,
} from "@/components/ui";
import type { BadgeTone } from "@/components/ui";
import {
  formatTime,
  getDaysRemaining,
  getProgressPercentage,
} from "./utils";
import { CoachProfile, GOAL_TIMES } from "./types";
import GoalSetupModal from "../GoalSetupModal";
import GoalShareMenu from "../GoalShareMenu";
import { useUser } from "@/components/UserProvider";

interface GoalProgressCardProps {
  profile: CoachProfile;
  currentAverage: number;
  startingAverage: number;
}

type GoalStatus = "achieved" | "expired" | "active";

function getGoalStatus(
  profile: CoachProfile,
  currentAverage: number,
): GoalStatus {
  const targetTime =
    profile.customGoalTime || GOAL_TIMES[profile.goalType] || 20000;
  const daysRemaining = getDaysRemaining(profile.targetDate);

  if (currentAverage <= targetTime) {
    return "achieved";
  }
  if (daysRemaining <= 0) {
    return "expired";
  }
  return "active";
}

export default function GoalProgressCard({
  profile,
  currentAverage,
  startingAverage,
}: GoalProgressCardProps) {
  const collapsed = useCollapsed("coach-progress-goal", true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const { user } = useUser();

  const targetTime =
    profile.customGoalTime || GOAL_TIMES[profile.goalType] || 20000;
  const progressPercentage = getProgressPercentage(
    currentAverage,
    startingAverage,
    targetTime,
  );
  const daysRemaining = getDaysRemaining(profile.targetDate);
  const status = getGoalStatus(profile, currentAverage);

  const totalDays = Math.ceil(
    (profile.targetDate - (profile.createdAt || profile.targetDate)) /
      (24 * 60 * 60 * 1000),
  );
  const daysPassed = Math.max(0, totalDays - daysRemaining);
  const expectedProgress = totalDays > 0 ? (daysPassed / totalDays) * 100 : 0;
  const isOnTrack = progressPercentage >= expectedProgress * 0.8;
  const improvement = startingAverage - currentAverage;
  const timeToGo = currentAverage - targetTime;

  const statusBadge: { tone: BadgeTone; icon: ReactNode; label: string } =
    status === "achieved"
      ? { tone: "success", icon: <Trophy />, label: "Achieved" }
      : status === "expired"
        ? { tone: "warning", icon: <AlertTriangle />, label: "Overdue" }
        : isOnTrack
          ? { tone: "success", icon: <CheckCircle2 />, label: "On Track" }
          : { tone: "warning", icon: <AlertCircle />, label: "Needs Focus" };

  const getDaysLeftDisplay = () => {
    if (status === "achieved") return "Completed";
    if (status === "expired") return `${Math.abs(daysRemaining)} overdue`;
    return String(daysRemaining);
  };

  return (
    <>
      <CollapsibleCard
        title="Goal Progress"
        variant="static"
        open={collapsed.open}
        onOpenChange={collapsed.onOpenChange}
        rootProps={{ "data-tour": "goal-progress" }}
        actions={
          <>
            <GoalShareMenu
              goalData={{
                goalType: profile.goalType,
                customGoalTime: profile.customGoalTime,
                targetDate: profile.targetDate,
                currentAverage: profile.currentAverage,
                primaryEvent: profile.primaryEvent,
                userName: user?.name,
                wcaId: user?.wcaId,
              }}
            />
            <IconButton
              size="sm"
              aria-label="Edit goal"
              icon={<Pencil />}
              onClick={(e) => {
                e.stopPropagation();
                setShowEditModal(true);
              }}
            />
            <IconButton
              size="sm"
              aria-label="Set new goal"
              icon={<Plus />}
              onClick={(e) => {
                e.stopPropagation();
                setShowNewGoalModal(true);
              }}
            />
          </>
        }
      >
        <div className="space-y-4">
          {/* Target and status */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="type-caption min-w-0 truncate">
              Target:{" "}
              {profile.goalType === "custom"
                ? `CUSTOM (${formatTime(targetTime)})`
                : profile.goalType.replace("-", " ").toUpperCase()}
            </span>
            <Badge
              tone={statusBadge.tone}
              shape="pill"
              size="sm"
              icon={statusBadge.icon}
              className="shrink-0"
            >
              {statusBadge.label}
            </Badge>
          </div>

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="type-caption">
                Start: {formatTime(startingAverage)}
              </span>
              <span
                className={`font-bold text-base sm:text-lg ${
                  status === "achieved"
                    ? "text-(--success)"
                    : "text-(--primary)"
                }`}
              >
                {progressPercentage.toFixed(0)}%
              </span>
              <span className="type-caption text-(--success)!">
                Goal: {formatTime(targetTime)}
              </span>
            </div>
            <ProgressBar
              label="Goal progress"
              value={progressPercentage}
              valueText={`${progressPercentage.toFixed(0)}% toward ${formatTime(targetTime)}`}
              tone={status === "achieved" ? "success" : "primary"}
              marker={
                status === "active"
                  ? {
                      value: expectedProgress,
                      label: `Expected: ${expectedProgress.toFixed(0)}%`,
                    }
                  : undefined
              }
            />
            {status === "active" && (
              <div className="flex justify-between type-caption mt-1">
                <span>Progress: {progressPercentage.toFixed(1)}%</span>
                <span>Expected: {expectedProgress.toFixed(1)}%</span>
              </div>
            )}
          </div>

          {/* Key stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <StatTile
              size="sm"
              mobileLayout="row"
              icon={<Target />}
              tone="primary"
              label="Current"
              value={formatTime(currentAverage)}
            />
            <StatTile
              size="sm"
              mobileLayout="row"
              icon={<TrendingDown />}
              tone={improvement > 0 ? "success" : "error"}
              label="Improved"
              value={`${improvement > 0 ? "-" : "+"}${formatTime(Math.abs(improvement))}`}
            />
            <StatTile
              size="sm"
              mobileLayout="row"
              mono={false}
              icon={<Calendar />}
              tone={
                status === "expired"
                  ? "warning"
                  : status === "achieved"
                    ? "success"
                    : "default"
              }
              label={
                status === "expired"
                  ? "Overdue"
                  : status === "achieved"
                    ? "Status"
                    : "Days Left"
              }
              value={getDaysLeftDisplay()}
            />
            <StatTile
              size="sm"
              mobileLayout="row"
              icon={<Zap />}
              tone={timeToGo <= 0 ? "success" : "accent"}
              label="To Go"
              value={timeToGo > 0 ? `-${formatTime(timeToGo)}` : "Done!"}
            />
          </div>
        </div>
      </CollapsibleCard>

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
