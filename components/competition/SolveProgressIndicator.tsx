"use client";

import { Check, X, AlertTriangle } from "lucide-react";
import { SolveResult } from "./CompetitionDetail";

interface SolveProgressIndicatorProps {
  currentSolve: number;
  totalSolves: number;
  solves: SolveResult[];
  orientation?: "horizontal" | "vertical";
  size?: "sm" | "md" | "lg";
  variant?: "dots" | "cards" | "status"; // status = larger indicators without times
}

export default function SolveProgressIndicator({
  currentSolve,
  totalSolves,
  solves,
  orientation = "horizontal",
  size = "md",
  variant = "dots",
}: SolveProgressIndicatorProps) {
  // Format time display
  const formatTime = (ms: number): string => {
    if (ms === Infinity) return "DNF";
    const seconds = Math.floor(ms / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
    }
    return `${remainingSeconds}.${centiseconds.toString().padStart(2, "0")}`;
  };

  // Get display time with penalty
  const getDisplayTime = (solve: SolveResult): string => {
    if (solve.penalty === "DNF") return "DNF";
    let time = solve.time;
    if (solve.penalty === "+2" || solve.inspectionViolation === "+2") {
      time += 2000;
    }
    return (
      formatTime(time) +
      (solve.penalty === "+2" || solve.inspectionViolation === "+2" ? "+" : "")
    );
  };

  // Get dot size classes
  const getDotSize = () => {
    switch (size) {
      case "sm":
        return "w-2 h-2";
      case "lg":
        return "w-4 h-4";
      default:
        return "w-3 h-3";
    }
  };

  // Get card size classes
  const getCardSize = () => {
    switch (size) {
      case "sm":
        return "p-2";
      case "lg":
        return "p-4";
      default:
        return "p-3";
    }
  };

  // Simple dots indicator (for compact view)
  const renderDots = () => (
    <div
      className={`flex ${orientation === "vertical" ? "flex-col" : "flex-row"} gap-2 items-center justify-center`}
    >
      {Array.from({ length: totalSolves }).map((_, idx) => {
        const solve = solves[idx];
        const isCompleted = idx < solves.length;
        const isCurrent = idx === currentSolve;

        let bgColor = "bg-(--surface-elevated)";
        if (isCompleted) {
          if (solve?.penalty === "DNF") {
            bgColor = "bg-(--error)";
          } else if (
            solve?.penalty === "+2" ||
            solve?.inspectionViolation === "+2"
          ) {
            bgColor = "bg-(--warning)";
          } else {
            bgColor = "bg-(--success)";
          }
        } else if (isCurrent) {
          bgColor = "bg-(--primary)";
        }

        return (
          <div
            key={idx}
            className={`${getDotSize()} rounded-full ${bgColor} transition-colors duration-200`}
            title={
              isCompleted
                ? `Solve ${idx + 1}: ${getDisplayTime(solve!)}`
                : `Solve ${idx + 1}`
            }
          />
        );
      })}
    </div>
  );

  // Detailed cards indicator (for expanded view)
  const renderCards = () => (
    <div
      className={`grid ${orientation === "vertical" ? "grid-cols-1 gap-2" : "grid-cols-5 gap-2 sm:gap-3"}`}
    >
      {Array.from({ length: totalSolves }).map((_, idx) => {
        const solve = solves[idx];
        const isCompleted = idx < solves.length;
        const isCurrent = idx === currentSolve;

        let cardStyles = "bg-(--surface-elevated) border-(--border)";
        let textStyles = "text-(--text-muted)";

        if (isCompleted) {
          if (solve?.penalty === "DNF") {
            cardStyles = "bg-(--error)/10 border-(--error)/30";
            textStyles = "text-(--error)";
          } else if (
            solve?.penalty === "+2" ||
            solve?.inspectionViolation === "+2"
          ) {
            cardStyles = "bg-(--warning)/10 border-(--warning)/30";
            textStyles = "text-(--warning)";
          } else {
            cardStyles = "bg-(--success)/10 border-(--success)/30";
            textStyles = "text-(--success)";
          }
        } else if (isCurrent) {
          cardStyles = "bg-(--primary)/10 border-(--primary)/30";
          textStyles = "text-(--primary)";
        }

        return (
          <div
            key={idx}
            className={`${getCardSize()} rounded-lg border ${cardStyles} text-center transition-all duration-200`}
          >
            <div className="text-xs text-(--text-muted) mb-0.5">
              #{idx + 1}
            </div>
            <div className={`font-mono font-medium text-sm ${textStyles}`}>
              {isCompleted
                ? getDisplayTime(solve!)
                : isCurrent
                  ? "--:--"
                  : "--"}
            </div>
          </div>
        );
      })}
    </div>
  );

  // Status indicators - larger icons without times (for Round Progress on desktop)
  const renderStatus = () => (
    <div
      className={`flex ${orientation === "vertical" ? "flex-col" : "flex-row"} gap-3 items-center justify-center`}
    >
      {Array.from({ length: totalSolves }).map((_, idx) => {
        const solve = solves[idx];
        const isCompleted = idx < solves.length;
        const isCurrent = idx === currentSolve;

        let bgColor = "bg-(--surface-elevated) border-(--border)";
        let iconColor = "text-(--text-muted)";
        let Icon = null;

        if (isCompleted) {
          if (solve?.penalty === "DNF") {
            bgColor = "bg-(--error)/10 border-(--error)/30";
            iconColor = "text-(--error)";
            Icon = X;
          } else if (
            solve?.penalty === "+2" ||
            solve?.inspectionViolation === "+2"
          ) {
            bgColor = "bg-(--warning)/10 border-(--warning)/30";
            iconColor = "text-(--warning)";
            Icon = AlertTriangle;
          } else {
            bgColor = "bg-(--success)/10 border-(--success)/30";
            iconColor = "text-(--success)";
            Icon = Check;
          }
        } else if (isCurrent) {
          bgColor = "bg-(--primary)/10 border-(--primary)/30";
          iconColor = "text-(--primary)";
        }

        return (
          <div
            key={idx}
            className={`w-10 h-10 rounded-lg border ${bgColor} flex items-center justify-center transition-all duration-200`}
            title={
              isCompleted
                ? `Solve ${idx + 1}: ${getDisplayTime(solve!)}`
                : `Solve ${idx + 1}`
            }
          >
            {Icon ? (
              <Icon className={`w-5 h-5 ${iconColor}`} />
            ) : (
              <span className={`text-sm font-medium ${iconColor}`}>
                {idx + 1}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="w-full">
      {/* Progress label */}
      <div className="text-center mb-3">
        <span className="text-xs text-(--text-muted)">
          Solve {Math.min(currentSolve + 1, totalSolves)}/{totalSolves}
        </span>
      </div>

      {/* Render based on variant */}
      {variant === "dots" && renderDots()}
      {variant === "cards" && renderCards()}
      {variant === "status" && renderStatus()}
    </div>
  );
}
