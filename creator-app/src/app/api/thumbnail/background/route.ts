import { z } from "zod";
import { logCall, overDailyBudget, overRateLimit } from "@/lib/ai-guard";
import { currentUser } from "@/lib/auth";
import { generateBackground, IMAGE_COST_USD, IMAGE_MODEL, imageGenerationConfigured, UnsafeImage } from "@/lib/images";
import { FEATURE_CREDITS } from "@/lib/plans";
import { monthKey, refundCredit, reserveCredit } from "@/lib/usage";

const Body = z.object({ prompt: z.string().min(3).max(400), seed: z.number().int().min(0).max(2 ** 31).optional() });

/**
 * Generates a background with the image model (FAL_KEY). Same guardrails as the text AI: sign-in, rate limit,
 * daily budget, one credit (refunded on failure), cost logged. Returns 404 when image generation isn't set up,
 * so the page can fall back to a stock photo.
 */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Sign in first" }, { status: 401 });
  if (!imageGenerationConfigured()) return Response.json({ error: "Image generation isn't set up" }, { status: 404 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  if (await overRateLimit(user.id)) return Response.json({ error: "You're going a bit fast — wait a minute and try again." }, { status: 429 });
  if (await overDailyBudget()) return Response.json({ error: "Mitra is taking a short break. Please try again in a few hours." }, { status: 503 });
  const month = monthKey();
  if (!(await reserveCredit(user, FEATURE_CREDITS.image))) {
    return Response.json({ error: "You've used all your AI credits for this month.", upgrade: true }, { status: 402 });
  }
  const started = Date.now();
  try {
    const img = await generateBackground(parsed.data.prompt, parsed.data.seed);
    await logCall(user.id, "image", { model: IMAGE_MODEL, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, costMicros: IMAGE_COST_USD * 1e6 }, Date.now() - started).catch(
      (err) => console.error("Image bookkeeping failed", err),
    );
    return new Response(img.body, {
      headers: { "Content-Type": img.contentType, "Cache-Control": "private, no-store", "X-Photo-Credit": encodeURIComponent("AI-generated background"), "X-Seed": String(img.seed) },
    });
  } catch (err) {
    await refundCredit(user.id, month, FEATURE_CREDITS.image);
    console.error("Image generation failed:", err instanceof Error ? err.message : err);
    if (err instanceof UnsafeImage) return Response.json({ error: "That background couldn't be made. Try different words." }, { status: 422 });
    return Response.json({ error: "Couldn't make a background right now." }, { status: 502 });
  }
}

/**
 * A background photo for a thumbnail, found on Pexels (free stock photos, free for commercial use) from the
 * AI's search words. The image is streamed through our own domain so the browser can draw it on a canvas
 * and export the result. Signed-in users only, so strangers can't spend our Pexels quota.
 *
 * GET ?q=city+night+lights&n=0   (n picks the nth result, for "try another")
 */
export async function GET(request: Request) {
  if (!(await currentUser())) return Response.json({ error: "Sign in first" }, { status: 401 });
  const key = process.env.PEXELS_API_KEY;
  if (!key) return Response.json({ error: "Stock photos aren't set up" }, { status: 404 });

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").replace(/[^\p{L}\p{N} -]/gu, " ").trim().slice(0, 60);
  const n = Math.min(14, Math.max(0, Number(url.searchParams.get("n")) || 0));
  if (q.length < 2) return Response.json({ error: "Missing search words" }, { status: 400 });

  const search = await fetch(`https://api.pexels.com/v1/search?${new URLSearchParams({ query: q, orientation: "landscape", per_page: "15" })}`, {
    headers: { Authorization: key },
    next: { revalidate: 86_400 }, // same words → same results; saves Pexels quota
  });
  if (!search.ok) {
    console.error(`Pexels search failed: ${search.status}`);
    return Response.json({ error: "Couldn't find a photo" }, { status: 502 });
  }
  type Photo = { photographer: string; url: string; src: { large2x: string; landscape: string } };
  const { photos = [] } = (await search.json()) as { photos?: Photo[] };
  const photo = photos[n % Math.max(1, photos.length)];
  if (!photo) return Response.json({ error: "No photo for those words" }, { status: 404 });

  const img = await fetch(photo.src.large2x);
  if (!img.ok || !img.body) return Response.json({ error: "Couldn't load the photo" }, { status: 502 });
  return new Response(img.body, {
    headers: {
      "Content-Type": img.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "private, max-age=86400",
      // Pexels doesn't require credit, but we show it.
      "X-Photo-Credit": encodeURIComponent(`Photo by ${photo.photographer} on Pexels`),
      "X-Photo-Count": String(photos.length),
    },
  });
}
