import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cx } from "@/lib/cx";

export interface AdminStatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  /** Token-based text color for the icon, e.g. "text-(--success)". */
  iconColor?: string;
  /** Matching tinted background, e.g. "bg-(--success)/10". */
  iconBgColor?: string;
  subValue?: string;
  /** Percentage change; up is treated as good. */
  trend?: { value: number; label: string };
}

/**
 * Compact metric tile for admin dashboards. This is the admin variant of
 * StatTile: it leads with an icon and takes a plain percentage trend.
 */
export function AdminStatCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-(--primary)",
  iconBgColor = "bg-(--primary)/10",
  subValue,
  trend,
}: AdminStatCardProps) {
  const up = (trend?.value ?? 0) >= 0;
  const TrendIcon = up ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="bg-(--surface-elevated) rounded-(--radius-card) p-3 sm:p-4 border border-(--border)">
      <div className="flex items-center gap-2 sm:gap-3">
        <div
          className={cx(
            "p-1.5 sm:p-2 rounded-(--radius-control) shrink-0",
            iconBgColor,
          )}
        >
          <Icon
            className={cx("w-3 h-3 sm:w-4 sm:h-4", iconColor)}
            aria-hidden
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="type-overline truncate">{title}</div>
          <div className="flex items-center gap-2">
            <div className="text-sm sm:text-lg font-bold text-(--text-primary) font-statement">
              {typeof value === "number" ? value.toLocaleString() : value}
            </div>
            {trend && (
              <div
                className={cx(
                  "flex items-center gap-0.5 text-xs font-medium",
                  up ? "text-(--success)" : "text-(--error)",
                )}
                title={trend.label}
              >
                <TrendIcon className="w-3 h-3" aria-hidden />
                <span>{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>
          {subValue && <div className="type-caption">{subValue}</div>}
        </div>
      </div>
    </div>
  );
}
