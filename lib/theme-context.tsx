"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export type ThemeMode = "light" | "dark" | "auto";
export type ColorScheme = "blue" | "purple" | "green" | "orange" | "cyan";
export type TimerFontSize = "sm" | "md" | "lg" | "xl";
export type TimerFontFamily = "mono" | "sans" | "statement";
export type TimerUpdateMode = "live" | "solving" | "seconds";

interface ThemePreferences {
  themeMode: ThemeMode;
  colorScheme: ColorScheme;
  timerFontSize: TimerFontSize;
  timerFontFamily: TimerFontFamily;
  timerUpdateMode: TimerUpdateMode;
  reduceMotion: boolean;
  disableGlow: boolean;
  highContrast: boolean;
}

interface ThemeContextType extends ThemePreferences {
  effectiveTheme: "light" | "dark";
  setThemeMode: (mode: ThemeMode) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  setTimerFontSize: (size: TimerFontSize) => void;
  setTimerFontFamily: (family: TimerFontFamily) => void;
  setTimerUpdateMode: (mode: TimerUpdateMode) => void;
  setReduceMotion: (enabled: boolean) => void;
  setDisableGlow: (disabled: boolean) => void;
  setHighContrast: (enabled: boolean) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const DEFAULT_PREFERENCES: ThemePreferences = {
  themeMode: "dark",
  colorScheme: "blue",
  timerFontSize: "lg",
  timerFontFamily: "mono",
  timerUpdateMode: "live",
  reduceMotion: false,
  disableGlow: false,
  highContrast: false,
};

export function ThemeProvider({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId?: Id<"users"> | null;
}) {
  const [mounted, setMounted] = useState(false);
  const [localPreferences, setLocalPreferences] =
    useState<ThemePreferences>(DEFAULT_PREFERENCES);
  const [effectiveTheme, setEffectiveTheme] = useState<"light" | "dark">(
    "dark"
  );

  // Fetch user theme preferences from database
  const user = useQuery(
    api.users.getUserById,
    userId ? { id: userId } : "skip"
  );

  const updateTheme = useMutation(api.users.updateThemeSettings);

  // Initialize theme on mount
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("cubedev-theme-preferences");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setLocalPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      } catch (e) {
        console.error("Failed to parse theme preferences:", e);
      }
    }

    // Determine initial effective theme
    const checkSystemPreference = () => {
      if (window.matchMedia) {
        const isDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        return isDark ? "dark" : "light";
      }
      return "dark";
    };

    const updateEffectiveTheme = () => {
      const stored = localStorage.getItem("cubedev-theme-preferences");
      let mode: ThemeMode = "dark";
      if (stored) {
        try {
          mode = JSON.parse(stored).themeMode || "dark";
        } catch (e) {
          mode = "dark";
        }
      }

      if (mode === "auto") {
        setEffectiveTheme(checkSystemPreference());
      } else {
        setEffectiveTheme(mode);
      }
    };

    updateEffectiveTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => updateEffectiveTheme();
    mediaQuery.addEventListener("change", listener);

    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  // Sync with database user preferences
  useEffect(() => {
    if (user) {
      const dbPreferences: Partial<ThemePreferences> = {
        themeMode:
          (user.themeMode as ThemeMode) || DEFAULT_PREFERENCES.themeMode,
        colorScheme:
          (user.colorScheme as ColorScheme) || DEFAULT_PREFERENCES.colorScheme,
        timerFontSize:
          (user.timerFontSize as TimerFontSize) ||
          DEFAULT_PREFERENCES.timerFontSize,
        timerFontFamily:
          (user.timerFontFamily as TimerFontFamily) ||
          DEFAULT_PREFERENCES.timerFontFamily,
        timerUpdateMode:
          (user.timerUpdateMode as TimerUpdateMode) ||
          DEFAULT_PREFERENCES.timerUpdateMode,
        reduceMotion: user.reduceMotion ?? DEFAULT_PREFERENCES.reduceMotion,
        disableGlow: user.disableGlow ?? DEFAULT_PREFERENCES.disableGlow,
        highContrast: user.highContrast ?? DEFAULT_PREFERENCES.highContrast,
      };

      setLocalPreferences({ ...DEFAULT_PREFERENCES, ...dbPreferences });
    }
  }, [user]);

  // Apply theme preferences to document
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    // Apply theme mode
    root.setAttribute("data-theme", effectiveTheme);

    // Apply color scheme
    root.setAttribute("data-color-scheme", localPreferences.colorScheme);

    // Apply timer font size
    root.setAttribute("data-timer-size", localPreferences.timerFontSize);

    // Apply timer font family
    root.setAttribute("data-timer-font", localPreferences.timerFontFamily);

    // Apply accessibility settings
    if (localPreferences.reduceMotion) {
      root.setAttribute("data-reduce-motion", "true");
    } else {
      root.removeAttribute("data-reduce-motion");
    }

    if (localPreferences.disableGlow) {
      root.setAttribute("data-disable-glow", "true");
    } else {
      root.removeAttribute("data-disable-glow");
    }

    if (localPreferences.highContrast) {
      root.setAttribute("data-high-contrast", "true");
    } else {
      root.removeAttribute("data-high-contrast");
    }
  }, [mounted, effectiveTheme, localPreferences]);

  // Update effective theme when theme mode changes
  useEffect(() => {
    if (!mounted) return;

    if (localPreferences.themeMode === "auto") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setEffectiveTheme(isDark ? "dark" : "light");
    } else {
      setEffectiveTheme(localPreferences.themeMode);
    }
  }, [mounted, localPreferences.themeMode]);

  const updatePreference = async (updates: Partial<ThemePreferences>) => {
    const newPreferences = { ...localPreferences, ...updates };
    setLocalPreferences(newPreferences);

    // Save to localStorage
    localStorage.setItem(
      "cubedev-theme-preferences",
      JSON.stringify(newPreferences)
    );

    // Save to database if user is logged in
    if (userId) {
      try {
        await updateTheme({
          userId,
          ...updates,
        });
      } catch (error) {
        console.error("Failed to save theme preferences:", error);
      }
    }
  };

  const contextValue: ThemeContextType = {
    ...localPreferences,
    effectiveTheme,
    setThemeMode: (mode) => updatePreference({ themeMode: mode }),
    setColorScheme: (scheme) => updatePreference({ colorScheme: scheme }),
    setTimerFontSize: (size) => updatePreference({ timerFontSize: size }),
    setTimerFontFamily: (family) =>
      updatePreference({ timerFontFamily: family }),
    setTimerUpdateMode: (mode) => updatePreference({ timerUpdateMode: mode }),
    setReduceMotion: (enabled) => updatePreference({ reduceMotion: enabled }),
    setDisableGlow: (disabled) => updatePreference({ disableGlow: disabled }),
    setHighContrast: (enabled) => updatePreference({ highContrast: enabled }),
    isLoading: !mounted,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}