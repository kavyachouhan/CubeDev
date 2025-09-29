export interface PhaseSplit {
  phase: string;
  time: number; // Time at which this phase was completed (milliseconds from start)
}

export interface SplitMethodConfig {
  id: string;
  name: string;
  description: string;
  phases: {
    id: string;
    name: string;
    color: string;
  }[];
}

export const SPLIT_METHODS: SplitMethodConfig[] = [
  {
    id: "cfop",
    name: "Full CFOP",
    description: "Cross → F2L → OLL → PLL",
    phases: [
      { id: "cross", name: "Cross", color: "text-blue-500" },
      { id: "f2l", name: "F2L", color: "text-green-500" },
      { id: "oll", name: "OLL", color: "text-yellow-500" },
      { id: "pll", name: "PLL", color: "text-purple-500" },
    ],
  },
  {
    id: "2ll",
    name: "2-Look Last Layer",
    description: "1-Look OLL → 1-Look PLL",
    phases: [
      { id: "2oll", name: "1-Look OLL", color: "text-yellow-500" },
      { id: "2pll", name: "1-Look PLL", color: "text-purple-500" },
    ],
  },
  {
    id: "4ll",
    name: "4-Look Last Layer",
    description: "OLL Edges → OLL Corners → PLL Corners → PLL Edges",
    phases: [
      {
        id: "oll_cross",
        name: "OLL Cross",
        color: "text-orange-500",
      },
      {
        id: "oll_corners",
        name: "OLL Corners",
        color: "text-yellow-500",
      },
      {
        id: "pll_corners",
        name: "PLL Corners",
        color: "text-red-500",
      },
      {
        id: "pll_edges",
        name: "PLL Edges",
        color: "text-purple-500",
      },
    ],
  },
  {
    id: "oll_only",
    name: "OLL Only",
    description: "One-Look OLL",
    phases: [{ id: "oll", name: "OLL", color: "text-yellow-500" }],
  },
  {
    id: "pll_only",
    name: "PLL Only",
    description: "One-Look PLL",
    phases: [{ id: "pll", name: "PLL", color: "text-purple-500" }],
  },
  {
    id: "f2l_pairs",
    name: "F2L Pairs",
    description: "F2L Pair 1 → F2L Pair 2 → F2L Pair 3 → F2L Pair 4",
    phases: [
      { id: "f2l1", name: "F2L Pair 1", color: "text-green-400" },
      { id: "f2l2", name: "F2L Pair 2", color: "text-green-500" },
      { id: "f2l3", name: "F2L Pair 3", color: "text-green-600" },
      { id: "f2l4", name: "F2L Pair 4", color: "text-green-700" },
    ],
  },
];

export const getSplitMethod = (id: string): SplitMethodConfig | undefined => {
  return SPLIT_METHODS.find((method) => method.id === id);
};

export const calculatePhaseTimes = (
  splits: PhaseSplit[],
  totalTime: number
): Array<{ phase: string; duration: number }> => {
  if (!splits || splits.length === 0) return [];

  const phaseTimes: Array<{ phase: string; duration: number }> = [];

  // Sort splits by time to ensure correct order
  const sortedSplits = [...splits].sort((a, b) => a.time - b.time);

  for (let i = 0; i < sortedSplits.length; i++) {
    const currentSplit = sortedSplits[i];
    const previousTime = i === 0 ? 0 : sortedSplits[i - 1].time;
    const duration = currentSplit.time - previousTime;

    phaseTimes.push({
      phase: currentSplit.phase,
      duration: duration,
    });
  }

  // Add final phase if there's remaining time
  if (sortedSplits.length > 0) {
    const lastSplitTime = sortedSplits[sortedSplits.length - 1].time;
    if (lastSplitTime < totalTime) {
      phaseTimes.push({
        phase: "remaining",
        duration: totalTime - lastSplitTime,
      });
    }
  }

  return phaseTimes;
};

export const findLargestStall = (
  phaseTimes: Array<{ phase: string; duration: number }>,
  splitMethod: string
): { phase: string; duration: number } | null => {
  if (!phaseTimes || phaseTimes.length === 0) return null;

  const method = getSplitMethod(splitMethod);
  if (!method) return null;

  // Filter phaseTimes to only include phases in the selected method
  const longestPhase = phaseTimes.reduce((longest, current) =>
    current.duration > longest.duration ? current : longest
  );

  return longestPhase;
};

export const formatPhaseTime = (timeMs: number): string => {
  const seconds = timeMs / 1000;
  if (seconds < 60) {
    return seconds.toFixed(2);
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toFixed(2).padStart(5, "0")}`;
};

export interface ConsistencyCoachSettings {
  enabled: boolean;
  bpm: number; // Beats per minute for metronome
  volume: number; // 0-100
  sound: "beep" | "tick" | "wood"; // Different metronome sounds
}

export const DEFAULT_CONSISTENCY_SETTINGS: ConsistencyCoachSettings = {
  enabled: false,
  bpm: 120, // Default BPM = 500ms between beats
  volume: 30,
  sound: "beep",
};

export const BPM_TO_MS = (bpm: number): number => {
  return 60000 / bpm; // Convert BPM to milliseconds per beat
};