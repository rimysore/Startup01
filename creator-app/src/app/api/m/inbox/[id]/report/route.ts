import { z } from "zod";
import { body, guard } from "@/lib/marketplace/http";
import { reportInboxSender } from "@/lib/marketplace/inbox";

/** "This was a scam" or "this went fine": counted for other creators once two different creators agree. */
export async function POST(request: Request, ctx: RouteContext<"/api/m/inbox/[id]/report">) {
  const g = await guard(["creator"]);
  if (g.error) return g.error;
  const b = await body(request, z.object({ kind: z.enum(["scam", "ok"]) }));
  if (b.error) return b.error;
  if (!(await reportInboxSender(g.user.id, (await ctx.params).id, b.data.kind))) return Response.json({ error: "Add who sent it first (email, phone or handle), so the report can help others." }, { status: 409 });
  return Response.json({ ok: true });
}
