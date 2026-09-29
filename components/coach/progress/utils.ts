"use client";

import { useState, useEffect } from "react";

// Hook to detect current theme
export function useEffectiveTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const checkTheme = () => {
      const dataTheme = document.documentElement.getAttribute("data-theme");
      setTheme((dataTheme as "light" | "dark") || "dark");
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  return theme;
}

// Hook to get computed primary color for charts (CSS variables don't work in Chart.js)
export function usePrimaryColor() {
  const [primaryColor, setPrimaryColor] = useState("rgba(168, 85, 247, 1)");

  useEffect(() => {
    const getColor = () => {
      if (typeof window === "undefined") return;
      const computed = getComputedStyle(document.documentElement)
        .getPropertyValue("--primary")
        .trim();
      if (computed) {
        setPrimaryColor(computed);
      }
    };

    getColor();

    // Watch for theme changes
    const observer = new MutationObserver(getColor);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "data-color-scheme"],
    });

    return () => observer.disconnect();
  }, []);

  return primaryColor;
}

// Format time from milliseconds
export function formatTime(ms: number): string {
  const seconds = ms / 1000;
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(2);
  return mins > 0 ? `${mins}:${secs.padStart(5, "0")}` : secs;
}

// Format duration in minutes to readable string
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// Get days remaining until target date
export function getDaysRemaining(targetDate: number): number {
  return Math.ceil((targetDate - Date.now()) / (24 * 60 * 60 * 1000));
}

// Calculate progress percentage towards goal using logarithmic scale
// This accounts for non-linear improvement in speedcubing:
// - Improving from 25s to 20s is much easier than 15s to 10s
// - Uses logarithmic scale to reflect the exponentially harder effort required
export function getProgressPercentage(
  currentAvg: number,
  startAvg: number,
  goalTime: number,
): number {
  if (currentAvg <= goalTime) return 100;
  if (currentAvg >= startAvg) return 0;

  // Use logarithmic scale for non-linear progress
  // Log scale better represents the increasing difficulty of improvement
  // as times get faster (each second becomes exponentially harder)
  const logStart = Math.log(startAvg);
  const logGoal = Math.log(goalTime);
  const logCurrent = Math.log(currentAvg);

  const totalLogImprovement = logStart - logGoal;
  const currentLogImprovement = logStart - logCurrent;

  // Calculate percentage based on logarithmic improvement
  const logProgress = (currentLogImprovement / totalLogImprovement) * 100;

  return Math.min(100, Math.max(0, logProgress));
}
