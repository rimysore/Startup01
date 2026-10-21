import { z } from "zod";
import { body, guard } from "@/lib/marketplace/http";
import { counterRedeem, undoCounter } from "@/lib/marketplace/track";

/** Counter mode: count one customer for the code typed. */
export async function POST(request: Request) {
  const g = await guard(["business", "brand", "agency"]);
  if (g.error) return g.error;
  const b = await body(request, z.object({ code: z.string().trim().min(1).max(40) }));
  if (b.error) return b.error;
  const r = await counterRedeem(g.user.id, b.data.code);
  if (r === "not_found" || r === "ended") return Response.json({ error: r }, { status: 404 });
  return Response.json({ ok: true, couponId: r.couponId, creatorName: r.post.creatorName, code: r.post.promoCode });
}

/** Undo a counter entry made by mistake (within ten minutes). */
export async function DELETE(request: Request) {
  const g = await guard(["business", "brand", "agency"]);
  if (g.error) return g.error;
  const b = await body(request, z.object({ couponId: z.string().max(40) }));
  if (b.error) return b.error;
  if (!(await undoCounter(g.user.id, b.data.couponId))) return Response.json({ error: "Can't undo that one." }, { status: 404 });
  return Response.json({ ok: true });
}
