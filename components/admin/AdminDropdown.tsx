"use client";

import type { ReactNode } from "react";
import { SelectMenu } from "@/components/ui/Menu";

interface AdminSelectProps<T = string> {
  value: T;
  onChange: (value: T) => void;
  options: Array<{
    value: T;
    label: string;
    description?: string;
    icon?: ReactNode;
    disabled?: boolean;
  }>;
  placeholder?: string;
  className?: string;
  /** Kept for the existing call sites; styling comes from SelectMenu now. */
  buttonClassName?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  compact?: boolean;
  /** Accessible name, and the sheet title on mobile. */
  label?: string;
}

/**
 * Single-select for admin forms, built on the shared SelectMenu. It used to be
 * a 600-line reimplementation with its own portal, positioning and outside-click
 * handling; the props are unchanged so the call sites did not have to move.
 */
export function AdminSelect<T extends string = string>({
  value,
  onChange,
  options,
  placeholder = "Select…",
  className,
  disabled = false,
  fullWidth = true,
  compact = false,
  label,
}: AdminSelectProps<T>) {
  return (
    <SelectMenu<T>
      label={label ?? placeholder}
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      disabled={disabled}
      fullWidth={fullWidth}
      size={compact ? "sm" : "md"}
      className={className}
    />
  );
}
