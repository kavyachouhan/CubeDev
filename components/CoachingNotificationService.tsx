"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@/components/UserProvider";
import {
  useNotificationPermission,
  sendDailyPracticeReminderNotification,
  sendStreakAtRiskNotification,
  sendGoalProgressNotification,
} from "@/lib/notification-utils";

const CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
const DAILY_REMINDER_CHECK_INTERVAL = 60 * 1000; // Check every minute for time-based reminders
const STREAK_ALERT_HOUR = 20; // 8 PM - send streak alert if not practiced

// Storage keys for tracking last notification times
const LAST_STREAK_ALERT_KEY = "cubedev-last-streak-alert";
const LAST_GOAL_PROGRESS_KEY = "cubedev-last-goal-progress";
const LAST_DAILY_REMINDER_KEY = "cubedev-last-daily-reminder";

/**
 * Service component that monitors coaching stats and sends relevant notifications
 * This should be mounted once at the app level
 */
export default function CoachingNotificationService() {
  const { user } = useUser();
  const { preferences, isSupported } = useNotificationPermission();
  const previousProgressRef = useRef<number | null>(null);

  // Get coach profile
  const profile = useQuery(
    api.coach.getCoachProfile,
    user?.convexId ? { userId: user.convexId as any } : "skip",
  );

  // Get progress stats
  const progressStats = useQuery(
    api.coach.getProgressStats,
    user?.convexId ? { userId: user.convexId as any } : "skip",
  );

  // Check if today has a journal entry (indicates practice)
  const hasPracticedToday = useCallback(() => {
    if (!progressStats) return false;
    return progressStats.weekly.entries > 0 && progressStats.currentStreak > 0;
  }, [progressStats]);

  // Get today's date string for comparison
  const getTodayKey = () => {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  };

  // Check if we've already sent a notification today
  const hasNotifiedToday = (storageKey: string) => {
    const lastNotified = localStorage.getItem(storageKey);
    return lastNotified === getTodayKey();
  };

  // Mark notification as sent today
  const markNotifiedToday = (storageKey: string) => {
    localStorage.setItem(storageKey, getTodayKey());
  };

  // Check daily practice reminder
  useEffect(() => {
    if (!isSupported || !preferences.enabled) return;

    const coachingPrefs = preferences.coaching;
    if (!coachingPrefs?.dailyPracticeReminder) return;

    const checkDailyReminder = () => {
      if (hasNotifiedToday(LAST_DAILY_REMINDER_KEY)) return;

      const now = new Date();
      const targetTime = coachingPrefs.dailyPracticeTime || "19:00";
      const [targetHour, targetMinute] = targetTime.split(":").map(Number);
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Check if we're within the target time window (within 5 minutes)
      if (
        currentHour === targetHour &&
        currentMinute >= targetMinute &&
        currentMinute < targetMinute + 5
      ) {
        // Only send if user hasn't practiced today
        if (!hasPracticedToday()) {
          sendDailyPracticeReminderNotification();
          markNotifiedToday(LAST_DAILY_REMINDER_KEY);
        }
      }
    };

    checkDailyReminder();
    const interval = setInterval(
      checkDailyReminder,
      DAILY_REMINDER_CHECK_INTERVAL,
    );

    return () => clearInterval(interval);
  }, [preferences, isSupported, hasPracticedToday]);

  // Check streak alerts
  useEffect(() => {
    if (!isSupported || !preferences.enabled) return;

    const coachingPrefs = preferences.coaching;
    if (!coachingPrefs?.streakAlerts) return;
    if (!progressStats) return;

    const checkStreakAlert = () => {
      if (hasNotifiedToday(LAST_STREAK_ALERT_KEY)) return;

      const now = new Date();
      const currentHour = now.getHours();

      // Send streak alert at configured hour if user hasn't practiced
      if (currentHour >= STREAK_ALERT_HOUR && !hasPracticedToday()) {
        sendStreakAtRiskNotification(progressStats.currentStreak);
        markNotifiedToday(LAST_STREAK_ALERT_KEY);
      }
    };

    checkStreakAlert();
    const interval = setInterval(checkStreakAlert, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [preferences, isSupported, progressStats, hasPracticedToday]);

  // Check goal progress updates
  useEffect(() => {
    if (!isSupported || !preferences.enabled) return;

    const coachingPrefs = preferences.coaching;
    if (!coachingPrefs?.goalProgressUpdates) return;
    if (!profile || !progressStats) return;

    const checkGoalProgress = () => {
      // Only check once per day
      if (hasNotifiedToday(LAST_GOAL_PROGRESS_KEY)) return;

      // Calculate current progress percentage
      const targetTime =
        profile.customGoalTime || getGoalTime(profile.goalType) || 20000;
      const startingAverage = profile.currentAverage || targetTime * 1.5;
      const currentAverage = progressStats.monthly?.average || startingAverage;

      if (currentAverage <= targetTime) {
        // Goal achieved!
        return;
      }

      const totalImprovement = startingAverage - targetTime;
      const currentImprovement = startingAverage - currentAverage;
      const progressPercent = Math.min(
        100,
        Math.max(0, (currentImprovement / totalImprovement) * 100),
      );

      // Only notify at milestones (every 10%)
      const milestone = Math.floor(progressPercent / 10) * 10;
      const previousMilestone =
        previousProgressRef.current !== null
          ? Math.floor(previousProgressRef.current / 10) * 10
          : 0;

      if (milestone > previousMilestone && milestone > 0) {
        const goalName = profile.goalType.replace("-", " ").toUpperCase();
        sendGoalProgressNotification(progressPercent, goalName);
        markNotifiedToday(LAST_GOAL_PROGRESS_KEY);
      }

      previousProgressRef.current = progressPercent;
    };

    checkGoalProgress();
    const interval = setInterval(checkGoalProgress, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [preferences, isSupported, profile, progressStats]);

  // This component doesn't render anything
  return null;
}

// Helper to get goal time from goal type
function getGoalTime(goalType: string): number {
  const GOAL_TIMES: Record<string, number> = {
    "sub-60": 60000,
    "sub-45": 45000,
    "sub-30": 30000,
    "sub-20": 20000,
    "sub-15": 15000,
    "sub-12": 12000,
    "sub-10": 10000,
    "sub-8": 8000,
  };
  return GOAL_TIMES[goalType] || 20000;
}
