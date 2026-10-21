import { body, guard } from "@/lib/marketplace/http";
import { deleteDeal, UpdateDealInput, updateDeal } from "@/lib/marketplace/store";

/** Updates a deal in the creator's own log: terms, status, and what it produced. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/m/deals/[id]">) {
  const g = await guard(["creator"]);
  if (g.error) return g.error;
  const b = await body(request, UpdateDealInput);
  if (b.error) return b.error;
  const { id } = await ctx.params;
  if (!(await updateDeal(g.user.id, id, b.data))) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/m/deals/[id]">) {
  const g = await guard(["creator"]);
  if (g.error) return g.error;
  const { id } = await ctx.params;
  if (!(await deleteDeal(g.user.id, id))) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
