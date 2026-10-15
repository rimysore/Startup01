import { currentUser } from "@/lib/auth";
import { DEMO_TRENDING } from "@/lib/demo";
import { annotate } from "@/lib/trends";
import { fetchTrending } from "@/lib/youtube";
import { loadYouTube, RECONNECT_MESSAGE, staleNote } from "@/lib/youtube-data";

const TRENDING_MS = 3 * 3_600_000; // YouTube's trending chart changes a few times a day

/** What's trending on YouTube in India right now (top 100), with each video's language detected. 2 quota units. */
export async function GET(request: Request) {
  const user = await currentUser();
  const force = new URL(request.url).searchParams.get("refresh") === "1";
  const demo = { mode: "demo", region: "IN", videos: annotate(DEMO_TRENDING) };
  try {
    const r = await loadYouTube(user?.id, "trending:IN", TRENDING_MS, (t) => fetchTrending(t, "IN", 2), { force });
    if (r.kind === "demo") return Response.json(demo);
    if (r.kind === "reconnect") return Response.json({ ...demo, error: RECONNECT_MESSAGE });
    return Response.json({ mode: "live", region: "IN", fetchedAt: r.fetchedAt, videos: annotate(r.value), ...(r.stale ? { error: staleNote(r.fetchedAt) } : {}) });
  } catch (err) {
    console.error(err);
    return Response.json({ ...demo, error: "Couldn't load YouTube trends, showing samples." });
  }
}
