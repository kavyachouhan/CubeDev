"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
} from "lucide-react";
import { cx } from "@/lib/cx";
import { Button } from "./Button";
import { IconButton } from "./IconButton";
import { Popover } from "./Menu";
import type { Placement } from "./overlay";

export type DateTimeMode = "date" | "time" | "datetime";

/* ------------------------------------------------------------------------ */
/* Value adapters                                                           */
/* ------------------------------------------------------------------------ */

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Epoch ms to a YYYY-MM-DD string, in the viewer's own timezone. */
export function toDateInputValue(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || Number.isNaN(ms)) return "";
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** YYYY-MM-DD to epoch ms at local midnight, or null for an empty string. */
export function fromDateInputValue(value: string): number | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d).getTime();
}

/** Epoch ms to an HH:mm string. */
export function toTimeInputValue(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || Number.isNaN(ms)) return "";
  const d = new Date(ms);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** HH:mm to epoch ms on `base` (today by default), or null when empty. */
export function fromTimeInputValue(
  value: string,
  base?: number,
): number | null {
  if (!value) return null;
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const d = base === undefined ? new Date() : new Date(base);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

/** Epoch ms to the YYYY-MM-DDTHH:mm string a datetime-local input holds. */
export function toDateTimeInputValue(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || Number.isNaN(ms)) return "";
  return `${toDateInputValue(ms)}T${toTimeInputValue(ms)}`;
}

/** YYYY-MM-DDTHH:mm to epoch ms, or null when empty or unparseable. */
export function fromDateTimeInputValue(value: string): number | null {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

/* ------------------------------------------------------------------------ */
/* Formatting                                                               */
/* ------------------------------------------------------------------------ */

const DATE_FORMAT = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
});
const TIME_FORMAT = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});
const MONTH_FORMAT = new Intl.DateTimeFormat(undefined, {
  month: "long",
  year: "numeric",
});
const FULL_DAY_FORMAT = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

function formatValue(ms: number, mode: DateTimeMode) {
  const d = new Date(ms);
  if (mode === "date") return DATE_FORMAT.format(d);
  if (mode === "time") return TIME_FORMAT.format(d);
  return `${DATE_FORMAT.format(d)}, ${TIME_FORMAT.format(d)}`;
}

/* ------------------------------------------------------------------------ */
/* Component                                                                */
/* ------------------------------------------------------------------------ */

export interface DateTimePickerProps {
  /** Which columns the panel shows, and how the trigger reads the value. */
  mode: DateTimeMode;
  /** Epoch milliseconds. `null` means nothing chosen yet. */
  value: number | null;
  onChange: (value: number | null) => void;
  /** Earliest / latest selectable instant, also epoch ms. */
  min?: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  placeholder?: string;
  /** Adds a clear button to the footer. */
  clearable?: boolean;
  disabled?: boolean;
  /** Minutes between the options in the minute column. */
  minuteStep?: number;
  /** Accessible name. Falls back to a mode-appropriate default. */
  label?: string;
  fullWidth?: boolean;
  placement?: Placement;
  className?: string;
  /* Injected by `Field`. */
  id?: string;
  required?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

/**
 * The CubeDev date / time / date-and-time picker, replacing the native browser
 * pickers — those ignore the theme and look different on every platform.
 *
 * The value is always epoch milliseconds; the adapters exported alongside
 * convert at the boundary for call sites that store `YYYY-MM-DD` strings.
 * Below 640px the panel opens as a bottom sheet (handled by `Popover`).
 */
export function DateTimePicker({
  mode,
  value,
  onChange,
  min,
  max,
  size = "md",
  placeholder,
  clearable = true,
  disabled,
  minuteStep = 5,
  label,
  fullWidth = true,
  placement = "bottom-start",
  className,
  id,
  required,
  "aria-invalid": ariaInvalid,
  "aria-describedby": describedBy,
}: DateTimePickerProps) {
  const name =
    label ??
    (mode === "date"
      ? "Choose a date"
      : mode === "time"
        ? "Choose a time"
        : "Choose a date and time");
  const hint =
    placeholder ??
    (mode === "date"
      ? "Select a date"
      : mode === "time"
        ? "Select a time"
        : "Select a date and time");

  return (
    <Popover
      title={name}
      placement={placement}
      // Time-only gets a fixed width its dials fill; the calendar sizes itself.
      className={cx(
        "max-w-[min(36rem,calc(100vw-1rem))]",
        mode === "time" ? "w-72" : "w-auto",
      )}
      trigger={(props) => (
        <button
          {...props}
          id={id}
          type="button"
          disabled={disabled}
          aria-label={value === null ? name : undefined}
          aria-required={required}
          aria-invalid={ariaInvalid}
          aria-describedby={describedBy}
          className={cx(
            "input flex items-center gap-2 text-left",
            size === "sm" && "input-sm",
            size === "lg" && "input-lg",
            fullWidth ? "w-full" : "w-auto",
            props["aria-expanded"] && "border-(--primary)",
            className,
          )}
        >
          <span className="shrink-0 text-(--text-muted)">
            {mode === "time" ? (
              <Clock aria-hidden className="w-4 h-4" />
            ) : (
              <CalendarDays aria-hidden className="w-4 h-4" />
            )}
          </span>
          <span
            className={cx(
              "flex-1 min-w-0 truncate",
              value === null && "text-(--text-muted)",
            )}
          >
            {value === null ? hint : formatValue(value, mode)}
          </span>
        </button>
      )}
    >
      {(close) => (
        <PickerPanel
          mode={mode}
          value={value}
          onChange={onChange}
          onClose={close}
          min={min}
          max={max}
          minuteStep={minuteStep}
          clearable={clearable}
        />
      )}
    </Popover>
  );
}

/* ------------------------------------------------------------------------ */
/* Panel                                                                    */
/* ------------------------------------------------------------------------ */

interface PanelProps {
  mode: DateTimeMode;
  value: number | null;
  onChange: (value: number | null) => void;
  onClose: () => void;
  min?: number;
  max?: number;
  minuteStep: number;
  clearable: boolean;
}

function PickerPanel({
  mode,
  value,
  onChange,
  onClose,
  min,
  max,
  minuteStep,
  clearable,
}: PanelProps) {
  const showDate = mode !== "time";
  const showTime = mode !== "date";
  const selected = value === null ? null : new Date(value);
  const [cursor, setCursor] = useState<Date>(() => selected ?? new Date());
  const [month, setMonth] = useState<Date>(() =>
    startOfMonth(selected ?? new Date()),
  );
  const gridRef = useRef<HTMLDivElement>(null);
  const focusPending = useRef(false);

  // Arrow keys move a roving cursor; focus follows it so the day under the
  // keys is the one a screen reader announces.
  useEffect(() => {
    if (!focusPending.current) return;
    focusPending.current = false;
    gridRef.current
      ?.querySelector<HTMLElement>('[data-day][tabindex="0"]')
      ?.focus();
  }, [cursor]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start, end });
  }, [month]);

  const weekdayLabels = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(undefined, { weekday: "short" });
    const start = startOfWeek(new Date());
    return Array.from({ length: 7 }, (_, i) => fmt.format(addDays(start, i)));
  }, []);

  const outOfRange = (d: Date) => {
    const day = startOfDay(d).getTime();
    if (min !== undefined && day < startOfDay(new Date(min)).getTime())
      return true;
    if (max !== undefined && day > startOfDay(new Date(max)).getTime())
      return true;
    return false;
  };

  const commit = (next: Date) => {
    let ms = next.getTime();
    if (min !== undefined && ms < min) ms = min;
    if (max !== undefined && ms > max) ms = max;
    onChange(ms);
  };

  /** Keeps the time part when only the date changes, and vice versa. */
  const pickDay = (day: Date) => {
    const base = selected ?? new Date();
    const next = new Date(day);
    if (showTime) next.setHours(base.getHours(), base.getMinutes(), 0, 0);
    else next.setHours(0, 0, 0, 0);
    commit(next);
    setCursor(next);
    if (!showTime) onClose();
  };

  const pickTime = (hours: number, minutes: number) => {
    const next = new Date(selected ?? cursor);
    next.setHours(hours, minutes, 0, 0);
    commit(next);
    setCursor(next);
  };

  const moveCursor = (next: Date) => {
    focusPending.current = true;
    setCursor(next);
    if (!isSameMonth(next, month)) setMonth(startOfMonth(next));
  };

  const onGridKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    let next: Date | null = null;
    if (event.key === "ArrowLeft") next = addDays(cursor, -1);
    else if (event.key === "ArrowRight") next = addDays(cursor, 1);
    else if (event.key === "ArrowUp") next = addDays(cursor, -7);
    else if (event.key === "ArrowDown") next = addDays(cursor, 7);
    else if (event.key === "PageUp") next = subMonths(cursor, 1);
    else if (event.key === "PageDown") next = addMonths(cursor, 1);
    else if (event.key === "Home") next = startOfWeek(cursor);
    else if (event.key === "End") next = endOfWeek(cursor);
    else return;
    event.preventDefault();
    event.stopPropagation();
    moveCursor(next);
  };

  // 12-hour dials with an explicit AM/PM switch: a 24-row hour column meant
  // scrolling past noon to reach the evening, which is where most reminders sit.
  const hours12 = useMemo(
    () => Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i)),
    [],
  );
  const minutes = useMemo(() => {
    const step = minuteStep > 0 ? minuteStep : 5;
    return Array.from({ length: Math.ceil(60 / step) }, (_, i) => i * step);
  }, [minuteStep]);

  const activeHour = selected?.getHours() ?? null;
  const rawMinute = selected?.getMinutes() ?? null;
  const activeHour12 =
    activeHour === null ? null : activeHour % 12 === 0 ? 12 : activeHour % 12;
  const meridiem: "am" | "pm" =
    activeHour === null ? "am" : activeHour < 12 ? "am" : "pm";

  /** Combine a 12-hour dial reading with the current AM/PM into 0–23. */
  const to24 = (hour12: number, period: "am" | "pm") =>
    (hour12 % 12) + (period === "pm" ? 12 : 0);
  // Snap the highlight to the nearest option so a stored 19:07 still shows a
  // selected row on a 5-minute step.
  const activeMinute =
    rawMinute === null
      ? null
      : minutes.reduce(
          (best, m) =>
            Math.abs(m - rawMinute) < Math.abs(best - rawMinute) ? m : best,
          minutes[0],
        );

  return (
    <div className="flex flex-col gap-3 p-2">
      <div
        className={cx(
          "flex flex-col gap-3",
          showDate && showTime && "sm:flex-row",
        )}
      >
        {showDate && (
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-1 mb-2">
              <IconButton
                size="sm"
                variant="ghost"
                aria-label="Previous month"
                icon={<ChevronLeft />}
                onClick={() => setMonth((m) => subMonths(m, 1))}
              />
              <span aria-live="polite" className="type-label min-w-0 truncate">
                {MONTH_FORMAT.format(month)}
              </span>
              <IconButton
                size="sm"
                variant="ghost"
                aria-label="Next month"
                icon={<ChevronRight />}
                onClick={() => setMonth((m) => addMonths(m, 1))}
              />
            </div>
            <div className="grid grid-cols-7 mb-1">
              {weekdayLabels.map((day) => (
                <span
                  key={day}
                  aria-hidden
                  className="type-overline text-center py-1"
                >
                  {day.slice(0, 2)}
                </span>
              ))}
            </div>
            <div
              ref={gridRef}
              role="grid"
              aria-label="Calendar"
              onKeyDown={onGridKeyDown}
              className="grid grid-cols-7 gap-0.5"
            >
              {days.map((day) => {
                const isSelected =
                  selected !== null && isSameDay(day, selected);
                const isToday = isSameDay(day, new Date());
                const isCursor = isSameDay(day, cursor);
                const isDisabled = outOfRange(day);
                return (
                  <button
                    key={day.getTime()}
                    type="button"
                    data-day
                    role="gridcell"
                    aria-selected={isSelected}
                    aria-label={FULL_DAY_FORMAT.format(day)}
                    aria-current={isToday ? "date" : undefined}
                    tabIndex={isCursor ? 0 : -1}
                    disabled={isDisabled}
                    onClick={() => pickDay(day)}
                    className={cx(
                      "relative w-9 h-9 inline-flex items-center justify-center rounded-(--radius-control) text-sm transition-colors",
                      "focus-visible:outline-2 focus-visible:outline-(--focus-ring) focus-visible:outline-offset-1",
                      isDisabled && "opacity-40 cursor-not-allowed",
                      !isSameMonth(day, month) &&
                        !isSelected &&
                        "text-(--text-muted)",
                      isSelected
                        ? "bg-(--primary) text-(--on-primary) font-semibold"
                        : !isDisabled &&
                            "text-(--text-primary) hover:bg-(--surface-elevated)",
                    )}
                  >
                    {isToday && !isSelected && (
                      <span
                        aria-hidden
                        className="absolute inset-0.5 rounded-(--radius-control) border-2 border-(--text-primary)"
                      />
                    )}
                    <span className="relative">{day.getDate()}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {showTime && (
          <div
            className={cx(
              "min-w-0",
              showDate &&
                "border-t border-(--border) pt-3 sm:w-56 sm:border-t-0 sm:border-l sm:pl-3 sm:pt-0",
            )}
          >
            {/* Time-only panels are already titled by the sheet or trigger. */}
            {showDate && <div className="type-overline mb-2">Time</div>}
            {/* The dials share the width; AM/PM keeps its own narrow column. */}
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <TimeColumn
                label="Hour"
                options={hours12}
                active={activeHour12}
                onSelect={(h) => pickTime(to24(h, meridiem), rawMinute ?? 0)}
              />
              <TimeColumn
                label="Minute"
                options={minutes}
                active={activeMinute}
                onSelect={(m) => pickTime(activeHour ?? 0, m)}
              />
              <div className="flex flex-col">
                {/* Matches the columns' label row so the tops line up. */}
                <div aria-hidden className="type-overline mb-1 invisible">
                  &nbsp;
                </div>
                {/* A small segmented switch, centred on the dials: they scroll the
                    selected row to their middle, so AM/PM reads on the same line. */}
                <div className="flex-1 flex items-center">
                  <div
                    role="group"
                    aria-label="AM or PM"
                    className="flex flex-col gap-1 p-1 rounded-(--radius-panel) border border-(--border) bg-(--surface-elevated)"
                  >
                    {(["am", "pm"] as const).map((period) => {
                      const isActive = meridiem === period;
                      return (
                        <button
                          key={period}
                          type="button"
                          aria-pressed={isActive}
                          onClick={() =>
                            pickTime(
                              to24(activeHour12 ?? 12, period),
                              rawMinute ?? 0,
                            )
                          }
                          className={cx(
                            "w-11 h-8 rounded-(--radius-control) text-xs font-semibold uppercase tracking-wide transition-colors",
                            "focus-visible:outline-2 focus-visible:outline-(--focus-ring) focus-visible:outline-offset-1",
                            isActive
                              ? "bg-(--primary) text-(--on-primary)"
                              : "text-(--text-secondary) hover:bg-(--surface) hover:text-(--text-primary)",
                          )}
                        >
                          {period}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-(--border)">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            const now = new Date();
            const next = showTime ? now : startOfDay(now);
            setMonth(startOfMonth(now));
            setCursor(next);
            commit(next);
            if (!showTime) onClose();
          }}
        >
          {mode === "time" ? "Now" : "Today"}
        </Button>
        <div className="flex items-center gap-2">
          {clearable && value !== null && (
            <Button
              size="sm"
              variant="ghost"
              iconLeft={<X className="w-4 h-4" />}
              onClick={() => {
                onChange(null);
                onClose();
              }}
            >
              Clear
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

function TimeColumn({
  label,
  options,
  active,
  onSelect,
}: {
  label: string;
  options: number[];
  active: number | null;
  onSelect: (value: number) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  // Open on the current value rather than at midnight.
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>('[aria-selected="true"]')
      ?.scrollIntoView({ block: "center" });
  }, []);

  return (
    <div className="min-w-0 flex flex-col">
      <div className="type-overline mb-1 text-center">{label}</div>
      <div
        ref={listRef}
        role="listbox"
        aria-label={label}
        className="h-44 w-full overflow-y-auto overscroll-contain snap-y scrollbar-hide rounded-(--radius-panel) border border-(--border) bg-(--surface-elevated) p-1 space-y-1"
      >
        {options.map((option) => {
          const isActive = option === active;
          return (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={isActive}
              onClick={() => onSelect(option)}
              className={cx(
                "w-full h-9 snap-center rounded-(--radius-control) type-time text-sm text-center transition-colors",
                "focus-visible:outline-2 focus-visible:outline-(--focus-ring) focus-visible:-outline-offset-2",
                isActive
                  ? "bg-(--primary) text-(--on-primary) font-semibold"
                  : "text-(--text-secondary) hover:bg-(--surface) hover:text-(--text-primary)",
              )}
            >
              {String(option).padStart(2, "0")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
