"use client";

import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export interface SettingRowProps {
  label: ReactNode;
  description?: ReactNode;
  /** Icon shown in a tinted tile on the left. */
  icon?: ReactNode;
  /** The control: a Switch, SelectMenu trigger, Slider, button… */
  control?: ReactNode;
  /** Put the control under the text instead of beside it (wide controls). */
  stacked?: boolean;
  /** `card` draws a bordered row (settings pages); `plain` sits in a list. */
  variant?: "card" | "plain";
  disabled?: boolean;
  /** Why it's disabled — shown under the description. */
  disabledReason?: ReactNode;
  /** Nested options revealed under the row (indented). */
  children?: ReactNode;
  labelId?: string;
  descriptionId?: string;
  className?: string;
}

/** A labelled setting with its control: the building block of every settings panel. */
export function SettingRow({
  label,
  description,
  icon,
  control,
  stacked,
  variant = "plain",
  disabled,
  disabledReason,
  children,
  labelId,
  descriptionId,
  className,
}: SettingRowProps) {
  return (
    <div
      className={cx(
        variant === "card" &&
          "p-4 rounded-(--radius-control) border border-(--border) bg-(--surface) hover:border-(--border-hover) transition-colors",
        className,
      )}
    >
      <div
        className={cx(
          "flex gap-3",
          stacked ? "flex-col" : "items-center",
          disabled && "opacity-55",
        )}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {icon && (
            <span
              aria-hidden
              className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-(--radius-control) bg-(--primary)/12 text-(--primary) text-xs font-bold [&_svg]:w-4 [&_svg]:h-4"
            >
              {icon}
            </span>
          )}
          <div className="min-w-0 flex-1 self-center">
            <p id={labelId} className="type-label">
              {label}
            </p>
            {description && (
              <p id={descriptionId} className="type-caption mt-0.5">
                {description}
              </p>
            )}
            {disabled && disabledReason && (
              <p className="type-caption mt-0.5 text-(--warning)!">{disabledReason}</p>
            )}
          </div>
        </div>
        {control && (
          <div className={cx("shrink-0", stacked && Boolean(icon) && "pl-11")}>{control}</div>
        )}
      </div>
      {children && (
        <div className={cx("mt-3 space-y-3 border-l border-(--border) pl-3", icon ? "ml-4" : "ml-0")}>
          {children}
        </div>
      )}
    </div>
  );
}
