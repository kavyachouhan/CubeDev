"use client";

import { useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useUser } from "@/components/UserProvider";

// Import components
import TimerDisplay from "./timer/TimerDisplay";
import SessionManager from "./timer/SessionManager";
import EventSelector from "./timer/EventSelector";
import ScrambleDisplay from "./timer/ScrambleDisplay";
import StatsDisplay from "./timer/StatsDisplay";
import TimerHistory from "./timer/TimerHistory";

// Import custom hooks
import { useTimerState } from "./timer/hooks/useTimerState";
import { useSessionState } from "./timer/hooks/useSessionState";
import { useSolveOperations } from "./timer/hooks/useSolveOperations";
import { useDatabaseSync } from "./timer/hooks/useDatabaseSync";
import { useLocalStorageManager } from "./timer/hooks/useLocalStorageManager";

// Dynamically import ScramblePreview to avoid heavy initial load
const ScramblePreview = dynamic(() => import("./timer/ScramblePreview"), {
  loading: () => (
    <div className="timer-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement">
          Scramble Preview
        </h3>
      </div>
      <div className="w-full min-h-[200px] bg-[var(--surface-elevated)] rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2">🧩</div>
          <div className="text-sm text-[var(--text-muted)]">
            Loading component...
          </div>
        </div>
      </div>
    </div>
  ),
  ssr: false,
});

interface CubeLabTimerProps {
  onTimerFocusChange?: (isActive: boolean) => void;
}

export default function CubeLabTimer({
  onTimerFocusChange,
}: CubeLabTimerProps = {}) {
  const { user } = useUser();

  // Timer state and operations
  const {
    history,
    selectedEvent,
    currentScramble,
    lastSolveId,
    isTimerFocusMode,
    handleNewScramble,
    handleEventChange,
    addSolve,
    updateSolve,
    removeSolve,
    clearSessionHistory,
    setCompleteHistory,
    setTimerFocusMode,
    getSessionHistory,
    calculateFinalTime,
  } = useTimerState();

  const {
    sessions,
    currentSession,
    isSessionsInitialized,
    isLoading: isSessionLoading,
    handleSessionChange,
    handleCreateSession,
    handleRenameSession,
    handleDeleteSession,
    updateSessionSolveCount,
  } = useSessionState(user?.convexId);

  const {
    dbSolves,
    convertDbSolvesToLocal,
    isLoading: isDbLoading,
  } = useDatabaseSync(user?.convexId);

  const { loadFromCache, saveToCache } = useLocalStorageManager(user?.convexId);

  const {
    saveSolve,
    applyPenalty,
    deleteSolve,
    clearSessionSolves,
    updateSolve: updateSolveOperation,
  } = useSolveOperations(user?.convexId, updateSessionSolveCount);

  // Handle timer focus mode changes
  const handleTimerFocusChange = useCallback(
    (isActive: boolean) => {
      setTimerFocusMode(isActive);
      onTimerFocusChange?.(isActive);
    },
    [setTimerFocusMode, onTimerFocusChange]
  );

  // Handle session change and sync event
  const handleSessionChangeWithEvent = useCallback(
    (session: any) => {
      handleSessionChange(session);
      // If the new session's event differs from the current selected event, update it
      if (session.event !== selectedEvent) {
        handleEventChange(session.event);
      }
    },
    [handleSessionChange, handleEventChange, selectedEvent]
  );

  // Initialize complete history from database or cache
  useEffect(() => {
    if (!isSessionsInitialized || dbSolves === undefined) return;

    // Prefer database history if available
    if (dbSolves && dbSolves.length > 0) {
      const solveHistory = convertDbSolvesToLocal(dbSolves);
      setCompleteHistory(solveHistory);
      saveToCache("history", solveHistory);
    } else {
      // Fallback to cached history
      const cachedHistory = loadFromCache("history", []);
      if (cachedHistory.length > 0) {
        setCompleteHistory(cachedHistory);
      }
    }
  }, [
    isSessionsInitialized,
    dbSolves,
    convertDbSolvesToLocal,
    saveToCache,
    loadFromCache,
    setCompleteHistory,
  ]);

  // Generate initial scramble on mount
  useEffect(() => {
    handleNewScramble();
  }, []);

  // Handle solve completion
  const handleSolveComplete = useCallback(
    async (time: number, notes?: string, tags?: string[]) => {
      if (!currentSession) return null;

      const finalTime = calculateFinalTime(time, "none");
      const solve = {
        time,
        timestamp: new Date(),
        scramble: currentScramble,
        penalty: "none" as const,
        finalTime,
        event: selectedEvent,
        sessionId: currentSession.id,
        notes,
        tags,
      };

      // Save solve to database and local state
      const solveId = await saveSolve(
        solve,
        currentSession,
        getSessionHistory(currentSession.id),
        addSolve
      );

      if (solveId) {
        // Generate a new scramble for the next solve
        await handleNewScramble();
      }

      return solveId;
    },
    [
      currentSession,
      currentScramble,
      selectedEvent,
      calculateFinalTime,
      saveSolve,
      getSessionHistory,
      addSolve,
      handleNewScramble,
    ]
  );

  // Handle applying penalty to a solve
  const handleApplyPenalty = useCallback(
    async (solveId: string, penalty: "none" | "+2" | "DNF") => {
      const solve = history.find((s) => s.id === solveId);
      if (!solve) return;

      await applyPenalty(solveId, penalty, solve.time, updateSolve);
    },
    [history, applyPenalty, updateSolve]
  );

  // Handle deleting a solve
  const handleDeleteSolve = useCallback(
    async (solveId: string) => {
      if (!currentSession) return;

      await deleteSolve(
        solveId,
        currentSession,
        getSessionHistory(currentSession.id),
        removeSolve
      );
    },
    [currentSession, deleteSolve, getSessionHistory, removeSolve]
  );

  // Handle clearing session history
  const handleClearHistory = useCallback(async () => {
    if (!currentSession) return;

    await clearSessionSolves(
      getSessionHistory(currentSession.id),
      currentSession,
      clearSessionHistory
    );
  }, [
    currentSession,
    clearSessionSolves,
    getSessionHistory,
    clearSessionHistory,
  ]);

  // Handle updating a solve's notes or tags
  const handleUpdateSolve = useCallback(
    async (solveId: string, notes?: string, tags?: string[]) => {
      await updateSolveOperation(solveId, { notes, tags }, updateSolve);
    },
    [updateSolveOperation, updateSolve]
  );

  // Handle applying penalty to the last solve
  const handleLastSolvePenalty = useCallback(
    (penalty: "none" | "+2" | "DNF") => {
      if (lastSolveId) {
        handleApplyPenalty(lastSolveId, penalty);
      }
    },
    [lastSolveId, handleApplyPenalty]
  );

  // Show loading state if session or database is loading
  if (!currentSession || isDbLoading || isSessionLoading) {
    return (
      <div className="container-responsive py-4 md:py-8">
        <div className="text-center">
          <div className="text-lg text-[var(--text-muted)]">
            Loading your session data...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-responsive py-4 md:py-8">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
        {/* Left Column - Controls */}
        <div className="xl:col-span-2 space-y-4 md:space-y-6">
          {/* Session & Event Row */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 transition-all duration-500 ease-in-out ${
              isTimerFocusMode ? "blur-md opacity-50 pointer-events-none" : ""
            }`}
          >
            {/* Session Manager */}
            <SessionManager
              currentSession={currentSession}
              sessions={sessions}
              onSessionChange={handleSessionChangeWithEvent}
              onCreateSession={handleCreateSession}
              onRenameSession={handleRenameSession}
              onDeleteSession={handleDeleteSession}
              allSolveHistory={history}
            />

            {/* Event Selector */}
            <EventSelector
              selectedEvent={selectedEvent}
              onEventChange={handleEventChange}
              solveHistory={history}
              currentSessionId={currentSession.id}
            />
          </div>

          {/* Scramble */}
          <div
            className={`transition-all duration-500 ease-in-out ${
              isTimerFocusMode ? "blur-md opacity-50 pointer-events-none" : ""
            }`}
          >
            <ScrambleDisplay
              scramble={currentScramble}
              onNewScramble={handleNewScramble}
            />
          </div>

          {/* Timer */}
          <TimerDisplay
            onSolveComplete={handleSolveComplete}
            onApplyPenalty={handleLastSolvePenalty}
            lastSolveId={lastSolveId}
            onTimerStateChange={handleTimerFocusChange}
          />
        </div>

        {/* Right Column - Stats & Visualization */}
        <div
          className={`xl:col-span-2 space-y-4 md:space-y-6 order-last xl:order-none transition-all duration-500 ease-in-out ${
            isTimerFocusMode ? "blur-md opacity-50 pointer-events-none" : ""
          }`}
        >
          {/* Scramble Preview */}
          <ScramblePreview scramble={currentScramble} event={selectedEvent} />

          {/* Stats */}
          <StatsDisplay
            history={getSessionHistory(currentSession.id)}
            selectedEvent={selectedEvent}
          />

          {/* History */}
          <TimerHistory
            history={getSessionHistory(currentSession.id)}
            selectedEvent={selectedEvent}
            onClearHistory={handleClearHistory}
            onApplyPenalty={handleApplyPenalty}
            onDeleteSolve={handleDeleteSolve}
            onUpdateSolve={handleUpdateSolve}
          />
        </div>
      </div>
    </div>
  );
}