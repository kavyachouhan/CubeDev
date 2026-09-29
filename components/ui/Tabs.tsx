"use client";

import { useId, useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { cx } from "@/lib/cx";

export interface TabItem<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  /** Small count or status shown after the label. */
  badge?: ReactNode;
  disabled?: boolean;
  /** Extra attributes for this tab button, e.g. `data-tour`. */
  rootProps?: Record<`data-${string}`, string>;
}

export interface TabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  items: TabItem<T>[];
  "aria-label": string;
  className?: string;
  /** Stretch tabs to fill the row (good for 2–3 tabs on mobile). */
  fullWidth?: boolean;
}

/** Stable ids so a panel can reference its tab: `<div {...tabPanelProps(id, value)}>` */
export function tabIds(baseId: string, value: string) {
  return { tab: `${baseId}-tab-${value}`, panel: `${baseId}-panel-${value}` };
}

export function tabPanelProps(baseId: string, value: string) {
  const ids = tabIds(baseId, value);
  return {
    id: ids.panel,
    role: "tabpanel" as const,
    "aria-labelledby": ids.tab,
    tabIndex: 0,
  };
}

/**
 * Underline tabs for switching between views of the same page. The tab row
 * scrolls horizontally on narrow screens instead of wrapping.
 * Pass `id` via `useTabsId()` if panels need `tabPanelProps`.
 */
export function Tabs<T extends string>({
  value,
  onChange,
  items,
  className,
  fullWidth,
  id,
  ...aria
}: TabsProps<T> & { id?: string }) {
  const generatedId = useId();
  const baseId = id ?? generatedId;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    let next = -1;
    if (event.key === "ArrowRight") next = index + 1;
    else if (event.key === "ArrowLeft") next = index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;
    else return;
    event.preventDefault();
    next = (next + items.length) % items.length;
    let guard = items.length;
    while (items[next].disabled && guard--) {
      next = (next + (event.key === "ArrowLeft" ? -1 : 1) + items.length) % items.length;
    }
    onChange(items[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="tablist"
      className={cx(
        "flex gap-1 border-b border-(--border) overflow-x-auto scrollbar-hide",
        className,
      )}
      {...aria}
    >
      {items.map((item, index) => {
        const selected = item.value === value;
        const ids = tabIds(baseId, item.value);
        return (
          <button
            key={item.value}
            {...item.rootProps}
            ref={(el) => {
              refs.current[index] = el;
            }}
            id={ids.tab}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={ids.panel}
            tabIndex={selected ? 0 : -1}
            disabled={item.disabled}
            onClick={() => onChange(item.value)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={cx(
              "relative -mb-px inline-flex items-center justify-center gap-2 px-3 sm:px-4 min-h-11 text-sm font-medium font-inter whitespace-nowrap border-b-2 transition-colors duration-(--duration-fast)",
              "disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:w-4 [&_svg]:h-4",
              fullWidth && "flex-1",
              selected
                ? "border-(--primary) text-(--primary)"
                : "border-transparent text-(--text-secondary) hover:enabled:text-(--text-primary) hover:enabled:border-(--border-hover)",
            )}
          >
            {item.icon}
            {item.label}
            {item.badge != null && (
              <span
                className={cx(
                  "min-w-5 h-5 px-1.5 inline-flex items-center justify-center rounded-full text-[0.6875rem] font-semibold",
                  selected
                    ? "bg-(--primary)/15 text-(--primary)"
                    : "bg-(--surface-elevated) text-(--text-muted)",
                )}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
