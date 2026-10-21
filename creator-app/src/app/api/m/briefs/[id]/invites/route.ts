import { after } from "next/server";
import { getBrief, InviteInput, inviteCreator } from "@/lib/marketplace/business";
import { notifyInvited } from "@/lib/marketplace/notify";
import { getBusiness } from "@/lib/marketplace/store";
import { body, guard } from "@/lib/marketplace/http";

/** Invite a creator Mitra matched to this brief. Only opted-in, matching creators can be invited. */
export async function POST(request: Request, ctx: RouteContext<"/api/m/briefs/[id]/invites">) {
  const g = await guard(["business", "brand", "agency"]);
  if (g.error) return g.error;
  const b = await body(request, InviteInput);
  if (b.error) return b.error;
  const r = await inviteCreator(g.user.id, (await ctx.params).id, b.data);
  if (r === "not_found") return Response.json({ error: "This brief is closed or doesn't exist." }, { status: 404 });
  if (r === "not_matched") return Response.json({ error: "That creator isn't a match for this brief, or is already invited." }, { status: 409 });
  const { id: briefId } = await ctx.params;
  after(async () => {
    const [biz, brief] = await Promise.all([getBusiness(g.user.id), getBrief(g.user.id, briefId)]);
    await notifyInvited(r.creatorUserId, r.id, biz?.name ?? "A local business", brief?.goal ?? "");
  });
  return Response.json({ ok: true, id: r.id });
}
