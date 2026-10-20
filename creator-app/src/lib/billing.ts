import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { PLAN_RANK, isPlanId, type PlanId } from "./plans";
import { planForRazorpayPlanId, type RazorpaySubscription } from "./razorpay";

/** Statuses that still entitle the customer to their plan. "pending" = a renewal charge is being retried. */
const LIVE = new Set(["authenticated", "active", "pending"]);

export function simulateBillingEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_BILLING_SIMULATION === "1";
}

/** Records the latest state of a subscription and recalculates the owner's plan. */
export async function applySubscription(entity: RazorpaySubscription, fallbackUserId?: string): Promise<void> {
  const d = await db();
  const notes = Array.isArray(entity.notes) ? {} : (entity.notes ?? {});
  const [existing] = await d.select().from(schema.subscriptions).where(eq(schema.subscriptions.id, entity.id));
  const userId = existing?.userId ?? notes.userId ?? fallbackUserId;
  if (!userId) {
    console.warn(`Razorpay subscription ${entity.id} has no known owner; ignoring`);
    return;
  }
  const plan: PlanId | null = planForRazorpayPlanId(entity.plan_id) ?? (isPlanId(notes.plan) ? notes.plan : null) ?? (existing?.plan as PlanId);
  if (!plan) return;
  const values = {
    plan,
    status: entity.status,
    currentEnd: entity.current_end ? new Date(entity.current_end * 1000) : null,
    updatedAt: new Date(),
  };
  await d
    .insert(schema.subscriptions)
    .values({ id: entity.id, userId, ...values })
    .onConflictDoUpdate({ target: schema.subscriptions.id, set: values });
  await recalculatePlan(userId);
}

/** The user's plan is the best plan among their subscriptions that are live, or cancelled but still paid up. */
export async function recalculatePlan(userId: string): Promise<void> {
  const d = await db();
  const subs = await d.select().from(schema.subscriptions).where(eq(schema.subscriptions.userId, userId));
  const now = Date.now();
  const entitled = subs.filter(
    (s) => LIVE.has(s.status) || (s.status === "cancelled" && s.currentEnd && s.currentEnd.getTime() > now),
  );
  const best = entitled.sort((a, b) => PLAN_RANK[b.plan as PlanId] - PLAN_RANK[a.plan as PlanId])[0];
  await d
    .update(schema.users)
    .set({ plan: best?.plan ?? "free", planRenewsAt: best?.currentEnd ?? null })
    .where(eq(schema.users.id, userId));
}

export async function liveSubscription(userId: string) {
  const subs = await (await db()).select().from(schema.subscriptions).where(eq(schema.subscriptions.userId, userId));
  const now = Date.now();
  return (
    subs
      .filter((s) => LIVE.has(s.status) || (s.status === "cancelled" && s.currentEnd && s.currentEnd.getTime() > now))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0] ?? null
  );
}
