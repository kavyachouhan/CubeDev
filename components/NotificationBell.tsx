"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { useUser } from "@/components/UserProvider";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  useInAppNotifications,
  getSeenAlgorithmNotificationIds,
} from "@/lib/notification-utils";

interface NotificationBellProps {
  onClick: () => void;
  collapsed?: boolean;
}

export default function NotificationBell({
  onClick,
  collapsed = false,
}: NotificationBellProps) {
  const { user } = useUser();

  // Fetch reviews for notifications
  const reviews = useQuery(
    api.algorithms.getReviewsForNotifications,
    user?.convexId ? { userId: user.convexId as any } : "skip",
  );

  // In-app notifications
  const {
    notifications: allInAppNotifications,
    unreadCount: inAppUnreadCount,
  } = useInAppNotifications();

  // Filter out "algorithm-due" notifications since those are handled by the reviews query
  const inAppNotifications = allInAppNotifications.filter(
    (n) => n.type !== "algorithm-due",
  );
  const unreadInAppCount = inAppNotifications.filter((n) => !n.read).length;

  // Track seen algorithm notification IDs to avoid counting them in the badge count
  const [seenAlgoIds, setSeenAlgoIds] = useState<Set<string>>(new Set());

  const refreshSeenIds = useCallback(() => {
    setSeenAlgoIds(getSeenAlgorithmNotificationIds());
  }, []);

  useEffect(() => {
    refreshSeenIds();
    const handler = () => refreshSeenIds();
    window.addEventListener("cubedev-notification-updated", handler);
    return () =>
      window.removeEventListener("cubedev-notification-updated", handler);
  }, [refreshSeenIds]);

  // Calculate notification counts
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  const overdue =
    reviews?.filter((r) => r.progress.nextReviewDate < oneDayAgo) || [];
  const dueToday =
    reviews?.filter(
      (r) =>
        r.progress.nextReviewDate >= oneDayAgo &&
        r.progress.nextReviewDate <= now,
    ) || [];
  const dueSoon =
    reviews?.filter(
      (r) =>
        r.progress.nextReviewDate > now &&
        r.progress.nextReviewDate < now + 24 * 60 * 60 * 1000,
    ) || [];

  // Combine all algorithm notifications and count how many are unseen (not in seenAlgoIds)
  const allAlgoReviews = [...overdue, ...dueToday, ...dueSoon];
  const unseenAlgorithmCount = allAlgoReviews.filter(
    (r) => !seenAlgoIds.has(r.progress._id),
  ).length;

  const notificationCount = unseenAlgorithmCount + unreadInAppCount;
  const hasNotifications = notificationCount > 0;

  return (
    <button
      onClick={onClick}
      className={`relative p-2 text-(--text-secondary) hover:text-(--primary) hover:bg-(--surface-elevated) rounded-lg transition-colors ${
        collapsed ? "w-full flex justify-center" : ""
      }`}
      title={`${notificationCount} notification${notificationCount !== 1 ? "s" : ""}`}
      aria-label={`Notifications: ${notificationCount} notification${notificationCount !== 1 ? "s" : ""}`}
    >
      <Bell className="w-5 h-5" />
      {hasNotifications && (
        <span
          className={`absolute flex items-center justify-center bg-(--error) text-white text-[10px] font-bold rounded-full font-inter ${
            collapsed
              ? "top-0.5 right-0.5 min-w-[16px] h-[16px] px-1"
              : "top-0.5 right-0.5 min-w-[18px] h-[18px] px-1"
          }`}
        >
          {notificationCount > 99 ? "99+" : notificationCount}
        </span>
      )}
    </button>
  );
}