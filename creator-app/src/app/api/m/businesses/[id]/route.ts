import { z } from "zod";
import { setBusinessInterest } from "@/lib/marketplace/collabs";
import { body, guard } from "@/lib/marketplace/http";

/** A creator says they're interested in a listed business (or takes it back). The business sees it. */
export async function PUT(request: Request, ctx: RouteContext<"/api/m/businesses/[id]">) {
  const g = await guard(["creator"]);
  if (g.error) return g.error;
  const b = await body(request, z.object({ interested: z.boolean() }));
  if (b.error) return b.error;
  if (!(await setBusinessInterest(g.user.id, (await ctx.params).id, b.data.interested))) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
