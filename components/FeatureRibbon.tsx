"use client";

import { useState, useEffect } from "react";

export type RibbonVariant = "new" | "beta" | "updated" | "coming-soon";

interface FeatureRibbonProps {
  /** Unique key for localStorage to track dismissal/expiry */
  featureKey: string;
  /** Ribbon variant determines styling and default text */
  variant?: RibbonVariant;
  /** Custom label text (overrides variant default) */
  label?: string;
  /** Days until the ribbon auto-hides (default: 14 days) */
  expiryDays?: number;
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
      label: "Soon",
      bgColor: "var(--text-muted)",
    },
  };

export default function FeatureRibbon({
  featureKey,
  variant = "new",
  label,
  expiryDays = 14,
  position = "top-right",
  size = "sm",
  isActive = false,
}: FeatureRibbonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);

    if (typeof window === "undefined") return;

    const storageKey = `feature-ribbon-${featureKey}`;
    const storedData = localStorage.getItem(storageKey);

    if (storedData) {
      try {
        const { expiresAt, dismissed } = JSON.parse(storedData);

        // Hide if dismissed or expired
        if (dismissed || Date.now() > expiresAt) {
          setIsVisible(false);
          return;
        }
      } catch {
        // If parsing fails, clear the invalid data
        localStorage.removeItem(storageKey);
      }
    } else {
      // First time seeing this ribbon - set expiry
      const expiresAt = Date.now() + expiryDays * 24 * 60 * 60 * 1000;
      localStorage.setItem(
        storageKey,
        JSON.stringify({ expiresAt, dismissed: false })
      );
    }

    setIsVisible(true);
  }, [featureKey, expiryDays]);

  // Do not render until hydrated to avoid SSR mismatch
  if (!isHydrated || !isVisible) return null;

  const config = variantConfig[variant];
  const displayLabel = label || config.label;

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
        {displayLabel}
      </div>
    </div>
  );
}

// Hook to manually dismiss a feature ribbon
export function useDismissFeatureRibbon() {
  const dismiss = (featureKey: string) => {
    if (typeof window === "undefined") return;

    const storageKey = `feature-ribbon-${featureKey}`;
    const storedData = localStorage.getItem(storageKey);

    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        data.dismissed = true;
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ expiresAt: 0, dismissed: true })
        );
      }
    } else {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ expiresAt: 0, dismissed: true })
      );
    }
  };

  return { dismiss };
}

// Function to reset a feature ribbon (for testing or re-showing)
export function resetFeatureRibbon(
  featureKey: string,
  expiryDays: number = 14
) {
  if (typeof window === "undefined") return;

  const storageKey = `feature-ribbon-${featureKey}`;
  const expiresAt = Date.now() + expiryDays * 24 * 60 * 60 * 1000;
  localStorage.setItem(
    storageKey,
    JSON.stringify({ expiresAt, dismissed: false })
  );
}