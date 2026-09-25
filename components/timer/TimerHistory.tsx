"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Pencil, Timer as TimerIcon, Trash2 } from "lucide-react";
import { cx } from "@/lib/cx";
import { CollapsibleCard } from "@/components/ui/Card";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { TimeValue } from "@/components/ui/TimeValue";
import { useConfirmDelete } from "@/components/ui/useConfirmDelete";
import SolveDetailsModal, {
  TimerModeBadge,
  formatSolveTime,
  getEventName,
} from "./SolveDetailsModal";
import type { TimerRecord } from "./SolveDetailsModal";

const SolveEditModal = dynamic(() => import("./SolveEditModal"), { ssr: false });

type Penalty = "none" | "+2" | "DNF";

interface TimerHistoryProps {
  history: TimerRecord[];
  selectedEvent: string;
  onClearHistory: () => void;
  onApplyPenalty: (solveId: string, penalty: Penalty) => void;
  onDeleteSolve: (solveId: string) => void;
  onUpdateSolve?: (solveId: string, notes?: string, tags?: string[]) => void;
  onEditTime?: (solveId: string, time: number, penalty: Penalty) => void;
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
  const setStateAndStore = (newState: boolean) => {
    setState(newState);
    try {
      localStorage.setItem(key, JSON.stringify(newState));
    } catch {
      // Storage can be unavailable (private mode); the preference just won't persist.
    }
  };
  return [state, setStateAndStore] as const;
}

/** Compact toggle for a penalty directly in a history row. */
function PenaltyToggle({
  label,
  active,
  tone,
  onClick,
}: {
  label: string;
  active: boolean;
  tone: "plus2" | "dnf";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cx(
        "min-w-9 h-7 px-2 rounded-(--radius-badge) text-xs font-semibold font-inter transition-colors",
        active
          ? tone === "plus2"
            ? "bg-(--penalty-plus2) text-white"
            : "bg-(--penalty-dnf) text-white"
          : "bg-(--surface) text-(--text-secondary) border border-(--border) hover:border-(--border-hover) hover:text-(--text-primary)",
      )}
    >
      {label}
    </button>
  );
}

export default function TimerHistory({
  history,
  selectedEvent,
  onClearHistory,
  onApplyPenalty,
  onDeleteSolve,
  onUpdateSolve,
  onEditTime,
}: TimerHistoryProps) {
  const [showHistory, setShowHistory] = usePersistentBool(
    "cubelab-timer-history-expanded",
    true,
  );
  const [selectedSolve, setSelectedSolve] = useState<TimerRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSolveId, setEditingSolveId] = useState<string | null>(null);

  const historyDelete = useConfirmDelete(async () => {
    await onClearHistory();
  });

  // Infinite scroll
  const [displayCount, setDisplayCount] = useState(20);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setDisplayCount(20);
  }, [selectedEvent, history.length]);

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || isLoading) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      const eventHistory = history.filter((r) => r.event === selectedEvent);
      if (displayCount < eventHistory.length) {
        setIsLoading(true);
        setTimeout(() => {
          setDisplayCount((prev) => Math.min(prev + 20, eventHistory.length));
          setIsLoading(false);
        }, 200);
      }
    }
  }, [history, selectedEvent, displayCount, isLoading]);

  const handleSolveClick = (solve: TimerRecord) => {
    setSelectedSolve(solve);
    setIsModalOpen(true);
  };

  // Keep the open details dialog in sync with changes made from it.
  const handlePenaltyChange = (solveId: string, penalty: Penalty) => {
    onApplyPenalty(solveId, penalty);
    if (selectedSolve && selectedSolve.id === solveId) {
      const updatedSolve = { ...selectedSolve, penalty };
      if (penalty === "DNF") updatedSolve.finalTime = Infinity;
      else if (penalty === "+2") updatedSolve.finalTime = selectedSolve.time + 2000;
      else updatedSolve.finalTime = selectedSolve.time;
      setSelectedSolve(updatedSolve);
    }
  };

  const handleUpdateSolve = (solveId: string, notes?: string, tags?: string[]) => {
    if (!onUpdateSolve) return;
    onUpdateSolve(solveId, notes, tags);
    if (selectedSolve && selectedSolve.id === solveId) {
      setSelectedSolve({ ...selectedSolve, notes: notes || "", tags: tags || [] });
    }
  };

  const handleEditTime = (solveId: string, time: number, penalty: Penalty) => {
    if (onEditTime) {
      onEditTime(solveId, time, penalty);
      if (selectedSolve && selectedSolve.id === solveId) {
        const finalTime =
          penalty === "+2" ? time + 2000 : penalty === "DNF" ? Infinity : time;
        setSelectedSolve({ ...selectedSolve, time, penalty, finalTime });
      }
    }
    setEditingSolveId(null);
  };

  const eventHistory = history.filter((r) => r.event === selectedEvent);
  const editingSolve = editingSolveId
    ? history.find((r) => r.id === editingSolveId)
    : undefined;

  return (
    <>
      <CollapsibleCard
        title="Recent Times"
        open={showHistory}
        onOpenChange={setShowHistory}
        actions={
          eventHistory.length > 0 ? (
            <IconButton
              size="sm"
              variant="danger"
              aria-label="Delete all times"
              icon={<Trash2 />}
              onClick={() => historyDelete.request()}
            />
          ) : undefined
        }
      >
        {eventHistory.length === 0 ? (
          <EmptyState
            icon={<TimerIcon />}
            title={`No solves yet for ${getEventName(selectedEvent)}`}
            description="Press and hold space (or the timer on touch screens) to start your first solve."
          />
        ) : (
          <div
            ref={scrollContainerRef}
            className="space-y-1.5 max-h-72 overflow-y-auto -mx-1 px-1"
            onScroll={handleScroll}
          >
            <ol aria-label={`Solves for ${getEventName(selectedEvent)}`} className="space-y-1.5">
              {eventHistory.slice(0, displayCount).map((record, index) => {
                const solveNumber = eventHistory.length - index;
                return (
                  <li
                    key={record.id}
                    className="flex items-center gap-2 rounded-(--radius-control) border border-(--border) bg-(--surface-elevated) pr-1.5 hover:border-(--border-hover) transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => handleSolveClick(record)}
                      aria-label={`Solve ${solveNumber}: ${formatSolveTime(record.finalTime, record.penalty)}. Open details`}
                      className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 text-left rounded-(--radius-control)"
                    >
                      <span className="type-time text-xs text-(--text-muted) w-8 shrink-0">
                        #{solveNumber}
                      </span>
                      <TimeValue
                        penalty={record.penalty}
                        className="text-base sm:text-lg font-semibold whitespace-nowrap"
                      >
                        {formatSolveTime(record.finalTime, record.penalty)}
                        {record.penalty === "+2" && "+"}
                      </TimeValue>
                      <TimerModeBadge mode={record.timerMode} />
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      {onEditTime && (
                        <IconButton
                          size="sm"
                          aria-label={`Edit time of solve ${solveNumber}`}
                          icon={<Pencil />}
                          onClick={() => setEditingSolveId(record.id)}
                        />
                      )}
                      <PenaltyToggle
                        label="+2"
                        tone="plus2"
                        active={record.penalty === "+2"}
                        onClick={() =>
                          handlePenaltyChange(record.id, record.penalty === "+2" ? "none" : "+2")
                        }
                      />
                      <PenaltyToggle
                        label="DNF"
                        tone="dnf"
                        active={record.penalty === "DNF"}
                        onClick={() =>
                          handlePenaltyChange(record.id, record.penalty === "DNF" ? "none" : "DNF")
                        }
                      />
                      <IconButton
                        size="sm"
                        variant="danger"
                        aria-label={`Delete solve ${solveNumber}`}
                        icon={<Trash2 />}
                        onClick={() => onDeleteSolve(record.id)}
                      />
                    </div>
                  </li>
                );
              })}
            </ol>

            {isLoading && (
              <p role="status" className="type-caption text-center py-2">
                Loading more solves…
              </p>
            )}

            {displayCount < eventHistory.length && !isLoading && (
              <p className="type-caption text-center py-2 border-t border-(--border)">
                Showing {displayCount} of {eventHistory.length} solves · scroll for more
              </p>
            )}
          </div>
        )}
      </CollapsibleCard>

      {editingSolveId && (
        <SolveEditModal
          isOpen
          onClose={() => setEditingSolveId(null)}
          currentTime={editingSolve?.time || 0}
          currentPenalty={editingSolve?.penalty || "none"}
          onSave={(time, penalty) => handleEditTime(editingSolveId, time, penalty)}
        />
      )}

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
        onEditTime={onEditTime ? handleEditTime : undefined}
      />

      <ConfirmDeleteModal
        isOpen={historyDelete.isOpen}
        onClose={historyDelete.cancel}
        onConfirm={historyDelete.confirm}
        isDeleting={historyDelete.isDeleting}
        title="Delete All Times?"
        description={`This will remove every solve in the current session for ${getEventName(selectedEvent)}.`}
        warning="All times in this session will be permanently deleted."
        confirmLabel="Delete All"
      />
    </>
  );
}
