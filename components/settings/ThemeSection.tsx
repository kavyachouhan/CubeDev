"use client";

import ThemeModeSelector from "./ThemeModeSelector";
import ColorSchemeSelector from "./ColorSchemeSelector";
import TimerCustomization from "./TimerCustomization";
import AccessibilitySettings from "./AccessibilitySettings";

export default function ThemeSection() {
  return (
    <div className="timer-card">
      <div className="flex items-center gap-3 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement">
            Theme & Appearance
          </h3>
          <p className="text-sm text-[var(--text-muted)]">
            Customize your CubeDev experience
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <ThemeModeSelector />
        <div className="border-t border-[var(--border)]" />
        <ColorSchemeSelector />
        <div className="border-t border-[var(--border)]" />
        <TimerCustomization />
        <div className="border-t border-[var(--border)]" />
        <AccessibilitySettings />
      </div>
    </div>
  );
}