"use client";

import { useState, useEffect } from "react";

export type BadgeVariant = "new" | "beta" | "updated" | "coming-soon";

interface FeatureBadgeProps {
  /** Unique key for localStorage to track dismissal/expiry */
  featureKey: string;
  /** Badge variant determines styling and default text */
  variant?: BadgeVariant;
  /** Custom label text (overrides variant default) */
  label?: string;
  /** Days until the badge auto-hides (default: 14 days) */
  expiryDays?: number;
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
    bgClass: "bg-(--text-muted)/10",
    textClass: "text-(--text-muted)",
    borderClass: "border-(--text-muted)/20",
  },
};

export default function FeatureBadge({
  featureKey,
  variant = "new",
  label,
  expiryDays = 14,
  showWhenCollapsed = true,
  className = "",
}: FeatureBadgeProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);

    if (typeof window === "undefined") return;

    const storageKey = `feature-badge-${featureKey}`;
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
      // If no data, set initial expiry
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
      {displayLabel}
    </span>
  );
}

// Hook to dismiss a feature badge
export function useDismissFeatureBadge() {
  const dismiss = (featureKey: string) => {
    if (typeof window === "undefined") return;

    const storageKey = `feature-badge-${featureKey}`;
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

// Function to reset a feature badge (for testing or re-showing)
export function resetFeatureBadge(featureKey: string, expiryDays: number = 14) {
  if (typeof window === "undefined") return;

  const storageKey = `feature-badge-${featureKey}`;
  const expiresAt = Date.now() + expiryDays * 24 * 60 * 60 * 1000;
  localStorage.setItem(
    storageKey,
    JSON.stringify({ expiresAt, dismissed: false })
  );
}