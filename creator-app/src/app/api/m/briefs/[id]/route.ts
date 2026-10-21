import { z } from "zod";
import { setBriefStatus } from "@/lib/marketplace/business";
import { body, guard } from "@/lib/marketplace/http";

/** Close or reopen a brief. Closed briefs take no new invites; accepted deals carry on. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/m/briefs/[id]">) {
  const g = await guard(["business", "brand", "agency"]);
  if (g.error) return g.error;
  const b = await body(request, z.object({ status: z.enum(["open", "closed"]) }));
  if (b.error) return b.error;
  if (!(await setBriefStatus(g.user.id, (await ctx.params).id, b.data.status))) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
