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
