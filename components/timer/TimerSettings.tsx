"use client";

import { useState, useRef, useEffect } from "react";
import {
  Eye,
  Zap,
  Volume2,
  VolumeX,
  ChevronDown,
  Check,
  Timer,
  Edit3,
  Mic,
} from "lucide-react";
import {
  SPLIT_METHODS,
  getSplitMethod,
  ConsistencyCoachSettings,
} from "@/lib/phase-splits";
import { Tooltip } from "./Tooltip";
import StatsVisibilitySettings, {
  ExtendedStatsVisibility,
} from "./StatsVisibilitySettings";

export type TimerMode = "normal" | "manual" | "stackmat";

interface TimerSettingsProps {
  showSettings: boolean;
  timerMode: TimerMode;
  setTimerMode: (mode: TimerMode) => void;
  inspectionEnabled: boolean;
  setInspectionEnabled: (enabled: boolean) => void;
  focusModeEnabled: boolean;
  setFocusModeEnabled: (enabled: boolean) => void;
  phaseSplitsEnabled: boolean;
  setPhaseSplitsEnabled: (enabled: boolean) => void;
  selectedSplitMethod: string;
  setSelectedSplitMethod: (method: string) => void;
  consistencyCoach: ConsistencyCoachSettings;
  setConsistencyCoach: (
    settings:
      | ConsistencyCoachSettings
      | ((prev: ConsistencyCoachSettings) => ConsistencyCoachSettings)
  ) => void;
  mutePbSound: boolean;
  setMutePbSound: (muted: boolean) => void;
  extendedStatsVisibility: ExtendedStatsVisibility;
  onToggleExtendedStat: (stat: keyof ExtendedStatsVisibility) => void;
}

export default function TimerSettings({
  showSettings,
  timerMode,
  setTimerMode,
  inspectionEnabled,
  setInspectionEnabled,
  focusModeEnabled,
  setFocusModeEnabled,
  phaseSplitsEnabled,
  setPhaseSplitsEnabled,
  selectedSplitMethod,
  setSelectedSplitMethod,
  consistencyCoach,
  setConsistencyCoach,
  mutePbSound,
  setMutePbSound,
  extendedStatsVisibility,
  onToggleExtendedStat,
}: TimerSettingsProps) {
  const [showSplitMethodDropdown, setShowSplitMethodDropdown] = useState(false);
  const [showSoundDropdown, setShowSoundDropdown] = useState(false);
  const [showTimerModeDropdown, setShowTimerModeDropdown] = useState(false);

  const splitMethodDropdownRef = useRef<HTMLDivElement>(null);
  const soundDropdownRef = useRef<HTMLDivElement>(null);
  const timerModeDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        splitMethodDropdownRef.current &&
        !splitMethodDropdownRef.current.contains(e.target as Node)
      ) {
        setShowSplitMethodDropdown(false);
      }
      if (
        soundDropdownRef.current &&
        !soundDropdownRef.current.contains(e.target as Node)
      ) {
        setShowSoundDropdown(false);
      }
      if (
        timerModeDropdownRef.current &&
        !timerModeDropdownRef.current.contains(e.target as Node)
      ) {
        setShowTimerModeDropdown(false);
      }
    };

    if (showSplitMethodDropdown || showSoundDropdown || showTimerModeDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSplitMethodDropdown, showSoundDropdown, showTimerModeDropdown]);

  const soundOptions = [
    { value: "beep", label: "Beep", description: "Classic electronic beep" },
    { value: "tick", label: "Tick", description: "Metronome-style tick" },
    { value: "wood", label: "Wood", description: "Warm wooden click" },
  ];

  const timerModeOptions = [
    {
      value: "normal" as TimerMode,
      label: "Normal Timer",
      description: "Traditional spacebar timer",
      icon: Timer,
    },
    {
      value: "manual" as TimerMode,
      label: "Manual Entry",
      description: "Enter times manually",
      icon: Edit3,
    },
    {
      value: "stackmat" as TimerMode,
      label: "Stackmat Timer",
      description: "Connect via microphone",
      icon: Mic,
    },
  ];

  if (!showSettings) return null;

  return (
    <div className="mb-4 p-4 bg-(--surface-elevated) rounded-lg border border-(--border)">
      <div className="space-y-3">
        {/* Timer Mode Selection */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-(--primary)/20 text-(--primary) rounded-lg flex items-center justify-center">
              <Timer className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-medium text-(--text-primary) font-inter">
                Timer Mode
              </span>
              <p className="text-xs text-(--text-muted) font-inter">
                Choose how you want to time your solves
              </p>
            </div>
          </div>

          <div className="relative ml-11" ref={timerModeDropdownRef}>
            <button
              onClick={() => setShowTimerModeDropdown(!showTimerModeDropdown)}
              className="w-full flex items-center justify-between p-2 bg-(--surface-elevated) hover:bg-(--surface-elevated)/80 rounded-lg border border-(--border) transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {(() => {
                  const Icon =
                    timerModeOptions.find((opt) => opt.value === timerMode)
                      ?.icon || Timer;
                  return (
                    <Icon className="w-4 h-4 text-(--primary) shrink-0" />
                  );
                })()}
                <div className="text-left min-w-0 flex-1">
                  <div className="font-medium text-(--text-primary) font-statement truncate text-sm">
                    {timerModeOptions.find((opt) => opt.value === timerMode)
                      ?.label || "Normal Timer"}
                  </div>
                  <div className="text-xs text-(--text-muted) font-inter truncate">
                    {timerModeOptions.find((opt) => opt.value === timerMode)
                      ?.description || "Traditional spacebar timer"}
                  </div>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-(--text-secondary) transition-transform shrink-0 ${
                  showTimerModeDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            {showTimerModeDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-(--surface) border border-(--border) rounded-lg shadow-xl z-[9999] max-h-60 overflow-hidden">
                <div className="max-h-56 overflow-y-auto">
                  {timerModeOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => {
                          setTimerMode(option.value);
                          setShowTimerModeDropdown(false);
                        }}
                        className={`w-full text-left p-3 hover:bg-(--surface-elevated) transition-colors border-b border-(--border)/50 last:border-b-0 ${
                          timerMode === option.value
                            ? "bg-(--primary)/20"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Icon
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
                              <div className="text-xs text-(--text-muted) mt-1">
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
              </div>
            )}
          </div>
        </div>

        {/* Inspection Time Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-(--primary)/20 text-(--primary) rounded-lg flex items-center justify-center">
              <span className="text-xs font-bold">15</span>
            </div>
            <div>
              <span className="text-sm font-medium text-(--text-primary) font-inter">
                Inspection Time
              </span>
              <p className="text-xs text-(--text-muted) font-inter">
                15-second inspection before solving
              </p>
            </div>
          </div>
          <button
            onClick={() => setInspectionEnabled(!inspectionEnabled)}
            className={`w-11 h-6 rounded-full transition-colors flex items-center ${
              inspectionEnabled
                ? "bg-(--primary) justify-end"
                : "bg-(--border) justify-start"
            }`}
          >
            <div className="w-4 h-4 bg-white rounded-full mx-1 transition-all" />
          </button>
        </div>

        {/* Focus Mode Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-(--primary)/20 text-(--primary) rounded-lg flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-medium text-(--text-primary) font-inter">
                Focus Mode
              </span>
              <p className="text-xs text-(--text-muted) font-inter">
                Blur other areas during solve
              </p>
            </div>
          </div>
          <button
            onClick={() => setFocusModeEnabled(!focusModeEnabled)}
            className={`w-11 h-6 rounded-full transition-colors flex items-center ${
              focusModeEnabled
                ? "bg-(--primary) justify-end"
                : "bg-(--border) justify-start"
            }`}
          >
            <div className="w-4 h-4 bg-white rounded-full mx-1 transition-all" />
          </button>
        </div>

        {/* Mute PB Sound Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-(--primary)/20 text-(--primary) rounded-lg flex items-center justify-center">
              <VolumeX className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-medium text-(--text-primary) font-inter">
                Mute PB Sound
              </span>
              <p className="text-xs text-(--text-muted) font-inter">
                Silence sound when achieving a personal best
              </p>
            </div>
          </div>
          <button
            onClick={() => setMutePbSound(!mutePbSound)}
            className={`w-11 h-6 rounded-full transition-colors flex items-center ${
              mutePbSound
                ? "bg-(--primary) justify-end"
                : "bg-(--border) justify-start"
            }`}
          >
            <div className="w-4 h-4 bg-white rounded-full mx-1 transition-all" />
          </button>
        </div>

        {/* Phase Split Timer Toggle */}
        <Tooltip
          content="Phase splits only available in Normal timer mode"
          disabled={timerMode === "normal"}
        >
          <div
            className={`flex items-center justify-between ${
              timerMode !== "normal" ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-(--primary)/20 text-(--primary) rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-medium text-(--text-primary) font-inter">
                  Phase Split Timer
                </span>
                <p className="text-xs text-(--text-muted) font-inter">
                  Track solve phases with spacebar presses
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                timerMode === "normal" &&
                setPhaseSplitsEnabled(!phaseSplitsEnabled)
              }
              disabled={timerMode !== "normal"}
              className={`w-11 h-6 rounded-full transition-colors flex items-center ${
                phaseSplitsEnabled
                  ? "bg-(--primary) justify-end"
                  : "bg-(--border) justify-start"
              } ${timerMode !== "normal" ? "cursor-not-allowed" : ""}`}
            >
              <div className="w-4 h-4 bg-white rounded-full mx-1 transition-all" />
            </button>
          </div>
        </Tooltip>

        {/* Split Method Selection */}
        {phaseSplitsEnabled && timerMode === "normal" && (
          <div className="ml-11 pl-3 border-l border-(--border)">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-(--text-primary) font-inter">
                Split Method
              </span>
            </div>

            <div className="relative" ref={splitMethodDropdownRef}>
              <button
                onClick={() =>
                  setShowSplitMethodDropdown(!showSplitMethodDropdown)
                }
                className="w-full flex items-center justify-between p-2 bg-(--surface-elevated) hover:bg-(--surface-elevated)/80 rounded-lg border border-(--border) transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="text-left min-w-0 flex-1">
                    <div className="font-medium text-(--text-primary) font-statement truncate text-sm">
                      {getSplitMethod(selectedSplitMethod)?.name ||
                        "Select Method"}
                    </div>
                    <div className="text-xs text-(--text-muted) font-inter truncate">
                      {getSplitMethod(selectedSplitMethod)?.description ||
                        "Choose a splitting method"}
                    </div>
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-(--text-secondary) transition-transform shrink-0 ${
                    showSplitMethodDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showSplitMethodDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-(--surface) border border-(--border) rounded-lg shadow-xl z-[9999] max-h-60 overflow-hidden">
                  <div className="max-h-56 overflow-y-auto">
                    {SPLIT_METHODS.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => {
                          setSelectedSplitMethod(method.id);
                          setShowSplitMethodDropdown(false);
                        }}
                        className={`w-full text-left p-3 hover:bg-(--surface-elevated) transition-colors border-b border-(--border)/50 last:border-b-0 ${
                          selectedSplitMethod === method.id
                            ? "bg-(--primary)/20"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <div
                              className={`font-medium text-sm ${
                                selectedSplitMethod === method.id
                                  ? "text-(--primary)"
                                  : "text-(--text-primary)"
                              }`}
                            >
                              {method.name}
                            </div>
                            <div className="text-xs text-(--text-muted) mt-1">
                              {method.description}
                            </div>
                            <div className="text-xs text-(--text-muted) mt-1">
                              {method.phases.length} phases
                            </div>
                          </div>
                          {selectedSplitMethod === method.id && (
                            <Check className="w-4 h-4 text-(--primary) shrink-0 ml-2" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Consistency Coach Toggle */}
        <Tooltip
          content="Consistency coach only available in Normal and Stackmat timer modes"
          disabled={timerMode !== "manual"}
        >
          <div
            className={`flex items-center justify-between ${
              timerMode === "manual" ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-(--primary)/20 text-(--primary) rounded-lg flex items-center justify-center">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-medium text-(--text-primary) font-inter">
                  Consistency Coach
                </span>
                <p className="text-xs text-(--text-muted) font-inter">
                  Soft metronome for pacing practice
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                timerMode !== "manual" &&
                setConsistencyCoach((prev) => ({
                  ...prev,
                  enabled: !prev.enabled,
                }))
              }
              disabled={timerMode === "manual"}
              className={`w-11 h-6 rounded-full transition-colors flex items-center ${
                consistencyCoach.enabled
                  ? "bg-(--primary) justify-end"
                  : "bg-(--border) justify-start"
              } ${timerMode === "manual" ? "cursor-not-allowed" : ""}`}
            >
              <div className="w-4 h-4 bg-white rounded-full mx-1 transition-all" />
            </button>
          </div>
        </Tooltip>

        {/* Consistency Coach Settings */}
        {consistencyCoach.enabled && timerMode !== "manual" && (
          <div className="ml-11 pl-3 border-l border-(--border) space-y-2">
            {/* BPM Setting */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-(--text-primary) font-inter">
                BPM
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="60"
                  max="180"
                  value={consistencyCoach.bpm}
                  onChange={(e) =>
                    setConsistencyCoach((prev) => ({
                      ...prev,
                      bpm: parseInt(e.target.value),
                    }))
                  }
                  className="w-16 h-1 bg-(--border) rounded-full appearance-none cursor-pointer"
                />
                <span className="text-xs text-(--text-muted) w-8">
                  {consistencyCoach.bpm}
                </span>
              </div>
            </div>

            {/* Volume Setting */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-(--text-primary) font-inter">
                Volume
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={consistencyCoach.volume}
                  onChange={(e) =>
                    setConsistencyCoach((prev) => ({
                      ...prev,
                      volume: parseInt(e.target.value),
                    }))
                  }
                  className="w-16 h-1 bg-(--border) rounded-full appearance-none cursor-pointer"
                />
                <span className="text-xs text-(--text-muted) w-8">
                  {consistencyCoach.volume}
                </span>
              </div>
            </div>

            {/* Sound Selection */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-(--text-primary) font-inter">
                Sound
              </span>
            </div>

            <div className="relative" ref={soundDropdownRef}>
              <button
                onClick={() => setShowSoundDropdown(!showSoundDropdown)}
                className="w-full flex items-center justify-between p-2 bg-(--surface-elevated) hover:bg-(--surface-elevated)/80 rounded-lg border border-(--border) transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Volume2 className="w-4 h-4 text-(--primary) shrink-0" />
                  <div className="text-left min-w-0 flex-1">
                    <div className="font-medium text-(--text-primary) font-statement truncate text-sm">
                      {soundOptions.find(
                        (opt) => opt.value === consistencyCoach.sound
                      )?.label || "Beep"}
                    </div>
                    <div className="text-xs text-(--text-muted) font-inter truncate">
                      {soundOptions.find(
                        (opt) => opt.value === consistencyCoach.sound
                      )?.description || "Sound type"}
                    </div>
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-(--text-secondary) transition-transform shrink-0 ${
                    showSoundDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showSoundDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-(--surface) border border-(--border) rounded-lg shadow-xl z-[9999] max-h-60 overflow-hidden">
                  <div className="max-h-56 overflow-y-auto">
                    {soundOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setConsistencyCoach((prev) => ({
                            ...prev,
                            sound: option.value as "beep" | "tick" | "wood",
                          }));
                          setShowSoundDropdown(false);
                        }}
                        className={`w-full text-left p-3 hover:bg-(--surface-elevated) transition-colors border-b border-(--border)/50 last:border-b-0 ${
                          consistencyCoach.sound === option.value
                            ? "bg-(--primary)/20"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <div
                              className={`font-medium text-sm ${
                                consistencyCoach.sound === option.value
                                  ? "text-(--primary)"
                                  : "text-(--text-primary)"
                              }`}
                            >
                              {option.label}
                            </div>
                            <div className="text-xs text-(--text-muted) mt-1">
                              {option.description}
                            </div>
                          </div>
                          {consistencyCoach.sound === option.value && (
                            <Check className="w-4 h-4 text-(--primary) shrink-0 ml-2" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Extended stats visibility */}
        <StatsVisibilitySettings
          visibility={extendedStatsVisibility}
          onToggle={onToggleExtendedStat}
        />
      </div>
    </div>
  );
}