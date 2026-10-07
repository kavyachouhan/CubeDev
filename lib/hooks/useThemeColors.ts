"use client";

import { useEffect, useState } from "react";

const THEME_ATTRIBUTES = [
  "data-theme",
  "data-color-scheme",
  "data-high-contrast",
];

/**
 * Canvas-based chart libraries can't read CSS variables, so this resolves
 * design tokens to concrete color strings and re-resolves them whenever the
 * theme, color scheme or contrast mode changes.
 */
export const CHART_TOKENS = [
  "--primary",
  "--primary-light",
  "--accent",
  "--success",
  "--warning",
  "--error",
  "--info",
  "--text-primary",
  "--text-secondary",
  "--text-muted",
  "--border",
  "--surface",
  "--surface-elevated",
  "--penalty-plus2",
  "--penalty-dnf",
] as const;

export type ChartToken = (typeof CHART_TOKENS)[number];
export type ThemeColors = Record<ChartToken, string>;

const FALLBACK: ThemeColors = {
  "--primary": "#3b82f6",
  "--primary-light": "#60a5fa",
  "--accent": "#06b6d4",
  "--success": "#10b981",
  "--warning": "#f59e0b",
  "--error": "#ef4444",
  "--info": "#3b82f6",
  "--text-primary": "#f8fafc",
  "--text-secondary": "#cbd5e1",
  "--text-muted": "#94a3b8",
  "--border": "#2d3748",
  "--surface": "#1a1a2e",
  "--surface-elevated": "#16213e",
  "--penalty-plus2": "#f59e0b",
  "--penalty-dnf": "#ef4444",
};

function readColors(): ThemeColors {
  const style = getComputedStyle(document.documentElement);
  const colors = { ...FALLBACK };
  for (const token of CHART_TOKENS) {
    const value = style.getPropertyValue(token).trim();
    if (value) colors[token] = value;
  }
  return colors;
}

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: THEME_ATTRIBUTES,
  });
  return () => observer.disconnect();
}

export function useThemeColors(): ThemeColors {
  const [colors, setColors] = useState<ThemeColors>(FALLBACK);

  useEffect(() => {
    const update = () => setColors(readColors());
    update();
    return subscribe(update);
  }, []);

  return colors;
}

/** Resolved `data-theme` value, kept in sync with the <html> attribute. */
export function useEffectiveTheme(): "light" | "dark" {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const update = () =>
      setTheme(
        document.documentElement.getAttribute("data-theme") === "light"
          ? "light"
          : "dark",
      );
    update();
    return subscribe(update);
  }, []);

  return theme;
}

/**
 * Applies an alpha channel to a resolved color. Handles `#rgb`, `#rrggbb`
 * and `rgb()`; anything else falls back to CSS `color-mix`, which modern
 * canvas contexts accept.
 */
export function withAlpha(color: string, alpha: number): string {
  const hex = color.trim();
  if (/^#([0-9a-f]{3}){1,2}$/i.test(hex)) {
    const full =
      hex.length === 4
        ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
        : hex;
    const r = parseInt(full.slice(1, 3), 16);
    const g = parseInt(full.slice(3, 5), 16);
    const b = parseInt(full.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  const rgb = hex.match(/^rgba?\(([^)]+)\)$/i);
  if (rgb) {
    const [r, g, b] = rgb[1].split(",").map((part) => part.trim());
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `color-mix(in srgb, ${color} ${Math.round(alpha * 100)}%, transparent)`;
}
