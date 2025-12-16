"use client";

interface ProgressBarProps {
  label: string;
  value: number;
  total: number;
  color: string;
  showPercentage?: boolean;
  formatValue?: (val: number) => string;
}

export default function ProgressBar({
  label,
  value,
  total,
  color,
  showPercentage = false,
  formatValue = (val) => val.toString(),
}: ProgressBarProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-[var(--text-secondary)]">{label}</span>
        <span className="text-sm font-semibold text-[var(--text-primary)] font-statement">
          {formatValue(value)}
          {showPercentage && ` (${percentage.toFixed(0)}%)`}
        </span>
      </div>
      <div className="h-2 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}