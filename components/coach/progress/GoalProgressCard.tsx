"use client";

import { useState } from "react";
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
  CollapsibleSection,
  StatCard,
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
    (profile.targetDate -
      (profile.createdAt || profile.targetDate)) /
      (24 * 60 * 60 * 1000),
  );
  const daysPassed = Math.max(0, totalDays - daysRemaining);
  const expectedProgress = totalDays > 0 ? (daysPassed / totalDays) * 100 : 0;
  const isOnTrack = progressPercentage >= expectedProgress * 0.8;
  const improvement = startingAverage - currentAverage;
  const timeToGo = currentAverage - targetTime;

  const getStatusBadge = () => {
    if (status === "achieved") {
      return (
        <span className="flex items-center gap-1 text-xs sm:text-sm text-(--success) px-1.5 sm:px-2 py-0.5 sm:py-1 bg-(--success)/10 rounded-full whitespace-nowrap shrink-0">
          <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Goal </span>Achieved
        </span>
      );
    }
    if (status === "expired") {
      return (
        <span className="flex items-center gap-1 text-xs sm:text-sm text-(--warning) px-1.5 sm:px-2 py-0.5 sm:py-1 bg-(--warning)/10 rounded-full whitespace-nowrap shrink-0">
          <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />
          Overdue
        </span>
      );
    }
    if (isOnTrack) {
      return (
        <span className="flex items-center gap-1 text-xs sm:text-sm text-(--success) px-1.5 sm:px-2 py-0.5 sm:py-1 bg-(--success)/10 rounded-full whitespace-nowrap shrink-0">
          <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
          On Track
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-xs sm:text-sm text-(--warning) px-1.5 sm:px-2 py-0.5 sm:py-1 bg-(--warning)/10 rounded-full whitespace-nowrap shrink-0">
        <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">Needs </span>Focus
      </span>
    );
  };

  const getDaysLeftDisplay = () => {
    if (status === "achieved") {
      return "Completed";
    }
    if (status === "expired") {
      return `${Math.abs(daysRemaining)} overdue`;
    }
    return daysRemaining;
  };

  return (
    <>
      <CollapsibleSection
        title="Goal Progress"
        storageKey="coach-progress-goal"
        defaultExpanded={true}
        dataTour="goal-progress"
        headerAction={
          <div className="flex items-center gap-1">
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
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowEditModal(true);
              }}
              className="p-1.5 rounded-lg hover:bg-(--surface-elevated) transition-colors"
              title="Edit goal"
            >
              <Pencil className="w-4 h-4 text-(--text-muted) hover:text-(--primary)" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowNewGoalModal(true);
              }}
              className="p-1.5 rounded-lg hover:bg-(--surface-elevated) transition-colors"
              title="Set new goal"
            >
              <Plus className="w-4 h-4 text-(--text-muted) hover:text-(--primary)" />
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Target and Status Badge - same line, responsive */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs sm:text-sm text-(--text-muted) truncate">
              Target:{" "}
              {profile.goalType === "custom"
                ? `CUSTOM (${formatTime(targetTime)})`
                : profile.goalType.replace("-", " ").toUpperCase()}
            </span>
            {getStatusBadge()}
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-(--text-muted) text-xs sm:text-sm">
                Start: {formatTime(startingAverage)}
              </span>
              <span
                className={`font-bold text-base sm:text-lg ${status === "achieved" ? "text-(--success)" : "text-(--primary)"}`}
              >
                {progressPercentage.toFixed(0)}%
              </span>
              <span className="text-(--success) text-xs sm:text-sm">
                Goal: {formatTime(targetTime)}
              </span>
            </div>
            <div className="relative h-3 sm:h-4 bg-(--surface-elevated) rounded-full overflow-hidden">
              <div
                className={`absolute h-full transition-all duration-500 rounded-full ${status === "achieved" ? "bg-(--success)" : "bg-(--primary)"}`}
                style={{ width: `${Math.min(100, progressPercentage)}%` }}
              />
              {/* Expected progress marker - only show when active */}
              {status === "active" && (
                <div
                  className="absolute top-0 h-full w-0.5 bg-(--text-muted)"
                  style={{ left: `${Math.min(100, expectedProgress)}%` }}
                  title={`Expected: ${expectedProgress.toFixed(0)}%`}
                />
              )}
            </div>
            {status === "active" && (
              <div className="flex justify-between text-xs text-(--text-muted) mt-1">
                <span>Progress: {progressPercentage.toFixed(1)}%</span>
                <span>Expected: {expectedProgress.toFixed(1)}%</span>
              </div>
            )}
          </div>

          {/* Key Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <StatCard
              icon={Target}
              iconColor="bg-(--primary)/10 text-(--primary)"
              label="Current"
              value={formatTime(currentAverage)}
              valueColor="text-(--primary)"
            />
            <StatCard
              icon={TrendingDown}
              iconColor="bg-(--success)/10 text-(--success)"
              label="Improved"
              value={`${improvement > 0 ? "-" : "+"}${formatTime(Math.abs(improvement))}`}
              valueColor={
                improvement > 0
                  ? "text-(--success)"
                  : "text-(--error)"
              }
            />
            <StatCard
              icon={Calendar}
              iconColor={
                status === "expired"
                  ? "bg-(--warning)/10 text-(--warning)"
                  : status === "achieved"
                    ? "bg-(--success)/10 text-(--success)"
                    : "bg-(--warning)/10 text-(--warning)"
              }
              label={
                status === "expired"
                  ? "Overdue"
                  : status === "achieved"
                    ? "Status"
                    : "Days Left"
              }
              value={getDaysLeftDisplay()}
              valueColor={
                status === "expired"
                  ? "text-(--warning)"
                  : status === "achieved"
                    ? "text-(--success)"
                    : undefined
              }
            />
            <StatCard
              icon={Zap}
              iconColor="bg-(--accent)/10 text-(--accent)"
              label="To Go"
              value={timeToGo > 0 ? `-${formatTime(timeToGo)}` : "Done!"}
              valueColor={timeToGo <= 0 ? "text-(--success)" : undefined}
            />
          </div>
        </div>
      </CollapsibleSection>

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
