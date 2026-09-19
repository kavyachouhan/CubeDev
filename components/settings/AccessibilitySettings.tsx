"use client";

import { Contrast, Eye, Zap } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { SwitchRow } from "@/components/ui/Switch";

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
      icon: <Zap />,
      checked: reduceMotion,
      onChange: setReduceMotion,
    },
    {
      id: "disableGlow",
      label: "Disable Glow Effects",
      description: "Remove glowing shadows and effects",
      icon: <Eye />,
      checked: disableGlow,
      onChange: setDisableGlow,
    },
    {
      id: "highContrast",
      label: "High Contrast",
      description: "Increase contrast for better visibility",
      icon: <Contrast />,
      checked: highContrast,
      onChange: setHighContrast,
    },
  ];

  return (
    <fieldset>
      <legend className="type-label text-(--text-secondary)! mb-3">
        Accessibility & Effects
      </legend>
      <div className="space-y-3">
        {settings.map((setting) => (
          <SwitchRow
            key={setting.id}
            icon={setting.icon}
            label={setting.label}
            description={setting.description}
            checked={setting.checked}
            onChange={setting.onChange}
          />
        ))}
      </div>
    </fieldset>
  );
}
