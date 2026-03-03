"use client";

import { Target, Trophy, Timer } from "lucide-react";
import { OnboardingData } from "./CoachOnboarding";

interface CoachGoalSelectorProps {
  data: Partial<OnboardingData>;
  onUpdate: (updates: Partial<OnboardingData>) => void;
}

const GOALS = [
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
] as const;

function formatTime(ms: number): string {
  const seconds = ms / 1000;
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(0);
  return mins > 0 ? `${mins}:${secs.padStart(2, "0")}` : `${secs}s`;
}

function getRecommendedGoals(
  skillLevel: string,
  currentAverage?: number,
): string[] {
  // Recommend goals based on skill level
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

export default function CoachGoalSelector({
  data,
  onUpdate,
}: CoachGoalSelectorProps) {
  const recommendedGoals = getRecommendedGoals(
    data.skillLevel || "intermediate",
    data.currentAverage,
  );

  const handleGoalSelect = (goalId: string) => {
    if (goalId === "custom") {
      onUpdate({ goalType: "custom" });
    } else {
      const goal = GOALS.find((g) => g.id === goalId);
      onUpdate({
        goalType: goalId as OnboardingData["goalType"],
        customGoalTime: goal?.time,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="timer-card text-center">
        <h2 className="text-2xl font-bold text-(--text-primary) mb-2">
          What's Your Goal?
        </h2>
        <p className="text-(--text-secondary)">
          Choose a target time to work towards. We'll create a training plan to
          help you get there.
        </p>
      </div>

      {/* Current Average Card */}
      {data.currentAverage && (
        <div className="timer-card">
          <div className="flex items-center justify-center gap-3">
            <Timer className="w-5 h-5 text-(--primary)" />
            <span className="text-(--text-secondary)">
              Your current average:
            </span>
            <span className="text-xl font-bold text-(--primary)">
              {formatTime(data.currentAverage)}
            </span>
          </div>
        </div>
      )}

      {/* Recommended Goals Card */}
      <div className="timer-card">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-(--primary)" />
          <h3 className="font-semibold text-(--text-primary)">
            Recommended for your level
          </h3>
        </div>

        <div className="space-y-2">
          {GOALS.filter((g) => recommendedGoals.includes(g.id)).map((goal) => (
            <button
              key={goal.id}
              onClick={() => handleGoalSelect(goal.id)}
              className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all ${
                data.goalType === goal.id
                  ? "bg-(--primary)/10 border-(--primary)"
                  : "bg-(--surface-elevated) border-(--border) hover:border-(--border-hover)"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    data.goalType === goal.id
                      ? "bg-(--primary) text-white"
                      : "bg-(--surface) text-(--text-muted)"
                  }`}
                >
                  <Target className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span
                    className={`font-semibold block ${
                      data.goalType === goal.id
                        ? "text-(--primary)"
                        : "text-(--text-primary)"
                    }`}
                  >
                    {goal.label}
                  </span>
                  <span className="text-sm text-(--text-muted)">
                    {goal.description}
                  </span>
                </div>
              </div>
              <span
                className={`text-lg font-mono ${
                  data.goalType === goal.id
                    ? "text-(--primary)"
                    : "text-(--text-secondary)"
                }`}
              >
                {formatTime(goal.time)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Other Goals Card */}
      <div className="timer-card">
        <h3 className="font-semibold text-(--text-primary) mb-4">
          Other goals
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {GOALS.filter((g) => !recommendedGoals.includes(g.id)).map((goal) => (
            <button
              key={goal.id}
              onClick={() => handleGoalSelect(goal.id)}
              className={`p-3 rounded-lg border text-center transition-all ${
                data.goalType === goal.id
                  ? "bg-(--primary)/10 border-(--primary) text-(--primary)"
                  : "bg-(--surface-elevated) border-(--border) text-(--text-secondary) hover:border-(--border-hover)"
              }`}
            >
              <span className="font-medium block">{goal.label}</span>
              <span className="text-xs text-(--text-muted)">
                {formatTime(goal.time)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Goal Card */}
      <div className="timer-card space-y-3">
        <h3 className="font-semibold text-(--text-primary) mb-2">
          Custom goal
        </h3>

        {/* Custom Goal */}
        <button
          onClick={() => handleGoalSelect("custom")}
          className={`w-full p-4 rounded-lg border text-left transition-all ${
            data.goalType === "custom"
              ? "bg-(--primary)/10 border-(--primary)"
              : "bg-(--surface-elevated) border-(--border) hover:border-(--border-hover)"
          }`}
        >
          <span
            className={`font-semibold block ${
              data.goalType === "custom"
                ? "text-(--primary)"
                : "text-(--text-primary)"
            }`}
          >
            Custom Goal
          </span>
          <span className="text-sm text-(--text-muted)">
            Set your own target time
          </span>
        </button>

        {data.goalType === "custom" && (
          <div className="flex items-center gap-3 p-4 bg-(--surface-elevated) rounded-lg border border-(--border)">
            <label className="text-sm text-(--text-secondary)">
              Target time (seconds):
            </label>
            <input
              type="number"
              value={data.customGoalTime ? data.customGoalTime / 1000 : ""}
              onChange={(e) =>
                onUpdate({ customGoalTime: parseFloat(e.target.value) * 1000 })
              }
              placeholder="e.g., 25"
              className="flex-1 px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-(--text-primary) focus:outline-none focus:border-(--primary)"
              min={1}
              max={300}
            />
          </div>
        )}
      </div>
    </div>
  );
}