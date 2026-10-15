import { currentUser } from "@/lib/auth";
import { demoSummary } from "@/lib/demo";
import { fetchSummary } from "@/lib/youtube";
import { FRESH_MS, loadYouTube, RECONNECT_MESSAGE, staleNote } from "@/lib/youtube-data";

export async function GET() {
  const user = await currentUser();
  try {
    const r = await loadYouTube(user?.id, "summary", FRESH_MS.summary, fetchSummary);
    if (r.kind === "demo") return Response.json(demoSummary());
    if (r.kind === "reconnect") return Response.json({ ...demoSummary(), error: RECONNECT_MESSAGE });
    return Response.json(r.stale ? { ...r.value, error: staleNote(r.fetchedAt) } : r.value);
  } catch (err) {
    console.error(err);
    return Response.json({ ...demoSummary(), error: "Couldn't load your channel, showing demo data." });
  }
}
