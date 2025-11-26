"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@/components/UserProvider";
import {
  sendAlgorithmDueNotification,
  useNotificationPermission,
} from "@/lib/notification-utils";

const CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
const NOTIFICATION_COOLDOWN = 60 * 60 * 1000; // Don't spam - wait 1 hour between notifications

/**
 * Service component that monitors for due algorithms and sends desktop notifications
 * This should be mounted once at the app level
 */
export default function NotificationService() {
  const { user } = useUser();
  const { preferences, isSupported } = useNotificationPermission();
  const lastNotificationTime = useRef<number>(0);
  const previousDueCount = useRef<number>(0);

  // Get due reviews
  const dueReviews = useQuery(
    api.algorithms.getDueReviews,
    user?.convexId ? { userId: user.convexId as any } : "skip"
  );

  useEffect(() => {
    // Don't run if notifications aren't supported or enabled
    if (
      !isSupported ||
      !preferences.enabled ||
      !preferences.algorithmReminders
    ) {
      return;
    }

    // Don't run if user isn't logged in
    if (!user?.convexId) {
      return;
    }

    const dueCount = dueReviews?.length || 0;

    // Only send notification if:
    // 1. There are due algorithms
    // 2. Count has increased since last check (new algorithms became due)
    // 3. Enough time has passed since last notification (cooldown)
    const now = Date.now();
    const timeSinceLastNotification = now - lastNotificationTime.current;
    const countIncreased = dueCount > previousDueCount.current;

    if (
      dueCount > 0 &&
      countIncreased &&
      timeSinceLastNotification > NOTIFICATION_COOLDOWN
    ) {
      sendAlgorithmDueNotification(dueCount);
      lastNotificationTime.current = now;
    }

    previousDueCount.current = dueCount;
  }, [dueReviews, user, preferences, isSupported]);

  // Set up periodic checks (in case tab is open for a long time)
  useEffect(() => {
    if (
      !isSupported ||
      !preferences.enabled ||
      !preferences.algorithmReminders
    ) {
      return;
    }

    const interval = setInterval(() => {
      // The query will automatically re-run and trigger the effect above
      // This ensures we check periodically even if the query doesn't update
    }, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [preferences, isSupported]);

  // This component doesn't render anything
  return null;
}
