import { body, guard } from "@/lib/marketplace/http";
import { KitInput, saveKit } from "@/lib/marketplace/store";

/** Saves the creator's profile, accounts, rates and whether the media kit is public. */
export async function PUT(request: Request) {
  const g = await guard(["creator"]);
  if (g.error) return g.error;
  const b = await body(request, KitInput);
  if (b.error) return b.error;
  const profile = await saveKit(g.user.id, b.data);
  return Response.json({ ok: true, slug: profile.slug });
}
