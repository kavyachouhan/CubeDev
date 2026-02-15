// Admin cache utility for storing and retrieving admin-related data with TTL and stale checks
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheResult<T> {
  data: T | null;
  isStale: boolean;
  timestamp: number | null;
}

const CACHE_PREFIX = "admin_cache_";
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const DEFAULT_STALE_THRESHOLD = 2 * 60 * 1000; // 2 minutes

// Predefined TTLs for different admin data types
export const ADMIN_CACHE_TTLS = {
  dashboard: 5 * 60 * 1000, // 5 minutes - frequently changing overview stats
  users: 10 * 60 * 1000, // 10 minutes - user list doesn't change that often
  analytics: 15 * 60 * 1000, // 15 minutes - analytics data
  activity: 2 * 60 * 1000, // 2 minutes - recent activity
  feedback: 10 * 60 * 1000, // 10 minutes
  contact: 10 * 60 * 1000, // 10 minutes
  competitions: 15 * 60 * 1000, // 15 minutes
  challenges: 10 * 60 * 1000, // 10 minutes
  coach: 15 * 60 * 1000, // 15 minutes
  notifications: 5 * 60 * 1000, // 5 minutes
  algorithms: 30 * 60 * 1000, // 30 minutes - rarely changes
  timer: 10 * 60 * 1000, // 10 minutes
};

// Example cache keys for different admin data types
export const ADMIN_CACHE_KEYS = {
  // Dashboard
  systemStats: "system_stats",
  recentActivity: (limit: number) => `recent_activity_${limit}`,

  // Users
  allUsers: (limit: number, offset: number, search?: string) =>
    `users_${limit}_${offset}_${search || ""}`,
  userAnalytics: "user_analytics",
  userActivity: (userId: string) => `user_activity_${userId}`,

  // Timer Stats
  timerAnalytics: "timer_analytics",
  timerExportData: "timer_export_data",

  // Feedback
  feedbackStats: (period: string, surveyType?: string) =>
    `feedback_stats_${period}_${surveyType || "all"}`,
  feedbackList: (
    limit: number,
    offset: number,
    dateFilter?: string,
    surveyType?: string,
  ) =>
    `feedback_list_${limit}_${offset}_${dateFilter || ""}_${surveyType || ""}`,
  surveyTypes: "survey_types",

  // Contact
  contactMessages: (limit: number, offset: number, status?: string) =>
    `contact_messages_${limit}_${offset}_${status || "all"}`,
  messageDetails: (messageId: string) => `message_details_${messageId}`,

  // Competitions
  competitionAnalytics: "competition_analytics",
  competitionsList: "competitions_list",

  // Challenges
  challengeAnalytics: "challenge_analytics",
  challengeRooms: (limit: number, offset: number, status?: string) =>
    `challenge_rooms_${limit}_${offset}_${status || "all"}`,
  challengeUsers: "challenge_users",

  // Coach
  coachStats: "coach_stats",
  detailedCoachStats: "detailed_coach_stats",
  coachProfiles: "coach_profiles",

  // Notifications
  notificationAnalytics: "notification_analytics",
  notificationLogs: (limit: number, offset: number) =>
    `notification_logs_${limit}_${offset}`,
  notificationTypes: "notification_types",

  // Algorithms
  algorithmSets: "algorithm_sets",
  algorithmAnalytics: "algorithm_analytics",
  algorithmExportData: "algorithm_export_data",
  algorithmCases: (setId: string) => `algorithm_cases_${setId}`,
  algorithmsList: (caseId: string) => `algorithms_list_${caseId}`,
};

// Get cached data if valid, otherwise return null
export function getAdminCache<T>(key: string): T | null {
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
    console.warn("Failed to read admin cache:", error);
    return null;
  }
}

// Get cached data with stale check - returns data, whether it's stale, and the original timestamp
export function getAdminCacheWithStaleCheck<T>(
  key: string,
  staleThreshold: number = DEFAULT_STALE_THRESHOLD,
): CacheResult<T> {
  if (typeof window === "undefined") {
    return { data: null, isStale: false, timestamp: null };
  }

  try {
    const cacheKey = CACHE_PREFIX + key;
    const cached = localStorage.getItem(cacheKey);

    if (!cached) {
      return { data: null, isStale: false, timestamp: null };
    }

    const entry: CacheEntry<T> = JSON.parse(cached);
    const now = Date.now();

    // Check if cache has expired
    if (now > entry.expiresAt) {
      localStorage.removeItem(cacheKey);
      return { data: null, isStale: false, timestamp: null };
    }

    // Check if cache is stale based on the provided threshold
    const isStale = now - entry.timestamp > staleThreshold;

    return { data: entry.data, isStale, timestamp: entry.timestamp };
  } catch (error) {
    console.warn("Failed to read admin cache with stale check:", error);
    return { data: null, isStale: false, timestamp: null };
  }
}

// Get age of cache entry in milliseconds, or null if not found/invalid
export function getAdminCacheAge(key: string): number | null {
  if (typeof window === "undefined") return null;

  try {
    const cacheKey = CACHE_PREFIX + key;
    const cached = localStorage.getItem(cacheKey);

    if (!cached) return null;

    const entry = JSON.parse(cached);
    return Date.now() - entry.timestamp;
  } catch {
    return null;
  }
}

// Set cache data with TTL
export function setAdminCache<T>(
  key: string,
  data: T,
  ttl: number = DEFAULT_TTL,
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
    console.warn("Failed to save to admin cache:", error);
    // If quota exceeded, try clearing expired cache and retrying once
    if (error instanceof Error && error.name === "QuotaExceededError") {
      clearExpiredAdminCache();
      try {
        const cacheKey = CACHE_PREFIX + key;
        const entry: CacheEntry<T> = {
          data,
          timestamp: Date.now(),
          expiresAt: Date.now() + ttl,
        };
        localStorage.setItem(cacheKey, JSON.stringify(entry));
      } catch {
        console.warn("Failed to save to admin cache after cleanup");
      }
    }
  }
}

// Remove specific cache entry
export function removeAdminCache(key: string): void {
  if (typeof window === "undefined") return;

  try {
    const cacheKey = CACHE_PREFIX + key;
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.warn("Failed to remove from admin cache:", error);
  }
}

// Invalidate cache entries that match a certain pattern (e.g. all feedback-related keys)
export function invalidateAdminCachePattern(pattern: string): void {
  if (typeof window === "undefined") return;

  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX) && key.includes(pattern)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn("Failed to invalidate admin cache pattern:", error);
  }
}

// Clear all expired cache entries
export function clearExpiredAdminCache(): void {
  if (typeof window === "undefined") return;

  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();

    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const entry: CacheEntry<unknown> = JSON.parse(cached);
            if (now > entry.expiresAt) {
              localStorage.removeItem(key);
            }
          }
        } catch {
          // If entry is corrupted and can't be parsed, remove it to prevent future issues
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.warn("Failed to clear expired admin cache:", error);
  }
}

// Clear all admin cache entries (use with caution, e.g. on logout or major data changes)
export function clearAllAdminCache(): void {
  if (typeof window === "undefined") return;

  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn("Failed to clear all admin cache:", error);
  }
}

// Get cache info for debugging/monitoring purposes
export function getAdminCacheInfo(): {
  totalEntries: number;
  totalSize: number;
  entries: { key: string; age: number; expiresIn: number }[];
} {
  if (typeof window === "undefined") {
    return { totalEntries: 0, totalSize: 0, entries: [] };
  }

  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    const entries: { key: string; age: number; expiresIn: number }[] = [];
    let totalSize = 0;

    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        const cached = localStorage.getItem(key);
        if (cached) {
          totalSize += cached.length;
          try {
            const entry: CacheEntry<unknown> = JSON.parse(cached);
            entries.push({
              key: key.replace(CACHE_PREFIX, ""),
              age: now - entry.timestamp,
              expiresIn: entry.expiresAt - now,
            });
          } catch {
            // Skip corrupted entries
          }
        }
      }
    });

    return {
      totalEntries: entries.length,
      totalSize,
      entries,
    };
  } catch {
    return { totalEntries: 0, totalSize: 0, entries: [] };
  }
}