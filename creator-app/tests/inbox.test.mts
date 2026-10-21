// Run with: npm test. Offer inbox: scam patterns, sender checks (with a fake network), reports, forwarding, WhatsApp detection.
process.env.PGLITE_DIR = "memory://";
type Fetcher = import("@/lib/marketplace/sender-check").Fetcher;
const { db, schema } = await import("@/db");
const sc = await import("@/lib/marketplace/sender-check");
const ib = await import("@/lib/marketplace/inbox");
const m = await import("@/lib/marketplace/store");
const assert = (c: unknown, msg: string) => { if (!c) { console.error("FAIL", msg); process.exit(1); } console.log("ok", msg); };
const has = (s: { signals: { level: string; text: string }[] }, level: string, re: RegExp) => s.signals.some((x) => x.level === level && re.test(x.text));

// 1. Patterns.
const scams = [
  "Congratulations! You are selected for our brand collab. Pay registration fee of ₹499 to confirm your slot.",
  "Order the product from our site, we will refund the full amount plus ₹500 after your review.",
  "Please share the OTP you received to complete onboarding.",
  "Part time job: like YouTube videos and earn ₹3,000 per day. Each task pays ₹150.",
  "Download our app first to join the campaign: brandcollab.apk",
  "Payment in USDT after posting.",
];
for (const t of scams) assert(sc.decide(sc.patternSignals(t)) === "likely_scam", `scam caught: ${t.slice(0, 48)}…`);
const fair = "Hi! We'd pay ₹6,000 for 1 reel and 2 stories, 50% advance, posted by 2 Nov as a paid partnership.";
assert(sc.patternSignals(fair).length === 0, "a fair offer raises no pattern flags");
assert(sc.decide(sc.patternSignals("Reply within 2 hours, limited slots! Check bit.ly/abc")) === "careful", "urgency and short links mean 'careful', not 'scam'");

// 2. Helpers.
assert(sc.registrable("mail.mamaearth.in") === "mamaearth.in" && sc.registrable("collabs.brand.co.in") === "brand.co.in", "registrable domains");
assert(sc.isFreeMail("x@gmail.com") && !sc.isFreeMail("x@mamaearth.in"), "free mail detected");
assert(JSON.stringify(sc.senderKeys({ email: "A@Brand.com", phone: "+91 98765-43210", handle: "@Brand" })) === JSON.stringify(["email:a@brand.com", "domain:brand.com", "phone:9876543210", "handle:brand"]), "sender keys");
assert(ib.guessBrand("Hi, this is Priya from Mamaearth Beauty about a collab") === "Mamaearth Beauty" && ib.guessBrand("hello", "collabs@bewakoof.com") === "Bewakoof", "brand guessed from text or domain");
assert(ib.looksLikeOffer("Hi! We'd love 1 reel + 2 stories for our café, fee ₹5,000. Interested?") && !ib.looksLikeOffer("How do I get more views on my reels?"), "WhatsApp: offers detected, questions left alone");
const fwd = ib.parseForwarded("FYI\n\n---------- Forwarded message ---------\nFrom: Priya Shah <priya@mamaearth.in>\nDate: Mon, 20 Oct 2026\nSubject: Collab with Mamaearth\nTo: me@gmail.com\n\nHi! We'd pay ₹8,000 for a reel.\n");
assert(fwd.email === "priya@mamaearth.in" && fwd.name === "Priya Shah" && fwd.subject === "Collab with Mamaearth" && fwd.text.startsWith("Hi! We'd pay"), "forwarded email: real sender and message extracted");
assert(ib.parseForwarded("just text").email === null, "not forwarded: nothing invented");

// 3. Public records, with a fake network.
const now = Date.UTC(2026, 9, 21);
const fake = (map: Record<string, unknown>) => (async (url: string) => {
  const key = Object.keys(map).find((k) => url.includes(k));
  return key ? new Response(JSON.stringify(map[key]), { status: 200 }) : new Response("nope", { status: 404 });
}) as Fetcher;
const net = fake({
  "rdap.org/domain/mamaearth.in": { events: [{ eventAction: "registration", eventDate: "2015-03-01T00:00:00Z" }] },
  "rdap.org/domain/mamaearth-collabs.in": { events: [{ eventAction: "registration", eventDate: "2026-10-01T00:00:00Z" }] },
  "dns-query?name=mamaearth.in": { Status: 0, Answer: [{ type: 15 }] },
  "dns-query?name=mamaearth-collabs.in": { Status: 0, Answer: [] },
  "wbsearchentities&search=Mamaearth": { search: [{ id: "Q1", label: "Mamaearth", description: "Indian personal care brand" }] },
  "wbgetentities&ids=Q1": { entities: { Q1: { claims: { P856: [{ mainsnak: { datavalue: { value: "https://mamaearth.in" } } }] } } } },
});
const real = await sc.checkSender({ text: fair, email: "priya@mamaearth.in", brand: "Mamaearth" }, { fetcher: net, now });
assert(real.verdict === "looks_ok" && has(real, "good", /since 2015/) && has(real, "good", /official domain/) && real.brand?.description === "Indian personal care brand", "real brand: old domain, matches its official website");
const fakeBrand = await sc.checkSender({ text: fair, email: "team@mamaearth-collabs.in", brand: "Mamaearth" }, { fetcher: net, now });
assert(fakeBrand.verdict === "likely_scam" && has(fakeBrand, "bad", /registered only 20 days ago/) && has(fakeBrand, "bad", /lookalike/) && has(fakeBrand, "warn", /isn't set up to receive email/), "lookalike brand: new domain, no mail, not the official site");
const gmailBrand = await sc.checkSender({ text: fair, email: "mamaearth.collabs@gmail.com", brand: "Mamaearth" }, { fetcher: net, now });
assert(gmailBrand.verdict === "careful" && has(gmailBrand, "warn", /free email address/), "big brand from Gmail: careful");
const offline = await sc.checkSender({ text: fair, email: "x@unknown-shop.in" }, { fetcher: (async () => { throw new Error("down"); }) as Fetcher, now });
assert(offline.verdict === "unknown" && offline.signals.length === 0, "lookups failing never breaks the check");
const cachedHit = await sc.domainRegistered("mamaearth.in", (async () => { throw new Error("should use cache"); }) as Fetcher);
assert(cachedHit === "2015-03-01T00:00:00Z", "lookups are cached");

// 4. Inbox, reports and Mitra's records.
const d = await db();
for (const id of ["c1", "c2", "c3", "biz"]) {
  await d.insert(schema.users).values({ id, email: id === "biz" ? "owner@ruchicafe.in" : `${id}@x.com` });
  await m.joinMarketplace(id, { role: id === "biz" ? "business" : "creator", uiLanguage: "en", terms: true, contact: false });
}
const scamText = "Dear influencer, pay registration fee ₹999 to join our paid campaign. Contact scammy@gmail.com";
const o1 = await ib.addToInbox("c1", { source: "paste", body: scamText }, { online: false });
assert(o1.senderEmail === "scammy@gmail.com" && (ib.verdictOf(o1)?.verdict === "likely_scam") && o1.checks.length > 0, "inbox offer saved with both checks; sender email found in the text");
await ib.reportInboxSender("c1", o1.id, "scam");
const o2 = await ib.addToInbox("c2", { source: "whatsapp", body: "Paid collab for 1 reel, fee ₹3,000", senderEmail: "scammy@gmail.com" }, { online: false });
assert(!ib.verdictOf(o2)?.signals.some((s) => /reported this sender/.test(s.text)), "one report alone is not shown");
await ib.reportInboxSender("c2", o2.id, "scam");
const o3 = await ib.addToInbox("c3", { source: "email", body: "Paid collab for 1 reel, fee ₹3,000", senderEmail: "SCAMMY@gmail.com" }, { online: false });
assert(ib.verdictOf(o3)?.verdict === "likely_scam" && ib.verdictOf(o3)!.signals.some((s) => /2 creators on Mitra reported/.test(s.text)), "two creators' reports warn the next one");
assert((await ib.getInboxOffer("c2", o1.id)) === null && !(await ib.reportInboxSender("c2", o1.id, "ok")), "inbox offers are private");
assert((await ib.getInboxOffer("c1", o1.id))?.status === "dismissed", "reporting a scam dismisses it");

const dealId = await ib.saveToDeals("c2", o2.id);
const deal = await m.getDeal("c2", dealId!);
assert(deal?.feeInr === 3000 && deal.deliverables === "1 reel" && (await ib.getInboxOffer("c2", o2.id))?.status === "saved" && (await ib.saveToDeals("c2", o2.id)) === dealId, "saving to the deal log pre-fills it, once");

// A business that has paid creators through Mitra is vouched for.
await d.insert(schema.deals).values({ id: "d-paid", creatorUserId: "c3", businessUserId: "biz", source: "mitra", counterparty: "Ruchi Café", status: "paid" });
const o4 = await ib.addToInbox("c1", { source: "email", body: "₹5,000 for a reel at our café", senderEmail: "owner@ruchicafe.in" }, { online: false });
assert(ib.verdictOf(o4)?.signals.some((s) => s.level === "good" && /paid 1 creator through Mitra/.test(s.text)), "businesses that paid creators on Mitra show it");

// Forwarding tokens.
const tok = await ib.inboxToken("c1");
assert(tok === (await ib.inboxToken("c1")) && (await ib.userForToken(tok)) === "c1" && (await ib.userForToken("../x")) === null, "forwarding token is stable and private");
assert((await ib.inboxCountToday("c1", "paste")) === 1, "daily count per source");
console.log("all inbox tests passed");
