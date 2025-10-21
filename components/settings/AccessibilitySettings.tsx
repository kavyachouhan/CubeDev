"use client";

import { Eye, Zap, Contrast } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

export default function AccessibilitySettings() {
  const {
    reduceMotion,
    setReduceMotion,
    disableGlow,
    setDisableGlow,
    highContrast,
    setHighContrast,
  } = useTheme();

  const settings = [
    {
      id: "reduceMotion",
      label: "Reduce Motion",
      description: "Minimize animations and transitions",
      icon: <Zap className="w-5 h-5" />,
      checked: reduceMotion,
      onChange: setReduceMotion,
    },
    {
      id: "disableGlow",
      label: "Disable Glow Effects",
      description: "Remove glowing shadows and effects",
      icon: <Eye className="w-5 h-5" />,
      checked: disableGlow,
      onChange: setDisableGlow,
    },
    {
      id: "highContrast",
      label: "High Contrast",
      description: "Increase contrast for better visibility",
      icon: <Contrast className="w-5 h-5" />,
      checked: highContrast,
      onChange: setHighContrast,
    },
  ];

  return (
    <div>
      <label className="text-sm font-medium text-[var(--text-secondary)] mb-3 block">
        Accessibility & Effects
      </label>
      <div className="space-y-3">
        {settings.map((setting) => (
          <div
            key={setting.id}
            className="flex items-start gap-3 p-4 rounded-lg border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors"
          >
            <div className="text-[var(--primary)] mt-0.5">{setting.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-medium text-[var(--text-primary)]">
                    {setting.label}
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {setting.description}
                  </p>
                </div>
                <button
                  onClick={() => setting.onChange(!setting.checked)}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0
                    ${
                      setting.checked
                        ? "bg-[var(--primary)]"
                        : "bg-[var(--border)]"
                    }
                  `}
                  role="switch"
                  aria-checked={setting.checked}
                  aria-label={setting.label}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${setting.checked ? "translate-x-6" : "translate-x-1"}
                    `}
                  />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}