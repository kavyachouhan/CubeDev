"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  ChevronRight,
  ChevronLeft,
  Target,
  Gauge,
  Calendar,
  Clock,
  CheckCircle2,
  X,
  Trophy,
  Timer,
  Info,
  FolderOpen,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  invalidateCoachProfile,
  invalidateTrainingPlan,
  invalidateProgressStats,
} from "@/lib/coach-cache";

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

type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert";

interface GoalSetupData {
  selectedSessionId?: Id<"sessions">;
  goalType: GoalType;
  customGoalTime?: number;
  targetDate: number;
  dailyPracticeMinutes: number;
  practiceSchedule: string[];
  skillLevel: SkillLevel;
}

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
  createdAt?: number;
}

interface GoalSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CoachProfile;
  currentAverage?: number;
  mode: "edit" | "new";
}

const SKILL_LEVELS: {
  id: SkillLevel;
  label: string;
  description: string;
}[] = [
  { id: "beginner", label: "Beginner", description: "Average > 30s" },
  { id: "intermediate", label: "Intermediate", description: "20s - 30s" },
  { id: "advanced", label: "Advanced", description: "12s - 20s" },
  { id: "expert", label: "Expert", description: "< 12s" },
];

const GOALS: {
  id: GoalType;
  label: string;
  time: number;
  description: string;
}[] = [
  {
    id: "sub-60",
    label: "Sub 60",
    time: 60000,
    description: "Great starting goal for beginners",
  },
  {
    id: "sub-45",
    label: "Sub 45",
    time: 45000,
    description: "Building consistency",
  },
  {
    id: "sub-30",
    label: "Sub 30",
    time: 30000,
    description: "Entering intermediate territory",
  },
  {
    id: "sub-20",
    label: "Sub 20",
    time: 20000,
    description: "Solid intermediate cuber",
  },
  {
    id: "sub-15",
    label: "Sub 15",
    time: 15000,
    description: "Advanced cuber milestone",
  },
  {
    id: "sub-12",
    label: "Sub 12",
    time: 12000,
    description: "Competition-ready speed",
  },
  {
    id: "sub-10",
    label: "Sub 10",
    time: 10000,
    description: "Elite level cubing",
  },
  {
    id: "sub-8",
    label: "Sub 8",
    time: 8000,
    description: "World-class performance",
  },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const PRACTICE_TIMES = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hr" },
  { value: 90, label: "1.5 hr" },
  { value: 120, label: "2 hr" },
];

const STEPS = [
  {
    id: 1,
    title: "Current Level",
    icon: Gauge,
    description: "Select a session to analyze",
  },
  {
    id: 2,
    title: "Goal",
    icon: Target,
    description: "What do you want to achieve?",
  },
  {
    id: 3,
    title: "Timeline",
    icon: Calendar,
    description: "When do you want to reach it?",
  },
  {
    id: 4,
    title: "Commitment",
    icon: Clock,
    description: "How much can you practice?",
  },
  {
    id: 5,
    title: "Review",
    icon: CheckCircle2,
    description: "Confirm your changes",
  },
];

function formatTimeSimple(ms: number): string {
  const seconds = ms / 1000;
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(0);
  return mins > 0 ? `${mins}:${secs.padStart(2, "0")}` : `${secs}s`;
}

function formatTime(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return "-";
  const seconds = ms / 1000;
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(2);
  return mins > 0 ? `${mins}:${secs.padStart(5, "0")}` : secs;
}

function determineSkillLevel(avgMs: number): SkillLevel {
  if (avgMs > 30000) return "beginner";
  if (avgMs > 20000) return "intermediate";
  if (avgMs > 12000) return "advanced";
  return "expert";
}

function getRecommendedGoals(skillLevel: string): string[] {
  switch (skillLevel) {
    case "beginner":
      return ["sub-60", "sub-45", "sub-30"];
    case "intermediate":
      return ["sub-30", "sub-20", "sub-15"];
    case "advanced":
      return ["sub-15", "sub-12", "sub-10"];
    case "expert":
      return ["sub-10", "sub-8"];
    default:
      return ["sub-30", "sub-20", "sub-15"];
  }
}

export default function GoalSetupModal({
  isOpen,
  onClose,
  profile,
  currentAverage,
  mode,
}: GoalSetupModalProps) {
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [data, setData] = useState<GoalSetupData>(() => ({
    selectedSessionId: undefined,
    goalType: (profile.goalType as GoalType) || "sub-20",
    customGoalTime: profile.customGoalTime,
    targetDate:
      mode === "new"
        ? Date.now() + 90 * 24 * 60 * 60 * 1000
        : profile.targetDate,
    dailyPracticeMinutes: profile.dailyPracticeMinutes || 30,
    practiceSchedule: profile.practiceSchedule || [
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
    ],
    skillLevel: (profile.skillLevel as SkillLevel) || "intermediate",
  }));

  // Load user's sessions for session selection step
  const sessions = useQuery(
    api.coach.getUserSessionsWith3x3Stats,
    isOpen ? { userId: profile.userId } : "skip",
  );
  const selectedSessionStats = useQuery(
    api.coach.getSessionStats,
    data.selectedSessionId
      ? { sessionId: data.selectedSessionId, event: "333" }
      : "skip",
  );

  const filteredSessions = sessions?.filter((s) => s.solveCount3x3 > 0) || [];

  // Track the last processed session ID to avoid re-processing when user re-selects the same session
  const lastProcessedRef = useRef<string | null>(null);

  // Handle session stats update
  useEffect(() => {
    if (
      selectedSessionStats?.average &&
      data.selectedSessionId &&
      lastProcessedRef.current !== data.selectedSessionId
    ) {
      lastProcessedRef.current = data.selectedSessionId;
      const skillLevel = determineSkillLevel(selectedSessionStats.average);
      setData((prev) => ({
        ...prev,
        skillLevel,
      }));
    }
  }, [selectedSessionStats?.average, data.selectedSessionId]);

  const updateGoal = useMutation(api.coach.updateGoal);
  const generatePlan = useMutation(api.coach.generateTrainingPlan);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setCurrentStep(1);
      lastProcessedRef.current = null;
      setData({
        selectedSessionId: undefined,
        goalType: (profile.goalType as GoalType) || "sub-20",
        customGoalTime: profile.customGoalTime,
        targetDate:
          mode === "new"
            ? Date.now() + 90 * 24 * 60 * 60 * 1000
            : profile.targetDate,
        dailyPracticeMinutes: profile.dailyPracticeMinutes || 30,
        practiceSchedule: profile.practiceSchedule || [
          "Mon",
          "Tue",
          "Wed",
          "Thu",
          "Fri",
        ],
        skillLevel: (profile.skillLevel as SkillLevel) || "intermediate",
      });
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, profile, mode]);

  const recommendedGoals = useMemo(
    () => getRecommendedGoals(data.skillLevel),
    [data.skillLevel],
  );

  const updateData = (updates: Partial<GoalSetupData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const hasChanges = useMemo(() => {
    return (
      data.goalType !== profile.goalType ||
      data.customGoalTime !== profile.customGoalTime ||
      data.targetDate !== profile.targetDate ||
      data.dailyPracticeMinutes !== profile.dailyPracticeMinutes ||
      data.skillLevel !== profile.skillLevel ||
      JSON.stringify(data.practiceSchedule) !==
        JSON.stringify(profile.practiceSchedule || [])
    );
  }, [data, profile]);

  const isGoalChange = useMemo(() => {
    return (
      data.goalType !== profile.goalType ||
      data.customGoalTime !== profile.customGoalTime
    );
  }, [
    data.goalType,
    data.customGoalTime,
    profile.goalType,
    profile.customGoalTime,
  ]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await updateGoal({
        userId: profile.userId,
        goalType: data.goalType,
        customGoalTime: data.customGoalTime,
        targetDate: data.targetDate,
        currentAverage: currentAverage,
        archiveCurrentGoal: mode === "new" || isGoalChange,
        skillLevel: data.skillLevel,
        dailyPracticeMinutes: data.dailyPracticeMinutes,
        practiceSchedule: data.practiceSchedule,
      });

      // Only regenerate plan if goal type/time changed or if creating new goal (archiving old one)
      if (isGoalChange || mode === "new") {
        try {
          await generatePlan({
            userId: profile.userId,
            profileId: profile._id,
            weekNumber: 1,
          });
        } catch {
          // If plan generation fails, we still want to show the updated goal. The user can manually regenerate the plan from the dashboard.
        }
      }

      invalidateCoachProfile(profile.userId);
      invalidateTrainingPlan(profile.userId);
      invalidateProgressStats(profile.userId);
      onClose();
    } catch (error) {
      console.error("Failed to update goal:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return true; // Session selection and skill level are optional
      case 2:
        return !!data.goalType;
      case 3:
        return !!data.targetDate;
      case 4:
        return !!data.dailyPracticeMinutes && data.practiceSchedule.length > 0;
      case 5:
        return true;
      default:
        return false;
    }
  };

  if (!mounted || !isOpen) return null;

  const currentGoalTime =
    profile.customGoalTime ||
    GOALS.find((g) => g.id === profile.goalType)?.time ||
    20000;

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

      <div className="relative w-full max-w-2xl timer-card border-[var(--border)] animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between pb-3 sm:pb-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-[var(--text-primary)] font-statement">
              {mode === "new" ? "Set New Goal" : "Edit Goal"}
            </h2>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              {mode === "new"
                ? "Configure your next training goal"
                : "Update your current training setup"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicators */}
        <div className="flex-shrink-0 py-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-center">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => isCompleted && setCurrentStep(step.id)}
                      disabled={!isCompleted}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                        isActive
                          ? "bg-[var(--primary)] text-white"
                          : isCompleted
                            ? "bg-[var(--success)] text-white cursor-pointer"
                            : "bg-[var(--surface-elevated)] text-[var(--text-muted)]"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </button>
                    <span
                      className={`mt-1 text-[10px] sm:text-xs font-medium hidden sm:block ${
                        isActive
                          ? "text-[var(--primary)]"
                          : "text-[var(--text-muted)]"
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`w-4 sm:w-12 lg:w-16 h-0.5 mx-0.5 sm:mx-2 rounded shrink-0 ${
                        isCompleted
                          ? "bg-[var(--success)]"
                          : "bg-[var(--border)]"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto py-3 sm:py-4 min-h-0">
          {/* Step 1: Current Level */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  What's Your Current Level?
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Select a recent 3x3 session so we can analyze your skill
                  level.
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1.5 italic">
                  More events coming soon!
                </p>
              </div>

              {/* Session Selection */}
              <div className="p-4 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-[var(--text-primary)]">
                    Select a 3x3 Session
                  </h4>
                  <span className="text-xs text-[var(--text-muted)]">
                    Optional
                  </span>
                </div>

                <div className="flex items-start gap-2 p-2 bg-[var(--info)]/10 border border-[var(--info)]/20 rounded-lg mb-3">
                  <Info className="w-4 h-4 text-[var(--info)] flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-[var(--text-secondary)]">
                    For best accuracy, select a session with at least{" "}
                    <span className="font-semibold text-[var(--info)]">
                      100 solves
                    </span>
                    .
                  </p>
                </div>

                {!sessions ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
                  </div>
                ) : filteredSessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
                    <AlertCircle className="w-6 h-6 text-[var(--text-muted)] mb-2" />
                    <p className="text-[var(--text-muted)] text-xs text-center px-2">
                      No 3x3 sessions found. Select your skill level manually
                      below.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {filteredSessions.slice(0, 10).map((session) => {
                      const isSelected = data.selectedSessionId === session._id;
                      const hasEnoughSolves = session.solveCount3x3 >= 100;

                      return (
                        <button
                          key={session._id}
                          onClick={() => {
                            lastProcessedRef.current = null;
                            updateData({
                              selectedSessionId: session._id,
                            });
                          }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all text-left ${
                            isSelected
                              ? "bg-[var(--primary)]/10 border-[var(--primary)]"
                              : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-hover)]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <FolderOpen
                              className={`w-4 h-4 ${
                                isSelected
                                  ? "text-[var(--primary)]"
                                  : "text-[var(--text-muted)]"
                              }`}
                            />
                            <span
                              className={`text-sm font-medium ${
                                isSelected
                                  ? "text-[var(--primary)]"
                                  : "text-[var(--text-primary)]"
                              }`}
                            >
                              {session.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs ${
                                hasEnoughSolves
                                  ? "text-[var(--success)]"
                                  : "text-[var(--text-muted)]"
                              }`}
                            >
                              {session.solveCount3x3} solves
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Session Stats */}
              {data.selectedSessionId && selectedSessionStats && (
                <div className="p-4 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-4 h-4 text-[var(--primary)]" />
                    <h4 className="text-sm font-medium text-[var(--text-primary)]">
                      Session Analysis
                    </h4>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-2 bg-[var(--surface)] rounded-lg">
                      <span className="text-[10px] text-[var(--text-muted)] block">
                        Solves
                      </span>
                      <span className="text-lg font-bold text-[var(--text-primary)]">
                        {selectedSessionStats.solveCount}
                      </span>
                    </div>
                    <div className="text-center p-2 bg-[var(--surface)] rounded-lg">
                      <span className="text-[10px] text-[var(--text-muted)] block">
                        Average
                      </span>
                      <span className="text-lg font-bold text-[var(--primary)]">
                        {formatTime(selectedSessionStats.average)}
                      </span>
                    </div>
                    <div className="text-center p-2 bg-[var(--surface)] rounded-lg">
                      <span className="text-[10px] text-[var(--text-muted)] block">
                        Best
                      </span>
                      <span className="text-lg font-bold text-[var(--success)]">
                        {formatTime(selectedSessionStats.bestSingle)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Skill Level Selection */}
              <div className="p-4 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]">
                <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">
                  {data.selectedSessionId
                    ? "Detected Skill Level"
                    : "Select Your Skill Level"}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {SKILL_LEVELS.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => updateData({ skillLevel: level.id })}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        data.skillLevel === level.id
                          ? "bg-[var(--primary)]/10 border-[var(--primary)]"
                          : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-hover)]"
                      }`}
                    >
                      <span
                        className={`text-sm font-medium block ${
                          data.skillLevel === level.id
                            ? "text-[var(--primary)]"
                            : "text-[var(--text-primary)]"
                        }`}
                      >
                        {level.label}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {level.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Goal Selection */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  {mode === "new"
                    ? "Choose Your Next Goal"
                    : "Update Your Goal"}
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Select a target time to work towards
                </p>
              </div>

              {/* Current info banner */}
              {currentAverage && (
                <div className="flex items-center justify-center gap-3 p-3 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]">
                  <Timer className="w-4 h-4 text-[var(--primary)]" />
                  <span className="text-sm text-[var(--text-secondary)]">
                    Current average:
                  </span>
                  <span className="text-lg font-bold text-[var(--primary)]">
                    {formatTimeSimple(currentAverage)}
                  </span>
                </div>
              )}

              {mode === "edit" && (
                <div className="flex items-start gap-2 p-2.5 bg-[var(--info)]/10 border border-[var(--info)]/20 rounded-lg">
                  <Info className="w-4 h-4 text-[var(--info)] flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-[var(--text-secondary)]">
                    Current goal:{" "}
                    <span className="font-semibold text-[var(--info)]">
                      {profile.goalType === "custom"
                        ? `Custom (${formatTimeSimple(currentGoalTime)})`
                        : profile.goalType
                            .replace("-", " ")
                            .replace("sub", "Sub ")}
                    </span>
                    . Changing the goal type will archive your current progress.
                  </p>
                </div>
              )}

              {/* Recommended Goals */}
              <div className="p-4 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-4 h-4 text-[var(--primary)]" />
                  <h4 className="text-sm font-medium text-[var(--text-primary)]">
                    Recommended for your level
                  </h4>
                </div>
                <div className="space-y-1.5">
                  {GOALS.filter((g) => recommendedGoals.includes(g.id)).map(
                    (goal) => (
                      <button
                        key={goal.id}
                        onClick={() =>
                          updateData({
                            goalType: goal.id,
                            customGoalTime: goal.time,
                          })
                        }
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                          data.goalType === goal.id
                            ? "bg-[var(--primary)]/10 border-[var(--primary)]"
                            : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-hover)]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Target
                            className={`w-4 h-4 ${
                              data.goalType === goal.id
                                ? "text-[var(--primary)]"
                                : "text-[var(--text-muted)]"
                            }`}
                          />
                          <div className="text-left">
                            <span
                              className={`text-sm font-medium block ${
                                data.goalType === goal.id
                                  ? "text-[var(--primary)]"
                                  : "text-[var(--text-primary)]"
                              }`}
                            >
                              {goal.label}
                            </span>
                            <span className="text-xs text-[var(--text-muted)]">
                              {goal.description}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`text-sm font-mono ${
                            data.goalType === goal.id
                              ? "text-[var(--primary)]"
                              : "text-[var(--text-secondary)]"
                          }`}
                        >
                          {formatTimeSimple(goal.time)}
                        </span>
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* Other Goals */}
              {GOALS.filter((g) => !recommendedGoals.includes(g.id)).length >
                0 && (
                <div className="p-4 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]">
                  <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">
                    Other goals
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {GOALS.filter((g) => !recommendedGoals.includes(g.id)).map(
                      (goal) => (
                        <button
                          key={goal.id}
                          onClick={() =>
                            updateData({
                              goalType: goal.id,
                              customGoalTime: goal.time,
                            })
                          }
                          className={`p-2 rounded-lg border text-center transition-all ${
                            data.goalType === goal.id
                              ? "bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]"
                              : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]"
                          }`}
                        >
                          <span className="text-sm font-medium block">
                            {goal.label}
                          </span>
                          <span className="text-xs text-[var(--text-muted)]">
                            {formatTimeSimple(goal.time)}
                          </span>
                        </button>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Timeline */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Set Your Timeline
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  When do you want to achieve your goal?
                </p>
              </div>

              <div className="p-4 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]">
                <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">
                  Target Date
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: "1 Month", days: 30 },
                    { label: "2 Months", days: 60 },
                    { label: "3 Months", days: 90 },
                    { label: "6 Months", days: 180 },
                  ].map((option) => {
                    const targetTime =
                      Date.now() + option.days * 24 * 60 * 60 * 1000;
                    const isSelected =
                      Math.abs((data.targetDate || 0) - targetTime) <
                      24 * 60 * 60 * 1000;

                    return (
                      <button
                        key={option.days}
                        onClick={() => updateData({ targetDate: targetTime })}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          isSelected
                            ? "bg-[var(--primary)]/10 border-[var(--primary)]"
                            : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-hover)]"
                        }`}
                      >
                        <span
                          className={`text-sm font-medium block ${
                            isSelected
                              ? "text-[var(--primary)]"
                              : "text-[var(--text-primary)]"
                          }`}
                        >
                          {option.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]">
                <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">
                  Or pick a specific date
                </h4>
                <input
                  type="date"
                  value={
                    data.targetDate
                      ? new Date(data.targetDate).toISOString().split("T")[0]
                      : ""
                  }
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) =>
                    updateData({
                      targetDate: new Date(e.target.value).getTime(),
                    })
                  }
                  className="w-full px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
                />
              </div>

              {data.targetDate && (
                <div className="p-3 bg-[var(--info)]/10 border border-[var(--info)]/20 rounded-lg text-center">
                  <span className="text-sm text-[var(--text-secondary)]">
                    Target:{" "}
                    <span className="font-medium text-[var(--info)]">
                      {new Date(data.targetDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Commitment */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Your Commitment
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  How much time can you dedicate to practice?
                </p>
              </div>

              <div className="p-4 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]">
                <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">
                  Daily Practice Time
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {PRACTICE_TIMES.map((time) => (
                    <button
                      key={time.value}
                      onClick={() =>
                        updateData({ dailyPracticeMinutes: time.value })
                      }
                      className={`p-2.5 rounded-lg border text-center transition-all ${
                        data.dailyPracticeMinutes === time.value
                          ? "bg-[var(--primary)]/10 border-[var(--primary)]"
                          : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-hover)]"
                      }`}
                    >
                      <span
                        className={`text-sm font-medium ${
                          data.dailyPracticeMinutes === time.value
                            ? "text-[var(--primary)]"
                            : "text-[var(--text-primary)]"
                        }`}
                      >
                        {time.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]">
                <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">
                  Practice Days
                </h4>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => {
                    const isSelected = data.practiceSchedule.includes(day);
                    return (
                      <button
                        key={day}
                        onClick={() => {
                          const newSchedule = isSelected
                            ? data.practiceSchedule.filter((d) => d !== day)
                            : [...data.practiceSchedule, day];
                          updateData({ practiceSchedule: newSchedule });
                        }}
                        className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                          isSelected
                            ? "bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]"
                            : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  {data.practiceSchedule.length} days per week selected
                </p>
              </div>

              <div className="p-3 bg-[var(--info)]/10 border border-[var(--info)]/20 rounded-lg text-center">
                <span className="text-sm text-[var(--text-secondary)]">
                  Total weekly practice:{" "}
                  <span className="font-medium text-[var(--info)]">
                    {data.dailyPracticeMinutes * data.practiceSchedule.length}{" "}
                    minutes
                  </span>
                </span>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Review Changes
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  {mode === "new"
                    ? "Confirm your new training setup"
                    : "Review your updated settings"}
                </p>
              </div>

              <div className="space-y-3">
                {/* Skill Level */}
                <ReviewRow
                  label="Skill Level"
                  newValue={
                    data.skillLevel.charAt(0).toUpperCase() +
                    data.skillLevel.slice(1)
                  }
                  oldValue={
                    mode === "edit"
                      ? profile.skillLevel.charAt(0).toUpperCase() +
                        profile.skillLevel.slice(1)
                      : undefined
                  }
                  changed={data.skillLevel !== profile.skillLevel}
                />

                {/* Goal */}
                <ReviewRow
                  label="Goal"
                  newValue={
                    data.goalType === "custom"
                      ? `Custom: ${data.customGoalTime ? formatTimeSimple(data.customGoalTime) : "Set"}`
                      : data.goalType.replace("-", " ").replace("sub", "Sub ")
                  }
                  oldValue={
                    mode === "edit"
                      ? profile.goalType === "custom"
                        ? `Custom: ${profile.customGoalTime ? formatTimeSimple(profile.customGoalTime) : "Set"}`
                        : profile.goalType
                            .replace("-", " ")
                            .replace("sub", "Sub ")
                      : undefined
                  }
                  changed={isGoalChange}
                  highlight
                />

                {/* Target Date */}
                <ReviewRow
                  label="Target Date"
                  newValue={new Date(data.targetDate).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric", year: "numeric" },
                  )}
                  oldValue={
                    mode === "edit"
                      ? new Date(profile.targetDate).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" },
                        )
                      : undefined
                  }
                  changed={data.targetDate !== profile.targetDate}
                />

                {/* Practice */}
                <ReviewRow
                  label="Practice"
                  newValue={`${data.dailyPracticeMinutes} min / ${data.practiceSchedule.length} days`}
                  oldValue={
                    mode === "edit"
                      ? `${profile.dailyPracticeMinutes} min / ${(profile.practiceSchedule || []).length} days`
                      : undefined
                  }
                  changed={
                    data.dailyPracticeMinutes !==
                      profile.dailyPracticeMinutes ||
                    JSON.stringify(data.practiceSchedule) !==
                      JSON.stringify(profile.practiceSchedule || [])
                  }
                />

                {/* Weekly Total */}
                <div className="flex items-center justify-between p-3 bg-[var(--primary)]/10 rounded-lg border border-[var(--primary)]">
                  <span className="text-sm text-[var(--text-muted)]">
                    Weekly Total
                  </span>
                  <span className="text-sm font-bold text-[var(--primary)]">
                    {(
                      (data.dailyPracticeMinutes *
                        data.practiceSchedule.length) /
                      60
                    ).toFixed(1)}{" "}
                    hours
                  </span>
                </div>
              </div>

              {mode === "new" && (
                <div className="flex items-start gap-2 p-2.5 bg-[var(--warning)]/10 border border-[var(--warning)]/20 rounded-lg">
                  <Info className="w-4 h-4 text-[var(--warning)] flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-[var(--text-secondary)]">
                    Your current goal progress will be archived in your goal
                    history.
                    {isGoalChange
                      ? " A new training plan will be generated."
                      : ""}
                  </p>
                </div>
              )}

              {!hasChanges && (
                <div className="p-3 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)] text-center">
                  <p className="text-sm text-[var(--text-muted)]">
                    No changes detected. Update at least one setting to save.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 pt-3 sm:pt-4 border-t border-[var(--border)]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">
              Step {currentStep} of {STEPS.length}
            </span>
            <div className="flex items-center gap-2">
              {currentStep > 1 && (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-[var(--border)] rounded-lg hover:bg-[var(--surface-elevated)] hover:border-[var(--border-hover)] text-[var(--text-primary)] transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Back</span>
                </button>
              )}
              {currentStep < STEPS.length ? (
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="flex items-center gap-1 px-4 py-1.5 text-sm font-medium bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || (mode === "edit" && !hasChanges)}
                  className="flex items-center gap-1 px-4 py-1.5 text-sm font-medium bg-[var(--success)] hover:opacity-90 text-white rounded-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {mode === "new" ? "Start New Goal" : "Save Changes"}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// Helper component for review rows in the final step
function ReviewRow({
  label,
  newValue,
  oldValue,
  changed,
  highlight,
}: {
  label: string;
  newValue: string;
  oldValue?: string;
  changed?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border ${
        highlight && changed
          ? "bg-[var(--primary)]/5 border-[var(--primary)]/30"
          : "bg-[var(--surface-elevated)] border-[var(--border)]"
      }`}
    >
      <span className="text-sm text-[var(--text-muted)]">{label}</span>
      <div className="flex items-center gap-2 text-right">
        {changed && oldValue && (
          <>
            <span className="text-xs text-[var(--text-muted)] line-through hidden sm:inline">
              {oldValue}
            </span>
            <ChevronRight className="w-3 h-3 text-[var(--text-muted)] hidden sm:block" />
          </>
        )}
        <span
          className={`text-sm font-medium ${
            changed ? "text-[var(--primary)]" : "text-[var(--text-primary)]"
          }`}
        >
          {newValue}
        </span>
      </div>
    </div>
  );
}