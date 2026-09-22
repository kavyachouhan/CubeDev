"use client";

import { Volume2, Brain, Zap, Timer, Users } from "lucide-react";
import { Slider } from "@/components/ui/Field";
import { SwitchRow } from "@/components/ui/Switch";
import { AtmosphereSettings } from "./CompetitionDetail";

interface AtmosphereControlsProps {
  atmosphere: AtmosphereSettings;
  onChange: (settings: AtmosphereSettings) => void;
}

export default function AtmosphereControls({
  atmosphere,
  onChange,
}: AtmosphereControlsProps) {
  const updateSetting = <K extends keyof AtmosphereSettings>(
    key: K,
    value: AtmosphereSettings[K]
  ) => {
    onChange({ ...atmosphere, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Crowd Noise */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-(--text-muted)" />
            <span className="text-sm font-medium text-(--text-primary)">
              Crowd Noise
            </span>
          </div>
          <span className="text-sm text-(--text-muted)">
            {atmosphere.crowdNoise}%
          </span>
        </div>
        <Slider
          min={0}
          max={100}
          showValue={false}
          aria-label="Crowd noise"
          value={atmosphere.crowdNoise}
          onChange={(value) => updateSetting("crowdNoise", value)}
        />
        <div className="flex justify-between text-xs text-(--text-muted)">
          <span>Silent</span>
          <span>Moderate</span>
          <span>Loud</span>
        </div>
      </div>

      {/* Competition Pressure */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-(--text-muted)" />
            <span className="text-sm font-medium text-(--text-primary)">
              Competition Pressure
            </span>
          </div>
          <span className="text-sm text-(--text-muted)">
            {atmosphere.pressure}%
          </span>
        </div>
        <Slider
          min={0}
          max={100}
          showValue={false}
          aria-label="Competition pressure"
          value={atmosphere.pressure}
          onChange={(value) => updateSetting("pressure", value)}
        />
        <div className="flex justify-between text-xs text-(--text-muted)">
          <span>Relaxed</span>
          <span>Normal</span>
          <span>Intense</span>
        </div>
        <p className="text-xs text-(--text-muted)">
          Higher pressure adds visual cues and subtle timing variations to
          simulate real competition stress
        </p>
      </div>

      {/* Toggle Options */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SwitchRow
          icon={<Zap />}
          label="Distractions"
          description="Random visual/audio distractions like camera flashes"
          checked={atmosphere.distractions}
          onChange={(value) => updateSetting("distractions", value)}
        />
        <SwitchRow
          icon={<Timer />}
          label="Timer delay"
          description="Slight random delays like real stackmat timers"
          checked={atmosphere.timerDelay}
          onChange={(value) => updateSetting("timerDelay", value)}
        />
        <SwitchRow
          icon={<Users />}
          label="Judge sim"
          description="Confirm results with judge prompts"
          checked={atmosphere.judgeInteractions}
          onChange={(value) => updateSetting("judgeInteractions", value)}
        />
      </div>

      {/* Preset Buttons */}
      <div className="pt-4 border-t border-(--border)">
        <div className="text-xs text-(--text-muted) mb-3">
          Quick Presets
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() =>
              onChange({
                crowdNoise: 10,
                pressure: 20,
                distractions: false,
                timerDelay: false,
                judgeInteractions: false,
              })
            }
            className="px-3 py-1.5 text-sm border border-(--border) text-(--text-secondary) rounded-lg hover:bg-(--surface-elevated)"
          >
            Practice Mode
          </button>
          <button
            onClick={() =>
              onChange({
                crowdNoise: 30,
                pressure: 50,
                distractions: false,
                timerDelay: true,
                judgeInteractions: true,
              })
            }
            className="px-3 py-1.5 text-sm border border-(--border) text-(--text-secondary) rounded-lg hover:bg-(--surface-elevated)"
          >
            Local Comp
          </button>
          <button
            onClick={() =>
              onChange({
                crowdNoise: 60,
                pressure: 75,
                distractions: true,
                timerDelay: true,
                judgeInteractions: true,
              })
            }
            className="px-3 py-1.5 text-sm border border-(--border) text-(--text-secondary) rounded-lg hover:bg-(--surface-elevated)"
          >
            Major Championship
          </button>
          <button
            onClick={() =>
              onChange({
                crowdNoise: 90,
                pressure: 100,
                distractions: true,
                timerDelay: true,
                judgeInteractions: true,
              })
            }
            className="px-3 py-1.5 text-sm border border-(--warning) text-(--warning) rounded-lg hover:bg-(--warning)/10"
          >
            World Finals
          </button>
        </div>
      </div>
    </div>
  );
}