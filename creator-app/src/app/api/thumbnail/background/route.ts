import { currentUser } from "@/lib/auth";

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
