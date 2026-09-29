"use client";

import { Card, CardHeader } from "@/components/ui/Card";
import ThemeModeSelector from "./ThemeModeSelector";
import ColorSchemeSelector from "./ColorSchemeSelector";
import TimerCustomization from "./TimerCustomization";
import CubeViewSelector from "./CubeViewSelector";
import AccessibilitySettings from "./AccessibilitySettings";

export default function ThemeSection() {
  return (
    <Card variant="static">
      <CardHeader
        title="Theme & Appearance"
        description="Customize your CubeDev experience"
      />
      {/* Spacing alone separates these groups: the divider rules read as
          stray lines under the tile rows rather than as structure. */}
      <div className="space-y-8">
        <ThemeModeSelector />
        <ColorSchemeSelector />
        <TimerCustomization />
        <CubeViewSelector />
        <AccessibilitySettings />
      </div>
    </Card>
  );
}
