"use client";

import { Volume2, VolumeX } from "lucide-react";
import { AtmosphereSettings } from "./CompetitionDetail";

interface SimulationAtmospherePanelProps {
  atmosphere: AtmosphereSettings;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isCompact?: boolean;
}

export default function SimulationAtmospherePanel({
  atmosphere,
  soundEnabled,
  onToggleSound,
  isCompact = false,
}: SimulationAtmospherePanelProps) {
  // Get pressure level text
  const getPressureLevel = () => {
    if (atmosphere.pressure >= 75) return "High";
    if (atmosphere.pressure >= 40) return "Normal";
    return "Relaxed";
  };

  // Get pressure level color
  const getPressureColor = () => {
    if (atmosphere.pressure >= 75) return "text-(--error)";
    if (atmosphere.pressure >= 40) return "text-(--warning)";
    return "text-(--success)";
  };

  if (isCompact) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <button
          onClick={onToggleSound}
          className="p-2 rounded-lg text-(--text-muted) hover:text-(--primary) hover:bg-(--surface-elevated) transition-colors"
          title={soundEnabled ? "Mute sounds" : "Enable sounds"}
        >
          {soundEnabled ? (
            <Volume2 className="w-5 h-5" />
          ) : (
            <VolumeX className="w-5 h-5" />
          )}
        </button>

        {atmosphere.pressure > 50 && (
          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full bg-(--warning)/10 border border-(--warning)/30 ${getPressureColor()}`}
          >
            <span className="text-xs font-medium">
              {getPressureLevel()} Pressure
            </span>
          </div>
        )}

        {atmosphere.distractions && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-(--primary)/10 border border-(--primary)/30 text-(--primary)">
            <span className="text-xs font-medium">Distractions On</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="timer-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-(--text-primary)">
          Atmosphere Settings
        </h3>
        <button
          onClick={onToggleSound}
          className="p-2 rounded-lg text-(--text-muted) hover:text-(--primary) hover:bg-(--surface-elevated) transition-colors"
          title={soundEnabled ? "Mute sounds" : "Enable sounds"}
        >
          {soundEnabled ? (
            <Volume2 className="w-5 h-5" />
          ) : (
            <VolumeX className="w-5 h-5" />
          )}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Crowd Noise */}
        <div className="p-3 rounded-lg bg-(--surface-elevated) border border-(--border)">
          <div className="text-xs text-(--text-muted) mb-1">
            Crowd Noise
          </div>
          <div className="text-sm font-medium text-(--text-primary)">
            {atmosphere.crowdNoise}%
          </div>
        </div>

        {/* Pressure */}
        <div className="p-3 rounded-lg bg-(--surface-elevated) border border-(--border)">
          <div className="text-xs text-(--text-muted) mb-1">Pressure</div>
          <div className={`text-sm font-medium ${getPressureColor()}`}>
            {getPressureLevel()} ({atmosphere.pressure}%)
          </div>
        </div>

        {/* Distractions */}
        <div className="p-3 rounded-lg bg-(--surface-elevated) border border-(--border)">
          <div className="text-xs text-(--text-muted) mb-1">
            Distractions
          </div>
          <div
            className={`text-sm font-medium ${atmosphere.distractions ? "text-(--primary)" : "text-(--text-muted)"}`}
          >
            {atmosphere.distractions ? "Enabled" : "Disabled"}
          </div>
        </div>

        {/* Timer Delay */}
        <div className="p-3 rounded-lg bg-(--surface-elevated) border border-(--border)">
          <div className="text-xs text-(--text-muted) mb-1">
            Timer Delay
          </div>
          <div
            className={`text-sm font-medium ${atmosphere.timerDelay ? "text-(--primary)" : "text-(--text-muted)"}`}
          >
            {atmosphere.timerDelay ? "Realistic" : "Instant"}
          </div>
        </div>
      </div>

      {/* High Pressure Warning */}
      {atmosphere.pressure >= 75 && (
        <div className="mt-4 p-3 rounded-lg bg-(--warning)/10 border border-(--warning)/30">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-(--warning) animate-pulse" />
            <span className="text-sm text-(--warning)">
              High pressure mode active - simulating competition stress
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
