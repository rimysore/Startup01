import { RoomUpdate, updateRoom } from "@/lib/marketplace/business";
import { body, guard } from "@/lib/marketplace/http";

/** Deal room actions: the creator marks it posted; the business counts customers and records payment; both rate. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/m/room/[id]">) {
  const g = await guard();
  if (g.error) return g.error;
  const b = await body(request, RoomUpdate);
  if (b.error) return b.error;
  if (!(await updateRoom(g.user.id, (await ctx.params).id, b.data))) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
