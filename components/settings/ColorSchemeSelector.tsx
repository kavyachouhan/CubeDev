"use client";

import { Check } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { COLOR_SCHEMES } from "@/lib/color-schemes";
import { cx } from "@/lib/cx";

export default function ColorSchemeSelector() {
  const { colorScheme, setColorScheme } = useTheme();
  const selected = COLOR_SCHEMES.find((s) => s.value === colorScheme);

  return (
    <fieldset>
      <legend className="type-label text-(--text-secondary)! mb-3">Color Scheme</legend>
      <div role="radiogroup" aria-label="Color scheme" className="grid grid-cols-5 gap-2 sm:gap-3">
        {COLOR_SCHEMES.map((scheme) => {
          const active = colorScheme === scheme.value;
          return (
            <button
              key={scheme.value}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={scheme.label}
              title={scheme.label}
              onClick={() => setColorScheme(scheme.value)}
              className={cx(
                "relative aspect-square rounded-(--radius-control) border-2 p-1 transition-colors",
                active
                  ? "border-(--primary) ring-2 ring-(--primary)/20"
                  : "border-(--border) hover:border-(--border-hover)",
              )}
            >
              <span
                className="flex w-full h-full items-center justify-center rounded-[0.3125rem]"
                style={{ backgroundColor: scheme.swatch }}
              >
                {active && (
                  <Check className="w-4 h-4 text-white drop-shadow" strokeWidth={3} aria-hidden />
                )}
              </span>
            </button>
          );
        })}
      </div>
      <p className="type-caption mt-2">Selected: {selected?.label}</p>
    </fieldset>
  );
}
