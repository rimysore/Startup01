import { z } from "zod";
import { currentUser, unauthorized } from "@/lib/auth";
import { applySubscription, simulateBillingEnabled } from "@/lib/billing";
import { randomToken } from "@/lib/crypto";

const Body = z.object({ plan: z.enum(["pro", "creator"]) });

/** Development only: activates a plan without Razorpay so the paid experience can be tested end to end. */
export async function POST(request: Request) {
  if (!simulateBillingEnabled()) return Response.json({ error: "Not available" }, { status: 404 });
  const user = await currentUser();
  if (!user) return unauthorized();
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Unknown plan" }, { status: 400 });
  await applySubscription(
    {
      id: `sim_${randomToken(9)}`,
      plan_id: "",
      status: "active",
      current_end: Math.floor(Date.now() / 1000) + 30 * 86_400,
      notes: { userId: user.id, plan: parsed.data.plan },
    },
    user.id,
  );
  return Response.json({ ok: true });
}
