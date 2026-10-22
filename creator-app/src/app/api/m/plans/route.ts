import { z } from "zod";
import { isPlanId } from "@/lib/marketplace/flag";
import { body, guard } from "@/lib/marketplace/http";
import { setPlanInterest } from "@/lib/marketplace/plans";

/** "I'd pay for this plan" during the pilot (or null to take it back). Recorded only; nothing is charged. */
export async function PUT(request: Request) {
  const g = await guard(["business", "brand", "agency"]);
  if (g.error) return g.error;
  const b = await body(request, z.object({ plan: z.string().nullable() }));
  if (b.error) return b.error;
  if (b.data.plan !== null && !isPlanId(b.data.plan)) return Response.json({ error: "Unknown plan" }, { status: 400 });
  if (!(await setPlanInterest(g.user.id, b.data.plan))) return Response.json({ error: "Add your business profile first." }, { status: 409 });
  return Response.json({ ok: true });
}
