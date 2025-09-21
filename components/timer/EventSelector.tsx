"use client";

import { useState, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

interface EventSelectorProps {
  selectedEvent: string;
  onEventChange: (event: string) => void;
  solveHistory?: Array<{
    event: string;
    sessionId: string;
    [key: string]: any;
  }>;
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
    } catch {}
  }, [key, state]);
  return [state, setState] as const;
}

export default function EventSelector({
  selectedEvent,
  onEventChange,
  solveHistory = [],
  currentSessionId,
}: EventSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const [isExpanded, setIsExpanded] = usePersistentBool(
    "cubelab-event-selector-expanded",
    true
  );

  // Body visibility state (for accessibility and to prevent interaction when collapsed)
  const [isBodyVisible, setIsBodyVisible] = useState<boolean>(isExpanded);

  // Refs to measure heights
  const cardRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      const bodyH = body.scrollHeight; // use scrollHeight to get full height even if not visible

      return {
        collapsed: Math.ceil(headerH + padY),
        expanded: Math.ceil(headerH + bodyH + padY),
      };
    },
    []
  );

  // Initial layout
  useLayoutEffect(() => {
    const { collapsed, expanded } = measureHeights();
    setMaxH(isExpanded ? expanded : collapsed);
    setIsBodyVisible(isExpanded);
  }, []);

  // Adjust max height on expand/collapse or content change
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
  }, [isExpanded, selectedEvent, measureHeights]);

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
      // collapsing: hide content first, then shrink
      setIsBodyVisible(false);
      setIsExpanded(false);
    } else {
      // expanding: grow first, then show content after transition
      setIsExpanded(true);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", onDoc);
      return () => document.removeEventListener("mousedown", onDoc);
    }
  }, [isOpen]);

  // Get icon path for event
  const getEventIconPath = (eventId: string) => {
    // Map of event IDs to icon filenames
    const iconMap: { [key: string]: string } = {
      "333": "333.svg",
      "222": "222.svg",
      "444": "444.svg",
      "555": "555.svg",
      "666": "666.svg",
      "777": "777.svg",
      "333oh": "333oh.svg",
      "333bld": "333bf.svg",
      "444bld": "444bf.svg",
      "555bld": "555bf.svg",
      "333mbld": "333mbf.svg",
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

  const events = [
    { id: "333", name: "3x3", category: "WCA" },
    { id: "222", name: "2x2", category: "WCA" },
    { id: "444", name: "4x4", category: "WCA" },
    { id: "555", name: "5x5", category: "WCA" },
    { id: "666", name: "6x6", category: "WCA" },
    { id: "777", name: "7x7", category: "WCA" },
    { id: "333oh", name: "3x3 OH", category: "WCA" },
    { id: "pyram", name: "Pyraminx", category: "WCA" },
    { id: "minx", name: "Megaminx", category: "WCA" },
    { id: "skewb", name: "Skewb", category: "WCA" },
    { id: "clock", name: "Clock", category: "WCA" },
    { id: "sq1", name: "Square-1", category: "WCA" },
    { id: "333bld", name: "3x3 BLD", category: "WCA" },
    { id: "444bld", name: "4x4 BLD", category: "WCA" },
    { id: "555bld", name: "5x5 BLD", category: "WCA" },
    { id: "333mbld", name: "3x3 MBLD", category: "WCA" },
    { id: "333fm", name: "3x3 FM", category: "WCA" },
  ];

  // Get solve count for event in current session
  const getSolveCount = (eventId: string) => {
    if (!currentSessionId) return 0;
    return solveHistory.filter(
      (solve) => solve.event === eventId && solve.sessionId === currentSessionId
    ).length;
  };

  const selectedEventData =
    events.find((e) => e.id === selectedEvent) || events[0];

  return (
    <div
      ref={cardRef}
      className={[
        "timer-card",
        "transition-[max-height] duration-300 ease-in-out",
        isOpen ? "relative z-[60]" : "",
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
        <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement">
          Event
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleExpanded}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-md transition-colors"
            title={isExpanded ? "Hide event details" : "Show event details"}
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
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between p-2 md:p-3 bg-[var(--surface-elevated)] hover:bg-[var(--surface-elevated)]/80 rounded-lg border border-[var(--border)] transition-colors"
          >
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 bg-[var(--primary)] text-white rounded-lg flex items-center justify-center p-1">
                <Image
                  src={getEventIconPath(selectedEventData.id)}
                  alt={selectedEventData.name}
                  width={24}
                  height={24}
                  className="w-full h-full object-contain brightness-0 invert"
                />
              </div>
              <div className="text-left">
                <div className="font-medium text-[var(--text-primary)] font-statement">
                  {selectedEventData.name}
                </div>
                <div className="text-xs text-[var(--text-muted)] font-inter">
                  {getSolveCount(selectedEventData.id)} solves
                </div>
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-[var(--text-secondary)] transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl z-[9999] max-h-64 overflow-y-auto">
              {events.map((event) => (
                <button
                  key={event.id}
                  onClick={() => {
                    console.log("Event clicked:", event.id);
                    onEventChange(event.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 md:gap-3 p-2 md:p-3 text-left hover:bg-[var(--surface-elevated)] transition-colors ${
                    event.id === selectedEvent
                      ? "bg-[var(--primary)]/20 border-[var(--primary)]/30"
                      : "bg-[var(--background)]"
                  }`}
                >
                  <div className="w-8 h-8 bg-[var(--primary)] text-white rounded-lg flex items-center justify-center p-1">
                    <Image
                      src={getEventIconPath(event.id)}
                      alt={event.name}
                      width={24}
                      height={24}
                      className="w-full h-full object-contain brightness-0 invert"
                    />
                  </div>
                  <div>
                    <div className="font-medium text-[var(--text-primary)] font-statement">
                      {event.name}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] font-inter">
                      {getSolveCount(event.id)} solves
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}