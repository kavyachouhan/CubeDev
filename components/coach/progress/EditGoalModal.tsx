"use client";

import { useState } from "react";
import { X, Calendar, Target } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CoachProfile, GOAL_TIMES } from "./types";
import { formatTime } from "./utils";

interface EditGoalModalProps {
  profile: CoachProfile;
  isOpen: boolean;
  onClose: () => void;
}

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

export default function EditGoalModal({
  profile,
  isOpen,
  onClose,
}: EditGoalModalProps) {
  const [activeTab, setActiveTab] = useState<"deadline" | "goal">("deadline");
  const [targetDays, setTargetDays] = useState<number>(30);
  const [customDate, setCustomDate] = useState<string>(() => {
    const date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return date.toISOString().split("T")[0];
  });
  const [selectedGoal, setSelectedGoal] = useState<GoalType>(
    profile.goalType as GoalType,
  );
  const [customTime, setCustomTime] = useState<string>(
    profile.customGoalTime ? (profile.customGoalTime / 1000).toString() : "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateGoal = useMutation(api.coach.updateGoal);

  const handleExtendDeadline = async () => {
    setIsSubmitting(true);
    try {
      const newTargetDate = Date.now() + targetDays * 24 * 60 * 60 * 1000;
      await updateGoal({
        userId: profile.userId,
        goalType: profile.goalType as GoalType,
        customGoalTime: profile.customGoalTime,
        targetDate: newTargetDate,
      });
      onClose();
    } catch (error) {
      console.error("Failed to extend deadline:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetCustomDate = async () => {
    setIsSubmitting(true);
    try {
      const newTargetDate = new Date(customDate).getTime();
      await updateGoal({
        userId: profile.userId,
        goalType: profile.goalType as GoalType,
        customGoalTime: profile.customGoalTime,
        targetDate: newTargetDate,
      });
      onClose();
    } catch (error) {
      console.error("Failed to set custom date:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateGoal = async () => {
    setIsSubmitting(true);
    try {
      const newCustomTime =
        selectedGoal === "custom" && customTime
          ? parseFloat(customTime) * 1000
          : undefined;

      await updateGoal({
        userId: profile.userId,
        goalType: selectedGoal,
        customGoalTime: newCustomTime,
        targetDate: profile.targetDate,
      });
      onClose();
    } catch (error) {
      console.error("Failed to update goal:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const allGoals: { id: GoalType; label: string; time: number | null }[] = [
    { id: "sub-60", label: "Sub 60", time: 60000 },
    { id: "sub-45", label: "Sub 45", time: 45000 },
    { id: "sub-30", label: "Sub 30", time: 30000 },
    { id: "sub-20", label: "Sub 20", time: 20000 },
    { id: "sub-15", label: "Sub 15", time: 15000 },
    { id: "sub-12", label: "Sub 12", time: 12000 },
    { id: "sub-10", label: "Sub 10", time: 10000 },
    { id: "sub-8", label: "Sub 8", time: 8000 },
    { id: "custom", label: "Custom", time: null },
  ];

  const currentTargetTime =
    profile.customGoalTime || GOAL_TIMES[profile.goalType] || 20000;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="timer-card max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] font-statement">
            Edit Goal
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-lg hover:bg-[var(--surface-elevated)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Goal Info */}
        <div className="p-3 sm:p-4 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)] mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-muted)]">Current Goal:</span>
            <span className="font-medium text-[var(--primary)]">
              {profile.goalType === "custom"
                ? `Custom: ${formatTime(currentTargetTime)}`
                : profile.goalType.replace("-", " ").toUpperCase()}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1.5">
            <span className="text-[var(--text-muted)]">Target Date:</span>
            <span className="font-medium text-[var(--text-primary)]">
              {new Date(profile.targetDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)] mb-4">
          <button
            onClick={() => setActiveTab("deadline")}
            className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
              activeTab === "deadline"
                ? "bg-[var(--primary)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface)]"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Extend Deadline</span>
          </button>
          <button
            onClick={() => setActiveTab("goal")}
            className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
              activeTab === "goal"
                ? "bg-[var(--primary)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface)]"
            }`}
          >
            <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Change Goal</span>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {activeTab === "deadline" && (
            <>
              {/* Quick extend options */}
              <div>
                <p className="text-sm text-[var(--text-muted)] mb-3">
                  Quick extend:
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {[7, 14, 30, 60, 90].map((days) => (
                    <button
                      key={days}
                      onClick={() => setTargetDays(days)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        targetDays === days
                          ? "bg-[var(--primary)] text-white"
                          : "border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                      }`}
                    >
                      +{days}d
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[var(--border)]" />
                <span className="text-xs text-[var(--text-muted)]">or</span>
                <div className="flex-1 h-px bg-[var(--border)]" />
              </div>

              {/* Custom date picker */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Set specific date:
                </label>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 btn-secondary order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExtendDeadline}
                  disabled={isSubmitting}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                >
                  {isSubmitting ? "Saving..." : `Extend +${targetDays} days`}
                </button>
              </div>

              {/* Or use custom date */}
              <button
                onClick={handleSetCustomDate}
                disabled={isSubmitting}
                className="w-full text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors disabled:opacity-50 py-2"
              >
                Use selected date instead
              </button>
            </>
          )}

          {activeTab === "goal" && (
            <>
              {/* Goal selection */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {allGoals.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => setSelectedGoal(goal.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selectedGoal === goal.id
                        ? "border-[var(--primary)] bg-[var(--primary)]/10"
                        : "border-[var(--border)] hover:border-[var(--primary)]"
                    }`}
                  >
                    <span
                      className={`font-medium block text-sm ${
                        selectedGoal === goal.id
                          ? "text-[var(--primary)]"
                          : "text-[var(--text-primary)]"
                      }`}
                    >
                      {goal.label}
                    </span>
                    {goal.time && (
                      <span className="text-xs text-[var(--text-muted)]">
                        {formatTime(goal.time)}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Custom time input */}
              {selectedGoal === "custom" && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Target time (seconds):
                  </label>
                  <input
                    type="number"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    placeholder="e.g., 25"
                    className="w-full px-4 py-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
                    min={1}
                    max={300}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 btn-secondary order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateGoal}
                  disabled={isSubmitting}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                >
                  {isSubmitting ? "Saving..." : "Update Goal"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
