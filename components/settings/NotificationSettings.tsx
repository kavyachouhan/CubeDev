"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@/components/UserProvider";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import {
  useNotificationPermission,
  isPushSupported,
  registerServiceWorker,
  subscribeToPush,
  getCurrentPushSubscription,
  getDeviceName,
} from "@/lib/notification-utils";

export default function NotificationSettings() {
  const { user } = useUser();
  const { preferences, isSupported, requestPermission, updatePreferences } =
    useNotificationPermission();
  const [isEnabling, setIsEnabling] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convex mutations/queries
  const vapidPublicKey = useQuery(api.pushNotifications.getVapidPublicKey);
  const saveSubscription = useMutation(api.pushNotifications.saveSubscription);

  const pushSupported = isPushSupported();

  useEffect(() => {
    const checkSubscription = async () => {
      if (pushSupported) {
        const subscription = await getCurrentPushSubscription();
        setPushEnabled(!!subscription);
      }
    };
    checkSubscription();
  }, [pushSupported]);

  const handleEnableNotifications = async () => {
    setIsEnabling(true);
    setError(null);

    try {
      // First, request notification permission
      await requestPermission();

      // If granted, register service worker and subscribe to push
      if (pushSupported && user?.convexId && vapidPublicKey) {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          const registration = await registerServiceWorker();
          if (registration) {
            const subscription = await subscribeToPush(vapidPublicKey);
            if (subscription) {
              const keys = subscription.toJSON().keys;
              if (keys?.p256dh && keys?.auth) {
                await saveSubscription({
                  userId: user.convexId as any,
                  endpoint: subscription.endpoint,
                  keys: { p256dh: keys.p256dh, auth: keys.auth },
                  userAgent: navigator.userAgent,
                  deviceName: getDeviceName(),
                });
                setPushEnabled(true);
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.error("[Notifications] Enable failed:", err);
      setError("Failed to enable notifications. Please try again.");
    } finally {
      setIsEnabling(false);
    }
  };

  const handleToggleAlgorithmReminders = () => {
    updatePreferences({
      algorithmReminders: !preferences.algorithmReminders,
    });
  };

  const isGranted = preferences.permission === "granted";
  const isDenied = preferences.permission === "denied";
  const notificationsEnabled = isGranted || pushEnabled;

  return (
    <div className="timer-card">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <div className="flex-1">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-1 font-statement">
            Notifications
          </h2>
          <p className="text-sm text-[var(--text-muted)] font-inter">
            Manage your notification preferences
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Error Message */}
        {error && (
          <div className="p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[var(--error)] flex-shrink-0" />
            <span className="text-sm text-[var(--error)]">{error}</span>
          </div>
        )}

        {/* Enable Notifications Button */}
        {!notificationsEnabled && (
          <div className="timer-card bg-[var(--surface-elevated)] p-4 border border-[var(--border)]">
            {isDenied ? (
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-[var(--warning)]" />
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    Notifications Blocked
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Please enable notifications in your browser settings.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    Enable Notifications
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Get reminders when algorithms are due for review
                  </p>
                </div>
                <button
                  onClick={handleEnableNotifications}
                  disabled={isEnabling}
                  className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isEnabling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enabling...
                    </>
                  ) : (
                    "Enable"
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Notification Status */}
        {notificationsEnabled && (
          <div className="timer-card bg-[var(--surface-elevated)] p-4 border border-[var(--border)]">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
              <span className="text-sm font-medium text-[var(--text-primary)]">
                Notifications enabled
              </span>
            </div>

            {/* Notification Types */}
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex-1">
                  <div className="text-sm font-medium text-[var(--text-primary)] font-inter">
                    Algorithm Reminders
                  </div>
                  <div className="text-xs text-[var(--text-muted)] font-inter">
                    Get notified when algorithms are due for review
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleAlgorithmReminders}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences.algorithmReminders
                      ? "bg-[var(--primary)]"
                      : "bg-[var(--border)]"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences.algorithmReminders
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}