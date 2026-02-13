import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { auth } from "./auth";

/** Get the authenticated user's ID or throw. Use in mutations that require auth. */
export async function getUserIdOrThrow(
  ctx: QueryCtx | MutationCtx,
): Promise<Id<"users">> {
  const userId = await auth.getUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

/** Get the authenticated user's ID or throw. Alias for queries that require auth (same behaviour, clearer intent). */
export async function getQueryUserIdOrThrow(
  ctx: QueryCtx,
): Promise<Id<"users">> {
  const userId = await auth.getUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

/** Look up the current user's profile or throw. Eliminates duplicate profile-lookup boilerplate in mutations. */
export async function getUserProfileOrThrow(ctx: MutationCtx) {
  const userId = await getUserIdOrThrow(ctx);

  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();

  if (!profile) throw new Error("Profile not found");
  return { userId, profile };
}
