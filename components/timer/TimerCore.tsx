"use client";

import { ReactNode } from "react";

type TimerState =
  | "idle"
  | "inspection"
  | "ready"
  | "running"
  | "stopped"
  | "holding";

interface TimerCoreProps {
  state: TimerState;
  time: number;
  inspectionTime: number;
  currentPenalty: "none" | "+2" | "DNF";
  children?: ReactNode;
  onTouchStart: (e: React.TouchEvent | React.MouseEvent) => void;
  onTouchEnd: (e: React.TouchEvent | React.MouseEvent) => void;
  onMouseDown: (e: React.TouchEvent | React.MouseEvent) => void;
  onMouseUp: (e: React.TouchEvent | React.MouseEvent) => void;
}

export default function TimerCore({
  state,
  time,
  inspectionTime,
  currentPenalty,
  children,
  onTouchStart,
  onTouchEnd,
  onMouseDown,
  onMouseUp,
}: TimerCoreProps) {
  // Format time
  const formatTime = (timeMs: number) => {
    if (timeMs === Infinity) return "DNF";
    const seconds = timeMs / 1000;
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return mins > 0 ? `${mins}:${secs.padStart(5, "0")}` : secs;
  };

  // Get display time with penalty applied
  const getDisplayTime = () => {
    if (currentPenalty === "DNF") {
      return "DNF";
    } else if (currentPenalty === "+2") {
      return formatTime(time + 2000); // add 2 seconds
    } else {
      return formatTime(time);
    }
  };

  // Get timer color based on state
  const getTimerColor = () => {
    switch (state) {
      case "holding":
        return "text-[var(--warning)]";
      case "inspection":
        if (inspectionTime <= 3) return "text-[var(--timer-running)]";
        if (inspectionTime <= 8) return "text-[var(--warning)]";
        return "text-[var(--timer-ready)]";
      case "ready":
        return "text-[var(--timer-ready)]";
      case "running":
        return "text-[var(--timer-running)]";
      case "stopped":
        return "text-[var(--primary)]";
      default:
        return "text-[var(--text-muted)]";
    }
  };

  // Get status text based on state
  const getStatusText = () => {
    switch (state) {
      case "idle":
        return "Hold SPACE or touch and hold timer, then release to start";
      case "holding":
        return "Release to start inspection";
      case "inspection":
        return "Get ready... (Hold SPACE/touch for timer)";
      case "ready":
        return "Release to start";
      case "running":
        return "Solving... (any key or touch to stop)";
      case "stopped":
        return "Great solve! (SPACE or touch for next)";
    }
  };

  return (
    <div
      className="text-center space-y-6 min-h-[280px] sm:min-h-[320px] md:min-h-[360px] flex flex-col justify-center"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onContextMenu={(e) => e.preventDefault()} // Disable context menu on long press
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        touchAction: "none", // Disable double-tap to zoom
      }}
    >
      {/* Main Timer Display */}
      <div
        className={`font-bold timer-text ${getTimerColor()} transition-all duration-300 font-mono cursor-pointer select-none py-4`}
      >
        {state === "inspection"
          ? `${inspectionTime.toFixed(2)}`
          : getDisplayTime()}
      </div>

      {children}

      {/* Penalty Indicator */}
      {currentPenalty !== "none" && state === "stopped" && (
        <div
          className={`text-xs font-semibold px-2 py-1 rounded-full transition-all duration-300 ${
            currentPenalty === "+2"
              ? "bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/30"
              : "bg-[var(--error)]/10 text-[var(--error)] border border-[var(--error)]/30"
          }`}
        >
          {currentPenalty === "+2" ? "+2 Penalty Applied" : "DNF Applied"}
        </div>
      )}

      {/* Status Text */}
      <div className="text-sm text-[var(--text-secondary)] font-inter select-none">
        {getStatusText()}
      </div>
    </div>
  );
}