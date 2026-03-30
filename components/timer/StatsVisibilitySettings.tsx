"use client";

import { useState, useEffect } from "react";
import { Check, ChevronDown, BarChart3 } from "lucide-react";

// Extended stats visibility interface
export interface ExtendedStatsVisibility {
  ao25: boolean;
  ao50: boolean;
  ao100: boolean;
}

// Default visibility settings
export const DEFAULT_EXTENDED_STATS: ExtendedStatsVisibility = {
  ao25: true,
  ao50: true,
  ao100: true,
};

// Custom hook to manage extended stats visibility
export function useExtendedStatsVisibility() {
  const [visibility, setVisibility] = useState<ExtendedStatsVisibility>(() => {
    if (typeof window === "undefined") return DEFAULT_EXTENDED_STATS;
    try {
      const saved = localStorage.getItem("cubelab-extended-stats-visibility");
      return saved ? JSON.parse(saved) : DEFAULT_EXTENDED_STATS;
    } catch {
      return DEFAULT_EXTENDED_STATS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        "cubelab-extended-stats-visibility",
        JSON.stringify(visibility)
      );
    } catch {
      // ignore
    }
  }, [visibility]);

  const toggleStat = (stat: keyof ExtendedStatsVisibility) => {
    setVisibility((prev) => ({
      ...prev,
      [stat]: !prev[stat],
    }));
  };

  return { visibility, setVisibility, toggleStat };
}

// StatsVisibilitySettings component
interface StatsVisibilitySettingsProps {
  visibility: ExtendedStatsVisibility;
  onToggle: (stat: keyof ExtendedStatsVisibility) => void;
}

export default function StatsVisibilitySettings({
  visibility,
  onToggle,
}: StatsVisibilitySettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statOptions: {
    key: keyof ExtendedStatsVisibility;
    label: string;
    description: string;
  }[] = [
    { key: "ao25", label: "Ao25", description: "Average of 25 solves" },
    { key: "ao50", label: "Ao50", description: "Average of 50 solves" },
    { key: "ao100", label: "Ao100", description: "Average of 100 solves" },
  ];

  const activeCount = Object.values(visibility).filter(Boolean).length;

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-(--primary)/20 text-(--primary) rounded-lg flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-medium text-(--text-primary) font-inter">
              Extended Averages
            </span>
            <p className="text-xs text-(--text-muted) font-inter">
              Choose which averages to display
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-(--text-secondary) hover:text-(--primary) hover:bg-(--surface-elevated) rounded-md transition-colors"
        >
          <span>
            {activeCount}/{statOptions.length}
          </span>
          <ChevronDown
            className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Collapsible options */}
      {isExpanded && (
        <div className="ml-11 pl-3 border-l border-(--border) space-y-2">
          {statOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => onToggle(option.key)}
              className={`w-full flex items-center justify-between p-2 rounded-lg border transition-colors ${
                visibility[option.key]
                  ? "bg-(--primary)/10 border-(--primary)/30"
                  : "bg-(--surface-elevated) border-(--border) hover:border-(--primary)/30"
              }`}
            >
              <div className="text-left">
                <div
                  className={`text-sm font-medium ${
                    visibility[option.key]
                      ? "text-(--primary)"
                      : "text-(--text-primary)"
                  }`}
                >
                  {option.label}
                </div>
                <div className="text-xs text-(--text-muted)">
                  {option.description}
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                  visibility[option.key]
                    ? "bg-(--primary) text-white"
                    : "bg-(--border)"
                }`}
              >
                {visibility[option.key] && <Check className="w-3 h-3" />}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}