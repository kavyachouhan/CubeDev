"use client";

import { forwardRef } from "react";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "@/lib/cx";

const SIZES = {
  sm: "w-7 h-7 [&_svg]:w-4 [&_svg]:h-4",
  md: "w-9 h-9 [&_svg]:w-5 [&_svg]:h-5",
  lg: "w-11 h-11 [&_svg]:w-5 [&_svg]:h-5",
} as const;

const VARIANTS = {
  ghost: "",
  subtle: "bg-(--surface-elevated) border-(--border)!",
  primary: "text-(--primary)! hover:bg-(--primary)/10!",
  danger: "hover:text-(--error)! hover:bg-(--error)/10!",
} as const;

export interface IconButtonProps
  extends Omit<ComponentProps<"button">, "ref" | "children"> {
  /** Required: icon-only buttons have no visible text. */
  "aria-label": string;
  icon: ReactNode;
  size?: keyof typeof SIZES;
  variant?: keyof typeof VARIANTS;
  /** Marks a toggle's pressed state (e.g. visibility, favorite). */
  pressed?: boolean;
}

/**
 * Square icon button. Visual size stays compact; on touch screens the hit
 * area grows to the 44px minimum via `.icon-btn::before`.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      icon,
      size = "md",
      variant = "ghost",
      pressed,
      className,
      type = "button",
      title,
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        aria-pressed={pressed}
        title={title ?? rest["aria-label"]}
        className={cx(
          "icon-btn",
          SIZES[size],
          VARIANTS[variant],
          pressed && "text-(--primary)!",
          className,
        )}
        {...rest}
      >
        {icon}
      </button>
    );
  },
);
