import { z } from "zod";
import { body, guard } from "@/lib/marketplace/http";
import { setProgramInterest } from "@/lib/marketplace/programs";

/** A creator says they're interested in a program (or takes it back). */
export async function PUT(request: Request, ctx: RouteContext<"/api/m/programs/[id]">) {
  const g = await guard(["creator"]);
  if (g.error) return g.error;
  const b = await body(request, z.object({ interested: z.boolean() }));
  if (b.error) return b.error;
  if (!(await setProgramInterest(g.user.id, (await ctx.params).id, b.data.interested))) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
