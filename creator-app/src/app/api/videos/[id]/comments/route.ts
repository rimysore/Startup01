import { demoComments } from "@/lib/demo";
import { currentUser } from "@/lib/auth";
import { fetchComments } from "@/lib/youtube";
import { FRESH_MS, loadYouTube, RECONNECT_MESSAGE, staleNote } from "@/lib/youtube-data";

export async function GET(_request: Request, { params }: RouteContext<"/api/videos/[id]/comments">) {
  const { id } = await params;
  const user = id.startsWith("demo-") ? null : await currentUser();
  try {
    const r = await loadYouTube(user?.id, `comments:${id}`, FRESH_MS.comments, (t) => fetchComments(t, id));
    if (r.kind === "demo") return Response.json({ mode: "demo", comments: demoComments() });
    if (r.kind === "reconnect") return Response.json({ mode: "demo", comments: demoComments(), error: RECONNECT_MESSAGE });
    return Response.json({ mode: "live", comments: r.value, ...(r.stale ? { error: staleNote(r.fetchedAt) } : {}) });
  } catch (err) {
    console.error(err);
    return Response.json({ mode: "live", comments: [], error: "Comments are turned off or unavailable for this video." });
  }
}
