import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

const labelType = v.union(
  v.literal("new"),
  v.literal("updated"),
  v.literal("beta"),
  v.literal("coming-soon"),
);

export const getActiveLabels = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    return ctx.db
      .query("featureLabels")
      .filter((q) =>
        q.and(
          q.eq(q.field("enabled"), true),
          q.lte(q.field("startAt"), now),
          q.gte(q.field("endAt"), now),
        ),
      )
      .collect();
  },
});

export const getAllLabels = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("featureLabels").order("desc").collect();
  },
});

export const createLabel = mutation({
  args: {
    featureKey: v.string(),
    labelType,
    startAt: v.number(),
    endAt: v.number(),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (args.endAt <= args.startAt) {
      throw new Error("endAt must be after startAt");
    }

    const now = Date.now();
    return ctx.db.insert("featureLabels", {
      featureKey: args.featureKey,
      labelType: args.labelType,
      startAt: args.startAt,
      endAt: args.endAt,
      enabled: args.enabled,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateLabel = mutation({
  args: {
    id: v.id("featureLabels"),
    featureKey: v.string(),
    labelType,
    startAt: v.number(),
    endAt: v.number(),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (args.endAt <= args.startAt) {
      throw new Error("endAt must be after startAt");
    }

    await ctx.db.patch(args.id, {
      featureKey: args.featureKey,
      labelType: args.labelType,
      startAt: args.startAt,
      endAt: args.endAt,
      enabled: args.enabled,
      updatedAt: Date.now(),
    });
  },
});

export const deleteLabel = mutation({
  args: {
    id: v.id("featureLabels"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});