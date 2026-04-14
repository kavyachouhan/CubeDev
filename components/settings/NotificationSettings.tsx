"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@/components/UserProvider";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  GraduationCap,
  Flame,
  Target,
  Compass,
  BarChart3,
  Clock,
} from "lucide-react";
import {
  useNotificationPermission,
  isPushSupported,
  registerServiceWorker,
  subscribeToPush,
  getCurrentPushSubscription,
  getDeviceName,
  CoachingNotificationPreferences,
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
  const updateServerNotificationSettings = useMutation(
    api.users.updateNotificationSettings,
  );
  const persistedNotificationSettings = useQuery(
    api.users.getNotificationSettings,
    user?.convexId
      ? {
          userId: user.convexId as any,
        }
      : "skip",
  );

  const pushSupported = isPushSupported();
  const [hasHydratedServerSettings, setHasHydratedServerSettings] =
    useState(false);

  const defaultCoachingPrefs: CoachingNotificationPreferences = {
    dailyPracticeReminder: true,
    dailyPracticeTime: "19:00",
    streakAlerts: true,
    weeklySummary: true,
    goalProgressUpdates: true,
  };

  const getBrowserTimeZone = () => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  };

  const syncServerNotificationSettings = async (
    coaching: CoachingNotificationPreferences,
    algorithmReminders: boolean,
  ) => {
    if (!user?.convexId) return;

    try {
      await updateServerNotificationSettings({
        userId: user.convexId as any,
        algorithmReminders,
        coachingDailyPracticeReminder: coaching.dailyPracticeReminder,
        coachingDailyPracticeTime: coaching.dailyPracticeTime,
        coachingStreakAlerts: coaching.streakAlerts,
        coachingWeeklySummary: coaching.weeklySummary,
        coachingGoalProgressUpdates: coaching.goalProgressUpdates,
        notificationTimeZone: getBrowserTimeZone(),
      });
    } catch (error) {
      console.error("Failed to sync notification settings:", error);
    }
  };

  useEffect(() => {
    const checkSubscription = async () => {
      if (pushSupported) {
        const subscription = await getCurrentPushSubscription();
        setPushEnabled(!!subscription);
      }
    };
    checkSubscription();
  }, [pushSupported]);

  useEffect(() => {
    if (!persistedNotificationSettings || hasHydratedServerSettings) return;

    updatePreferences({
      algorithmReminders:
        persistedNotificationSettings.algorithmReminders ?? true,
      coaching: {
        ...defaultCoachingPrefs,
        ...persistedNotificationSettings.coaching,
      },
    });
    setHasHydratedServerSettings(true);
  }, [
    persistedNotificationSettings,
    hasHydratedServerSettings,
    updatePreferences,
  ]);

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
                await syncServerNotificationSettings(
                  preferences.coaching || defaultCoachingPrefs,
                  preferences.algorithmReminders,
                );
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

  const handleToggleAlgorithmReminders = async () => {
    const nextAlgorithmReminders = !preferences.algorithmReminders;
    updatePreferences({
      algorithmReminders: nextAlgorithmReminders,
    });

    await syncServerNotificationSettings(
      preferences.coaching || defaultCoachingPrefs,
      nextAlgorithmReminders,
    );
  };

  const handleToggleCoachingPreference = async (
    key: keyof CoachingNotificationPreferences,
  ) => {
    const currentCoaching = preferences.coaching || defaultCoachingPrefs;
    const nextCoaching = {
      ...currentCoaching,
      [key]: !currentCoaching[key],
    };

    updatePreferences({
      coaching: nextCoaching,
    });

    await syncServerNotificationSettings(
      nextCoaching,
      preferences.algorithmReminders,
    );
  };

  const handleUpdateReminderTime = async (time: string) => {
    const currentCoaching = preferences.coaching || defaultCoachingPrefs;
    const nextCoaching = {
      ...currentCoaching,
      dailyPracticeTime: time,
    };

    updatePreferences({
      coaching: nextCoaching,
    });

    await syncServerNotificationSettings(
      nextCoaching,
      preferences.algorithmReminders,
    );
  };

  const isGranted = preferences.permission === "granted";
  const isDenied = preferences.permission === "denied";
  const notificationsEnabled = isGranted || pushEnabled;

  const coachingPrefs = preferences.coaching || defaultCoachingPrefs;

  // Toggle component for consistent styling
  const Toggle = ({
    enabled,
    onToggle,
  }: {
    enabled: boolean;
    onToggle: () => void;
  }) => (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
        enabled ? "bg-(--primary)" : "bg-(--border)"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );

  return (
    <div className="timer-card">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <div className="flex-1">
          <h2 className="text-lg font-bold text-(--text-primary) mb-1 font-statement">
            Notifications
          </h2>
          <p className="text-sm text-(--text-muted) font-inter">
            Manage your notification preferences
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Error Message */}
        {error && (
          <div className="p-3 bg-(--error)/10 border border-(--error)/20 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-(--error) shrink-0" />
            <span className="text-sm text-(--error)">{error}</span>
          </div>
        )}

        {/* Enable Notifications Button */}
        {!notificationsEnabled && (
          <div className="p-4 bg-(--surface-elevated) border border-(--border) rounded-lg">
            {isDenied ? (
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-(--warning)" />
                <div>
                  <p className="text-sm font-medium text-(--text-primary)">
                    Notifications Blocked
                  </p>
                  <p className="text-xs text-(--text-muted)">
                    Please enable notifications in your browser settings.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-(--text-primary)">
                    Enable Notifications
                  </p>
                  <p className="text-xs text-(--text-muted)">
                    Get reminders for practice, algorithms, and progress
                  </p>
                </div>
                <button
                  onClick={handleEnableNotifications}
                  disabled={isEnabling}
                  className="px-4 py-2 bg-(--primary) text-white text-sm font-semibold rounded-lg hover:bg-(--primary-hover) transition-colors disabled:opacity-50 flex items-center gap-2"
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

        {/* Notification Status & Settings */}
        {notificationsEnabled && (
          <div className="space-y-4">
            {/* Status Badge */}
            <div className="flex items-center gap-2 p-3 bg-(--success)/10 border border-(--success)/20 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-(--success)" />
              <span className="text-sm font-medium text-(--text-primary)">
                Notifications enabled
              </span>
            </div>

            {/* Algorithm Trainer Section */}
            <div className="p-4 bg-(--surface-elevated) border border-(--border) rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-(--primary)/10 rounded">
                  <GraduationCap className="w-4 h-4 text-(--primary)" />
                </div>
                <span className="text-sm font-semibold text-(--text-primary)">
                  Algorithm Trainer
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="text-sm font-medium text-(--text-primary)">
                      Algorithm Reminders
                    </div>
                    <div className="text-xs text-(--text-muted)">
                      Get notified when algorithms are due for review
                    </div>
                  </div>
                  <Toggle
                    enabled={preferences.algorithmReminders}
                    onToggle={handleToggleAlgorithmReminders}
                  />
                </div>
              </div>
            </div>

            {/* Coaching Section */}
            <div className="p-4 bg-(--surface-elevated) border border-(--border) rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-(--accent)/10 rounded">
                  <Compass className="w-4 h-4 text-(--accent)" />
                </div>
                <span className="text-sm font-semibold text-(--text-primary)">
                  Coaching Reminders
                </span>
              </div>

              <div className="space-y-4">
                {/* Daily Practice Reminder */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-(--text-primary)">
                          Daily Practice Reminder
                        </span>
                      </div>
                      <div className="text-xs text-(--text-muted) mt-0.5">
                        Remind me to practice at a specific time
                      </div>
                    </div>
                    <Toggle
                      enabled={coachingPrefs.dailyPracticeReminder}
                      onToggle={() =>
                        handleToggleCoachingPreference("dailyPracticeReminder")
                      }
                    />
                  </div>

                  {/* Time Picker */}
                  {coachingPrefs.dailyPracticeReminder && (
                    <div className="flex items-center gap-2 ml-5">
                      <span className="text-xs text-(--text-muted)">
                        Reminder time:
                      </span>
                      <input
                        type="time"
                        value={coachingPrefs.dailyPracticeTime || "19:00"}
                        onChange={(e) =>
                          handleUpdateReminderTime(e.target.value)
                        }
                        className="px-2 py-1 text-sm bg-(--surface) border border-(--border) rounded-lg text-(--text-primary) focus:outline-none focus:ring-1 focus:ring-(--primary)"
                      />
                    </div>
                  )}
                </div>

                {/* Streak Alerts */}
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-(--text-primary)">
                        Streak Alerts
                      </span>
                    </div>
                    <div className="text-xs text-(--text-muted) mt-0.5">
                      Alert when your practice streak is at risk
                    </div>
                  </div>
                  <Toggle
                    enabled={coachingPrefs.streakAlerts}
                    onToggle={() =>
                      handleToggleCoachingPreference("streakAlerts")
                    }
                  />
                </div>

                {/* Weekly Summary */}
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-(--text-primary)">
                        Weekly Summary
                      </span>
                    </div>
                    <div className="text-xs text-(--text-muted) mt-0.5">
                      Get a weekly recap of your practice stats
                    </div>
                  </div>
                  <Toggle
                    enabled={coachingPrefs.weeklySummary}
                    onToggle={() =>
                      handleToggleCoachingPreference("weeklySummary")
                    }
                  />
                </div>

                {/* Goal Progress Updates */}
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-(--text-primary)">
                        Goal Progress Updates
                      </span>
                    </div>
                    <div className="text-xs text-(--text-muted) mt-0.5">
                      Get notified when you reach goal milestones
                    </div>
                  </div>
                  <Toggle
                    enabled={coachingPrefs.goalProgressUpdates}
                    onToggle={() =>
                      handleToggleCoachingPreference("goalProgressUpdates")
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
