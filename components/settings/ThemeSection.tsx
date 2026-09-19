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
      <div className="space-y-6 divide-y divide-(--border) [&>*:not(:first-child)]:pt-6">
        <ThemeModeSelector />
        <ColorSchemeSelector />
        <TimerCustomization />
        <CubeViewSelector />
        <AccessibilitySettings />
      </div>
    </Card>
  );
}
