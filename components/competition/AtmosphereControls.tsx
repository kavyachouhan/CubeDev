"use client";

import { Volume2, Brain, Zap, Timer, Users } from "lucide-react";
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
            <Volume2 className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="text-sm font-medium text-[var(--text-primary)]">
              Crowd Noise
            </span>
          </div>
          <span className="text-sm text-[var(--text-muted)]">
            {atmosphere.crowdNoise}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={atmosphere.crowdNoise}
          onChange={(e) =>
            updateSetting("crowdNoise", parseInt(e.target.value))
          }
          className="w-full h-2 bg-[var(--surface-elevated)] rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
        />
        <div className="flex justify-between text-xs text-[var(--text-muted)]">
          <span>Silent</span>
          <span>Moderate</span>
          <span>Loud</span>
        </div>
      </div>

      {/* Competition Pressure */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="text-sm font-medium text-[var(--text-primary)]">
              Competition Pressure
            </span>
          </div>
          <span className="text-sm text-[var(--text-muted)]">
            {atmosphere.pressure}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={atmosphere.pressure}
          onChange={(e) => updateSetting("pressure", parseInt(e.target.value))}
          className="w-full h-2 bg-[var(--surface-elevated)] rounded-lg appearance-none cursor-pointer accent-[var(--warning)]"
        />
        <div className="flex justify-between text-xs text-[var(--text-muted)]">
          <span>Relaxed</span>
          <span>Normal</span>
          <span>Intense</span>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Higher pressure adds visual cues and subtle timing variations to
          simulate real competition stress
        </p>
      </div>

      {/* Toggle Options */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Distractions */}
        <div
          className={`p-4 rounded-lg border cursor-pointer transition-all ${
            atmosphere.distractions
              ? "border-[var(--primary)] bg-[var(--primary)]/10"
              : "border-[var(--border)] hover:border-[var(--primary)]/50"
          }`}
          onClick={() =>
            updateSetting("distractions", !atmosphere.distractions)
          }
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap
              className={`w-4 h-4 ${atmosphere.distractions ? "text-[var(--primary)]" : "text-[var(--text-muted)]"}`}
            />
            <span
              className={`text-sm font-medium ${atmosphere.distractions ? "text-[var(--primary)]" : "text-[var(--text-primary)]"}`}
            >
              Distractions
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Random visual/audio distractions like camera flashes
          </p>
        </div>

        {/* Timer Delay */}
        <div
          className={`p-4 rounded-lg border cursor-pointer transition-all ${
            atmosphere.timerDelay
              ? "border-[var(--primary)] bg-[var(--primary)]/10"
              : "border-[var(--border)] hover:border-[var(--primary)]/50"
          }`}
          onClick={() => updateSetting("timerDelay", !atmosphere.timerDelay)}
        >
          <div className="flex items-center gap-2 mb-2">
            <Timer
              className={`w-4 h-4 ${atmosphere.timerDelay ? "text-[var(--primary)]" : "text-[var(--text-muted)]"}`}
            />
            <span
              className={`text-sm font-medium ${atmosphere.timerDelay ? "text-[var(--primary)]" : "text-[var(--text-primary)]"}`}
            >
              Timer Delay
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Slight random delays like real stackmat timers
          </p>
        </div>

        {/* Judge Interactions */}
        <div
          className={`p-4 rounded-lg border cursor-pointer transition-all ${
            atmosphere.judgeInteractions
              ? "border-[var(--primary)] bg-[var(--primary)]/10"
              : "border-[var(--border)] hover:border-[var(--primary)]/50"
          }`}
          onClick={() =>
            updateSetting("judgeInteractions", !atmosphere.judgeInteractions)
          }
        >
          <div className="flex items-center gap-2 mb-2">
            <Users
              className={`w-4 h-4 ${atmosphere.judgeInteractions ? "text-[var(--primary)]" : "text-[var(--text-muted)]"}`}
            />
            <span
              className={`text-sm font-medium ${atmosphere.judgeInteractions ? "text-[var(--primary)]" : "text-[var(--text-primary)]"}`}
            >
              Judge Sim
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Confirm results with judge prompts
          </p>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="pt-4 border-t border-[var(--border)]">
        <div className="text-xs text-[var(--text-muted)] mb-3">
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
            className="px-3 py-1.5 text-sm border border-[var(--border)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--surface-elevated)]"
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
            className="px-3 py-1.5 text-sm border border-[var(--border)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--surface-elevated)]"
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
            className="px-3 py-1.5 text-sm border border-[var(--border)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--surface-elevated)]"
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
            className="px-3 py-1.5 text-sm border border-[var(--warning)] text-[var(--warning)] rounded-lg hover:bg-[var(--warning)]/10"
          >
            World Finals
          </button>
        </div>
      </div>
    </div>
  );
}