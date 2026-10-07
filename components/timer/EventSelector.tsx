"use client";

import { ChevronDown } from "lucide-react";
import { CollapsibleCard, useCollapsed } from "@/components/ui/Card";
import { EventIcon } from "@/components/ui/EventIcon";
import { SelectMenu } from "@/components/ui/Menu";
import { TIMER_EVENTS, getTimerEvent } from "@/lib/timer-events";

interface EventSelectorProps {
  selectedEvent: string;
  onEventChange: (event: string) => void;
  solveHistory?: ReadonlyArray<{ event: string; sessionId: string }>;
  currentSessionId?: string;
}

/**
 * The event picker on its own, so a layout can put it in a toolbar instead of
 * a card. Below 640px the menu opens as a bottom sheet.
 */
export function EventSelectMenu({
  selectedEvent,
  onEventChange,
  solveHistory = [],
  currentSessionId,
  /** "full" is the card's stacked tile; "chip" is a compact toolbar control. */
  variant = "full",
  chipClassName,
}: EventSelectorProps & { variant?: "full" | "chip"; chipClassName?: string }) {
  const getSolveCount = (eventId: string) => {
    if (!currentSessionId) return 0;
    return solveHistory.filter(
      (solve) => solve.event === eventId && solve.sessionId === currentSessionId,
    ).length;
  };

  const selected = getTimerEvent(selectedEvent);

  return (
    <SelectMenu
      label="Event"
      value={selected.id}
      onChange={onEventChange}
      size={variant === "chip" ? "sm" : "lg"}
      searchable
      searchPlaceholder="Search events"
      options={TIMER_EVENTS.map((event) => ({
        value: event.id,
        textLabel: event.name,
        label: <span className="font-statement">{event.name}</span>,
        description: `${getSolveCount(event.id)} solves`,
        icon: <EventIcon eventId={event.id} size="sm" />,
      }))}
      trigger={(props) =>
        variant === "chip" ? (
          <button
            {...props}
            type="button"
            className={chipClassName}
          >
            <EventIcon eventId={selected.id} size="sm" />
            <span className="type-label text-(--text-primary) truncate">
              {selected.name}
            </span>
            <ChevronDown
              aria-hidden
              className={`w-4 h-4 shrink-0 text-(--text-muted) transition-transform ${
                props["aria-expanded"] ? "rotate-180" : ""
              }`}
            />
          </button>
        ) : (
          <button
            {...props}
            type="button"
            className="input input-lg flex items-center gap-3 text-left"
          >
            <EventIcon eventId={selected.id} />
            <span className="flex-1 min-w-0">
              <span className="block font-statement text-(--text-primary) truncate">
                {selected.name}
              </span>
              <span className="block type-caption">
                {getSolveCount(selected.id)} solves
              </span>
            </span>
            <ChevronDown
              aria-hidden
              className={`w-4 h-4 shrink-0 text-(--text-muted) transition-transform ${
                props["aria-expanded"] ? "rotate-180" : ""
              }`}
            />
          </button>
        )
      }
    />
  );
}

export default function EventSelector(props: EventSelectorProps) {
  const { open: isExpanded, onOpenChange: setIsExpanded } = useCollapsed(
    "cubelab-event-selector-expanded",
    true,
  );

  return (
    <CollapsibleCard
      title="Event"
      open={isExpanded}
      onOpenChange={setIsExpanded}
    >
      <EventSelectMenu {...props} />
    </CollapsibleCard>
  );
}
