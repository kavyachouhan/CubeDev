"use client";

import { useTheme, ColorScheme } from "@/lib/theme-context";

export default function ColorSchemeSelector() {
  const { colorScheme, setColorScheme } = useTheme();

  const schemes: { value: ColorScheme; label: string; color: string }[] = [
    { value: "blue", label: "Blue", color: "#3b82f6" },
    { value: "purple", label: "Purple", color: "#a855f7" },
    { value: "green", label: "Green", color: "#10b981" },
    { value: "orange", label: "Orange", color: "#f97316" },
    { value: "cyan", label: "Cyan", color: "#06b6d4" },
  ];

  return (
    <div>
      <label className="text-sm font-medium text-[var(--text-secondary)] mb-3 block">
        Color Scheme
      </label>
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {schemes.map((scheme) => (
          <button
            key={scheme.value}
            onClick={() => setColorScheme(scheme.value)}
            className={`
              relative aspect-square rounded-lg border-2 transition-all overflow-hidden
              ${
                colorScheme === scheme.value
                  ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/20"
                  : "border-[var(--border)] hover:border-[var(--border-hover)]"
              }
            `}
            title={scheme.label}
          >
            <div
              className="w-full h-full"
              style={{ backgroundColor: scheme.color }}
            />
            {colorScheme === scheme.value && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-full shadow-lg">
                  <svg
                    className="w-4 h-4 text-gray-900"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
      <p className="text-xs text-[var(--text-muted)] mt-2">
        Selected: {schemes.find((s) => s.value === colorScheme)?.label}
      </p>
    </div>
  );
}