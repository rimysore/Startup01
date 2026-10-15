// Run with: npm test. Language detection, YouTube report requests/parsing and the image model request, with fetch stubbed.
process.env.PGLITE_DIR = "memory://";
process.env.FAL_KEY = "test-fal-key";
const { detectLanguage, matchesLanguage } = await import("@/lib/languages");
const { fetchAudience, fetchTrending } = await import("@/lib/youtube");
const { generateBackground, UnsafeImage } = await import("@/lib/images");
const { annotate } = await import("@/lib/trends");
const assert = (c: unknown, m: string) => { if (!c) { console.error("FAIL", m); process.exit(1); } console.log("ok", m); };

// ---- Language detection ----
const cases: [string, string | null, string | null][] = [
  ["దసరా స్పెషల్ బిర్యానీ 🔥 హైదరాబాద్ స్టైల్", null, "te"],
  ["ராத்திரி 11 மணிக்கு Chennai Marina-ல என்ன நடக்குது?", null, "ta"],
  ["₹15,000 में सबसे अच्छा कैमरा फोन?", null, "hi"],
  ["गणपती बाप्पा मोरया आरती", "mr", "mr"],
  ["Bhai ye game toh next level hai 😂", null, "hinglish"],
  ["Phone review in Lucknow", "hi", "hinglish"],
  ["IPL auction recap: who won big?", "en", "en"],
  ["IPL auction recap", null, "en"],
  ["ಬೆಂಗಳೂರು ಟ್ರಾಫಿಕ್ ಸತ್ಯ", null, "kn"],
  ["অষ্টমীর ভোগ রেসিপি", null, "bn"],
  ["മഴക്കാലത്ത് മൂന്നാർ യാത്ര", null, "ml"],
  ["🔥🔥🔥", "te", "te"],
];
for (const [title, audio, want] of cases) assert(detectLanguage(title, audio) === want, `detect ${want}: ${title.slice(0, 30)}`);
assert(matchesLanguage("te", "ఈ ఫోన్ చాలా బాగుంది, CTR పెరిగింది"), "Telugu text with English terms passes the Telugu check");
assert(!matchesLanguage("te", "This phone is very good"), "English text fails the Telugu check");
assert(matchesLanguage("hinglish", "Ye phone kaisa hai bhai"), "Roman Hinglish passes");
assert(!matchesLanguage("hinglish", "यह फोन कैसा है"), "Devanagari fails the Hinglish check");

// ---- YouTube requests (fetch stubbed) ----
const seen: string[] = [];
const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: string | URL) => {
  const url = String(input);
  seen.push(url);
  const u = new URL(url);
  if (u.pathname.endsWith("/videos") && u.searchParams.get("chart") === "mostPopular") {
    const page2 = u.searchParams.get("pageToken") === "p2";
    return Response.json({
      ...(page2 ? {} : { nextPageToken: "p2" }),
      items: [{ id: page2 ? "b" : "a", snippet: { title: page2 ? "దసరా బిర్యానీ" : "Bhai kya scene hai", channelTitle: "C", categoryId: "24", defaultAudioLanguage: page2 ? "te" : undefined, publishedAt: new Date(Date.now() - 10 * 3_600_000).toISOString() }, statistics: { viewCount: "100000" }, contentDetails: { duration: "PT10M" } }],
    });
  }
  const dims = u.searchParams.get("dimensions");
  const rows: Record<string, unknown[][]> = {
    country: [["IN", 900, 4000], ["AE", 50, 300]],
    "city,country": [["Hyderabad", "IN", 400, 2000]],
    insightTrafficSourceType: [["YT_SEARCH", 600, 3000], ["SHORTS", 200, 100]],
    insightTrafficSourceDetail: [["dasara biryani recipe", 120]],
    "ageGroup,gender": [["age18-24", "male", 40.5]],
    subscribedStatus: [["UNSUBSCRIBED", 800]],
  };
  if (dims === "ageGroup,gender") return new Response("forbidden", { status: 403 }); // a part with no data must not break the rest
  return Response.json({ columnHeaders: [], rows: rows[dims ?? ""] ?? [] });
}) as typeof fetch;
const tokens = { accessToken: "x", expiresAt: Date.now() + 3_600_000 };

const trending = await fetchTrending(tokens, "IN", 2);
assert(trending.length === 2 && seen.filter((s) => s.includes("chart=mostPopular")).length === 2, "trending: 2 pages of the India chart (2 quota units)");
assert(seen[0].includes("regionCode=IN") && seen[0].includes("maxResults=50"), "trending request uses regionCode=IN, 50 per page");
const items = annotate(trending);
assert(items[0].detected === "hinglish" && items[1].detected === "te", "trending videos get a language");
assert(items[0].velocity === 10000, "views per hour computed");

seen.length = 0;
const aud = await fetchAudience(tokens, { videoId: "vid123" });
const q = (dims: string) => new URL(seen.find((s) => new URL(s).searchParams.get("dimensions") === dims)!).searchParams;
assert(q("city,country").get("sort") === "-views" && Number(q("city,country").get("maxResults")) <= 250, "city report sets sort and maxResults ≤ 250 as YouTube requires");
assert(q("insightTrafficSourceDetail").get("filters") === "video==vid123;insightTrafficSourceType==YT_SEARCH", "search terms: filtered to YT_SEARCH and the video");
assert(Number(q("insightTrafficSourceDetail").get("maxResults")) <= 25 && q("insightTrafficSourceDetail").get("sort") === "-views", "search terms: maxResults ≤ 25 with sort");
assert(q("country").get("filters") === "video==vid123", "per-video filter applied");
assert(aud.cities[0].city === "Hyderabad" && aud.searchTerms[0].term === "dasara biryani recipe" && aud.sources.length === 2, "audience rows parsed");
assert(aud.demographics.length === 0 && aud.countries.length === 2, "a failing part comes back empty without hiding the others");

// ---- Image model request ----
let falBody: Record<string, unknown> = {};
let falAuth = "";
let flagged = false;
globalThis.fetch = (async (input: string | URL, init?: RequestInit) => {
  const url = String(input);
  if (url === "https://fal.run/fal-ai/flux-1/schnell") {
    falBody = JSON.parse(String(init?.body));
    falAuth = new Headers(init?.headers).get("Authorization") ?? "";
    return Response.json({ images: [{ url: "https://fal.media/x.jpg", content_type: "image/jpeg" }], has_nsfw_concepts: [flagged], seed: 42 });
  }
  if (url === "https://fal.media/x.jpg") return new Response(new Uint8Array([255, 216, 255]), { headers: { "content-type": "image/jpeg" } });
  return new Response("?", { status: 404 });
}) as typeof fetch;
const img = await generateBackground("Rainy Hyderabad street at night");
assert(falAuth === "Key test-fal-key", "fal auth header is 'Key <FAL_KEY>'");
assert(falBody.image_size === "landscape_16_9" && falBody.num_inference_steps === 4 && falBody.enable_safety_checker === true, "16:9, 4 steps, safety checker on");
assert(String(falBody.prompt).includes("No text"), "prompt asks for no text (the canvas draws the words)");
assert(img.seed === 42 && img.contentType === "image/jpeg", "image streamed back with its seed");
flagged = true;
let unsafe = false;
try { await generateBackground("x"); } catch (e) { unsafe = e instanceof UnsafeImage; }
assert(unsafe, "flagged image is refused");
globalThis.fetch = realFetch;
console.log("all insight tests passed");
process.exit(0);
