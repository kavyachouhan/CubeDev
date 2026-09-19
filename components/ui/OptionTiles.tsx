"use client";

import { useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { Check } from "lucide-react";
import { cx } from "@/lib/cx";

export interface OptionTile<T extends string> {
  value: T;
  label: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  /** Custom visual (e.g. a font sample) shown under the label. */
  preview?: ReactNode;
}

export interface OptionTilesProps<T extends string> {
  legend: ReactNode;
  value: T;
  onChange: (value: T) => void;
  options: OptionTile<T>[];
  /** Tailwind grid-cols classes; defaults to 2 → 3 columns. */
  columns?: string;
  /** `center` for short labels with icons, `start` for descriptions. */
  align?: "center" | "start";
  hint?: ReactNode;
  className?: string;
}

/**
 * A radio group rendered as selectable tiles — for choices where a visual
 * preview or description helps (theme mode, timer font, cube view).
 */
export function OptionTiles<T extends string>({
  legend,
  value,
  onChange,
  options,
  columns = "grid-cols-2 sm:grid-cols-3",
  align = "start",
  hint,
  className,
}: OptionTilesProps<T>) {
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
    const next = (index + step + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <fieldset className={className}>
      <legend className="type-label text-(--text-secondary)! mb-3">{legend}</legend>
      <div role="radiogroup" className={cx("grid gap-2 sm:gap-3", columns)}>
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
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(option.value)}
              onKeyDown={(e) => onKeyDown(e, index)}
              className={cx(
                "relative flex flex-col gap-1 p-3 sm:p-4 rounded-(--radius-control) border-2 transition-colors font-inter",
                align === "center" ? "items-center text-center" : "items-start text-left",
                selected
                  ? "border-(--primary) bg-(--primary)/10"
                  : "border-(--border) hover:border-(--border-hover)",
              )}
            >
              {selected && (
                <Check
                  aria-hidden
                  className="absolute top-2 right-2 w-3.5 h-3.5 text-(--primary)"
                  strokeWidth={3}
                />
              )}
              <span
                className={cx(
                  "flex items-center gap-2 text-sm font-medium [&_svg]:w-4 [&_svg]:h-4",
                  align === "center" && "flex-col gap-1.5",
                  selected ? "text-(--primary)" : "text-(--text-secondary)",
                )}
              >
                {option.icon}
                {option.label}
              </span>
              {option.preview}
              {option.description && (
                <span className="type-caption">{option.description}</span>
              )}
            </button>
          );
        })}
      </div>
      {hint && <p className="type-caption mt-3">{hint}</p>}
    </fieldset>
  );
}
