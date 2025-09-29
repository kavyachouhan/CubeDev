"use client";

import { useState } from "react";
import { Eye, EyeOff, Clock, CircleCheck } from "lucide-react";

interface RoomSolve {
  _id: string;
  solveNumber: number;
  time: number;
  penalty: "none" | "+2" | "DNF";
  finalTime: number;
  solveDate: number;
  comment?: string;
}

interface UserSolvesCardProps {
  solves: RoomSolve[];
  totalSolves: number;
  format: "ao5" | "ao12";
  currentSolveIndex: number;
  isCompleted: boolean;
  bestSingle?: number;
  average?: number;
}

export default function UserSolvesCard({
  solves,
  totalSolves,
  format,
  currentSolveIndex,
  isCompleted,
  bestSingle,
  average,
}: UserSolvesCardProps) {
  const [showSolves, setShowSolves] = useState(true);
  const [selectedSolve, setSelectedSolve] = useState<number | null>(null);

  // Format time function
  const formatTime = (
    timeMs: number,
    penalty: "none" | "+2" | "DNF" = "none"
  ) => {
    if (penalty === "DNF" || timeMs === Infinity || timeMs === 0) return "DNF";
    const seconds = timeMs / 1000;
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return mins > 0 ? `${mins}:${secs.padStart(5, "0")}` : secs;
  };

  return (
    <div className="timer-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement">
          Your Solves
        </h3>
        <div className="flex items-center gap-2">
          <div className="text-sm text-[var(--text-muted)] font-inter">
            {solves.length} / {totalSolves}
          </div>
          {isCompleted && (
            <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
              <CircleCheck className="w-3 h-3 text-green-500" />
              <span className="text-xs text-green-500 font-medium font-inter">
                Complete
              </span>
            </div>
          )}
          <button
            onClick={() => setShowSolves(!showSolves)}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
            title={showSolves ? "Hide solves" : "Show solves"}
          >
            {showSolves ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {(isCompleted || solves.length >= 3) && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-3">
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-inter mb-1">
              Best Single
            </div>
            <div className="text-lg font-mono font-bold text-green-500">
              {bestSingle && bestSingle !== Infinity
                ? formatTime(bestSingle)
                : "--:--"}
            </div>
          </div>
          <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-3">
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-inter mb-1">
              {format.toUpperCase()} Average
            </div>
            <div className="text-lg font-mono font-bold text-[var(--text-primary)]">
              {average && average !== Infinity ? formatTime(average) : "--:--"}
            </div>
          </div>
        </div>
      )}

      {showSolves && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {/* Completed Solves */}
          {solves.map((solve, index) => (
            <div
              key={solve._id}
              className="bg-[var(--surface-elevated)] rounded border border-[var(--border)] p-3 hover:bg-[var(--surface-elevated)]/80 transition-colors"
            >
              <div className="flex justify-between items-center">
                {/* Solve number and time */}
                <div
                  className="flex items-center gap-3 cursor-pointer flex-1"
                  onClick={() =>
                    setSelectedSolve(selectedSolve === index ? null : index)
                  }
                >
                  <span className="text-sm text-[var(--text-muted)] font-inter">
                    #{solve.solveNumber}
                  </span>
                  <span
                    className={`font-mono text-lg font-semibold ${
                      solve.penalty === "+2"
                        ? "text-yellow-400"
                        : solve.penalty === "DNF"
                          ? "text-red-400"
                          : "text-[var(--text-primary)]"
                    }`}
                  >
                    {formatTime(solve.finalTime, solve.penalty)}
                    {solve.penalty === "+2" && "+"}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] font-inter">
                    {new Date(solve.solveDate).toLocaleTimeString()}
                  </span>
                </div>

                {/* Penalty indicators */}
                <div className="flex items-center gap-1 ml-2">
                  {solve.penalty === "+2" && (
                    <span className="px-2 py-1 text-xs rounded font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                      +2
                    </span>
                  )}
                  {solve.penalty === "DNF" && (
                    <span className="px-2 py-1 text-xs rounded font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                      DNF
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {selectedSolve === index && (
                <div className="mt-3 pt-3 border-t border-[var(--border)]">
                  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3">
                    <h5 className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-inter mb-3">
                      Time Breakdown
                    </h5>
                    <div className="space-y-2 text-sm font-mono">
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">
                          Raw Time:
                        </span>
                        <span className="text-[var(--text-primary)]">
                          {formatTime(solve.time)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">
                          Penalty:
                        </span>
                        <span
                          className={
                            solve.penalty === "+2"
                              ? "text-yellow-400"
                              : solve.penalty === "DNF"
                                ? "text-red-400"
                                : "text-[var(--text-primary)]"
                          }
                        >
                          {solve.penalty === "none" ? "None" : solve.penalty}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-[var(--border)]">
                        <span className="text-[var(--text-secondary)] font-semibold">
                          Final Time:
                        </span>
                        <span className="text-[var(--text-primary)] font-semibold">
                          {formatTime(solve.finalTime, solve.penalty)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Comment */}
                  {solve.comment && (
                    <div className="mt-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3">
                      <h5 className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-inter mb-2">
                        Comment
                      </h5>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {solve.comment}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Placeholder for remaining solves */}
          {!isCompleted && (
            <div className="space-y-2">
              {Array.from(
                { length: Math.min(3, totalSolves - solves.length) },
                (_, i) => (
                  <div
                    key={`placeholder-${i}`}
                    className={`rounded border p-3 transition-colors ${
                      solves.length + i === currentSolveIndex
                        ? "border-[var(--primary)] bg-[var(--primary)]/5"
                        : "border-dashed border-[var(--border)] bg-[var(--surface-elevated)]/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-[var(--text-muted)] font-inter">
                        #{solves.length + i + 1}
                      </span>
                      <span className="font-mono text-lg text-[var(--text-muted)]">
                        {solves.length + i === currentSolveIndex
                          ? "---"
                          : "--:--"}
                      </span>
                      {solves.length + i === currentSolveIndex && (
                        <span className="text-xs text-[var(--primary)] font-medium">
                          Current
                        </span>
                      )}
                    </div>
                  </div>
                )
              )}
              {totalSolves - solves.length > 3 && (
                <div className="text-center py-2">
                  <span className="text-xs text-[var(--text-muted)] font-inter">
                    ...and {totalSolves - solves.length - 3} more solve
                    {totalSolves - solves.length - 3 !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          )}

          {solves.length === 0 && (
            <div className="text-center py-8 text-[var(--text-muted)]">
              <Clock className="w-8 h-8 mx-auto mb-2 text-[var(--text-muted)] opacity-50" />
              <p className="text-sm">No solves recorded yet</p>
              <p className="text-xs mt-1">Complete solves to see them here</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}