import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { auth } from "./auth";

const measurementFields = v.object({
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
});

export const importMeasurements = mutation({
  args: {
    measurements: v.array(measurementFields),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const ids = [];

    for (const measurement of args.measurements) {
      const id = await ctx.db.insert("measurements", {
        userId,
        ...measurement,
      });
      ids.push(id);
    }

    return { imported: ids.length, ids };
  },
});
