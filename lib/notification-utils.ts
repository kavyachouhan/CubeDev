"use client";

import { useState, useEffect } from "react";

export type NotificationPermission = "default" | "granted" | "denied";

export interface NotificationPreferences {
  enabled: boolean;
  permission: NotificationPermission;
  algorithmReminders: boolean;
  challengeInvites: boolean;
  showPrompt: boolean; // Whether to show the permission prompt
}

const STORAGE_KEY = "cubedev-notification-preferences";

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
  });

  const [isSupported, setIsSupported] = useState(false);

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
  }, []);

  const savePreferences = (newPreferences: NotificationPreferences) => {
    setPreferences(newPreferences);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
  };

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

  const updatePreferences = (updates: Partial<NotificationPreferences>) => {
    const newPreferences = {
      ...preferences,
      ...updates,
      // Auto-sync enabled state based on permission and algorithmReminders
      enabled:
        preferences.permission === "granted" &&
        (updates.algorithmReminders ?? preferences.algorithmReminders),
    };
    savePreferences(newPreferences);
  };

  const dismissPrompt = () => {
    updatePreferences({ showPrompt: false });
  };

  return {
    preferences,
    isSupported,
    requestPermission,
    updatePreferences,
    dismissPrompt,
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
      icon: "/cube-icons/cube-logo.png",
      badge: "/cube-icons/cube-logo.png",
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
