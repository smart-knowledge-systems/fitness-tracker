import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/** Get the authenticated user's ID or throw. Use in mutations that require auth. */
export async function getUserIdOrThrow(
  ctx: QueryCtx | MutationCtx,
): Promise<Id<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", identity.email!))
    .unique();
  if (!user) throw new Error("User not found");
  return user._id;
}

/** Get the authenticated user's ID or null. Use in queries that return empty results for unauthenticated users. */
export async function getUserIdOrNull(
  ctx: QueryCtx,
): Promise<Id<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.email) return null;
  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", identity.email!))
    .unique();
  return user?._id ?? null;
}

/** Alias for queries that require auth (same behaviour as getUserIdOrThrow, clearer intent). */
export async function getQueryUserIdOrThrow(
  ctx: QueryCtx,
): Promise<Id<"users">> {
  return getUserIdOrThrow(ctx);
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
