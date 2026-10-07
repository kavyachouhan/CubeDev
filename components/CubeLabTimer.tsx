"use client";

import { useTheme } from "@/lib/theme-context";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import CardTimerLayout from "./timer/layouts/CardTimerLayout";
import CompactTimerLayout from "./timer/layouts/CompactTimerLayout";
import { TimerPageProvider } from "./timer/TimerPageProvider";
import TimerGettingStartedModal from "./timer/TimerGettingStartedModal";
import { TimerPageSkeleton } from "./timer/TimerSkeletons";
import { useTimerPageController } from "./timer/hooks/useTimerPageController";

interface CubeLabTimerProps {
  onTimerFocusChange?: (isActive: boolean) => void;
}

/**
 * The timer page: owns its state once, then hands it to a layout.
 *
 * Everything functional lives in `useTimerPageController`, so a layout is
 * presentation only and the two layouts cannot drift apart in behaviour.
 */
export default function CubeLabTimer({
  onTimerFocusChange,
}: CubeLabTimerProps = {}) {
  const { timerLayout, isLoading: isThemeLoading } = useTheme();
  const { data, actions, isPageLoading, gettingStarted, shortcutDelete } =
    useTimerPageController(onTimerFocusChange);

  // `timerLayout` only resolves after mount, so gate on the theme too. The
  // session query means this gate is open for at least one paint anyway.
  if (isThemeLoading || isPageLoading || !data) {
    return <TimerPageSkeleton />;
  }

  return (
    <TimerPageProvider data={data} actions={actions}>
      <TimerGettingStartedModal
        isOpen={gettingStarted.isOpen}
        onClose={gettingStarted.onClose}
        onImportNow={gettingStarted.onImportNow}
        onCreateFocusedSession={gettingStarted.onCreateFocusedSession}
        isCreatingSession={gettingStarted.isCreatingSession}
      />

      <ConfirmDeleteModal
        isOpen={shortcutDelete.isOpen}
        onClose={shortcutDelete.cancel}
        onConfirm={shortcutDelete.confirm}
        isDeleting={shortcutDelete.isDeleting}
        title="Clear Session?"
        description="This will remove every solve in the current session."
        itemName={data.currentSession.name}
        warning="All times in this session will be permanently deleted."
        confirmLabel="Clear Session"
      />

      {timerLayout === "cards" ? <CardTimerLayout /> : <CompactTimerLayout />}
    </TimerPageProvider>
  );
}
