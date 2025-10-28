"use client";

import { useEffect, useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { useUser } from "@/components/UserProvider";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// Import components
import TimerDisplay from "./timer/TimerDisplay";
import SessionManager from "./timer/SessionManager";
import EventSelector from "./timer/EventSelector";
import ScrambleDisplay from "./timer/ScrambleDisplay";
import StatsDisplay from "./timer/StatsDisplay";
import TimerHistory from "./timer/TimerHistory";
import ImportExportButtons from "./timer/ImportExportButtons";
import {
  TimerPageSkeleton,
  ScramblePreviewSkeleton,
} from "./timer/TimerSkeletons";

// Import custom hooks
import { useTimerState } from "./timer/hooks/useTimerState";
import { useSessionState } from "./timer/hooks/useSessionState";
import { useSolveOperations } from "./timer/hooks/useSolveOperations";
import { useDatabaseSync } from "./timer/hooks/useDatabaseSync";
import { useLocalStorageManager } from "./timer/hooks/useLocalStorageManager";

// Dynamically import ScramblePreview to avoid heavy initial load
const ScramblePreview = dynamic(() => import("./timer/ScramblePreview"), {
  loading: () => <ScramblePreviewSkeleton />,
  ssr: false,
});

interface CubeLabTimerProps {
  onTimerFocusChange?: (isActive: boolean) => void;
}

export default function CubeLabTimer({
  onTimerFocusChange,
}: CubeLabTimerProps = {}) {
  const { user } = useUser();

  // State for partial scramble preview
  const [partialScramble, setPartialScramble] = useState<string>("");
  // State for active scramble (can be set independently)
  const [activeScramble, setActiveScramble] = useState<string>("");

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

  // Fetch session solves from database
  const dbSessionSolves = useQuery(
    api.users.getSessionSolves,
    currentSession?.convexId
      ? { sessionId: currentSession.convexId as any }
      : "skip"
  );

  // Batch import mutation
  const batchImportSolves = useMutation(api.users.batchImportSolves);

  const {
    saveSolve,
    applyPenalty,
    deleteSolve,
    clearSessionSolves,
    updateSolve: updateSolveOperation,
  } = useSolveOperations(user?.convexId, updateSessionSolveCount);

  // Convert database solves to local format and merge with local history
  const getAllSessionSolves = useCallback(
    (sessionId: string) => {
      // Get local solves for this session
      const localSolves = getSessionHistory(sessionId);

      // Convert and merge database solves if available
      if (dbSessionSolves && currentSession?.convexId) {
        const dbSolvesLocal = convertDbSolvesToLocal(dbSessionSolves);

        // Create a map to avoid duplicates (prioritize database over local storage)
        const solvesMap = new Map();

        // Add local solves first
        localSolves.forEach((solve) => {
          solvesMap.set(solve.id, solve);
        });

        // Add/overwrite with database solves
        dbSolvesLocal.forEach((solve) => {
          solvesMap.set(solve.id, solve);
        });

        // Return sorted array (newest first)
        return Array.from(solvesMap.values()).sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
        );
      }

      // Fallback to local solves only
      return localSolves;
    },
    [
      getSessionHistory,
      dbSessionSolves,
      currentSession?.convexId,
      convertDbSolvesToLocal,
    ]
  );

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

  // Sync active scramble with current scramble changes
  useEffect(() => {
    if (currentScramble && !activeScramble) {
      setActiveScramble(currentScramble);
    }
  }, [currentScramble, activeScramble]);

  // Handle solve completion
  const handleSolveComplete = useCallback(
    async (
      time: number,
      notes?: string,
      tags?: string[],
      splits?: Array<{ phase: string; time: number }>,
      splitMethod?: string,
      timerMode?: "normal" | "manual" | "stackmat"
    ) => {
      if (!currentSession) return null;

      const finalTime = calculateFinalTime(time, "none");
      // Use active scramble instead of current scramble
      const scrambleToUse = activeScramble || currentScramble;
      const solve = {
        time,
        timestamp: new Date(),
        scramble: scrambleToUse,
        penalty: "none" as const,
        finalTime,
        event: selectedEvent,
        sessionId: currentSession.id,
        notes,
        tags,
        splits,
        splitMethod,
        timerMode,
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
      activeScramble,
      currentScramble,
      selectedEvent,
      calculateFinalTime,
      saveSolve,
      getSessionHistory,
      addSolve,
      handleNewScramble,
    ]
  );

  // Handle solve completion with penalty (for manual and stackmat timers)
  const handleSolveCompleteWithPenalty = useCallback(
    async (
      time: number,
      penalty: "none" | "+2" | "DNF",
      notes?: string,
      tags?: string[],
      timerMode?: "normal" | "manual" | "stackmat"
    ) => {
      if (!currentSession) return null;

      const finalTime = calculateFinalTime(time, penalty);
      // Use active scramble instead of current scramble
      const scrambleToUse = activeScramble || currentScramble;
      const solve = {
        time,
        timestamp: new Date(),
        scramble: scrambleToUse,
        penalty,
        finalTime,
        event: selectedEvent,
        sessionId: currentSession.id,
        notes,
        tags,
        timerMode,
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
      activeScramble,
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

  // Handle importing solves
  const handleImportSolves = useCallback(
    async (importedSolves: any[]) => {
      if (!currentSession || !currentSession.convexId || !user?.convexId) {
        console.error("No current session or user not synced to database");
        return;
      }

      console.log(
        `Starting batch import of ${importedSolves.length} solves...`
      );

      try {
        // Prepare solve data for batch import
        const solvesToImport = importedSolves.map((importedSolve) => ({
          event: importedSolve.event || selectedEvent,
          scramble: importedSolve.scramble || "",
          time: importedSolve.time,
          penalty: (importedSolve.penalty || "none") as "none" | "+2" | "DNF",
          finalTime: importedSolve.finalTime || importedSolve.time,
          timestamp: new Date(importedSolve.timestamp).getTime(),
          comment: importedSolve.notes,
          tags: importedSolve.tags,
        }));

        // Use batch import mutation for much better performance
        const result = await batchImportSolves({
          userId: user.convexId as any,
          sessionId: currentSession.convexId as any,
          solves: solvesToImport,
        });

        console.log(
          `Batch import completed: ${result.importedCount}/${result.totalAttempted} solves imported`
        );

        // Update local cache with imported solves
        const localSolves = importedSolves.map((importedSolve, index) => ({
          id: `imported-${Date.now()}-${index}`,
          time: importedSolve.time,
          timestamp: new Date(importedSolve.timestamp),
          scramble: importedSolve.scramble || "",
          penalty: (importedSolve.penalty || "none") as "none" | "+2" | "DNF",
          finalTime: importedSolve.finalTime || importedSolve.time,
          event: importedSolve.event || selectedEvent,
          sessionId: currentSession.id,
          notes: importedSolve.notes,
          tags: importedSolve.tags,
        }));

        // Add solves to local state
        localSolves.forEach((solve) => addSolve(solve));

        // Update session solve count
        const newSolveCount =
          getAllSessionSolves(currentSession.id).length + result.importedCount;
        await updateSessionSolveCount(currentSession.id, newSolveCount);

        console.log(`Successfully imported ${result.importedCount} solves!`);

        if (result.importedCount < result.totalAttempted) {
          console.warn(
            `${result.totalAttempted - result.importedCount} solves failed to import`
          );
        }
      } catch (error) {
        console.error("Batch import failed:", error);
        throw error;
      }
    },
    [
      currentSession,
      selectedEvent,
      user?.convexId,
      batchImportSolves,
      addSolve,
      getAllSessionSolves,
      updateSessionSolveCount,
    ]
  );

  // Handle updating a solve's notes or tags
  const handleUpdateSolve = useCallback(
    async (solveId: string, notes?: string, tags?: string[]) => {
      await updateSolveOperation(solveId, { notes, tags }, updateSolve);
    },
    [updateSolveOperation, updateSolve]
  );

  // Handle editing a solve's time
  const handleEditTime = useCallback(
    async (solveId: string, time: number, penalty: "none" | "+2" | "DNF") => {
      const solve = history.find((s) => s.id === solveId);
      if (!solve) return;

      // Calculate new final time
      let finalTime = time;
      if (penalty === "+2") {
        finalTime = time + 2000;
      } else if (penalty === "DNF") {
        finalTime = Infinity;
      }

      // Update solve in database and local state
      await updateSolveOperation(
        solveId,
        { time, penalty, finalTime },
        updateSolve
      );
    },
    [history, updateSolveOperation, updateSolve]
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
    return <TimerPageSkeleton />;
  }

  return (
    <div className="container-responsive py-4 md:py-8">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
        {/* Left Column - Controls */}
        <div className="xl:col-span-2 space-y-4 md:space-y-6">
          {/* Import/Export */}
          <ImportExportButtons
            history={getAllSessionSolves(currentSession.id)}
            sessions={sessions}
            onImport={handleImportSolves}
          />
          {/* Session & Event Row */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 items-start transition-all duration-500 ease-in-out ${
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
              onPartialScrambleHover={setPartialScramble}
              onActiveScrambleChange={setActiveScramble}
            />
          </div>

          {/* Timer */}
          <div className="xl:mb-0">
            <TimerDisplay
              onSolveComplete={handleSolveComplete}
              onSolveCompleteWithPenalty={handleSolveCompleteWithPenalty}
              onApplyPenalty={handleLastSolvePenalty}
              lastSolveId={lastSolveId}
              onTimerStateChange={handleTimerFocusChange}
              history={getSessionHistory(currentSession.id)}
            />
          </div>
        </div>

        {/* Right Column - Stats & Visualization */}
        <div
          className={`xl:col-span-2 space-y-4 md:space-y-6 order-last xl:order-none transition-all duration-500 ease-in-out ${
            isTimerFocusMode ? "blur-md opacity-50 pointer-events-none" : ""
          }`}
        >
          {/* Scramble Preview */}
          <ScramblePreview
            scramble={activeScramble || currentScramble}
            event={selectedEvent}
            partialScramble={
              partialScramble || activeScramble || currentScramble
            }
          />

          {/* Stats */}
          <StatsDisplay
            history={getSessionHistory(currentSession.id)}
            selectedEvent={selectedEvent}
          />

          {/* History */}
          <TimerHistory
            history={getAllSessionSolves(currentSession.id)}
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