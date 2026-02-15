"use client";

import { useQuery } from "convex/react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  setAdminCache,
  getAdminCacheWithStaleCheck,
  ADMIN_CACHE_TTLS,
} from "@/lib/admin-cache";
import {
  FunctionReference,
  FunctionArgs,
  FunctionReturnType,
} from "convex/server";

// Custom hook to manage admin data with caching and stale checks
export function useCachedQuery<Query extends FunctionReference<"query">>(
  queryFn: Query,
  args: FunctionArgs<Query> | "skip",
  options: {
    cacheKey: string;
    ttl?: number;
    staleThreshold?: number;
    enabled?: boolean;
  },
): {
  data: FunctionReturnType<Query> | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isFromCache: boolean;
  cacheAge: number | null;
  refetch: () => void;
} {
  const {
    cacheKey,
    ttl = ADMIN_CACHE_TTLS.dashboard,
    staleThreshold = 2 * 60 * 1000, // 2 minutes
    enabled = true,
  } = options;

  // State to determine if we should skip the Convex query because cache is fresh
  const [shouldSkip, setShouldSkip] = useState(false);
  const [cachedData, setCachedData] = useState<
    FunctionReturnType<Query> | undefined
  >();
  const [isFromCache, setIsFromCache] = useState(false);
  const [cacheAge, setCacheAge] = useState<number | null>(null);
  const [forceRefetch, setForceRefetch] = useState(0);
  const lastCacheKeyRef = useRef<string>("");
  const lastForceRefetchRef = useRef(0);
  const initializedRef = useRef(false);

  // Stringify args for dependency tracking - if args is "skip", keep it as "skip" to avoid unnecessary re-renders
  const argsString = args === "skip" ? "skip" : JSON.stringify(args);

  // Effect to check cache and determine if we can skip the Convex query
  useEffect(() => {
    if (!enabled || argsString === "skip") return;

    const cacheKeyChanged = lastCacheKeyRef.current !== cacheKey;
    const refetchTriggered = lastForceRefetchRef.current !== forceRefetch;

    // If cache key hasn't changed, refetch wasn't triggered, and we've already initialized, we can skip the cache check
    if (!cacheKeyChanged && !refetchTriggered && initializedRef.current) {
      return;
    }

    lastCacheKeyRef.current = cacheKey;
    lastForceRefetchRef.current = forceRefetch;
    initializedRef.current = true;

    // If refetch was triggered, we want to bypass cache and fetch fresh data
    if (refetchTriggered) {
      setShouldSkip(false);
      setIsFromCache(false);
      return;
    }

    const cacheResult = getAdminCacheWithStaleCheck<FunctionReturnType<Query>>(
      cacheKey,
      staleThreshold,
    );

    if (cacheResult.data !== null) {
      setCachedData(cacheResult.data);
      setCacheAge(
        cacheResult.timestamp ? Date.now() - cacheResult.timestamp : null,
      );
      setIsFromCache(true);

      // If cache is not stale, we can skip the Convex query
      if (!cacheResult.isStale) {
        setShouldSkip(true);
      } else {
        setShouldSkip(false);
      }
    } else {
      setShouldSkip(false);
      setIsFromCache(false);
    }
  }, [cacheKey, enabled, argsString, staleThreshold, forceRefetch]);

  // Memoize the query arguments - if shouldSkip is true, we pass "skip" to the Convex query to avoid executing it
  const queryArgs = useMemo(() => {
    if (!enabled || args === "skip") return "skip" as const;
    if (shouldSkip) return "skip" as const;
    return args;
    // We intentionally do not include shouldSkip in the dependencies to avoid re-memoizing when it changes - we want to control when the query executes via the shouldSkip state
  }, [enabled, argsString, shouldSkip]);

  // Execute the Convex query - it will internally skip execution if queryArgs is "skip"
  const convexData = useQuery(queryFn, queryArgs);

  // Effect to update cache when we get new data from Convex
  useEffect(() => {
    if (convexData !== undefined && enabled && argsString !== "skip") {
      setAdminCache(cacheKey, convexData, ttl);
      setCachedData(convexData);
      setIsFromCache(false);
      setCacheAge(0);
    }
  }, [convexData, cacheKey, ttl, enabled, argsString]);

  // Refetch function to manually trigger a refetch, bypassing cache
  const refetch = useCallback(() => {
    setShouldSkip(false);
    setIsFromCache(false);
    setForceRefetch((prev) => prev + 1);
  }, []);

  // Determine which data to return - if Convex data is available, use it; otherwise fall back to cached data (which could be undefined if no cache)
  const data = convexData !== undefined ? convexData : cachedData;

  // Loading state - true if we don't have any data to show (neither cache nor fresh data)
  const isLoading = data === undefined;

  // Fetching state - true if we're currently fetching fresh data from Convex (i.e., convexData is undefined but we should not skip, meaning the query is executing)
  const isFetching =
    convexData === undefined && !shouldSkip && argsString !== "skip";

  return {
    data,
    isLoading,
    isFetching,
    isFromCache,
    cacheAge,
    refetch,
  };
}

// Helper hook to simplify usage when you just want the data and refetch function, and don't care about loading states or cache metadata
export function useAdminData<Query extends FunctionReference<"query">>(
  queryFn: Query,
  args: FunctionArgs<Query> | "skip",
  cacheKey: string,
  ttl?: number,
): FunctionReturnType<Query> | undefined {
  const { data } = useCachedQuery(queryFn, args, { cacheKey, ttl });
  return data;
}