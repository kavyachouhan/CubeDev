"use client";

import { memo, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Download } from "lucide-react";
import { cx } from "@/lib/cx";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import type { MenuItem } from "@/components/ui/Menu";
import TimerDisplay from "../TimerDisplay";
import SessionStatsModal from "../SessionStatsModal";
import TimerHistory from "../TimerHistory";
import { useScramble } from "../ScrambleDisplay";
import { useSessionStats } from "../StatsDisplay";
import { ScramblePreviewSkeleton } from "../TimerSkeletons";
import {
  BarePanelShell,
  InsetPanelShell,
  SlottedPanelShell,
  TimerActionsSlotProvider,
} from "../TimerShell";
import { useTimerActions, useTimerData } from "../TimerPageProvider";
import CompactToolbar from "./compact/CompactToolbar";
import CompactScrambleBar from "./compact/CompactScrambleBar";
import CompactStatsStrip from "./compact/CompactStatsStrip";
import CompactTimesDock from "./compact/CompactTimesDock";
import {
  DataSheet,
  RecentTimesSheet,
  ScramblePreviewSheet,
} from "./compact/CompactSheets";
import { useCompactPanels } from "./compact/useCompactPanels";

const ScramblePreview = dynamic(() => import("../ScramblePreview"), {
  loading: () => <ScramblePreviewSkeleton />,
  ssr: false,
});

/** Memoized so recording a solve does not re-render the timer mid-count. */
const MemoTimerDisplay = memo(TimerDisplay);

/**
 * Everything but the timer fades out while a solve runs.
 *
 * Opacity rather than the blur the card layout uses: the rows keep their
 * heights, so the timer never shifts, and there is no per-frame blur repaint
 * on mobile.
 */
const focusHide = (active: boolean) =>
  cx(
    "transition-opacity duration-(--duration-slow)",
    active && "opacity-0 pointer-events-none",
  );

/**
 * The compact timer layout: one screen, no page scroll.
 *
 * Rows 1, 2 and 4 are fixed height and are siblings of the timer, never its
 * ancestors, so a tap on a control can never start a solve. The timer owns the
 * only flexible row, and is the only element with `touch-action: none`.
 */
export default function CompactTimerLayout() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const { panels, toggle, reset } = useCompactPanels(isDesktop);

  const {
    selectedEvent,
    currentScramble,
    activeScramble,
    partialScramble,
    sessionSolves,
    lastSolveId,
    isTimerFocusMode,
    isImportModalOpen,
    extendedStatsVisibility,
  } = useTimerData();

  const {
    handleNewScramble,
    setPartialScramble,
    setActiveScramble,
    handleSolveComplete,
    handleSolveCompleteWithPenalty,
    handleLastSolvePenalty,
    handleApplyPenalty,
    handleDeleteSolve,
    handleUpdateSolve,
    handleEditTime,
    handleClearHistory,
    handleTimerFocusChange,
    toggleExtendedStat,
  } = useTimerActions();

  const [isPreviewSheetOpen, setIsPreviewSheetOpen] = useState(false);
  const [isHistorySheetOpen, setIsHistorySheetOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isDataSheetOpen, setIsDataSheetOpen] = useState(false);
  const [actionsSlot, setActionsSlot] = useState<HTMLDivElement | null>(null);

  // The getting-started modal asks for the import dialog through the shared
  // flag; in compact the panel that owns it lives in a sheet.
  useEffect(() => {
    if (isImportModalOpen) setIsDataSheetOpen(true);
  }, [isImportModalOpen]);

  const scramble = useScramble({
    scramble: currentScramble,
    onNewScramble: handleNewScramble,
    onPartialScrambleHover: setPartialScramble,
    onActiveScrambleChange: setActiveScramble,
  });

  const stats = useSessionStats(sessionSolves, selectedEvent);

  const extraMenuItems: MenuItem[] = [
    {
      label: "Import / Export times",
      icon: <Download />,
      onSelect: () => setIsDataSheetOpen(true),
    },
  ];

  const previewScramble = activeScramble || currentScramble;

  return (
    <TimerActionsSlotProvider slot={actionsSlot}>
      <div className="h-full overflow-hidden flex flex-col gap-2 sm:gap-3 p-2 sm:p-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:pb-[max(0.75rem,env(safe-area-inset-bottom))] overscroll-none">
        {/* Row 1 — event, session, options */}
        <CompactToolbar
          panels={panels}
          onTogglePanel={toggle}
          onResetPanels={reset}
          extraMenuItems={extraMenuItems}
          actionsSlotRef={setActionsSlot}
          disabled={isTimerFocusMode}
          className={cx("shrink-0 h-12", focusHide(isTimerFocusMode))}
        />

        {/* Row 2 — the scramble, directly above the timer */}
        <CompactScrambleBar
          controller={scramble}
          showNav={panels.scrambleNav}
          onOpenPreview={() => setIsPreviewSheetOpen(true)}
          disabled={isTimerFocusMode}
          className={cx("shrink-0", focusHide(isTimerFocusMode))}
        />

        {/* Row 3 — the timer, plus the desktop aside */}
        <div className="flex-1 min-h-0 flex gap-3">
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden p-2 bg-(--surface) border border-(--border) rounded-(--radius-card) shadow-(--shadow-card)">
            <MemoTimerDisplay
              shell={SlottedPanelShell}
              contentClassName="flex-1 min-h-0 flex flex-col"
              coreClassName="flex-1 min-h-0 gap-3 px-2"
              dense
              hideStatusText={!panels.hints}
              onSolveComplete={handleSolveComplete}
              onSolveCompleteWithPenalty={handleSolveCompleteWithPenalty}
              onApplyPenalty={handleLastSolvePenalty}
              lastSolveId={lastSolveId}
              onTimerStateChange={handleTimerFocusChange}
              history={sessionSolves}
              extendedStatsVisibility={extendedStatsVisibility}
              onToggleExtendedStat={toggleExtendedStat}
            />
          </div>

          <aside
            className={cx(
              "hidden lg:flex w-76 xl:w-84 shrink-0 flex-col gap-3 overflow-hidden",
              focusHide(isTimerFocusMode),
            )}
          >
            {panels.scramblePreview && (
              <div
                className={
                  "shrink-0 p-1.5 bg-(--surface) border border-(--border) rounded-(--radius-card) shadow-(--shadow-card)"
                }
              >
                <ScramblePreview
                  shell={InsetPanelShell}
                  heightClassName="h-52"
                  compactControls
                  scramble={previewScramble}
                  event={selectedEvent}
                  partialScramble={partialScramble || previewScramble}
                />
              </div>
            )}

            {panels.history && (
              <div
                className={
                  "flex-1 min-h-0 flex flex-col p-3 bg-(--surface) border border-(--border) rounded-(--radius-card) shadow-(--shadow-card)"
                }
              >
                <TimerHistory
                  shell={BarePanelShell}
                  scrollClassName="flex-1 min-h-0"
                  history={sessionSolves}
                  selectedEvent={selectedEvent}
                  onClearHistory={handleClearHistory}
                  onApplyPenalty={handleApplyPenalty}
                  onDeleteSolve={handleDeleteSolve}
                  onUpdateSolve={handleUpdateSolve}
                  onEditTime={handleEditTime}
                />
              </div>
            )}
          </aside>
        </div>

        {/* Optional preview card, phones only — costs the timer height by choice.
            Gated behind "Load Preview" like the card layout, so the heavy
            player only loads when asked for. No title: no compact panel has
            one, and the controls float inside the player instead. */}
        {panels.scramblePreview && (
          <div
            className={cx(
              "lg:hidden shrink-0 p-1.5 bg-(--surface) border border-(--border) rounded-(--radius-card) shadow-(--shadow-card)",
              focusHide(isTimerFocusMode),
            )}
          >
            <ScramblePreview
              shell={InsetPanelShell}
              heightClassName="h-40"
              compactControls
              scramble={previewScramble}
              event={selectedEvent}
              partialScramble={partialScramble || previewScramble}
            />
          </div>
        )}

        {/* Row 4 — recent times and averages.
            Phones get the times inline; desktop already has them in the aside. */}
        {panels.stats && (
          <>
            <CompactTimesDock
              solves={sessionSolves}
              stats={stats}
              selectedEvent={selectedEvent}
              onOpenHistory={() => setIsHistorySheetOpen(true)}
              onOpenStats={() => setIsStatsModalOpen(true)}
              disabled={isTimerFocusMode}
              className={cx(
                "lg:hidden shrink-0 px-3 bg-(--surface) border border-(--border) rounded-(--radius-card) shadow-(--shadow-card)",
                focusHide(isTimerFocusMode),
              )}
            />

            <CompactStatsStrip
              stats={stats}
              onOpenStats={() => setIsStatsModalOpen(true)}
              disabled={isTimerFocusMode}
              className={cx(
                "hidden lg:grid shrink-0 h-12 px-3 bg-(--surface) border border-(--border) rounded-(--radius-card) shadow-(--shadow-card)",
                focusHide(isTimerFocusMode),
              )}
            />
          </>
        )}

        <ScramblePreviewSheet
          isOpen={isPreviewSheetOpen}
          onClose={() => setIsPreviewSheetOpen(false)}
        />

        <DataSheet
          isOpen={isDataSheetOpen}
          onClose={() => setIsDataSheetOpen(false)}
        />

        <RecentTimesSheet
          isOpen={isHistorySheetOpen}
          onClose={() => setIsHistorySheetOpen(false)}
        />

        <SessionStatsModal
          isOpen={isStatsModalOpen}
          onClose={() => setIsStatsModalOpen(false)}
          history={sessionSolves}
          selectedEvent={selectedEvent}
          extendedStatsVisibility={extendedStatsVisibility}
        />
      </div>
    </TimerActionsSlotProvider>
  );
}
