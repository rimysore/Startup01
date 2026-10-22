import { guard } from "@/lib/marketplace/http";
import { instagramSnapshot, instagramToken, instagramVerified, removeInstagram, saveVerifiedHandle } from "@/lib/marketplace/social";

/** Refresh the verified Instagram numbers from the connected account. */
export async function POST() {
  const g = await guard(["creator"]);
  if (g.error) return g.error;
  const token = await instagramToken(g.user.id);
  if (!token) return Response.json({ error: "Connect Instagram again.", connect: true }, { status: 409 });
  try {
    const h = await saveVerifiedHandle(g.user.id, "instagram", instagramVerified(await instagramSnapshot(token)));
    return Response.json({ ok: true, handle: h.handle, followers: h.followers, verifiedAt: h.verifiedAt });
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
