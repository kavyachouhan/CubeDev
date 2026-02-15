import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Admin queries and mutations for managing contact messages
export const getContactMessagesWithAnalytics = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("contactMessages")
      .order("desc")
      .collect();

    // Filter by status if provided
    let filteredMessages = messages;
    if (args.status && args.status !== "all") {
      filteredMessages = messages.filter((msg) => msg.status === args.status);
    }

    // Apply limit if provided
    if (args.limit) {
      filteredMessages = filteredMessages.slice(0, args.limit);
    }

    // Calculate analytics
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const oneWeekMs = 7 * oneDayMs;
    const oneMonthMs = 30 * oneDayMs;

    // Status breakdown
    const statusCounts = {
      all: messages.length,
      new: messages.filter((m) => m.status === "new").length,
      read: messages.filter((m) => m.status === "read").length,
      replied: messages.filter((m) => m.status === "replied").length,
      resolved: messages.filter((m) => m.status === "resolved").length,
    };

    // Time-based analytics
    const lastDay = messages.filter((m) => now - m.createdAt < oneDayMs).length;
    const lastWeek = messages.filter(
      (m) => now - m.createdAt < oneWeekMs,
    ).length;
    const lastMonth = messages.filter(
      (m) => now - m.createdAt < oneMonthMs,
    ).length;

    // Weekly trend (this week vs last week)
    const messagesThisWeek = messages.filter(
      (m) => now - m.createdAt < oneWeekMs,
    ).length;
    const messagesLastWeek = messages.filter(
      (m) =>
        now - m.createdAt >= oneWeekMs && now - m.createdAt < 2 * oneWeekMs,
    ).length;
    const weeklyTrend =
      messagesLastWeek > 0
        ? Math.round(
            ((messagesThisWeek - messagesLastWeek) / messagesLastWeek) * 100,
          )
        : messagesThisWeek > 0
          ? 100
          : 0;

    // Response rate (replied / non-new)
    const totalHandled = statusCounts.replied + statusCounts.resolved;
    const totalNonNew = messages.length - statusCounts.new;
    const responseRate =
      totalNonNew > 0 ? Math.round((totalHandled / totalNonNew) * 100) : 0;

    // Average response time (for replied messages)
    const avgResponseTimeHours = null;

    // Subject category breakdown
    const subjectCategories: Record<string, number> = {};
    messages.forEach((m) => {
      const subject = m.subject.toLowerCase();
      if (
        subject.includes("bug") ||
        subject.includes("issue") ||
        subject.includes("error")
      ) {
        subjectCategories["Bug Reports"] =
          (subjectCategories["Bug Reports"] || 0) + 1;
      } else if (
        subject.includes("feature") ||
        subject.includes("request") ||
        subject.includes("suggestion")
      ) {
        subjectCategories["Feature Requests"] =
          (subjectCategories["Feature Requests"] || 0) + 1;
      } else if (
        subject.includes("help") ||
        subject.includes("question") ||
        subject.includes("how")
      ) {
        subjectCategories["Questions"] =
          (subjectCategories["Questions"] || 0) + 1;
      } else if (subject.includes("feedback") || subject.includes("review")) {
        subjectCategories["Feedback"] =
          (subjectCategories["Feedback"] || 0) + 1;
      } else {
        subjectCategories["Other"] = (subjectCategories["Other"] || 0) + 1;
      }
    });

    // User breakdown
    const registeredUsers = messages.filter((m) => m.userId).length;
    const anonymousUsers = messages.length - registeredUsers;

    // Sender stats
    const uniqueEmails = new Set(messages.map((m) => m.email)).size;
    const repeatSenders = messages.length - uniqueEmails;

    // Daily message trend (last 14 days)
    const dailyTrend: Array<{ date: string; count: number }> = [];
    for (let i = 13; i >= 0; i--) {
      const dayStart = now - (i + 1) * oneDayMs;
      const dayEnd = now - i * oneDayMs;
      const count = messages.filter(
        (m) => m.createdAt >= dayStart && m.createdAt < dayEnd,
      ).length;
      const date = new Date(dayEnd);
      dailyTrend.push({
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        count,
      });
    }

    // Weekly message trend (last 8 weeks)
    const weeklyTrendData: Array<{ week: string; count: number }> = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = now - (i + 1) * oneWeekMs;
      const weekEnd = now - i * oneWeekMs;
      const count = messages.filter(
        (m) => m.createdAt >= weekStart && m.createdAt < weekEnd,
      ).length;
      weeklyTrendData.push({
        week: `Week ${8 - i}`,
        count,
      });
    }

    // Hour of day distribution
    const hourDistribution: Record<number, number> = {};
    messages.forEach((m) => {
      const hour = new Date(m.createdAt).getHours();
      hourDistribution[hour] = (hourDistribution[hour] || 0) + 1;
    });

    // Day of week distribution
    const dayOfWeekDistribution: Record<string, number> = {
      Sun: 0,
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
    };
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    messages.forEach((m) => {
      const day = dayNames[new Date(m.createdAt).getDay()];
      dayOfWeekDistribution[day] = (dayOfWeekDistribution[day] || 0) + 1;
    });

    // Enhance messages with user avatar if available
    const enhancedMessages = await Promise.all(
      filteredMessages.map(async (msg) => {
        let userAvatar: string | null = null;
        if (msg.userId) {
          const user = await ctx.db.get(msg.userId);
          if (user?.avatar) {
            userAvatar = user.avatar;
          }
        }
        return {
          ...msg,
          userAvatar,
        };
      }),
    );

    return {
      messages: enhancedMessages,
      analytics: {
        statusCounts,
        timeBasedCounts: {
          lastDay,
          lastWeek,
          lastMonth,
          weekly: weeklyTrend,
        },
        responseRate,
        avgResponseTimeHours,
        subjectCategories,
        userBreakdown: {
          registered: registeredUsers,
          anonymous: anonymousUsers,
        },
        senderStats: {
          unique: uniqueEmails,
          repeat: repeatSenders,
        },
        dailyTrend,
        weeklyTrendData,
        hourDistribution,
        dayOfWeekDistribution,
      },
    };
  },
});

// Mark message as read
export const markMessageAsRead = mutation({
  args: {
    messageId: v.id("contactMessages"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      status: "read",
      isRead: true,
    });
  },
});

// Update message status with optional admin notes
export const updateMessageStatus = mutation({
  args: {
    messageId: v.id("contactMessages"),
    status: v.union(
      v.literal("new"),
      v.literal("read"),
      v.literal("replied"),
      v.literal("resolved"),
    ),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = { status: args.status };

    if (args.adminNotes !== undefined) {
      updates.adminNotes = args.adminNotes;
    }

    if (args.status === "read") {
      updates.isRead = true;
    }

    await ctx.db.patch(args.messageId, updates);
  },
});

// Record that a reply was sent (for analytics)
export const recordReplySent = mutation({
  args: {
    messageId: v.id("contactMessages"),
    replyMessage: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      status: "replied",
      adminNotes: `Reply sent: ${args.replyMessage.substring(0, 200)}...`,
    });
  },
});

// Get message details
export const getMessageDetails = query({
  args: {
    messageId: v.id("contactMessages"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) return null;

    // Get user info if userId exists
    let userInfo = null;
    if (message.userId) {
      const user = await ctx.db.get(message.userId);
      if (user) {
        userInfo = {
          name: user.name,
          wcaId: user.wcaId,
          avatar: user.avatar,
          countryIso2: user.countryIso2,
          createdAt: user.createdAt,
        };
      }
    }

    // Get previous messages from the same email (excluding current message)
    const previousMessages = await ctx.db
      .query("contactMessages")
      .withIndex("by_email", (q) => q.eq("email", message.email))
      .order("desc")
      .collect();

    return {
      message,
      userInfo,
      previousMessages: previousMessages.filter((m) => m._id !== message._id),
    };
  },
});

// Archive message (mark as resolved with archived note)
export const archiveMessage = mutation({
  args: {
    messageId: v.id("contactMessages"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      status: "resolved",
      adminNotes: "[ARCHIVED]",
    });
  },
});