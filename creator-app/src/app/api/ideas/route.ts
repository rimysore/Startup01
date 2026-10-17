import { currentUser, unauthorized } from "@/lib/auth";
import { demoCompetitors, demoNiche } from "@/lib/demo";
import { nicheBreakouts, normalizeQuery, SEARCHES_PER_WEEK, SearchLimitError, searchEnabled, searchesLeft, trackedBreakouts } from "@/lib/ideas";
import { isLanguageCode } from "@/lib/languages";
import { competitorBreakouts, searchBreakouts } from "@/lib/outliers";
import { youtubeConnection } from "@/lib/youtube";
import { RECONNECT_MESSAGE } from "@/lib/youtube-data";

const demoSearch = () => {
  const n = demoNiche();
  return searchBreakouts(n.videos, new Map(Object.entries(n.subscribers)));
};

/** Breakout videos among the creator's tracked competitors, and how many niche searches are left this week. */
export async function GET() {
  const user = await currentUser();
  const yt = user ? await youtubeConnection(user.id) : null;
  if (!user || !yt?.channelId || yt.needsReconnectAt) {
    return Response.json({
      mode: "demo",
      tracked: competitorBreakouts(demoCompetitors().rivals),
      trackedCount: 2,
      search: { query: "budget phone", breakouts: demoSearch() },
      searchesLeft: SEARCHES_PER_WEEK,
      searchEnabled: true,
      ...(yt?.needsReconnectAt ? { error: RECONNECT_MESSAGE } : {}),
    });
  }
  try {
    const [t, left] = await Promise.all([trackedBreakouts(user.id), searchesLeft(user.id)]);
    return Response.json({ mode: "live", tracked: t.breakouts, trackedCount: t.tracked, searchesLeft: left, searchEnabled: searchEnabled() });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Couldn't load breakout videos right now." }, { status: 502 });
  }
}

/** Searches the creator's niche: { query, language }. */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const body = (await request.json().catch(() => null)) as { query?: unknown; language?: unknown } | null;
  const query = normalizeQuery(body?.query);
  if (!query) return Response.json({ error: "Type a topic, like “budget phones” or “village cooking”." }, { status: 400 });
  const language = isLanguageCode(body?.language) ? body.language : user.language;
  const yt = await youtubeConnection(user.id);
  if (!yt?.channelId) return Response.json({ mode: "demo", query, breakouts: demoSearch(), searchesLeft: SEARCHES_PER_WEEK });
  if (yt.needsReconnectAt) return Response.json({ error: RECONNECT_MESSAGE }, { status: 400 });
  if (!searchEnabled()) return Response.json({ error: "Niche search is paused for today. Your tracked competitors' breakouts still work." }, { status: 503 });
  try {
    const r = await nicheBreakouts(user.id, yt.channelId, query, language);
    return Response.json({ mode: "live", query, breakouts: r.breakouts, fetchedAt: r.fetchedAt, searchesLeft: r.left });
  } catch (err) {
    if (err instanceof SearchLimitError) {
      return Response.json({ error: `You've used this week's ${SEARCHES_PER_WEEK} new searches. Searches you already ran still work, and more open on Monday.`, searchesLeft: 0 }, { status: 429 });
    }
    console.error("Niche search failed", err);
    // YouTube's daily search quota is shared by every creator on Mitra.
    const quota = err instanceof Error && /quota/i.test(err.message);
    return Response.json({ error: quota ? "YouTube search is busy for today. Try again tomorrow." : "Couldn't search YouTube right now." }, { status: 502 });
  }
}
