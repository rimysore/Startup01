import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { currentUser, unauthorized } from "@/lib/auth";
import { applySubscription } from "@/lib/billing";
import { fetchSubscription, razorpayConfigured, verifyCheckoutSignature } from "@/lib/razorpay";

const Body = z.object({
  razorpay_payment_id: z.string().min(1).max(100),
  razorpay_subscription_id: z.string().min(1).max(100),
  razorpay_signature: z.string().min(1).max(200),
});

/**
 * Called by the browser after Razorpay Checkout succeeds. We check the signature, then read the subscription
 * back from Razorpay so the plan reflects Razorpay's own state. Webhooks keep it in sync after this.
 */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  if (!razorpayConfigured()) return Response.json({ error: "Payments aren't set up." }, { status: 503 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = parsed.data;

  if (!verifyCheckoutSignature(razorpay_payment_id, razorpay_subscription_id, razorpay_signature)) {
    return Response.json({ error: "Payment verification failed." }, { status: 400 });
  }
  const [owned] = await (await db())
    .select()
    .from(schema.subscriptions)
    .where(and(eq(schema.subscriptions.id, razorpay_subscription_id), eq(schema.subscriptions.userId, user.id)));
  if (!owned) return Response.json({ error: "Subscription not found." }, { status: 404 });

  await applySubscription(await fetchSubscription(razorpay_subscription_id), user.id);
  return Response.json({ ok: true });
}
