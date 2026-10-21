import { guard } from "@/lib/marketplace/http";
import { verifyYouTubeHandle } from "@/lib/marketplace/store";
import { fetchSubscriberCount, youtubeConnection, youtubeTokens } from "@/lib/youtube";

/**
 * Verifies the creator's YouTube numbers from their connected channel (read-only): the channel name and its real
 * subscriber count replace whatever was typed. One quota unit.
 */
export async function POST() {
  const g = await guard(["creator"]);
  if (g.error) return g.error;
  const [conn, tokens] = await Promise.all([youtubeConnection(g.user.id), youtubeTokens(g.user.id)]);
  if (!conn || !tokens) return Response.json({ error: "Connect YouTube first.", connect: true }, { status: 409 });
  try {
    const stats = await fetchSubscriberCount(tokens);
    if (stats.hidden) return Response.json({ error: "Your subscriber count is hidden on YouTube, so it can't be verified." }, { status: 409 });
    const handle = await verifyYouTubeHandle(g.user.id, { title: conn.channelTitle ?? "YouTube channel", subscribers: stats.subscribers });
    return Response.json({ ok: true, handle: handle.handle, followers: handle.followers, verifiedAt: handle.verifiedAt });
  } catch (err) {
    console.error("YouTube verification failed", err);
    return Response.json({ error: "YouTube didn't answer. Please try again in a minute." }, { status: 502 });
  }
}
