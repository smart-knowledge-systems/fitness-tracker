import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  userProfiles: defineTable({
    userId: v.id("users"),
    sex: v.union(v.literal("male"), v.literal("female")),
    birthDate: v.number(), // timestamp for age calculations
    height: v.number(), // cm - baseline height
    race: v.optional(v.union(v.literal("caucasian"), v.literal("black"))), // for Evans body fat equations
    weightUnit: v.optional(v.union(v.literal("kg"), v.literal("lbs"))), // default: kg
    lengthUnit: v.optional(v.union(v.literal("cm"), v.literal("in"))), // default: cm
    theme: v.optional(
      v.union(v.literal("light"), v.literal("dark"), v.literal("system")),
    ), // default: system
  }).index("by_user", ["userId"]),

  measurements: defineTable({
    userId: v.id("users"),
    date: v.number(), // timestamp

    // Core metrics
    weight: v.optional(v.number()), // kg
    waistCirc: v.optional(v.number()), // cm
    neckCirc: v.optional(v.number()), // cm
    hipCirc: v.optional(v.number()), // cm - for female Navy formula
    height: v.optional(v.number()), // cm - override if different from profile

    // 8 Skinfold sites (mm)
    skinfoldChest: v.optional(v.number()),
    skinfoldAxilla: v.optional(v.number()),
    skinfoldTricep: v.optional(v.number()),
    skinfoldSubscapular: v.optional(v.number()),
    skinfoldAbdominal: v.optional(v.number()),
    skinfoldSuprailiac: v.optional(v.number()),
    skinfoldThigh: v.optional(v.number()),
    skinfoldBicep: v.optional(v.number()),

    // Muscle circumferences (cm)
    upperArmCirc: v.optional(v.number()),
    lowerArmCirc: v.optional(v.number()),
    thighCirc: v.optional(v.number()),
    calfCirc: v.optional(v.number()),
    chestCirc: v.optional(v.number()),
    shoulderCirc: v.optional(v.number()),

    // Performance metrics
    time5k: v.optional(v.number()), // seconds
    time1k: v.optional(v.number()), // seconds
    lMinO2: v.optional(v.number()), // L/min oxygen
    sKmAt129Bpm: v.optional(v.number()), // pace at 129 bpm
    vo2max: v.optional(v.number()), // mL/kg/min
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"]),

  goals: defineTable({
    userId: v.id("users"),
    metric: v.string(), // "weight", "bodyFat", "vo2max", etc.
    targetValue: v.number(),
    targetDate: v.optional(v.number()),
    direction: v.union(v.literal("increase"), v.literal("decrease")),
    startValue: v.optional(v.number()), // Value when goal was created
    createdAt: v.number(),
    completed: v.boolean(),
    isVisibleOnChart: v.optional(v.boolean()), // defaults to true when undefined
  }).index("by_user", ["userId"]),
});
