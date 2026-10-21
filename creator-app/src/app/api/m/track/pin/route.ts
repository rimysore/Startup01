import { body, guard } from "@/lib/marketplace/http";
import { PinInput, setCounterPin } from "@/lib/marketplace/track";

/** Sets the counter PIN staff use to redeem coupons (stored hashed). */
export async function PUT(request: Request) {
  const g = await guard(["business", "brand", "agency"]);
  if (g.error) return g.error;
  const b = await body(request, PinInput);
  if (b.error) return b.error;
  if (!(await setCounterPin(g.user.id, b.data.pin))) return Response.json({ error: "Add your business profile first." }, { status: 409 });
  return Response.json({ ok: true });
}
