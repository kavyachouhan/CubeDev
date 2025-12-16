"use client";

import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  iconColor: string;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatCard({
  icon: Icon,
  iconColor,
  label,
  value,
  subValue,
  trend,
}: StatCardProps) {
  // Derive background color from iconColor
  const colorParts = iconColor.split(" ");
  const bgColor =
    colorParts.find((c) => c.startsWith("bg-")) || "bg-[var(--primary)]/10";
  const textColor =
    colorParts.find((c) => c.startsWith("text-")) || "text-[var(--primary)]";

  return (
    <div className="timer-card">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className={`w-5 h-5 ${textColor}`} />
        </div>
        {trend && (
          <div
            className={`text-xs font-semibold flex items-center gap-1 ${
              trend.isPositive
                ? "text-green-500 dark:text-green-400"
                : "text-red-500 dark:text-red-400"
            }`}
          >
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-[var(--text-primary)] font-statement mb-1">
        {value}
      </div>
      <div className="text-sm text-[var(--text-muted)]">{label}</div>
      {subValue && (
        <div className="text-xs text-[var(--text-muted)] mt-1">{subValue}</div>
      )}
    </div>
  );
}