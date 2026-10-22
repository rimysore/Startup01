import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { CREATOR_PASS } from "./flag";

/*
 * Creator Pass state: launch month free for everyone, then the first collab free, then ₹499 a year
 * (lib/marketplace/flag.ts). Server-only: reads FREE_UNTIL and CREATOR_PASS_ENFORCED from the environment.
 */

export const freeUntil = (): Date | null => {
  const v = process.env.FREE_UNTIL;
  const d = v ? new Date(v) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
};
export const passEnforced = () => process.env.CREATOR_PASS_ENFORCED === "1";

/** Deals that came through Mitra and went ahead: what "a collab" means for the free first one. */
const COLLAB_STATUSES = ["agreed", "posted", "paid"];

export type PassStatus = "launch_free" | "first_collab_free" | "active" | "needs_pass";
export type PassState = { status: PassStatus; freeUntil: Date | null; paidUntil: Date | null; collabs: number; interestAt: Date | null; priceInr: number };

export async function collabsDone(userId: string): Promise<number> {
  const [r] = await (await db())
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.deals)
    .where(and(eq(schema.deals.creatorUserId, userId), isNotNull(schema.deals.businessUserId), inArray(schema.deals.status, COLLAB_STATUSES)));
  return r?.n ?? 0;
}

export async function passState(userId: string, now = new Date()): Promise<PassState> {
  const [[pass], collabs] = await Promise.all([(await db()).select().from(schema.creatorPasses).where(eq(schema.creatorPasses.userId, userId)), collabsDone(userId)]);
  const until = freeUntil();
  const paidUntil = pass?.paidUntil ?? null;
  const status: PassStatus =
    paidUntil && paidUntil > now ? "active" : !until || now < until ? "launch_free" : collabs === 0 ? "first_collab_free" : "needs_pass";
  return { status, freeUntil: until, paidUntil, collabs, interestAt: pass?.interestAt ?? null, priceInr: CREATOR_PASS.priceInr };
}

/** Whether the creator may start a collab (accept an invite) or run Auto-DM right now. */
export async function canUse(userId: string, what: "collab" | "autodm", now = new Date()): Promise<boolean> {
  if (!passEnforced()) return true;
  const { status } = await passState(userId, now);
  if (status === "active" || status === "launch_free") return true;
  return what === "collab" && status === "first_collab_free";
}

export async function setPassInterest(userId: string, now = new Date()) {
  await (await db()).insert(schema.creatorPasses).values({ userId, interestAt: now, updatedAt: now }).onConflictDoUpdate({ target: schema.creatorPasses.userId, set: { interestAt: now, updatedAt: now } });
}

/** Admin: switch a pass on for a year from today (or from its current end), or off. */
export async function grantPass(userId: string, on: boolean, note: string | null, now = new Date()) {
  const d = await db();
  const [cur] = await d.select().from(schema.creatorPasses).where(eq(schema.creatorPasses.userId, userId));
  const from = cur?.paidUntil && cur.paidUntil > now ? cur.paidUntil : now;
  const paidUntil = on ? new Date(from.getFullYear(), from.getMonth() + CREATOR_PASS.months, from.getDate(), from.getHours(), from.getMinutes()) : null;
  const values = { paidUntil, source: on ? "admin" : null, note, updatedAt: now };
  await d.insert(schema.creatorPasses).values({ userId, ...values }).onConflictDoUpdate({ target: schema.creatorPasses.userId, set: values });
  return paidUntil;
}
