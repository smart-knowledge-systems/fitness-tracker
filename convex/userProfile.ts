import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    return profile;
  },
});

export const upsert = mutation({
  args: {
    sex: v.union(v.literal("male"), v.literal("female")),
    birthDate: v.number(),
    height: v.number(),
    weightUnit: v.optional(v.union(v.literal("kg"), v.literal("lbs"))),
    lengthUnit: v.optional(v.union(v.literal("cm"), v.literal("in"))),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      return await ctx.db.insert("userProfiles", {
        userId,
        ...args,
      });
    }
  },
});

export const updateUnitPreferences = mutation({
  args: {
    weightUnit: v.optional(v.union(v.literal("kg"), v.literal("lbs"))),
    lengthUnit: v.optional(v.union(v.literal("cm"), v.literal("in"))),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!existing) throw new Error("Profile not found");

    await ctx.db.patch(existing._id, args);
    return existing._id;
  },
});

export const updateTheme = mutation({
  args: {
    theme: v.union(v.literal("light"), v.literal("dark"), v.literal("system")),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!existing) throw new Error("Profile not found");

    await ctx.db.patch(existing._id, { theme: args.theme });
    return existing._id;
  },
});
