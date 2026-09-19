"use client";

import { useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { cx } from "@/lib/cx";

export type SegmentTone = "primary" | "warning" | "error" | "success";

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  /** Color when selected. Defaults to primary. */
  tone?: SegmentTone;
  disabled?: boolean;
  /** Accessible name when the label is an icon only. */
  "aria-label"?: string;
}

const TONE: Record<SegmentTone, string> = {
  primary: "bg-(--primary) text-(--on-primary)",
  warning: "bg-(--penalty-plus2) text-white",
  error: "bg-(--penalty-dnf) text-white",
  success: "bg-(--success) text-white",
};

export interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentOption<T>[];
  "aria-label": string;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  className?: string;
}

/**
 * Mutually exclusive choice among 2–5 short options (a radio group).
 * Arrow keys move and select, matching native radio behavior.
 */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  size = "md",
  fullWidth,
  className,
  ...aria
}: SegmentedControlProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const step =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    if (!step) return;
    event.preventDefault();
    for (let i = 1; i <= options.length; i++) {
      const next = (index + step * i + options.length) % options.length;
      if (!options[next].disabled) {
        onChange(options[next].value);
        refs.current[next]?.focus();
        return;
      }
    }
  };

  const height =
    size === "sm" ? "min-h-7 text-xs" : size === "lg" ? "min-h-10 text-sm" : "min-h-8 text-sm";

  return (
    <div
      role="radiogroup"
      className={cx(
        "inline-flex gap-1 p-1 rounded-(--radius-control) bg-(--surface-elevated) border border-(--border)",
        fullWidth && "flex w-full",
        className,
      )}
      {...aria}
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option["aria-label"]}
            tabIndex={selected ? 0 : -1}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={cx(
              "inline-flex items-center justify-center gap-1.5 px-3 rounded-[0.375rem] font-medium font-inter whitespace-nowrap transition-colors duration-(--duration-fast)",
              "disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:w-4 [&_svg]:h-4",
              height,
              fullWidth && "flex-1",
              selected
                ? cx(TONE[option.tone ?? "primary"], "shadow-sm")
                : "text-(--text-secondary) hover:enabled:text-(--text-primary) hover:enabled:bg-(--surface)",
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
