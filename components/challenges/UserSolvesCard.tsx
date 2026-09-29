"use client";

import { useState } from "react";
import { Clock, CircleCheck } from "lucide-react";
import {
  Badge,
  CollapsibleCard,
  EmptyState,
  StatTile,
  useCollapsed,
} from "@/components/ui";

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
  const { open: showSolves, onOpenChange: setShowSolves } = useCollapsed(
    "challenge-room-solves-expanded",
    true,
  );
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
    <CollapsibleCard
      title="Your Solves"
      open={showSolves}
      onOpenChange={setShowSolves}
      actions={
        <>
          <span className="type-caption">
            {solves.length} / {totalSolves}
          </span>
          {isCompleted && (
            <Badge tone="success" size="sm" shape="pill" icon={<CircleCheck />}>
              Complete
            </Badge>
          )}
        </>
      }
    >
      {/* Summary Stats */}
      {(isCompleted || solves.length >= 3) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-4">
          <StatTile
            size="sm"
            mobileLayout="row"
            tone="success"
            label="Best Single"
            value={
              bestSingle && bestSingle !== Infinity
                ? formatTime(bestSingle)
                : "--:--"
            }
          />
          <StatTile
            size="sm"
            mobileLayout="row"
            label={`${format.toUpperCase()} Average`}
            value={
              average && average !== Infinity ? formatTime(average) : "--:--"
            }
          />
        </div>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
          {/* Completed Solves */}
          {solves.map((solve, index) => (
            <div
              key={solve._id}
              className="bg-(--surface-elevated) rounded border border-(--border) p-3 hover:bg-(--surface-elevated)/80 transition-colors"
            >
              <div className="flex justify-between items-center">
                {/* Solve number and time */}
                <div
                  className="flex items-center gap-3 cursor-pointer flex-1"
                  onClick={() =>
                    setSelectedSolve(selectedSolve === index ? null : index)
                  }
                >
                  <span className="text-sm text-(--text-muted) font-inter">
                    #{solve.solveNumber}
                  </span>
                  <span
                    className={`font-mono text-lg font-semibold ${
                      solve.penalty === "+2"
                        ? "text-(--warning)"
                        : solve.penalty === "DNF"
                          ? "text-(--error)"
                          : "text-(--text-primary)"
                    }`}
                  >
                    {formatTime(solve.finalTime, solve.penalty)}
                    {solve.penalty === "+2" && "+"}
                  </span>
                  <span className="text-xs text-(--text-muted) font-inter">
                    {new Date(solve.solveDate).toLocaleTimeString()}
                  </span>
                </div>

                {/* Penalty indicators */}
                <div className="flex items-center gap-1 ml-2">
                  {solve.penalty === "+2" && (
                    <span className="px-2 py-1 text-xs rounded font-medium bg-(--warning)/15 text-(--warning) border border-(--warning)/30">
                      +2
                    </span>
                  )}
                  {solve.penalty === "DNF" && (
                    <span className="px-2 py-1 text-xs rounded font-medium bg-(--error)/15 text-(--error) border border-(--error)/30">
                      DNF
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {selectedSolve === index && (
                <div className="mt-3 pt-3 border-t border-(--border)">
                  <div className="bg-(--surface) border border-(--border) rounded-(--radius-control) p-3">
                    <h5 className="text-xs text-(--text-muted) uppercase tracking-wide font-inter mb-3">
                      Time Breakdown
                    </h5>
                    <div className="space-y-2 text-sm font-mono">
                      <div className="flex justify-between">
                        <span className="text-(--text-secondary)">
                          Raw Time:
                        </span>
                        <span className="text-(--text-primary)">
                          {formatTime(solve.time)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-(--text-secondary)">
                          Penalty:
                        </span>
                        <span
                          className={
                            solve.penalty === "+2"
                              ? "text-(--warning)"
                              : solve.penalty === "DNF"
                                ? "text-(--error)"
                                : "text-(--text-primary)"
                          }
                        >
                          {solve.penalty === "none" ? "None" : solve.penalty}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-(--border)">
                        <span className="text-(--text-secondary) font-semibold">
                          Final Time:
                        </span>
                        <span className="text-(--text-primary) font-semibold">
                          {formatTime(solve.finalTime, solve.penalty)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Comment */}
                  {solve.comment && (
                    <div className="mt-3 bg-(--surface) border border-(--border) rounded-(--radius-control) p-3">
                      <h5 className="text-xs text-(--text-muted) uppercase tracking-wide font-inter mb-2">
                        Comment
                      </h5>
                      <p className="text-sm text-(--text-secondary)">
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
                        ? "border-(--primary) bg-(--primary)/5"
                        : "border-dashed border-(--border) bg-(--surface-elevated)/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-(--text-muted) font-inter">
                        #{solves.length + i + 1}
                      </span>
                      <span className="font-mono text-lg text-(--text-muted)">
                        {solves.length + i === currentSolveIndex
                          ? "---"
                          : "--:--"}
                      </span>
                      {solves.length + i === currentSolveIndex && (
                        <span className="text-xs text-(--primary) font-medium">
                          Current
                        </span>
                      )}
                    </div>
                  </div>
                )
              )}
              {totalSolves - solves.length > 3 && (
                <div className="text-center py-2">
                  <span className="text-xs text-(--text-muted) font-inter">
                    ...and {totalSolves - solves.length - 3} more solve
                    {totalSolves - solves.length - 3 !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          )}

          {solves.length === 0 && (
            <EmptyState
              icon={<Clock />}
              title="No solves recorded yet"
              description="Complete solves to see them here"
            />
          )}
      </div>
    </CollapsibleCard>
  );
}