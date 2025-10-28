"use client";

import { useState, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  RotateCcw,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

interface ScrambleDisplayProps {
  scramble: string;
  onNewScramble: () => void;
  onPartialScrambleHover?: (partialScramble: string) => void;
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
  onPartialScrambleHover,
}: ScrambleDisplayProps) {
  const [isExpanded, setIsExpanded] = usePersistentBool(
    "cubelab-scramble-display-expanded",
    true
  );

  // State to track hovered/tapped move for partial scramble preview
  const [hoveredMoveIndex, setHoveredMoveIndex] = useState<number | null>(null);
  const [tappedMoveIndex, setTappedMoveIndex] = useState<number | null>(null);

  // Scramble history management
  const [currentScramble, setCurrentScramble] = useState<string>(scramble);
  const [previousScramble, setPreviousScramble] = useState<string | null>(null);
  const [isAtCurrent, setIsAtCurrent] = useState<boolean>(true);

  // Update scrambles when new scramble prop is received
  useEffect(() => {
    // Only update if we're at the current scramble and the scramble has actually changed
    if (isAtCurrent && scramble !== currentScramble) {
      setPreviousScramble(currentScramble);
      setCurrentScramble(scramble);
    }
  }, [scramble, isAtCurrent, currentScramble]);

  // Handle going to previous scramble
  const handlePrevious = () => {
    if (previousScramble) {
      setIsAtCurrent(false);
      if (onPartialScrambleHover) {
        onPartialScrambleHover(previousScramble);
      }
    }
  };

  // Handle going to next scramble or generating new scramble
  const handleNext = () => {
    if (!isAtCurrent) {
      // Go to current scramble
      setIsAtCurrent(true);
      if (onPartialScrambleHover) {
        onPartialScrambleHover(currentScramble);
      }
    } else {
      // Generate new scramble
      onNewScramble();
    }
  };

  // Determine which scramble to display
  const displayScramble = isAtCurrent
    ? currentScramble
    : previousScramble || currentScramble;

  // Parsed moves
  const moves = useMemo(
    () => displayScramble.trim().split(/\s+/).filter(Boolean),
    [displayScramble]
  );

  // State to track if body is visible (for accessibility and to avoid layout shift)
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

  // Handlers for hovering/tapping moves
  const handleMoveHover = (index: number) => {
    // Don't override tap state with hover on mobile
    if (tappedMoveIndex !== null) return;

    setHoveredMoveIndex(index);
    if (onPartialScrambleHover) {
      const partialScramble = moves.slice(0, index + 1).join(" ");
      onPartialScrambleHover(partialScramble);
    }
  };

  const handleMoveLeave = () => {
    // Don't override tap state with hover on mobile
    if (tappedMoveIndex !== null) return;

    setHoveredMoveIndex(null);
    if (onPartialScrambleHover) {
      onPartialScrambleHover(displayScramble);
    }
  };

  const handleMoveTap = (
    index: number,
    e: React.MouseEvent | React.TouchEvent
  ) => {
    // Prevent event from bubbling to timer
    e.stopPropagation();

    // Toggle tap state
    if (tappedMoveIndex === index) {
      setTappedMoveIndex(null);
      setHoveredMoveIndex(null);
      if (onPartialScrambleHover) {
        onPartialScrambleHover(displayScramble);
      }
    } else {
      setTappedMoveIndex(index);
      setHoveredMoveIndex(null);
      if (onPartialScrambleHover) {
        const partialScramble = moves.slice(0, index + 1).join(" ");
        onPartialScrambleHover(partialScramble);
      }
    }
  };

  // Handlers for background interaction to reset tapped move
  const handleBackgroundInteraction = (
    e: React.MouseEvent | React.TouchEvent
  ) => {
    // Prevent event from bubbling to timer
    if (e.target === e.currentTarget && tappedMoveIndex !== null) {
      e.stopPropagation();
      setTappedMoveIndex(null);
      if (onPartialScrambleHover) {
        onPartialScrambleHover(displayScramble);
      }
    }
  };

  // Reset hovered/tapped move on scramble change
  useEffect(() => {
    setTappedMoveIndex(null);
    setHoveredMoveIndex(null);
  }, [displayScramble]);
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
        <button
          onClick={toggleExpanded}
          className="flex items-center gap-1 p-2 text-[var(--text-muted)] hover:text-[var(--primary)] rounded transition-colors"
          title={isExpanded ? "Hide scramble" : "Show scramble"}
        >
          <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement hover:text-[var(--primary)] transition-colors">
            Scramble
          </h3>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        <div className="flex items-center gap-2">
          {/* Previous scramble button */}
          <button
            onClick={handlePrevious}
            disabled={!previousScramble}
            className={`p-1.5 rounded-md transition-colors ${
              previousScramble
                ? "text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--surface-elevated)]"
                : "text-[var(--text-muted)] opacity-50 cursor-not-allowed"
            }`}
            title={
              previousScramble
                ? "Go to previous scramble"
                : "No previous scramble"
            }
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Next/New scramble button */}
          <button
            onClick={handleNext}
            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--surface-elevated)] rounded-md transition-colors"
            title={
              isAtCurrent ? "Generate new scramble" : "Go to current scramble"
            }
          >
            {isAtCurrent ? (
              <RotateCcw className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {/* Expand/collapse button */}
          <button
            onClick={toggleExpanded}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-md transition-colors"
            title={isExpanded ? "Hide scramble" : "Show scramble"}
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
        <div
          className="p-3 sm:p-4 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]"
          onClick={handleBackgroundInteraction}
          onTouchEnd={handleBackgroundInteraction}
        >
          <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center items-center leading-relaxed">
            {moves.map((move, index) => {
              const isHovered = hoveredMoveIndex === index;
              const isTapped = tappedMoveIndex === index;
              const isActive = isHovered || isTapped;
              const isBeforeActive =
                hoveredMoveIndex !== null && index <= hoveredMoveIndex;
              const isBeforeTapped =
                tappedMoveIndex !== null && index <= tappedMoveIndex;

              return (
                <span
                  key={index}
                  className={`
                    text-base sm:text-lg font-mono transition-all duration-200 cursor-pointer
                    px-1.5 sm:px-2 py-0.5 sm:py-1 rounded select-none
                    ${
                      isActive
                        ? "bg-[var(--primary)] text-white scale-105 sm:scale-110 shadow-md"
                        : isBeforeActive || isBeforeTapped
                          ? "text-[var(--primary)] bg-[var(--surface)] font-semibold"
                          : "text-[var(--text-primary)] hover:text-[var(--primary)] hover:bg-[var(--surface)] active:scale-95"
                    }
                  `}
                  onMouseEnter={() => handleMoveHover(index)}
                  onMouseLeave={handleMoveLeave}
                  onClick={(e) => {
                    handleMoveTap(index, e);
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    handleMoveTap(index, e);
                  }}
                  title="Hover or tap to preview scramble up to this move"
                >
                  {move}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}