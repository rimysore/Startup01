// Run with: npm test. Competitor parsing and metrics, milestones, and the YouTube channel requests (fetch stubbed).
process.env.PGLITE_DIR = "memory://";
const { parseChannelInput, fetchChannelSnapshot, resolveChannel, fetchSubscriberCount } = await import("@/lib/youtube");
const { channelMetrics } = await import("@/lib/competitors");
const { nextMilestone } = await import("@/components/celebrate");
const assert = (c: unknown, m: string) => { if (!c) { console.error("FAIL", m); process.exit(1); } console.log("ok", m); };

assert(JSON.stringify(parseChannelInput("https://www.youtube.com/@TechBurner")) === '{"handle":"@TechBurner"}', "parses a youtube.com/@handle URL");
assert(JSON.stringify(parseChannelInput("youtube.com/channel/UCabcdefghijklmnopqrstuv")) === '{"id":"UCabcdefghijklmnopqrstuv"}', "parses a /channel/UC… URL");
assert(JSON.stringify(parseChannelInput("@vismai.food")) === '{"handle":"@vismai.food"}', "parses a bare @handle");
assert(parseChannelInput("Tech Burner") === null, "refuses plain names (would need 100-unit search)");

const day = 86_400_000;
const now = Date.now();
const m = channelMetrics({
  subscribers: 10_000,
  recent: [
    { id: "a", title: "₹15K phone?", publishedAt: new Date(now - 2 * day).toISOString(), durationSec: 50, views: 3000, likes: 200, comments: 100 },
    { id: "b", title: "Camera test", publishedAt: new Date(now - 9 * day).toISOString(), durationSec: 600, views: 1000, likes: 50, comments: 10 },
    { id: "c", title: "Which one to buy?", publishedAt: new Date(now - 16 * day).toISOString(), durationSec: 900, views: 2000, likes: 100, comments: 40 },
    { id: "d", title: "Just uploaded", publishedAt: new Date(now - 3_600_000).toISOString(), durationSec: 700, views: 10, likes: 1, comments: 0 },
  ],
});
assert(m.avgViews === 2000 && m.medianViews === 2000, "averages skip videos under a day old");
assert(m.shortsShare === 25 && m.avgLongMinutes === 12.2, "short-form share and long video length");
assert(m.uploadsPerWeek === 1.3, `uploads per week from publish dates (${m.uploadsPerWeek})`);
assert(m.engagement === 8.3 && m.viewsPerSub === 20, "engagement and views per subscriber");
assert(m.titlesWithNumbers === 25 && m.titlesWithQuestion === 50 && m.topVideo?.views === 3000, "title patterns and top video");

const ms = nextMilestone(312_400);
assert(ms.at === 500_000 && ms.prev === 100_000, "next milestone after 3.1 lakh is 5 lakh");
assert(nextMilestone(42).at === 100 && nextMilestone(999).at === 1000 && nextMilestone(1000).at === 5000, "small-channel milestones");
assert(nextMilestone(12_000_000).at === 20_000_000, "beyond the list: next crore");

const seen: string[] = [];
const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: string | URL) => {
  const url = String(input);
  seen.push(url);
  const u = new URL(url);
  if (u.pathname.endsWith("/channels")) {
    if (u.searchParams.get("forHandle") === "@nobody") return Response.json({ items: [] });
    return Response.json({ items: [{ id: "UCx", snippet: { title: "Rival", customUrl: "@rival" }, statistics: { subscriberCount: "312000", viewCount: "9", videoCount: "3", hiddenSubscriberCount: false }, contentDetails: { relatedPlaylists: { uploads: "UUx" } } }] });
  }
  if (u.pathname.endsWith("/playlistItems")) return Response.json({ items: [{ contentDetails: { videoId: "v1" } }] });
  if (u.pathname.endsWith("/videos")) return Response.json({ items: [{ id: "v1", snippet: { title: "T", publishedAt: new Date().toISOString() }, statistics: { viewCount: "5" }, contentDetails: { duration: "PT1M" } }] });
  return new Response("?", { status: 404 });
}) as typeof fetch;
const tokens = { accessToken: "x", expiresAt: now + 3_600_000 };
const ref = await resolveChannel(tokens, { handle: "@rival" });
assert(ref?.id === "UCx" && seen[0].includes("forHandle=%40rival") && seen[0].includes("part=snippet"), "resolve by handle: channels.list?forHandle (1 unit)");
assert((await resolveChannel(tokens, { handle: "@nobody" })) === null, "unknown handle → null");
seen.length = 0;
const snap = await fetchChannelSnapshot(tokens, "UCx");
assert(seen.length === 3 && snap.subscribers === 312000 && snap.recent[0].durationSec === 60, "snapshot = channels + playlistItems + videos (3 units)");
seen.length = 0;
const live = await fetchSubscriberCount(tokens);
assert(seen.length === 1 && seen[0].includes("part=statistics") && seen[0].includes("mine=true") && live.subscribers === 312000, "live count: one 1-unit call");
globalThis.fetch = realFetch;
console.log("all growth tests passed");
process.exit(0);
