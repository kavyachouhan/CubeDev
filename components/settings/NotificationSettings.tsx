"use client";

import { Bell, BellOff, CheckCircle2, AlertCircle } from "lucide-react";
import { useNotificationPermission } from "@/lib/notification-utils";
import { useState } from "react";

export default function NotificationSettings() {
  const { preferences, isSupported, requestPermission, updatePreferences } =
    useNotificationPermission();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleEnableNotifications = async () => {
    setIsRequesting(true);
    await requestPermission();
    setIsRequesting(false);
  };

  const handleToggleAlgorithmReminders = () => {
    updatePreferences({
      algorithmReminders: !preferences.algorithmReminders,
    });
  };

  const handleToggleChallengeInvites = () => {
    updatePreferences({
      challengeInvites: !preferences.challengeInvites,
    });
  };

  const handleTestNotification = () => {
    if (preferences.permission === "granted") {
      const notification = new Notification("Test Notification from CubeDev", {
        body: "Your notifications are working perfectly! 🎉",
        icon: "/cube-icons/cube-logo.png",
        tag: "test-notification",
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  };

  if (!isSupported) {
    return (
      <div className="timer-card">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 bg-[var(--surface-elevated)] rounded-full flex items-center justify-center">
            <BellOff className="w-5 h-5 text-[var(--text-muted)]" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-1 font-statement">
              Notifications
            </h2>
            <p className="text-sm text-[var(--text-muted)] font-inter">
              Manage your notification preferences
            </p>
          </div>
        </div>

        <div className="timer-card bg-[var(--surface-elevated)] p-4 border border-[var(--border)]">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-[var(--warning)]" />
            <p className="text-sm text-[var(--text-secondary)] font-inter">
              Your browser doesn't support desktop notifications.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isGranted = preferences.permission === "granted";
  const isDenied = preferences.permission === "denied";

  return (
    <div className="timer-card">
      <div className="flex items-start gap-3 mb-4">
        {!isGranted && (
          <div className="flex-shrink-0 w-10 h-10 bg-[var(--surface-elevated)] rounded-full flex items-center justify-center">
            <Bell className="w-5 h-5 text-[var(--primary)]" />
          </div>
        )}
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
        {/* Permission Status - Only show if not granted */}
        {!isGranted && (
          <div className="timer-card bg-[var(--surface-elevated)] p-4 border border-[var(--border)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--text-primary)] font-inter">
                  Desktop Notifications
                </span>
                {isDenied && (
                  <span className="flex items-center gap-1 text-xs text-[var(--error)] font-inter">
                    <AlertCircle className="w-3 h-3" />
                    Blocked
                  </span>
                )}
              </div>
              {!isDenied && (
                <button
                  onClick={handleEnableNotifications}
                  disabled={isRequesting}
                  className="px-3 py-1.5 bg-[var(--primary)] text-white text-xs font-semibold rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 font-inter"
                >
                  {isRequesting ? "Requesting..." : "Enable"}
                </button>
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)] font-inter">
              {isDenied
                ? "Notifications are blocked. Please enable them in your browser settings."
                : "Get notified when algorithms are due for review, even when you're not on CubeDev."}
            </p>
          </div>
        )}

        {/* Notification Types */}
        {isGranted && (
          <div className="timer-card bg-[var(--surface-elevated)] p-4 border border-[var(--border)]">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 font-statement">
              Notification Types
            </h3>
            <div className="space-y-3">
              {/* Algorithm Reminders */}
              <label className="flex items-center justify-between cursor-pointer group">
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
