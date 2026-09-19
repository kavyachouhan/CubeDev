"use client";

import { Box, Grid3x3 } from "lucide-react";
import { useTheme, CubeViewMode } from "@/lib/theme-context";
import { OptionTiles } from "@/components/ui/OptionTiles";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

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
  /** Renders a small segmented toggle, sized to sit inline in a card header. */
  compact?: boolean;
}

export default function CubeViewSelector({ compact }: CubeViewSelectorProps) {
  const { cubeViewMode, setCubeViewMode } = useTheme();

  if (compact) {
    return (
      <SegmentedControl
        aria-label="Cube view"
        size="sm"
        value={cubeViewMode}
        onChange={setCubeViewMode}
        options={viewModes.map((mode) => ({
          value: mode.value,
          label: mode.value === "3d" ? "3D" : "2D",
        }))}
      />
    );
  }

  return (
    <OptionTiles
      legend="Cube View"
      value={cubeViewMode}
      onChange={setCubeViewMode}
      columns="grid-cols-1 sm:grid-cols-2"
      hint="Applies to scramble previews and algorithm playback across CubeDev."
      options={viewModes.map(({ icon: Icon, ...mode }) => ({
        ...mode,
        icon: <Icon />,
      }))}
    />
  );
}
