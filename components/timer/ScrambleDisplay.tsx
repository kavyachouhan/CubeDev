"use client";

import { useState, useEffect, useMemo } from "react";
import { RotateCcw, ChevronRight, ChevronLeft } from "lucide-react";
import { CollapsibleCard, useCollapsed } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";

interface ScrambleDisplayProps {
  scramble: string;
  onNewScramble: () => void;
  onPartialScrambleHover?: (partialScramble: string) => void;
  onActiveScrambleChange?: (scramble: string) => void;
}

export default function ScrambleDisplay({
  scramble,
  onNewScramble,
  onPartialScrambleHover,
  onActiveScrambleChange,
}: ScrambleDisplayProps) {
  const { open: isExpanded, onOpenChange: setIsExpanded } = useCollapsed(
    "cubelab-scramble-display-expanded",
    true,
  );

  // State to track hovered/tapped move for partial scramble preview
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
    // that means a solve just completed with the previous scramble
    // The new scramble should replace the current scramble, and we should move to it
    if (!isAtCurrent && scramble !== currentScramble) {
      // Update scrambles
      setCurrentScramble(scramble);
      // Previous scramble stays the same
      // Move to the current (new) scramble automatically
      setIsAtCurrent(true);
      // Notify parent of the new active scramble
      if (onActiveScrambleChange) {
        onActiveScrambleChange(scramble);
      }
      if (onPartialScrambleHover) {
        onPartialScrambleHover(scramble);
      }
    }
    else if (isAtCurrent && scramble !== currentScramble) {
      setPreviousScramble(currentScramble);
      setCurrentScramble(scramble);
      // Notify parent of the new active scramble
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

  // Handle going to previous scramble
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

  // Handle going to next scramble or generating new scramble
  const handleNext = () => {
    if (!isAtCurrent) {
      // Go to current scramble
      setIsAtCurrent(true);
      if (onPartialScrambleHover) {
        onPartialScrambleHover(currentScramble);
      }
      if (onActiveScrambleChange) {
        onActiveScrambleChange(currentScramble);
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
    <CollapsibleCard
      title="Scramble"
      open={isExpanded}
      onOpenChange={setIsExpanded}
      actions={
        <>
          <IconButton
            size="sm"
            aria-label="Previous scramble"
            icon={<ChevronLeft />}
            onClick={handlePrevious}
            disabled={!previousScramble}
          />
          <IconButton
            size="sm"
            aria-label={isAtCurrent ? "New scramble" : "Back to current scramble"}
            icon={isAtCurrent ? <RotateCcw /> : <ChevronRight />}
            onClick={handleNext}
          />
        </>
      }
    >
        <div
          aria-label={`Scramble: ${displayScramble}`}
          className="p-3 sm:p-4 bg-(--surface-elevated) rounded-(--radius-panel) border border-(--border)"
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
                    text-base sm:text-lg type-time transition-[color,background-color,transform] duration-(--duration-base) cursor-pointer
                    px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-(--radius-badge) select-none
                    ${
                      isActive
                        ? "bg-(--primary) text-(--on-primary) scale-105 sm:scale-110"
                        : isBeforeActive || isBeforeTapped
                          ? "text-(--primary) bg-(--surface) font-semibold"
                          : "text-(--text-primary) hover:text-(--primary) hover:bg-(--surface) active:scale-95"
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
    </CollapsibleCard>
  );
}