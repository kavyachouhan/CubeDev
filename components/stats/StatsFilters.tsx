"use client";

import {
  ChevronDown,
  ChevronRight,
  Filter,
  Calendar,
  FolderOpen,
  Clock,
  Eye,
  EyeOff,
  X,
} from "lucide-react";
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
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
    }>
  ) => void;
  availableEvents: string[];
  availableSessions: Session[];
  allSolveHistory?: Array<{
    sessionId: string;
    event: string;
    [key: string]: any;
  }>;
}

const TIME_FILTER_OPTIONS = [
  { value: "all" as TimeFilter, label: "All time" },
  { value: "7d" as TimeFilter, label: "Last 7 days" },
  { value: "30d" as TimeFilter, label: "Last 30 days" },
  { value: "3m" as TimeFilter, label: "Last 3 months" },
  { value: "6m" as TimeFilter, label: "Last 6 months" },
  { value: "1y" as TimeFilter, label: "Last year" },
  { value: "custom" as TimeFilter, label: "Custom range" },
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

// Persistent boolean state hook (uses localStorage)
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
    } catch {}
  }, [key, state]);
  return [state, setState] as const;
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
    true
  );

  // Dropdown states
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [isSessionDropdownOpen, setIsSessionDropdownOpen] = useState(false);
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);

  // Body visibility state for smoother transitions
  const [isBodyVisible, setIsBodyVisible] = useState<boolean>(isExpanded);

  // Refs for measuring heights and detecting outside clicks
  const cardRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const timeDropdownRef = useRef<HTMLDivElement>(null);
  const sessionDropdownRef = useRef<HTMLDivElement>(null);
  const eventDropdownRef = useRef<HTMLDivElement>(null);

  // Max height state for smooth transitions
  const [maxH, setMaxH] = useState<number>(0);

  // Function to measure heights
  const measureHeights = useMemo(
    () => () => {
      const card = cardRef.current;
      const header = headerRef.current;
      const body = bodyRef.current;
      if (!card || !header || !body) return { collapsed: 0, expanded: 0 };

      const styles = getComputedStyle(card);
      const padY =
        parseFloat(styles.paddingTop || "0") +
        parseFloat(styles.paddingBottom || "0");
      const headerH = header.offsetHeight;
      const bodyH = body.scrollHeight; // Use scrollHeight to get full height even if not visible

      return {
        collapsed: Math.ceil(headerH + padY),
        expanded: Math.ceil(headerH + bodyH + padY),
      };
    },
    []
  );

  // Initial measurement on mount
  useLayoutEffect(() => {
    const { collapsed, expanded } = measureHeights();
    setMaxH(isExpanded ? expanded : collapsed);
    setIsBodyVisible(isExpanded);
  }, []);

  // Re-measure on expand/collapse or content change
  useEffect(() => {
    const apply = () => {
      const { collapsed, expanded } = measureHeights();
      setMaxH(isExpanded ? expanded : collapsed);
    };
    apply();

    const ro = new ResizeObserver(apply);
    if (cardRef.current) ro.observe(cardRef.current);
    if (bodyRef.current) ro.observe(bodyRef.current);
    if (headerRef.current) ro.observe(headerRef.current);
    window.addEventListener("resize", apply);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", apply);
    };
  }, [
    isExpanded,
    filters,
    availableSessions.length,
    availableEvents.length,
    measureHeights,
  ]);

  // After expand transition ends, show body
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const onEnd = (e: TransitionEvent) => {
      if (e.propertyName !== "max-height") return;
      if (isExpanded) setIsBodyVisible(true);
    };
    el.addEventListener("transitionend", onEnd);
    return () => el.removeEventListener("transitionend", onEnd);
  }, [isExpanded]);

  // Toggle expand/collapse
  const toggleExpanded = () => {
    if (isExpanded) {
      // collapsing: hide body first, then collapse
      setIsBodyVisible(false);
      setIsExpanded(false);
      // Also close any open dropdowns
      setIsTimeDropdownOpen(false);
      setIsSessionDropdownOpen(false);
      setIsEventDropdownOpen(false);
    } else {
      // expanding: expand first, then show body
      setIsExpanded(true);
    }
  };

  // Click outside to close dropdowns
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (
        timeDropdownRef.current &&
        !timeDropdownRef.current.contains(e.target as Node)
      ) {
        setIsTimeDropdownOpen(false);
      }
      if (
        sessionDropdownRef.current &&
        !sessionDropdownRef.current.contains(e.target as Node)
      ) {
        setIsSessionDropdownOpen(false);
      }
      if (
        eventDropdownRef.current &&
        !eventDropdownRef.current.contains(e.target as Node)
      ) {
        setIsEventDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Helper function to get event icon path
  const getEventIconPath = (eventId: string) => {
    const iconMap: { [key: string]: string } = {
      "333": "333.svg",
      "222": "222.svg",
      "444": "444.svg",
      "555": "555.svg",
      "666": "666.svg",
      "777": "777.svg",
      "333oh": "333oh.svg",
      "333bf": "333bf.svg",
      "444bf": "444bf.svg",
      "555bf": "555bf.svg",
      "333mbf": "333mbf.svg",
      "333fm": "333fm.svg",
      pyram: "pyram.svg",
      minx: "minx.svg",
      skewb: "skewb.svg",
      clock: "clock.svg",
      sq1: "sq1.svg",
    };

    return iconMap[eventId]
      ? `/cube-icons/${iconMap[eventId]}`
      : "/cube-icons/333.svg";
  };

  // Helper function to get events in a session
  const getSessionEvents = (sessionId: string) => {
    const sessionEvents = new Set(
      allSolveHistory
        .filter((solve) => solve.sessionId === sessionId)
        .map((solve) => solve.event)
    );
    return Array.from(sessionEvents);
  };

  // Helper function to get solve count for session
  const getSessionSolveCount = (sessionId: string) => {
    return allSolveHistory.filter((solve) => solve.sessionId === sessionId)
      .length;
  };

  // Get selected session details
  const selectedSession = availableSessions.find(
    (s) => s.id === filters.sessionFilter
  );

  // Get events available in selected session for secondary filter
  const sessionEvents = selectedSession
    ? getSessionEvents(selectedSession.id)
    : [];

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div
      ref={cardRef}
      className={[
        "timer-card",
        "transition-[max-height] duration-300 ease-in-out",
        isTimeDropdownOpen || isSessionDropdownOpen || isEventDropdownOpen
          ? "relative z-[60]"
          : "",
      ].join(" ")}
      style={{
        maxHeight: maxH ? `${maxH}px` : undefined,
        overflow: isExpanded && isBodyVisible ? "visible" : "hidden",
      }}
    >
      {/* Header */}
      <div
        ref={headerRef}
        className={`flex items-center justify-between ${
          isExpanded ? "mb-4" : "mb-0"
        }`}
      >
        <button
          onClick={toggleExpanded}
          className="flex items-center gap-1 p-2 text-[var(--text-muted)] hover:text-[var(--primary)] rounded transition-colors"
          title={isExpanded ? "Hide filters" : "Show filters"}
        >
        <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement hover:text-[var(--primary)] transition-colors">
          Filters
        </h3>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleExpanded}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-md transition-colors"
            title={isExpanded ? "Hide filters" : "Show filters"}
          >
            {isExpanded ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Body */}
      <div
        ref={bodyRef}
        className={
          isBodyVisible
            ? "pb-4"
            : "invisible pointer-events-none select-none pb-4"
        }
        aria-hidden={!isBodyVisible}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Time Period Filter */}
          <div className="relative" ref={timeDropdownRef}>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Time Period
            </label>
            <button
              onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
              className="w-full flex items-center justify-between p-2 md:p-3 bg-[var(--surface-elevated)] hover:bg-[var(--surface-elevated)]/80 rounded-lg border border-[var(--border)] transition-colors"
            >
              <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                <Calendar className="w-4 h-4 text-[var(--primary)] flex-shrink-0" />
                <div className="text-left min-w-0 flex-1">
                  <div className="font-medium text-[var(--text-primary)] font-statement truncate">
                    {filters.timeFilter === "custom" && filters.customTimeRange
                      ? `${formatDate(filters.customTimeRange.startDate)} - ${formatDate(filters.customTimeRange.endDate)}`
                      : TIME_FILTER_OPTIONS.find(
                          (opt) => opt.value === filters.timeFilter
                        )?.label || "All time"}
                  </div>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-[var(--text-secondary)] transition-transform flex-shrink-0 ${
                  isTimeDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isTimeDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl z-[9999] max-h-80 overflow-hidden">
                <div className="max-h-56 overflow-y-auto">
                  {TIME_FILTER_OPTIONS.map((option) => (
                    <div key={option.value}>
                      <button
                        onClick={() => {
                          onFilterChange({ timeFilter: option.value });
                          if (option.value !== "custom") {
                            setIsTimeDropdownOpen(false);
                          }
                        }}
                        className={`w-full flex items-center gap-2 md:gap-3 p-2 md:p-3 text-left hover:bg-[var(--surface-elevated)] transition-colors ${
                          option.value === filters.timeFilter
                            ? "bg-[var(--primary)]/20 border-[var(--primary)]/30"
                            : "bg-[var(--background)]"
                        }`}
                      >
                        <Clock className="w-4 h-4 text-[var(--primary)] flex-shrink-0" />
                        <div className="font-medium text-[var(--text-primary)] font-statement">
                          {option.label}
                        </div>
                      </button>

                      {option.value === "custom" &&
                        filters.timeFilter === "custom" && (
                          <div className="p-3 border-t border-[var(--border)] bg-[var(--surface-elevated)]">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs text-[var(--text-muted)] mb-1">
                                  Start Date
                                </label>
                                <input
                                  type="date"
                                  value={
                                    filters.customTimeRange?.startDate || ""
                                  }
                                  onChange={(e) =>
                                    onFilterChange({
                                      customTimeRange: {
                                        startDate: e.target.value,
                                        endDate:
                                          filters.customTimeRange?.endDate ||
                                          "",
                                      },
                                    })
                                  }
                                  className="w-full px-2 py-1 bg-[var(--background)] border border-[var(--border)] rounded text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-[var(--text-muted)] mb-1">
                                  End Date
                                </label>
                                <input
                                  type="date"
                                  value={filters.customTimeRange?.endDate || ""}
                                  onChange={(e) =>
                                    onFilterChange({
                                      customTimeRange: {
                                        startDate:
                                          filters.customTimeRange?.startDate ||
                                          "",
                                        endDate: e.target.value,
                                      },
                                    })
                                  }
                                  className="w-full px-2 py-1 bg-[var(--background)] border border-[var(--border)] rounded text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => setIsTimeDropdownOpen(false)}
                              className="mt-2 w-full px-3 py-2 bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary)]/80 transition-colors text-sm font-medium"
                            >
                              Apply Range
                            </button>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Session Filter */}
          <div className="relative" ref={sessionDropdownRef}>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Session
            </label>
            <button
              onClick={() => setIsSessionDropdownOpen(!isSessionDropdownOpen)}
              className="w-full flex items-center justify-between p-2 md:p-3 bg-[var(--surface-elevated)] hover:bg-[var(--surface-elevated)]/80 rounded-lg border border-[var(--border)] transition-colors"
            >
              <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                <FolderOpen className="w-4 h-4 text-[var(--primary)] flex-shrink-0" />
                <div className="text-left min-w-0 flex-1">
                  <div className="font-medium text-[var(--text-primary)] font-statement truncate">
                    {selectedSession ? selectedSession.name : "All Sessions"}
                  </div>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-[var(--text-secondary)] transition-transform flex-shrink-0 ${
                  isSessionDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isSessionDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl z-[9999] max-h-80 overflow-hidden">
                <div className="max-h-56 overflow-y-auto">
                  <button
                    onClick={() => {
                      onFilterChange({
                        sessionFilter: "all",
                        secondaryEventFilter: undefined,
                      });
                      setIsSessionDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 md:gap-3 p-2 md:p-3 text-left hover:bg-[var(--surface-elevated)] transition-colors border-b border-[var(--border)]/50 ${
                      filters.sessionFilter === "all"
                        ? "bg-[var(--primary)]/20 border-[var(--primary)]/30"
                        : "bg-[var(--background)]"
                    }`}
                  >
                    <FolderOpen className="w-4 h-4 text-[var(--primary)] flex-shrink-0" />
                    <div>
                      <div className="font-medium text-[var(--text-primary)] font-statement">
                        All Sessions
                      </div>
                      <div className="text-xs text-[var(--text-muted)] font-inter">
                        {availableSessions.length} sessions
                      </div>
                    </div>
                  </button>

                  {availableSessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => {
                        onFilterChange({
                          sessionFilter: session.id,
                          secondaryEventFilter: undefined,
                        });
                        setIsSessionDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 md:gap-3 p-2 md:p-3 text-left hover:bg-[var(--surface-elevated)] transition-colors border-b border-[var(--border)]/50 last:border-b-0 ${
                        session.id === filters.sessionFilter
                          ? "bg-[var(--primary)]/20 border-[var(--primary)]/30"
                          : "bg-[var(--background)]"
                      }`}
                    >
                      <FolderOpen className="w-4 h-4 text-[var(--primary)] flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-[var(--text-primary)] font-statement truncate">
                          {session.name}
                        </div>
                        <div className="text-xs text-[var(--text-muted)] font-inter truncate">
                          {getSessionSolveCount(session.id)} solves
                        </div>
                        {/* Show available events in this session */}
                        <div className="text-xs text-[var(--text-muted)] font-inter truncate mt-1">
                          Events:{" "}
                          {getSessionEvents(session.id)
                            .map((e) => EVENT_NAMES[e] || e)
                            .join(", ") || "No solves"}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Event Filter */}
          {((selectedSession && sessionEvents.length > 1) ||
            (!selectedSession && availableEvents.length > 1)) && (
            <div className="relative" ref={eventDropdownRef}>
              {selectedSession && sessionEvents.length > 1 ? (
                // Secondary Event Filter (when a specific session with multiple events is selected)
                <>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Event within Session
                  </label>
                  <button
                    onClick={() => setIsEventDropdownOpen(!isEventDropdownOpen)}
                    className="w-full flex items-center justify-between p-2 md:p-3 bg-[var(--surface-elevated)] hover:bg-[var(--surface-elevated)]/80 rounded-lg border border-[var(--border)] transition-colors"
                  >
                    <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                      <div className="w-6 h-6 bg-[var(--primary)] text-white rounded-lg flex items-center justify-center p-0.5 flex-shrink-0">
                        <Image
                          src={getEventIconPath(
                            filters.secondaryEventFilter || sessionEvents[0]
                          )}
                          alt="Event"
                          width={16}
                          height={16}
                          className="w-full h-full object-contain brightness-0 invert"
                        />
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <div className="font-medium text-[var(--text-primary)] font-statement truncate">
                          {filters.secondaryEventFilter
                            ? EVENT_NAMES[filters.secondaryEventFilter] ||
                              filters.secondaryEventFilter
                            : "All Events"}
                        </div>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-[var(--text-secondary)] transition-transform flex-shrink-0 ${
                        isEventDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isEventDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl z-[9999] max-h-80 overflow-hidden">
                      <div className="max-h-56 overflow-y-auto">
                        <button
                          onClick={() => {
                            onFilterChange({ secondaryEventFilter: undefined });
                            setIsEventDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 md:gap-3 p-2 md:p-3 text-left hover:bg-[var(--surface-elevated)] transition-colors border-b border-[var(--border)]/50 ${
                            !filters.secondaryEventFilter
                              ? "bg-[var(--primary)]/20 border-[var(--primary)]/30"
                              : "bg-[var(--background)]"
                          }`}
                        >
                          <Filter className="w-4 h-4 text-[var(--primary)] flex-shrink-0" />
                          <div className="font-medium text-[var(--text-primary)] font-statement">
                            All Events
                          </div>
                        </button>

                        {sessionEvents.map((event) => (
                          <button
                            key={event}
                            onClick={() => {
                              onFilterChange({ secondaryEventFilter: event });
                              setIsEventDropdownOpen(false);
                            }}
                            className={`w-full flex items-center gap-2 md:gap-3 p-2 md:p-3 text-left hover:bg-[var(--surface-elevated)] transition-colors border-b border-[var(--border)]/50 last:border-b-0 ${
                              event === filters.secondaryEventFilter
                                ? "bg-[var(--primary)]/20 border-[var(--primary)]/30"
                                : "bg-[var(--background)]"
                            }`}
                          >
                            <div className="w-6 h-6 bg-[var(--primary)] text-white rounded-lg flex items-center justify-center p-0.5 flex-shrink-0">
                              <Image
                                src={getEventIconPath(event)}
                                alt={EVENT_NAMES[event] || event}
                                width={16}
                                height={16}
                                className="w-full h-full object-contain brightness-0 invert"
                              />
                            </div>
                            <div className="font-medium text-[var(--text-primary)] font-statement">
                              {EVENT_NAMES[event] || event}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                // Primary Event Filter (when all sessions or no session selected)
                <>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Event
                  </label>
                  <button
                    onClick={() => setIsEventDropdownOpen(!isEventDropdownOpen)}
                    className="w-full flex items-center justify-between p-2 md:p-3 bg-[var(--surface-elevated)] hover:bg-[var(--surface-elevated)]/80 rounded-lg border border-[var(--border)] transition-colors"
                  >
                    <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                      <div className="w-6 h-6 bg-[var(--primary)] text-white rounded-lg flex items-center justify-center p-0.5 flex-shrink-0">
                        <Image
                          src={getEventIconPath(
                            filters.eventFilter === "all"
                              ? "333"
                              : filters.eventFilter
                          )}
                          alt="Event"
                          width={16}
                          height={16}
                          className="w-full h-full object-contain brightness-0 invert"
                        />
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <div className="font-medium text-[var(--text-primary)] font-statement truncate">
                          {filters.eventFilter === "all"
                            ? "All Events"
                            : EVENT_NAMES[filters.eventFilter] ||
                              filters.eventFilter}
                        </div>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-[var(--text-secondary)] transition-transform flex-shrink-0 ${
                        isEventDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isEventDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl z-[9999] max-h-80 overflow-hidden">
                      <div className="max-h-56 overflow-y-auto">
                        <button
                          onClick={() => {
                            onFilterChange({ eventFilter: "all" });
                            setIsEventDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 md:gap-3 p-2 md:p-3 text-left hover:bg-[var(--surface-elevated)] transition-colors border-b border-[var(--border)]/50 ${
                            filters.eventFilter === "all"
                              ? "bg-[var(--primary)]/20 border-[var(--primary)]/30"
                              : "bg-[var(--background)]"
                          }`}
                        >
                          <Filter className="w-4 h-4 text-[var(--primary)] flex-shrink-0" />
                          <div className="font-medium text-[var(--text-primary)] font-statement">
                            All Events
                          </div>
                        </button>

                        {availableEvents.map((event) => (
                          <button
                            key={event}
                            onClick={() => {
                              onFilterChange({ eventFilter: event });
                              setIsEventDropdownOpen(false);
                            }}
                            className={`w-full flex items-center gap-2 md:gap-3 p-2 md:p-3 text-left hover:bg-[var(--surface-elevated)] transition-colors border-b border-[var(--border)]/50 last:border-b-0 ${
                              event === filters.eventFilter
                                ? "bg-[var(--primary)]/20 border-[var(--primary)]/30"
                                : "bg-[var(--background)]"
                            }`}
                          >
                            <div className="w-6 h-6 bg-[var(--primary)] text-white rounded-lg flex items-center justify-center p-0.5 flex-shrink-0">
                              <Image
                                src={getEventIconPath(event)}
                                alt={EVENT_NAMES[event] || event}
                                width={16}
                                height={16}
                                className="w-full h-full object-contain brightness-0 invert"
                              />
                            </div>
                            <div className="font-medium text-[var(--text-primary)] font-statement">
                              {EVENT_NAMES[event] || event}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Active Filters Display */}
        {(filters.timeFilter !== "all" ||
          filters.eventFilter !== "all" ||
          filters.sessionFilter !== "all" ||
          filters.secondaryEventFilter) && (
          <div className="flex flex-wrap gap-2 pt-4 border-t border-[var(--border)]">
            <span className="text-sm text-[var(--text-muted)] py-1">
              Active filters:
            </span>

            {filters.timeFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--primary)] bg-opacity-20 text-[var(--text-primary)] rounded-md text-sm">
                {filters.timeFilter === "custom" && filters.customTimeRange
                  ? `${formatDate(filters.customTimeRange.startDate)} - ${formatDate(filters.customTimeRange.endDate)}`
                  : TIME_FILTER_OPTIONS.find(
                      (opt) => opt.value === filters.timeFilter
                    )?.label}
                <button
                  onClick={() =>
                    onFilterChange({
                      timeFilter: "all",
                      customTimeRange: undefined,
                    })
                  }
                  className="ml-1 hover:bg-[var(--primary)] hover:bg-opacity-30 rounded-full w-4 h-4 flex items-center justify-center text-[var(--text-primary)]"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.sessionFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--success)] bg-opacity-20 text-[var(--text-primary)] rounded-md text-sm">
                {selectedSession?.name || "Session"}
                <button
                  onClick={() =>
                    onFilterChange({
                      sessionFilter: "all",
                      secondaryEventFilter: undefined,
                    })
                  }
                  className="ml-1 hover:bg-[var(--success)] hover:bg-opacity-30 rounded-full w-4 h-4 flex items-center justify-center text-[var(--text-primary)]"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.secondaryEventFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--accent)] bg-opacity-20 text-[var(--text-primary)] rounded-md text-sm">
                {EVENT_NAMES[filters.secondaryEventFilter] ||
                  filters.secondaryEventFilter}
                <button
                  onClick={() =>
                    onFilterChange({ secondaryEventFilter: undefined })
                  }
                  className="ml-1 hover:bg-[var(--accent)] hover:bg-opacity-30 rounded-full w-4 h-4 flex items-center justify-center text-[var(--text-primary)]"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.eventFilter !== "all" &&
              filters.sessionFilter === "all" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--accent)] bg-opacity-20 text-[var(--text-primary)] rounded-md text-sm">
                  {EVENT_NAMES[filters.eventFilter] || filters.eventFilter}
                  <button
                    onClick={() => onFilterChange({ eventFilter: "all" })}
                    className="ml-1 hover:bg-[var(--accent)] hover:bg-opacity-30 rounded-full w-4 h-4 flex items-center justify-center text-[var(--text-primary)]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

            <button
              onClick={() =>
                onFilterChange({
                  timeFilter: "all",
                  eventFilter: "all",
                  sessionFilter: "all",
                  customTimeRange: undefined,
                  secondaryEventFilter: undefined,
                })
              }
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] underline py-1"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}