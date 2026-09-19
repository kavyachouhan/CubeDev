"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { CollapsibleCard } from "@/components/ui/Card";
import { EventIcon } from "@/components/ui/EventIcon";
import { SelectMenu } from "@/components/ui/Menu";
import { TIMER_EVENTS, getTimerEvent } from "@/lib/timer-events";

interface EventSelectorProps {
  selectedEvent: string;
  onEventChange: (event: string) => void;
  solveHistory?: ReadonlyArray<{ event: string; sessionId: string }>;
  currentSessionId?: string;
}

function usePersistentBool(key: string, defaultValue: boolean) {
  const [state, setState] = useState<boolean>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? defaultValue : JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Storage can be unavailable (private mode); the preference just won't persist.
    }
  }, [key, state]);
  return [state, setState] as const;
}

export default function EventSelector({
  selectedEvent,
  onEventChange,
  solveHistory = [],
  currentSessionId,
}: EventSelectorProps) {
  const [isExpanded, setIsExpanded] = usePersistentBool(
    "cubelab-event-selector-expanded",
    true,
  );

  const getSolveCount = (eventId: string) => {
    if (!currentSessionId) return 0;
    return solveHistory.filter(
      (solve) => solve.event === eventId && solve.sessionId === currentSessionId,
    ).length;
  };

  const selected = getTimerEvent(selectedEvent);

  return (
    <CollapsibleCard title="Event" open={isExpanded} onOpenChange={setIsExpanded}>
      <SelectMenu
        label="Event"
        value={selected.id}
        onChange={onEventChange}
        size="lg"
        searchable
        searchPlaceholder="Search events"
        options={TIMER_EVENTS.map((event) => ({
          value: event.id,
          textLabel: event.name,
          label: <span className="font-statement">{event.name}</span>,
          description: `${getSolveCount(event.id)} solves`,
          icon: <EventIcon eventId={event.id} size="sm" />,
        }))}
        trigger={(props) => (
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
        )}
      />
    </CollapsibleCard>
  );
}
