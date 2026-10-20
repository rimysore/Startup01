import { demoBenchmark, demoRetention } from "@/lib/demo";
import { currentUser } from "@/lib/auth";
import { fetchRetention } from "@/lib/youtube";
import { FRESH_MS, loadYouTube, RECONNECT_MESSAGE, staleNote } from "@/lib/youtube-data";

export async function GET(_request: Request, { params }: RouteContext<"/api/videos/[id]/retention">) {
  const { id } = await params;
  const user = id.startsWith("demo-") ? null : await currentUser();
  const demo = { mode: "demo", points: demoRetention(id), benchmark: demoBenchmark() };
  try {
    const r = await loadYouTube(user?.id, `retention:${id}`, FRESH_MS.retention, (t) => fetchRetention(t, id));
    if (r.kind === "demo") return Response.json(demo);
    if (r.kind === "reconnect") return Response.json({ ...demo, error: RECONNECT_MESSAGE });
    // No sample curve next to a real channel's data: it would look like the channel's own norm.
    return Response.json({ mode: "live", points: r.value, benchmark: [], ...(r.stale ? { error: staleNote(r.fetchedAt) } : {}) });
  } catch (err) {
    console.error(err);
    return Response.json({ mode: "live", points: [], benchmark: [], error: "Retention data isn't available for this video yet." });
  }
}
