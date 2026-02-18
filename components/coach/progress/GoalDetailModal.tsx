"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Target,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  Calendar,
  Clock,
  TrendingDown,
  TrendingUp,
  Timer,
  Flag,
} from "lucide-react";

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

interface GoalDetailData {
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
}

interface GoalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: GoalDetailData;
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

function formatTime(ms: number): string {
  const seconds = ms / 1000;
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(2);
  return mins > 0 ? `${mins}:${secs.padStart(5, "0")}` : `${secs}s`;
}

function formatDate(timestamp: number): string {
  // Use shorter format that works well on mobile
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateShort(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getGoalDisplay(goalType: string, customGoalTime?: number): string {
  if (goalType === "custom" && customGoalTime) {
    return `Custom (${(customGoalTime / 1000).toFixed(0)}s)`;
  }
  return goalType.replace("-", " ").replace("sub", "Sub ");
}

function getDurationDays(start: number, end: number): number {
  return Math.max(0, Math.ceil((end - start) / (24 * 60 * 60 * 1000)));
}

function formatDuration(days: number): string {
  if (days < 7) return `${days} day${days !== 1 ? "s" : ""}`;
  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;
  if (remainingDays === 0) return `${weeks} week${weeks !== 1 ? "s" : ""}`;
  return `${weeks}w ${remainingDays}d`;
}

export default function GoalDetailModal({
  isOpen,
  onClose,
  goal,
}: GoalDetailModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const targetTime =
    goal.customGoalTime || GOAL_TIMES[goal.goalType] || 20000;
  const endPoint = goal.endDate || Date.now();
  const durationDays = getDurationDays(goal.startDate, endPoint);
  const totalPlannedDays = getDurationDays(goal.startDate, goal.targetDate);

  // Improvement calculation
  const startAvg = goal.startingAverage;
  const endAvg = goal.finalAverage;
  const improvement =
    startAvg && endAvg ? startAvg - endAvg : undefined;
  const improvementPerDay =
    improvement !== undefined && durationDays > 0
      ? improvement / durationDays
      : undefined;

  const statusConfig = {
    achieved: {
      Icon: CheckCircle2,
      color: "text-[var(--success)]",
      bg: "bg-[var(--success)]",
      borderColor: "border-[var(--success)]",
      label: "Goal Achieved",
      description: "Successfully reached the target time",
    },
    expired: {
      Icon: XCircle,
      color: "text-[var(--warning)]",
      bg: "bg-[var(--warning)]",
      borderColor: "border-[var(--warning)]",
      label: "Deadline Passed",
      description: "Target date was reached before the goal",
    },
    replaced: {
      Icon: ArrowRightLeft,
      color: "text-[var(--text-muted)]",
      bg: "bg-[var(--text-muted)]",
      borderColor: "border-[var(--border)]",
      label: "Goal Replaced",
      description: "Replaced with a different goal",
    },
    active: {
      Icon: Target,
      color: "text-[var(--primary)]",
      bg: "bg-[var(--primary)]",
      borderColor: "border-[var(--primary)]",
      label: "In Progress",
      description: "Currently working towards this goal",
    },
  };

  const config = statusConfig[goal.status];
  const { Icon: StatusIcon } = config;
  const eventName =
    EVENT_NAMES[goal.primaryEvent] || goal.primaryEvent;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg timer-card border-[var(--border)] animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex items-start justify-between pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${config.bg}/15 flex items-center justify-center shrink-0`}
            >
              <StatusIcon
                className={`w-5 h-5 sm:w-6 sm:h-6 ${config.color}`}
              />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] font-statement truncate">
                {getGoalDisplay(goal.goalType, goal.customGoalTime)}
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                {eventName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-lg transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-0">
          {/* Status Banner */}
          <div
            className={`flex items-center gap-3 p-3 rounded-lg border ${config.borderColor}/30 ${config.bg}/5`}
          >
            <StatusIcon className={`w-5 h-5 ${config.color} shrink-0`} />
            <div className="min-w-0">
              <span
                className={`text-sm font-semibold ${config.color} block`}
              >
                {config.label}
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                {config.description}
              </span>
            </div>
            {goal.isCurrent && (
              <span className="ml-auto text-[10px] sm:text-xs text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded-full border border-[var(--primary)]/20 shrink-0">
                Current
              </span>
            )}
          </div>

          {/* Progress Section */}
          <div className="p-3 sm:p-4 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[var(--text-primary)]">
                Progress
              </span>
              <span
                className={`text-base sm:text-lg font-bold ${
                  goal.progressPercentage >= 100
                    ? "text-[var(--success)]"
                    : config.color
                }`}
              >
                {goal.progressPercentage.toFixed(0)}%
              </span>
            </div>
            <div className="relative h-2.5 sm:h-3 bg-[var(--surface)] rounded-full overflow-hidden">
              <div
                className={`absolute h-full transition-all duration-500 rounded-full ${
                  goal.progressPercentage >= 100
                    ? "bg-[var(--success)]"
                    : config.bg
                }`}
                style={{
                  width: `${Math.min(100, goal.progressPercentage)}%`,
                }}
              />
            </div>

            {/* Time stats under progress bar */}
            {(startAvg || endAvg) && (
              <div className="grid grid-cols-3 gap-2 mt-3 text-[10px] sm:text-xs text-[var(--text-muted)]">
                <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                  <Timer className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                  <span className="truncate">
                    Start:{" "}
                    <span className="font-mono text-[var(--text-secondary)]">
                      {startAvg ? formatTime(startAvg) : "--"}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 justify-center min-w-0">
                  <Flag className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                  <span className="truncate">
                    <span className="hidden sm:inline">{goal.isCurrent ? "Current" : "Final"}: </span>
                    <span className="sm:hidden">{goal.isCurrent ? "Now" : "End"}: </span>
                    <span
                      className={`font-mono ${
                        goal.status === "achieved"
                          ? "text-[var(--success)]"
                          : "text-[var(--text-secondary)]"
                      }`}
                    >
                      {endAvg ? formatTime(endAvg) : "--"}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 justify-end min-w-0">
                  <Target className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                  <span className="truncate">
                    Goal:{" "}
                    <span className="font-mono text-[var(--success)]">
                      {formatTime(targetTime)}
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {/* Improvement */}
            {improvement !== undefined && (
              <DetailStat
                icon={improvement > 0 ? TrendingDown : TrendingUp}
                iconColor={
                  improvement > 0
                    ? "text-[var(--success)]"
                    : "text-[var(--error)]"
                }
                label="Improvement"
                value={
                  improvement > 0
                    ? `-${formatTime(improvement)}`
                    : `+${formatTime(Math.abs(improvement))}`
                }
                valueColor={
                  improvement > 0
                    ? "text-[var(--success)]"
                    : "text-[var(--error)]"
                }
              />
            )}

            {/* Duration */}
            <DetailStat
              icon={Clock}
              iconColor="text-[var(--primary)]"
              label={goal.isCurrent ? "Duration So Far" : "Total Duration"}
              value={formatDuration(durationDays)}
            />

            {/* Daily improvement rate */}
            {improvementPerDay !== undefined && improvementPerDay > 0 && (
              <DetailStat
                icon={TrendingDown}
                iconColor="text-[var(--info)]"
                label="Avg Improvement/Day"
                value={`${(improvementPerDay / 1000).toFixed(3)}s`}
                valueColor="text-[var(--info)]"
              />
            )}

            {/* Time remaining to target */}
            {goal.status !== "achieved" && (
              <DetailStat
                icon={Target}
                iconColor="text-[var(--warning)]"
                label="Gap to Target"
                value={
                  endAvg
                    ? endAvg > targetTime
                      ? formatTime(endAvg - targetTime)
                      : "Reached"
                    : "--"
                }
                valueColor={
                  endAvg && endAvg <= targetTime
                    ? "text-[var(--success)]"
                    : "text-[var(--warning)]"
                }
              />
            )}
          </div>

          {/* Timeline Details */}
          <div className="p-3 sm:p-4 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]">
            <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">
              Timeline
            </h4>
            <div className="space-y-3">
              <TimelineRow
                icon={Calendar}
                iconColor="text-[var(--primary)]"
                label="Started"
                value={formatDate(goal.startDate)}
              />
              <TimelineRow
                icon={Flag}
                iconColor="text-[var(--warning)]"
                label="Target Date"
                value={formatDate(goal.targetDate)}
                sublabel={`${totalPlannedDays} day${totalPlannedDays !== 1 ? "s" : ""} planned`}
              />
              {goal.endDate && !goal.isCurrent && (
                <TimelineRow
                  icon={
                    goal.status === "achieved" ? CheckCircle2 : XCircle
                  }
                  iconColor={
                    goal.status === "achieved"
                      ? "text-[var(--success)]"
                      : "text-[var(--warning)]"
                  }
                  label={
                    goal.status === "achieved"
                      ? "Completed"
                      : goal.status === "expired"
                        ? "Expired"
                        : "Replaced"
                  }
                  value={formatDate(goal.endDate)}
                  sublabel={
                    goal.status === "achieved" && goal.endDate < goal.targetDate
                      ? `${getDurationDays(goal.endDate, goal.targetDate)} days early`
                      : goal.status === "expired"
                        ? `${getDurationDays(goal.targetDate, goal.endDate)} days overdue`
                        : undefined
                  }
                  sublabelColor={
                    goal.status === "achieved"
                      ? "text-[var(--success)]"
                      : goal.status === "expired"
                        ? "text-[var(--warning)]"
                        : undefined
                  }
                />
              )}
            </div>
          </div>

          {/* Averages Breakdown */}
          {(startAvg || endAvg) && (
            <div className="p-3 sm:p-4 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]">
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">
                Performance
              </h4>
              <div className="space-y-2">
                {startAvg && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs text-[var(--text-muted)]">
                      Starting Average
                    </span>
                    <span className="text-xs sm:text-sm font-mono font-medium text-[var(--text-primary)]">
                      {formatTime(startAvg)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs text-[var(--text-muted)]">
                    Target Time
                  </span>
                  <span className="text-xs sm:text-sm font-mono font-medium text-[var(--success)]">
                    {formatTime(targetTime)}
                  </span>
                </div>
                {endAvg && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs text-[var(--text-muted)]">
                      {goal.isCurrent ? "Current Average" : "Final Average"}
                    </span>
                    <span
                      className={`text-xs sm:text-sm font-mono font-medium ${
                        goal.status === "achieved"
                          ? "text-[var(--success)]"
                          : "text-[var(--text-primary)]"
                      }`}
                    >
                      {formatTime(endAvg)}
                    </span>
                  </div>
                )}
                {improvement !== undefined && (
                  <>
                    <div className="h-px bg-[var(--border)] my-1" />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs text-[var(--text-muted)]">
                        Total Improvement
                      </span>
                      <span
                        className={`text-xs sm:text-sm font-mono font-bold ${
                          improvement > 0
                            ? "text-[var(--success)]"
                            : "text-[var(--error)]"
                        }`}
                      >
                        {improvement > 0 ? "-" : "+"}
                        {formatTime(Math.abs(improvement))}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 pt-3 sm:pt-4 border-t border-[var(--border)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs text-[var(--text-muted)]">
              {goal.isCurrent ? "Active goal" : `Archived ${goal.endDate ? formatDateShort(goal.endDate) : ""}`}
            </span>
            <button
              onClick={onClose}
              className="px-3 sm:px-4 py-1.5 text-sm font-medium border border-[var(--border)] rounded-lg hover:bg-[var(--surface-elevated)] text-[var(--text-primary)] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Stat card for the detail modal */
function DetailStat({
  icon: Icon,
  iconColor,
  label,
  value,
  valueColor,
}: {
  icon: React.ElementType;
  iconColor: string;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-[var(--surface-elevated)] rounded-lg p-3 border border-[var(--border)]">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        <span className="text-[10px] sm:text-xs text-[var(--text-muted)] uppercase tracking-wide truncate">
          {label}
        </span>
      </div>
      <div
        className={`text-sm sm:text-base font-bold font-mono truncate ${
          valueColor || "text-[var(--text-primary)]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

/** Row within the timeline section */
function TimelineRow({
  icon: Icon,
  iconColor,
  label,
  value,
  sublabel,
  sublabelColor,
}: {
  icon: React.ElementType;
  iconColor: string;
  label: string;
  value: string;
  sublabel?: string;
  sublabelColor?: string;
}) {
  return (
    <div className="flex items-start gap-2 sm:gap-3">
      <div
        className={`p-1 sm:p-1.5 rounded-lg ${iconColor.replace("text-", "bg-")}/10 shrink-0`}
      >
        <Icon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[10px] sm:text-xs text-[var(--text-muted)] block">
          {label}
        </span>
        <span className="text-xs sm:text-sm text-[var(--text-primary)] block truncate">
          {value}
        </span>
        {sublabel && (
          <span
            className={`text-[10px] sm:text-xs block ${sublabelColor || "text-[var(--text-muted)]"}`}
          >
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
