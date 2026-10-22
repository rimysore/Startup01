// Run with: npm test. Verifying creators' accounts: YouTube channel snapshot and Instagram Login (fake network).
process.env.PGLITE_DIR = "memory://";
process.env.INSTAGRAM_APP_ID = "app";
process.env.INSTAGRAM_APP_SECRET = "secret";
const { db, schema } = await import("@/db");
const m = await import("@/lib/marketplace/store");
const so = await import("@/lib/marketplace/social");
const { eq } = await import("drizzle-orm");
const assert = (c: unknown, msg: string) => { if (!c) { console.error("FAIL", msg); process.exit(1); } console.log("ok", msg); };

const d = await db();
await d.insert(schema.users).values({ id: "cr", email: "cr@x.com" });
await m.joinMarketplace("cr", { role: "creator", uiLanguage: "kn", terms: true, contact: false });

// YouTube.
const yt = so.youtubeVerified({
  id: "UC1", title: "Sita Eats", handle: "@sitaeats", avatar: "https://yt/a.jpg", subscribers: 24100, totalViews: 3_200_000, videoCount: 212,
  recent: [
    { id: "v1", title: "Dosa trail", publishedAt: "2026-10-01T00:00:00Z", views: 18000, likes: 900, comments: 100 },
    { id: "v2", title: "Filter coffee", publishedAt: "2026-09-25T00:00:00Z", views: 9000, likes: 400, comments: 50 },
    { id: "v3", title: "Benne dosa", publishedAt: "2026-09-18T00:00:00Z", views: 12000, likes: 500, comments: 60 },
  ],
});
assert(yt.followers === 24100 && yt.avgViews === 12000 && yt.stats.posts === 212 && yt.stats.totalViews === 3_200_000, "YouTube: subscribers, median views of recent uploads, videos, total views");
assert(yt.stats.avgEngagement === 670 && yt.stats.recent[0].url === "https://www.youtube.com/watch?v=v1" && yt.profileUrl === "https://www.youtube.com/@sitaeats", "YouTube: engagement per video, links to videos and channel");
const h = await so.saveVerifiedHandle("cr", "youtube", yt);
assert(h.verifiedBy === "youtube_connection" && h.followers === 24100 && h.stats?.recent.length === 3, "verified YouTube numbers saved");

// Instagram: fake Instagram endpoints.
const calls: string[] = [];
const fake: typeof fetch = async (input) => {
  const url = String(input);
  calls.push(url.split("?")[0]);
  const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });
  if (url.startsWith("https://api.instagram.com/oauth/access_token")) return json({ access_token: "short", user_id: 1789 });
  if (url.includes("/access_token?") && url.includes("ig_exchange_token")) return json({ access_token: "long-token", expires_in: 60 * 86400 });
  if (url.includes("/refresh_access_token")) return json({ access_token: "refreshed", expires_in: 60 * 86400 });
  if (url.includes("/me/media")) return json({ data: [
    { id: "m1", caption: "Best benne dosa in Basavanagudi\n#food", media_product_type: "REELS", permalink: "https://instagram.com/reel/m1", timestamp: "2026-10-10T00:00:00Z", like_count: 1200, comments_count: 80 },
    { id: "m2", caption: "", media_type: "IMAGE", permalink: "https://instagram.com/p/m2", timestamp: "2026-10-05T00:00:00Z", like_count: 400, comments_count: 20 },
  ] });
  if (url.includes("/me?")) return json({ user_id: "1789", username: "sita.eats", account_type: "MEDIA_CREATOR", profile_picture_url: "https://ig/p.jpg", followers_count: 18400, follows_count: 310, media_count: 356 });
  return json({ error: { message: "unexpected" } }, 400);
};
const ex = await so.instagramExchange("code", "http://localhost:3000", fake);
assert(ex.token === "long-token" && ex.userId === "1789" && ex.expiresAt.getTime() > Date.now() + 59 * 86400_000, "Instagram: code → long-lived token");
const snap = await so.instagramSnapshot(ex.token, fake);
const ig = so.instagramVerified(snap);
assert(ig.followers === 18400 && ig.stats.posts === 356 && ig.stats.following === 310 && ig.avgViews === null, "Instagram: followers, posts, following; no views on this API");
assert(ig.stats.avgEngagement === 850 && ig.stats.recent[0].title === "Best benne dosa in Basavanagudi" && ig.stats.recent[1].title === "Post", "Instagram: engagement per post, first caption line as the title");
assert(ig.profileUrl === "https://www.instagram.com/sita.eats/" && ig.verifiedBy === "instagram_connection", "Instagram: profile link");
assert(!calls.some((c) => c.includes("insights")), "only public profile fields are read, no insights");
await so.saveInstagramConnection("cr", { igUserId: ex.userId, username: "sita.eats", token: ex.token, expiresAt: ex.expiresAt });
const [row] = await d.select().from(schema.instagramConnections).where(eq(schema.instagramConnections.userId, "cr"));
assert(row.accessToken !== "long-token", "the token is stored encrypted");
assert((await so.instagramToken("cr", fake)) === "long-token", "a fresh token is used as is");
await d.update(schema.instagramConnections).set({ expiresAt: new Date(Date.now() + 3 * 86400_000) }).where(eq(schema.instagramConnections.userId, "cr"));
assert((await so.instagramToken("cr", fake)) === "refreshed", "a token with under a week left is refreshed");
await d.update(schema.instagramConnections).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(schema.instagramConnections.userId, "cr"));
assert((await so.instagramToken("cr", fake)) === null, "an expired token means connect again");
await so.saveVerifiedHandle("cr", "instagram", ig);
const kit = await m.getKit("cr");
assert(kit.handles.some((x) => x.platform === "instagram" && x.followers === 18400 && x.verifiedBy === "instagram_connection"), "verified Instagram numbers on the kit");

// Instagram errors come through readably.
const bad: typeof fetch = async () => new Response(JSON.stringify({ error: { message: "Invalid OAuth access token" } }), { status: 400 });
let msg = "";
await so.instagramSnapshot("x", bad).catch((e: Error) => (msg = e.message));
assert(msg.includes("Invalid OAuth"), "Instagram errors are readable");

// Disconnect.
await so.removeInstagram("cr");
assert(!(await so.instagramConnection("cr")), "disconnect removes the token");
const after = (await m.getKit("cr")).handles.find((x) => x.platform === "instagram")!;
assert(!after.verifiedAt && after.followers === null && after.stats === null && after.handle === "sita.eats", "and the verified numbers, keeping the handle");
console.log("all social tests passed");
