import { body, guard } from "@/lib/marketplace/http";
import { JoinInput, joinMarketplace } from "@/lib/marketplace/store";

/** Joins the marketplace as a creator, business, brand or agency. No account connection needed. */
export async function POST(request: Request) {
  const g = await guard();
  if (g.error) return g.error;
  const b = await body(request, JoinInput);
  if (b.error) return b.error;
  const member = await joinMarketplace(g.user.id, b.data);
  return Response.json({ ok: true, next: member.role === "creator" ? "/m/kit?new=1" : "/m/business?new=1" });
}
