import { body, guard } from "@/lib/marketplace/http";
import { createDeal, NewDealInput } from "@/lib/marketplace/store";

/** Saves an offer (and the checker's reading of it) to the creator's private deal log. */
export async function POST(request: Request) {
  const g = await guard(["creator"]);
  if (g.error) return g.error;
  const b = await body(request, NewDealInput);
  if (b.error) return b.error;
  const deal = await createDeal(g.user.id, b.data);
  return Response.json({ ok: true, id: deal.id });
}
