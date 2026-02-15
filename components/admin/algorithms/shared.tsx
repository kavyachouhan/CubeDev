"use client";

import { useState, useEffect, ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

// COLLAPSIBLE CARD
interface CollapsibleCardProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  storageKey?: string;
  headerExtra?: ReactNode;
}

export function CollapsibleCard({
  title,
  children,
  defaultOpen = true,
  storageKey,
  headerExtra,
}: CollapsibleCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => {
    if (storageKey) {
      const stored = localStorage.getItem(`collapse-${storageKey}`);
      if (stored !== null) {
        setIsOpen(stored === "true");
      }
    }
  }, [storageKey]);

  const toggle = () => {
    const newValue = !isOpen;
    setIsOpen(newValue);
    if (storageKey) {
      localStorage.setItem(`collapse-${storageKey}`, String(newValue));
    }
  };

  return (
    <div className="timer-card">
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={toggle}
      >
        <h2 className="text-lg font-bold text-(--text-primary) font-statement">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {headerExtra && (
            <div onClick={(e) => e.stopPropagation()}>{headerExtra}</div>
          )}
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-(--text-muted)" />
          ) : (
            <ChevronDown className="w-5 h-5 text-(--text-muted)" />
          )}
        </div>
      </div>
      {isOpen && <div className="mt-4">{children}</div>}
    </div>
  );
}

// STAT CARD
interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  description?: string;
}

export function StatCard({ label, value, icon, description }: StatCardProps) {
  return (
    <div className="p-3 sm:p-4 bg-(--surface-elevated) rounded-lg border border-(--border)">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-(--text-muted) font-inter truncate">
            {label}
          </p>
          <p className="text-lg sm:text-2xl font-bold text-(--text-primary) font-statement mt-1 truncate">
            {value}
          </p>
          {description && (
            <p className="text-xs text-(--text-muted) font-inter mt-1 truncate">
              {description}
            </p>
          )}
        </div>
        {icon && <div className="text-(--primary) shrink-0 ml-2">{icon}</div>}
      </div>
    </div>
  );
}

// BAR CHART
interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  maxValue?: number;
}

export function BarChart({ data, maxValue }: BarChartProps) {
  const max = maxValue || Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={index}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-(--text-muted) font-inter truncate pr-2">
              {item.label}
            </span>
            <span className="text-(--text-primary) font-inter shrink-0">
              {item.value}
            </span>
          </div>
          <div className="h-2 bg-(--surface-elevated) rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(item.value / max) * 100}%`,
                backgroundColor: item.color || "var(--primary)",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// PROGRESS BAR
interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showPercentage?: boolean;
  color?: string;
}

export function ProgressBar({
  value,
  max,
  label,
  showPercentage = true,
  color = "var(--primary)",
}: ProgressBarProps) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      {(label || showPercentage) && (
        <div className="flex justify-between text-xs mb-1">
          {label && (
            <span className="text-(--text-muted) font-inter">{label}</span>
          )}
          {showPercentage && (
            <span className="text-(--text-primary) font-inter">
              {percentage}%
            </span>
          )}
        </div>
      )}
      <div className="h-2 bg-(--surface-elevated) rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// EXPORT UTILITIES
export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers.map((h) => JSON.stringify(row[h] ?? "")).join(","),
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
}

export function exportToJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.json`;
  link.click();
}

// ALGORITHM CATEGORIES
export const ALGORITHM_CATEGORIES = [
  { value: "CFOP", label: "CFOP" },
  { value: "Roux", label: "Roux" },
  { value: "ZZ", label: "ZZ" },
  { value: "2x2", label: "2x2" },
  { value: "Pyraminx", label: "Pyraminx" },
  { value: "Megaminx", label: "Megaminx" },
  { value: "Skewb", label: "Skewb" },
  { value: "Square-1", label: "Square-1" },
  { value: "Other", label: "Other" },
];

export const DIFFICULTY_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export const PUZZLE_TYPES = [
  { value: "3x3x3", label: "3x3x3" },
  { value: "2x2x2", label: "2x2x2" },
  { value: "4x4x4", label: "4x4x4" },
  { value: "Pyraminx", label: "Pyraminx" },
  { value: "Megaminx", label: "Megaminx" },
  { value: "Skewb", label: "Skewb" },
  { value: "Square-1", label: "Square-1" },
  { value: "Other", label: "Other" },
];

// MOVE COUNT UTILITIES
export function calculateMoveCount(notation: string): number {
  if (!notation) return 0;
  // This is a very basic move count that splits on spaces and counts the moves.
  const moves = notation
    .trim()
    .split(/\s+/)
    .filter((m) => m.length > 0);
  return moves.length;
}