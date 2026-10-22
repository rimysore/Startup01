// Run with: npm test. Auto-DM (keyword match, webhook → private reply, once per comment, limits) and the Creator Pass.
process.env.PGLITE_DIR = "memory://";
process.env.INSTAGRAM_APP_ID = "app";
process.env.INSTAGRAM_APP_SECRET = "secret";
const { createHmac } = await import("node:crypto");
const { db, schema } = await import("@/db");
const m = await import("@/lib/marketplace/store");
const so = await import("@/lib/marketplace/social");
const a = await import("@/lib/marketplace/autodm");
const pass = await import("@/lib/marketplace/pass");
const { eq } = await import("drizzle-orm");
const assert = (c: unknown, msg: string) => { if (!c) { console.error("FAIL", msg); process.exit(1); } console.log("ok", msg); };

// Keyword matching and the DM text.
const kw = (keywords: string[], anyComment = false) => ({ keywords, anyComment });
assert(a.matches("I want the DOSA link!", kw(["dosa"])) && a.matches("#dosa please", kw(["DOSA"])) && a.matches("dosa", kw(["dosa"])), "keywords match as words, any case, with a hashtag");
assert(!a.matches("dosas everywhere", kw(["dosa"])) && !a.matches("nice reel", kw(["dosa", "link"])), "but not inside other words, and not without one");
assert(a.matches("ದೋಸೆ ಬೇಕು", kw(["ದೋಸೆ"])) && a.matches("anything", kw([], true)), "Kannada keywords, and reply-to-every-comment");
assert(a.dmText({ message: "Hi {name}! Coupon:", linkUrl: "https://mitra.test/r/ABC" }, "priya") === "Hi @priya! Coupon:\n\nhttps://mitra.test/r/ABC", "the DM names the commenter and puts the link on its own line");
assert(!a.AutomationInput.safeParse({ message: "Hi" }).success && a.AutomationInput.safeParse({ message: "Hi", anyComment: true }).success, "an Auto-DM needs a keyword or reply-to-all");
assert(!a.AutomationInput.safeParse({ message: "Hi", keywords: ["x"], linkUrl: "http://insecure.test" }).success, "links must be https");

// Webhook signatures.
const sign = (raw: string) => `sha256=${createHmac("sha256", "secret").update(raw).digest("hex")}`;
assert(a.validSignature('{"a":1}', sign('{"a":1}')) && !a.validSignature('{"a":2}', sign('{"a":1}')) && !a.validSignature("{}", null), "only Meta-signed webhooks are accepted");

// A creator with Instagram connected (with the DM permissions) and an Auto-DM on one reel.
const d = await db();
const user = async (id: string, role: "creator" | "business") => {
  await d.insert(schema.users).values({ id, email: `${id}@x.com`, name: id });
  await m.joinMarketplace(id, { role, uiLanguage: "en", terms: true, contact: false });
};
await user("sita", "creator");
await user("cafe", "business");
await so.saveInstagramConnection("sita", { igUserId: "17841400000000001", username: "sita.eats", token: "tok", expiresAt: new Date(Date.now() + 50 * 86400_000) });

const calls: { url: string; body: string | null }[] = [];
let failDm = false;
const fake: typeof fetch = async (input, init) => {
  const url = String(input);
  calls.push({ url, body: (init?.body as string) ?? null });
  const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });
  if (url.includes("/subscribed_apps")) return json({ success: true });
  if (url.includes("/me/messages")) return failDm ? json({ error: { message: "(#10) This message is sent outside of allowed window." } }, 400) : json({ recipient_id: "r1", message_id: "m1" });
  if (url.includes("/replies")) return json({ id: "reply1" });
  if (url.includes("/me/media")) return json({ data: [{ id: "reel1", caption: "Best dosa\n#food", media_type: "VIDEO", media_product_type: "REELS", permalink: "https://instagram.com/reel/1", thumbnail_url: "https://cdn/t.jpg", timestamp: "2026-10-10T00:00:00Z" }] });
  return json({ error: { message: "unexpected " + url } }, 400);
};

assert(await a.subscribeComments("sita", fake), "connecting subscribes the account to comment events");
assert(calls.some((c) => c.url.includes("/me/subscribed_apps?subscribed_fields=comments")) && (await so.instagramConnection("sita"))?.subscribedAt, "and remembers it");
const posts = await a.recentPosts("sita", fake);
assert(posts?.[0].id === "reel1" && posts[0].caption === "Best dosa" && posts[0].thumb === "https://cdn/t.jpg", "the creator picks from their recent reels");

const reel = await a.saveAutomation("sita", a.AutomationInput.parse({ mediaId: "reel1", mediaCaption: "Best dosa", keywords: ["DOSA"], message: "Hi {name}! Show this at the counter:", linkUrl: "https://trymitraapp.com/r/RUCHI1", publicReply: "Sent you a DM!" }));
await a.saveAutomation("sita", a.AutomationInput.parse({ keywords: ["link"], message: "Here's my link", linkUrl: "https://sita.example" }));

const comment = (id: string, text: string, media = "reel1", from = { id: "999", username: "priya" }) => ({
  object: "instagram",
  entry: [{ id: "17841400000000001", time: 1, changes: [{ field: "comments", value: { id, text, from, media: { id: media } } }] }],
});

calls.length = 0;
let r = await a.handleWebhook(comment("c1", "DOSA please"), fake);
const dm = calls.find((c) => c.url.includes("/me/messages"));
const sent = JSON.parse(dm?.body ?? "{}");
assert(r[0]?.status === "sent" && sent.recipient.comment_id === "c1" && sent.message.text === "Hi @priya! Show this at the counter:\n\nhttps://trymitraapp.com/r/RUCHI1", "a matching comment gets the private reply with the coupon link");
assert(calls.some((c) => c.url.includes("/c1/replies?") && c.url.includes("Sent+you+a+DM")), "and the public reply under the comment");

calls.length = 0;
r = await a.handleWebhook(comment("c1", "DOSA please"), fake);
assert(r.length === 0 && !calls.some((c) => c.url.includes("/me/messages")), "a redelivered webhook never sends a second DM");
r = await a.handleWebhook(comment("c2", "DOSA", "reel1", { id: "17841400000000001", username: "sita.eats" }), fake);
assert(r.length === 0, "the creator's own comments are ignored");
r = await a.handleWebhook(comment("c3", "lovely reel"), fake);
assert(r.length === 0, "comments without a keyword are ignored");
r = await a.handleWebhook(comment("c4", "send the link", "other-post"), fake);
assert(r[0]?.status === "sent" && JSON.parse(calls.at(-1)?.body ?? "{}").message?.text?.includes("https://sita.example"), "an every-post Auto-DM catches other posts");
r = await a.handleWebhook({ object: "instagram", entry: [{ id: "unknown-account", changes: [{ field: "comments", value: { id: "c5", text: "DOSA" } }] }] }, fake);
assert(r.length === 0, "accounts not on Mitra are ignored");

failDm = true;
r = await a.handleWebhook(comment("c6", "dosa!"), fake);
failDm = false;
const [ev6] = await d.select().from(schema.dmEvents).where(eq(schema.dmEvents.commentId, "c6"));
assert(r[0]?.status === "failed" && ev6.status === "failed" && ev6.error?.includes("allowed window"), "Instagram errors are kept so the creator sees why");

await a.setAutomationActive("sita", reel!.id, false);
r = await a.handleWebhook(comment("c7", "DOSA"), fake);
assert(r.length === 0, "a switched-off Auto-DM does nothing");
await a.setAutomationActive("sita", reel!.id, true);

const list = await a.listAutomations("sita");
const mine = list.find((x) => x.id === reel!.id)!;
assert(mine.sent === 1 && mine.failed === 1 && list.find((x) => x.id !== reel!.id)!.sent === 1, "each Auto-DM shows DMs sent and failed");
assert(!(await a.deleteAutomation("cafe", reel!.id)), "nobody else can delete it");

// Hourly limit.
const now = new Date();
await d.insert(schema.dmEvents).values(Array.from({ length: a.DMS_PER_HOUR }, (_, i) => ({ commentId: `bulk${i}`, automationId: reel!.id, userId: "sita", status: "sent", createdAt: now })));
r = await a.handleWebhook(comment("c8", "DOSA"), fake);
assert(r[0]?.status === "skipped" && r[0].reason === "hourly_limit", "stops at the hourly limit");
await d.delete(schema.dmEvents).where(eq(schema.dmEvents.automationId, reel!.id));

// Coupon links from businesses' tracked posts with this creator.
await d.insert(schema.businessProfiles).values({ userId: "cafe", name: "Ruchi Café", category: "Café", area: "Jayanagar" });
await d.insert(schema.trackedPosts).values({ id: "tp1", businessUserId: "cafe", creatorName: "Sita", creatorUserId: "sita", offerText: "10% off", promoCode: "SITA10", linkCode: "RUCHI1" });
const links = await a.couponLinks("sita");
assert(links.length === 1 && links[0].url.endsWith("/r/RUCHI1") && links[0].label === "Ruchi Café: 10% off", "the creator can put a business's coupon link in the DM");

// Creator Pass.
delete process.env.FREE_UNTIL;
delete process.env.CREATOR_PASS_ENFORCED;
assert((await pass.passState("sita")).status === "launch_free" && (await pass.canUse("sita", "autodm")), "free with no end date set");
process.env.FREE_UNTIL = "2026-11-30";
const before = new Date("2026-11-15T00:00:00Z");
const after = new Date("2026-12-05T00:00:00Z");
assert((await pass.passState("sita", before)).status === "launch_free" && (await pass.passState("sita", after)).status === "first_collab_free", "free in the launch month, then the first collab is free");
await d.insert(schema.deals).values({ id: "deal1", creatorUserId: "sita", businessUserId: "cafe", source: "mitra", counterparty: "Ruchi Café", status: "agreed" });
assert((await pass.passState("sita", after)).status === "needs_pass", "after one collab, the pass is needed");
assert(await pass.canUse("sita", "collab", after), "but nothing is blocked until enforcement is switched on");
process.env.CREATOR_PASS_ENFORCED = "1";
assert(!(await pass.canUse("sita", "collab", after)) && !(await pass.canUse("sita", "autodm", after)), "enforced: no second collab and no Auto-DM without a pass");
r = await a.handleWebhook(comment("c9", "DOSA"), fake, after);
assert(r[0]?.status === "skipped" && r[0].reason === "no_pass", "Auto-DM skips (and says why) without a pass");
await pass.setPassInterest("sita");
assert((await pass.passState("sita", after)).interestAt, "\"I want the Creator Pass\" is recorded");
const until = await pass.grantPass("sita", true, "UPI ref 123", after);
assert(until && until.getFullYear() === 2027 && (await pass.passState("sita", after)).status === "active" && (await pass.canUse("sita", "collab", after)), "an admin switches the pass on for a year");
r = await a.handleWebhook(comment("c10", "DOSA"), fake, after);
assert(r[0]?.status === "sent", "and Auto-DM works again");
await pass.grantPass("sita", false, null, after);
assert((await pass.passState("sita", after)).status === "needs_pass", "and can switch it off");
await user("newbie", "creator");
assert(await pass.canUse("newbie", "collab", after) && !(await pass.canUse("newbie", "autodm", after)), "a new creator's first collab is free even when enforced");
delete process.env.CREATOR_PASS_ENFORCED;

// Disconnecting removes Auto-DM activity.
await so.removeInstagram("sita");
assert((await a.recentEvents("sita")).length === 0 && (await a.listAutomations("sita")).length === 2, "disconnecting deletes the activity, keeping the Auto-DM settings");
console.log("all autodm tests passed");
