"use client";

import dynamic from "next/dynamic";
import BottomSheet from "@/components/ui/BottomSheet";
import ImportExportButtons from "../../ImportExportButtons";
import TimerHistory from "../../TimerHistory";
import { ScramblePreviewSkeleton } from "../../TimerSkeletons";
import { StaticPanelShell } from "../../TimerShell";
import { useTimerActions, useTimerData } from "../../TimerPageProvider";

const ScramblePreview = dynamic(() => import("../../ScramblePreview"), {
  loading: () => <ScramblePreviewSkeleton />,
  ssr: false,
});

/**
 * Secondary panels, reached from the toolbar and the stats strip.
 *
 * Sheets rather than inline panels so nothing competes with the timer for
 * space or for taps. `Modal` only attaches its swipe-to-dismiss handlers to the
 * grabber and header, so dragging inside these does not close them.
 */
export function ScramblePreviewSheet({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { activeScramble, currentScramble, partialScramble, selectedEvent } =
    useTimerData();

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Scramble Preview">
      {isOpen && (
        <ScramblePreview
          shell={StaticPanelShell}
          heightClassName="h-60"
          autoLoad
          scramble={activeScramble || currentScramble}
          event={selectedEvent}
          partialScramble={
            partialScramble || activeScramble || currentScramble
          }
        />
      )}
    </BottomSheet>
  );
}

export function RecentTimesSheet({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { sessionSolves, selectedEvent } = useTimerData();
  const {
    handleClearHistory,
    handleApplyPenalty,
    handleDeleteSolve,
    handleUpdateSolve,
    handleEditTime,
  } = useTimerActions();

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Recent Times">
      <TimerHistory
        shell={StaticPanelShell}
        scrollClassName="max-h-[60vh]"
        history={sessionSolves}
        selectedEvent={selectedEvent}
        onClearHistory={handleClearHistory}
        onApplyPenalty={handleApplyPenalty}
        onDeleteSolve={handleDeleteSolve}
        onUpdateSolve={handleUpdateSolve}
        onEditTime={handleEditTime}
      />
    </BottomSheet>
  );
}

export function DataSheet({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { sessionSolves, sessions, isImportModalOpen } = useTimerData();
  const { handleImportSolves, setIsImportModalOpen } = useTimerActions();

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Data Management">
      <ImportExportButtons
        shell={StaticPanelShell}
        history={sessionSolves}
        sessions={sessions}
        onImport={handleImportSolves}
        isImportModalOpen={isImportModalOpen}
        onImportModalOpenChange={setIsImportModalOpen}
      />
    </BottomSheet>
  );
}
