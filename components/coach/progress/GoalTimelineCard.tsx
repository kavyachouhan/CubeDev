"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Target,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  History,
  Eye,
  Clock,
  TrendingDown,
} from "lucide-react";
import { CollapsibleSection, formatTime } from "./utils";
import { CoachProfile, GOAL_TIMES } from "./types";
import GoalDetailModal from "./GoalDetailModal";
import type { Id } from "@/convex/_generated/dataModel";

interface GoalTimelineCardProps {
  profile: CoachProfile;
  currentAverage: number;
}

type GoalStatus = "achieved" | "expired" | "active";

// Event name mapping
const EVENT_NAMES: Record<string, string> = {
  "222": "2x2",
  "333": "3x3",
  "444": "4x4",
  "555": "5x5",
  "666": "6x6",
  "777": "7x7",
  "333bf": "3x3 BLD",
  "333oh": "3x3 OH",
  pyram: "Pyraminx",
  skewb: "Skewb",
  sq1: "Square-1",
  clock: "Clock",
  minx: "Megaminx",
};

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getGoalDisplay(goalType: string, customGoalTime?: number): string {
  if (goalType === "custom" && customGoalTime) {
    return `Sub ${(customGoalTime / 1000).toFixed(0)}`;
  }
  return goalType.replace("-", " ").replace("sub", "Sub ");
}

function getGoalStatus(
  profile: CoachProfile,
  currentAverage: number,
): GoalStatus {
  const targetTime =
    profile.customGoalTime || GOAL_TIMES[profile.goalType] || 20000;
  const daysRemaining = Math.ceil(
    (profile.targetDate - Date.now()) / (24 * 60 * 60 * 1000),
  );

  if (currentAverage <= targetTime) {
    return "achieved";
  }
  if (daysRemaining <= 0) {
    return "expired";
  }
  return "active";
}

function getProgressPercentage(
  profile: CoachProfile,
  currentAverage: number,
  startingAverage: number,
): number {
  const targetTime =
    profile.customGoalTime || GOAL_TIMES[profile.goalType] || 20000;
  if (currentAverage <= targetTime) return 100;
  if (currentAverage >= startingAverage) return 0;

  const totalImprovement = startingAverage - targetTime;
  const actualImprovement = startingAverage - currentAverage;

  return Math.min(
    100,
    Math.max(0, (actualImprovement / totalImprovement) * 100),
  );
}

// Timeline Item Component
interface TimelineItemProps {
  status: "achieved" | "expired" | "active" | "replaced";
  title: string;
  event: string;
  startDate: number;
  targetDate: number;
  endDate?: number;
  progress: number;
  isCurrent?: boolean;
  startingAverage?: number;
  finalAverage?: number;
  onClick?: () => void;
}

function TimelineItem({
  status,
  title,
  event,
  startDate,
  targetDate,
  endDate,
  progress,
  isCurrent,
  startingAverage,
  finalAverage,
  onClick,
}: TimelineItemProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "achieved":
        return {
          Icon: CheckCircle2,
          color: "text-(--success)",
          bg: "bg-(--success)",
          label: "Achieved",
        };
      case "expired":
        return {
          Icon: XCircle,
          color: "text-(--warning)",
          bg: "bg-(--warning)",
          label: "Expired",
        };
      case "replaced":
        return {
          Icon: ArrowRightLeft,
          color: "text-(--text-muted)",
          bg: "bg-(--text-muted)",
          label: "Replaced",
        };
      default:
        return {
          Icon: Target,
          color: "text-(--primary)",
          bg: "bg-(--primary)",
          label: "In Progress",
        };
    }
  };

  const { Icon, color, bg, label } = getStatusConfig();

  // Calculate duration
  const durationMs = (endDate || Date.now()) - startDate;
  const durationDays = Math.max(1, Math.ceil(durationMs / (24 * 60 * 60 * 1000)));

  // Improvement
  const improvement =
    startingAverage && finalAverage
      ? startingAverage - finalAverage
      : undefined;

  return (
    <div className="relative flex gap-3 sm:gap-4 pb-4">
      {/* Timeline dot */}
      <div
        className={`relative z-10 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 ${bg}/20`}
      >
        <Icon className={`w-3 h-3 sm:w-4 sm:h-4 ${color}`} />
      </div>

      {/* Content */}
      <button
        type="button"
        onClick={onClick}
        className="flex-1 min-w-0 bg-(--surface-elevated) rounded-lg p-3 sm:p-4 border border-(--border) text-left hover:border-(--primary)/40 hover:bg-(--surface-elevated)/80 transition-all cursor-pointer group"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-2">
          <div className="min-w-0">
            <span className="font-semibold text-sm sm:text-base text-(--text-primary) truncate block">
              {title}
            </span>
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <span className="text-xs sm:text-sm text-(--text-muted)">
                {event}
              </span>
              {isCurrent && (
                <span className="sm:hidden text-[10px] text-(--primary) bg-(--primary)/10 px-2 py-0.5 rounded-full border border-(--primary)/20 shrink-0">
                  Current
                </span>
              )}
              {!isCurrent && (
                <span
                  className={`sm:hidden text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
                    status === "achieved"
                      ? "text-(--success) bg-(--success)/10 border border-(--success)/20"
                      : status === "expired"
                        ? "text-(--warning) bg-(--warning)/10 border border-(--warning)/20"
                        : "text-(--text-muted) bg-(--surface) border border-(--border)"
                  }`}
                >
                  {label}
                </span>
              )}
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            {isCurrent ? (
              <span className="text-xs text-(--primary) bg-(--primary)/10 px-2 py-0.5 rounded-full border border-(--primary)/20 shrink-0">
                Current
              </span>
            ) : (
              <span
                className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                  status === "achieved"
                    ? "text-(--success) bg-(--success)/10 border border-(--success)/20"
                    : status === "expired"
                      ? "text-(--warning) bg-(--warning)/10 border border-(--warning)/20"
                      : "text-(--text-muted) bg-(--surface) border border-(--border)"
                }`}
              >
                {label}
              </span>
            )}
            <Eye className="w-3.5 h-3.5 text-(--text-muted) opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="View goal details" />
          </div>
        </div>

        {/* Dates row */}
        <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 text-[10px] sm:text-xs text-(--text-muted)">
          <span>Started: {formatDate(startDate)}</span>
          <span>Target: {formatDate(targetDate)}</span>
          {endDate && !isCurrent && <span>Ended: {formatDate(endDate)}</span>}
        </div>

        {/* Stats row - new inline details */}
        <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 mt-1.5 text-[10px] sm:text-xs text-(--text-muted)">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {durationDays}d
          </span>
          <span
            className={status === "achieved" ? "text-(--success)" : ""}
          >
            Progress: {progress.toFixed(0)}%
          </span>
          {improvement !== undefined && improvement !== 0 && (
            <span
              className={`flex items-center gap-1 ${
                improvement > 0
                  ? "text-(--success)"
                  : "text-(--error)"
              }`}
            >
              <TrendingDown className="w-3 h-3" />
              {improvement > 0 ? "-" : "+"}
              {formatTime(Math.abs(improvement))}
            </span>
          )}
          {startingAverage && (
            <span className="hidden sm:inline">
              {formatTime(startingAverage)}
              {finalAverage ? ` → ${formatTime(finalAverage)}` : ""}
            </span>
          )}
        </div>
      </button>
    </div>
  );
}

// Skeleton Loader
function GoalTimelineSkeleton() {
  return (
    <div className="timer-card animate-pulse">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-5 w-32 bg-(--surface-elevated) rounded" />
      </div>
      <div className="relative">
        <div className="absolute left-3 sm:left-4 top-0 bottom-0 w-0.5 bg-(--border)" />
        {[1, 2].map((i) => (
          <div key={i} className="relative flex gap-3 sm:gap-4 pb-4">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-(--surface-elevated)" />
            <div className="flex-1 bg-(--surface-elevated) rounded-lg p-3 sm:p-4 border border-(--border)">
              <div className="h-4 w-24 bg-(--surface) rounded mb-2" />
              <div className="h-3 w-48 bg-(--surface) rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GoalTimelineCard({
  profile,
  currentAverage,
}: GoalTimelineCardProps) {
  const [selectedGoal, setSelectedGoal] = useState<{
    goalType: string;
    customGoalTime?: number;
    primaryEvent: string;
    startDate: number;
    targetDate: number;
    endDate?: number;
    startingAverage?: number;
    finalAverage?: number;
    status: "achieved" | "expired" | "replaced" | "active";
    progressPercentage: number;
    isCurrent?: boolean;
  } | null>(null);

  // Fetch goal history
  const goalHistory = useQuery(api.coach.getGoalHistory, {
    userId: profile.userId,
  });

  const isLoading = goalHistory === undefined;

  if (isLoading) {
    return <GoalTimelineSkeleton />;
  }

  const status = getGoalStatus(profile, currentAverage);
  const startingAverage = profile.currentAverage || currentAverage * 1.5;
  const progressPercentage = getProgressPercentage(
    profile,
    currentAverage,
    startingAverage,
  );

  // No history and only current goal
  const hasHistory = goalHistory && goalHistory.length > 0;

  const handleCurrentGoalClick = () => {
    setSelectedGoal({
      goalType: profile.goalType,
      customGoalTime: profile.customGoalTime,
      primaryEvent: profile.primaryEvent,
      startDate: profile.createdAt || Date.now(),
      targetDate: profile.targetDate,
      startingAverage: profile.currentAverage,
      finalAverage: currentAverage,
      status,
      progressPercentage,
      isCurrent: true,
    });
  };

  return (
    <>
      <CollapsibleSection
        title="Goal Timeline"
        storageKey="coach-progress-goal-timeline"
        defaultExpanded={true}
      >
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-3 sm:left-4 top-0 bottom-0 w-0.5 bg-(--border)" />

          {/* Current Goal */}
          <TimelineItem
            status={status}
            title={getGoalDisplay(profile.goalType, profile.customGoalTime)}
            event={EVENT_NAMES[profile.primaryEvent] || profile.primaryEvent}
            startDate={profile.createdAt || Date.now()}
            targetDate={profile.targetDate}
            progress={progressPercentage}
            startingAverage={profile.currentAverage}
            finalAverage={currentAverage}
            isCurrent
            onClick={handleCurrentGoalClick}
          />

          {/* Goal History */}
          {hasHistory &&
            goalHistory.map((goal) => (
              <TimelineItem
                key={goal._id}
                status={goal.status}
                title={getGoalDisplay(goal.goalType, goal.customGoalTime)}
                event={EVENT_NAMES[goal.primaryEvent] || goal.primaryEvent}
                startDate={goal.startDate}
                targetDate={goal.targetDate}
                endDate={goal.endDate}
                progress={goal.progressPercentage}
                startingAverage={goal.startingAverage}
                finalAverage={goal.finalAverage}
                onClick={() =>
                  setSelectedGoal({
                    goalType: goal.goalType,
                    customGoalTime: goal.customGoalTime,
                    primaryEvent: goal.primaryEvent,
                    startDate: goal.startDate,
                    targetDate: goal.targetDate,
                    endDate: goal.endDate,
                    startingAverage: goal.startingAverage,
                    finalAverage: goal.finalAverage,
                    status: goal.status,
                    progressPercentage: goal.progressPercentage,
                  })
                }
              />
            ))}

          {/* Empty state for no history */}
          {!hasHistory && (
            <div className="ml-10 sm:ml-12 mt-2 p-3 bg-(--surface-elevated) rounded-lg border border-(--border)">
              <div className="flex items-center gap-2 text-(--text-muted)">
                <History className="w-4 h-4" />
                <span className="text-xs sm:text-sm">
                  Your past goals will appear here as you complete them
                </span>
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {selectedGoal && (
        <GoalDetailModal
          isOpen={!!selectedGoal}
          onClose={() => setSelectedGoal(null)}
          goal={selectedGoal}
        />
      )}
    </>
  );
}
