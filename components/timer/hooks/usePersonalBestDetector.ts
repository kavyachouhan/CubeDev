import { useEffect, useRef, useState } from "react";
import { TimerRecord } from "@/lib/stats-utils";

interface PersonalBest {
  single: number | null;
  ao5: number | null;
  ao12: number | null;
  ao100: number | null;
}

interface Achievement {
  type: "single" | "ao5" | "ao12" | "ao100";
  value: number;
}

// Helper to truncate to centisecond (10ms)
const truncToCentisMs = (ms: number) => Math.floor(ms / 10) * 10;

// Helper to round to centisecond (10ms)
const roundToCentisMs = (ms: number) => Math.round(ms / 10) * 10;

// Calculate WCA average of N
const wcaAverageN = (solves: TimerRecord[], n: number): number | null => {
  if (solves.length < n) return null;

  // Get last N consecutive results
  const lastN = solves.slice(-n);

  // Use truncated singles for calculation
  const values = lastN.map((r) =>
    isFinite(r.finalTime) ? truncToCentisMs(r.finalTime) : Infinity
  );

  const dnfs = values.filter((v) => !isFinite(v)).length;
  if (dnfs >= 2) return Infinity; // average is DNF if 2 or more DNFs

  // Sort values to drop best and worst
  const sorted = [...values].sort((a, b) => a - b);

  // Drop best and worst
  sorted.shift(); // drop best
  sorted.pop(); // drop worst

  // Calculate average of remaining
  const sum = sorted.reduce((acc, v) => acc + (isFinite(v) ? v : 0), 0);
  const avg = sum / (n - 2);

  // Average of N is rounded to 0.01 s
  return roundToCentisMs(avg);
};

/**
 * Hook to detect when a new personal best is achieved
 * @param history - Array of timer records for the current session
 * @param lastSolveId - ID of the most recent solve
 * @returns Achievement object if a new PB was detected, null otherwise
 */
export function usePersonalBestDetector(
  history: TimerRecord[],
  lastSolveId: string | null
) {
  const [achievement, setAchievement] = useState<Achievement | null>(null);
  const previousBestsRef = useRef<PersonalBest>({
    single: null,
    ao5: null,
    ao12: null,
    ao100: null,
  });
  const lastProcessedSolveIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Only check when a new solve is added
    if (!lastSolveId || lastSolveId === lastProcessedSolveIdRef.current) {
      return;
    }

    lastProcessedSolveIdRef.current = lastSolveId;

    // Order by timestamp ascending
    const ordered = [...history].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    // Get current bests
    const truncatedSingles = ordered
      .filter((r) => isFinite(r.finalTime))
      .map((r) => truncToCentisMs(r.finalTime));

    const currentBests: PersonalBest = {
      single: truncatedSingles.length ? Math.min(...truncatedSingles) : null,
      ao5: wcaAverageN(ordered, 5),
      ao12: wcaAverageN(ordered, 12),
      ao100: wcaAverageN(ordered, 100),
    };

    // Check for new PBs (prioritize in order: single, ao5, ao12, ao100)
    let newAchievement: Achievement | null = null;

    // Check single PB
    if (
      currentBests.single !== null &&
      (previousBestsRef.current.single === null ||
        currentBests.single < previousBestsRef.current.single)
    ) {
      newAchievement = {
        type: "single",
        value: currentBests.single,
      };
    }
    // Check ao5 PB (only if no single PB)
    else if (
      currentBests.ao5 !== null &&
      isFinite(currentBests.ao5) &&
      (previousBestsRef.current.ao5 === null ||
        !isFinite(previousBestsRef.current.ao5) ||
        currentBests.ao5 < previousBestsRef.current.ao5)
    ) {
      newAchievement = {
        type: "ao5",
        value: currentBests.ao5,
      };
    }
    // Check ao12 PB (only if no single or ao5 PB)
    else if (
      currentBests.ao12 !== null &&
      isFinite(currentBests.ao12) &&
      (previousBestsRef.current.ao12 === null ||
        !isFinite(previousBestsRef.current.ao12) ||
        currentBests.ao12 < previousBestsRef.current.ao12)
    ) {
      newAchievement = {
        type: "ao12",
        value: currentBests.ao12,
      };
    }
    // Check ao100 PB (only if no other PBs)
    else if (
      currentBests.ao100 !== null &&
      isFinite(currentBests.ao100) &&
      (previousBestsRef.current.ao100 === null ||
        !isFinite(previousBestsRef.current.ao100) ||
        currentBests.ao100 < previousBestsRef.current.ao100)
    ) {
      newAchievement = {
        type: "ao100",
        value: currentBests.ao100,
      };
    }

    // Update previous bests
    previousBestsRef.current = currentBests;

    // Trigger achievement if found
    if (newAchievement) {
      setAchievement(newAchievement);
    }
  }, [history, lastSolveId]);

  // Clear achievement after animation completes
  const clearAchievement = () => {
    setAchievement(null);
  };

  return { achievement, clearAchievement };
}