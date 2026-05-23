"use client";

export type BadgeVariant = "new" | "updated" | "beta" | "coming-soon";

interface FeatureBadgeProps {
  /** Badge variant determines styling and default text */
  variant?: BadgeVariant;
  /** Whether to show in collapsed sidebar mode */
  showWhenCollapsed?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const variantConfig: Record<
  BadgeVariant,
  { label: string; bgClass: string; textClass: string; borderClass: string }
> = {
  new: {
    label: "New",
    bgClass: "bg-(--primary)/15",
    textClass: "text-(--primary)",
    borderClass: "border-(--primary)/30",
  },
  beta: {
    label: "Beta",
    bgClass: "bg-(--warning)/10",
    textClass: "text-(--warning)",
    borderClass: "border-(--warning)/20",
  },
  updated: {
    label: "Updated",
    bgClass: "bg-(--success)/15",
    textClass: "text-(--success)",
    borderClass: "border-(--success)/30",
  },
  "coming-soon": {
    label: "Soon",
    bgClass: "bg-(--muted)/10",
    textClass: "text-(--muted)",
    borderClass: "border-(--muted)/20",
  },
};

export default function FeatureBadge({
  variant = "new",
  showWhenCollapsed = true,
  className = "",
}: FeatureBadgeProps) {
  const config = variantConfig[variant] ?? variantConfig.new;

  return (
    <span
      className={`
        inline-flex items-center justify-center
        px-1.5 py-0.5
        text-[10px] font-semibold font-inter uppercase tracking-wide
        ${config.bgClass} ${config.textClass} ${config.borderClass}
        border rounded
        whitespace-nowrap
        ${showWhenCollapsed ? "" : "hidden lg:inline-flex"}
        ${className}
      `.trim()}
    >
      {config.label}
    </span>
  );
}
