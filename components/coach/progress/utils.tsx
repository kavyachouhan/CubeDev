"use client";

import { useState, useEffect, ReactNode } from "react";
import { Eye, EyeOff, ChevronDown, ChevronRight } from "lucide-react";

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

// Persistent boolean for show/hide state
export function usePersistentBool(key: string, defaultValue: boolean) {
  const [state, setState] = useState<boolean>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? defaultValue : JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Ignore storage errors
    }
  }, [key, state]);

  return [state, setState] as const;
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

// Collapsible Section Component
interface CollapsibleSectionProps {
  title: string;
  storageKey: string;
  defaultExpanded?: boolean;
  children: ReactNode;
  dataTour?: string;
  headerAction?: ReactNode;
}

export function CollapsibleSection({
  title,
  storageKey,
  defaultExpanded = true,
  children,
  dataTour,
  headerAction,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = usePersistentBool(
    storageKey,
    defaultExpanded,
  );

  return (
    <div className="timer-card" data-tour={dataTour}>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-(--text-muted) hover:text-(--primary) transition-colors"
        >
          <h3 className="text-lg font-semibold text-(--text-primary) font-statement hover:text-(--primary) transition-colors">
            {title}
          </h3>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        <div className="flex items-center gap-2">
          {headerAction}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-(--text-muted) hover:text-(--text-primary) hover:bg-(--surface-elevated) rounded-md transition-colors"
            title={isExpanded ? `Hide ${title}` : `Show ${title}`}
          >
            {isExpanded ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
      {isExpanded && children}
    </div>
  );
}

// Stat Card Component for consistent styling
interface StatCardProps {
  icon: React.ElementType;
  iconColor: string;
  label: string;
  value: string | number;
  valueColor?: string;
  subtitle?: string;
}

export function StatCard({
  icon: Icon,
  iconColor,
  label,
  value,
  valueColor = "text-(--text-primary)",
  subtitle,
}: StatCardProps) {
  return (
    <div className="bg-(--surface-elevated) rounded-lg p-3 border border-(--border)">
      <div className="flex items-center gap-2 mb-1">
        <div className={`p-1 ${iconColor} rounded`}>
          <Icon className="w-3 h-3" />
        </div>
        <span className="text-xs text-(--text-muted) uppercase tracking-wide truncate">
          {label}
        </span>
      </div>
      <div
        className={`text-base sm:text-lg font-bold font-mono ${valueColor} truncate`}
      >
        {value}
      </div>
      {subtitle && (
        <div className="text-xs text-(--text-muted) mt-1 truncate">
          {subtitle}
        </div>
      )}
    </div>
  );
}
