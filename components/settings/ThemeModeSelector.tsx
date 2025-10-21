"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, ThemeMode } from "@/lib/theme-context";

export default function ThemeModeSelector() {
  const { themeMode, setThemeMode } = useTheme();

  const modes: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: "Light", icon: <Sun className="w-4 h-4" /> },
    { value: "dark", label: "Dark", icon: <Moon className="w-4 h-4" /> },
    { value: "auto", label: "Auto", icon: <Monitor className="w-4 h-4" /> },
  ];

  return (
    <div>
      <label className="text-sm font-medium text-[var(--text-secondary)] mb-3 block">
        Theme Mode
      </label>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {modes.map((mode) => (
          <button
            key={mode.value}
            onClick={() => setThemeMode(mode.value)}
            className={`
              flex flex-col items-center gap-2 p-3 sm:p-4 rounded-lg border-2 transition-all
              ${
                themeMode === mode.value
                  ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                  : "border-[var(--border)] hover:border-[var(--border-hover)] text-[var(--text-secondary)]"
              }
            `}
          >
            {mode.icon}
            <span className="text-xs sm:text-sm font-medium">{mode.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}