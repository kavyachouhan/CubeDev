"use client";

import { Box, Grid3x3 } from "lucide-react";
import { useTheme, CubeViewMode } from "@/lib/theme-context";

const viewModes: {
  value: CubeViewMode;
  label: string;
  description: string;
  icon: typeof Box;
}[] = [
  {
    value: "3d",
    label: "3D Cube",
    description: "Rotatable 3D model",
    icon: Box,
  },
  {
    value: "2d",
    label: "2D Chart",
    description: "Flat unfolded cube net",
    icon: Grid3x3,
  },
];

interface CubeViewSelectorProps {
  /** Renders a pair of small pills, sized to sit inline in a card header. */
  compact?: boolean;
}

export default function CubeViewSelector({ compact }: CubeViewSelectorProps) {
  const { cubeViewMode, setCubeViewMode } = useTheme();

  if (compact) {
    return (
      <div
        className="flex items-center gap-1 p-0.5 rounded-md bg-(--surface-elevated) border border-(--border)"
        role="group"
        aria-label="Cube view"
      >
        {viewModes.map((mode) => (
          <button
            key={mode.value}
            onClick={() => setCubeViewMode(mode.value)}
            aria-pressed={cubeViewMode === mode.value}
            title={mode.description}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              cubeViewMode === mode.value
                ? "bg-(--primary) text-white"
                : "text-(--text-muted) hover:text-(--text-primary)"
            }`}
          >
            {mode.value === "3d" ? "3D" : "2D"}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div>
      <label className="text-sm font-medium text-(--text-secondary) mb-3 block">
        Cube View
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        {viewModes.map((mode) => {
          const Icon = mode.icon;
          const isActive = cubeViewMode === mode.value;
          return (
            <button
              key={mode.value}
              onClick={() => setCubeViewMode(mode.value)}
              aria-pressed={isActive}
              className={`
                p-4 rounded-lg border-2 transition-all text-left
                ${
                  isActive
                    ? "border-(--primary) bg-(--primary)/10"
                    : "border-(--border) hover:border-(--border-hover)"
                }
              `}
            >
              <div
                className={`flex items-center gap-2 text-sm font-medium mb-1 ${
                  isActive ? "text-(--primary)" : "text-(--text-secondary)"
                }`}
              >
                <Icon className="w-4 h-4" />
                {mode.label}
              </div>
              <div className="text-xs text-(--text-muted)">
                {mode.description}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-(--text-muted) mt-3">
        Applies to scramble previews and algorithm playback across CubeDev.
      </p>
    </div>
  );
}
