"use client";

import { useTheme, TimerFontSize, TimerFontFamily } from "@/lib/theme-context";

export default function TimerCustomization() {
  const {
    timerFontSize,
    setTimerFontSize,
    timerFontFamily,
    setTimerFontFamily,
  } = useTheme();

  const fontSizes: { value: TimerFontSize; label: string; example: string }[] =
    [
      { value: "sm", label: "Small", example: "2.5rem" },
      { value: "md", label: "Medium", example: "4rem" },
      { value: "lg", label: "Large", example: "6rem" },
      { value: "xl", label: "Extra Large", example: "8rem" },
    ];

  const fontFamilies: {
    value: TimerFontFamily;
    label: string;
    style: string;
  }[] = [
    { value: "mono", label: "Monospace", style: "font-mono" },
    { value: "sans", label: "Sans Serif", style: "font-inter font-bold" },
    { value: "statement", label: "Statement", style: "font-statement" },
  ];

  return (
    <div className="space-y-6">
      {/* Font Size */}
      <div>
        <label className="text-sm font-medium text-[var(--text-secondary)] mb-3 block">
          Timer Font Size
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {fontSizes.map((size) => (
            <button
              key={size.value}
              onClick={() => setTimerFontSize(size.value)}
              className={`
                p-3 rounded-lg border-2 transition-all text-center
                ${
                  timerFontSize === size.value
                    ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                    : "border-[var(--border)] hover:border-[var(--border-hover)] text-[var(--text-secondary)]"
                }
              `}
            >
              <div className="text-xs sm:text-sm font-medium">{size.label}</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">
                {size.example}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Font Family */}
      <div>
        <label className="text-sm font-medium text-[var(--text-secondary)] mb-3 block">
          Timer Font Style
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          {fontFamilies.map((family) => (
            <button
              key={family.value}
              onClick={() => setTimerFontFamily(family.value)}
              className={`
                p-4 rounded-lg border-2 transition-all
                ${
                  timerFontFamily === family.value
                    ? "border-[var(--primary)] bg-[var(--primary)]/10"
                    : "border-[var(--border)] hover:border-[var(--border-hover)]"
                }
              `}
            >
              <div className="text-sm font-medium text-[var(--text-secondary)] mb-2">
                {family.label}
              </div>
              <div
                className={`text-2xl ${family.style} ${
                  timerFontFamily === family.value
                    ? "text-[var(--primary)]"
                    : "text-[var(--text-primary)]"
                }`}
              >
                12.34
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}