import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Get user's challenge statistics
export const getUserChallengeStats = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get user from database
    const user = await ctx.db.get(args.userId);

    if (!user) {
      return {
        roomsWon: 0,
        roomsParticipated: 0,
        roomsCreated: 0,
      };
    }

    // Get rooms created by user
    const roomsCreated = await ctx.db
      .query("challengeRooms")
      .filter((q) => q.eq(q.field("createdBy"), user._id))
      .collect();

    // Get user's participations
    const participations = await ctx.db
      .query("roomParticipants")
      .filter((q) => q.eq(q.field("userId"), user._id))
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