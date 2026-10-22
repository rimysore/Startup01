import { guard } from "@/lib/marketplace/http";
import { instagramSnapshot, instagramToken, removeInstagram, syncInstagram } from "@/lib/marketplace/social";

/** Refresh the verified Instagram numbers from the connected account (and fill any profile fields still empty). */
export async function POST() {
  const g = await guard(["creator"]);
  if (g.error) return g.error;
  const token = await instagramToken(g.user.id);
  if (!token) return Response.json({ error: "Connect Instagram again.", connect: true }, { status: 409 });
  try {
    const { handle: h, filled } = await syncInstagram(g.user.id, await instagramSnapshot(token), g.user.name ?? "");
    return Response.json({ ok: true, handle: h.handle, followers: h.followers, avgViews: h.avgViews, verifiedAt: h.verifiedAt, filled });
  } catch (err) {
    console.error("Instagram refresh failed", err);
    return Response.json({ error: "Instagram didn't answer. Please try again in a minute." }, { status: 502 });
  }
}

/** Disconnect Instagram and drop the verified numbers. */
export async function DELETE() {
  const g = await guard(["creator"]);
  if (g.error) return g.error;
  await removeInstagram(g.user.id);
  return Response.json({ ok: true });
}
