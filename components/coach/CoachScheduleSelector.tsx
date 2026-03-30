"use client";

import { Clock, Calendar, CheckSquare } from "lucide-react";
import { OnboardingData } from "./CoachOnboarding";

interface CoachScheduleSelectorProps {
  data: Partial<OnboardingData>;
  onUpdate: (updates: Partial<OnboardingData>) => void;
}

const DAYS_OF_WEEK = [
  { id: "Sun", label: "Sun", fullName: "Sunday" },
  { id: "Mon", label: "Mon", fullName: "Monday" },
  { id: "Tue", label: "Tue", fullName: "Tuesday" },
  { id: "Wed", label: "Wed", fullName: "Wednesday" },
  { id: "Thu", label: "Thu", fullName: "Thursday" },
  { id: "Fri", label: "Fri", fullName: "Friday" },
  { id: "Sat", label: "Sat", fullName: "Saturday" },
];

const TIME_OPTIONS = [
  { id: 15, label: "15 min", description: "Quick daily sessions" },
  { id: 30, label: "30 min", description: "Focused practice" },
  { id: 45, label: "45 min", description: "Solid training" },
  { id: 60, label: "1 hour", description: "Dedicated practice" },
  { id: 90, label: "1.5 hours", description: "Intensive training" },
  { id: 120, label: "2 hours", description: "Serious commitment" },
];

const PRESET_SCHEDULES = [
  { id: "weekdays", label: "Weekdays Only", days: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
  { id: "everyday", label: "Every Day", days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] },
  { id: "weekends", label: "Weekends Only", days: ["Sat", "Sun"] },
  { id: "alternating", label: "Alternating Days", days: ["Mon", "Wed", "Fri", "Sun"] },
];

export default function CoachScheduleSelector({
  data,
  onUpdate,
}: CoachScheduleSelectorProps) {
  const schedule = data.practiceSchedule || [];

  const toggleDay = (dayId: string) => {
    const newSchedule = schedule.includes(dayId)
      ? schedule.filter(d => d !== dayId)
      : [...schedule, dayId];
    onUpdate({ practiceSchedule: newSchedule });
  };

  const applyPreset = (days: string[]) => {
    onUpdate({ practiceSchedule: days });
  };

  const totalWeeklyMinutes = (data.dailyPracticeMinutes || 0) * schedule.length;
  const totalWeeklyHours = totalWeeklyMinutes / 60;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="timer-card text-center">
        <h2 className="text-2xl font-bold text-(--text-primary) mb-2">
          How Much Time Can You Commit?
        </h2>
        <p className="text-(--text-secondary)">
          Tell us your availability so we can create a personalized training schedule.
        </p>
      </div>

      {/* Daily Practice Time Card */}
      <div className="timer-card">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-(--primary)" />
          <h3 className="font-semibold text-(--text-primary)">Daily Practice Time</h3>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {TIME_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => onUpdate({ dailyPracticeMinutes: option.id })}
              className={`p-3 rounded-lg border text-center transition-all ${
                data.dailyPracticeMinutes === option.id
                  ? "bg-(--primary)/10 border-(--primary)"
                  : "bg-(--surface-elevated) border-(--border) hover:border-(--border-hover)"
              }`}
            >
              <span className={`font-semibold block ${
                data.dailyPracticeMinutes === option.id ? "text-(--primary)" : "text-(--text-primary)"
              }`}>
                {option.label}
              </span>
              <span className="text-xs text-(--text-muted)">{option.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Practice Days Card */}
      <div className="timer-card">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-(--primary)" />
          <h3 className="font-semibold text-(--text-primary)">Practice Days</h3>
        </div>

        {/* Preset Schedules */}
        <div className="flex flex-wrap gap-2 mb-4">
          {PRESET_SCHEDULES.map((preset) => {
            const isActive = JSON.stringify([...schedule].sort()) === JSON.stringify([...preset.days].sort());
            return (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset.days)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                  isActive
                    ? "bg-(--primary) text-white"
                    : "bg-(--surface-elevated) text-(--text-secondary) hover:bg-(--surface)"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Day Selection */}
        <div className="grid grid-cols-7 gap-2">
          {DAYS_OF_WEEK.map((day) => {
            const isSelected = schedule.includes(day.id);
            return (
              <button
                key={day.id}
                onClick={() => toggleDay(day.id)}
                className={`p-3 rounded-lg border text-center transition-all ${
                  isSelected
                    ? "bg-(--primary)/10 border-(--primary)"
                    : "bg-(--surface-elevated) border-(--border) hover:border-(--border-hover)"
                }`}
              >
                <span className={`font-medium block text-sm ${
                  isSelected ? "text-(--primary)" : "text-(--text-primary)"
                }`}>
                  {day.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Weekly Summary Card */}
      <div className="timer-card">
        <div className="flex items-center gap-2 mb-4">
          <CheckSquare className="w-5 h-5 text-(--primary)" />
          <h3 className="font-semibold text-(--text-primary)">Weekly Summary</h3>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-(--surface-elevated) rounded-lg">
            <span className="text-xs text-(--text-muted) block mb-1">Practice Days</span>
            <span className="text-xl font-bold text-(--text-primary)">
              {schedule.length}
            </span>
          </div>
          <div className="text-center p-3 bg-(--surface-elevated) rounded-lg">
            <span className="text-xs text-(--text-muted) block mb-1">Daily Time</span>
            <span className="text-xl font-bold text-(--text-primary)">
              {data.dailyPracticeMinutes}m
            </span>
          </div>
          <div className="text-center p-3 bg-(--surface-elevated) rounded-lg">
            <span className="text-xs text-(--text-muted) block mb-1">Weekly Total</span>
            <span className="text-xl font-bold text-(--primary)">
              {totalWeeklyHours.toFixed(1)}h
            </span>
          </div>
        </div>

        {/* Practice Calendar Preview */}
        <div className="pt-4 border-t border-(--border)">
          <span className="text-xs text-(--text-muted) block mb-2">Your practice week:</span>
          <div className="flex gap-1">
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = schedule.includes(day.id);
              return (
                <div
                  key={day.id}
                  className={`flex-1 h-8 rounded flex items-center justify-center text-xs font-medium ${
                    isSelected
                      ? "bg-(--primary) text-white"
                      : "bg-(--surface) text-(--text-muted)"
                  }`}
                >
                  {day.label[0]}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Validation Message */}
      {schedule.length === 0 && (
        <div className="p-3 bg-(--warning)/10 border border-(--warning)/30 rounded-lg text-sm text-(--warning)">
          Please select at least one practice day to continue.
        </div>
      )}

      {schedule.length > 0 && schedule.length < 3 && (
        <div className="p-3 bg-(--info)/10 border border-(--info)/30 rounded-lg text-sm text-(--info)">
          Practicing more days per week will help you reach your goal faster. Consider adding more practice days if possible.
        </div>
      )}
    </div>
  );
}
