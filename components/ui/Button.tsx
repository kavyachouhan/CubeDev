"use client";

import Link from "next/link";
import { forwardRef } from "react";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Spinner } from "./Spinner";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "subtle"
  | "ghost"
  | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonStyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}) {
  return cx(
    "btn",
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth && "w-full",
    className,
  );
}

export interface ButtonProps
  extends ButtonStyleProps,
    Omit<ComponentProps<"button">, "ref"> {
  /** Shows a spinner, disables the button and keeps its width. */
  loading?: boolean;
  /** Replaces the label while loading, e.g. "Saving…". */
  loadingText?: string;
}

/**
 * Hierarchy: one `primary` per view or dialog; `secondary` for the
 * alternative (Cancel, Back); `subtle`/`ghost` for low-emphasis tools;
 * `danger` only for the confirming action of a destructive flow.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      fullWidth,
      iconLeft,
      iconRight,
      loading = false,
      loadingText,
      disabled,
      className,
      children,
      type = "button",
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={buttonClasses({ variant, size, fullWidth, className })}
        {...rest}
      >
        {loading ? <Spinner size="sm" /> : iconLeft}
        {loading && loadingText ? loadingText : children}
        {!loading && iconRight}
      </button>
    );
  },
);

export interface ButtonLinkProps
  extends ButtonStyleProps,
    Omit<ComponentProps<typeof Link>, "ref"> {}

/** A link that looks like a button. Use for navigation, never for actions. */
export function ButtonLink({
  variant = "primary",
  size = "md",
  fullWidth,
  iconLeft,
  iconRight,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </Link>
  );
}
