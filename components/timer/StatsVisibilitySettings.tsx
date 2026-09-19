"use client";

import { useState, useEffect } from "react";
import { ChevronDown, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Field";
import { SettingRow } from "@/components/ui/SettingRow";

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

const STAT_OPTIONS: {
  key: keyof ExtendedStatsVisibility;
  label: string;
  description: string;
}[] = [
  { key: "ao25", label: "Ao25", description: "Average of 25 solves" },
  { key: "ao50", label: "Ao50", description: "Average of 50 solves" },
  { key: "ao100", label: "Ao100", description: "Average of 100 solves" },
];

export default function StatsVisibilitySettings({
  visibility,
  onToggle,
}: StatsVisibilitySettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const activeCount = Object.values(visibility).filter(Boolean).length;

  return (
    <SettingRow
      icon={<BarChart3 />}
      label="Extended Averages"
      description="Choose which averages to display"
      control={
        <Button
          variant="ghost"
          size="sm"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded(!isExpanded)}
          iconRight={
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            />
          }
        >
          {activeCount}/{STAT_OPTIONS.length} shown
        </Button>
      }
    >
      {isExpanded &&
        STAT_OPTIONS.map((option) => (
          <Checkbox
            key={option.key}
            checked={visibility[option.key]}
            onChange={() => onToggle(option.key)}
            label={option.label}
            description={option.description}
          />
        ))}
    </SettingRow>
  );
}