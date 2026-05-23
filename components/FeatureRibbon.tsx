"use client";

export type RibbonVariant = "new" | "updated" | "beta" | "coming-soon";

interface FeatureRibbonProps {
  /** Ribbon variant determines styling and default text */
  variant?: RibbonVariant;
  /** Position of the ribbon */
  position?: "top-right" | "top-left";
  /** Size variant */
  size?: "sm" | "md";
  /** Whether ribbon is on an active/selected item */
  isActive?: boolean;
}

const variantConfig: Record<RibbonVariant, { label: string; bgColor: string }> =
  {
    new: {
      label: "New",
      bgColor: "var(--primary)",
    },
    beta: {
      label: "Beta",
      bgColor: "var(--warning)",
    },
    updated: {
      label: "Updated",
      bgColor: "var(--success)",
    },
    "coming-soon": {
      label: "Coming Soon",
      bgColor: "var(--muted)",
    },
  };

export default function FeatureRibbon({
  variant = "new",
  position = "top-right",
  size = "sm",
  isActive = false,
}: FeatureRibbonProps) {
  const config = variantConfig[variant];

  const isTopRight = position === "top-right";
  const sizeClasses =
    size === "sm" ? "text-[9px] py-0.5 w-16" : "text-[10px] py-1 w-20";

  return (
    <div
      className={`
        absolute overflow-hidden pointer-events-none
        ${isTopRight ? "-top-1 -right-3" : "-top-1 -left-3"}
        w-12 h-12
      `}
    >
      <div
        className={`
          absolute font-semibold font-inter uppercase tracking-wider text-center
          ${sizeClasses}
          ${isTopRight ? "rotate-45 origin-center top-2 -right-1" : "-rotate-45 origin-center top-2 -left-1"}
          ${isActive ? "bg-white/90 text-(--primary)" : "text-white"}
        `}
        style={{
          backgroundColor: isActive ? undefined : config.bgColor,
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      >
        {config.label}
      </div>
    </div>
  );
}
