import { z } from "zod";
import { postMessage } from "@/lib/marketplace/business";
import { body, guard } from "@/lib/marketplace/http";

export async function POST(request: Request, ctx: RouteContext<"/api/m/room/[id]/messages">) {
  const g = await guard();
  if (g.error) return g.error;
  const b = await body(request, z.object({ body: z.string().trim().min(1).max(2000) }));
  if (b.error) return b.error;
  if (!(await postMessage(g.user.id, (await ctx.params).id, b.data.body))) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
