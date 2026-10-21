import { BriefInput, createBrief } from "@/lib/marketplace/business";
import { body, guard } from "@/lib/marketplace/http";

/** A business posts a brief; matching happens on the brief's page. */
export async function POST(request: Request) {
  const g = await guard(["business", "brand", "agency"]);
  if (g.error) return g.error;
  const b = await body(request, BriefInput);
  if (b.error) return b.error;
  const brief = await createBrief(g.user.id, b.data);
  return Response.json({ ok: true, id: brief.id });
}
