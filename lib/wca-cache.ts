/**
 * WCA Data Cache Utility
 * Implements localStorage-based caching for WCA API data
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const CACHE_PREFIX = "wca_cache_";
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Get data from cache
 */
export function getFromCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const cacheKey = CACHE_PREFIX + key;
    const cached = localStorage.getItem(cacheKey);

    if (!cached) return null;

    const entry: CacheEntry<T> = JSON.parse(cached);

    // Check if cache has expired
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.warn("Failed to read from cache:", error);
    return null;
  }
}

/**
 * Save data to cache
 */
export function saveToCache<T>(
  key: string,
  data: T,
  ttl: number = DEFAULT_TTL
): void {
  if (typeof window === "undefined") return;

  try {
    const cacheKey = CACHE_PREFIX + key;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    };

    localStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch (error) {
    console.warn("Failed to save to cache:", error);
    // If storage is full, try to clear old entries
    if (error instanceof Error && error.name === "QuotaExceededError") {
      clearExpiredCache();
      try {
        const cacheKey = CACHE_PREFIX + key;
        const entry: CacheEntry<T> = {
          data,
          timestamp: Date.now(),
          expiresAt: Date.now() + ttl,
        };
        localStorage.setItem(cacheKey, JSON.stringify(entry));
      } catch {
        console.warn("Failed to save to cache after cleanup");
      }
    }
  }
}

/**
 * Remove data from cache
 */
export function removeFromCache(key: string): void {
  if (typeof window === "undefined") return;

  try {
    const cacheKey = CACHE_PREFIX + key;
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.warn("Failed to remove from cache:", error);
  }
}

/**
 * Clear all expired cache entries
 */
export function clearExpiredCache(): void {
  if (typeof window === "undefined") return;

  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();

    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const entry: CacheEntry<any> = JSON.parse(cached);
            if (now > entry.expiresAt) {
              localStorage.removeItem(key);
            }
          }
        } catch {
          // If we can't parse it, remove it
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.warn("Failed to clear expired cache:", error);
  }
}

/**
 * Clear all WCA cache
 */
export function clearWCACache(): void {
  if (typeof window === "undefined") return;

  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn("Failed to clear WCA cache:", error);
  }
}

/**
 * Get cache keys for WCA data
 */
export const WCA_CACHE_KEYS = {
  profile: (wcaId: string) => `profile_${wcaId}`,
  results: (wcaId: string) => `results_${wcaId}`,
  competition: (compId: string) => `competition_${compId}`,
};
