import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { applySubscription } from "@/lib/billing";
import { razorpayConfigured, verifyWebhookSignature, type RazorpaySubscription } from "@/lib/razorpay";

interface WebhookBody {
  event: string;
  payload?: { subscription?: { entity: RazorpaySubscription } };
}

/** Razorpay webhook. Configure it for the subscription.* events with RAZORPAY_WEBHOOK_SECRET. */
export async function POST(request: Request) {
  if (!razorpayConfigured()) return new Response("Not configured", { status: 503 });
  const raw = await request.text();
  if (!verifyWebhookSignature(raw, request.headers.get("x-razorpay-signature"))) {
    return new Response("Invalid signature", { status: 400 });
  }

  // Razorpay retries deliveries; process each event id once.
  const eventId = request.headers.get("x-razorpay-event-id");
  if (eventId) {
    const inserted = await (await db())
      .insert(schema.webhookEvents)
      .values({ id: eventId })
      .onConflictDoNothing()
      .returning({ id: schema.webhookEvents.id });
    if (!inserted.length) return Response.json({ ok: true, duplicate: true });
  }

  const body = JSON.parse(raw) as WebhookBody;
  const entity = body.payload?.subscription?.entity;
  if (body.event.startsWith("subscription.") && entity) {
    try {
      await applySubscription(entity);
    } catch (err) {
      console.error(err);
      // Let Razorpay retry: forget the event id so the retry isn't treated as a duplicate.
      if (eventId) {
        await (await db()).delete(schema.webhookEvents).where(eq(schema.webhookEvents.id, eventId));
      }
      return new Response("Error", { status: 500 });
    }
  }
  return Response.json({ ok: true });
}
