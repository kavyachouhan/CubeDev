"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Target,
  Trophy,
  AlertTriangle,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  Flame,
  Eye,
  History,
} from "lucide-react";
import GoalShareMenu from "../coach/GoalShareMenu";
import GoalDetailModal from "../coach/progress/GoalDetailModal";

interface ProfileTrainingTabProps {
  wcaId: string;
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

const EVENT_NAMES: Record<string, string> = {
  "333": "3×3",
  "222": "2×2",
  "444": "4×4",
  "555": "5×5",
  "666": "6×6",
  "777": "7×7",
  "333bf": "3×3 BLD",
  "333oh": "3×3 OH",
  clock: "Clock",
  minx: "Megaminx",
  pyram: "Pyraminx",
  skewb: "Skewb",
  sq1: "Square-1",
};

type GoalStatus = "achieved" | "expired" | "active";

function formatTime(ms: number): string {
  const seconds = ms / 1000;
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(2);
  return mins > 0 ? `${mins}:${secs.padStart(5, "0")}` : secs;
}

function getDaysRemaining(targetDate: number): number {
  return Math.ceil((targetDate - Date.now()) / (24 * 60 * 60 * 1000));
}

function getGoalStatus(
  targetDate: number,
  targetTime: number,
  currentAverage?: number,
): GoalStatus {
  const daysRemaining = getDaysRemaining(targetDate);

  if (currentAverage && currentAverage <= targetTime) {
    return "achieved";
  }
  if (daysRemaining <= 0) {
    return "expired";
  }
  return "active";
}

// Calculate progress using logarithmic scale (matches backend)
function getProgressPercentage(
  currentAvg: number,
  startAvg: number,
  goalTime: number,
): number {
  if (currentAvg <= goalTime) return 100;
  if (currentAvg >= startAvg) return 0;

  const logStart = Math.log(startAvg);
  const logGoal = Math.log(goalTime);
  const logCurrent = Math.log(currentAvg);

  const totalLogImprovement = logStart - logGoal;
  const currentLogImprovement = logStart - logCurrent;

  return Math.min(
    100,
    Math.max(0, (currentLogImprovement / totalLogImprovement) * 100),
  );
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDuration(days: number): string {
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;
  if (remainingDays === 0) return `${weeks}w`;
  return `${weeks}w ${remainingDays}d`;
}

function getFirstName(fullName?: string): string {
  if (!fullName) return "Cuber";
  return fullName.split(" ")[0];
}

function formatPracticeTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

export default function ProfileTrainingTab({ wcaId }: ProfileTrainingTabProps) {
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

  // Fetch coach profile and training history
  const coachData = useQuery(api.coach.getCoachProfileByWcaId, { wcaId });
  const progressStats = useQuery(
    api.coach.getProgressStatsByWcaId,
    coachData ? { wcaId } : "skip",
  );
  const goalHistory = useQuery(
    api.coach.getGoalHistoryByWcaId,
    coachData ? { wcaId, limit: 10 } : "skip",
  );

  // Loading state
  if (coachData === undefined) {
    return <ProfileTrainingTabSkeleton />;
  }

  // No training data
  if (!coachData || !coachData.onboardingCompleted) {
    return (
      <div className="timer-card">
        <div className="text-center py-8 sm:py-12">
          <div className="flex justify-center mb-4">
            <div className="p-3 sm:p-4 bg-[var(--primary)]/10 rounded-full">
              <Target className="w-6 h-6 sm:w-8 sm:h-8 text-[var(--primary)]" />
            </div>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] mb-2">
            No Training Goals Set
          </h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto px-4">
            This cuber hasn&apos;t set up their training goals yet. When they
            do, you&apos;ll be able to see their progress and cheer them on!
          </p>
        </div>
      </div>
    );
  }

  const targetTime =
    coachData.customGoalTime || GOAL_TIMES[coachData.goalType] || 20000;
  const startingAverage = coachData.currentAverage || targetTime * 1.5;
  const currentAverage =
    progressStats?.monthly?.average ||
    progressStats?.weekly?.average ||
    startingAverage;
  const status = getGoalStatus(
    coachData.targetDate,
    targetTime,
    currentAverage,
  );
  const daysRemaining = getDaysRemaining(coachData.targetDate);
  const progressPercentage = getProgressPercentage(
    currentAverage,
    startingAverage,
    targetTime,
  );

  // Calculate days since started
  const daysSinceStart = Math.floor(
    (Date.now() - (coachData.createdAt || Date.now())) / (24 * 60 * 60 * 1000),
  );

  const improvement = startingAverage - currentAverage;
  const firstName = getFirstName(coachData.userName);

  const getGoalDisplay = () => {
    if (coachData.goalType === "custom") {
      return `CUSTOM (${formatTime(targetTime)})`;
    }
    return coachData.goalType.replace("-", " ").toUpperCase();
  };

  const getStatusBadge = () => {
    switch (status) {
      case "achieved":
        return (
          <span className="flex items-center gap-1.5 text-xs sm:text-sm text-[var(--success)] px-2 sm:px-3 py-1 sm:py-1.5 bg-[var(--success)]/10 rounded-full border border-[var(--success)]/20">
            <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Goal </span>Achieved
          </span>
        );
      case "expired":
        return (
          <span className="flex items-center gap-1.5 text-xs sm:text-sm text-[var(--warning)] px-2 sm:px-3 py-1 sm:py-1.5 bg-[var(--warning)]/10 rounded-full border border-[var(--warning)]/20">
            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Overdue
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-xs sm:text-sm text-[var(--primary)] px-2 sm:px-3 py-1 sm:py-1.5 bg-[var(--primary)]/10 rounded-full border border-[var(--primary)]/20">
            <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">In </span>Progress
          </span>
        );
    }
  };
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Current Goal Card */}
      <div className="timer-card">
        {/* Header - Title on left, badge + share on right */}
        <div className="flex items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] font-statement">
              Current Goal
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)]">
              {firstName}&apos;s training journey
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {getStatusBadge()}
            <GoalShareMenu
              goalData={{
                goalType: coachData.goalType,
                customGoalTime: coachData.customGoalTime,
                targetDate: coachData.targetDate,
                currentAverage: coachData.currentAverage,
                primaryEvent: coachData.primaryEvent,
                userName: coachData.userName,
                wcaId: wcaId,
              }}
            />
          </div>
        </div>

        {/* Goal Target Display */}
        <div className="bg-[var(--surface-elevated)] rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 border border-[var(--border)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Target Info */}
            <div className="text-center lg:text-left">
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">
                Target
              </div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--primary)]">
                {getGoalDisplay()}
              </div>
              <div className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
                {EVENT_NAMES[coachData.primaryEvent] || coachData.primaryEvent}
              </div>
            </div>

            {/* Time Stats */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 text-center">
              <div className="px-2 sm:px-4">
                <div className="text-[10px] sm:text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">
                  Started At
                </div>
                <div className="text-base sm:text-xl font-semibold text-[var(--text-primary)] font-mono">
                  {formatTime(startingAverage)}
                </div>
              </div>
              <div className="w-px h-8 sm:h-10 bg-[var(--border)]" />
              <div className="px-2 sm:px-4">
                <div className="text-[10px] sm:text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">
                  Current
                </div>
                <div
                  className={`text-base sm:text-xl font-semibold font-mono ${
                    status === "achieved"
                      ? "text-[var(--success)]"
                      : "text-[var(--primary)]"
                  }`}
                >
                  {formatTime(currentAverage)}
                </div>
              </div>
              <div className="w-px h-8 sm:h-10 bg-[var(--border)]" />
              <div className="px-2 sm:px-4">
                <div className="text-[10px] sm:text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">
                  Goal
                </div>
                <div className="text-base sm:text-xl font-semibold text-[var(--success)] font-mono">
                  {formatTime(targetTime)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
            <span className="text-[var(--text-muted)]">Progress</span>
            <span
              className={`font-bold text-base sm:text-lg ${
                status === "achieved"
                  ? "text-[var(--success)]"
                  : "text-[var(--primary)]"
              }`}
            >
              {progressPercentage.toFixed(0)}%
            </span>
          </div>
          <div className="relative h-3 sm:h-4 bg-[var(--surface-elevated)] rounded-full overflow-hidden border border-[var(--border)]">
            <div
              className={`absolute h-full transition-all duration-500 rounded-full ${
                status === "achieved"
                  ? "bg-[var(--success)]"
                  : "bg-[var(--primary)]"
              }`}
              style={{ width: `${Math.min(100, progressPercentage)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] sm:text-xs text-[var(--text-muted)] mt-1 font-mono">
            <span>{formatTime(startingAverage)}</span>
            <span>{formatTime(targetTime)}</span>
          </div>
        </div>

        {/* Stats Grid - Matches CubeDevStats design pattern */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          <StatCard
            icon={TrendingUp}
            iconColor="text-green-500"
            bgColor="bg-green-500/10"
            label="Improved"
            value={
              improvement > 0
                ? `-${formatTime(improvement)}`
                : formatTime(Math.abs(improvement))
            }
            valueColor={
              improvement > 0 ? "text-[var(--success)]" : "text-[var(--error)]"
            }
          />
          <StatCard
            icon={Calendar}
            iconColor={
              status === "expired" ? "text-yellow-500" : "text-purple-500"
            }
            bgColor={
              status === "expired" ? "bg-yellow-500/10" : "bg-purple-500/10"
            }
            label={
              status === "expired"
                ? "Overdue"
                : status === "achieved"
                  ? "Completed"
                  : "Days Left"
            }
            value={
              status === "achieved"
                ? "Done"
                : status === "expired"
                  ? `${Math.abs(daysRemaining)}d`
                  : `${daysRemaining}d`
            }
            valueColor={
              status === "expired" ? "text-[var(--warning)]" : undefined
            }
          />
          <StatCard
            icon={Clock}
            iconColor="text-blue-500"
            bgColor="bg-blue-500/10"
            label="Training For"
            value={formatDuration(daysSinceStart)}
          />
          <StatCard
            icon={Flame}
            iconColor="text-orange-500"
            bgColor="bg-orange-500/10"
            label="Current Streak"
            value={
              progressStats?.currentStreak
                ? `${progressStats.currentStreak}d`
                : "0d"
            }
          />
        </div>
      </div>

      {/* Training Statistics */}
      {progressStats && (
        <div className="timer-card">
          <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] font-statement mb-4">
            Training Statistics
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
            <StatCard
              icon={Target}
              iconColor="text-blue-500"
              bgColor="bg-blue-500/10"
              label="Total Solves"
              value={progressStats.allTime?.solves?.toLocaleString() || "0"}
            />
            <StatCard
              icon={Clock}
              iconColor="text-green-500"
              bgColor="bg-green-500/10"
              label="Practice Time"
              value={formatPracticeTime(
                progressStats.allTime?.practiceMinutes || 0,
              )}
            />
            <StatCard
              icon={Calendar}
              iconColor="text-purple-500"
              bgColor="bg-purple-500/10"
              label="Journal Entries"
              value={progressStats.allTime?.entries?.toString() || "0"}
            />
            <StatCard
              icon={Flame}
              iconColor="text-orange-500"
              bgColor="bg-orange-500/10"
              label="Longest Streak"
              value={`${progressStats.longestStreak || 0}d`}
            />
          </div>

          {/* Weekly Activity */}
          {progressStats.weekly && (
            <div className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)]">
              <h4 className="text-xs sm:text-sm font-medium text-[var(--text-primary)] mb-3">
                This Week
              </h4>
              <div className="flex items-center justify-center text-center">
                <div className="flex-1 px-2 sm:px-4">
                  <div className="text-lg sm:text-2xl font-bold text-[var(--text-primary)]">
                    {progressStats.weekly.activeDays || 0}
                  </div>
                  <div className="text-[10px] sm:text-xs text-[var(--text-muted)]">
                    Active Days
                  </div>
                </div>
                <div className="w-px h-10 sm:h-12 bg-[var(--border)]" />
                <div className="flex-1 px-2 sm:px-4">
                  <div className="text-lg sm:text-2xl font-bold text-[var(--text-primary)]">
                    {progressStats.weekly.solves?.toLocaleString() || 0}
                  </div>
                  <div className="text-[10px] sm:text-xs text-[var(--text-muted)]">
                    Solves
                  </div>
                </div>
                <div className="w-px h-10 sm:h-12 bg-[var(--border)]" />
                <div className="flex-1 px-2 sm:px-4">
                  <div className="text-lg sm:text-2xl font-bold text-[var(--text-primary)] font-mono">
                    {progressStats.weekly.average
                      ? formatTime(progressStats.weekly.average)
                      : "--"}
                  </div>
                  <div className="text-[10px] sm:text-xs text-[var(--text-muted)]">
                    Avg Time
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Goal Timeline */}
      <div className="timer-card">
        <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] font-statement mb-4">
          Goal Timeline
        </h3>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-3 sm:left-4 top-0 bottom-0 w-0.5 bg-[var(--border)]" />

          {/* Current Goal */}
          <TimelineItem
            status={status}
            title={getGoalDisplay()}
            event={
              EVENT_NAMES[coachData.primaryEvent] || coachData.primaryEvent
            }
            startDate={coachData.createdAt || Date.now()}
            targetDate={coachData.targetDate}
            progress={progressPercentage}
            startingAverage={coachData.currentAverage}
            finalAverage={currentAverage}
            isCurrent
            onClick={() =>
              setSelectedGoal({
                goalType: coachData.goalType,
                customGoalTime: coachData.customGoalTime,
                primaryEvent: coachData.primaryEvent,
                startDate: coachData.createdAt || Date.now(),
                targetDate: coachData.targetDate,
                startingAverage: coachData.currentAverage,
                finalAverage: currentAverage,
                status,
                progressPercentage,
                isCurrent: true,
              })
            }
          />

          {/* Past Goals from History */}
          {goalHistory && goalHistory.length > 0 && (
            <>
              {goalHistory.map((goal) => {
                const goalTitle =
                  goal.goalType === "custom" && goal.customGoalTime
                    ? `CUSTOM (${formatTime(goal.customGoalTime)})`
                    : goal.goalType.replace("-", " ").toUpperCase();

                const goalProgress = goal.progressPercentage || 0;
                const goalStatus: GoalStatus =
                  goal.status === "achieved"
                    ? "achieved"
                    : goal.status === "expired"
                      ? "expired"
                      : "active";

                return (
                  <TimelineItem
                    key={goal._id}
                    status={goalStatus}
                    title={goalTitle}
                    event={EVENT_NAMES[goal.primaryEvent] || goal.primaryEvent}
                    startDate={goal.startDate}
                    targetDate={goal.targetDate}
                    endDate={goal.endDate}
                    progress={goalProgress}
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
                        status: goal.status as "achieved" | "expired" | "replaced" | "active",
                        progressPercentage: goalProgress,
                      })
                    }
                  />
                );
              })}
            </>
          )}

          {/* Empty state */}
          {(!goalHistory || goalHistory.length === 0) && (
            <div className="ml-10 sm:ml-12 mt-2 p-3 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]">
              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <History className="w-4 h-4" />
                <span className="text-xs sm:text-sm">
                  Past goals will appear here as they are completed
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Motivation Message */}
      <div className="timer-card">
        <div className="text-center py-2">
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            {status === "achieved" ? (
              <>Congratulations! {firstName} achieved their goal!</>
            ) : status === "expired" ? (
              <>Every journey has setbacks. Keep practicing!</>
            ) : (
              <>Cheer {firstName} on as they work towards their goal!</>
            )}
          </p>
        </div>
      </div>

      {selectedGoal && (
        <GoalDetailModal
          isOpen={!!selectedGoal}
          onClose={() => setSelectedGoal(null)}
          goal={selectedGoal}
        />
      )}
    </div>
  );
}

// Stat Card Component - Matches CubeDevStats design pattern exactly
interface StatCardProps {
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  label: string;
  value: string;
  valueColor?: string;
}

function StatCard({
  icon: Icon,
  iconColor,
  bgColor,
  label,
  value,
  valueColor,
}: StatCardProps) {
  return (
    <div className="bg-[var(--surface-elevated)] rounded-xl p-2.5 sm:p-3 md:p-4 border border-[var(--border)]">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className={`p-1.5 sm:p-2 ${bgColor} rounded-lg flex-shrink-0`}>
          <Icon className={`w-3 h-3 sm:w-4 sm:h-4 ${iconColor}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] sm:text-xs text-[var(--text-muted)] uppercase tracking-wide truncate">
            {label}
          </div>
          <div
            className={`text-sm sm:text-lg font-bold truncate ${
              valueColor || "text-[var(--text-primary)]"
            }`}
          >
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

// Timeline Item Component
interface TimelineItemProps {
  status: GoalStatus;
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
  const StatusIcon =
    status === "achieved"
      ? CheckCircle2
      : status === "expired"
        ? XCircle
        : Target;
  const statusColor =
    status === "achieved"
      ? "text-[var(--success)] bg-[var(--success)]"
      : status === "expired"
        ? "text-[var(--warning)] bg-[var(--warning)]"
        : "text-[var(--primary)] bg-[var(--primary)]";

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
        className={`relative z-10 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${statusColor.split(" ")[1]}/20`}
      >
        <StatusIcon
          className={`w-3 h-3 sm:w-4 sm:h-4 ${statusColor.split(" ")[0]}`}
        />
      </div>

      {/* Content */}
      <button
        type="button"
        onClick={onClick}
        className="flex-1 min-w-0 bg-[var(--surface-elevated)] rounded-lg p-3 sm:p-4 border border-[var(--border)] text-left hover:border-[var(--primary)]/40 hover:bg-[var(--surface-elevated)]/80 transition-all cursor-pointer group"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-2">
          <div className="min-w-0">
            <span className="font-semibold text-sm sm:text-base text-[var(--text-primary)] truncate block">
              {title}
            </span>
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <span className="text-xs sm:text-sm text-[var(--text-muted)]">
                {event}
              </span>
              {isCurrent && (
                <span className="sm:hidden text-[10px] text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded-full border border-[var(--primary)]/20 flex-shrink-0">
                  Current
                </span>
              )}
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            {isCurrent && (
              <span className="text-xs text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded-full border border-[var(--primary)]/20 flex-shrink-0">
                Current
              </span>
            )}
            <Eye className="w-3.5 h-3.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Dates row */}
        <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 text-[10px] sm:text-xs text-[var(--text-muted)]">
          <span>Started: {formatDate(startDate)}</span>
          <span>Target: {formatDate(targetDate)}</span>
          {endDate && !isCurrent && <span>Ended: {formatDate(endDate)}</span>}
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 mt-1.5 text-[10px] sm:text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {durationDays}d
          </span>
          <span
            className={status === "achieved" ? "text-[var(--success)]" : ""}
          >
            Progress: {progress.toFixed(0)}%
          </span>
          {improvement !== undefined && improvement !== 0 && (
            <span
              className={`flex items-center gap-1 ${
                improvement > 0
                  ? "text-[var(--success)]"
                  : "text-[var(--error)]"
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

// Skeleton Loader - Matches other skeleton patterns
function ProfileTrainingTabSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 animate-pulse">
      {/* Current Goal Card Skeleton */}
      <div className="timer-card">
        <div className="flex items-start sm:items-center justify-between mb-4 sm:mb-6">
          <div>
            <div className="h-5 sm:h-6 skeleton-box rounded w-28 sm:w-36 mb-2" />
            <div className="h-3 sm:h-4 skeleton-box rounded w-36 sm:w-48" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 sm:h-7 skeleton-box rounded-full w-16 sm:w-20" />
            <div className="h-6 sm:h-7 skeleton-box rounded-lg w-8 sm:w-16" />
          </div>
        </div>

        {/* Target & Progress Section */}
        <div className="skeleton-box-subtle rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 border border-[var(--border)]">
          <div className="flex items-center justify-center flex-wrap gap-4 sm:gap-8 mb-4">
            <div className="text-center">
              <div className="h-3 skeleton-box rounded w-12 mx-auto mb-2" />
              <div className="h-8 sm:h-10 skeleton-box rounded w-20 sm:w-24" />
              <div className="h-3 skeleton-box rounded w-16 mx-auto mt-1" />
            </div>
            <div className="w-px h-12 bg-[var(--border)]" />
            <div className="text-center">
              <div className="h-3 skeleton-box rounded w-16 mx-auto mb-2" />
              <div className="h-6 sm:h-8 skeleton-box rounded w-16 sm:w-20" />
            </div>
            <div className="w-px h-12 bg-[var(--border)]" />
            <div className="text-center">
              <div className="h-3 skeleton-box rounded w-20 mx-auto mb-2" />
              <div className="h-6 sm:h-8 skeleton-box rounded w-12 sm:w-16" />
            </div>
          </div>
          {/* Progress Bar */}
          <div className="h-3 sm:h-4 skeleton-box rounded-full" />
          <div className="flex justify-between mt-2">
            <div className="h-3 skeleton-box rounded w-12" />
            <div className="h-3 skeleton-box rounded w-12" />
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="skeleton-box-subtle rounded-xl p-2.5 sm:p-3 md:p-4 border border-[var(--border)]"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 skeleton-box rounded-lg flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="h-2.5 sm:h-3 skeleton-box rounded w-14 sm:w-16 mb-1.5" />
                  <div className="h-4 sm:h-5 skeleton-box rounded w-10 sm:w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* This Week Stats Skeleton */}
      <div className="timer-card">
        <div className="h-5 sm:h-6 skeleton-box rounded w-28 sm:w-32 mb-4" />
        <div className="skeleton-box-subtle rounded-xl p-3 sm:p-4 border border-[var(--border)]">
          <div className="flex items-center justify-center gap-4 sm:gap-8">
            <div className="text-center">
              <div className="h-6 sm:h-8 skeleton-box rounded w-8 sm:w-10 mb-1" />
              <div className="h-3 skeleton-box rounded w-12 sm:w-14" />
            </div>
            <div className="w-px h-10 sm:h-12 bg-[var(--border)]" />
            <div className="text-center">
              <div className="h-6 sm:h-8 skeleton-box rounded w-8 sm:w-10 mb-1" />
              <div className="h-3 skeleton-box rounded w-10 sm:w-12" />
            </div>
            <div className="w-px h-10 sm:h-12 bg-[var(--border)]" />
            <div className="text-center">
              <div className="h-6 sm:h-8 skeleton-box rounded w-12 sm:w-16 mb-1" />
              <div className="h-3 skeleton-box rounded w-14 sm:w-16" />
            </div>
          </div>
        </div>
      </div>

      {/* Goal Timeline Skeleton */}
      <div className="timer-card">
        <div className="h-5 sm:h-6 skeleton-box rounded w-28 sm:w-36 mb-4" />
        <div className="relative">
          <div className="absolute left-3 sm:left-4 top-0 bottom-0 w-0.5 bg-[var(--border)]" />
          <div className="relative flex gap-3 sm:gap-4 pb-4">
            <div className="w-6 h-6 sm:w-8 sm:h-8 skeleton-box rounded-full flex-shrink-0" />
            <div className="flex-1 skeleton-box-subtle rounded-lg p-3 sm:p-4 border border-[var(--border)]">
              <div className="h-4 sm:h-5 skeleton-box rounded w-24 sm:w-32 mb-2" />
              <div className="flex items-center gap-2 mb-2">
                <div className="h-3 skeleton-box rounded w-10" />
                <div className="h-5 skeleton-box rounded-full w-14" />
              </div>
              <div className="flex gap-3">
                <div className="h-3 skeleton-box rounded w-24" />
                <div className="h-3 skeleton-box rounded w-20" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Motivation Message Skeleton */}
      <div className="timer-card">
        <div className="text-center py-2">
          <div className="h-4 skeleton-box rounded w-64 sm:w-80 mx-auto" />
        </div>
      </div>
    </div>
  );
}
