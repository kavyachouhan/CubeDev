"use client";

import { useCallback, useEffect, useState } from "react";

/** Panels the compact layout lets you turn off. The timer, the scramble and the
 * event/session controls are not negotiable, so they are not listed here. */
export type CompactPanel =
  | "scramblePreview"
  | "stats"
  | "history"
  | "scrambleNav"
  | "hints";

export type CompactPanelVisibility = Record<CompactPanel, boolean>;

const STORAGE_KEY = "cubedev-timer-compact-panels";

/** Desktop has room for the preview beside the timer. */
const DESKTOP_DEFAULTS: CompactPanelVisibility = {
  scramblePreview: true,
  stats: true,
  history: true,
  scrambleNav: true,
  hints: true,
};

/**
 * Phones do not: a preview costs roughly a third of the timer's height, and the
 * 3D player is the slowest thing on the page. It stays one tap away instead.
 */
const MOBILE_DEFAULTS: CompactPanelVisibility = {
  ...DESKTOP_DEFAULTS,
  scramblePreview: false,
};

export const COMPACT_PANEL_LABELS: Record<CompactPanel, string> = {
  scramblePreview: "Scramble preview",
  stats: "Statistics",
  history: "Recent times",
  scrambleNav: "Scramble controls",
  hints: "Timer hints",
};

/**
 * Which compact panels are shown, per device.
 *
 * Stored as a partial object merged over the breakpoint defaults, so adding a
 * panel later needs no migration. Deliberately local-only: hiding the preview
 * on a phone should not hide it on a desktop.
 */
export function useCompactPanels(isDesktop: boolean) {
  const defaults = isDesktop ? DESKTOP_DEFAULTS : MOBILE_DEFAULTS;
  const [overrides, setOverrides] = useState<Partial<CompactPanelVisibility>>(
    {},
  );

  // Read after mount so server and client markup agree.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setOverrides(JSON.parse(raw));
    } catch {
      // Remembering the layout is a convenience, not a requirement.
    }
  }, []);

  const persist = useCallback((next: Partial<CompactPanelVisibility>) => {
    setOverrides(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore: the choice still applies for this session.
    }
  }, []);

  const toggle = useCallback(
    (panel: CompactPanel) => {
      setOverrides((prev) => {
        const current = prev[panel] ?? defaults[panel];
        const next = { ...prev, [panel]: !current };
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Ignore: the choice still applies for this session.
        }
        return next;
      });
    },
    [defaults],
  );

  const reset = useCallback(() => persist({}), [persist]);

  const panels = { ...defaults, ...overrides } as CompactPanelVisibility;

  return { panels, toggle, reset };
}
