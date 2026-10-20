import { currentUser } from "@/lib/auth";
import { demoNiche } from "@/lib/demo";
import { provenVideos, rationedSearch, researchQuery, SEARCH_KINDS, SearchLimitError, searchEnabled } from "@/lib/ideas";
import { isLanguageCode } from "@/lib/languages";
import { youtubeConnection } from "@/lib/youtube";
import { RECONNECT_MESSAGE } from "@/lib/youtube-data";

/**
 * Before writing titles: what already went viral on YouTube for this topic, in the creator's language (last 12
 * months, India). Public data only. Body: { topic, language }. Cached a week; 6 new searches per creator per day.
 */
export async function POST(request: Request) {
  const user = await currentUser();
  const body = (await request.json().catch(() => null)) as { topic?: unknown; language?: unknown } | null;
  const query = typeof body?.topic === "string" ? researchQuery(body.topic.slice(0, 500)) : null;
  if (!query) return Response.json({ error: "Describe your video in a few words first." }, { status: 400 });
  const language = isLanguageCode(body?.language) ? body.language : (user?.language ?? "hinglish");
  const yt = user ? await youtubeConnection(user.id) : null;
  // Signed out or no channel yet: sample hits, so the page still shows how research works.
  if (!user || !yt?.channelId) {
    const n = demoNiche();
    return Response.json({ mode: "demo", query, videos: provenVideos(n.videos, new Map(Object.entries(n.subscribers))), left: SEARCH_KINDS.studio.limit });
  }
  if (yt.needsReconnectAt) return Response.json({ error: RECONNECT_MESSAGE }, { status: 400 });
  if (!searchEnabled()) return Response.json({ error: "YouTube research is paused today. Titles will still be written from your topic." }, { status: 503 });
  try {
    const r = await rationedSearch(user.id, yt.channelId, "studio", query, language);
    return Response.json({ mode: "live", query, videos: provenVideos(r.videos, r.subscribers), left: r.left });
  } catch (err) {
    if (err instanceof SearchLimitError) {
      return Response.json({ error: `You've used today's ${SEARCH_KINDS.studio.limit} research searches. Titles will still be written from your topic; research opens again tomorrow.`, left: 0 }, { status: 429 });
    }
    console.error("Studio research failed", err);
    const quota = err instanceof Error && /quota/i.test(err.message);
    return Response.json({ error: quota ? "YouTube search is busy for today. Titles will still be written from your topic." : "Couldn't research YouTube right now." }, { status: 502 });
  }
}
