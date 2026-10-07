"use client";

import { memo } from "react";
import dynamic from "next/dynamic";
import { cx } from "@/lib/cx";
import TimerDisplay from "../TimerDisplay";
import SessionManager from "../SessionManager";
import EventSelector from "../EventSelector";
import ScrambleDisplay from "../ScrambleDisplay";
import StatsDisplay from "../StatsDisplay";
import TimerHistory from "../TimerHistory";
import ImportExportButtons from "../ImportExportButtons";
import { ScramblePreviewSkeleton } from "../TimerSkeletons";
import { useTimerActions, useTimerData } from "../TimerPageProvider";

// Loaded on demand; the cubing.js player is heavy.
const ScramblePreview = dynamic(() => import("../ScramblePreview"), {
  loading: () => <ScramblePreviewSkeleton />,
  ssr: false,
});

/**
 * Memoized so a new solve, which changes the data context, does not re-render
 * the timer while it is counting.
 */
const MemoTimerDisplay = memo(TimerDisplay);

/** Dimming applied to everything except the timer while a solve is running. */
const focusDim = (active: boolean) =>
  cx(
    "transition-all duration-500 ease-in-out",
    active && "blur-md opacity-50 pointer-events-none",
  );

/** The original CubeDev timer layout: one card per concern. */
export default function CardTimerLayout() {
  const {
    currentSession,
    sessions,
    selectedEvent,
    currentScramble,
    activeScramble,
    partialScramble,
    history,
    sessionSolves,
    lastSolveId,
    isTimerFocusMode,
    isImportModalOpen,
    extendedStatsVisibility,
  } = useTimerData();

  const {
    handleNewScramble,
    handleEventChange,
    setPartialScramble,
    setActiveScramble,
    handleSessionChangeWithEvent,
    handleCreateSession,
    handleRenameSession,
    handleDeleteSession,
    handleSolveComplete,
    handleSolveCompleteWithPenalty,
    handleApplyPenalty,
    handleLastSolvePenalty,
    handleDeleteSolve,
    handleUpdateSolve,
    handleEditTime,
    handleClearHistory,
    handleImportSolves,
    setIsImportModalOpen,
    handleTimerFocusChange,
    toggleExtendedStat,
  } = useTimerActions();

  return (
    <div className="container-responsive py-4 md:py-8">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
        {/* Left Column - Controls */}
        <div className="xl:col-span-2 space-y-4 md:space-y-6">
          {/* Import/Export */}
          <ImportExportButtons
            history={sessionSolves}
            sessions={sessions}
            onImport={handleImportSolves}
            isImportModalOpen={isImportModalOpen}
            onImportModalOpenChange={setIsImportModalOpen}
          />

          {/* Session & Event Row */}
          <div
            className={cx(
              "grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 items-start",
              focusDim(isTimerFocusMode),
            )}
          >
            <SessionManager
              currentSession={currentSession}
              sessions={sessions}
              onSessionChange={handleSessionChangeWithEvent}
              onCreateSession={handleCreateSession}
              onRenameSession={handleRenameSession}
              onDeleteSession={handleDeleteSession}
              allSolveHistory={history}
            />

            <EventSelector
              selectedEvent={selectedEvent}
              onEventChange={handleEventChange}
              solveHistory={history}
              currentSessionId={currentSession.id}
            />
          </div>

          {/* Scramble */}
          <div className={focusDim(isTimerFocusMode)}>
            <ScrambleDisplay
              scramble={currentScramble}
              onNewScramble={handleNewScramble}
              onPartialScrambleHover={setPartialScramble}
              onActiveScrambleChange={setActiveScramble}
            />
          </div>

          {/* Timer */}
          <div className="xl:mb-0">
            <MemoTimerDisplay
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
        </div>

        {/* Right Column - Stats & Visualization */}
        <div
          className={cx(
            "xl:col-span-2 space-y-4 md:space-y-6 order-last xl:order-0",
            focusDim(isTimerFocusMode),
          )}
        >
          <ScramblePreview
            scramble={activeScramble || currentScramble}
            event={selectedEvent}
            partialScramble={
              partialScramble || activeScramble || currentScramble
            }
          />

          <StatsDisplay
            history={sessionSolves}
            selectedEvent={selectedEvent}
            extendedStatsVisibility={extendedStatsVisibility}
          />

          <TimerHistory
            history={sessionSolves}
            selectedEvent={selectedEvent}
            onClearHistory={handleClearHistory}
            onApplyPenalty={handleApplyPenalty}
            onDeleteSolve={handleDeleteSolve}
            onUpdateSolve={handleUpdateSolve}
            onEditTime={handleEditTime}
          />
        </div>
      </div>
    </div>
  );
}
