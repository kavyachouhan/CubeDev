"use client";

import { useTheme } from "@/lib/theme-context";
import { cx } from "@/lib/cx";
import { OptionTiles } from "@/components/ui/OptionTiles";

export default function TimerCustomization() {
  const {
    timerFontSize,
    setTimerFontSize,
    timerFontFamily,
    setTimerFontFamily,
    timerUpdateMode,
    setTimerUpdateMode,
  } = useTheme();

  const fontSample = (className: string, selected: boolean) => (
    <span
      className={cx(
        "text-2xl mt-1",
        className,
        selected ? "text-(--primary)" : "text-(--text-primary)",
      )}
    >
      12.34
    </span>
  );

  return (
    <div className="space-y-6">
      <OptionTiles
        legend="Timer Font Size"
        value={timerFontSize}
        onChange={setTimerFontSize}
        columns="grid-cols-2 sm:grid-cols-4"
        align="center"
        options={[
          { value: "sm", label: "Small", description: "2.5rem" },
          { value: "md", label: "Medium", description: "4rem" },
          { value: "lg", label: "Large", description: "6rem" },
          { value: "xl", label: "Extra Large", description: "8rem" },
        ]}
      />

      <OptionTiles
        legend="Timer Font Style"
        value={timerFontFamily}
        onChange={setTimerFontFamily}
        columns="grid-cols-1 sm:grid-cols-3"
        options={[
          {
            value: "mono",
            label: "Monospace",
            preview: fontSample("type-time", timerFontFamily === "mono"),
          },
          {
            value: "sans",
            label: "Sans Serif",
            preview: fontSample("font-inter font-bold", timerFontFamily === "sans"),
          },
          {
            value: "statement",
            label: "Statement",
            preview: fontSample("font-statement", timerFontFamily === "statement"),
          },
        ]}
      />

      <OptionTiles
        legend="Timer Display Mode"
        value={timerUpdateMode}
        onChange={setTimerUpdateMode}
        columns="grid-cols-1 sm:grid-cols-3"
        options={[
          { value: "live", label: "Live", description: "Updates every 10ms" },
          { value: "solving", label: "Solving…", description: "Shows text while solving" },
          { value: "seconds", label: "Seconds Only", description: "Updates every second" },
        ]}
      />
    </div>
  );
}
