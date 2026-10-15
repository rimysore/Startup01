import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { User } from "./auth";
import { planOf } from "./plans";

export function monthKey(d = new Date()): string {
  return d.toISOString().slice(0, 7);
}

export async function creditsUsed(userId: string): Promise<number> {
  const [row] = await (await db())
    .select({ credits: schema.usage.credits })
    .from(schema.usage)
    .where(and(eq(schema.usage.userId, userId), eq(schema.usage.month, monthKey())));
  return row?.credits ?? 0;
}

/** Atomically takes one credit if the user is under their monthly limit. Returns false when they're out. */
export async function reserveCredit(user: User): Promise<boolean> {
  const limit = planOf(user.plan).credits;
  if (limit <= 0) return false;
  const rows = await (await db())
    .insert(schema.usage)
    .values({ userId: user.id, month: monthKey(), credits: 1 })
    .onConflictDoUpdate({
      target: [schema.usage.userId, schema.usage.month],
      set: { credits: sql`${schema.usage.credits} + 1` },
      setWhere: sql`${schema.usage.credits} < ${limit}`,
    })
    .returning({ credits: schema.usage.credits });
  return rows.length > 0;
}

/** Gives a credit back when the AI call it was reserved for failed. */
export async function refundCredit(userId: string, month: string): Promise<void> {
  await (await db())
    .update(schema.usage)
    .set({ credits: sql`greatest(${schema.usage.credits} - 1, 0)` })
    .where(and(eq(schema.usage.userId, userId), eq(schema.usage.month, month)));
}
