"use client";

import { useState, useEffect } from "react";
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

const STATUS_CONFIG = {
  achieved: {
    Icon: CheckCircle2,
    color: "text-[var(--success)]",
    bg: "bg-[var(--success)]",
    label: "Goal Achieved",
  },
  expired: {
    Icon: XCircle,
    color: "text-[var(--warning)]",
    bg: "bg-[var(--warning)]",
    label: "Deadline Passed",
  },
  replaced: {
    Icon: ArrowRightLeft,
    color: "text-[var(--text-muted)]",
    bg: "bg-[var(--text-muted)]",
    label: "Goal Replaced",
  },
  active: {
    Icon: Target,
    color: "text-[var(--primary)]",
    bg: "bg-[var(--primary)]",
    label: "In Progress",
  },
};

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

  const startAvg = goal.startingAverage;
  const endAvg = goal.finalAverage;
  const improvement = startAvg && endAvg ? startAvg - endAvg : undefined;
  const improvementPerDay =
    improvement !== undefined && durationDays > 0
      ? improvement / durationDays
      : undefined;

  const config = STATUS_CONFIG[goal.status];
  const { Icon: StatusIcon } = config;
  const eventName = EVENT_NAMES[goal.primaryEvent] || goal.primaryEvent;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="timer-card max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-[var(--text-primary)] font-statement truncate">
              {getGoalDisplay(goal.goalType, goal.customGoalTime)}
            </h2>
            <p className="text-sm text-[var(--text-muted)] mt-0.5 font-inter">
              {eventName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-lg hover:bg-[var(--surface-elevated)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-6 min-h-0">
          {/* Status */}
          <div className="timer-card bg-[var(--surface-elevated)] p-4 border border-[var(--border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <StatusIcon className={`w-5 h-5 ${config.color} shrink-0`} />
                <span className={`text-sm font-semibold ${config.color} font-statement`}>
                  {config.label}
                </span>
              </div>
              {goal.isCurrent && (
                <span className="text-xs text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded-full border border-[var(--primary)]/20 shrink-0 font-inter">
                  Current
                </span>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="timer-card bg-[var(--surface-elevated)] p-4 border border-[var(--border)]">
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3 font-statement">
              Progress
            </h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[var(--text-muted)] font-inter">
                {goal.progressPercentage.toFixed(0)}% complete
              </span>
              <span className={`text-xs font-medium font-inter ${
                goal.progressPercentage >= 100 ? "text-[var(--success)]" : config.color
              }`}>
                {goal.progressPercentage >= 100 ? "Complete" : "In progress"}
              </span>
            </div>
            <div className="relative h-2 bg-[var(--surface)] rounded-full overflow-hidden">
              <div
                className={`absolute h-full transition-all duration-500 rounded-full ${
                  goal.progressPercentage >= 100 ? "bg-[var(--success)]" : config.bg
                }`}
                style={{ width: `${Math.min(100, goal.progressPercentage)}%` }}
              />
            </div>
          </div>

          {/* Performance */}
          {(startAvg || endAvg) && (
            <div className="timer-card bg-[var(--surface-elevated)] p-4 border border-[var(--border)]">
              <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3 font-statement">
                Performance
              </h3>
              <div className="space-y-2">
                {startAvg && (
                  <InfoRow
                    label="Starting Average"
                    value={formatTime(startAvg)}
                    icon={Timer}
                  />
                )}
                <InfoRow
                  label="Target Time"
                  value={formatTime(targetTime)}
                  icon={Target}
                  valueColor="text-[var(--success)]"
                />
                {endAvg && (
                  <InfoRow
                    label={goal.isCurrent ? "Current Average" : "Final Average"}
                    value={formatTime(endAvg)}
                    icon={Flag}
                    valueColor={
                      goal.status === "achieved"
                        ? "text-[var(--success)]"
                        : undefined
                    }
                  />
                )}
                {improvement !== undefined && (
                  <>
                    <div className="h-px bg-[var(--border)] my-1" />
                    <InfoRow
                      label="Improvement"
                      value={`${improvement > 0 ? "-" : "+"}${formatTime(Math.abs(improvement))}`}
                      icon={improvement > 0 ? TrendingDown : TrendingUp}
                      valueColor={
                        improvement > 0
                          ? "text-[var(--success)]"
                          : "text-[var(--error)]"
                      }
                    />
                  </>
                )}
                {improvementPerDay !== undefined && improvementPerDay > 0 && (
                  <InfoRow
                    label="Avg per Day"
                    value={`${(improvementPerDay / 1000).toFixed(3)}s`}
                    icon={TrendingDown}
                    valueColor="text-[var(--primary)]"
                  />
                )}
                {goal.status !== "achieved" && endAvg && (
                  <InfoRow
                    label="Gap to Target"
                    value={
                      endAvg > targetTime
                        ? formatTime(endAvg - targetTime)
                        : "Reached"
                    }
                    icon={Target}
                    valueColor={
                      endAvg <= targetTime
                        ? "text-[var(--success)]"
                        : "text-[var(--warning)]"
                    }
                  />
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="timer-card bg-[var(--surface-elevated)] p-4 border border-[var(--border)]">
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3 font-statement">
              Timeline
            </h3>
            <div className="space-y-2">
              <InfoRow
                label="Started"
                value={formatDate(goal.startDate)}
                icon={Calendar}
              />
              <InfoRow
                label="Target Date"
                value={formatDate(goal.targetDate)}
                icon={Flag}
                sublabel={`${totalPlannedDays} day${totalPlannedDays !== 1 ? "s" : ""} planned`}
              />
              <InfoRow
                label={goal.isCurrent ? "Duration So Far" : "Total Duration"}
                value={formatDuration(durationDays)}
                icon={Clock}
              />
              {goal.endDate && !goal.isCurrent && (
                <InfoRow
                  label={
                    goal.status === "achieved"
                      ? "Completed"
                      : goal.status === "expired"
                        ? "Expired"
                        : "Replaced"
                  }
                  value={formatDate(goal.endDate)}
                  icon={goal.status === "achieved" ? CheckCircle2 : XCircle}
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
            <p className="text-xs text-[var(--text-muted)] mt-3 font-inter">
              {goal.isCurrent
                ? "This is your active goal."
                : `Archived ${goal.endDate ? formatDate(goal.endDate) : ""}`}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 pt-6 mt-6 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            className="flex-1 btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon: Icon,
  valueColor,
  sublabel,
  sublabelColor,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  valueColor?: string;
  sublabel?: string;
  sublabelColor?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
        <div className="min-w-0">
          <span className="text-sm text-[var(--text-muted)] font-inter block truncate">
            {label}
          </span>
          {sublabel && (
            <span
              className={`text-xs block ${sublabelColor || "text-[var(--text-muted)]"} font-inter`}
            >
              {sublabel}
            </span>
          )}
        </div>
      </div>
      <span
        className={`text-sm font-medium font-mono shrink-0 ${
          valueColor || "text-[var(--text-primary)]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}