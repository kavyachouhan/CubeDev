import { useMutation, useQuery } from "convex/react";
import { useCallback } from "react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { TimerRecord } from "../../../lib/stats-utils";

interface Session {
  id: string;
  name: string;
  event: string;
  createdAt: Date;
  solveCount: number;
  convexId?: string;
}

export const useDatabaseSync = (userId?: string) => {
  const userIdAsId = userId as Id<"users"> | undefined;
  // Convex mutations
  const saveSolve = useMutation(api.users.saveSolve);
  const createSession = useMutation(api.users.createSession);
  const updateSession = useMutation(api.users.updateSession);
  const deleteSolve = useMutation(api.users.deleteSolve);
  const deleteSession = useMutation(api.users.deleteSession);
  const updateSolve = useMutation(api.users.updateSolve);

  // Convex queries
  const dbSessions = useQuery(
    api.users.getUserSessions,
    userIdAsId ? { userId: userIdAsId } : "skip"
  );
  const dbSolves = useQuery(
    api.users.getUserSolves,
    userIdAsId ? { userId: userIdAsId } : "skip"
  );

  // Convert database sessions to local format
  const convertDbSessionsToLocal = useCallback(
    (dbSessions: any[]): Session[] => {
      return dbSessions.map((dbSession) => ({
        id: dbSession._id,
        name: dbSession.name,
        event: dbSession.event,
        createdAt: new Date(dbSession.createdAt),
        solveCount: dbSession.solveCount || 0,
        convexId: dbSession._id,
      }));
    },
    []
  );

  // Convert database solves to local format
  const convertDbSolvesToLocal = useCallback(
    (dbSolves: any[]): TimerRecord[] => {
      return dbSolves.map((dbSolve) => ({
        id: dbSolve._id,
        time: dbSolve.time,
        timestamp: new Date(dbSolve.solveDate), // Map solveDate to timestamp
        scramble: dbSolve.scramble,
        penalty: dbSolve.penalty,
        finalTime: dbSolve.finalTime,
        event: dbSolve.event,
        sessionId: dbSolve.sessionId,
        notes: dbSolve.comment, // Map comment to notes
        tags: dbSolve.tags,
        splits: dbSolve.splits, // Map phase split data
        splitMethod: dbSolve.splitMethod, // Map split method
        timerMode: dbSolve.timerMode, // Map timer mode
      }));
    },
    []
  );

  // Save new solve to database
  const saveDbSolve = async (
    solve: Omit<TimerRecord, "id">,
    sessionConvexId: Id<"sessions">
  ): Promise<string | null> => {
    if (!userId) return null;

    try {
      const solveId = await saveSolve({
        userId: userIdAsId!,
        sessionId: sessionConvexId,
        time: solve.time,
        scramble: solve.scramble,
        penalty: solve.penalty,
        finalTime: solve.finalTime,
        event: solve.event,
        comment: solve.notes,
        tags: solve.tags,
        splits: solve.splits,
        splitMethod: solve.splitMethod,
        timerMode: solve.timerMode,
      });
      return solveId;
    } catch (error) {
      console.error("Failed to save solve to database:", error);
      return null;
    }
  };

  // Create new session in database
  const createDbSession = async (
    name: string,
    event: string
  ): Promise<string | null> => {
    if (!userId) return null;

    try {
      const sessionId = await createSession({
        userId: userIdAsId!,
        name,
        event,
      });
      return sessionId;
    } catch (error) {
      console.error("Failed to create session in database:", error);
      return null;
    }
  };

  // Update session in database
  const updateDbSession = async (
    sessionId: string,
    updates: Partial<{ name: string; event: string; isActive: boolean }>
  ): Promise<boolean> => {
    if (!userId) return false;

    try {
      // Only include valid fields
      const validUpdates: any = {};
      if (updates.name !== undefined) validUpdates.name = updates.name;
      if (updates.event !== undefined) validUpdates.event = updates.event;
      if (updates.isActive !== undefined)
        validUpdates.isActive = updates.isActive;

      await updateSession({
        sessionId: sessionId as Id<"sessions">,
        ...validUpdates,
      });
      return true;
    } catch (error) {
      console.error("Failed to update session in database:", error);
      return false;
    }
  };

  // Delete solve from database
  const deleteDbSolve = async (solveId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      await deleteSolve({ solveId: solveId as Id<"solves"> });
      return true;
    } catch (error) {
      console.error("Failed to delete solve from database:", error);
      return false;
    }
  };

  // Delete session from database
  const deleteDbSession = async (sessionId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      await deleteSession({ sessionId: sessionId as Id<"sessions"> });
      return true;
    } catch (error) {
      console.error("Failed to delete session from database:", error);
      return false;
    }
  };

  // Update solve in database
  const updateDbSolve = async (
    solveId: string,
    updates: Partial<{
      time: number;
      penalty: "none" | "+2" | "DNF";
      finalTime: number;
      notes: string;
      tags: string[];
    }>
  ): Promise<boolean> => {
    if (!userId) return false;

    try {
      // Only include valid fields and map notes to comment
      const dbUpdates: any = { ...updates };
      if ("notes" in updates) {
        dbUpdates.comment = updates.notes;
        delete dbUpdates.notes;
      }

      await updateSolve({
        solveId: solveId as Id<"solves">,
        ...dbUpdates,
      });
      return true;
    } catch (error) {
      console.error("Failed to update solve in database:", error);
      return false;
    }
  };

  return {
    // Data from database
    dbSessions,
    dbSolves,

    // Converters
    convertDbSessionsToLocal,
    convertDbSolvesToLocal,

    // Actions
    saveDbSolve,
    createDbSession,
    updateDbSession,
    deleteDbSolve,
    deleteDbSession,
    updateDbSolve,

    // Loading state
    isLoading: dbSessions === undefined || dbSolves === undefined,
  };
};