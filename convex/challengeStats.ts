import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getPublicProfileUser } from "./auth";

const EMPTY_CHALLENGE_STATS = {
  roomsWon: 0,
  roomsParticipated: 0,
  roomsCreated: 0,
};

// Get user's challenge statistics
export const getUserChallengeStats = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const readable = await getPublicProfileUser(ctx, args.userId);
    if (!readable || (!readable.isOwner && readable.user.hideChallengeStats)) {
      return EMPTY_CHALLENGE_STATS;
    }
    const user = readable.user;

    // Get rooms created by user
    const roomsCreated = await ctx.db
      .query("challengeRooms")
      .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
      .collect();

    // Get user's participations
    const participations = await ctx.db
      .query("roomParticipants")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Count rooms won (where user has finalRank = 1)
    const roomsWon = participations.filter(
      (participation) => participation.finalRank === 1
    ).length;

    // Count rooms participated (total participations)
    const roomsParticipated = participations.length;

    return {
      roomsWon,
      roomsParticipated,
      roomsCreated: roomsCreated.length,
    };
  },
});

// Update all user challenge stats (for cron job)
export const updateAllUserStats = internalMutation({
  args: {},
  handler: async (ctx) => {
    return { message: "Stats are calculated on-demand" };
  },
});