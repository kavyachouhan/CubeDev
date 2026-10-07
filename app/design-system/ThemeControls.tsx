"use client";

import { useEffect, useState } from "react";
import { COLOR_SCHEMES } from "@/lib/color-schemes";
import { Card, SegmentedControl, SwitchRow } from "@/components/ui";

const TOGGLES = [
  {
    attribute: "data-reduce-motion",
    label: "Reduce motion",
    description: "Dialogs, sheets and collapses appear without animating",
  },
  {
    attribute: "data-high-contrast",
    label: "High contrast",
    description: "Stronger borders and text contrast",
  },
  {
    attribute: "data-disable-glow",
    label: "Disable glow",
    description: "Removes shadows and glow effects",
  },
] as const;

/**
 * Drives the same `<html>` attributes the real theme provider sets, so the
 * gallery can be checked against every combination without signing in.
 */
export function ThemeControls() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [scheme, setScheme] = useState<string>("blue");
  const [flags, setFlags] = useState<Record<string, boolean>>({});

  // Read what the page already has, so the controls start in sync.
  useEffect(() => {
    const root = document.documentElement;
    setTheme(root.getAttribute("data-theme") === "light" ? "light" : "dark");
    setScheme(root.getAttribute("data-color-scheme") ?? "blue");
    setFlags(
      Object.fromEntries(
        TOGGLES.map((t) => [
          t.attribute,
          root.getAttribute(t.attribute) === "true",
        ]),
      ),
    );
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-color-scheme", scheme);
  }, [scheme]);

  const setFlag = (attribute: string, value: boolean) => {
    setFlags((prev) => ({ ...prev, [attribute]: value }));
    document.documentElement.setAttribute(attribute, String(value));
  };

  return (
    <Card variant="static" className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <span className="type-label block mb-2">Theme</span>
          <SegmentedControl<"dark" | "light">
            value={theme}
            onChange={setTheme}
            aria-label="Theme"
            fullWidth
            options={[
              { value: "dark", label: "Dark" },
              { value: "light", label: "Light" },
            ]}
          />
        </div>
        <div>
          <span className="type-label block mb-2">Color scheme</span>
          <div className="flex flex-wrap gap-2">
            {COLOR_SCHEMES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setScheme(option.value)}
                aria-pressed={scheme === option.value}
                className={`flex items-center gap-2 min-h-9 px-3 rounded-(--radius-control) border text-sm font-inter transition-colors ${
                  scheme === option.value
                    ? "border-(--primary) bg-(--primary)/10 text-(--primary)"
                    : "border-(--border) text-(--text-secondary) hover:border-(--border-hover)"
                }`}
              >
                <span
                  aria-hidden
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ background: option.swatch }}
                />
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {TOGGLES.map((toggle) => (
          <SwitchRow
            key={toggle.attribute}
            label={toggle.label}
            description={toggle.description}
            checked={flags[toggle.attribute] ?? false}
            onChange={(value) => setFlag(toggle.attribute, value)}
          />
        ))}
      </div>
    </Card>
  );
}
