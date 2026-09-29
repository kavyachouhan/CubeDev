"use client";

import { Timer, Edit3, Mic, ChevronDown } from "lucide-react";
import { cx } from "@/lib/cx";
import { SelectMenu } from "@/components/ui/Menu";
import type { SelectOption } from "@/components/ui/Menu";

export type CompetitionTimerMode = "normal" | "manual" | "stackmat";

interface CompetitionTimerModeSelectorProps {
  timerMode: CompetitionTimerMode;
  onTimerModeChange: (mode: CompetitionTimerMode) => void;
  disabled?: boolean;
}

const TIMER_MODE_OPTIONS: SelectOption<CompetitionTimerMode>[] = [
  {
    value: "normal",
    label: "Normal Timer",
    textLabel: "Normal Timer",
    description: "Traditional spacebar timer",
    icon: <Timer />,
  },
  {
    value: "manual",
    label: "Manual Entry",
    textLabel: "Manual Entry",
    description: "Enter times manually",
    icon: <Edit3 />,
  },
  {
    value: "stackmat",
    label: "Stackmat Timer",
    textLabel: "Stackmat Timer",
    description: "Use external stackmat",
    icon: <Mic />,
  },
];

/**
 * Timer mode for a competition round. Uses the shared SelectMenu so the panel
 * stays inside the viewport and becomes a bottom sheet on a phone, where the
 * simulation header has no room for an anchored dropdown.
 */
export default function CompetitionTimerModeSelector({
  timerMode,
  onTimerModeChange,
  disabled = false,
}: CompetitionTimerModeSelectorProps) {
  return (
    <SelectMenu
      label="Timer mode"
      value={timerMode}
      onChange={onTimerModeChange}
      options={TIMER_MODE_OPTIONS}
      disabled={disabled}
      placement="bottom-end"
      trigger={({ selected, ...props }) => (
        <button
          {...props}
          type="button"
          disabled={disabled}
          aria-label={`Timer mode: ${selected?.textLabel ?? "Normal Timer"}`}
          className={cx(
            "flex items-center gap-2 px-3 min-h-9 bg-(--surface-elevated) rounded-(--radius-control) border border-(--border) transition-colors",
            disabled
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer hover:border-(--primary)",
          )}
        >
          <span className="shrink-0 text-(--primary) [&_svg]:w-4 [&_svg]:h-4">
            {selected?.icon ?? <Timer />}
          </span>
          <span className="hidden sm:inline text-sm font-medium font-inter text-(--text-primary)">
            {selected?.label ?? "Normal Timer"}
          </span>
          <ChevronDown
            aria-hidden
            className={cx(
              "w-4 h-4 shrink-0 text-(--text-secondary) transition-transform",
              props["aria-expanded"] && "rotate-180",
            )}
          />
        </button>
      )}
    />
  );
}
