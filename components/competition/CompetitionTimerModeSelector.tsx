"use client";

import { useState, useRef, useEffect } from "react";
import { Timer, Edit3, Mic, ChevronDown, Check } from "lucide-react";

export type CompetitionTimerMode = "normal" | "manual" | "stackmat";

interface TimerModeOption {
  value: CompetitionTimerMode;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface CompetitionTimerModeSelectorProps {
  timerMode: CompetitionTimerMode;
  onTimerModeChange: (mode: CompetitionTimerMode) => void;
  disabled?: boolean;
}

const timerModeOptions: TimerModeOption[] = [
  {
    value: "normal",
    label: "Normal Timer",
    description: "Traditional spacebar timer",
    icon: Timer,
  },
  {
    value: "manual",
    label: "Manual Entry",
    description: "Enter times manually",
    icon: Edit3,
  },
  {
    value: "stackmat",
    label: "Stackmat Timer",
    description: "Use external stackmat",
    icon: Mic,
  },
];

export default function CompetitionTimerModeSelector({
  timerMode,
  onTimerModeChange,
  disabled = false,
}: CompetitionTimerModeSelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  const selectedOption = timerModeOptions.find(
    (opt) => opt.value === timerMode
  );
  const Icon = selectedOption?.icon || Timer;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setShowDropdown(!showDropdown)}
        disabled={disabled}
        className={`flex items-center gap-2 px-3 py-2 bg-(--surface-elevated) hover:bg-(--surface-elevated)/80 rounded-lg border border-(--border) transition-colors ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <Icon className="w-4 h-4 text-(--primary) shrink-0" />
        <span className="text-sm font-medium text-(--text-primary) hidden sm:inline">
          {selectedOption?.label || "Normal Timer"}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-(--text-secondary) transition-transform shrink-0 ${
            showDropdown ? "rotate-180" : ""
          }`}
        />
      </button>

      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-(--surface) border border-(--border) rounded-lg shadow-xl z-50 overflow-hidden">
          {timerModeOptions.map((option) => {
            const OptionIcon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => {
                  onTimerModeChange(option.value);
                  setShowDropdown(false);
                }}
                className={`w-full text-left p-3 hover:bg-(--surface-elevated) transition-colors border-b border-(--border)/50 last:border-b-0 ${
                  timerMode === option.value ? "bg-(--primary)/10" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <OptionIcon
                      className={`w-4 h-4 shrink-0 ${
                        timerMode === option.value
                          ? "text-(--primary)"
                          : "text-(--text-secondary)"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div
                        className={`font-medium text-sm ${
                          timerMode === option.value
                            ? "text-(--primary)"
                            : "text-(--text-primary)"
                        }`}
                      >
                        {option.label}
                      </div>
                      <div className="text-xs text-(--text-muted) mt-0.5">
                        {option.description}
                      </div>
                    </div>
                  </div>
                  {timerMode === option.value && (
                    <Check className="w-4 h-4 text-(--primary) shrink-0 ml-2" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
