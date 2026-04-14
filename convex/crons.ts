import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run every hour to process expired challenge rooms
crons.interval(
  "process-expired-rooms",
  { minutes: 60 }, // Every hour
  internal.challengeRooms.processExpiredRooms,
);

// Run every 6 hours to update user challenge stats
crons.interval(
  "update-user-challenge-stats",
  { hours: 6 },
  internal.challengeStats.updateAllUserStats,
);

// Run every 4 hours to send push notifications for due algorithms
crons.interval(
  "send-due-algorithm-push-notifications",
  { hours: 4 },
  internal.pushNodeActions.sendDueAlgorithmNotifications,
);

// Run every 5 minutes to send practice reminder notifications based on user preferences and local time.
crons.interval(
  "send-daily-practice-reminder-notifications",
  { minutes: 5 },
  internal.pushNodeActions.sendDailyPracticeReminderNotifications,
);

// Run every 15 minutes to send streak alert notifications for users at risk of breaking their streaks.
crons.interval(
  "send-streak-alert-notifications",
  { minutes: 15 },
  internal.pushNodeActions.sendStreakAlertNotifications,
);

// Run every hour to send goal progress notifications based on user-defined goals and recent activity.
crons.interval(
  "send-goal-progress-notifications",
  { hours: 1 },
  internal.pushNodeActions.sendGoalProgressNotifications,
);

// Run every hour and dispatch weekly coaching summaries in each user's local Sunday 10 AM window.
crons.interval(
  "send-weekly-coach-summary-notifications",
  { hours: 1 },
  internal.pushNodeActions.sendWeeklyCoachSummaryNotifications,
);

export default crons;
