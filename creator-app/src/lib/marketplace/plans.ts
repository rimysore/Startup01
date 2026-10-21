import { and, eq, gt, isNotNull, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { isPlanId, PLANS, UPGRADE_NUDGE_CUSTOMERS, type PlanId } from "./flag";

/*
 * Business plans. During the pilot nothing is charged or enforced; owners can say which plan they'd pay for, which
 * is how we measure willingness to pay before billing exists.
 */

const monthStart = (now = new Date()) => new Date(now.getFullYear(), now.getMonth(), 1);

export async function planOf(businessUserId: string): Promise<PlanId> {
  const [row] = await (await db()).select({ plan: schema.businessProfiles.plan }).from(schema.businessProfiles).where(eq(schema.businessProfiles.userId, businessUserId));
  return isPlanId(row?.plan) ? row.plan : "free";
}

export async function planState(businessUserId: string) {
  const [row] = await (await db())
    .select({ plan: schema.businessProfiles.plan, interest: schema.businessProfiles.planInterest, at: schema.businessProfiles.planInterestAt })
    .from(schema.businessProfiles)
    .where(eq(schema.businessProfiles.userId, businessUserId));
  return { plan: isPlanId(row?.plan) ? row.plan : ("free" as PlanId), interest: isPlanId(row?.interest) ? row.interest : null, interestAt: row?.at ?? null };
}

/** "I'd pay for this plan" during the pilot. Recorded, never charged. `null` takes it back. */
export async function setPlanInterest(businessUserId: string, plan: PlanId | null): Promise<boolean> {
  const rows = await (await db())
    .update(schema.businessProfiles)
    .set({ planInterest: plan, planInterestAt: plan ? new Date() : null, updatedAt: new Date() })
    .where(eq(schema.businessProfiles.userId, businessUserId))
    .returning({ id: schema.businessProfiles.userId });
  return rows.length > 0;
}

/** Customers counted from this business's creator posts this month (redeemed coupons). */
export async function customersThisMonth(businessUserId: string, now = new Date()): Promise<number> {
  const [row] = await (await db())
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.coupons)
    .innerJoin(schema.trackedPosts, eq(schema.trackedPosts.id, schema.coupons.trackedPostId))
    .where(and(eq(schema.trackedPosts.businessUserId, businessUserId), isNotNull(schema.coupons.redeemedAt), gt(schema.coupons.redeemedAt, monthStart(now))));
  return row?.n ?? 0;
}

/** Matched-creator invites sent this month (what the Local plan limits). */
export async function matchesThisMonth(businessUserId: string, now = new Date()): Promise<number> {
  const [row] = await (await db())
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.invites)
    .where(and(eq(schema.invites.businessUserId, businessUserId), gt(schema.invites.createdAt, monthStart(now))));
  return row?.n ?? 0;
}

/** Whether the plan allows one more, given how many were used this month. */
export const withinLimit = (limit: number | null, used: number) => limit === null || used < limit;
export const limitsOf = (plan: PlanId) => PLANS[plan];

/** Results first, then the ask: suggest upgrading only on the free plan, after enough customers were counted. */
export function shouldNudge(plan: PlanId, customers: number, interest: PlanId | null): boolean {
  return plan === "free" && !interest && customers >= UPGRADE_NUDGE_CUSTOMERS;
}
