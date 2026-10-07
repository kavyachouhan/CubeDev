"use client";

import { useState, useEffect, useMemo } from "react";
import { RotateCcw, ChevronRight, ChevronLeft } from "lucide-react";
import { cx } from "@/lib/cx";
import { CollapsibleCard, useCollapsed } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";

interface ScrambleDisplayProps {
  scramble: string;
  onNewScramble: () => void;
  onPartialScrambleHover?: (partialScramble: string) => void;
  onActiveScrambleChange?: (scramble: string) => void;
}

/**
 * Scramble state: which scramble is shown, and which move is being previewed.
 *
 * Split out from the card so a layout can place the moves and the prev/next
 * controls wherever it likes while sharing one source of truth.
 */
export function useScramble({
  scramble,
  onNewScramble,
  onPartialScrambleHover,
  onActiveScrambleChange,
}: ScrambleDisplayProps) {
  // Hovered/tapped move drives the partial scramble preview
  const [hoveredMoveIndex, setHoveredMoveIndex] = useState<number | null>(null);
  const [tappedMoveIndex, setTappedMoveIndex] = useState<number | null>(null);

  // Scramble history management
  const [currentScramble, setCurrentScramble] = useState<string>(scramble);
  const [previousScramble, setPreviousScramble] = useState<string | null>(null);
  const [isAtCurrent, setIsAtCurrent] = useState<boolean>(true);

  // Notify parent of initial active scramble on mount
  useEffect(() => {
    if (onActiveScrambleChange && scramble) {
      onActiveScrambleChange(scramble);
    }
  }, []);

  // Handle scramble prop changes
  useEffect(() => {
    // If we're viewing previous scramble and a new scramble comes in,
    // that means a solve just completed with the previous scramble.
    // The new scramble should replace the current scramble, and we move to it.
    if (!isAtCurrent && scramble !== currentScramble) {
      setCurrentScramble(scramble);
      // Previous scramble stays the same; jump forward to the new one
      setIsAtCurrent(true);
      if (onActiveScrambleChange) {
        onActiveScrambleChange(scramble);
      }
      if (onPartialScrambleHover) {
        onPartialScrambleHover(scramble);
      }
    } else if (isAtCurrent && scramble !== currentScramble) {
      setPreviousScramble(currentScramble);
      setCurrentScramble(scramble);
      if (onActiveScrambleChange) {
        onActiveScrambleChange(scramble);
      }
    }
  }, [
    scramble,
    isAtCurrent,
    currentScramble,
    onActiveScrambleChange,
    onPartialScrambleHover,
  ]);

  const handlePrevious = () => {
    if (previousScramble) {
      setIsAtCurrent(false);
      if (onPartialScrambleHover) {
        onPartialScrambleHover(previousScramble);
      }
      if (onActiveScrambleChange) {
        onActiveScrambleChange(previousScramble);
      }
    }
  };

  const handleNext = () => {
    if (!isAtCurrent) {
      // Back to the current scramble
      setIsAtCurrent(true);
      if (onPartialScrambleHover) {
        onPartialScrambleHover(currentScramble);
      }
      if (onActiveScrambleChange) {
        onActiveScrambleChange(currentScramble);
      }
    } else {
      onNewScramble();
    }
  };

  const displayScramble = isAtCurrent
    ? currentScramble
    : previousScramble || currentScramble;

  const moves = useMemo(
    () => displayScramble.trim().split(/\s+/).filter(Boolean),
    [displayScramble],
  );

  const handleMoveHover = (index: number) => {
    // Don't override tap state with hover on mobile
    if (tappedMoveIndex !== null) return;

    setHoveredMoveIndex(index);
    if (onPartialScrambleHover) {
      onPartialScrambleHover(moves.slice(0, index + 1).join(" "));
    }
  };

  const handleMoveLeave = () => {
    if (tappedMoveIndex !== null) return;

    setHoveredMoveIndex(null);
    if (onPartialScrambleHover) {
      onPartialScrambleHover(displayScramble);
    }
  };

  const handleMoveTap = (
    index: number,
    e: React.MouseEvent | React.TouchEvent,
  ) => {
    // Never let a move tap reach the timer
    e.stopPropagation();

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
        onPartialScrambleHover(moves.slice(0, index + 1).join(" "));
      }
    }
  };

  const handleBackgroundInteraction = (
    e: React.MouseEvent | React.TouchEvent,
  ) => {
    // Never let a background tap reach the timer
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

  return {
    displayScramble,
    moves,
    hoveredMoveIndex,
    tappedMoveIndex,
    hasPrevious: Boolean(previousScramble),
    isAtCurrent,
    handlePrevious,
    handleNext,
    handleMoveHover,
    handleMoveLeave,
    handleMoveTap,
    handleBackgroundInteraction,
  };
}

export type ScrambleController = ReturnType<typeof useScramble>;

/** The scramble moves, without any card chrome. */
export function ScrambleBody({
  controller,
  className,
  moveClassName,
}: {
  controller: ScrambleController;
  /** Replaces the default panel surface. */
  className?: string;
  /** Replaces the default move sizing. */
  moveClassName?: string;
}) {
  const {
    displayScramble,
    moves,
    hoveredMoveIndex,
    tappedMoveIndex,
    handleMoveHover,
    handleMoveLeave,
    handleMoveTap,
    handleBackgroundInteraction,
  } = controller;

  return (
    <div
      aria-label={`Scramble: ${displayScramble}`}
      className={
        className ??
        "p-3 sm:p-4 bg-(--surface-elevated) rounded-(--radius-panel) border border-(--border)"
      }
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
              className={cx(
                "type-time transition-[color,background-color,transform] duration-(--duration-base) cursor-pointer",
                "px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-(--radius-badge) select-none",
                moveClassName ?? "text-base sm:text-lg",
                isActive
                  ? "bg-(--primary) text-(--on-primary) scale-105 sm:scale-110"
                  : isBeforeActive || isBeforeTapped
                    ? "text-(--primary) bg-(--surface) font-semibold"
                    : "text-(--text-primary) hover:text-(--primary) hover:bg-(--surface) active:scale-95",
              )}
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
  );
}

/** Previous / new scramble buttons. */
export function ScrambleNavActions({
  controller,
  size = "sm",
}: {
  controller: ScrambleController;
  size?: "sm" | "md";
}) {
  const { hasPrevious, isAtCurrent, handlePrevious, handleNext } = controller;

  return (
    <>
      <IconButton
        size={size}
        aria-label="Previous scramble"
        icon={<ChevronLeft />}
        onClick={handlePrevious}
        disabled={!hasPrevious}
      />
      <IconButton
        size={size}
        aria-label={isAtCurrent ? "New scramble" : "Back to current scramble"}
        icon={isAtCurrent ? <RotateCcw /> : <ChevronRight />}
        onClick={handleNext}
      />
    </>
  );
}

export default function ScrambleDisplay(props: ScrambleDisplayProps) {
  const { open: isExpanded, onOpenChange: setIsExpanded } = useCollapsed(
    "cubelab-scramble-display-expanded",
    true,
  );
  const controller = useScramble(props);

  return (
    <CollapsibleCard
      title="Scramble"
      open={isExpanded}
      onOpenChange={setIsExpanded}
      actions={<ScrambleNavActions controller={controller} />}
    >
      <ScrambleBody controller={controller} />
    </CollapsibleCard>
  );
}
