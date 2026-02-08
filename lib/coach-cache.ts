// Cache keys
const CACHE_PREFIX = "cubedev_coach";
const CACHE_KEYS = {
  PROFILE: `${CACHE_PREFIX}_profile`,
  TRAINING_PLAN: `${CACHE_PREFIX}_training_plan`,
  JOURNAL_ENTRIES: `${CACHE_PREFIX}_journal_entries`,
  PROGRESS_STATS: `${CACHE_PREFIX}_progress_stats`,
  PROGRESS_SNAPSHOTS: `${CACHE_PREFIX}_progress_snapshots`,
  MEDIA_BLOBS: `${CACHE_PREFIX}_media_blobs`,
  MEDIA_METADATA: `${CACHE_PREFIX}_media_metadata`,
};

// Cache durations (in milliseconds)
const CACHE_DURATIONS = {
  PROFILE: 30 * 60 * 1000, // 30 minutes
  TRAINING_PLAN: 15 * 60 * 1000, // 15 minutes
  JOURNAL_ENTRIES: 10 * 60 * 1000, // 10 minutes
  PROGRESS_STATS: 15 * 60 * 1000, // 15 minutes
  PROGRESS_SNAPSHOTS: 30 * 60 * 1000, // 30 minutes
  MEDIA: 60 * 60 * 1000, // 1 hour for media
};

// Generic cache item interface
interface CacheItem<T> {
  data: T;
  timestamp: number;
  userId: string;
  version?: number;
}

// Media cache item with blob URL
interface MediaCacheItem {
  url: string;
  blobUrl?: string;
  fileId: string;
  mediaType: string;
  timestamp: number;
  size?: number;
}

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

/**
 * Get cache key with user ID
 */
function getCacheKey(baseKey: string, userId: string): string {
  return `${baseKey}_${userId}`;
}

/**
 * Check if cache is valid (not expired)
 */
function isCacheValid<T>(item: CacheItem<T> | null, duration: number): boolean {
  if (!item) return false;
  return Date.now() - item.timestamp < duration;
}

/**
 * Safely get item from localStorage with error handling
 */
function safeGetItem<T>(key: string): CacheItem<T> | null {
  if (!isBrowser()) return null;

  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    return JSON.parse(cached) as CacheItem<T>;
  } catch (error) {
    console.warn(`Failed to read cache for ${key}:`, error);
    return null;
  }
}

/**
 * Safely set item in localStorage with error handling
 */
function safeSetItem<T>(
  key: string,
  data: T,
  userId: string,
  version?: number,
): void {
  if (!isBrowser()) return;

  try {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      userId,
      version,
    };
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    // Handle quota exceeded
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.warn("LocalStorage quota exceeded, clearing old cache...");
      clearOldCache();
      try {
        const item: CacheItem<T> = {
          data,
          timestamp: Date.now(),
          userId,
          version,
        };
        localStorage.setItem(key, JSON.stringify(item));
      } catch {
        console.warn("Failed to cache data even after cleanup");
      }
    } else {
      console.warn(`Failed to cache data for ${key}:`, error);
    }
  }
}

/**
 * Clear old cache entries to free up space
 */
function clearOldCache(): void {
  if (!isBrowser()) return;

  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();

    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || "{}");
          // Remove items older than 24 hours
          if (item.timestamp && now - item.timestamp > 24 * 60 * 60 * 1000) {
            localStorage.removeItem(key);
          }
        } catch {
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.warn("Failed to clear old cache:", error);
  }
}

// Coach Profile Cache
export interface CachedCoachProfile {
  _id: string;
  userId: string;
  currentAverage?: number;
  skillLevel: string;
  primaryEvent: string;
  goalType: string;
  customGoalTime?: number;
  targetDate: number;
  dailyPracticeMinutes: number;
  practiceSchedule?: string[];
  onboardingCompleted: boolean;
}

export function getCachedCoachProfile(
  userId: string,
): CachedCoachProfile | null {
  const key = getCacheKey(CACHE_KEYS.PROFILE, userId);
  const cached = safeGetItem<CachedCoachProfile>(key);

  if (isCacheValid(cached, CACHE_DURATIONS.PROFILE)) {
    return cached!.data;
  }
  return null;
}

export function cacheCoachProfile(
  userId: string,
  profile: CachedCoachProfile,
): void {
  const key = getCacheKey(CACHE_KEYS.PROFILE, userId);
  safeSetItem(key, profile, userId);
}

export function invalidateCoachProfile(userId: string): void {
  if (!isBrowser()) return;
  localStorage.removeItem(getCacheKey(CACHE_KEYS.PROFILE, userId));
}

// Training Plan Cache
export interface CachedTrainingPlan {
  _id: string;
  userId: string;
  profileId: string;
  weekNumber: number;
  weekStartDate: number;
  weekEndDate: number;
  status: string;
  dailyPlans: Array<{
    dayOfWeek: number;
    date: number;
    focus: string;
    activities: Array<{
      type: string;
      title: string;
      description: string;
      durationMinutes: number;
      targetSolves?: number;
      completed: boolean;
      completedAt?: number;
    }>;
    isCompleted: boolean;
    isRestDay: boolean;
  }>;
  completedDays: number;
  totalDays: number;
}

export function getCachedTrainingPlan(
  userId: string,
): CachedTrainingPlan | null {
  const key = getCacheKey(CACHE_KEYS.TRAINING_PLAN, userId);
  const cached = safeGetItem<CachedTrainingPlan>(key);

  if (isCacheValid(cached, CACHE_DURATIONS.TRAINING_PLAN)) {
    return cached!.data;
  }
  return null;
}

export function cacheTrainingPlan(
  userId: string,
  plan: CachedTrainingPlan,
): void {
  const key = getCacheKey(CACHE_KEYS.TRAINING_PLAN, userId);
  safeSetItem(key, plan, userId);
}

export function invalidateTrainingPlan(userId: string): void {
  if (!isBrowser()) return;
  localStorage.removeItem(getCacheKey(CACHE_KEYS.TRAINING_PLAN, userId));
}

// Journal Entries Cache
export interface CachedJournalEntry {
  _id: string;
  userId: string;
  profileId: string;
  planId?: string;
  entryDate: number;
  linkedSessionId?: string;
  solveCount?: number;
  sessionAverage?: number;
  bestSingle?: number;
  practiceMinutes?: number;
  customAverage?: number;
  customSolveCount?: number;
  mood: string;
  wentWell?: string;
  challenges?: string;
  notes?: string;
  focusAreas?: string[];
  completedTaskIndices?: number[];
  mediaUrls?: string[];
  mediaFileIds?: string[];
  mediaTypes?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface JournalEntriesCache {
  entries: CachedJournalEntry[];
  lastFetchedCount: number;
}

export function getCachedJournalEntries(
  userId: string,
): CachedJournalEntry[] | null {
  const key = getCacheKey(CACHE_KEYS.JOURNAL_ENTRIES, userId);
  const cached = safeGetItem<JournalEntriesCache>(key);

  if (isCacheValid(cached, CACHE_DURATIONS.JOURNAL_ENTRIES)) {
    return cached!.data.entries;
  }
  return null;
}

export function cacheJournalEntries(
  userId: string,
  entries: CachedJournalEntry[],
): void {
  const key = getCacheKey(CACHE_KEYS.JOURNAL_ENTRIES, userId);
  const cache: JournalEntriesCache = {
    entries,
    lastFetchedCount: entries.length,
  };
  safeSetItem(key, cache, userId);
}

export function addJournalEntryToCache(
  userId: string,
  entry: CachedJournalEntry,
): void {
  const cached = getCachedJournalEntries(userId);
  if (cached) {
    // Check if entry already exists (update) or is new (add)
    const existingIndex = cached.findIndex((e) => e._id === entry._id);
    if (existingIndex >= 0) {
      cached[existingIndex] = entry;
    } else {
      cached.unshift(entry); // Add to beginning (newest first)
    }
    cacheJournalEntries(userId, cached);
  }
}

export function removeJournalEntryFromCache(
  userId: string,
  entryId: string,
): void {
  const cached = getCachedJournalEntries(userId);
  if (cached) {
    const filtered = cached.filter((e) => e._id !== entryId);
    cacheJournalEntries(userId, filtered);
  }
}

export function invalidateJournalEntries(userId: string): void {
  if (!isBrowser()) return;
  localStorage.removeItem(getCacheKey(CACHE_KEYS.JOURNAL_ENTRIES, userId));
}


// Progress Stats Cache
export type CachedProgressStats = any;

export function getCachedProgressStats(
  userId: string,
): CachedProgressStats | null {
  const key = getCacheKey(CACHE_KEYS.PROGRESS_STATS, userId);
  const cached = safeGetItem<CachedProgressStats>(key);

  if (isCacheValid(cached, CACHE_DURATIONS.PROGRESS_STATS)) {
    return cached!.data;
  }
  return null;
}

export function cacheProgressStats(
  userId: string,
  stats: CachedProgressStats,
): void {
  const key = getCacheKey(CACHE_KEYS.PROGRESS_STATS, userId);
  safeSetItem(key, stats, userId);
}

export function invalidateProgressStats(userId: string): void {
  if (!isBrowser()) return;
  localStorage.removeItem(getCacheKey(CACHE_KEYS.PROGRESS_STATS, userId));
}

// Progress Snapshots Cache
export type CachedProgressSnapshot = any;

export function getCachedProgressSnapshots(
  userId: string,
): CachedProgressSnapshot[] | null {
  const key = getCacheKey(CACHE_KEYS.PROGRESS_SNAPSHOTS, userId);
  const cached = safeGetItem<CachedProgressSnapshot[]>(key);

  if (isCacheValid(cached, CACHE_DURATIONS.PROGRESS_SNAPSHOTS)) {
    return cached!.data;
  }
  return null;
}

export function cacheProgressSnapshots(
  userId: string,
  snapshots: CachedProgressSnapshot[],
): void {
  const key = getCacheKey(CACHE_KEYS.PROGRESS_SNAPSHOTS, userId);
  safeSetItem(key, snapshots, userId);
}

export function invalidateProgressSnapshots(userId: string): void {
  if (!isBrowser()) return;
  localStorage.removeItem(getCacheKey(CACHE_KEYS.PROGRESS_SNAPSHOTS, userId));
}

// Media Cache (IndexedDB for blobs)
const MEDIA_DB_NAME = "cubedev_media_cache";
const MEDIA_STORE_NAME = "media";
const MEDIA_DB_VERSION = 1;

let mediaDB: IDBDatabase | null = null;

/**
 * Initialize IndexedDB for media caching
 */
async function initMediaDB(): Promise<IDBDatabase | null> {
  if (!isBrowser()) return null;
  if (mediaDB) return mediaDB;

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(MEDIA_DB_NAME, MEDIA_DB_VERSION);

      request.onerror = () => {
        console.warn("Failed to open IndexedDB for media cache");
        resolve(null);
      };

      request.onsuccess = () => {
        mediaDB = request.result;
        resolve(mediaDB);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(MEDIA_STORE_NAME)) {
          const store = db.createObjectStore(MEDIA_STORE_NAME, {
            keyPath: "fileId",
          });
          store.createIndex("timestamp", "timestamp", { unique: false });
          store.createIndex("userId", "userId", { unique: false });
        }
      };
    } catch (error) {
      console.warn("IndexedDB not available:", error);
      resolve(null);
    }
  });
}

interface CachedMediaBlob {
  fileId: string;
  userId: string;
  blob: Blob;
  mediaType: string;
  originalUrl: string;
  timestamp: number;
}

/**
 * Cache a media blob in IndexedDB
 */
export async function cacheMediaBlob(
  userId: string,
  fileId: string,
  blob: Blob,
  mediaType: string,
  originalUrl: string,
): Promise<void> {
  const db = await initMediaDB();
  if (!db) return;

  try {
    const transaction = db.transaction(MEDIA_STORE_NAME, "readwrite");
    const store = transaction.objectStore(MEDIA_STORE_NAME);

    const item: CachedMediaBlob = {
      fileId,
      userId,
      blob,
      mediaType,
      originalUrl,
      timestamp: Date.now(),
    };

    store.put(item);
  } catch (error) {
    console.warn("Failed to cache media blob:", error);
  }
}

/**
 * Get a cached media blob from IndexedDB
 */
export async function getCachedMediaBlob(fileId: string): Promise<Blob | null> {
  const db = await initMediaDB();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction(MEDIA_STORE_NAME, "readonly");
      const store = transaction.objectStore(MEDIA_STORE_NAME);
      const request = store.get(fileId);

      request.onsuccess = () => {
        const result = request.result as CachedMediaBlob | undefined;
        if (result && Date.now() - result.timestamp < CACHE_DURATIONS.MEDIA) {
          resolve(result.blob);
        } else {
          // Expired, clean up
          if (result) {
            const deleteTransaction = db.transaction(
              MEDIA_STORE_NAME,
              "readwrite",
            );
            deleteTransaction.objectStore(MEDIA_STORE_NAME).delete(fileId);
          }
          resolve(null);
        }
      };

      request.onerror = () => {
        resolve(null);
      };
    } catch (error) {
      console.warn("Failed to get cached media blob:", error);
      resolve(null);
    }
  });
}

/**
 * Create a blob URL from cached media
 */
export async function getCachedMediaUrl(
  fileId: string,
): Promise<string | null> {
  const blob = await getCachedMediaBlob(fileId);
  if (blob) {
    return URL.createObjectURL(blob);
  }
  return null;
}

/**
 * Remove a cached media blob
 */
export async function removeCachedMediaBlob(fileId: string): Promise<void> {
  const db = await initMediaDB();
  if (!db) return;

  try {
    const transaction = db.transaction(MEDIA_STORE_NAME, "readwrite");
    transaction.objectStore(MEDIA_STORE_NAME).delete(fileId);
  } catch (error) {
    console.warn("Failed to remove cached media blob:", error);
  }
}

/**
 * Clear all cached media for a user
 */
export async function clearUserMediaCache(userId: string): Promise<void> {
  const db = await initMediaDB();
  if (!db) return;

  try {
    const transaction = db.transaction(MEDIA_STORE_NAME, "readwrite");
    const store = transaction.objectStore(MEDIA_STORE_NAME);
    const index = store.index("userId");
    const request = index.openCursor(IDBKeyRange.only(userId));

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  } catch (error) {
    console.warn("Failed to clear user media cache:", error);
  }
}

/**
 * Clean up expired media cache entries
 */
export async function cleanupExpiredMedia(): Promise<void> {
  const db = await initMediaDB();
  if (!db) return;

  const now = Date.now();

  try {
    const transaction = db.transaction(MEDIA_STORE_NAME, "readwrite");
    const store = transaction.objectStore(MEDIA_STORE_NAME);
    const request = store.openCursor();

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        const item = cursor.value as CachedMediaBlob;
        if (now - item.timestamp > CACHE_DURATIONS.MEDIA) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
  } catch (error) {
    console.warn("Failed to cleanup expired media:", error);
  }
}

// Coach Cache Invalidation 

/**
 * Invalidate all coach cache for a user
 */
export function invalidateAllCoachCache(userId: string): void {
  invalidateCoachProfile(userId);
  invalidateTrainingPlan(userId);
  invalidateJournalEntries(userId);
  invalidateProgressStats(userId);
  invalidateProgressSnapshots(userId);
  clearUserMediaCache(userId);
}

/**
 * Clear all coach cache entries (all users)
 */
export function clearAllCoachCache(): void {
  if (!isBrowser()) return;

  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });

    // Clear IndexedDB
    indexedDB.deleteDatabase(MEDIA_DB_NAME);
    mediaDB = null;
  } catch (error) {
    console.warn("Failed to clear all coach cache:", error);
  }
}

// Cache-Aware Data Fetching Hook Helpers

/**
 * Helper to use cached data while fetching fresh data
 * Returns cached data immediately if available, then updates when fresh data arrives
 */
export function useCachedDataPattern<T>(
  cached: T | null,
  fresh: T | undefined,
  cacheUpdater: (data: T) => void,
): T | null {
  // If we have fresh data, cache it and return it
  if (fresh !== undefined) {
    cacheUpdater(fresh);
    return fresh;
  }
  // Otherwise return cached data
  return cached;
}
