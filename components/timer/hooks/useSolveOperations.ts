import { useCallback } from "react";
import { useDatabaseSync } from "./useDatabaseSync";
import { useLocalStorageManager } from "./useLocalStorageManager";
import { Id } from "../../../convex/_generated/dataModel";

interface TimerRecord {
  id: string;
  time: number;
  timestamp: Date;
  scramble: string;
  penalty: "none" | "+2" | "DNF";
  finalTime: number;
  event: string;
  sessionId: string;
  notes?: string;
  tags?: string[];
  splits?: Array<{ phase: string; time: number }>;
  splitMethod?: string;
}

interface Session {
  id: string;
  name: string;
  event: string;
  createdAt: Date;
  solveCount: number;
  convexId?: string;
}

export const useSolveOperations = (
  userId?: string,
  updateSessionSolveCount?: (sessionId: string, count: number) => Promise<void>
) => {
  const { saveDbSolve, deleteDbSolve, updateDbSolve } = useDatabaseSync(userId);

  const { saveToCache } = useLocalStorageManager(userId);

  // Calculate final time with penalty
  const calculateFinalTime = useCallback(
    (time: number, penalty: "none" | "+2" | "DNF"): number => {
      if (penalty === "DNF") return Infinity;
      if (penalty === "+2") return time + 2000; // add 2 seconds
      return time;
    },
    []
  );

  // Save new solve
  const saveSolve = useCallback(
    async (
      solve: Omit<TimerRecord, "id">,
      currentSession: Session,
      sessionHistory: TimerRecord[],
      addSolveToHistory: (solve: TimerRecord) => void
    ) => {
      if (!currentSession.convexId) return null;

      // Save to database
      const solveId = await saveDbSolve(
        solve,
        currentSession.convexId as Id<"sessions">
      );
      if (!solveId) return null;

      // Complete solve record with ID
      const completeSolve: TimerRecord = {
        ...solve,
        id: solveId,
      };

      // Add to local history
      addSolveToHistory(completeSolve);

      // Update session solve count
      const newSolveCount = sessionHistory.length + 1;
      if (updateSessionSolveCount) {
        await updateSessionSolveCount(currentSession.id, newSolveCount);
      }

      // Update cache
      saveToCache("history", [...sessionHistory, completeSolve]);

      return solveId;
    },
    [saveDbSolve, updateSessionSolveCount, saveToCache]
  );

  // Apply penalty to solve
  const applyPenalty = useCallback(
    async (
      solveId: string,
      penalty: "none" | "+2" | "DNF",
      originalTime: number,
      updateSolveInHistory: (
        solveId: string,
        updates: Partial<TimerRecord>
      ) => void
    ) => {
      const finalTime = calculateFinalTime(originalTime, penalty);

      // Update database
      const success = await updateDbSolve(solveId, { penalty, finalTime });
      if (!success) return false;

      // Update local history
      updateSolveInHistory(solveId, { penalty, finalTime });

      return true;
    },
    [calculateFinalTime, updateDbSolve]
  );

  // Delete solve
  const deleteSolve = useCallback(
    async (
      solveId: string,
      currentSession: Session,
      sessionHistory: TimerRecord[],
      removeSolveFromHistory: (solveId: string) => void
    ) => {
      // Delete from database
      const success = await deleteDbSolve(solveId);
      if (!success) return false;

      // Remove from local history
      removeSolveFromHistory(solveId);

      // Update session solve count
      const newSolveCount = sessionHistory.length - 1;
      if (updateSessionSolveCount) {
        await updateSessionSolveCount(currentSession.id, newSolveCount);
      }

      // Update cache
      const updatedHistory = sessionHistory.filter(
        (solve) => solve.id !== solveId
      );
      saveToCache("history", updatedHistory);

      return true;
    },
    [deleteDbSolve, updateSessionSolveCount, saveToCache]
  );

  // Clear all solves in current session
  const clearSessionSolves = useCallback(
    async (
      sessionHistory: TimerRecord[],
      currentSession: Session,
      clearSessionFromHistory: (sessionId: string) => void
    ) => {
      // Delete all solves from database
      const deletePromises = sessionHistory.map((solve) =>
        deleteDbSolve(solve.id)
      );
      const results = await Promise.all(deletePromises);

      // Check if all deletes were successful
      const allDeleted = results.every((success) => success);
      if (!allDeleted) {
        console.error("Some solves failed to delete from database");
        return false;
      }

      // Clear from local history
      clearSessionFromHistory(currentSession.id);

      // Update session solve count
      if (updateSessionSolveCount) {
        await updateSessionSolveCount(currentSession.id, 0);
      }

      // Update cache
      saveToCache("history", []);

      return true;
    },
    [deleteDbSolve, updateSessionSolveCount, saveToCache]
  );

  // Update solve (notes, tags)
  const updateSolve = useCallback(
    async (
      solveId: string,
      updates: { notes?: string; tags?: string[] },
      updateSolveInHistory: (
        solveId: string,
        updates: Partial<TimerRecord>
      ) => void
    ) => {
      // Update database
      const success = await updateDbSolve(solveId, updates);
      if (!success) return false;

      // Update local history
      updateSolveInHistory(solveId, updates);

      return true;
    },
    [updateDbSolve]
  );

  return {
    saveSolve,
    applyPenalty,
    deleteSolve,
    clearSessionSolves,
    updateSolve,
    calculateFinalTime,
  };
};