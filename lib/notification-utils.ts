"use client";

import { useState, useEffect, useCallback } from "react";

export type NotificationPermission = "default" | "granted" | "denied";

export interface CoachingNotificationPreferences {
  dailyPracticeReminder: boolean;
  dailyPracticeTime: string; // HH:MM format
  streakAlerts: boolean;
  weeklySummary: boolean;
  goalProgressUpdates: boolean;
}

export interface NotificationPreferences {
  enabled: boolean;
  permission: NotificationPermission;
  algorithmReminders: boolean;
  challengeInvites: boolean;
  showPrompt: boolean; // Whether to show the permission prompt (for first-time users)
  pushEnabled: boolean; // Whether the user has enabled push notifications (separate from permission)
  coaching: CoachingNotificationPreferences;
}

// In-app notification types
export type InAppNotificationType =
  | "algorithm-due"
  | "daily-practice-reminder"
  | "streak-at-risk"
  | "weekly-summary"
  | "goal-progress";

export interface InAppNotification {
  id: string;
  type: InAppNotificationType;
  title: string;
  body: string;
  url: string;
  timestamp: number;
  read: boolean;
  dismissed: boolean;
}

const STORAGE_KEY = "cubedev-notification-preferences";
const IN_APP_NOTIFICATIONS_KEY = "cubedev-in-app-notifications";
const SW_PATH = "/sw.js";
const MAX_IN_APP_NOTIFICATIONS = 50; // Keep last 50 notifications

// Convert VAPID key from URL-safe base64 to Uint8Array ||
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray as Uint8Array<ArrayBuffer>;
}

// Register the service worker for push notifications
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    console.warn("[Push] Service workers not supported");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_PATH, {
      scope: "/",
    });
    console.log("[Push] Service worker registered:", registration.scope);
    return registration;
  } catch (error) {
    console.error("[Push] Service worker registration failed:", error);
    return null;
  }
}

// Get the current push subscription
export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error("[Push] Failed to get subscription:", error);
    return null;
  }
}

// Subscribe to push notifications
export async function subscribeToPush(
  vapidPublicKey: string,
): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("[Push] Push messaging not supported");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      console.log("[Push] Already subscribed");
      return subscription;
    }

    // Subscribe with VAPID key
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    console.log("[Push] Subscribed successfully");
    return subscription;
  } catch (error) {
    console.error("[Push] Failed to subscribe:", error);
    return null;
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const subscription = await getCurrentPushSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      console.log("[Push] Unsubscribed successfully");
      return true;
    }
    return false;
  } catch (error) {
    console.error("[Push] Failed to unsubscribe:", error);
    return false;
  }
}

// Check if push notifications are supported
export function isPushSupported(): boolean {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

// Get device name from user agent
export function getDeviceName(): string {
  const ua = navigator.userAgent;

  // Mobile devices
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/Android/i.test(ua)) {
    if (/Mobile/i.test(ua)) return "Android Phone";
    return "Android Tablet";
  }

  // Desktop browsers
  if (/Chrome/i.test(ua)) return "Chrome";
  if (/Firefox/i.test(ua)) return "Firefox";
  if (/Safari/i.test(ua)) return "Safari";
  if (/Edge/i.test(ua)) return "Edge";

  return "Unknown Device";
}

// Hook to manage notification permissions and preferences
export function useNotificationPermission() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: false,
    permission: "default",
    algorithmReminders: true,
    challengeInvites: true,
    showPrompt: true,
    pushEnabled: false,
    coaching: {
      dailyPracticeReminder: true,
      dailyPracticeTime: "19:00",
      streakAlerts: true,
      weeklySummary: true,
      goalProgressUpdates: true,
    },
  });

  const [isSupported, setIsSupported] = useState(false);
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);

  useEffect(() => {
    // Check if browser supports notifications
    const supported = "Notification" in window;
    setIsSupported(supported);

    if (!supported) return;

    // Load preferences from localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    const currentPermission = Notification.permission;

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPreferences({
          ...parsed,
          pushEnabled: parsed.pushEnabled ?? false,
          permission: currentPermission,
          enabled:
            currentPermission === "granted" &&
            parsed.algorithmReminders !== false,
        });
      } catch (e) {
        console.error("Failed to parse notification preferences:", e);
      }
    } else {
      setPreferences((prev) => ({
        ...prev,
        permission: currentPermission,
        enabled: currentPermission === "granted",
      }));
    }

    // Check push subscription status
    if (isPushSupported()) {
      getCurrentPushSubscription().then((sub) => {
        setIsPushSubscribed(!!sub);
      });
    }
  }, []);

  const savePreferences = useCallback(
    (newPreferences: NotificationPreferences) => {
      setPreferences(newPreferences);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
    },
    [],
  );

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      return "denied";
    }

    try {
      const permission = await Notification.requestPermission();
      const newPreferences = {
        ...preferences,
        permission,
        enabled: permission === "granted",
        showPrompt: false,
      };
      savePreferences(newPreferences);
      return permission;
    } catch (error) {
      console.error("Failed to request notification permission:", error);
      return "denied";
    }
  };

  const updatePreferences = useCallback(
    (updates: Partial<NotificationPreferences>) => {
      setPreferences((prev) => {
        const newPreferences = {
          ...prev,
          ...updates,
          // Recalculate enabled status
          enabled:
            prev.permission === "granted" &&
            (updates.algorithmReminders ?? prev.algorithmReminders),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
        return newPreferences;
      });
    },
    [],
  );

  const dismissPrompt = () => {
    updatePreferences({ showPrompt: false });
  };

  return {
    preferences,
    isSupported,
    isPushSubscribed,
    setIsPushSubscribed,
    requestPermission,
    updatePreferences,
    dismissPrompt,
    savePreferences,
  };
}

// Send a desktop notification
export function sendDesktopNotification(
  title: string,
  options?: NotificationOptions & { onClick?: () => void; url?: string },
) {
  if (!("Notification" in window)) {
    console.warn("This browser does not support desktop notifications");
    return null;
  }

  if (Notification.permission !== "granted") {
    console.warn("Notification permission not granted");
    return null;
  }

  try {
    const { onClick, url, ...notificationOptions } = options || {};

    const notification = new Notification(title, {
      icon: "/cubedev_logo.png",
      badge: "/cubedev_logo.png",
      data: { url: url || "/" },
      ...notificationOptions,
    });

    if (onClick) {
      notification.onclick = () => {
        window.focus();
        onClick();
        notification.close();
      };
    }

    return notification;
  } catch (error) {
    console.error("Failed to send notification:", error);
    return null;
  }
}

//Send notification for due algorithms
export function sendAlgorithmDueNotification(count: number) {
  const title = `${count} Algorithm${count !== 1 ? "s" : ""} Due for Review`;
  const body =
    count === 1
      ? "You have 1 algorithm ready to practice!"
      : `You have ${count} algorithms ready to practice!`;
  const url = "/cube-lab/algorithm-trainer/practice";

  // Add to in-app notifications
  addInAppNotification({
    type: "algorithm-due",
    title,
    body,
    url,
  });

  return sendDesktopNotification(title, {
    body,
    tag: "algorithm-due",
    requireInteraction: false,
    url,
    onClick: () => {
      window.location.href = url;
    },
  });
}

// Determine if we should show the permission prompt
export function shouldShowPermissionPrompt(): boolean {
  if (!("Notification" in window)) return false;
  if (Notification.permission !== "default") return false;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return true;

  try {
    const parsed = JSON.parse(stored);
    return parsed.showPrompt !== false;
  } catch {
    return true;
  }
}

/**
 * Send daily practice reminder notification
 */
export function sendDailyPracticeReminderNotification() {
  const title = "Time to Practice";
  const body =
    "Your daily practice session awaits. Keep building those skills!";
  const url = "/cube-lab/coach";

  // Add to in-app notifications
  addInAppNotification({
    type: "daily-practice-reminder",
    title,
    body,
    url,
  });

  return sendDesktopNotification(title, {
    body,
    tag: "daily-practice-reminder",
    requireInteraction: false,
    url,
    onClick: () => {
      window.location.href = url;
    },
  });
}

/**
 * Send streak at risk notification
 */
export function sendStreakAtRiskNotification(currentStreak: number) {
  const title = "Streak at Risk";
  const body =
    currentStreak > 0
      ? `You haven't practiced today. Your ${currentStreak}-day streak is at risk!`
      : "You haven't practiced today. Start a new streak now!";
  const url = "/cube-lab/coach";

  // Add to in-app notifications
  addInAppNotification({
    type: "streak-at-risk",
    title,
    body,
    url,
  });

  return sendDesktopNotification(title, {
    body,
    tag: "streak-at-risk",
    requireInteraction: false,
    url,
    onClick: () => {
      window.location.href = url;
    },
  });
}

/**
 * Send weekly summary notification
 */
export function sendWeeklySummaryNotification(stats: {
  practiceHours: number;
  solves: number;
  improvement?: number;
}) {
  const { practiceHours, solves, improvement } = stats;
  const url = "/cube-lab/coach?tab=progress";

  const title = "Weekly Practice Summary";
  let body = `Great week! ${practiceHours.toFixed(1)} hours of practice with ${solves} solves.`;

  if (improvement && improvement > 0) {
    body += ` You improved by ${(improvement / 1000).toFixed(2)}s!`;
  }

  // Add to in-app notifications
  addInAppNotification({
    type: "weekly-summary",
    title,
    body,
    url,
  });

  return sendDesktopNotification(title, {
    body,
    tag: "weekly-summary",
    requireInteraction: false,
    url,
    onClick: () => {
      window.location.href = url;
    },
  });
}

/**
 * Send goal progress update notification
 */
export function sendGoalProgressNotification(
  progressPercent: number,
  goalName: string,
) {
  const title = "Goal Progress Update";
  const body = `You're ${progressPercent.toFixed(0)}% towards your ${goalName} goal! Keep pushing!`;
  const url = "/cube-lab/coach?tab=progress";

  // Add to in-app notifications
  addInAppNotification({
    type: "goal-progress",
    title,
    body,
    url,
  });

  return sendDesktopNotification(title, {
    body,
    tag: "goal-progress",
    requireInteraction: false,
    url,
    onClick: () => {
      window.location.href = url;
    },
  });
}

/**
 * Get the stored coaching notification preferences
 */
export function getCoachingNotificationPreferences(): CoachingNotificationPreferences {
  const defaultPrefs: CoachingNotificationPreferences = {
    dailyPracticeReminder: true,
    dailyPracticeTime: "19:00",
    streakAlerts: true,
    weeklySummary: true,
    goalProgressUpdates: true,
  };

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...defaultPrefs,
        ...(parsed.coaching || {}),
      };
    }
  } catch {
    // Return defaults on error
  }
  return defaultPrefs;
}

/**
 * Update coaching notification preferences
 */
export function updateCoachingNotificationPreferences(
  updates: Partial<CoachingNotificationPreferences>,
) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const current = stored ? JSON.parse(stored) : {};
    const updated = {
      ...current,
      coaching: {
        ...getCoachingNotificationPreferences(),
        ...updates,
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated.coaching;
  } catch {
    return getCoachingNotificationPreferences();
  }
}

// ==================== IN-APP NOTIFICATIONS ====================

/**
 * Get stored in-app notifications
 */
export function getInAppNotifications(): InAppNotification[] {
  try {
    const stored = localStorage.getItem(IN_APP_NOTIFICATIONS_KEY);
    if (stored) {
      const notifications = JSON.parse(stored) as InAppNotification[];
      // Filter out old dismissed notifications (older than 7 days)
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return notifications.filter(
        (n) => !n.dismissed || n.timestamp > oneWeekAgo,
      );
    }
  } catch {
    // Return empty on error
  }
  return [];
}

/**
 * Add a new in-app notification
 */
export function addInAppNotification(
  notification: Omit<
    InAppNotification,
    "id" | "timestamp" | "read" | "dismissed"
  >,
): InAppNotification {
  const newNotification: InAppNotification = {
    ...notification,
    id: `${notification.type}-${Date.now()}`,
    timestamp: Date.now(),
    read: false,
    dismissed: false,
  };

  try {
    const notifications = getInAppNotifications();

    // Check for duplicate - don't add if same type exists within last hour
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const hasDuplicate = notifications.some(
      (n) =>
        n.type === notification.type &&
        n.timestamp > oneHourAgo &&
        !n.dismissed,
    );

    if (hasDuplicate) {
      // Return the existing notification instead
      return notifications.find(
        (n) => n.type === notification.type && n.timestamp > oneHourAgo,
      )!;
    }

    // Add new notification at the beginning
    const updated = [newNotification, ...notifications].slice(
      0,
      MAX_IN_APP_NOTIFICATIONS,
    );
    localStorage.setItem(IN_APP_NOTIFICATIONS_KEY, JSON.stringify(updated));

    // Dispatch custom event for real-time updates
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("cubedev-notification-added", {
          detail: newNotification,
        }),
      );
    }
  } catch (error) {
    console.error("Failed to add in-app notification:", error);
  }

  return newNotification;
}

/**
 * Mark notification as read
 */
export function markNotificationRead(notificationId: string): void {
  try {
    const notifications = getInAppNotifications();
    const updated = notifications.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n,
    );
    localStorage.setItem(IN_APP_NOTIFICATIONS_KEY, JSON.stringify(updated));

    // Dispatch custom event
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cubedev-notification-updated"));
    }
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
  }
}

/**
 * Dismiss notification
 */
export function dismissInAppNotification(notificationId: string): void {
  try {
    const notifications = getInAppNotifications();
    const updated = notifications.map((n) =>
      n.id === notificationId ? { ...n, dismissed: true } : n,
    );
    localStorage.setItem(IN_APP_NOTIFICATIONS_KEY, JSON.stringify(updated));

    // Dispatch custom event
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cubedev-notification-updated"));
    }
  } catch (error) {
    console.error("Failed to dismiss notification:", error);
  }
}

/**
 * Dismiss all in-app notifications
 */
export function dismissAllInAppNotifications(): void {
  try {
    const notifications = getInAppNotifications();
    const updated = notifications.map((n) => ({ ...n, dismissed: true }));
    localStorage.setItem(IN_APP_NOTIFICATIONS_KEY, JSON.stringify(updated));

    // Dispatch custom event
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cubedev-notification-updated"));
    }
  } catch (error) {
    console.error("Failed to dismiss all notifications:", error);
  }
}

/**
 * Get unread notification count
 */
export function getUnreadNotificationCount(): number {
  const notifications = getInAppNotifications();
  return notifications.filter((n) => !n.read && !n.dismissed).length;
}

/**
 * Hook for real-time in-app notification updates
 */
export function useInAppNotifications() {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);

  const refreshNotifications = useCallback(() => {
    setNotifications(getInAppNotifications().filter((n) => !n.dismissed));
  }, []);

  useEffect(() => {
    refreshNotifications();

    // Listen for notification updates
    const handleUpdate = () => refreshNotifications();
    window.addEventListener("cubedev-notification-added", handleUpdate);
    window.addEventListener("cubedev-notification-updated", handleUpdate);

    return () => {
      window.removeEventListener("cubedev-notification-added", handleUpdate);
      window.removeEventListener("cubedev-notification-updated", handleUpdate);
    };
  }, [refreshNotifications]);

  return {
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    refreshNotifications,
    markRead: markNotificationRead,
    dismiss: dismissInAppNotification,
    dismissAll: dismissAllInAppNotifications,
  };
}
