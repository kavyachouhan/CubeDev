"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { OptionTiles } from "@/components/ui/OptionTiles";

export default function ThemeModeSelector() {
  const { themeMode, setThemeMode } = useTheme();

  return (
    <OptionTiles
      legend="Theme Mode"
      value={themeMode}
      onChange={setThemeMode}
      columns="grid-cols-3"
      align="center"
      options={[
        { value: "light", label: "Light", icon: <Sun /> },
        { value: "dark", label: "Dark", icon: <Moon /> },
        { value: "auto", label: "Auto", icon: <Monitor /> },
      ]}
    />
  );
}
