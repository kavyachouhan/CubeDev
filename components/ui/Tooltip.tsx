"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  disabled?: boolean;
  side?: "top" | "bottom";
  /** Wrapper element display; `block` for full-width triggers. */
  display?: "inline" | "block";
  className?: string;
}

/**
 * Short supplementary label on hover or keyboard focus. On touch screens a
 * tap shows it briefly. Never put essential information only in a tooltip.
 */
export function Tooltip({
  content,
  children,
  disabled = false,
  side = "top",
  display = "inline",
  className,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const hideTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVisible(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [visible]);

  if (disabled) return <>{children}</>;

  const showBriefly = () => {
    setVisible(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setVisible(false), 2000);
  };

  return (
    <span
      className={cx(
        "relative",
        display === "block" ? "block w-full" : "inline-flex",
        className,
      )}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      onTouchStart={showBriefly}
      aria-describedby={visible ? id : undefined}
    >
      {children}
      {visible && (
        <span
          id={id}
          role="tooltip"
          className={cx(
            "pointer-events-none absolute left-1/2 -translate-x-1/2 z-(--z-dropdown) w-max max-w-[min(16rem,80vw)] px-2.5 py-1.5 rounded-(--radius-control) text-xs font-medium font-inter text-center",
            "bg-(--inverse-surface) text-(--inverse-text) shadow-(--shadow-popover) animate-menu-in",
            side === "top" ? "bottom-full mb-2" : "top-full mt-2",
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
