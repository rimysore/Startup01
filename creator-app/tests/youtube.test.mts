// Run with: npm test. Exercises the YouTube cache, token refresh and comment filter against a fresh embedded database.
process.env.PGLITE_DIR = "memory://";
process.env.GOOGLE_CLIENT_ID = "test";
process.env.GOOGLE_CLIENT_SECRET = "test";
const { db, schema } = await import("@/db");
const { cached, forgetUser } = await import("@/lib/memo");
const { saveYouTubeConnection, youtubeTokens, youtubeConnection } = await import("@/lib/youtube");
const { prepareComments } = await import("@/lib/comment-filter");
const { eq } = await import("drizzle-orm");
const assert = (c: unknown, m: string) => { if (!c) { console.error("FAIL", m); process.exit(1); } console.log("ok", m); };

const d = await db();
await d.insert(schema.users).values({ id: "u1", email: "a@b.c" });

// ---- Cache --------------------------------------------------------------------------
let calls = 0;
const load = async () => { calls++; await new Promise((r) => setTimeout(r, 20)); return { views: calls }; };
const [a, b] = await Promise.all([cached("u1", "summary", 60_000, load), cached("u1", "summary", 60_000, load)]);
assert(calls === 1 && a.value.views === 1 && b.value.views === 1, "two requests at once share one YouTube call");
await cached("u1", "summary", 60_000, load);
assert(calls === 1, "second request served from memory");
await cached("u1", "summary", 60_000, load, { force: true });
assert(calls === 1, "Refresh within a minute of the last fetch doesn't call YouTube again");
const [row] = await d.select().from(schema.youtubeCache).where(eq(schema.youtubeCache.key, "u1:summary"));
assert(row && !row.value.includes("views"), "stored in Postgres, encrypted");

// Another server instance has an empty memory but shares Postgres.
const mem = await d.select().from(schema.youtubeCache).where(eq(schema.youtubeCache.key, "u1:summary"));
assert(mem.length === 1 && mem[0].keepUntil > mem[0].expiresAt, "row kept past its fresh time as a fallback copy");

// Expire it, then make YouTube fail: we should get the old copy, marked stale.
await cached("u1", "retention", 1, async () => [1, 2, 3]);
await new Promise((r) => setTimeout(r, 5));
const stale = await cached("u1", "retention", 1, async () => { throw new Error("quotaExceeded"); });
assert(stale.stale && JSON.stringify(stale.value) === "[1,2,3]", "YouTube failure serves the last good copy, marked stale");

let threw = false;
try { await cached("u1", "never-fetched", 1, async () => { throw new Error("down"); }); } catch { threw = true; }
assert(threw, "no copy at all: the error is passed on");

await forgetUser("u1");
const left = await d.select().from(schema.youtubeCache).where(eq(schema.youtubeCache.userId, "u1"));
assert(left.length === 0, "disconnect deletes the user's cached YouTube data");

// ---- Token refresh --------------------------------------------------------------------
const realFetch = globalThis.fetch;
let tokenCalls = 0;
let reply: () => Response = () => Response.json({ access_token: "new", expires_in: 3600 });
globalThis.fetch = (async () => { tokenCalls++; await new Promise((r) => setTimeout(r, 20)); return reply(); }) as typeof fetch;

await saveYouTubeConnection("u1", { accessToken: "old", refreshToken: "r1", expiresAt: Date.now() + 60_000 }, { id: "UC1", title: "Ch" });
const toks = await Promise.all([youtubeTokens("u1"), youtubeTokens("u1"), youtubeTokens("u1")]);
assert(tokenCalls === 1 && toks.every((t) => t?.accessToken === "new"), "token near expiry: three requests share one refresh");
assert((await youtubeTokens("u1"))?.accessToken === "new" && tokenCalls === 1, "fresh token reused without calling Google");

await saveYouTubeConnection("u1", { accessToken: "old", refreshToken: "r1", expiresAt: Date.now() - 1 });
reply = () => new Response('{"error":"invalid_grant","error_description":"Token has been expired or revoked."}', { status: 400 });
assert((await youtubeTokens("u1")) === null, "revoked refresh token returns no tokens instead of crashing");
assert((await youtubeConnection("u1"))?.needsReconnectAt, "connection flagged as needing reconnect");
tokenCalls = 0;
await youtubeTokens("u1");
assert(tokenCalls === 0, "flagged connection doesn't keep hammering Google");
await saveYouTubeConnection("u1", { accessToken: "a2", refreshToken: "r2", expiresAt: Date.now() + 3_600_000 });
assert(!(await youtubeConnection("u1"))?.needsReconnectAt && (await youtubeTokens("u1"))?.accessToken === "a2", "reconnecting clears the flag");

reply = () => new Response("server error", { status: 500 });
await saveYouTubeConnection("u1", { accessToken: "a3", refreshToken: "r3", expiresAt: Date.now() - 1 });
threw = false;
try { await youtubeTokens("u1"); } catch { threw = true; }
assert(threw && !(await youtubeConnection("u1"))?.needsReconnectAt, "temporary Google error is not treated as revoked");
globalThis.fetch = realFetch;

// ---- Comment filter ---------------------------------------------------------------------
const input = [
  { author: "A", text: "Battery test was so useful, please do camera next", likes: 5 },
  { author: "B", text: "battery test was so useful,   please do camera next", likes: 1 },
  { author: "C", text: "🔥🔥🔥", likes: 9 },
  { author: "D", text: "nice", likes: 0 },
  { author: "E", text: "Earn 50k/day join telegram t.me/scam", likes: 0 },
  { author: "F", text: "Contact on WhatsApp +91 98765 43210", likes: 0 },
  { author: "G", text: "कैमरा टेस्ट कब आएगा भाई?", likes: 20 },
  { author: "H", text: "x".repeat(900) + " end", likes: 2 },
];
const out = prepareComments(input);
const lines = out.split("\n");
assert(lines[0].startsWith("G: कैमरा"), "most-liked comment first, Hindi text kept");
assert(!out.includes("t.me") && !out.includes("98765") && out.includes("2 link or phone-number spam"), "spam removed and counted");
assert(lines.filter((l) => /battery test/i.test(l)).length === 1, "duplicate comment removed");
assert(out.includes("plus 2 short reactions") && !out.includes("🔥🔥🔥"), "emoji and one-word reactions folded into one line");
assert(lines.every((l) => l.length < 360), "long comments trimmed");
const sixty = Array.from({ length: 60 }, (_, i) => ({ author: `u${i}`, text: `real comment number ${i} about the video`, likes: i }));
assert(prepareComments(sixty).split("\n").length === 40, "at most 40 comments sent to the AI");
const before = sixty.map((c) => `${c.author}: ${c.text} [${c.likes}]`).join("\n").length;
console.log(`   60 comments: ${before} chars before, ${prepareComments(sixty).length} after`);
console.log("all youtube tests passed");
process.exit(0);
