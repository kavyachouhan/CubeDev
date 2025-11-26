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

  // Get due reviews count
  const dueReviews = useQuery(
    api.algorithms.getDueReviews,
    user?.convexId ? { userId: user.convexId as any } : "skip"
  );

  const notificationCount = dueReviews?.length || 0;
  const hasNotifications = notificationCount > 0;

  return (
    <button
      onClick={onClick}
      className={`relative p-2 text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--surface-elevated)] rounded-lg transition-colors ${
        collapsed ? "w-full flex justify-center" : ""
      }`}
      title={`${notificationCount} new notification${notificationCount !== 1 ? "s" : ""} due`}
      aria-label={`Notifications: ${notificationCount} new notification${notificationCount !== 1 ? "s" : ""} due`}
    >
      <Bell className="w-5 h-5" />
      {hasNotifications && (
        <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-[var(--error)] text-white text-[10px] font-semibold rounded-full font-inter">
          {notificationCount > 99 ? "99+" : notificationCount}
        </span>
      )}
    </button>
  );
}
