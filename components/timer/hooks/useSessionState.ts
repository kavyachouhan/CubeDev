import { useState, useEffect, useCallback } from "react";
import { useDatabaseSync } from "./useDatabaseSync";
import { useLocalStorageManager } from "./useLocalStorageManager";

interface Session {
  id: string;
  name: string;
  event: string;
  createdAt: Date;
  solveCount: number;
  convexId?: string;
}

export const useSessionState = (userId?: string) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [isSessionsInitialized, setIsSessionsInitialized] = useState(false);

  const {
    dbSessions,
    createDbSession,
    updateDbSession,
    deleteDbSession,
    convertDbSessionsToLocal,
    isLoading,
  } = useDatabaseSync(userId);

  const { loadFromCache, saveToCache } = useLocalStorageManager(userId);

  // Initialize sessions from database or cache
  useEffect(() => {
    // Already initialized
    if (isSessionsInitialized) return;

    // Wait for database sessions to load
    if (dbSessions === undefined) return;

    const initializeSessions = async () => {
      let allSessions: Session[] = [];
      let defaultSession: Session | null = null;

      // If database sessions exist, use them
      if (dbSessions && dbSessions.length > 0) {
        // Convert database sessions to local format
        allSessions = convertDbSessionsToLocal(dbSessions);

        // Try to load the previously selected session from cache
        const cachedCurrentSession = loadFromCache(
          "currentSession",
          null
        ) as Session | null;
        if (
          cachedCurrentSession &&
          allSessions.find((s) => s.id === cachedCurrentSession.id)
        ) {
          // Use cached session if it exists in database sessions
          defaultSession =
            allSessions.find((s) => s.id === cachedCurrentSession.id) ||
            allSessions[0];
        } else {
          defaultSession = allSessions[0];
        }
      } else {
        // No database sessions - try to load from cache
        const sessionName = "Session 1";
        const event = "333";
        const newSessionId = await createDbSession(sessionName, event);

        if (newSessionId) {
          defaultSession = {
            id: newSessionId,
            name: sessionName,
            event,
            createdAt: new Date(),
            solveCount: 0,
            convexId: newSessionId,
          };
          allSessions = [defaultSession];
        }
      }

      // Update state
      setSessions(allSessions);
      setCurrentSession(defaultSession);

      // Save to cache
      if (allSessions.length > 0) {
        saveToCache("sessions", allSessions);
        if (defaultSession) {
          saveToCache("currentSession", defaultSession);
        }
      }

      setIsSessionsInitialized(true);
    };

    initializeSessions();
  }, [
    dbSessions,
    isSessionsInitialized,
    createDbSession,
    convertDbSessionsToLocal,
    saveToCache,
  ]);

  // Handle changing current session
  const handleSessionChange = useCallback(
    (session: Session) => {
      setCurrentSession(session);
      saveToCache("currentSession", session);
    },
    [saveToCache]
  );

  // Handle creating new session
  const handleCreateSession = useCallback(
    async (name: string, event: string) => {
      if (!userId) return;

      const newSessionId = await createDbSession(name, event);
      if (!newSessionId) return;

      const newSession: Session = {
        id: newSessionId,
        name,
        event,
        createdAt: new Date(),
        solveCount: 0,
        convexId: newSessionId,
      };

      // Update local state
      const updatedSessions = [...sessions, newSession];
      setSessions(updatedSessions);
      setCurrentSession(newSession);

      // Update cache
      saveToCache("sessions", updatedSessions);
      saveToCache("currentSession", newSession);
    },
    [userId, sessions, createDbSession, saveToCache]
  );

  // Handle renaming session
  const handleRenameSession = useCallback(
    async (sessionId: string, newName: string) => {
      // Update in database
      const success = await updateDbSession(sessionId, { name: newName });
      if (!success) return;

      // Update local state
      const updatedSessions = sessions.map((session) =>
        session.id === sessionId ? { ...session, name: newName } : session
      );
      setSessions(updatedSessions);

      // Update current session if it's the one being renamed
      if (currentSession?.id === sessionId) {
        const updatedCurrentSession = { ...currentSession, name: newName };
        setCurrentSession(updatedCurrentSession);
        saveToCache("currentSession", updatedCurrentSession);
      }

      // Update cache
      saveToCache("sessions", updatedSessions);
    },
    [sessions, currentSession, updateDbSession, saveToCache]
  );

  // Handle deleting session
  const handleDeleteSession = useCallback(
    async (sessionId: string) => {
      if (sessions.length <= 1) return; // Prevent deleting last session

      // Delete from database
      const success = await deleteDbSession(sessionId);
      if (!success) return;

      // Update local state
      const updatedSessions = sessions.filter(
        (session) => session.id !== sessionId
      );
      setSessions(updatedSessions);

      // If the deleted session was the current one, switch to another session
      if (currentSession?.id === sessionId) {
        const newCurrentSession = updatedSessions[0];
        setCurrentSession(newCurrentSession);
        saveToCache("currentSession", newCurrentSession);
      }

      // Update cache
      saveToCache("sessions", updatedSessions);
    },
    [sessions, currentSession, deleteDbSession, saveToCache]
  );

  // Update solve count for a session (locally only)
  const updateSessionSolveCount = useCallback(
    async (sessionId: string, count: number) => {
      // Update local state
      const updatedSessions = sessions.map((session) =>
        session.id === sessionId ? { ...session, solveCount: count } : session
      );
      setSessions(updatedSessions);

      // Update current session if applicable
      if (currentSession?.id === sessionId) {
        const updatedCurrentSession = { ...currentSession, solveCount: count };
        setCurrentSession(updatedCurrentSession);
        saveToCache("currentSession", updatedCurrentSession);
      }

      // Update cache
      saveToCache("sessions", updatedSessions);
    },
    [sessions, currentSession, saveToCache]
  );

  return {
    // State
    sessions,
    currentSession,
    isSessionsInitialized,
    isLoading,

    // Actions
    handleSessionChange,
    handleCreateSession,
    handleRenameSession,
    handleDeleteSession,
    updateSessionSolveCount,

    // Setters (for advanced use cases)
    setSessions,
    setCurrentSession,
  };
};