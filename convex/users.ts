import { mutation, query } from "./_generated/server";

/**
 * Get the current user from auth identity.
 * Returns null if not authenticated or no matching user record.
 */
export const me = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) return null;
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
  },
});

/**
 * Ensure a user record exists for the authenticated identity.
 * Creates the user on first sign-in; patches existing users with Shoo fields.
 */
export const ensureFromAuth = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const email = identity.email;
    if (!email) throw new Error("Identity missing email");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        subject: identity.subject ?? existing.subject,
        name: identity.name ?? existing.name,
        createdAt: existing.createdAt ?? existing._creationTime,
      });
      return existing;
    }

    const id = await ctx.db.insert("users", {
      email,
      name: identity.name ?? undefined,
      subject: identity.subject ?? undefined,
      createdAt: Date.now(),
    });
    return await ctx.db.get(id);
  },
});
