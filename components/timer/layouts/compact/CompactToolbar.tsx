"use client";

import { Check, ChevronDown, FolderOpen, SlidersHorizontal } from "lucide-react";
import { cx } from "@/lib/cx";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import { IconButton } from "@/components/ui/IconButton";
import { Menu, Popover, type MenuItem } from "@/components/ui/Menu";
import { useConfirmDelete } from "@/components/ui/useConfirmDelete";
import { EventSelectMenu } from "../../EventSelector";
import SessionList, { type TimerSession } from "../../SessionList";
import { useTimerActions, useTimerData } from "../../TimerPageProvider";
import {
  COMPACT_PANEL_LABELS,
  type CompactPanel,
  type CompactPanelVisibility,
} from "./useCompactPanels";

/** Panels offered in the ⋯ menu, in the order they appear on screen. */
const TOGGLEABLE: CompactPanel[] = [
  "scramblePreview",
  "scrambleNav",
  "hints",
  "stats",
  "history",
];

/** Shared chrome for the two selector chips, so they read as a pair. */
const CHIP =
  "flex items-center gap-2 min-w-0 h-10 px-3.5 rounded-(--radius-panel) " +
  "bg-(--surface) border border-(--border) shadow-(--shadow-control) hover:border-(--border-hover) " +
  "transition-colors disabled:opacity-50 disabled:pointer-events-none";

interface CompactToolbarProps {
  panels: CompactPanelVisibility;
  onTogglePanel: (panel: CompactPanel) => void;
  onResetPanels: () => void;
  /** Extra items for the ⋯ menu, e.g. import/export. */
  extraMenuItems?: MenuItem[];
  /** Receives the timer's own settings button, portaled out of TimerDisplay. */
  actionsSlotRef: (node: HTMLDivElement | null) => void;
  /**
   * Disabled while a solve is running: a sheet opening mid-solve would trap
   * focus and swallow the keypress that stops the timer.
   */
  disabled?: boolean;
  className?: string;
}

export default function CompactToolbar({
  panels,
  onTogglePanel,
  onResetPanels,
  extraMenuItems = [],
  actionsSlotRef,
  disabled = false,
  className,
}: CompactToolbarProps) {
  const { currentSession, sessions, selectedEvent, history } = useTimerData();
  const {
    handleEventChange,
    handleSessionChangeWithEvent,
    handleCreateSession,
    handleRenameSession,
    handleDeleteSession,
  } = useTimerActions();

  const getSolveCount = (sessionId: string) =>
    history.filter((solve) => solve.sessionId === sessionId).length;

  const sessionDelete = useConfirmDelete<TimerSession>(async (session) => {
    await handleDeleteSession(session.id);
  });

  const requestDeleteSession = (sessionId: string) => {
    if (sessions.length <= 1) return;
    const session = sessions.find((item) => item.id === sessionId);
    if (session) sessionDelete.request(session);
  };

  const currentCount = getSolveCount(currentSession.id);

  const panelItems: MenuItem[] = TOGGLEABLE.map((panel) => ({
    label: COMPACT_PANEL_LABELS[panel],
    onSelect: () => onTogglePanel(panel),
    keepOpen: true,
    trailing: panels[panel] ? (
      <Check className="w-4 h-4 text-(--primary)" aria-hidden />
    ) : undefined,
  }));

  return (
    <>
      {/* Three columns so the selectors stay centred whatever the actions weigh */}
      <div
        className={cx(
          "grid grid-cols-[1fr_auto_1fr] items-center gap-2",
          className,
        )}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        <div />

        <div className="flex items-center justify-center gap-2 min-w-0">
          <EventSelectMenu
            variant="chip"
            chipClassName={CHIP}
            selectedEvent={selectedEvent}
            onEventChange={handleEventChange}
            solveHistory={history}
            currentSessionId={currentSession.id}
          />

          <Popover
            title="Sessions"
            className="w-[min(24rem,calc(100vw-1rem))]"
            trigger={(props) => (
              <button
                {...props}
                type="button"
                disabled={disabled}
                className={CHIP}
              >
                <FolderOpen
                  className="w-4 h-4 shrink-0 text-(--primary)"
                  aria-hidden
                />
                <span className="type-label text-(--text-primary) truncate max-w-24 sm:max-w-40">
                  {currentSession.name}
                </span>
                <span className="type-caption shrink-0 tabular-nums">
                  {currentCount}
                </span>
                <ChevronDown
                  aria-hidden
                  className={cx(
                    "w-4 h-4 shrink-0 text-(--text-muted) transition-transform",
                    props["aria-expanded"] && "rotate-180",
                  )}
                />
              </button>
            )}
          >
            {(close) => (
              <SessionList
                currentSession={currentSession}
                sessions={sessions}
                onSessionChange={handleSessionChangeWithEvent}
                onCreateSession={handleCreateSession}
                onRenameSession={handleRenameSession}
                onDeleteSession={requestDeleteSession}
                getSolveCount={getSolveCount}
                onDone={close}
              />
            )}
          </Popover>
        </div>

        <div className="flex items-center justify-end gap-0.5">
          {/* The timer's own settings button arrives here by portal */}
          <div ref={actionsSlotRef} className="flex items-center gap-0.5" />
          <Menu
            title="Panels"
            items={[
              { type: "label", label: "Show" },
              ...panelItems,
              { type: "separator" },
              ...extraMenuItems,
              { label: "Reset layout", onSelect: onResetPanels },
            ]}
            trigger={(props) => (
              <IconButton
                {...props}
                size="sm"
                disabled={disabled}
                aria-label="Panels and options"
                icon={<SlidersHorizontal />}
              />
            )}
          />
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={sessionDelete.isOpen}
        onClose={sessionDelete.cancel}
        onConfirm={sessionDelete.confirm}
        isDeleting={sessionDelete.isDeleting}
        title="Delete Session?"
        description="Are you sure you want to delete this session?"
        itemName={sessionDelete.target?.name}
        warning={`This will permanently delete the session and all ${
          sessionDelete.target ? getSolveCount(sessionDelete.target.id) : 0
        } of its solves.`}
        confirmLabel="Delete Session"
      />
    </>
  );
}
