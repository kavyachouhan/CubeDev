import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run every hour to process expired challenge rooms
crons.interval(
  "process-expired-rooms",
  { minutes: 60 }, // Every hour
  internal.challengeRooms.processExpiredRooms
);

// Run every 6 hours to update user challenge stats
crons.interval(
  "update-user-challenge-stats",
  { hours: 6 },
  internal.challengeStats.updateAllUserStats
);

export default crons;