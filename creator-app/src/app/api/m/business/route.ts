import { body, guard } from "@/lib/marketplace/http";
import { BusinessInput, saveBusiness } from "@/lib/marketplace/store";

/** Saves a business, brand or agency profile. Budgets stay private. */
export async function PUT(request: Request) {
  const g = await guard(["business", "brand", "agency"]);
  if (g.error) return g.error;
  const b = await body(request, BusinessInput);
  if (b.error) return b.error;
  await saveBusiness(g.user.id, b.data);
  return Response.json({ ok: true });
}
