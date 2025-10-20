// Utility functions for statistics calculations and formatting
export interface TimerRecord {
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
  splits?: PhaseSplit[];
  splitMethod?: string;
  timerMode?: "normal" | "manual" | "stackmat";
}

export interface PhaseSplit {
  phase: string;
  time: number;
}

// Format time in milliseconds to human-readable string
export const formatTime = (ms: number): string => {
  if (ms === Infinity) return "DNF";

  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `${minutes}:${seconds.toFixed(2).padStart(5, "0")}`;
  }

  return seconds.toFixed(2);
};

// Format time in milliseconds to human-readable string
export const formatTimeShort = (ms: number): string => {
  if (ms === Infinity) return "DNF";

  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `${minutes}:${seconds.toFixed(1).padStart(4, "0")}`;
  }

  return seconds.toFixed(1);
};

// Format duration in milliseconds to human-readable string (e.g., "1h 23m")
export const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

// Calculate average of an array of times, excluding best and worst for larger averages
export const calculateAverage = (
  times: number[],
  count: number
): number | null => {
  if (times.length < count) return null;

  const recentTimes = times.slice(-count);
  const validTimes = recentTimes.filter((time) => time !== Infinity);

  if (validTimes.length < count - 1) return null; // Not enough valid times

  if (count <= 3) {
    // For small averages, just average all valid times
    return validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length;
  }

  // For larger averages, remove best and worst times
  const sorted = [...validTimes].sort((a, b) => a - b);
  const toRemove = Math.floor(count * 0.05) || 1; // Remove 5% best and worst, at least 1
  const trimmed = sorted.slice(toRemove, -toRemove);

  if (trimmed.length === 0) return null;

  return trimmed.reduce((sum, time) => sum + time, 0) / trimmed.length;
};

// Calculate rolling averages for a series of times
export const calculateRollingAverages = (
  times: number[],
  count: number
): (number | null)[] => {
  const rolling: (number | null)[] = [];

  for (let i = 0; i < times.length; i++) {
    if (i + 1 < count) {
      rolling.push(null);
    } else {
      const windowTimes = times.slice(i - count + 1, i + 1);
      rolling.push(calculateAverage(windowTimes, count));
    }
  }

  return rolling;
};

// Find best average and its ending index
export const findBestAverage = (
  times: number[],
  count: number
): { value: number; index: number } | null => {
  let bestAvg = null;
  let bestIndex = -1;

  for (let i = count - 1; i < times.length; i++) {
    const windowTimes = times.slice(i - count + 1, i + 1);
    const avg = calculateAverage(windowTimes, count);

    if (avg !== null && (bestAvg === null || avg < bestAvg)) {
      bestAvg = avg;
      bestIndex = i;
    }
  }

  return bestAvg !== null ? { value: bestAvg, index: bestIndex } : null;
};

// Calculate specified percentiles from an array of times
export const calculatePercentiles = (
  times: number[],
  percentiles: number[]
): Record<number, number> => {
  const validTimes = times
    .filter((time) => time !== Infinity)
    .sort((a, b) => a - b);
  const result: Record<number, number> = {};

  if (validTimes.length === 0) return result;

  percentiles.forEach((p) => {
    const index = Math.ceil((p / 100) * validTimes.length) - 1;
    result[p] = validTimes[Math.max(0, index)];
  });

  return result;
};

// Group solves by day, week, or month
export const groupSolvesByPeriod = (
  solves: TimerRecord[],
  period: "day" | "week" | "month"
): Record<string, TimerRecord[]> => {
  const groups: Record<string, TimerRecord[]> = {};

  solves.forEach((solve) => {
    let key: string;
    const date = new Date(solve.timestamp);

    switch (period) {
      case "day":
        key = date.toDateString();
        break;
      case "week":
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toDateString();
        break;
      case "month":
        key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        break;
    }

    if (!groups[key]) groups[key] = [];
    groups[key].push(solve);
  });

  return groups;
};

// Calculate improvement rate between two sets of times
export const calculateImprovementRate = (
  oldTimes: number[],
  newTimes: number[],
  averageCount = 12
): number | null => {
  const oldAvg = calculateAverage(
    oldTimes,
    Math.min(averageCount, oldTimes.length)
  );
  const newAvg = calculateAverage(
    newTimes,
    Math.min(averageCount, newTimes.length)
  );

  if (!oldAvg || !newAvg) return null;

  return ((oldAvg - newAvg) / oldAvg) * 100; // Percentage improvement
};

// Calculate consistency (coefficient of variation) of a set of times
export const calculateConsistency = (times: number[]): number | null => {
  const validTimes = times.filter((time) => time !== Infinity);
  if (validTimes.length < 2) return null;

  const mean =
    validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length;
  const variance =
    validTimes.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) /
    validTimes.length;
  const standardDeviation = Math.sqrt(variance);

  // Coefficient of Variation (CV) as a percentage
  return (standardDeviation / mean) * 100;
};

// Get display name for WCA event codes
export const getEventDisplayName = (eventCode: string): string => {
  const eventNames: Record<string, string> = {
    "222": "2×2",
    "333": "3×3",
    "444": "4×4",
    "555": "5×5",
    "666": "6×6",
    "777": "7×7",
    "333bf": "3×3 BLD",
    "333fm": "3×3 FM",
    "333oh": "3×3 OH",
    clock: "Clock",
    minx: "Megaminx",
    pyram: "Pyraminx",
    skewb: "Skewb",
    sq1: "Square-1",
    "444bf": "4×4 BLD",
    "555bf": "5×5 BLD",
    "333mbf": "3×3 MBLD",
  };

  return eventNames[eventCode] || eventCode;
};

// Calculate total session duration based on first and last solve timestamps
export const calculateSessionDuration = (solves: TimerRecord[]): number => {
  if (solves.length === 0) return 0;

  const sortedSolves = [...solves].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );
  const firstSolve = sortedSolves[0];
  const lastSolve = sortedSolves[sortedSolves.length - 1];

  return lastSolve.timestamp.getTime() - firstSolve.timestamp.getTime();
};

// Get distribution of solves across different times of day
export const getTimeOfDayDistribution = (
  solves: TimerRecord[]
): Record<string, number> => {
  const periods = {
    "Morning (6-12)": 0,
    "Afternoon (12-18)": 0,
    "Evening (18-24)": 0,
    "Night (0-6)": 0,
  };

  solves.forEach((solve) => {
    const hour = solve.timestamp.getHours();

    if (hour >= 6 && hour < 12) {
      periods["Morning (6-12)"]++;
    } else if (hour >= 12 && hour < 18) {
      periods["Afternoon (12-18)"]++;
    } else if (hour >= 18 && hour < 24) {
      periods["Evening (18-24)"]++;
    } else {
      periods["Night (0-6)"]++;
    }
  });

  return periods;
};

// Calculate current and longest solving streaks (consecutive days with solves)
export const calculateSolvingStreaks = (
  solves: TimerRecord[]
): {
  current: number;
  longest: number;
} => {
  if (solves.length === 0) return { current: 0, longest: 0 };

  // Get unique days with solves
  const solveDays = Array.from(
    new Set(solves.map((solve) => solve.timestamp.toDateString()))
  ).sort();

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;

  // Check if there's a solve today or yesterday
  const today = new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  const hasToday = solveDays.includes(today);
  const hasYesterday = solveDays.includes(yesterdayStr);

  if (hasToday || hasYesterday) {
    currentStreak = 1;

    // Calculate current streak
    const startDate = hasToday ? new Date() : yesterday;
    for (let i = 1; i < solveDays.length; i++) {
      const checkDate = new Date(startDate);
      checkDate.setDate(startDate.getDate() - i);

      if (solveDays.includes(checkDate.toDateString())) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  for (let i = 1; i < solveDays.length; i++) {
    const prevDate = new Date(solveDays[i - 1]);
    const currDate = new Date(solveDays[i]);
    const daysDiff =
      (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }

  longestStreak = Math.max(longestStreak, tempStreak);

  return { current: currentStreak, longest: longestStreak };
};