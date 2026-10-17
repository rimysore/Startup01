import { z } from "zod";
import { db, schema } from "@/db";
import { currentUser, unauthorized } from "@/lib/auth";
import { liveSubscription, simulateBillingEnabled } from "@/lib/billing";
import { PLANS } from "@/lib/plans";
import { createSubscription, razorpayConfigured } from "@/lib/razorpay";

const Body = z.object({ plan: z.enum(["pro", "creator"]) });

/** Creates a Razorpay subscription for the chosen plan; the browser then opens Razorpay Checkout with it. */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Unknown plan" }, { status: 400 });
  const { plan } = parsed.data;

  const live = await liveSubscription(user.id);
  if (live && live.status !== "cancelled" && !live.cancelAtCycleEnd) {
    return Response.json(
      { error: "You already have an active subscription. Cancel it first to switch plans." },
      { status: 409 },
    );
  }

  if (!razorpayConfigured()) {
    if (simulateBillingEnabled()) return Response.json({ mode: "simulate", plan });
    return Response.json({ error: "Payments aren't set up yet." }, { status: 503 });
  }

  try {
    const sub = await createSubscription(plan, user.id, user.email);
    await (await db()).insert(schema.subscriptions).values({ id: sub.id, userId: user.id, plan, status: sub.status });
    return Response.json({
      mode: "razorpay",
      keyId: process.env.RAZORPAY_KEY_ID,
      subscriptionId: sub.id,
      planName: PLANS[plan].name,
      prefill: { email: user.email, name: user.name ?? "" },
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Couldn't start checkout. Please try again." }, { status: 502 });
  }
}
