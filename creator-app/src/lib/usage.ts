import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { User } from "./auth";
import { creditLimit, FOUNDER_FREE_USES, founderFree } from "./plans";

export function monthKey(d = new Date()): string {
  return d.toISOString().slice(0, 7);
}

/** Where a reserved answer was paid from, so a refund goes back to the same place. */
export type Pool = "credits" | "founder";

export async function usageThisMonth(userId: string): Promise<{ credits: number; founderUses: number }> {
  const [row] = await (await db())
    .select({ credits: schema.usage.credits, founderUses: schema.usage.founderUses })
    .from(schema.usage)
    .where(and(eq(schema.usage.userId, userId), eq(schema.usage.month, monthKey())));
  return { credits: row?.credits ?? 0, founderUses: row?.founderUses ?? 0 };
}

export async function creditsUsed(userId: string): Promise<number> {
  return (await usageThisMonth(userId)).credits;
}

/**
 * Atomically pays for one answer. Founding creators use their Founder Pass first for the features it covers;
 * when the month's free uses run out (or for other features) it takes `amount` credits if the user stays within
 * their monthly limit. Returns the pool it used, or null when the user can't afford it.
 */
export async function reserveCredit(user: User, amount = 1, feature?: string): Promise<Pool | null> {
  const d = await db();
  if (user.founderNumber != null && feature && founderFree(feature)) {
    const rows = await d
      .insert(schema.usage)
      .values({ userId: user.id, month: monthKey(), credits: 0, founderUses: 1 })
      .onConflictDoUpdate({
        target: [schema.usage.userId, schema.usage.month],
        set: { founderUses: sql`${schema.usage.founderUses} + 1` },
        setWhere: sql`${schema.usage.founderUses} + 1 <= ${FOUNDER_FREE_USES}`,
      })
      .returning({ n: schema.usage.founderUses });
    if (rows.length > 0) return "founder";
  }
  const limit = creditLimit(user.plan);
  if (amount > limit) return null;
  const rows = await d
    .insert(schema.usage)
    .values({ userId: user.id, month: monthKey(), credits: amount })
    .onConflictDoUpdate({
      target: [schema.usage.userId, schema.usage.month],
      set: { credits: sql`${schema.usage.credits} + ${amount}` },
      setWhere: sql`${schema.usage.credits} + ${amount} <= ${limit}`,
    })
    .returning({ credits: schema.usage.credits });
  return rows.length > 0 ? "credits" : null;
}

/** Gives back what was reserved when the AI call failed. */
export async function refundCredit(userId: string, month: string, amount = 1, pool: Pool = "credits"): Promise<void> {
  const set =
    pool === "founder"
      ? { founderUses: sql`greatest(${schema.usage.founderUses} - 1, 0)` }
      : { credits: sql`greatest(${schema.usage.credits} - ${amount}, 0)` };
  await (await db())
    .update(schema.usage)
    .set(set)
    .where(and(eq(schema.usage.userId, userId), eq(schema.usage.month, month)));
}
