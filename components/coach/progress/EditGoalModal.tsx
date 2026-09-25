"use client";

import { useState } from "react";
import { Calendar, Target } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
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
    <Modal open onClose={onClose} size="md" mobile="sheet">
      <Modal.Header title="Edit goal" />
      <Modal.Body>
        {/* Current Goal Info */}
        <div className="p-3 sm:p-4 bg-(--surface-elevated) rounded-(--radius-panel) border border-(--border) mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-(--text-muted)">Current Goal:</span>
            <span className="font-medium text-(--primary)">
              {profile.goalType === "custom"
                ? `Custom: ${formatTime(currentTargetTime)}`
                : profile.goalType.replace("-", " ").toUpperCase()}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1.5">
            <span className="text-(--text-muted)">Target Date:</span>
            <span className="font-medium text-(--text-primary)">
              {new Date(profile.targetDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <SegmentedControl<"deadline" | "goal">
          className="mb-4"
          value={activeTab}
          onChange={setActiveTab}
          aria-label="What to edit"
          fullWidth
          options={[
            {
              value: "deadline",
              label: "Extend deadline",
              icon: <Calendar />,
            },
            { value: "goal", label: "Change goal", icon: <Target /> },
          ]}
        />

        {/* Content */}
        <div className="space-y-4">
          {activeTab === "deadline" && (
            <>
              {/* Quick extend options */}
              <div>
                <p className="text-sm text-(--text-muted) mb-3">
                  Quick extend:
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {[7, 14, 30, 60, 90].map((days) => (
                    <button
                      key={days}
                      onClick={() => setTargetDays(days)}
                      className={`px-3 py-2 rounded-(--radius-panel) text-sm font-medium transition-colors ${
                        targetDays === days
                          ? "bg-(--primary) text-(--on-primary)"
                          : "border border-(--border) text-(--text-secondary) hover:border-(--primary) hover:text-(--primary)"
                      }`}
                    >
                      +{days}d
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-(--border)" />
                <span className="text-xs text-(--text-muted)">or</span>
                <div className="flex-1 h-px bg-(--border)" />
              </div>

              {/* Custom date picker */}
              <Field label="Set specific date">
                <Input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </Field>

              <Button
                variant="ghost"
                fullWidth
                onClick={handleSetCustomDate}
                disabled={isSubmitting}
              >
                Use selected date instead
              </Button>
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
                    className={`p-3 rounded-(--radius-panel) border text-left transition-all ${
                      selectedGoal === goal.id
                        ? "border-(--primary) bg-(--primary)/10"
                        : "border-(--border) hover:border-(--primary)"
                    }`}
                  >
                    <span
                      className={`font-medium block text-sm ${
                        selectedGoal === goal.id
                          ? "text-(--primary)"
                          : "text-(--text-primary)"
                      }`}
                    >
                      {goal.label}
                    </span>
                    {goal.time && (
                      <span className="text-xs text-(--text-muted)">
                        {formatTime(goal.time)}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Custom time input */}
              {selectedGoal === "custom" && (
                <Field label="Target time" hint="Seconds">
                  <Input
                    type="number"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    placeholder="e.g. 25"
                    min={1}
                    max={300}
                  />
                </Field>
              )}
            </>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        {activeTab === "deadline" ? (
          <Button
            onClick={handleExtendDeadline}
            loading={isSubmitting}
            loadingText="Saving…"
          >
            Extend +{targetDays} days
          </Button>
        ) : (
          <Button
            onClick={handleUpdateGoal}
            loading={isSubmitting}
            loadingText="Saving…"
          >
            Update goal
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}
