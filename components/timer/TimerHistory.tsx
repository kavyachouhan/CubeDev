"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronDown,
  ChevronRight,
  Trash2,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import ScramblePreview to avoid loading heavy 3D library on initial load
const ScramblePreview = dynamic(() => import("./ScramblePreview"), {
  loading: () => (
    <div className="w-full h-32 bg-[var(--surface-elevated)] rounded-lg flex items-center justify-center">
      <div className="text-sm text-[var(--text-muted)]">Loading preview...</div>
    </div>
  ),
  ssr: false,
});

interface TimerRecord {
  id: string;
  time: number;
  timestamp: Date;
  scramble: string;
  penalty: "none" | "+2" | "DNF";
  finalTime: number;
  event: string;
  notes?: string;
  tags?: string[];
}

interface TimerHistoryProps {
  history: TimerRecord[];
  selectedEvent: string;
  onClearHistory: () => void;
  onApplyPenalty: (solveId: string, penalty: "none" | "+2" | "DNF") => void;
  onDeleteSolve: (solveId: string) => void;
  onUpdateSolve?: (solveId: string, notes?: string, tags?: string[]) => void;
}

// Map of event IDs to display names
const eventNames: Record<string, string> = {
  "333": "3x3",
  "222": "2x2",
  "444": "4x4",
  "555": "5x5",
  "666": "6x6",
  "777": "7x7",
  "333oh": "3x3 OH",
  pyram: "Pyraminx",
  minx: "Megaminx",
  skewb: "Skewb",
  clock: "Clock",
  sq1: "Square-1",
  "333bld": "3x3 BLD",
  "444bld": "4x4 BLD",
  "555bld": "5x5 BLD",
  "333mbld": "3x3 MBLD",
  "333fm": "3x3 FM",
};

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
  const setStateAndStore = (newState: boolean) => {
    setState(newState);
    try {
      localStorage.setItem(key, JSON.stringify(newState));
    } catch {}
  };
  return [state, setStateAndStore] as const;
}

// Modal component for solve details and editing
function SolveDetailsModal({
  solve,
  isOpen,
  onClose,
  onApplyPenalty,
  onDeleteSolve,
  onUpdateSolve,
}: {
  solve: TimerRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onApplyPenalty: (solveId: string, penalty: "none" | "+2" | "DNF") => void;
  onDeleteSolve: (solveId: string) => void;
  onUpdateSolve?: (solveId: string, notes?: string, tags?: string[]) => void;
}) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [tagsValue, setTagsValue] = useState("");

  // Sync local state when solve changes
  useEffect(() => {
    if (solve) {
      setNotesValue(solve.notes || "");
      setTagsValue(solve.tags?.join(", ") || "");
    }
  }, [solve]);

  if (!isOpen || !solve) return null;

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

  const getEventName = (eventId: string) => {
    return eventNames[eventId] || eventId;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement">
            Solve Details
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Time Display */}
          <div className="text-center">
            <div
              className={`text-3xl font-bold font-mono mb-2 ${
                solve.penalty === "+2"
                  ? "text-yellow-400"
                  : solve.penalty === "DNF"
                    ? "text-red-400"
                    : "text-[var(--text-primary)]"
              }`}
            >
              {formatTime(solve.finalTime, solve.penalty)}
              {solve.penalty === "+2" && "+"}
            </div>
            <div className="text-sm text-[var(--text-muted)] font-inter">
              {getEventName(solve.event)} • {solve.timestamp.toLocaleString()}
            </div>
          </div>

          {/* Time Breakdown */}
          <div className="bg-[var(--surface-elevated)] rounded-lg p-3">
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-inter mb-2">
              Time Breakdown
            </div>
            <div className="space-y-1 text-sm font-mono">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Raw Time:</span>
                <span className="text-[var(--text-primary)]">
                  {formatTime(solve.time, "none")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Penalty:</span>
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
              <div className="flex justify-between border-t border-[var(--border)] pt-1">
                <span className="text-[var(--text-secondary)] font-semibold">
                  Final Time:
                </span>
                <span className="text-[var(--text-primary)] font-semibold">
                  {formatTime(solve.finalTime, solve.penalty)}
                </span>
              </div>
            </div>
          </div>

          {/* Scramble */}
          <div>
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-inter mb-2">
              Scramble
            </div>
            <div className="text-sm font-mono text-[var(--text-secondary)] bg-[var(--background)] p-3 rounded border border-[var(--border)] mb-3">
              {solve.scramble}
            </div>

            {/* Scramble Preview */}
            <div className="bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]">
              <ScramblePreview scramble={solve.scramble} event={solve.event} />
            </div>
          </div>

          {/* Notes & Tags */}
          <div className="space-y-4">
            {/* Notes Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-inter">
                  Notes
                </div>
                <button
                  onClick={() => setEditingNotes(!editingNotes)}
                  className="text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium"
                >
                  {editingNotes ? "Cancel" : "Edit"}
                </button>
              </div>
              {editingNotes ? (
                <div className="space-y-2">
                  <textarea
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    placeholder="Add notes about this solve..."
                    className="w-full p-3 text-sm bg-[var(--background)] border border-[var(--border)] rounded resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                    rows={3}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setNotesValue(solve.notes || "");
                        setEditingNotes(false);
                      }
                      // Prevent spacebar from triggering timer events
                      if (e.key === " ") {
                        e.stopPropagation();
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onUpdateSolve?.(
                          solve.id,
                          notesValue,
                          tagsValue
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean)
                        );
                        setEditingNotes(false);
                      }}
                      className="px-3 py-1 text-xs bg-[var(--primary)] text-white rounded hover:bg-[var(--primary-hover)] font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setNotesValue(solve.notes || "");
                        setEditingNotes(false);
                      }}
                      className="px-3 py-1 text-xs bg-[var(--surface-elevated)] text-[var(--text-secondary)] rounded hover:bg-[var(--border)] font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-[var(--text-secondary)] bg-[var(--background)] p-3 rounded border border-[var(--border)] min-h-[60px]">
                  {solve.notes || (
                    <span className="text-[var(--text-muted)] italic">
                      No notes added
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Tags Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-inter">
                  Tags
                </div>
                <button
                  onClick={() => setEditingTags(!editingTags)}
                  className="text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium"
                >
                  {editingTags ? "Cancel" : "Edit"}
                </button>
              </div>
              {editingTags ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={tagsValue}
                    onChange={(e) => setTagsValue(e.target.value)}
                    placeholder="Add tags separated by commas..."
                    className="w-full p-3 text-sm bg-[var(--background)] border border-[var(--border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.stopPropagation();
                        onUpdateSolve?.(
                          solve.id,
                          notesValue,
                          tagsValue
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean)
                        );
                        setEditingTags(false);
                      }
                      if (e.key === "Escape") {
                        setEditingTags(false);
                        setTagsValue(solve.tags?.join(", ") || "");
                      }
                      // Prevent spacebar from triggering timer events
                      if (e.key === " ") {
                        e.stopPropagation();
                      }
                    }}
                  />
                  <div className="text-xs text-[var(--text-muted)]">
                    Separate tags with commas (e.g., "good scramble, new PB,
                    lucky")
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onUpdateSolve?.(
                          solve.id,
                          notesValue,
                          tagsValue
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean)
                        );
                        setEditingTags(false);
                      }}
                      className="px-3 py-1 text-xs bg-[var(--primary)] text-white rounded hover:bg-[var(--primary-hover)] font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setTagsValue(solve.tags?.join(", ") || "");
                        setEditingTags(false);
                      }}
                      className="px-3 py-1 text-xs bg-[var(--surface-elevated)] text-[var(--text-secondary)] rounded hover:bg-[var(--border)] font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-[var(--background)] p-3 rounded border border-[var(--border)] min-h-[40px]">
                  {solve.tags && solve.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {solve.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-[var(--primary)] bg-opacity-20 text-[var(--foregoround)] rounded-full font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[var(--text-muted)] italic text-sm">
                      No tags added
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <div>
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-inter mb-2">
                Penalty
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onApplyPenalty(solve.id, "none")}
                  className={`flex-1 px-3 py-2 text-sm rounded font-medium transition-colors ${
                    solve.penalty === "none"
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--border)]"
                  }`}
                >
                  OK
                </button>
                <button
                  onClick={() => onApplyPenalty(solve.id, "+2")}
                  className={`flex-1 px-3 py-2 text-sm rounded font-medium transition-colors ${
                    solve.penalty === "+2"
                      ? "bg-[var(--warning)] text-white"
                      : "bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--border)]"
                  }`}
                >
                  +2
                </button>
                <button
                  onClick={() => onApplyPenalty(solve.id, "DNF")}
                  className={`flex-1 px-3 py-2 text-sm rounded font-medium transition-colors ${
                    solve.penalty === "DNF"
                      ? "bg-[var(--error)] text-white"
                      : "bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--border)]"
                  }`}
                >
                  DNF
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                onDeleteSolve(solve.id);
                onClose();
              }}
              className="w-full px-3 py-2 bg-[var(--error)] hover:bg-red-600 text-white text-sm rounded font-medium transition-colors"
            >
              Delete Solve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TimerHistory({
  history,
  selectedEvent,
  onClearHistory,
  onApplyPenalty,
  onDeleteSolve,
  onUpdateSolve,
}: TimerHistoryProps) {
  const [showHistory, setShowHistory] = usePersistentBool(
    "cubelab-timer-history-expanded",
    true
  );
  const [selectedSolve, setSelectedSolve] = useState<TimerRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Infinite scroll state
  const [displayCount, setDisplayCount] = useState(20);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reset display count when event or history changes
  useEffect(() => {
    setDisplayCount(20);
  }, [selectedEvent, history.length]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || isLoading) return;

    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;

    // If scrolled near bottom, load more
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      const eventHistory = history.filter((r) => r.event === selectedEvent);

      // Only load more if there are more records to show
      if (displayCount < eventHistory.length) {
        setIsLoading(true);
        // Simulate loading delay for better UX
        setTimeout(() => {
          setDisplayCount((prev) => Math.min(prev + 20, eventHistory.length));
          setIsLoading(false);
        }, 200);
      }
    }
  }, [history, selectedEvent, displayCount, isLoading]);

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

  // Get event display name
  const getEventName = (eventId: string) => {
    return eventNames[eventId] || eventId;
  };

  // Handle solve click to open modal
  const handleSolveClick = (solve: TimerRecord) => {
    setSelectedSolve(solve);
    setIsModalOpen(true);
  };

  // Handle penalty change with modal update
  const handlePenaltyChange = (
    solveId: string,
    penalty: "none" | "+2" | "DNF"
  ) => {
    onApplyPenalty(solveId, penalty);
    // Update selected solve if it's the one being modified
    if (selectedSolve && selectedSolve.id === solveId) {
      const updatedSolve = { ...selectedSolve, penalty };
      // Recalculate finalTime based on new penalty
      if (penalty === "DNF") {
        updatedSolve.finalTime = Infinity;
      } else if (penalty === "+2") {
        updatedSolve.finalTime = selectedSolve.time + 2000;
      } else {
        updatedSolve.finalTime = selectedSolve.time;
      }
      setSelectedSolve(updatedSolve);
    }
  };

  // Handle solve update (notes/tags) with modal update
  const handleUpdateSolve = (
    solveId: string,
    notes?: string,
    tags?: string[]
  ) => {
    if (onUpdateSolve) {
      onUpdateSolve(solveId, notes, tags);
      // Update selected solve if it's the one being modified
      if (selectedSolve && selectedSolve.id === solveId) {
        setSelectedSolve({
          ...selectedSolve,
          notes: notes || "",
          tags: tags || [],
        });
      }
    }
  };

  const eventHistory = history.filter((r) => r.event === selectedEvent);

  return (
    <>
      <div className="timer-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-1 p-2 text-[var(--text-muted)] hover:text-[var(--primary)] rounded transition-colors"
                title={showHistory ? "Hide recent times" : "Show recent times"}
              >
                <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement hover:text-[var(--primary)] transition-colors">
                  Recent Times
                </h3>
                {showHistory ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {eventHistory.length > 0 && (
              <button
                onClick={onClearHistory}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--error)] transition-colors"
                title="Clear all times"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
              title={showHistory ? "Hide recent times" : "Show recent times"}
            >
              {showHistory ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {showHistory && (
          <div
            ref={scrollContainerRef}
            className="space-y-2 max-h-64 overflow-y-auto"
            onScroll={handleScroll}
          >
            {eventHistory.slice(0, displayCount).map((record, index) => {
              // Calculate solve number in descending order
              const solveNumber = eventHistory.length - index;

              return (
                <div
                  key={record.id}
                  className="bg-[var(--surface-elevated)] rounded border border-[var(--border)] p-3 hover:bg-[var(--surface-elevated)]/80 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    {/* Solve number and time */}
                    <div
                      className="flex items-center gap-3 cursor-pointer flex-1"
                      onClick={() => handleSolveClick(record)}
                    >
                      <span className="text-sm text-[var(--text-muted)] font-inter">
                        #{solveNumber}
                      </span>
                      <span
                        className={`font-mono text-lg font-semibold ${
                          record.penalty === "+2"
                            ? "text-yellow-400"
                            : record.penalty === "DNF"
                              ? "text-red-400"
                              : "text-[var(--text-primary)]"
                        }`}
                      >
                        {formatTime(record.finalTime, record.penalty)}
                        {record.penalty === "+2" && "+"}
                      </span>
                    </div>

                    {/* Inline action buttons */}
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePenaltyChange(
                            record.id,
                            record.penalty === "+2" ? "none" : "+2"
                          );
                        }}
                        className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                          record.penalty === "+2"
                            ? "bg-[var(--warning)] text-white"
                            : "bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--border)]"
                        }`}
                        title="Toggle +2 penalty"
                      >
                        +2
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePenaltyChange(
                            record.id,
                            record.penalty === "DNF" ? "none" : "DNF"
                          );
                        }}
                        className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                          record.penalty === "DNF"
                            ? "bg-[var(--error)] text-white"
                            : "bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--border)]"
                        }`}
                        title="Toggle DNF penalty"
                      >
                        DNF
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSolve(record.id);
                        }}
                        className="p-1 text-[var(--text-muted)] hover:text-[var(--error)] transition-colors"
                        title="Delete solve"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Loading indicator */}
            {isLoading && (
              <div className="text-center py-2">
                <div className="text-sm text-[var(--text-muted)] font-inter">
                  Loading more solves...
                </div>
              </div>
            )}

            {/* Show count info if there are more solves */}
            {displayCount < eventHistory.length && !isLoading && (
              <div className="text-center py-2 border-t border-[var(--border)]">
                <div className="text-xs text-[var(--text-muted)] font-inter">
                  Showing {displayCount} of {eventHistory.length} solves •
                  Scroll down for more
                </div>
              </div>
            )}

            {eventHistory.length === 0 && (
              <div className="text-center py-4 text-[var(--text-muted)] font-inter">
                No solves yet for {getEventName(selectedEvent)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Solve Details Modal */}
      <SolveDetailsModal
        solve={selectedSolve}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSolve(null);
        }}
        onApplyPenalty={handlePenaltyChange}
        onDeleteSolve={onDeleteSolve}
        onUpdateSolve={handleUpdateSolve}
      />
    </>
  );
}