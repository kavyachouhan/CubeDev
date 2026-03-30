"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@/components/UserProvider";
import {
  X,
  Calendar,
  Clock,
  ChevronRight,
  CheckCircle2,
  Trophy,
  Flame,
  Target,
  Bell,
} from "lucide-react";
import Link from "next/link";
import {
  useNotificationPermission,
  shouldShowPermissionPrompt,
  useInAppNotifications,
  markAllInAppAsRead,
  markAlgorithmNotificationsSeen,
} from "@/lib/notification-utils";
import type { Id } from "@/convex/_generated/dataModel";

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsModal({
  isOpen,
  onClose,
}: NotificationsModalProps) {
  const { user } = useUser();
  const { preferences, isSupported, requestPermission, dismissPrompt } =
    useNotificationPermission();
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  // Mutations
  const dismissNotification = useMutation(api.users.dismissNotification);
  const clearAllDismissed = useMutation(
    api.users.clearAllDismissedNotifications,
  );

  // Show permission prompt if needed
  useEffect(() => {
    if (
      isOpen &&
      isSupported &&
      preferences.showPrompt &&
      shouldShowPermissionPrompt()
    ) {
      setShowPermissionBanner(true);
    }
  }, [isOpen, isSupported, preferences.showPrompt]);

  // Fetch due reviews for notifications
  const dueReviews = useQuery(
    api.algorithms.getReviewsForNotifications,
    user?.convexId ? { userId: user.convexId as any } : "skip",
  );

  // Get in-app notifications (coaching notifications only - exclude algorithm-due)
  const {
    notifications: allInAppNotifications,
    dismiss: dismissInApp,
    dismissAll: dismissAllInApp,
    markAllRead: markAllInAppRead,
  } = useInAppNotifications();

  // Filter out algorithm-due notifications since they are already shown
  // in the Overdue/Due Today/Due Soon sections from the Convex query
  const inAppNotifications = allInAppNotifications.filter(
    (n) => n.type !== "algorithm-due",
  );

  // When modal opens, mark all in-app notifications as read and mark algorithm notifications as seen
  useEffect(() => {
    if (isOpen) {
      // Mark all in-app notifications as read
      markAllInAppAsRead();

      // Mark algorithm notifications as seen
      if (dueReviews) {
        const ids = dueReviews.map((r) => r.progress._id);
        markAlgorithmNotificationsSeen(ids);
      }
    }
  }, [isOpen, dueReviews]);

  if (!isOpen) return null;

  // Categorize reviews
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const twoDaysAgo = now - 48 * 60 * 60 * 1000;

  const overdue =
    dueReviews?.filter((r) => r.progress.nextReviewDate < oneDayAgo) || [];
  const dueToday =
    dueReviews?.filter(
      (r) =>
        r.progress.nextReviewDate >= oneDayAgo &&
        r.progress.nextReviewDate <= now,
    ) || [];
  const dueSoon =
    dueReviews?.filter(
      (r) =>
        r.progress.nextReviewDate > now &&
        r.progress.nextReviewDate < now + 24 * 60 * 60 * 1000,
    ) || [];

  const formatTimeAgo = (timestamp: number) => {
    const diff = now - timestamp;
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const minutes = Math.floor(diff / (60 * 1000));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  const formatDueTime = (timestamp: number) => {
    const diff = timestamp - now;
    const hours = Math.floor(diff / (60 * 60 * 1000));

    if (diff < 0) {
      return formatTimeAgo(timestamp);
    }

    if (hours < 24) return `In ${hours}h`;
    return new Date(timestamp).toLocaleDateString();
  };

  const totalNotifications =
    (dueReviews?.length || 0) + inAppNotifications.length;

  // Get icon for in-app notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "daily-practice-reminder":
        return <Bell className="w-4 h-4" />;
      case "streak-at-risk":
        return <Flame className="w-4 h-4" />;
      case "weekly-summary":
        return <Trophy className="w-4 h-4" />;
      case "goal-progress":
        return <Target className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  // Get color for in-app notification type
  const getNotificationColor = (type: string) => {
    switch (type) {
      case "streak-at-risk":
        return "var(--warning)";
      case "weekly-summary":
        return "var(--primary)";
      case "goal-progress":
        return "var(--success)";
      default:
        return "var(--primary)";
    }
  };

  const handleEnableNotifications = async () => {
    setIsRequestingPermission(true);
    const permission = await requestPermission();
    setIsRequestingPermission(false);

    if (permission === "granted") {
      setShowPermissionBanner(false);
    }
  };

  const handleDismissPrompt = () => {
    dismissPrompt();
    setShowPermissionBanner(false);
  };

  const handleDismissNotification = async (
    e: React.MouseEvent,
    progressId: Id<"userAlgorithmProgress">,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (user?.convexId) {
      await dismissNotification({
        userId: user.convexId as Id<"users">,
        progressId,
      });
    }
  };

  const handleDismissAll = async () => {
    // Dismiss algorithm notifications
    if (user?.convexId && dueReviews) {
      // Dismiss all notifications
      for (const review of dueReviews) {
        await dismissNotification({
          userId: user.convexId as Id<"users">,
          progressId: review.progress._id,
        });
      }
    }
    // Dismiss all in-app notifications
    dismissAllInApp();
  };

  const handleDismissInAppNotification = (id: string) => {
    dismissInApp(id);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="timer-card max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-(--text-primary) font-statement">
              Notifications
            </h2>
            <p className="text-sm text-(--text-muted) mt-1 font-inter">
              {totalNotifications} New Notification
              {totalNotifications !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-(--text-muted) hover:text-(--text-primary) transition-colors p-1 rounded-lg hover:bg-(--surface-elevated)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Permission Banner */}
        {showPermissionBanner && (
          <div className="mb-4 timer-card bg-(--primary)/10 border border-(--primary)/30 p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-(--text-primary) mb-1 font-statement">
                  Enable Desktop Notifications
                </h3>
                <p className="text-xs text-(--text-muted) mb-3 font-inter">
                  Get notified even when you're not on CubeDev. Stay on track
                  with your learning!
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleEnableNotifications}
                    disabled={isRequestingPermission}
                    className="w-full sm:w-auto px-4 py-2 bg-(--primary) text-white text-sm font-semibold rounded-lg hover:bg-(--primary-hover) transition-colors disabled:opacity-50 font-inter"
                  >
                    {isRequestingPermission
                      ? "Requesting..."
                      : "Enable Notifications"}
                  </button>
                  <button
                    onClick={handleDismissPrompt}
                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-(--text-muted) hover:text-(--text-primary) transition-colors font-inter"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
              <button
                onClick={handleDismissPrompt}
                className="hidden sm:block shrink-0 text-(--text-muted) hover:text-(--text-primary) transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {dueReviews === undefined ? (
            // Loading State
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-box rounded-lg h-24" />
              ))}
            </div>
          ) : totalNotifications === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-(--surface-elevated) rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-(--primary)" />
              </div>
              <h3 className="text-lg font-semibold text-(--text-primary) mb-2 font-statement">
                All Caught Up!
              </h3>
              <p className="text-sm text-(--text-muted) text-center max-w-sm font-inter">
                You have no new notifications. Great job keeping up with your
                schedule!
              </p>
            </div>
          ) : (
            <>
              {/* Coaching Notifications Section */}
              {inAppNotifications.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-(--primary) mb-3 font-statement flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Coaching ({inAppNotifications.length})
                  </h3>
                  <div className="space-y-2">
                    {inAppNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="relative timer-card bg-(--surface-elevated) border border-(--border) hover:border-(--primary)/40 transition-all p-4 group"
                        style={{
                          borderColor: `color-mix(in srgb, ${getNotificationColor(notification.type)} 20%, transparent)`,
                        }}
                      >
                        <Link
                          href={notification.url}
                          onClick={onClose}
                          className="block pr-8"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className="text-xs font-medium font-inter px-2 py-0.5 rounded flex items-center gap-1"
                                  style={{
                                    color: getNotificationColor(
                                      notification.type,
                                    ),
                                    backgroundColor: `color-mix(in srgb, ${getNotificationColor(notification.type)} 10%, transparent)`,
                                  }}
                                >
                                  {getNotificationIcon(notification.type)}
                                  {notification.type
                                    .split("-")
                                    .map(
                                      (word) =>
                                        word.charAt(0).toUpperCase() +
                                        word.slice(1),
                                    )
                                    .join(" ")}
                                </span>
                              </div>
                              <h4 className="text-sm font-semibold text-(--text-primary) mb-1 font-statement">
                                {notification.title}
                              </h4>
                              <p className="text-xs text-(--text-muted) font-inter mb-1">
                                {notification.body}
                              </p>
                              <span className="text-xs text-(--text-muted) font-inter flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTimeAgo(notification.timestamp)}
                              </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-(--text-muted) group-hover:text-(--primary) transition-colors shrink-0" />
                          </div>
                        </Link>
                        <button
                          onClick={() =>
                            handleDismissInAppNotification(notification.id)
                          }
                          className="absolute top-3 right-3 p-1 text-(--text-muted) hover:text-(--text-primary) hover:bg-(--surface) rounded transition-colors z-10"
                          title="Dismiss notification"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Overdue Section */}
              {overdue.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-(--error) mb-3 font-statement flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Overdue ({overdue.length})
                  </h3>
                  <div className="space-y-2">
                    {overdue.map((review) => (
                      <div
                        key={review.progress._id}
                        className="relative timer-card bg-(--surface-elevated) border border-(--error)/20 hover:border-(--error)/40 transition-all p-4 group"
                      >
                        <Link
                          href={`/cube-lab/algorithm-trainer/cases/${review.case?.slug}`}
                          onClick={onClose}
                          className="block pr-8"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-(--error) font-inter px-2 py-0.5 bg-(--error)/10 rounded">
                                  {review.set?.name}
                                </span>
                              </div>
                              <h4 className="text-sm font-semibold text-(--text-primary) mb-1 font-statement">
                                {review.case?.caseName}
                              </h4>
                              <div className="flex items-center gap-4 text-xs text-(--text-muted) font-inter">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatTimeAgo(
                                    review.progress.nextReviewDate,
                                  )}
                                </span>
                                <span>
                                  Stage: {review.progress.learningStage}
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-(--text-muted) group-hover:text-(--primary) transition-colors shrink-0" />
                          </div>
                        </Link>
                        <button
                          onClick={(e) =>
                            handleDismissNotification(e, review.progress._id)
                          }
                          className="absolute top-3 right-3 p-1 text-(--text-muted) hover:text-(--text-primary) hover:bg-(--surface) rounded transition-colors z-10"
                          title="Dismiss notification"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Due Today Section */}
              {dueToday.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-(--warning) mb-3 font-statement flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Due Today ({dueToday.length})
                  </h3>
                  <div className="space-y-2">
                    {dueToday.map((review) => (
                      <div
                        key={review.progress._id}
                        className="relative timer-card bg-(--surface-elevated) border border-(--warning)/20 hover:border-(--warning)/40 transition-all p-4 group"
                      >
                        <Link
                          href={`/cube-lab/algorithm-trainer/cases/${review.case?.slug}`}
                          onClick={onClose}
                          className="block pr-8"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-(--warning) font-inter px-2 py-0.5 bg-(--warning)/10 rounded">
                                  {review.set?.name}
                                </span>
                              </div>
                              <h4 className="text-sm font-semibold text-(--text-primary) mb-1 font-statement">
                                {review.case?.caseName}
                              </h4>
                              <div className="flex items-center gap-4 text-xs text-(--text-muted) font-inter">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatTimeAgo(
                                    review.progress.nextReviewDate,
                                  )}
                                </span>
                                <span>
                                  Stage: {review.progress.learningStage}
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-(--text-muted) group-hover:text-(--primary) transition-colors shrink-0" />
                          </div>
                        </Link>
                        <button
                          onClick={(e) =>
                            handleDismissNotification(e, review.progress._id)
                          }
                          className="absolute top-3 right-3 p-1 text-(--text-muted) hover:text-(--text-primary) hover:bg-(--surface) rounded transition-colors z-10"
                          title="Dismiss notification"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Due Soon Section */}
              {dueSoon.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-(--primary) mb-3 font-statement flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Due Soon ({dueSoon.length})
                  </h3>
                  <div className="space-y-2">
                    {dueSoon.map((review) => (
                      <div
                        key={review.progress._id}
                        className="relative timer-card bg-(--surface-elevated) border border-(--border) hover:border-(--primary)/40 transition-all p-4 group"
                      >
                        <Link
                          href={`/cube-lab/algorithm-trainer/cases/${review.case?.slug}`}
                          onClick={onClose}
                          className="block pr-8"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-(--primary) font-inter px-2 py-0.5 bg-(--primary)/10 rounded">
                                  {review.set?.name}
                                </span>
                              </div>
                              <h4 className="text-sm font-semibold text-(--text-primary) mb-1 font-statement">
                                {review.case?.caseName}
                              </h4>
                              <div className="flex items-center gap-4 text-xs text-(--text-muted) font-inter">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDueTime(
                                    review.progress.nextReviewDate,
                                  )}
                                </span>
                                <span>
                                  Stage: {review.progress.learningStage}
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-(--text-muted) group-hover:text-(--primary) transition-colors shrink-0" />
                          </div>
                        </Link>
                        <button
                          onClick={(e) =>
                            handleDismissNotification(e, review.progress._id)
                          }
                          className="absolute top-3 right-3 p-1 text-(--text-muted) hover:text-(--text-primary) hover:bg-(--surface) rounded transition-colors z-10"
                          title="Dismiss notification"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {totalNotifications > 0 && (
          <div className="flex flex-col gap-3 pt-6 mt-6 border-t border-(--border)">
            <div className="flex flex-col sm:flex-row gap-3">
              {(dueReviews?.length || 0) > 0 ? (
                <Link
                  href="/cube-lab/algorithm-trainer/practice"
                  onClick={onClose}
                  className="flex-1 btn-primary text-center py-3 sm:py-3"
                >
                  Practice Algorithms
                </Link>
              ) : (
                <Link
                  href="/cube-lab/coach"
                  onClick={onClose}
                  className="flex-1 btn-primary text-center py-3 sm:py-3"
                >
                  Open Coach
                </Link>
              )}
              <button
                onClick={onClose}
                className="flex-1 btn-secondary py-3 sm:py-3"
              >
                Close
              </button>
            </div>
            <button
              onClick={handleDismissAll}
              className="w-full text-sm text-(--text-muted) hover:text-(--text-primary) transition-colors py-2 font-inter"
            >
              Dismiss All Notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
}