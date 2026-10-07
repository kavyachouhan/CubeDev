"use client";

import { Edit3, Eye, Mic, Timer, Volume2, VolumeX, Zap } from "lucide-react";
import {
  SPLIT_METHODS,
  ConsistencyCoachSettings,
} from "@/lib/phase-splits";
import { Slider } from "@/components/ui/Field";
import { SelectMenu } from "@/components/ui/Menu";
import { SettingRow } from "@/components/ui/SettingRow";
import { SwitchRow } from "@/components/ui/Switch";
import StatsVisibilitySettings, {
  ExtendedStatsVisibility,
} from "./StatsVisibilitySettings";

export type TimerMode = "normal" | "manual" | "stackmat";

export interface TimerSettingsPanelProps {
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

const TIMER_MODE_OPTIONS = [
  {
    value: "normal" as const,
    label: "Normal Timer",
    description: "Traditional spacebar timer",
    icon: <Timer />,
  },
  {
    value: "manual" as const,
    label: "Manual Entry",
    description: "Enter times manually",
    icon: <Edit3 />,
  },
  {
    value: "stackmat" as const,
    label: "Stackmat Timer",
    description: "Connect via microphone",
    icon: <Mic />,
  },
];

const SOUND_OPTIONS = [
  { value: "beep" as const, label: "Beep", description: "Classic electronic beep" },
  { value: "tick" as const, label: "Tick", description: "Metronome-style tick" },
  { value: "wood" as const, label: "Wood", description: "Warm wooden click" },
];

export function TimerSettingsPanel({
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
}: TimerSettingsPanelProps) {
  const splitsAvailable = timerMode === "normal";
  const coachAvailable = timerMode !== "manual";

  return (
    <div className="space-y-5">
      <SettingRow
        icon={<Timer />}
        label="Timer Mode"
        description="Choose how you want to time your solves"
        stacked
        control={
          <SelectMenu
            label="Timer mode"
            value={timerMode}
            onChange={setTimerMode}
            options={TIMER_MODE_OPTIONS}
          />
        }
      />

      <SwitchRow
        variant="plain"
        icon={<span>15</span>}
        label="Inspection Time"
        description="15-second inspection before solving"
        checked={inspectionEnabled}
        onChange={setInspectionEnabled}
      />

      <SwitchRow
        variant="plain"
        icon={<Eye />}
        label="Focus Mode"
        description="Blur other areas during solve"
        checked={focusModeEnabled}
        onChange={setFocusModeEnabled}
      />

      <SwitchRow
        variant="plain"
        icon={<VolumeX />}
        label="Mute PB Sound"
        description="Silence sound when achieving a personal best"
        checked={mutePbSound}
        onChange={setMutePbSound}
      />

      <SwitchRow
        variant="plain"
        icon={<Zap />}
        label="Phase Split Timer"
        description="Track solve phases with spacebar presses"
        checked={phaseSplitsEnabled}
        onChange={setPhaseSplitsEnabled}
        disabled={!splitsAvailable}
        disabledReason="Only available in Normal timer mode"
      >
        {phaseSplitsEnabled && splitsAvailable && (
          <SettingRow
            label="Split Method"
            stacked
            control={
              <SelectMenu
                label="Split method"
                value={selectedSplitMethod}
                onChange={setSelectedSplitMethod}
                placeholder="Choose a splitting method"
                options={SPLIT_METHODS.map((method) => ({
                  value: method.id,
                  label: method.name,
                  description: `${method.description} · ${method.phases.length} phases`,
                }))}
              />
            }
          />
        )}
      </SwitchRow>

      <SwitchRow
        variant="plain"
        icon={<Volume2 />}
        label="Consistency Coach"
        description="Soft metronome for pacing practice"
        checked={consistencyCoach.enabled}
        onChange={(enabled) =>
          setConsistencyCoach((prev) => ({ ...prev, enabled }))
        }
        disabled={!coachAvailable}
        disabledReason="Only available in Normal and Stackmat timer modes"
      >
        {consistencyCoach.enabled && coachAvailable && (
          <>
            <SettingRow
              label="BPM"
              control={
                <Slider
                  aria-label="Metronome beats per minute"
                  min={60}
                  max={180}
                  value={consistencyCoach.bpm}
                  onChange={(bpm) => setConsistencyCoach((prev) => ({ ...prev, bpm }))}
                  className="w-40"
                />
              }
            />
            <SettingRow
              label="Volume"
              control={
                <Slider
                  aria-label="Metronome volume"
                  min={10}
                  max={100}
                  value={consistencyCoach.volume}
                  onChange={(volume) =>
                    setConsistencyCoach((prev) => ({ ...prev, volume }))
                  }
                  className="w-40"
                />
              }
            />
            <SettingRow
              label="Sound"
              stacked
              control={
                <SelectMenu
                  label="Metronome sound"
                  value={consistencyCoach.sound}
                  onChange={(sound) =>
                    setConsistencyCoach((prev) => ({ ...prev, sound }))
                  }
                  options={SOUND_OPTIONS.map((option) => ({
                    ...option,
                    icon: <Volume2 />,
                  }))}
                />
              }
            />
          </>
        )}
      </SwitchRow>

      <StatsVisibilitySettings
        visibility={extendedStatsVisibility}
        onToggle={onToggleExtendedStat}
      />
    </div>
  );
}

export default TimerSettingsPanel;
