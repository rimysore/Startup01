import { currentUser } from "@/lib/auth";
import { demoSummary } from "@/lib/demo";
import { fetchSummary } from "@/lib/youtube";
import { FRESH_MS, loadYouTube, RECONNECT_MESSAGE, staleNote } from "@/lib/youtube-data";

/** `?refresh=1` re-asks YouTube (at most once a minute) instead of waiting for the hourly refresh. */
export async function GET(request: Request) {
  const user = await currentUser();
  const force = new URL(request.url).searchParams.get("refresh") === "1";
  try {
    const r = await loadYouTube(user?.id, "summary", FRESH_MS.summary, fetchSummary, { force });
    if (r.kind === "demo") return Response.json(demoSummary());
    if (r.kind === "reconnect") return Response.json({ ...demoSummary(), error: RECONNECT_MESSAGE });
    return Response.json({ ...r.value, fetchedAt: r.fetchedAt, ...(r.stale ? { error: staleNote(r.fetchedAt) } : {}) });
  } catch (err) {
    console.error(err);
    return Response.json({ ...demoSummary(), error: "Couldn't load your channel, showing demo data." });
  }
}
