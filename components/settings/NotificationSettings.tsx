"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@/components/UserProvider";
import { Bell, Compass, GraduationCap } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { SettingRow } from "@/components/ui/SettingRow";
import { SettingGroup } from "@/components/ui/SettingGroup";
import { SwitchRow } from "@/components/ui/Switch";
import {
  useNotificationPermission,
  isPushSupported,
  registerServiceWorker,
  subscribeToPush,
  getCurrentPushSubscription,
  getDeviceName,
  CoachingNotificationPreferences,
} from "@/lib/notification-utils";
import {
  DateTimePicker,
  fromTimeInputValue,
  toTimeInputValue,
} from "@/components/ui/DateTimePicker";

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

  return (
    <Card variant="static">
      <CardHeader
        as="h2"
        title="Notifications"
        description="Manage your notification preferences"
      />

      <div className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}

        {!notificationsEnabled &&
          (isDenied ? (
            <Alert tone="warning" title="Notifications blocked">
              Please enable notifications in your browser settings.
            </Alert>
          ) : (
            <SettingRow
              variant="card"
              icon={<Bell />}
              label="Enable Notifications"
              description="Get reminders for practice, algorithms, and progress"
              control={
                <Button
                  size="sm"
                  onClick={handleEnableNotifications}
                  loading={isEnabling}
                  loadingText="Enabling…"
                >
                  Enable
                </Button>
              }
            />
          ))}

        {notificationsEnabled && (
          <div className="space-y-4">
            <Alert tone="success">Notifications enabled</Alert>

            <SettingGroup title="Algorithm Trainer" icon={<GraduationCap />}>
              <SwitchRow
                variant="plain"
                label="Algorithm Reminders"
                description="Get notified when algorithms are due for review"
                checked={preferences.algorithmReminders}
                onChange={() => handleToggleAlgorithmReminders()}
              />
            </SettingGroup>

            <SettingGroup
              title="Coaching Reminders"
              icon={<Compass />}
              tone="accent"
            >
              <div className="divide-y divide-(--border)">
                <SwitchRow
                  variant="plain"
                  className="py-3"
                  label="Daily Practice Reminder"
                  description="Remind me to practice at a specific time"
                  checked={coachingPrefs.dailyPracticeReminder}
                  onChange={() => handleToggleCoachingPreference("dailyPracticeReminder")}
                >
                  {coachingPrefs.dailyPracticeReminder && (
                    <Field label="Reminder time">
                      <DateTimePicker
                        mode="time"
                        size="sm"
                        fullWidth={false}
                        clearable={false}
                        minuteStep={15}
                        label="Reminder time"
                        value={fromTimeInputValue(
                          coachingPrefs.dailyPracticeTime || "19:00",
                        )}
                        onChange={(value) =>
                          handleUpdateReminderTime(toTimeInputValue(value))
                        }
                        className="w-36"
                      />
                    </Field>
                  )}
                </SwitchRow>
                <SwitchRow
                  variant="plain"
                  className="py-3"
                  label="Streak Alerts"
                  description="Alert when your practice streak is at risk"
                  checked={coachingPrefs.streakAlerts}
                  onChange={() => handleToggleCoachingPreference("streakAlerts")}
                />
                <SwitchRow
                  variant="plain"
                  className="py-3"
                  label="Weekly Summary"
                  description="Get a weekly recap of your practice stats"
                  checked={coachingPrefs.weeklySummary}
                  onChange={() => handleToggleCoachingPreference("weeklySummary")}
                />
                <SwitchRow
                  variant="plain"
                  className="py-3"
                  label="Goal Progress Updates"
                  description="Get notified when you reach goal milestones"
                  checked={coachingPrefs.goalProgressUpdates}
                  onChange={() => handleToggleCoachingPreference("goalProgressUpdates")}
                />
              </div>
            </SettingGroup>
          </div>
        )}
      </div>
    </Card>
  );
}
