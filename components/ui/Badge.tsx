import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export type BadgeTone =
  | "neutral"
  | "primary"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info";

const SOFT: Record<BadgeTone, string> = {
  neutral: "bg-(--surface-elevated) text-(--text-secondary) border-(--border)",
  primary: "bg-(--primary)/10 text-(--primary) border-(--primary)/25",
  accent: "bg-(--accent)/10 text-(--accent) border-(--accent)/25",
  success: "bg-(--success)/10 text-(--success) border-(--success)/25",
  warning: "bg-(--warning)/10 text-(--warning) border-(--warning)/25",
  danger: "bg-(--error)/10 text-(--error) border-(--error)/25",
  info: "bg-(--info)/10 text-(--info) border-(--info)/25",
};

const SOLID: Record<BadgeTone, string> = {
  neutral: "bg-(--text-muted) text-(--background) border-transparent",
  primary: "bg-(--primary) text-(--on-primary) border-transparent",
  accent: "bg-(--accent) text-(--on-primary) border-transparent",
  success: "bg-(--success) text-(--on-primary) border-transparent",
  warning: "bg-(--warning) text-(--on-primary) border-transparent",
  danger: "bg-(--error) text-(--on-primary) border-transparent",
  info: "bg-(--info) text-(--on-primary) border-transparent",
};

export interface BadgeProps {
  tone?: BadgeTone;
  /** `soft` for status/metadata; `solid` only for small high-emphasis counts. */
  variant?: "soft" | "solid";
  size?: "sm" | "md";
  /** `pill` for counts and tags, `square` (default) for status labels. */
  shape?: "square" | "pill";
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  title?: string;
}

export function Badge({
  tone = "neutral",
  variant = "soft",
  size = "sm",
  shape = "square",
  icon,
  children,
  className,
  title,
}: BadgeProps) {
  return (
    <span
      title={title}
      className={cx(
        "inline-flex items-center gap-1 border font-semibold font-inter whitespace-nowrap leading-none [&_svg]:shrink-0",
        size === "sm"
          ? "h-5 px-1.5 text-[0.6875rem] [&_svg]:w-3 [&_svg]:h-3"
          : "h-6 px-2 text-xs [&_svg]:w-3.5 [&_svg]:h-3.5",
        shape === "pill" ? "rounded-full" : "rounded-(--radius-badge)",
        variant === "solid" ? SOLID[tone] : SOFT[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
