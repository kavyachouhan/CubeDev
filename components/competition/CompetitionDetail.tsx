/**
 * Shared result/atmosphere types for the competition simulator.
 *
 * The page component that used to live here was replaced by
 * `CompetitionOverview` (routed at /cube-lab/competitions/[competitionId]);
 * the types stayed behind because most of the simulator imports them.
 */

export interface RoundResult {
  eventId: string;
  roundNumber: number;
  solves: SolveResult[];
  average: number;
  best: number;
  completedAt: string;
}

export interface SolveResult {
  time: number;
  scramble: string;
  penalty: "none" | "+2" | "DNF";
  inspectionViolation: "+2" | "DNF" | null;
}

export interface AtmosphereSettings {
  crowdNoise: number; // 0-100
  pressure: number; // 0-100
  distractions: boolean;
  timerDelay: boolean; // true = random delay before start
  judgeInteractions: boolean;
}
