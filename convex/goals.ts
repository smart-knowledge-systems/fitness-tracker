import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const create = mutation({
  args: {
    metric: v.string(),
    targetValue: v.number(),
    targetDate: v.optional(v.number()),
    direction: v.union(v.literal("increase"), v.literal("decrease")),
    startValue: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("goals", {
      userId,
      metric: args.metric,
      targetValue: args.targetValue,
      targetDate: args.targetDate,
      direction: args.direction,
      startValue: args.startValue,
      createdAt: Date.now(),
      completed: false,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("goals"),
    metric: v.optional(v.string()),
    targetValue: v.optional(v.number()),
    targetDate: v.optional(v.number()),
    direction: v.optional(
      v.union(v.literal("increase"), v.literal("decrease")),
    ),
    startValue: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...updates } = args;
    const goal = await ctx.db.get(id);

    if (!goal || goal.userId !== userId) {
      throw new Error("Goal not found");
    }

    await ctx.db.patch(id, updates);
    return id;
  },
});

export const complete = mutation({
  args: { id: v.id("goals") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const goal = await ctx.db.get(args.id);
    if (!goal || goal.userId !== userId) {
      throw new Error("Goal not found");
    }

    await ctx.db.patch(args.id, { completed: true });
  },
});

export const setChartVisibility = mutation({
  args: { id: v.id("goals"), isVisible: v.boolean() },
  handler: async (ctx, { id, isVisible }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const goal = await ctx.db.get(id);
    if (!goal || goal.userId !== userId) {
      throw new Error("Goal not found");
    }

    await ctx.db.patch(id, { isVisibleOnChart: isVisible });
  },
});

export const remove = mutation({
  args: { id: v.id("goals") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const goal = await ctx.db.get(args.id);
    if (!goal || goal.userId !== userId) {
      throw new Error("Goal not found");
    }

    await ctx.db.delete(args.id);
  },
});

export const list = query({
  args: {
    includeCompleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const goals = await ctx.db
      .query("goals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (args.includeCompleted) {
      return goals;
    }

    return goals.filter((g) => !g.completed);
  },
});
