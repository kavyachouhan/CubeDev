"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { OwnerUser } from "@/convex/userProjection";
import { useUser } from "@/components/UserProvider";
import { useConfirmDelete } from "@/components/ui/useConfirmDelete";
import type { TimerRecord } from "@/lib/stats-utils";
import {
  useExtendedStatsVisibility,
  type ExtendedStatsVisibility,
} from "../StatsVisibilitySettings";
import { useDatabaseSync } from "./useDatabaseSync";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import { useLocalStorageManager } from "./useLocalStorageManager";
import { useSessionState, type Session } from "./useSessionState";
import { useSolveOperations } from "./useSolveOperations";
import { useTimerState } from "./useTimerState";

export type Penalty = "none" | "+2" | "DNF";
export type TimerMode = "normal" | "manual" | "stackmat";

/** Values that change as the user solves. */
export interface TimerPageData {
  /** Non-null: consumers only render once `isPageLoading` is false. */
  currentSession: Session;
  sessions: Session[];
  selectedEvent: string;
  currentScramble: string;
  /** The scramble a solve will be recorded against; differs while stepping back. */
  activeScramble: string;
  /** Prefix of the scramble being hovered/tapped, for the preview. */
  partialScramble: string;
  /** Every session's solves — needed by shortcuts and the session list counts. */
  history: TimerRecord[];
  /** The current session's solves, database merged over local cache. */
  sessionSolves: TimerRecord[];
  lastSolveId: string | null;
  isTimerFocusMode: boolean;
  isImportModalOpen: boolean;
  extendedStatsVisibility: ExtendedStatsVisibility;
}

/**
 * Handlers for the timer page. Every member is referentially stable, so this
 * object is created once and consumers that only need actions never re-render.
 */
export interface TimerPageActions {
  handleNewScramble: () => Promise<void>;
  handleEventChange: (event: string) => void;
  setPartialScramble: (scramble: string) => void;
  setActiveScramble: (scramble: string) => void;

  handleSessionChangeWithEvent: (session: Session) => void;
  handleCreateSession: (name: string, event: string) => Promise<void>;
  handleRenameSession: (sessionId: string, newName: string) => void;
  handleDeleteSession: (sessionId: string) => void;

  handleSolveComplete: (
    time: number,
    notes?: string,
    tags?: string[],
    splits?: Array<{ phase: string; time: number }>,
    splitMethod?: string,
    timerMode?: TimerMode,
  ) => Promise<string | null>;
  handleSolveCompleteWithPenalty: (
    time: number,
    penalty: Penalty,
    notes?: string,
    tags?: string[],
    timerMode?: TimerMode,
  ) => Promise<string | null>;
  handleApplyPenalty: (solveId: string, penalty: Penalty) => Promise<void>;
  handleLastSolvePenalty: (penalty: Penalty) => void;
  handleDeleteSolve: (solveId: string) => Promise<void>;
  handleUpdateSolve: (
    solveId: string,
    notes?: string,
    tags?: string[],
  ) => Promise<void>;
  handleEditTime: (
    solveId: string,
    time: number,
    penalty: Penalty,
  ) => Promise<void>;
  handleClearHistory: () => Promise<void>;
  handleImportSolves: (importedSolves: any[]) => Promise<void>;
  setIsImportModalOpen: (open: boolean) => void;

  handleTimerFocusChange: (isActive: boolean) => void;
  toggleExtendedStat: (stat: keyof ExtendedStatsVisibility) => void;
}

export interface TimerPageController {
  /** Null until the session and database have loaded. */
  data: TimerPageData | null;
  actions: TimerPageActions;
  isPageLoading: boolean;
  gettingStarted: {
    isOpen: boolean;
    onClose: () => void;
    onImportNow: () => void;
    onCreateFocusedSession: () => void;
    isCreatingSession: boolean;
  };
  shortcutDelete: ReturnType<typeof useConfirmDelete<void>>;
}

/**
 * All timer page state and behaviour, independent of how it is laid out.
 *
 * This runs once per page. Keyboard shortcuts live here rather than in a layout
 * so that switching layouts cannot register a second set of global listeners.
 */
export function useTimerPageController(
  onTimerFocusChange?: (isActive: boolean) => void,
): TimerPageController {
  const { user } = useUser();

  const [partialScramble, setPartialScramble] = useState<string>("");
  const [activeScramble, setActiveScramble] = useState<string>("");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isGettingStartedOpen, setIsGettingStartedOpen] = useState(false);
  const [hasAutoPromptedThisVisit, setHasAutoPromptedThisVisit] =
    useState(false);
  const [isCreatingFocusedSession, setIsCreatingFocusedSession] =
    useState(false);

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
    visibility: extendedStatsVisibility,
    toggleStat: toggleExtendedStat,
  } = useExtendedStatsVisibility();

  // Pagination cursor for the current session's solves
  const [sessionSolvesCursor, setSessionSolvesCursor] = useState<string | null>(
    null,
  );
  const [allSessionSolves, setAllSessionSolves] = useState<any[]>([]);

  const dbSessionSolvesResult = useQuery(
    api.users.getSessionSolves,
    currentSession?.convexId
      ? {
          sessionId: currentSession.convexId as any,
          limit: 1000, // Load 1000 at a time for smoother experience
          cursor: sessionSolvesCursor || undefined,
        }
      : "skip",
  );

  // Accumulate solves as we paginate
  useEffect(() => {
    if (dbSessionSolvesResult?.solves) {
      setAllSessionSolves((prev) => {
        // First fetch (no cursor) replaces; later pages append
        if (!sessionSolvesCursor) {
          return dbSessionSolvesResult.solves;
        }
        const existingIds = new Set(prev.map((s: any) => s._id));
        const newSolves = dbSessionSolvesResult.solves.filter(
          (s: any) => !existingIds.has(s._id),
        );
        return [...prev, ...newSolves];
      });
    }
  }, [dbSessionSolvesResult, sessionSolvesCursor]);

  // Reset accumulated solves when session changes
  useEffect(() => {
    setAllSessionSolves([]);
    setSessionSolvesCursor(null);
  }, [currentSession?.convexId]);

  const dbSessionSolves = allSessionSolves;

  const batchImportSolves = useMutation(api.users.batchImportSolves);
  const dismissTimerImportOnboarding = useMutation(
    api.users.dismissTimerImportOnboarding,
  );
  const completeTimerImportOnboarding = useMutation(
    api.users.completeTimerImportOnboarding,
  );

  // getUserById returns the owner projection for the signed-in user.
  const userProfile = useQuery(
    api.users.getUserById,
    user?.convexId
      ? {
          id: user.convexId,
        }
      : "skip",
  ) as Partial<OwnerUser> | null | undefined;

  const userSolveCount = useQuery(
    api.users.getUserSolveCount,
    user?.convexId
      ? {
          userId: user.convexId as any,
        }
      : "skip",
  );

  const {
    saveSolve,
    applyPenalty,
    deleteSolve,
    clearSessionSolves,
    updateSolve: updateSolveOperation,
  } = useSolveOperations(user?.convexId, updateSessionSolveCount);

  /**
   * Solves for the current session, database merged over local cache.
   *
   * Memoized because every consumer on the page needs the same list; computing
   * it per call site rebuilt a Map over up to 1000 solves several times a
   * render and handed each panel a fresh array identity.
   */
  const sessionSolves = useMemo(() => {
    if (!currentSession) return [];

    // Local solves for this session
    const localSolves = getSessionHistory(currentSession.id);

    if (!dbSessionSolves || !currentSession.convexId) return localSolves;

    const dbSolvesLocal = convertDbSolvesToLocal(dbSessionSolves);

    // Map keyed by id so database rows win over the local cache
    const solvesMap = new Map();
    localSolves.forEach((solve) => solvesMap.set(solve.id, solve));
    dbSolvesLocal.forEach((solve) => solvesMap.set(solve.id, solve));

    // Newest first
    return Array.from(solvesMap.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
  }, [
    currentSession,
    getSessionHistory,
    dbSessionSolves,
    convertDbSolvesToLocal,
  ]);

  const handleTimerFocusChange = useCallback(
    (isActive: boolean) => {
      setTimerFocusMode(isActive);
      onTimerFocusChange?.(isActive);
    },
    [setTimerFocusMode, onTimerFocusChange],
  );

  const handleSessionChangeWithEvent = useCallback(
    (session: Session) => {
      handleSessionChange(session);
      // Keep the selected event in step with the session's own event
      if (session.event !== selectedEvent) {
        handleEventChange(session.event);
      }
    },
    [handleSessionChange, handleEventChange, selectedEvent],
  );

  const handleNextSession = useCallback(() => {
    if (!sessions || sessions.length === 0 || !currentSession) return;
    const currentIndex = sessions.findIndex((s) => s.id === currentSession.id);
    const nextIndex = (currentIndex + 1) % sessions.length;
    handleSessionChange(sessions[nextIndex]);
  }, [sessions, currentSession, handleSessionChange]);

  const handlePrevSession = useCallback(() => {
    if (!sessions || sessions.length === 0 || !currentSession) return;
    const currentIndex = sessions.findIndex((s) => s.id === currentSession.id);
    const prevIndex =
      currentIndex <= 0 ? sessions.length - 1 : currentIndex - 1;
    handleSessionChange(sessions[prevIndex]);
  }, [sessions, currentSession, handleSessionChange]);

  const handleDeleteLastSolve = useCallback(async () => {
    if (!currentSession || !lastSolveId) return;
    await deleteSolve(
      lastSolveId,
      currentSession,
      getSessionHistory(currentSession.id),
      removeSolve,
    );
  }, [currentSession, lastSolveId, deleteSolve, getSessionHistory, removeSolve]);

  const shortcutDelete = useConfirmDelete(async () => {
    if (!currentSession) return;
    await clearSessionSolves(
      getSessionHistory(currentSession.id),
      currentSession,
      clearSessionHistory,
    );
  });

  const handleMarkDnf = useCallback(() => {
    if (!lastSolveId) return;
    const solve = history.find((s) => s.id === lastSolveId);
    if (solve) applyPenalty(lastSolveId, "DNF", solve.time, updateSolve);
  }, [lastSolveId, history, applyPenalty, updateSolve]);

  const handleMarkPlus2 = useCallback(() => {
    if (!lastSolveId) return;
    const solve = history.find((s) => s.id === lastSolveId);
    if (solve) applyPenalty(lastSolveId, "+2", solve.time, updateSolve);
  }, [lastSolveId, history, applyPenalty, updateSolve]);

  const handleMarkOk = useCallback(() => {
    if (!lastSolveId) return;
    const solve = history.find((s) => s.id === lastSolveId);
    if (solve) applyPenalty(lastSolveId, "none", solve.time, updateSolve);
  }, [lastSolveId, history, applyPenalty, updateSolve]);

  // Registered once per page, never per layout
  useKeyboardShortcuts({
    onEventChange: handleEventChange,
    onNextScramble: handleNewScramble,
    onClearSession: () => {
      if (currentSession) shortcutDelete.request();
    },
    onDeleteLastSolve: handleDeleteLastSolve,
    onNextSession: handleNextSession,
    onPrevSession: handlePrevSession,
    onMarkDnf: handleMarkDnf,
    onMarkPlus2: handleMarkPlus2,
    onMarkOk: handleMarkOk,
    timerRunning: isTimerFocusMode,
    isTimerPage: true,
  });

  // Seed the complete history from the database, else the local cache
  useEffect(() => {
    if (!isSessionsInitialized || dbSolves === undefined) return;

    if (dbSolves && dbSolves.length > 0) {
      const solveHistory = convertDbSolvesToLocal(dbSolves);
      setCompleteHistory(solveHistory);
      saveToCache("history", solveHistory);
    } else {
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

  // Follow the current scramble unless the user has stepped back
  useEffect(() => {
    if (currentScramble) {
      setActiveScramble(currentScramble);
      setPartialScramble("");
    }
  }, [currentScramble]);

  const handleSolveComplete = useCallback(
    async (
      time: number,
      notes?: string,
      tags?: string[],
      splits?: Array<{ phase: string; time: number }>,
      splitMethod?: string,
      timerMode?: TimerMode,
    ) => {
      if (!currentSession) return null;

      const finalTime = calculateFinalTime(time, "none");
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

      const solveId = await saveSolve(
        solve,
        currentSession,
        getSessionHistory(currentSession.id),
        addSolve,
      );

      if (solveId) {
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
    ],
  );

  const handleSolveCompleteWithPenalty = useCallback(
    async (
      time: number,
      penalty: Penalty,
      notes?: string,
      tags?: string[],
      timerMode?: TimerMode,
    ) => {
      if (!currentSession) return null;

      const finalTime = calculateFinalTime(time, penalty);
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

      const solveId = await saveSolve(
        solve,
        currentSession,
        getSessionHistory(currentSession.id),
        addSolve,
      );

      if (solveId) {
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
    ],
  );

  const handleApplyPenalty = useCallback(
    async (solveId: string, penalty: Penalty) => {
      const solve = history.find((s) => s.id === solveId);
      if (!solve) return;

      await applyPenalty(solveId, penalty, solve.time, updateSolve);
    },
    [history, applyPenalty, updateSolve],
  );

  const handleDeleteSolve = useCallback(
    async (solveId: string) => {
      if (!currentSession) return;

      await deleteSolve(
        solveId,
        currentSession,
        getSessionHistory(currentSession.id),
        removeSolve,
      );
    },
    [currentSession, deleteSolve, getSessionHistory, removeSolve],
  );

  const handleClearHistory = useCallback(async () => {
    if (!currentSession) return;

    await clearSessionSolves(
      getSessionHistory(currentSession.id),
      currentSession,
      clearSessionHistory,
    );
  }, [
    currentSession,
    clearSessionSolves,
    getSessionHistory,
    clearSessionHistory,
  ]);

  const handleImportSolves = useCallback(
    async (importedSolves: any[]) => {
      if (!currentSession || !currentSession.convexId || !user?.convexId) {
        console.error("No current session or user not synced to database");
        return;
      }

      console.log(
        `Starting batch import of ${importedSolves.length} solves...`,
      );

      try {
        const solvesToImport = importedSolves.map((importedSolve) => ({
          event: importedSolve.event || selectedEvent,
          scramble: importedSolve.scramble || "",
          time: importedSolve.time,
          penalty: (importedSolve.penalty || "none") as Penalty,
          finalTime: importedSolve.finalTime || importedSolve.time,
          timestamp: new Date(importedSolve.timestamp).getTime(),
          comment: importedSolve.notes,
          tags: importedSolve.tags,
        }));

        // Chunk to the per-mutation cap; there is no overall import size limit
        const IMPORT_BATCH_SIZE = 2000;
        let importedCount = 0;
        let totalAttempted = 0;
        for (let i = 0; i < solvesToImport.length; i += IMPORT_BATCH_SIZE) {
          const chunk = solvesToImport.slice(i, i + IMPORT_BATCH_SIZE);
          const result = await batchImportSolves({
            userId: user.convexId as any,
            sessionId: currentSession.convexId as any,
            solves: chunk,
          });
          importedCount += result.importedCount;
          totalAttempted += result.totalAttempted;
        }
        const result = { importedCount, totalAttempted };

        console.log(
          `Batch import completed: ${result.importedCount}/${result.totalAttempted} solves imported`,
        );

        const localSolves = importedSolves.map((importedSolve, index) => ({
          id: `imported-${Date.now()}-${index}`,
          time: importedSolve.time,
          timestamp: new Date(importedSolve.timestamp),
          scramble: importedSolve.scramble || "",
          penalty: (importedSolve.penalty || "none") as Penalty,
          finalTime: importedSolve.finalTime || importedSolve.time,
          event: importedSolve.event || selectedEvent,
          sessionId: currentSession.id,
          notes: importedSolve.notes,
          tags: importedSolve.tags,
        }));

        localSolves.forEach((solve) => addSolve(solve));

        const newSolveCount = sessionSolves.length + result.importedCount;
        await updateSessionSolveCount(currentSession.id, newSolveCount);

        console.log(`Successfully imported ${result.importedCount} solves!`);

        if (result.importedCount > 0) {
          try {
            await completeTimerImportOnboarding({
              userId: user.convexId as any,
            });
          } catch (completionError) {
            console.error(
              "Failed to mark timer onboarding as completed:",
              completionError,
            );
          }
        }

        if (result.importedCount < result.totalAttempted) {
          console.warn(
            `${result.totalAttempted - result.importedCount} solves failed to import`,
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
      completeTimerImportOnboarding,
      addSolve,
      sessionSolves,
      updateSessionSolveCount,
    ],
  );

  const canEvaluateOnboarding =
    Boolean(user?.convexId) &&
    isSessionsInitialized &&
    !isDbLoading &&
    !isSessionLoading &&
    userProfile !== undefined &&
    userSolveCount !== undefined;

  const hasAnySolves = typeof userSolveCount === "number" && userSolveCount > 0;
  const isOnboardingCompleted = Boolean(
    userProfile?.timerImportOnboardingCompletedAt,
  );
  const nextPromptAt = userProfile?.timerImportOnboardingNextPromptAt ?? 0;
  const shouldShowGettingStarted =
    canEvaluateOnboarding &&
    !hasAnySolves &&
    !isOnboardingCompleted &&
    Date.now() >= nextPromptAt;

  useEffect(() => {
    if (!shouldShowGettingStarted) {
      setHasAutoPromptedThisVisit(false);
      return;
    }

    if (hasAutoPromptedThisVisit) {
      return;
    }

    setIsGettingStartedOpen(true);
    setHasAutoPromptedThisVisit(true);
  }, [shouldShowGettingStarted, hasAutoPromptedThisVisit]);

  const handleDismissGettingStarted = useCallback(async () => {
    setIsGettingStartedOpen(false);

    if (!user?.convexId) return;

    try {
      await dismissTimerImportOnboarding({
        userId: user.convexId as any,
      });
    } catch (error) {
      console.error("Failed to dismiss timer onboarding:", error);
    }
  }, [dismissTimerImportOnboarding, user?.convexId]);

  const handleOpenImportFromOnboarding = useCallback(() => {
    setIsGettingStartedOpen(false);
    setIsImportModalOpen(true);
  }, []);

  const getFocusedSessionName = useCallback(() => {
    const baseName = "Focused Session";
    const existingNames = new Set(
      (sessions || []).map((session) => session.name.toLowerCase()),
    );

    if (!existingNames.has(baseName.toLowerCase())) {
      return baseName;
    }

    let suffix = 2;
    let candidate = `${baseName} ${suffix}`;
    while (existingNames.has(candidate.toLowerCase())) {
      suffix += 1;
      candidate = `${baseName} ${suffix}`;
    }

    return candidate;
  }, [sessions]);

  const handleCreateFocusedSession = useCallback(async () => {
    if (!user?.convexId || isCreatingFocusedSession) return;

    setIsCreatingFocusedSession(true);

    try {
      await handleCreateSession(getFocusedSessionName(), selectedEvent);
      await dismissTimerImportOnboarding({
        userId: user.convexId as any,
      });
      setIsGettingStartedOpen(false);
    } catch (error) {
      console.error("Failed to create focused session:", error);
    } finally {
      setIsCreatingFocusedSession(false);
    }
  }, [
    user?.convexId,
    isCreatingFocusedSession,
    handleCreateSession,
    getFocusedSessionName,
    selectedEvent,
    dismissTimerImportOnboarding,
  ]);

  const handleUpdateSolve = useCallback(
    async (solveId: string, notes?: string, tags?: string[]) => {
      await updateSolveOperation(solveId, { notes, tags }, updateSolve);
    },
    [updateSolveOperation, updateSolve],
  );

  const handleEditTime = useCallback(
    async (solveId: string, time: number, penalty: Penalty) => {
      const solve = history.find((s) => s.id === solveId);
      if (!solve) return;

      let finalTime = time;
      if (penalty === "+2") {
        finalTime = time + 2000;
      } else if (penalty === "DNF") {
        finalTime = Infinity;
      }

      await updateSolveOperation(
        solveId,
        { time, penalty, finalTime },
        updateSolve,
      );
    },
    [history, updateSolveOperation, updateSolve],
  );

  const handleLastSolvePenalty = useCallback(
    (penalty: Penalty) => {
      if (lastSolveId) {
        handleApplyPenalty(lastSolveId, penalty);
      }
    },
    [lastSolveId, handleApplyPenalty],
  );

  const isPageLoading = !currentSession || isDbLoading || isSessionLoading;

  const data = useMemo<TimerPageData | null>(() => {
    if (!currentSession) return null;
    return {
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
    };
  }, [
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
  ]);

  const actions = useMemo<TimerPageActions>(
    () => ({
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
    }),
    [
      handleNewScramble,
      handleEventChange,
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
      handleTimerFocusChange,
      toggleExtendedStat,
    ],
  );

  const gettingStarted = useMemo(
    () => ({
      isOpen: isGettingStartedOpen,
      onClose: handleDismissGettingStarted,
      onImportNow: handleOpenImportFromOnboarding,
      onCreateFocusedSession: handleCreateFocusedSession,
      isCreatingSession: isCreatingFocusedSession,
    }),
    [
      isGettingStartedOpen,
      handleDismissGettingStarted,
      handleOpenImportFromOnboarding,
      handleCreateFocusedSession,
      isCreatingFocusedSession,
    ],
  );

  return { data, actions, isPageLoading, gettingStarted, shortcutDelete };
}
