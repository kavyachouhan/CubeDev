"use client";

import type { ReactNode } from "react";
import { CollapsibleCard, useCollapsed } from "@/components/ui/Card";

export interface AdminCollapsibleCardProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  /** localStorage key; omit for a panel that always starts at `defaultOpen`. */
  storageKey?: string;
  /** Controls beside the collapse toggle, e.g. a range selector. */
  headerExtra?: ReactNode;
  className?: string;
}

/**
 * Admin panel: the shared CollapsibleCard with its open state remembered per
 * viewer. Every admin screen used to carry its own copy of this.
 */
export function AdminCollapsibleCard({
  title,
  children,
  defaultOpen = true,
  storageKey,
  headerExtra,
  className,
}: AdminCollapsibleCardProps) {
  const { open, onOpenChange } = useCollapsed(storageKey, defaultOpen);

  return (
    <CollapsibleCard
      title={title}
      open={open}
      onOpenChange={onOpenChange}
      actions={headerExtra}
      className={className}
    >
      {children}
    </CollapsibleCard>
  );
}
