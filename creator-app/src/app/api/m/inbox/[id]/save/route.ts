import { guard } from "@/lib/marketplace/http";
import { saveToDeals } from "@/lib/marketplace/inbox";

/** Moves an inbox offer into the creator's deal log. */
export async function POST(_request: Request, ctx: RouteContext<"/api/m/inbox/[id]/save">) {
  const g = await guard(["creator"]);
  if (g.error) return g.error;
  const dealId = await saveToDeals(g.user.id, (await ctx.params).id);
  if (!dealId) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true, dealId });
}
