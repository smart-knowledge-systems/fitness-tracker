import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";
import { getUserIdOrThrow } from "./helpers";
import { measurementFields, optionalMeasurementFields } from "./validators";

export const create = mutation({
  args: measurementFields,
  handler: async (ctx, args) => {
    const userId = await getUserIdOrThrow(ctx);

    return await ctx.db.insert("measurements", {
      userId,
      ...args,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("measurements"),
    ...optionalMeasurementFields,
  },
  handler: async (ctx, args) => {
    const userId = await getUserIdOrThrow(ctx);

    const { id, ...updates } = args;
    const measurement = await ctx.db.get(id);

    if (!measurement || measurement.userId !== userId) {
      throw new Error("Measurement not found");
    }

    await ctx.db.patch(id, updates);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("measurements") },
  handler: async (ctx, args) => {
    const userId = await getUserIdOrThrow(ctx);

    const measurement = await ctx.db.get(args.id);
    if (!measurement || measurement.userId !== userId) {
      throw new Error("Measurement not found");
    }

    await ctx.db.delete(args.id);
  },
});

export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const limit = args.limit ?? 50;

    const measurements = await ctx.db
      .query("measurements")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    return measurements;
  },
});

export const getLatest = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const measurement = await ctx.db
      .query("measurements")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .order("desc")
      .first();

    return measurement;
  },
});

export const getByDateRange = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const measurements = await ctx.db
      .query("measurements")
      .withIndex("by_user_date", (q) =>
        q
          .eq("userId", userId)
          .gte("date", args.startDate)
          .lte("date", args.endDate),
      )
      .order("asc")
      .take(1000);

    return measurements;
  },
});

export const getById = query({
  args: { id: v.id("measurements") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const measurement = await ctx.db.get(args.id);
    if (!measurement || measurement.userId !== userId) {
      return null;
    }

    return measurement;
  },
});
