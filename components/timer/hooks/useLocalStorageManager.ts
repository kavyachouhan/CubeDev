import { useCallback } from "react";

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

interface Session {
  id: string;
  name: string;
  event: string;
  createdAt: Date;
  solveCount: number;
  convexId?: string;
}

export const useLocalStorageManager = (userId?: string) => {
  // Manage localStorage size to avoid exceeding quota
  const manageLocalStorageSize = useCallback(() => {
    if (!userId) return;

    try {
      // Calculate total size of localStorage
      let totalSize = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length;
        }
      }

      // If usage exceeds ~4MB, clean up old cache entries
      if (totalSize > 4 * 1024 * 1024) {
        console.log("localStorage approaching limit, cleaning up old cache...");

        // Remove cache entries not associated with current user
        for (let key in localStorage) {
          if (key.startsWith("cubelab-timer-cache-") && !key.includes(userId)) {
            localStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.warn("Failed to manage localStorage size:", error);
    }
  }, [userId]);

  // Generate cache key with user ID
  const getCacheKey = useCallback(
    (suffix: string) => {
      return userId ? `cubelab-timer-cache-${userId}-${suffix}` : null;
    },
    [userId]
  );

  // Load data from localStorage cache
  const loadFromCache = useCallback(
    <T>(suffix: string, defaultValue: T): T => {
      const key = getCacheKey(suffix);
      if (!key) return defaultValue;

      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const parsed = JSON.parse(cached);
          // Revive Date objects
          if (suffix === "history" && Array.isArray(parsed)) {
            return parsed.map((record: any) => ({
              ...record,
              timestamp: new Date(record.timestamp),
            })) as T;
          }
          if (suffix === "sessions" && Array.isArray(parsed)) {
            return parsed.map((session: any) => ({
              ...session,
              createdAt: new Date(session.createdAt),
            })) as T;
          }
          return parsed;
        }
      } catch (error) {
        console.warn(`Failed to load cache for ${suffix}:`, error);
      }
      return defaultValue;
    },
    [getCacheKey]
  );

  // Save data to localStorage cache
  const saveToCache = useCallback(
    <T>(suffix: string, data: T): void => {
      const key = getCacheKey(suffix);
      if (!key) return;

      try {
        localStorage.setItem(key, JSON.stringify(data));
        manageLocalStorageSize();
      } catch (error) {
        console.warn(`Failed to save cache for ${suffix}:`, error);
        // Retry once after cleanup if quota exceeded
        if (
          error instanceof DOMException &&
          error.name === "QuotaExceededError"
        ) {
          manageLocalStorageSize();
          try {
            localStorage.setItem(key, JSON.stringify(data));
          } catch (retryError) {
            console.error(
              `Failed to save cache after cleanup for ${suffix}:`,
              retryError
            );
          }
        }
      }
    },
    [getCacheKey, manageLocalStorageSize]
  );

  // Clear specific cache entry
  const clearCache = useCallback(
    (suffix: string): void => {
      const key = getCacheKey(suffix);
      if (!key) return;

      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to clear cache for ${suffix}:`, error);
      }
    },
    [getCacheKey]
  );

  // Clear all cache entries for current user
  const clearAllCache = useCallback((): void => {
    if (!userId) return;

    try {
      const keysToRemove = [];
      for (let key in localStorage) {
        if (key.startsWith(`cubelab-timer-cache-${userId}-`)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.warn("Failed to clear all cache:", error);
    }
  }, [userId]);

  return {
    loadFromCache,
    saveToCache,
    clearCache,
    clearAllCache,
    manageLocalStorageSize,
  };
};