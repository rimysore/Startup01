import { currentUser } from "@/lib/auth";
import { demoSummary } from "@/lib/demo";
import { fetchSummary } from "@/lib/youtube";
import { FRESH_MS, loadYouTube, peekYouTube, RECONNECT_MESSAGE, staleNote } from "@/lib/youtube-data";

/** `?refresh=1` re-asks YouTube (at most once a minute) instead of waiting for the hourly refresh. */
export async function GET(request: Request) {
  const user = await currentUser();
  const force = new URL(request.url).searchParams.get("refresh") === "1";
  try {
    const r = await loadYouTube(user?.id, "summary", FRESH_MS.summary, fetchSummary, { force });
    if (r.kind === "demo") return Response.json(demoSummary());
    if (r.kind === "reconnect") return Response.json({ ...demoSummary(), error: RECONNECT_MESSAGE });
    // The summary is cached for an hour; the live counter (every few minutes) may have seen newer subscribers.
    // Use whichever is newer, so a reload never shows an older count than the one the creator just saw.
    const live = user ? await peekYouTube<{ subscribers: number; hidden: boolean }>(user.id, "subs").catch(() => null) : null;
    const summary = live && live.fetchedAt > r.fetchedAt && !live.value.hidden ? { ...r.value, channel: { ...r.value.channel, subscribers: live.value.subscribers } } : r.value;
    return Response.json({ ...summary, fetchedAt: r.fetchedAt, ...(r.stale ? { error: staleNote(r.fetchedAt) } : {}) });
  } catch (err) {
    console.error(err);
    // A signed-in creator never gets sample numbers that could pass for their own.
    if (user) return Response.json({ unavailable: true, error: "Mitra couldn't reach YouTube just now." }, { status: 503 });
    return Response.json(demoSummary());
  }
}
