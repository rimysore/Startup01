import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { currentUser, endSession, unauthorized } from "@/lib/auth";
import { forgetUser } from "@/lib/memo";
import { cancelSubscription, razorpayConfigured } from "@/lib/razorpay";
import { removeYouTubeConnection } from "@/lib/youtube";

const Body = z.object({ confirm: z.literal("DELETE") });

/** Statuses after which Razorpay will never charge again. */
const FINISHED = new Set(["cancelled", "completed", "expired"]);

/**
 * Permanently deletes the signed-in user's account and everything linked to it. Any subscription that could
 * still charge is cancelled at Razorpay first; if that fails we stop, so no one is billed for a deleted account.
 */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Type DELETE to confirm.' }, { status: 400 });

  const d = await db();
  const subs = await d.select().from(schema.subscriptions).where(eq(schema.subscriptions.userId, user.id));
  for (const sub of subs) {
    if (FINISHED.has(sub.status) || sub.id.startsWith("sim_")) continue;
    if (!razorpayConfigured()) {
      return Response.json({ error: "Your subscription couldn't be cancelled automatically. Please contact support." }, { status: 503 });
    }
    try {
      await cancelSubscription(sub.id, true);
    } catch (err) {
      // A subscription that was created but never paid can't be cancelled and will never charge.
      if (sub.status === "created") continue;
      console.error(err);
      return Response.json({ error: "We couldn't cancel your subscription, so nothing was deleted. Please try again." }, { status: 502 });
    }
  }

  // Revoke Google access first; everything else (sessions, tokens, usage, WhatsApp number, reports) is removed by
  // ON DELETE CASCADE.
  await removeYouTubeConnection(user.id);
  await d.delete(schema.users).where(eq(schema.users.id, user.id));
  await forgetUser(user.id);
  await endSession();
  return Response.json({ ok: true });
}
