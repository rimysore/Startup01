// Run with: npm test. Outlier scores, breakout picking, and the weekly niche-search allowance.
process.env.PGLITE_DIR = "memory://";
process.env.GOOGLE_CLIENT_ID = "test";
process.env.GOOGLE_CLIENT_SECRET = "test";
const { competitorBreakouts, outlierLabel, outlierScores, pickBreakouts, searchBreakouts, formatScore } = await import("@/lib/outliers");
const { db, schema } = await import("@/db");
const { nicheBreakouts, normalizeQuery, SEARCHES_PER_WEEK, SearchLimitError } = await import("@/lib/ideas");
const { saveYouTubeConnection } = await import("@/lib/youtube");
const { weeklyFacts } = await import("@/lib/reports/facts");
const assert = (c: unknown, m: string) => { if (!c) { console.error("FAIL", m); process.exit(1); } console.log("ok", m); };

const NOW = Date.parse("2026-10-19T06:00:00Z");
const day = 86_400_000;
const at = (days: number) => new Date(NOW - days * day).toISOString();
const vid = (id: string, days: number, views: number, durationSec = 600) => ({ id, title: id, publishedAt: at(days), durationSec, views });

// ---- Own channel -------------------------------------------------------------------------------------
const mine = [vid("new", 10, 9000), vid("a", 20, 1000), vid("b", 30, 2000), vid("c", 40, 3000), vid("short", 15, 50_000, 40), vid("d", 50, 1500)];
let s = outlierScores(mine, NOW);
assert(s.get("new")!.score === 5.1 && s.get("new")!.label === "breakout", "9K views vs a usual of 1,750 (median of earlier long videos) is a 5.1× breakout");
assert(s.get("new")!.usual === 1750, "a viral Short doesn't count toward long videos' usual");
assert(s.get("d")!.score === null && s.get("c")!.score === null, "no score without 3 earlier uploads");
assert(s.get("short")!.score === null, "a Short is only compared with earlier Shorts");
s = outlierScores([vid("fresh", 2, 500), vid("a", 20, 1000), vid("b", 30, 1000), vid("c", 40, 1000)], NOW);
assert(s.get("fresh")!.early && s.get("fresh")!.label === "below", "a 2-day-old video is flagged early");
assert(s.get("a")!.score === null, "order comes from dates, not the list order");
assert(outlierLabel(3) === "breakout" && outlierLabel(1.5) === "above" && outlierLabel(1) === "usual" && outlierLabel(0.5) === "below", "labels at the thresholds");
assert(formatScore(12.4) === "12×" && formatScore(2.25) === "2.3×" && formatScore(null) === "–", "score formatting");

// ---- Competitors and niche search ----------------------------------------------------------------------
const rival = { id: "R", title: "Rival", recent: [vid("r-hit", 5, 30_000), vid("r-new", 1, 90_000), vid("r1", 10, 5000), vid("r2", 12, 6000), vid("r3", 14, 4000), vid("r4", 16, 5000)] };
const tracked = competitorBreakouts([rival], NOW);
assert(tracked.length === 1 && tracked[0].id === "r-hit" && tracked[0].score === 6, "a 6× rival video is a breakout; a 1-day-old spike isn't yet");

const found = searchBreakouts(
  [
    { ...vid("n1", 5, 500_000), channelId: "small", channelTitle: "Small" },
    { ...vid("n2", 5, 900_000), channelId: "huge", channelTitle: "Huge" },
    { ...vid("n3", 5, 50_000), channelId: "tiny", channelTitle: "Tiny" },
    { ...vid("n4", 5, 400_000), channelId: "me", channelTitle: "Me" },
  ],
  new Map([["small", 50_000], ["huge", 5_000_000], ["tiny", 300], ["me", 10_000]]),
  { exclude: "me" },
);
assert(found.length === 1 && found[0].id === "n1" && found[0].score === 10, "views per subscriber: big channels, tiny channels and your own are left out");
const picked = pickBreakouts([[...Array(5)].map((_, i) => ({ ...tracked[0], id: `x${i}`, score: 10 - i })), found], 4, 2);
assert(picked.length === 3 && picked.filter((p) => p.channelId === "R").length === 2, "at most 2 picks per channel");

// ---- Weekly report star uses the outlier score ------------------------------------------------------------
const summary = {
  mode: "live" as const,
  channel: { id: "UC", title: "Ch", handle: "", avatar: null, subscribers: 900, totalViews: 1, videoCount: 6 },
  daily: [],
  videos: mine.map((v) => ({ ...v, publishedAt: v.publishedAt.slice(0, 10), publishedAtIso: v.publishedAt, thumbnail: null, likes: 0, comments: 0, avgViewPct: null })),
};
const wf = weeklyFacts(summary, NOW);
assert(wf.star?.title === "new" && wf.star.times === 5.1, `weekly star is the biggest outlier, not the most-viewed video (got ${JSON.stringify(wf.star)})`);

// ---- Niche search allowance ---------------------------------------------------------------------------
assert(normalizeQuery("  Budget   PHONES ") === "budget phones" && normalizeQuery("x") === null && normalizeQuery(5) === null, "queries are normalized");
const d = await db();
await d.insert(schema.users).values({ id: "u1", email: "a@b.c" });
await saveYouTubeConnection("u1", { accessToken: "t", refreshToken: "r", expiresAt: NOW + 3_600_000 * 1000 }, { id: "UCme", title: "Me" });

let searches = 0;
const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: string | URL) => {
  const url = String(input);
  if (url.includes("/search?")) {
    searches++;
    const q = new URL(url).searchParams;
    assert(q.get("relevanceLanguage") === "hi" && q.get("regionCode") === "IN" && q.get("order") === "viewCount", "search leans to the creator's language in India");
    return Response.json({ items: [{ id: { videoId: "v1" } }] });
  }
  if (url.includes("/videos?")) return Response.json({ items: [{ id: "v1", snippet: { title: "Hit", publishedAt: at(3), channelId: "c1", channelTitle: "C1" }, statistics: { viewCount: "200000" }, contentDetails: { duration: "PT9M" } }] });
  if (url.includes("/channels?")) return Response.json({ items: [{ id: "c1", statistics: { subscriberCount: "20000" } }] });
  throw new Error(`unexpected ${url}`);
}) as typeof fetch;

const r1 = await nicheBreakouts("u1", "UCme", "budget phones", "hinglish", NOW);
assert(r1.breakouts[0]?.score === 10 && r1.left === SEARCHES_PER_WEEK - 1, "a search returns scored breakouts and uses one of the week's searches");
await nicheBreakouts("u1", "UCme", "budget phones", "hinglish", NOW);
assert(searches === 1, "repeating a search is served from cache");
await nicheBreakouts("u1", "UCme", "cooking", "hinglish", NOW);
await nicheBreakouts("u1", "UCme", "travel", "hinglish", NOW);
let limited = false;
try { await nicheBreakouts("u1", "UCme", "cricket", "hinglish", NOW); } catch (e) { limited = e instanceof SearchLimitError; }
assert(limited && searches === SEARCHES_PER_WEEK, `the ${SEARCHES_PER_WEEK + 1}th new search in a week is refused without calling YouTube`);
const nextWeek = await nicheBreakouts("u1", "UCme", "cricket", "hinglish", NOW + 7 * day);
assert(nextWeek.breakouts.length === 1 && searches === SEARCHES_PER_WEEK + 1, "a new week brings new searches");
globalThis.fetch = realFetch;

console.log("all outlier tests passed");
process.exit(0);
