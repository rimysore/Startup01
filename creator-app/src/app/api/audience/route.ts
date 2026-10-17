import { currentUser } from "@/lib/auth";
import { DEMO_AUDIENCE } from "@/lib/demo";
import { fetchAudience } from "@/lib/youtube";
import { loadYouTube, RECONNECT_MESSAGE, staleNote } from "@/lib/youtube-data";

const AUDIENCE_MS = 12 * 3_600_000; // YouTube Analytics updates about once a day

/** Last 28 days of audience data for the channel, or for one video with ?video=ID. Analytics API quota, not Data API. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const video = url.searchParams.get("video") ?? undefined;
  const force = url.searchParams.get("refresh") === "1";
  const user = video?.startsWith("demo-") ? null : await currentUser();
  const demo = { mode: "demo", report: DEMO_AUDIENCE };
  if (video && !/^[\w-]{6,20}$/.test(video) && !video.startsWith("demo-")) return Response.json({ error: "Invalid video" }, { status: 400 });
  try {
    const r = await loadYouTube(user?.id, `audience:${video ?? "channel"}`, AUDIENCE_MS, (t) => fetchAudience(t, { videoId: video }), { force });
    if (r.kind === "demo") return Response.json(demo);
    if (r.kind === "reconnect") return Response.json({ ...demo, error: RECONNECT_MESSAGE });
    return Response.json({ mode: "live", fetchedAt: r.fetchedAt, report: r.value, ...(r.stale ? { error: staleNote(r.fetchedAt) } : {}) });
  } catch (err) {
    console.error(err);
    // Never sample numbers for a signed-in creator: they could pass for their own.
    if (user) {
      const empty = { days: 28, countries: [], cities: [], sources: [], searchTerms: [], demographics: [], subscribed: [] };
      return Response.json({ mode: "live", report: empty, error: "Couldn't load your audience data from YouTube just now. Try again in a minute." });
    }
    return Response.json(demo);
  }
}
