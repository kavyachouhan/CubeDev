"use client";

import { useEffect, useState } from "react";
import { Calendar, Filter, FolderOpen, X } from "lucide-react";
import { CollapsibleCard } from "@/components/ui/Card";
import { EventIcon } from "@/components/ui/EventIcon";
import { Field, Input } from "@/components/ui/Field";
import { SelectMenu } from "@/components/ui/Menu";
import { TimeFilter, EventFilter, SessionFilter } from "../CubeLabStats";

interface Session {
  id: string;
  name: string;
  event: string;
  createdAt: Date;
  solveCount: number;
  convexId?: string;
}

interface StatsFiltersProps {
  filters: {
    timeFilter: TimeFilter;
    eventFilter: EventFilter;
    sessionFilter: SessionFilter;
    customTimeRange?: {
      startDate: string;
      endDate: string;
    };
    secondaryEventFilter?: string;
  };
  onFilterChange: (
    filters: Partial<{
      timeFilter: TimeFilter;
      eventFilter: EventFilter;
      sessionFilter: SessionFilter;
      customTimeRange?: {
        startDate: string;
        endDate: string;
      };
      secondaryEventFilter?: string;
    }>,
  ) => void;
  availableEvents: string[];
  availableSessions: Session[];
  allSolveHistory?: ReadonlyArray<{ sessionId: string; event: string }>;
}

const TIME_FILTER_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "3m", label: "Last 3 months" },
  { value: "6m", label: "Last 6 months" },
  { value: "1y", label: "Last year" },
  { value: "custom", label: "Custom range" },
];

const EVENT_NAMES: Record<string, string> = {
  "222": "2×2",
  "333": "3×3",
  "444": "4×4",
  "555": "5×5",
  "666": "6×6",
  "777": "7×7",
  "333bf": "3×3 BLD",
  "333fm": "3×3 FM",
  "333oh": "3×3 OH",
  clock: "Clock",
  minx: "Megaminx",
  pyram: "Pyraminx",
  skewb: "Skewb",
  sq1: "Square-1",
  "444bf": "4×4 BLD",
  "555bf": "5×5 BLD",
  "333mbf": "3×3 MBLD",
};

// Stats use WCA event ids, whose icon files match the id directly.
const KNOWN_ICONS = new Set([
  "333", "222", "444", "555", "666", "777", "333oh", "333bf", "444bf",
  "555bf", "333mbf", "333fm", "pyram", "minx", "skewb", "clock", "sq1",
]);
const eventIconPath = (eventId: string) =>
  `/cube-icons/${KNOWN_ICONS.has(eventId) ? eventId : "333"}.svg`;
const eventName = (eventId: string) => EVENT_NAMES[eventId] || eventId;

function StatsEventIcon({ eventId }: { eventId: string }) {
  return (
    <EventIcon
      eventId={eventId}
      size="sm"
      src={eventIconPath(eventId)}
      alt={eventName(eventId)}
    />
  );
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

/** A removable token describing one active filter. */
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 h-7 pl-2.5 pr-1 rounded-full border border-(--primary)/30 bg-(--primary)/10 text-sm text-(--text-primary) font-inter">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter: ${label}`}
        className="icon-btn w-5 h-5 rounded-full! [&_svg]:w-3 [&_svg]:h-3"
      >
        <X />
      </button>
    </span>
  );
}

export default function StatsFilters({
  filters,
  onFilterChange,
  availableEvents,
  availableSessions,
  allSolveHistory = [],
}: StatsFiltersProps) {
  const [isExpanded, setIsExpanded] = usePersistentBool(
    "cubelab-stats-filters-expanded",
    true,
  );

  const getSessionEvents = (sessionId: string) =>
    Array.from(
      new Set(
        allSolveHistory
          .filter((solve) => solve.sessionId === sessionId)
          .map((solve) => solve.event),
      ),
    );

  const getSessionSolveCount = (sessionId: string) =>
    allSolveHistory.filter((solve) => solve.sessionId === sessionId).length;

  const selectedSession = availableSessions.find(
    (s) => s.id === filters.sessionFilter,
  );
  const sessionEvents = selectedSession ? getSessionEvents(selectedSession.id) : [];

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

  const timeLabel =
    filters.timeFilter === "custom" && filters.customTimeRange
      ? `${formatDate(filters.customTimeRange.startDate)} – ${formatDate(filters.customTimeRange.endDate)}`
      : TIME_FILTER_OPTIONS.find((opt) => opt.value === filters.timeFilter)?.label ??
        "All time";

  const showSecondaryEvent = Boolean(selectedSession && sessionEvents.length > 1);
  const showPrimaryEvent = !selectedSession && availableEvents.length > 1;

  const hasActiveFilters =
    filters.timeFilter !== "all" ||
    filters.eventFilter !== "all" ||
    filters.sessionFilter !== "all" ||
    Boolean(filters.secondaryEventFilter);

  return (
    <CollapsibleCard title="Filters" open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Time Period">
          <SelectMenu
            label="Time period"
            value={filters.timeFilter}
            onChange={(timeFilter) => onFilterChange({ timeFilter })}
            options={TIME_FILTER_OPTIONS.map((option) => ({
              ...option,
              label: option.value === "custom" && filters.timeFilter === "custom" ? timeLabel : option.label,
              textLabel: option.label,
              icon: <Calendar />,
            }))}
          />
        </Field>

        <Field label="Session">
          <SelectMenu
            label="Session"
            value={filters.sessionFilter}
            searchable={availableSessions.length > 8}
            searchPlaceholder="Search sessions"
            onChange={(sessionFilter) =>
              onFilterChange({ sessionFilter, secondaryEventFilter: undefined })
            }
            options={[
              {
                value: "all" as SessionFilter,
                label: "All Sessions",
                description: `${availableSessions.length} sessions`,
                icon: <FolderOpen />,
              },
              ...availableSessions.map((session) => ({
                value: session.id as SessionFilter,
                label: session.name,
                textLabel: session.name,
                description: `${getSessionSolveCount(session.id)} solves · ${
                  getSessionEvents(session.id).map(eventName).join(", ") || "No solves"
                }`,
                icon: <FolderOpen />,
              })),
            ]}
          />
        </Field>

        {showSecondaryEvent && (
          <Field label="Event within Session">
            <SelectMenu
              label="Event within session"
              value={filters.secondaryEventFilter ?? "__all"}
              onChange={(value) =>
                onFilterChange({
                  secondaryEventFilter: value === "__all" ? undefined : value,
                })
              }
              options={[
                { value: "__all", label: "All Events", icon: <Filter /> },
                ...sessionEvents.map((event) => ({
                  value: event,
                  label: eventName(event),
                  icon: <StatsEventIcon eventId={event} />,
                })),
              ]}
            />
          </Field>
        )}

        {showPrimaryEvent && (
          <Field label="Event">
            <SelectMenu
              label="Event"
              value={filters.eventFilter}
              onChange={(eventFilter) => onFilterChange({ eventFilter })}
              options={[
                { value: "all" as EventFilter, label: "All Events", icon: <Filter /> },
                ...availableEvents.map((event) => ({
                  value: event as EventFilter,
                  label: eventName(event),
                  icon: <StatsEventIcon eventId={event} />,
                })),
              ]}
            />
          </Field>
        )}
      </div>

      {filters.timeFilter === "custom" && (
        <div className="grid grid-cols-2 gap-3 mt-4 max-w-md">
          <Field label="Start date">
            <Input
              type="date"
              size="sm"
              value={filters.customTimeRange?.startDate || ""}
              onChange={(e) =>
                onFilterChange({
                  customTimeRange: {
                    startDate: e.target.value,
                    endDate: filters.customTimeRange?.endDate || "",
                  },
                })
              }
            />
          </Field>
          <Field label="End date">
            <Input
              type="date"
              size="sm"
              value={filters.customTimeRange?.endDate || ""}
              onChange={(e) =>
                onFilterChange({
                  customTimeRange: {
                    startDate: filters.customTimeRange?.startDate || "",
                    endDate: e.target.value,
                  },
                })
              }
            />
          </Field>
        </div>
      )}

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-4 mt-4 border-t border-(--border)">
          <span className="type-caption mr-1">Active filters:</span>

          {filters.timeFilter !== "all" && (
            <FilterChip
              label={timeLabel}
              onRemove={() => onFilterChange({ timeFilter: "all", customTimeRange: undefined })}
            />
          )}

          {filters.sessionFilter !== "all" && (
            <FilterChip
              label={selectedSession?.name || "Session"}
              onRemove={() =>
                onFilterChange({ sessionFilter: "all", secondaryEventFilter: undefined })
              }
            />
          )}

          {filters.secondaryEventFilter && (
            <FilterChip
              label={eventName(filters.secondaryEventFilter)}
              onRemove={() => onFilterChange({ secondaryEventFilter: undefined })}
            />
          )}

          {filters.eventFilter !== "all" && filters.sessionFilter === "all" && (
            <FilterChip
              label={eventName(filters.eventFilter)}
              onRemove={() => onFilterChange({ eventFilter: "all" })}
            />
          )}

          <button
            type="button"
            onClick={() =>
              onFilterChange({
                timeFilter: "all",
                eventFilter: "all",
                sessionFilter: "all",
                customTimeRange: undefined,
                secondaryEventFilter: undefined,
              })
            }
            className="text-sm font-medium text-(--text-muted) hover:text-(--primary) transition-colors px-1"
          >
            Clear all
          </button>
        </div>
      )}
    </CollapsibleCard>
  );
}
