"use client";

import { useState } from "react";
import { ChevronRight, ChevronLeft, Target, Calendar, Clock, CheckCircle2 } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import CoachSessionSelector from "./CoachSessionSelector";
import CoachGoalSelector from "./CoachGoalSelector";
import CoachTimelineSelector from "./CoachTimelineSelector";
import CoachScheduleSelector from "./CoachScheduleSelector";
import CoachOnboardingSummary from "./CoachOnboardingSummary";

interface CoachOnboardingProps {
  userId: Id<"users">;
  onComplete: () => void;
}

export type OnboardingData = {
  selectedSessionId?: Id<"sessions">;
  currentAverage?: number;
  skillLevel: "beginner" | "intermediate" | "advanced" | "expert";
  primaryEvent: string;
  goalType: "sub-60" | "sub-45" | "sub-30" | "sub-20" | "sub-15" | "sub-12" | "sub-10" | "sub-8" | "competition-ready" | "custom";
  customGoalTime?: number;
  targetDate: number;
  dailyPracticeMinutes: number;
  practiceSchedule: string[];
};

const STEPS = [
  { id: 1, title: "Current Level", icon: Target, description: "Select a session to analyze" },
  { id: 2, title: "Your Goal", icon: Target, description: "What do you want to achieve?" },
  { id: 3, title: "Timeline", icon: Calendar, description: "When do you want to reach it?" },
  { id: 4, title: "Commitment", icon: Clock, description: "How much time can you practice?" },
  { id: 5, title: "Review", icon: CheckCircle2, description: "Confirm your training plan" },
];

export default function CoachOnboarding({ userId, onComplete }: CoachOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [data, setData] = useState<Partial<OnboardingData>>({
    skillLevel: "intermediate",
    primaryEvent: "333",
    goalType: "sub-20",
    targetDate: Date.now() + 90 * 24 * 60 * 60 * 1000, // 90 days from now
    dailyPracticeMinutes: 30,
    practiceSchedule: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  });

  const saveProfile = useMutation(api.coach.saveCoachProfile);
  const generatePlan = useMutation(api.coach.generateTrainingPlan);

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!data.skillLevel || !data.goalType || !data.targetDate || !data.dailyPracticeMinutes) {
      return;
    }

    setIsSubmitting(true);
    try {
      const profileId = await saveProfile({
        userId,
        currentAverage: data.currentAverage,
        skillLevel: data.skillLevel,
        primaryEvent: data.primaryEvent || "333",
        goalType: data.goalType,
        customGoalTime: data.customGoalTime,
        targetDate: data.targetDate,
        dailyPracticeMinutes: data.dailyPracticeMinutes,
        practiceSchedule: data.practiceSchedule,
        baselineSessionId: data.selectedSessionId,
      });

      // Generate the first week's training plan
      await generatePlan({
        userId,
        profileId,
        weekNumber: 1,
      });

      onComplete();
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return true; // Session selection is optional
      case 2:
        return !!data.goalType;
      case 3:
        return !!data.targetDate;
      case 4:
        return !!data.dailyPracticeMinutes && data.practiceSchedule && data.practiceSchedule.length > 0;
      case 5:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-full flex flex-col">
      {/* Progress Steps */}
      <div className="flex-shrink-0 px-4 py-6 border-b border-[var(--border)]">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isActive
                          ? "bg-[var(--primary)] text-white"
                          : isCompleted
                          ? "bg-[var(--success)] text-white"
                          : "bg-[var(--surface-elevated)] text-[var(--text-muted)]"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={`mt-2 text-xs font-medium hidden sm:block ${
                        isActive ? "text-[var(--primary)]" : "text-[var(--text-muted)]"
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`w-8 sm:w-16 lg:w-24 h-1 mx-2 rounded ${
                        isCompleted ? "bg-[var(--success)]" : "bg-[var(--border)]"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {currentStep === 1 && (
            <CoachSessionSelector
              userId={userId}
              data={data}
              onUpdate={updateData}
            />
          )}
          {currentStep === 2 && (
            <CoachGoalSelector
              data={data}
              onUpdate={updateData}
            />
          )}
          {currentStep === 3 && (
            <CoachTimelineSelector
              data={data}
              onUpdate={updateData}
            />
          )}
          {currentStep === 4 && (
            <CoachScheduleSelector
              data={data}
              onUpdate={updateData}
            />
          )}
          {currentStep === 5 && (
            <CoachOnboardingSummary
              data={data as OnboardingData}
            />
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex-shrink-0 px-4 py-4 border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-2xl mx-auto flex justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              currentStep === 1
                ? "text-[var(--text-muted)] cursor-not-allowed"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]"
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          {currentStep < STEPS.length ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                canProceed()
                  ? "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
                  : "bg-[var(--surface-elevated)] text-[var(--text-muted)] cursor-not-allowed"
              }`}
            >
              <span>Continue</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium bg-[var(--success)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  <span>Creating Plan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Start Training</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
