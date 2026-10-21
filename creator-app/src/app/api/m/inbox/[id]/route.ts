import { z } from "zod";
import { body, guard } from "@/lib/marketplace/http";
import { recheck, setInboxStatus } from "@/lib/marketplace/inbox";

const Patch = z.object({
  status: z.enum(["new", "dismissed"]).optional(),
  /** Who sent it, filled in or corrected by the creator; the sender check runs again. */
  senderName: z.string().trim().max(120).optional().nullable(),
  senderEmail: z.string().trim().toLowerCase().email().max(200).optional().nullable().or(z.literal("").transform(() => null)),
  senderPhone: z.string().trim().max(20).optional().nullable(),
  senderHandle: z.string().trim().max(80).optional().nullable(),
});

export async function PATCH(request: Request, ctx: RouteContext<"/api/m/inbox/[id]">) {
  const g = await guard(["creator"]);
  if (g.error) return g.error;
  const b = await body(request, Patch);
  if (b.error) return b.error;
  const { id } = await ctx.params;
  const { status, ...sender } = b.data;
  if (status && !(await setInboxStatus(g.user.id, id, status))) return Response.json({ error: "Not found" }, { status: 404 });
  if (Object.values(sender).some((v) => v !== undefined) && !(await recheck(g.user.id, id, sender))) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
