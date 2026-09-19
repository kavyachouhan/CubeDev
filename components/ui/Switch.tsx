"use client";

import { useId } from "react";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Required when the switch has no visible label (e.g. inside a table). */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  id?: string;
  size?: "sm" | "md";
  className?: string;
}

/** The one on/off control: 44×24 track, 18px thumb, primary when on. */
export function Switch({
  checked,
  onChange,
  disabled,
  size = "md",
  className,
  ...aria
}: SwitchProps) {
  const track = size === "sm" ? "w-9 h-5" : "w-11 h-6";
  const thumb = size === "sm" ? "w-3.5 h-3.5" : "w-[1.125rem] h-[1.125rem]";
  // Track inner width − thumb − 3px end margin, mirroring the 3px start.
  const travel = size === "sm" ? "translate-x-[1.0625rem]" : "translate-x-[1.3125rem]";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        "group relative inline-flex shrink-0 items-center rounded-full border transition-colors duration-(--duration-base)",
        "disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
        "before:absolute before:-inset-2.5 before:content-['']",
        track,
        checked
          ? "bg-(--primary) border-(--primary)"
          : "bg-(--border) border-(--border) hover:enabled:bg-(--border-hover) hover:enabled:border-(--border-hover)",
        className,
      )}
      {...aria}
    >
      <span
        aria-hidden
        className={cx(
          "pointer-events-none inline-block rounded-full bg-white shadow-sm transition-transform duration-(--duration-base) ease-out",
          thumb,
          checked ? travel : "translate-x-0.75",
        )}
      />
    </button>
  );
}

export interface SwitchRowProps
  extends Omit<SwitchProps, "aria-label" | "aria-labelledby" | "aria-describedby"> {
  label: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  /** `card` draws a bordered row, `plain` sits flush inside a list. */
  variant?: "card" | "plain";
}

/** Label + description + switch — the standard settings row. */
export function SwitchRow({
  label,
  description,
  icon,
  variant = "card",
  className,
  ...switchProps
}: SwitchRowProps) {
  const labelId = useId();
  const descriptionId = useId();

  return (
    <div
      className={cx(
        "flex items-center gap-3",
        variant === "card" &&
          "p-4 rounded-(--radius-control) border border-(--border) bg-(--surface) hover:border-(--border-hover) transition-colors",
        variant === "plain" && "py-3",
        switchProps.disabled && "opacity-60",
        className,
      )}
    >
      {icon && (
        <div className="shrink-0 text-(--primary) [&_svg]:w-5 [&_svg]:h-5 self-start mt-0.5">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p id={labelId} className="type-label">
          {label}
        </p>
        {description && (
          <p id={descriptionId} className="type-caption mt-0.5">
            {description}
          </p>
        )}
      </div>
      <Switch
        {...switchProps}
        aria-labelledby={labelId}
        aria-describedby={description ? descriptionId : undefined}
      />
    </div>
  );
}
