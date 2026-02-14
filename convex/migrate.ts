import { internalMutation } from "./_generated/server";

/**
 * Temporary migration: backfill email on existing user records from authAccounts.
 * Run once after deploying the schema change, then delete this file.
 */
export const backfillEmails = internalMutation({
  args: {},
  handler: async (ctx) => {
    const accounts = await ctx.db.query("authAccounts" as never).collect();
    let patched = 0;

    for (const account of accounts) {
      const acc = account as Record<string, unknown>;
      const userId = acc.userId as string | undefined;
      const email = (acc.providerAccountId ?? acc.email) as string | undefined;

      if (!userId || !email) continue;

      const user = await ctx.db.get(userId as never);
      if (!user) continue;

      const u = user as Record<string, unknown>;
      if (!u.email) {
        await ctx.db.patch(
          userId as never,
          {
            email,
            createdAt: u._creationTime as number,
          } as never,
        );
        patched++;
      }
    }

    return { patched, total: accounts.length };
  },
});
