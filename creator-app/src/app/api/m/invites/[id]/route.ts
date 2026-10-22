import { z } from "zod";
import { after } from "next/server";
import { getRoom, respondToInvite, withdrawInvite } from "@/lib/marketplace/business";
import { notifyAccepted } from "@/lib/marketplace/notify";
import { body, guard } from "@/lib/marketplace/http";
import { canUse } from "@/lib/marketplace/pass";

/** The creator accepts (opening the deal room) or declines an invite. */
export async function POST(request: Request, ctx: RouteContext<"/api/m/invites/[id]">) {
  const g = await guard(["creator"]);
  if (g.error) return g.error;
  const b = await body(request, z.object({ accept: z.boolean() }));
  if (b.error) return b.error;
  if (b.data.accept && !(await canUse(g.user.id, "collab"))) return Response.json({ error: "Your free collab is used. Get the Creator Pass (₹499 a year) to accept more.", pass: true }, { status: 402 });
  const r = await respondToInvite(g.user.id, (await ctx.params).id, b.data.accept);
  if (!r) return Response.json({ error: "This offer was already answered or withdrawn." }, { status: 409 });
  if (r.dealId) {
    const dealId = r.dealId;
    after(async () => {
      const room = await getRoom(g.user.id, dealId);
      if (room?.deal.businessUserId) await notifyAccepted(room.deal.businessUserId, dealId, room.creator.name);
    });
  }
  return Response.json({ ok: true, dealId: r.dealId });
}

/** The business withdraws an invite the creator hasn't answered. */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/m/invites/[id]">) {
  const g = await guard(["business", "brand", "agency"]);
  if (g.error) return g.error;
  if (!(await withdrawInvite(g.user.id, (await ctx.params).id))) return Response.json({ error: "Already answered." }, { status: 409 });
  return Response.json({ ok: true });
}
