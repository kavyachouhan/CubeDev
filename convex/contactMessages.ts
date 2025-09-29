import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Submit a contact form message
export const submitContactMessage = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    message: v.string(),
    wcaId: v.optional(v.string()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(args.email)) {
      throw new Error("Invalid email format");
    }

    // Validate message length
    if (args.message.length < 10) {
      throw new Error("Message must be at least 10 characters long");
    }

    if (args.message.length > 2000) {
      throw new Error("Message must be less than 2000 characters");
    }

    // Create the contact message
    const messageId = await ctx.db.insert("contactMessages", {
      name: args.name.trim(),
      email: args.email.toLowerCase().trim(),
      subject: args.subject.trim(),
      message: args.message.trim(),
      wcaId: args.wcaId?.trim(),
      userId: args.userId,
      createdAt: Date.now(),
      status: "new",
    });

    return { messageId };
  },
});

// Get all contact messages (admin only)
export const getContactMessages = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("contactMessages").order("desc");

    const messages = await query.collect();

    // Filter by status if provided
    let filteredMessages = messages;
    if (args.status) {
      filteredMessages = messages.filter((msg) => msg.status === args.status);
    }

    // Apply limit if provided
    if (args.limit) {
      filteredMessages = filteredMessages.slice(0, args.limit);
    }

    return filteredMessages;
  },
});

// Mark message as read (admin only)
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

// Update message status (admin only)
export const updateMessageStatus = mutation({
  args: {
    messageId: v.id("contactMessages"),
    status: v.union(
      v.literal("new"),
      v.literal("read"),
      v.literal("replied"),
      v.literal("resolved")
    ),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: any = { status: args.status };

    if (args.adminNotes) {
      updates.adminNotes = args.adminNotes;
    }

    await ctx.db.patch(args.messageId, updates);
  },
});
