import { v } from "convex/values";

/**
 * Measurement field names (excluding `date`) — the single source of truth.
 * Add new measurement fields here and they automatically appear in
 * `measurementFields`, `optionalMeasurementFields`, and the schema.
 */
const OPTIONAL_NUMBER_FIELDS = [
  "weight",
  "waistCirc",
  "neckCirc",
  "hipCirc",
  "height",
  "skinfoldChest",
  "skinfoldAxilla",
  "skinfoldTricep",
  "skinfoldSubscapular",
  "skinfoldAbdominal",
  "skinfoldSuprailiac",
  "skinfoldThigh",
  "skinfoldBicep",
  "upperArmCirc",
  "lowerArmCirc",
  "thighCirc",
  "calfCirc",
  "chestCirc",
  "shoulderCirc",
  "time5k",
  "time1k",
  "lMinO2",
  "sKmAt129Bpm",
  "vo2max",
] as const;

function buildOptionalNumberFields<T extends readonly string[]>(fields: T) {
  const result = {} as {
    [K in T[number]]: ReturnType<
      typeof v.optional<ReturnType<typeof v.number>>
    >;
  };
  for (const field of fields) {
    (
      result as Record<
        string,
        ReturnType<typeof v.optional<ReturnType<typeof v.number>>>
      >
    )[field] = v.optional(v.number());
  }
  return result;
}

/** Shared measurement field validators — single source of truth for measurements.ts, import.ts, and schema.ts */
export const measurementFields = {
  date: v.number(),
  ...buildOptionalNumberFields(OPTIONAL_NUMBER_FIELDS),
};

/** Optional version of all measurement fields (for update mutations) — derived from the same field list. */
export const optionalMeasurementFields = {
  date: v.optional(v.number()),
  ...buildOptionalNumberFields(OPTIONAL_NUMBER_FIELDS),
};
