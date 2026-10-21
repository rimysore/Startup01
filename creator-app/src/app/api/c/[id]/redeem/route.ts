import { z } from "zod";
import { MARKETPLACE } from "@/lib/marketplace/flag";
import { redeemCoupon } from "@/lib/marketplace/track";

const Pin = z.object({ pin: z.string().max(12) });

/**
 * Staff redeem a customer's coupon on the customer's phone with the counter PIN. No sign-in: the PIN is the check,
 * with tries limited per coupon and per business (see redeemCoupon).
 */
export async function POST(request: Request, ctx: RouteContext<"/api/c/[id]/redeem">) {
  if (!MARKETPLACE) return Response.json({ error: "Not found" }, { status: 404 });
  const parsed = Pin.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad_pin" }, { status: 400 });
  const result = await redeemCoupon((await ctx.params).id, parsed.data.pin);
  const status = result === "ok" || result === "already" ? 200 : result === "not_found" ? 404 : result === "bad_pin" ? 403 : 409;
  return Response.json({ result }, { status });
}
