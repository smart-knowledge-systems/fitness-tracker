import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getUserIdOrThrow } from "./helpers";
import { measurementFields } from "./validators";

export const importMeasurements = mutation({
  args: {
    measurements: v.array(v.object(measurementFields)),
  },
  handler: async (ctx, args) => {
    const userId = await getUserIdOrThrow(ctx);

    if (args.measurements.length > 1000) {
      throw new Error("Cannot import more than 1000 measurements at once");
    }

    const ids = await Promise.all(
      args.measurements.map((measurement) =>
        ctx.db.insert("measurements", {
          userId,
          ...measurement,
        }),
      ),
    );

    return { imported: ids.length, ids };
  },
});
