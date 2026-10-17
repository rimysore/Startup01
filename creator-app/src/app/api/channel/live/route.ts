import { currentUser } from "@/lib/auth";
import { fetchSubscriberCount } from "@/lib/youtube";
import { loadYouTube } from "@/lib/youtube-data";

/** The live subscriber count (1 quota unit, cached 2 minutes) for the dashboard's counter. */
export async function GET() {
  const user = await currentUser();
  try {
    const r = await loadYouTube(user?.id, "subs", 2 * 60_000, fetchSubscriberCount);
    if (r.kind !== "live") return Response.json({ mode: r.kind });
    return Response.json({ mode: "live", ...r.value, fetchedAt: r.fetchedAt });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Couldn't load the subscriber count" }, { status: 502 });
  }
}
