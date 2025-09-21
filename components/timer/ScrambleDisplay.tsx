"use client";

import { useState, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { RotateCcw, Eye, EyeOff } from "lucide-react";

interface ScrambleDisplayProps {
  scramble: string;
  onNewScramble: () => void;
}

// Persistent boolean that reads/writes localStorage on first render
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

export default function ScrambleDisplay({
  scramble,
  onNewScramble,
}: ScrambleDisplayProps) {
  const [isExpanded, setIsExpanded] = usePersistentBool(
    "cubelab-scramble-display-expanded",
    true
  );

  // Body visibility state (for accessibility and to prevent interaction during collapse)
  const [isBodyVisible, setIsBodyVisible] = useState<boolean>(isExpanded);

  // Refs to measure heights
  const cardRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Max height for smooth transition
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

  // Adjust max height on expand/collapse, scramble change, or resize
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
  }, [isExpanded, scramble, measureHeights]);

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
      // expanding: grow first, then show content
      setIsExpanded(true);
    }
  };
  return (
    <div
      ref={cardRef}
      className={[
        "timer-card",
        "transition-[max-height] duration-300 ease-in-out",
      ].join(" ")}
      style={{
        maxHeight: maxH ? `${maxH}px` : undefined,
        // Keep hidden during collapse AND during expand animation until reveal
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
          Scramble
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onNewScramble}
            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
            title="Generate new scramble"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={toggleExpanded}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-md transition-colors"
            title={
              isExpanded ? "Hide scramble details" : "Show scramble details"
            }
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
        <div className="p-4 bg-[var(--surface-elevated)] rounded-lg">
          <p className="text-lg font-mono text-[var(--text-primary)] text-center leading-relaxed">
            {scramble}
          </p>
        </div>
      </div>
    </div>
  );
}