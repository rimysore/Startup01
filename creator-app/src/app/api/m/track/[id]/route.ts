import { body, guard } from "@/lib/marketplace/http";
import { TrackUpdate, updateTracked } from "@/lib/marketplace/track";

/** End or resume tracking, or add the post's link. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/m/track/[id]">) {
  const g = await guard(["business", "brand", "agency"]);
  if (g.error) return g.error;
  const b = await body(request, TrackUpdate);
  if (b.error) return b.error;
  if (!(await updateTracked(g.user.id, (await ctx.params).id, b.data))) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
