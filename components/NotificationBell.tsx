"use client";

import { Bell } from "lucide-react";
import { useUser } from "@/components/UserProvider";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

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
    user?.convexId ? { userId: user.convexId as any } : "skip"
  );

  // Calculate notification count
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  const overdue =
    reviews?.filter((r) => r.progress.nextReviewDate < oneDayAgo) || [];
  const dueToday =
    reviews?.filter(
      (r) =>
        r.progress.nextReviewDate >= oneDayAgo &&
        r.progress.nextReviewDate <= now
    ) || [];
  const dueSoon =
    reviews?.filter(
      (r) =>
        r.progress.nextReviewDate > now &&
        r.progress.nextReviewDate < now + 24 * 60 * 60 * 1000
    ) || [];

  const notificationCount = overdue.length + dueToday.length + dueSoon.length;
  const hasNotifications = notificationCount > 0;

  return (
    <button
      onClick={onClick}
      className={`relative p-2 text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--surface-elevated)] rounded-lg transition-colors ${
        collapsed ? "w-full flex justify-center" : ""
      }`}
      title={`${notificationCount} notification${notificationCount !== 1 ? "s" : ""}`}
      aria-label={`Notifications: ${notificationCount} notification${notificationCount !== 1 ? "s" : ""}`}
    >
      <Bell className="w-5 h-5" />
      {hasNotifications && (
        <span
          className={`absolute flex items-center justify-center bg-[var(--error)] text-white text-[10px] font-bold rounded-full font-inter ${
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