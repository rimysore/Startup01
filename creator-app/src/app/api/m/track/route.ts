import { body, guard } from "@/lib/marketplace/http";
import { createTrackedPost, TrackInput } from "@/lib/marketplace/track";

/** Starts tracking a creator post: returns its code and link. */
export async function POST(request: Request) {
  const g = await guard(["business", "brand", "agency"]);
  if (g.error) return g.error;
  const b = await body(request, TrackInput);
  if (b.error) return b.error;
  const post = await createTrackedPost(g.user.id, b.data);
  if (post === "no_business") return Response.json({ error: "Add your business profile first." }, { status: 409 });
  if (post === "limit") return Response.json({ error: "The free plan tracks 2 posts a month." }, { status: 402 });
  return Response.json({ ok: true, id: post.id });
}
