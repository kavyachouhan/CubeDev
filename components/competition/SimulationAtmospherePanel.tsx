"use client";

import { Volume2, VolumeX } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { BadgeTone } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
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

  // Get pressure level tone
  const getPressureTone = (): BadgeTone => {
    if (atmosphere.pressure >= 75) return "danger";
    if (atmosphere.pressure >= 40) return "warning";
    return "success";
  };

  if (isCompact) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <IconButton
          size="sm"
          onClick={onToggleSound}
          aria-label={soundEnabled ? "Mute sounds" : "Enable sounds"}
          icon={soundEnabled ? <Volume2 /> : <VolumeX />}
        />

        {atmosphere.pressure > 50 && (
          <Badge shape="pill" size="md" tone={getPressureTone()}>
            {getPressureLevel()} Pressure
          </Badge>
        )}

        {atmosphere.distractions && (
          <Badge shape="pill" size="md" tone="primary">
            Distractions On
          </Badge>
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
        <IconButton
          size="sm"
          onClick={onToggleSound}
          aria-label={soundEnabled ? "Mute sounds" : "Enable sounds"}
          icon={soundEnabled ? <Volume2 /> : <VolumeX />}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Crowd Noise */}
        <div className="p-3 rounded-(--radius-control) bg-(--surface-elevated) border border-(--border)">
          <div className="text-xs text-(--text-muted) mb-1">
            Crowd Noise
          </div>
          <div className="text-sm font-medium text-(--text-primary)">
            {atmosphere.crowdNoise}%
          </div>
        </div>

        {/* Pressure */}
        <div className="p-3 rounded-(--radius-control) bg-(--surface-elevated) border border-(--border)">
          <div className="text-xs text-(--text-muted) mb-1">Pressure</div>
          <div
            className={`text-sm font-medium ${
              atmosphere.pressure >= 75
                ? "text-(--error)"
                : atmosphere.pressure >= 40
                  ? "text-(--warning)"
                  : "text-(--success)"
            }`}
          >
            {getPressureLevel()} ({atmosphere.pressure}%)
          </div>
        </div>

        {/* Distractions */}
        <div className="p-3 rounded-(--radius-control) bg-(--surface-elevated) border border-(--border)">
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
        <div className="p-3 rounded-(--radius-control) bg-(--surface-elevated) border border-(--border)">
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
        <div className="mt-4 p-3 rounded-(--radius-control) bg-(--warning)/10 border border-(--warning)/30">
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
