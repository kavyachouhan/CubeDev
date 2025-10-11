/**
 * Stats Cache Utility
 * Implements caching for stats page data
 */

interface StatsData {
  solves: any[];
  timestamp: number;
  userId: string;
}

const STATS_CACHE_KEY = "cubelab_stats_cache";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache for stats

/**
 * Get cached stats data
 */
export function getCachedStats(userId: string): any[] | null {
  if (typeof window === "undefined") return null;

  try {
    const cached = localStorage.getItem(`${STATS_CACHE_KEY}_${userId}`);
    if (!cached) return null;

    const data: StatsData = JSON.parse(cached);

    // Check if cache is expired
    if (Date.now() - data.timestamp > CACHE_DURATION) {
      localStorage.removeItem(`${STATS_CACHE_KEY}_${userId}`);
      return null;
    }

    // Reconstruct Date objects
    return data.solves.map((solve) => ({
      ...solve,
      timestamp: new Date(solve.timestamp),
    }));
  } catch (error) {
    console.warn("Failed to read stats cache:", error);
    return null;
  }
}

/**
 * Save stats data to cache
 */
export function cacheStats(userId: string, solves: any[]): void {
  if (typeof window === "undefined") return;

  try {
    const data: StatsData = {
      solves: solves.map((solve) => ({
        ...solve,
        timestamp:
          solve.timestamp instanceof Date
            ? solve.timestamp.toISOString()
            : solve.timestamp,
      })),
      timestamp: Date.now(),
      userId,
    };

    localStorage.setItem(`${STATS_CACHE_KEY}_${userId}`, JSON.stringify(data));
  } catch (error) {
    console.warn("Failed to cache stats:", error);
  }
}

/**
 * Clear stats cache for a user
 */
export function clearStatsCache(userId: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(`${STATS_CACHE_KEY}_${userId}`);
  } catch (error) {
    console.warn("Failed to clear stats cache:", error);
  }
}

/**
 * Clear all stats caches
 */
export function clearAllStatsCache(): void {
  if (typeof window === "undefined") return;

  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(STATS_CACHE_KEY)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn("Failed to clear all stats cache:", error);
  }
}
