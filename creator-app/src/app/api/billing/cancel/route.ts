import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { currentUser, unauthorized } from "@/lib/auth";
import { applySubscription, liveSubscription } from "@/lib/billing";
import { cancelSubscription } from "@/lib/razorpay";

/** Cancels at the end of the current billing period, so the customer keeps what they paid for. */
export async function POST() {
  const user = await currentUser();
  if (!user) return unauthorized();
  const sub = await liveSubscription(user.id);
  if (!sub) return Response.json({ error: "No active subscription." }, { status: 404 });

  const d = await db();
  if (!sub.id.startsWith("sim_")) {
    try {
      await applySubscription(await cancelSubscription(sub.id), user.id);
    } catch (err) {
      console.error(err);
      return Response.json({ error: "Couldn't cancel right now. Please try again." }, { status: 502 });
    }
  }
  await d.update(schema.subscriptions).set({ cancelAtCycleEnd: 1, updatedAt: new Date() }).where(eq(schema.subscriptions.id, sub.id));
  return Response.json({ ok: true });
}
