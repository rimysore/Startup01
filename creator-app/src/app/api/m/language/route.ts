import { z } from "zod";
import { UI_LANGS } from "@/lib/marketplace/flag";
import { body, guard } from "@/lib/marketplace/http";
import { setUiLanguage } from "@/lib/marketplace/store";

/** Switches the marketplace screens between English and Kannada. */
export async function PUT(request: Request) {
  const g = await guard();
  if (g.error) return g.error;
  const b = await body(request, z.object({ lang: z.enum(UI_LANGS) }));
  if (b.error) return b.error;
  await setUiLanguage(g.user.id, b.data.lang);
  return Response.json({ ok: true });
}
