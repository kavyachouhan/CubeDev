"use client";

import { useState } from "react";
import { Calendar, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { OnboardingData } from "./CoachOnboarding";

interface CoachTimelineSelectorProps {
  data: Partial<OnboardingData>;
  onUpdate: (updates: Partial<OnboardingData>) => void;
}

const TIMELINE_OPTIONS = [
  {
    id: "4-weeks",
    label: "4 Weeks",
    days: 28,
    description: "Intensive short-term focus",
  },
  {
    id: "8-weeks",
    label: "8 Weeks",
    days: 56,
    description: "Balanced improvement pace",
  },
  {
    id: "12-weeks",
    label: "12 Weeks",
    days: 84,
    description: "Recommended for most goals",
  },
  {
    id: "6-months",
    label: "6 Months",
    days: 180,
    description: "Sustainable long-term progress",
  },
  {
    id: "custom",
    label: "Custom Date",
    days: 0,
    description: "Choose your own deadline",
  },
];

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDaysUntil(timestamp: number): number {
  const now = Date.now();
  return Math.ceil((timestamp - now) / (24 * 60 * 60 * 1000));
}

function getTimelineAssessment(
  goalType: string | undefined,
  days: number,
  currentAverage?: number,
): { type: "realistic" | "challenging" | "aggressive"; message: string } {
  // Simple heuristic based on goal and timeline
  const improvementNeeded = getImprovementPercentage(goalType, currentAverage);
  const weeksAvailable = Math.floor(days / 7);
  const improvementPerWeek = improvementNeeded / weeksAvailable;

  if (improvementPerWeek < 2) {
    return {
      type: "realistic",
      message:
        "This timeline gives you plenty of time to reach your goal with consistent practice.",
    };
  } else if (improvementPerWeek < 5) {
    return {
      type: "challenging",
      message:
        "This is an ambitious but achievable timeline with dedicated practice.",
    };
  } else {
    return {
      type: "aggressive",
      message:
        "This is a very aggressive timeline. Consider extending it for sustainable progress.",
    };
  }
}

function getImprovementPercentage(
  goalType: string | undefined,
  currentAverage?: number,
): number {
  if (!currentAverage || !goalType) return 20;

  const goalTimes: Record<string, number> = {
    "sub-60": 60000,
    "sub-45": 45000,
    "sub-30": 30000,
    "sub-20": 20000,
    "sub-15": 15000,
    "sub-12": 12000,
    "sub-10": 10000,
    "sub-8": 8000,
  };

  const targetTime = goalTimes[goalType] || currentAverage * 0.8;
  return ((currentAverage - targetTime) / currentAverage) * 100;
}

export default function CoachTimelineSelector({
  data,
  onUpdate,
}: CoachTimelineSelectorProps) {
  const [selectedOption, setSelectedOption] = useState<string>(() => {
    const days = getDaysUntil(data.targetDate || Date.now());
    if (days <= 30) return "4-weeks";
    if (days <= 60) return "8-weeks";
    if (days <= 90) return "12-weeks";
    if (days <= 180) return "6-months";
    return "custom";
  });

  const handleOptionSelect = (optionId: string, days: number) => {
    setSelectedOption(optionId);
    if (days > 0) {
      const targetDate = Date.now() + days * 24 * 60 * 60 * 1000;
      onUpdate({ targetDate });
    }
  };

  const handleCustomDateChange = (dateString: string) => {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      onUpdate({ targetDate: date.getTime() });
    }
  };

  const daysUntilTarget = getDaysUntil(data.targetDate || Date.now());
  const assessment = getTimelineAssessment(
    data.goalType,
    daysUntilTarget,
    data.currentAverage,
  );

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="timer-card text-center">
        <h2 className="text-2xl font-bold text-(--text-primary) mb-2">
          When Do You Want to Achieve It?
        </h2>
        <p className="text-(--text-secondary)">
          Set a realistic timeline for your goal. We'll pace your training
          accordingly.
        </p>
      </div>

      {/* Timeline Options Card */}
      <div className="timer-card">
        <h3 className="font-semibold text-(--text-primary) mb-4">
          Select Timeline
        </h3>
        <div className="space-y-2">
          {TIMELINE_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => handleOptionSelect(option.id, option.days)}
              className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all ${
                selectedOption === option.id
                  ? "bg-(--primary)/10 border-(--primary)"
                  : "bg-(--surface-elevated) border-(--border) hover:border-(--border-hover)"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedOption === option.id
                      ? "bg-(--primary) text-white"
                      : "bg-(--surface) text-(--text-muted)"
                  }`}
                >
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span
                    className={`font-semibold block ${
                      selectedOption === option.id
                        ? "text-(--primary)"
                        : "text-(--text-primary)"
                    }`}
                  >
                    {option.label}
                  </span>
                  <span className="text-sm text-(--text-muted)">
                    {option.description}
                  </span>
                </div>
              </div>
              {option.days > 0 && (
                <span className="text-sm text-(--text-muted)">
                  {formatDate(Date.now() + option.days * 24 * 60 * 60 * 1000)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Picker */}
      {selectedOption === "custom" && (
        <div className="timer-card">
          <label className="block text-sm font-medium text-(--text-secondary) mb-2">
            Select Target Date
          </label>
          <input
            type="date"
            value={
              data.targetDate
                ? new Date(data.targetDate).toISOString().split("T")[0]
                : ""
            }
            onChange={(e) => handleCustomDateChange(e.target.value)}
            min={
              new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0]
            }
            className="w-full px-4 py-2 bg-(--surface) border border-(--border) rounded-lg text-(--text-primary) focus:outline-none focus:border-(--primary)"
          />
        </div>
      )}

      {/* Target Date Summary Card */}
      <div className="timer-card">
        <h3 className="font-semibold text-(--text-primary) mb-4">
          Summary
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-(--surface-elevated) rounded-lg">
            <span className="text-xs text-(--text-muted) block mb-1">
              Target Date
            </span>
            <span className="font-bold text-(--text-primary)">
              {formatDate(data.targetDate || Date.now())}
            </span>
          </div>
          <div className="text-center p-3 bg-(--surface-elevated) rounded-lg">
            <span className="text-xs text-(--text-muted) block mb-1">
              Time Remaining
            </span>
            <span className="font-bold text-(--primary)">
              {daysUntilTarget} days
            </span>
          </div>
        </div>
      </div>

      {/* Timeline Assessment Card */}
      <div
        className={`timer-card ${
          assessment.type === "realistic"
            ? "!bg-(--success)/5 !border-(--success)/30"
            : assessment.type === "challenging"
              ? "!bg-(--warning)/5 !border-(--warning)/30"
              : "!bg-(--error)/5 !border-(--error)/30"
        }`}
      >
        <div className="flex items-start gap-3">
          {assessment.type === "realistic" ? (
            <CheckCircle2 className="w-5 h-5 text-(--success) shrink-0 mt-0.5" />
          ) : assessment.type === "challenging" ? (
            <Clock className="w-5 h-5 text-(--warning) shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-(--error) shrink-0 mt-0.5" />
          )}
          <div>
            <span
              className={`font-medium block ${
                assessment.type === "realistic"
                  ? "text-(--success)"
                  : assessment.type === "challenging"
                    ? "text-(--warning)"
                    : "text-(--error)"
              }`}
            >
              {assessment.type === "realistic"
                ? "Realistic Timeline"
                : assessment.type === "challenging"
                  ? "Challenging Timeline"
                  : "Aggressive Timeline"}
            </span>
            <span className="text-sm text-(--text-secondary)">
              {assessment.message}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
