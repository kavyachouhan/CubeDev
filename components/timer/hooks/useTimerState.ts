import { useState, useCallback, useEffect } from "react";
import { scrambleGenerator } from "../ScrambleGenerator";

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
}

// Custom hook to persist a string state in localStorage
function usePersistentString(key: string, defaultValue: string) {
  const [state, setState] = useState<string>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? defaultValue : raw;
    } catch {
      return defaultValue;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, state);
    } catch {}
  }, [key, state]);
  return [state, setState] as const;
}

export const useTimerState = () => {
  // Timer state
  const [history, setHistory] = useState<TimerRecord[]>([]);
  const [selectedEvent, setSelectedEvent] = usePersistentString(
    "cubelab-selected-event",
    "333"
  );
  const [currentScramble, setCurrentScramble] = useState("R U R' U' F R F'");
  const [lastSolveId, setLastSolveId] = useState<string | null>(null);
  const [isTimerFocusMode, setIsTimerFocusMode] = useState(false);

  // Generate new scramble
  const handleNewScramble = useCallback(async () => {
    try {
      const newScramble =
        await scrambleGenerator.generateScramble(selectedEvent);
      setCurrentScramble(newScramble);
    } catch (error) {
      console.error("Failed to generate scramble:", error);
      setCurrentScramble("R U R' U' F R F'"); // fallback
    }
  }, [selectedEvent]);

  // Handle event change
  const handleEventChange = useCallback(
    async (newEvent: string) => {
      console.log(
        "Event change requested:",
        newEvent,
        "Current:",
        selectedEvent
      );
      if (newEvent === selectedEvent) return;

      setSelectedEvent(newEvent);
      try {
        const newScramble = await scrambleGenerator.generateScramble(newEvent);
        setCurrentScramble(newScramble);
      } catch (error) {
        console.error("Failed to generate scramble for new event:", error);
        setCurrentScramble("R U R' U' F R F'"); // fallback
      }
    },
    [selectedEvent, setSelectedEvent]
  );

  // Add solve to history
  const addSolve = useCallback((solve: TimerRecord) => {
    setHistory((prev) => [...prev, solve]);
    setLastSolveId(solve.id);
  }, []);

  // Update solve in history
  const updateSolve = useCallback(
    (solveId: string, updates: Partial<TimerRecord>) => {
      setHistory((prev) =>
        prev.map((solve) =>
          solve.id === solveId ? { ...solve, ...updates } : solve
        )
      );
    },
    []
  );

  // Remove solve from history
  const removeSolve = useCallback(
    (solveId: string) => {
      setHistory((prev) => prev.filter((solve) => solve.id !== solveId));
      if (lastSolveId === solveId) {
        setLastSolveId(null);
      }
    },
    [lastSolveId]
  );

  // Clear all solves in a session
  const clearSessionHistory = useCallback((sessionId: string) => {
    setHistory((prev) => prev.filter((solve) => solve.sessionId !== sessionId));
    setLastSolveId(null);
  }, []);

  // Set complete history (e.g., on initialization)
  const setCompleteHistory = useCallback((newHistory: TimerRecord[]) => {
    setHistory(newHistory);
  }, []); // no dependencies

  // Filter history by session
  const getSessionHistory = useCallback(
    (sessionId: string) => {
      return history.filter((solve) => solve.sessionId === sessionId);
    },
    [history]
  );

  // Filter history by event
  const getEventHistory = useCallback(
    (sessionId: string, event: string) => {
      return history.filter(
        (solve) => solve.sessionId === sessionId && solve.event === event
      );
    },
    [history]
  );

  // Toggle timer focus mode
  const setTimerFocusMode = useCallback((isActive: boolean) => {
    setIsTimerFocusMode(isActive);
  }, []);

  // Calculate final time with penalty
  const calculateFinalTime = useCallback(
    (time: number, penalty: "none" | "+2" | "DNF"): number => {
      if (penalty === "DNF") return Infinity;
      if (penalty === "+2") return time + 2000; // add 2 seconds
      return time;
    },
    []
  );

  return {
    // State
    history,
    selectedEvent,
    currentScramble,
    lastSolveId,
    isTimerFocusMode,

    // Actions
    handleNewScramble,
    handleEventChange,
    addSolve,
    updateSolve,
    removeSolve,
    clearSessionHistory,
    setCompleteHistory,
    setTimerFocusMode,

    // Computed values
    getSessionHistory,
    getEventHistory,
    calculateFinalTime,

    // Setters
    setSelectedEvent,
    setCurrentScramble,
    setLastSolveId,
  };
};