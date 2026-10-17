import { z } from "zod";
import { aiConfigured, designThumbnail } from "@/lib/ai";
import { runPaidAi } from "@/lib/ai-route";
import { currentUser, isAdmin } from "@/lib/auth";
import { composeConfigured, composePrompt, composeThumbnail, COMPOSE_MODEL, UnsafeCompose } from "@/lib/compose";
import { isLanguageCode } from "@/lib/languages";
import { referenceThumbnails } from "@/lib/reference-thumbnails";

export const maxDuration = 120;

const Image = z.object({
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  data: z.string().max(600_000).regex(/^[A-Za-z0-9+/]+=*$/),
});
const Body = z.object({
  title: z.string().min(3).max(500),
  text: z.string().max(80),
  /** Photos of the creator (their face), then optional photos of a place or product. */
  faces: z.array(Image).min(1).max(3),
  extras: z.array(Image).max(2).default([]),
  references: z.array(z.string().regex(/^[\w-]{11}$/)).max(3).default([]),
  language: z.string().refine(isLanguageCode).catch("hinglish"),
});

/**
 * A pro thumbnail: Mitra (Claude) plans the shot from the topic and the top hits' style, then Gemini paints a new
 * 2K photo with the creator in it. Returns the plan (text, colours, layout for the canvas) and the image.
 * One charge for both (FEATURE_CREDITS.compose), refunded if either step fails.
 */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Sign in first." }, { status: 401 });
  if (!composeConfigured() || !aiConfigured()) return Response.json({ error: "Pro thumbnails aren't switched on yet." }, { status: 404 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Add at least one clear photo of yourself (JPEG or PNG)." }, { status: 400 });
  const b = parsed.data;

  let imageError: unknown = null;
  const out = await runPaidAi(user, "compose", b, async () => {
    const plan = await designThumbnail(b.language, b.title, b.text, [...b.faces, ...b.extras], await referenceThumbnails(b.references), true);
    try {
      const image = await composeThumbnail(composePrompt(plan.result, b.faces.length, b.extras.length), [...b.faces, ...b.extras]);
      return {
        result: { design: { ...plan.result, images: [] }, image: image.data, mimeType: image.mimeType },
        usage: { ...plan.usage, model: `${plan.usage.model} + ${COMPOSE_MODEL}`, costMicros: plan.usage.costMicros + Math.round(image.costUsd * 1e6) },
      };
    } catch (err) {
      imageError = err;
      throw err;
    }
  });
  if (out.ok) return Response.json(out.result);
  if (imageError instanceof UnsafeCompose) {
    return Response.json({ error: "Google's image AI wouldn't make this one. Try a different photo or topic.", ...(isAdmin(user) ? { detail: imageError.message } : {}) }, { status: 422 });
  }
  const detail = imageError instanceof Error ? imageError.message : out.detail;
  return Response.json({ error: out.error, ...(out.upgrade ? { upgrade: true } : {}), ...(isAdmin(user) && detail ? { detail } : {}) }, { status: out.status });
}
