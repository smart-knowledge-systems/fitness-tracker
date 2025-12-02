import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const create = mutation({
  args: {
    date: v.number(),
    weight: v.optional(v.number()),
    waistCirc: v.optional(v.number()),
    neckCirc: v.optional(v.number()),
    hipCirc: v.optional(v.number()),
    height: v.optional(v.number()),
    skinfoldChest: v.optional(v.number()),
    skinfoldAxilla: v.optional(v.number()),
    skinfoldTricep: v.optional(v.number()),
    skinfoldSubscapular: v.optional(v.number()),
    skinfoldAbdominal: v.optional(v.number()),
    skinfoldSuprailiac: v.optional(v.number()),
    skinfoldThigh: v.optional(v.number()),
    skinfoldBicep: v.optional(v.number()),
    upperArmCirc: v.optional(v.number()),
    lowerArmCirc: v.optional(v.number()),
    thighCirc: v.optional(v.number()),
    calfCirc: v.optional(v.number()),
    chestCirc: v.optional(v.number()),
    shoulderCirc: v.optional(v.number()),
    time5k: v.optional(v.number()),
    time1k: v.optional(v.number()),
    lMinO2: v.optional(v.number()),
    sKmAt129Bpm: v.optional(v.number()),
    vo2max: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("measurements", {
      userId,
      ...args,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("measurements"),
    date: v.optional(v.number()),
    weight: v.optional(v.number()),
    waistCirc: v.optional(v.number()),
    neckCirc: v.optional(v.number()),
    hipCirc: v.optional(v.number()),
    height: v.optional(v.number()),
    skinfoldChest: v.optional(v.number()),
    skinfoldAxilla: v.optional(v.number()),
    skinfoldTricep: v.optional(v.number()),
    skinfoldSubscapular: v.optional(v.number()),
    skinfoldAbdominal: v.optional(v.number()),
    skinfoldSuprailiac: v.optional(v.number()),
    skinfoldThigh: v.optional(v.number()),
    skinfoldBicep: v.optional(v.number()),
    upperArmCirc: v.optional(v.number()),
    lowerArmCirc: v.optional(v.number()),
    thighCirc: v.optional(v.number()),
    calfCirc: v.optional(v.number()),
    chestCirc: v.optional(v.number()),
    shoulderCirc: v.optional(v.number()),
    time5k: v.optional(v.number()),
    time1k: v.optional(v.number()),
    lMinO2: v.optional(v.number()),
    sKmAt129Bpm: v.optional(v.number()),
    vo2max: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

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
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

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
      .collect();

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
