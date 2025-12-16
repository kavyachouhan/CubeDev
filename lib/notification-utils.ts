"use client";

import { useState, useEffect, useCallback } from "react";

export type NotificationPermission = "default" | "granted" | "denied";

export interface NotificationPreferences {
  enabled: boolean;
  permission: NotificationPermission;
  algorithmReminders: boolean;
  challengeInvites: boolean;
  showPrompt: boolean; // Whether to show the permission prompt
  pushEnabled: boolean; // Whether push notifications are enabled
}

const STORAGE_KEY = "cubedev-notification-preferences";
const SW_PATH = "/sw.js";

/**
 * Convert a base64 string to Uint8Array for VAPID key
 */
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

/**
 * Register the service worker
 */
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

/**
 * Get the current push subscription
 */
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

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(
  vapidPublicKey: string
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

/**
 * Unsubscribe from push notifications
 */
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

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Get device name from user agent
 */
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

/**
 * Hook to manage notification permissions and preferences
 */
export function useNotificationPermission() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: false,
    permission: "default",
    algorithmReminders: true,
    challengeInvites: true,
    showPrompt: true,
    pushEnabled: false,
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
    []
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
    []
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

/**
 * Send a desktop notification
 */
export function sendDesktopNotification(
  title: string,
  options?: NotificationOptions & { onClick?: () => void }
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
    const { onClick, ...notificationOptions } = options || {};

    const notification = new Notification(title, {
      icon: "/cubedev_logo.png",
      badge: "/cubedev_logo.png",
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

/**
 * Send notification for due algorithms
 */
export function sendAlgorithmDueNotification(count: number) {
  const title = `${count} Algorithm${count !== 1 ? "s" : ""} Due for Review`;
  const body =
    count === 1
      ? "You have 1 algorithm ready to practice!"
      : `You have ${count} algorithms ready to practice!`;

  return sendDesktopNotification(title, {
    body,
    tag: "algorithm-due",
    requireInteraction: false,
    onClick: () => {
      window.location.href = "/cube-lab/algorithm-trainer/practice";
    },
  });
}

/**
 * Check if we should show the permission prompt (first time user clicks bell)
 */
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