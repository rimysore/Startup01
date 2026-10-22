import { z } from "zod";
import { currentUser, isAdmin } from "@/lib/auth";
import { grantPass } from "@/lib/marketplace/pass";

/** Admin: switch a creator's pass on for a year (after they paid, e.g. by UPI) or off. */
export async function PUT(request: Request, ctx: RouteContext<"/api/admin/members/[id]/pass">) {
  if (!isAdmin(await currentUser())) return Response.json({ error: "Not found" }, { status: 404 });
  const parsed = z.object({ on: z.boolean(), note: z.string().trim().max(200).optional() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Bad request" }, { status: 400 });
  const paidUntil = await grantPass((await ctx.params).id, parsed.data.on, parsed.data.note ?? null);
  return Response.json({ ok: true, paidUntil });
}
