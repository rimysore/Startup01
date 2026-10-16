// Run with: npm test. Prospecting: contact extraction, scoring, the YouTube requests and quota accounting (fetch stubbed).
process.env.PGLITE_DIR = "memory://";
const { extractEmails, extractLinks, scoreCandidate, discover, estimateUnits } = await import("@/lib/prospects");
const { outreachBody } = await import("@/lib/outreach");
const assert = (c: unknown, m: string) => { if (!c) { console.error("FAIL", m); process.exit(1); } console.log("ok", m); };

assert(JSON.stringify(extractEmails("Business: Ravi.Tech@Gmail.com.\nCollabs: ravi [at] studio [dot] in")) === '["ravi.tech@gmail.com","ravi@studio.in"]', "finds plain and '[at] [dot]' emails");
assert(extractEmails("logo@2x.png and nothing else").length === 0, "ignores image filenames");
const links = extractLinks("Insta https://instagram.com/ravi, site https://ravi.in. Watch https://youtube.com/@ravi");
assert(links[0].includes("instagram") && links.length === 2 && !links.some((l) => l.includes("youtube")), "keeps social/business links, drops YouTube's own");

const now = Date.parse("2026-10-16T00:00:00Z");
const base = { channelId: "x", title: "t", handle: null, avatar: null, country: "IN", language: "te" as const, views: 2_000_000, videoCount: 100, lastUploadAt: "2026-10-14T00:00:00Z", latestVideoTitle: "t", description: "", emails: ["a@b.in"], links: [] };
const sweet = scoreCandidate({ ...base, subscribers: 12_000 }, "te", now);
const huge = scoreCandidate({ ...base, subscribers: 3_000_000 }, "te", now);
const tiny = scoreCandidate({ ...base, subscribers: 300 }, "te", now);
const noEmail = scoreCandidate({ ...base, subscribers: 12_000, emails: [] }, "te", now);
const stale = scoreCandidate({ ...base, subscribers: 12_000, lastUploadAt: "2026-06-01T00:00:00Z" }, "te", now);
assert(sweet > huge && sweet > tiny, `sweet-spot channels score highest (${sweet} vs ${huge}, ${tiny})`);
assert(sweet > noEmail && sweet > stale, "public email and recent uploads raise the score");
assert(sweet <= 100 && tiny >= 0, "score stays within 0-100");

const seen: URL[] = [];
const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: string | URL, init?: RequestInit) => {
  const u = new URL(String(input));
  seen.push(u);
  if (init?.headers) throw new Error("API-key requests must not send a bearer token");
  if (u.pathname.endsWith("/search")) {
    const p2 = u.searchParams.get("pageToken") === "p2";
    return Response.json({
      ...(p2 ? {} : { nextPageToken: "p2" }),
      items: p2
        ? [{ snippet: { channelId: "UCtamil", title: "சென்னை vlog", publishedAt: "2026-10-12T00:00:00Z" } }]
        : [
            { snippet: { channelId: "UCgood", title: "తెలుగు phone review", publishedAt: "2026-10-15T00:00:00Z" } },
            { snippet: { channelId: "UCgood", title: "పాత video", publishedAt: "2026-10-01T00:00:00Z" } },
            { snippet: { channelId: "UCbig", title: "తెలుగు news", publishedAt: "2026-10-15T00:00:00Z" } },
            { snippet: { channelId: "UChidden", title: "తెలుగు vlog", publishedAt: "2026-10-15T00:00:00Z" } },
            { snippet: { channelId: "UCmember", title: "తెలుగు tech", publishedAt: "2026-10-15T00:00:00Z" } },
          ],
    });
  }
  if (u.pathname.endsWith("/channels")) {
    const ch = (id: string, subs: number, extra = {}) => ({ id, snippet: { title: id, description: id === "UCgood" ? "Mail: good@ch.in" : "", customUrl: `@${id}` }, statistics: { subscriberCount: String(subs), viewCount: "100000", videoCount: "50", ...extra } });
    return Response.json({ items: [ch("UCgood", 8000), ch("UCbig", 2_000_000), ch("UChidden", 9000, { hiddenSubscriberCount: true }), ch("UCtamil", 9000)] });
  }
  return new Response("?", { status: 404 });
}) as typeof fetch;

const r = await discover({ key: "K" }, { query: "telugu tech", language: "te", minSubs: 1000, maxSubs: 100_000, days: 14, pages: 2 }, new Set(["UCmember"]), now);
const search = seen.find((u) => u.pathname.endsWith("/search"))!;
const sp = search.searchParams;
assert(sp.get("type") === "video" && sp.get("regionCode") === "IN" && sp.get("relevanceLanguage") === "te" && sp.get("order") === "date" && sp.get("key") === "K", "search: recent videos in India, Telugu relevance, API key");
assert(sp.get("publishedAfter") === "2026-10-02T00:00:00.000Z", "search: only uploads in the last 14 days");
const chReq = seen.find((u) => u.pathname.endsWith("/channels"))!;
assert(!chReq.searchParams.get("id")!.includes("UCmember"), "existing Mitra creators are skipped before fetching stats");
assert(r.units === 201 && r.units <= estimateUnits(2), "quota: 2 searches (200) + 1 channels call (1)");
assert(r.candidates.length === 1 && r.candidates[0].channelId === "UCgood", "kept only the in-range, visible, Telugu channel");
const good = r.candidates[0];
assert(good.emails[0] === "good@ch.in" && good.latestVideoTitle === "తెలుగు phone review" && good.language === "te", "latest video, language and public email captured");

seen.length = 0;
globalThis.fetch = (async (input: string | URL, init?: RequestInit) => {
  seen.push(new URL(String(input)));
  const auth = new Headers(init?.headers).get("Authorization");
  if (auth !== "Bearer T") return new Response("no", { status: 401 });
  return Response.json({ items: [] });
}) as typeof fetch;
await discover({ token: "T" }, { query: "x", language: "any", minSubs: 0, maxSubs: 10, days: 7, pages: 1 }, new Set(), now);
assert(!seen[0].searchParams.get("key") && !seen[0].searchParams.get("relevanceLanguage"), "OAuth fallback sends a bearer token; 'any' language sets no relevance filter");
globalThis.fetch = realFetch;

const body = outreachBody("Hi Ravi, loved the night test.", "https://mitra-creators.vercel.app", 93, "Rithvik");
assert(body.includes("93 spots left") && body.includes("reply \"stop\"") && body.endsWith("I won't write again."), "email has the offer and an easy opt-out");
console.log("all prospect tests passed");
process.exit(0);
