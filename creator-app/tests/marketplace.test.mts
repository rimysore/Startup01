// Run with: npm test. Marketplace phase 1: joining, media kits, verification, the deal log and rate ranges.
process.env.PGLITE_DIR = "memory://";
const { db, schema } = await import("@/db");
const m = await import("@/lib/marketplace/store");
const { eq } = await import("drizzle-orm");
const assert = (c: unknown, msg: string) => { if (!c) { console.error("FAIL", msg); process.exit(1); } console.log("ok", msg); };

const d = await db();
for (const id of ["c1", "c2", "b1"]) await d.insert(schema.users).values({ id, email: `${id}@x.com` });

// Joining needs the Terms; consents are logged with their wording version.
assert(!m.JoinInput.safeParse({ role: "creator", uiLanguage: "kn", terms: false }).success, "joining without accepting the Terms is refused");
await m.joinMarketplace("c1", m.JoinInput.parse({ role: "creator", uiLanguage: "kn", terms: true }));
const consents = await d.select().from(schema.consents).where(eq(schema.consents.userId, "c1"));
assert((await m.getMember("c1"))?.uiLanguage === "kn" && consents.length === 2 && consents.every((c) => c.version), "member saved with language, consents logged");

// Media kit: slug, handles cleaned, self-reported by default.
const kit = m.KitInput.parse({
  displayName: "Ruchi Trails",
  bio: "Kannada food from Jayanagar",
  area: "Jayanagar",
  niches: ["food"],
  languages: ["kn", "en"],
  handles: [
    { platform: "instagram", handle: "https://instagram.com/ruchi.trails/", followers: "18400" },
    { platform: "youtube", handle: "@ruchitrails", followers: 6200 },
  ],
  rates: [{ deliverable: "reel", priceInr: 4000 }, { deliverable: "story", priceInr: 0 }],
  contactEmail: "",
  isPublic: true,
});
const p = await m.saveKit("c1", kit);
let k = await m.getKit("c1");
assert(p.slug === "ruchi-trails" && p.rates.length === 1, "slug from the name; zero rates dropped");
assert(k.handles.find((h) => h.platform === "instagram")?.handle === "ruchi.trails" && k.handles.every((h) => !m.isVerified(h)), "handle cleaned from a URL; numbers start self-reported");
assert((await m.getPublicKit("ruchi-trails"))?.profile.displayName === "Ruchi Trails", "public kit readable by slug");

// Verification through YouTube overwrites the typed number and survives a re-save, but not a handle change.
await m.verifyYouTubeHandle("c1", { title: "Ruchi Trails", subscribers: 6123 });
await m.saveKit("c1", { ...kit, handles: [kit.handles[0], { platform: "youtube", handle: "Ruchi Trails", followers: 99999, avgViews: null }] });
k = await m.getKit("c1");
let yt = k.handles.find((h) => h.platform === "youtube")!;
assert(m.isVerified(yt) && yt.followers === 6123, "a verified count can't be overwritten by typing");
await m.saveKit("c1", { ...kit, handles: [kit.handles[0], { platform: "youtube", handle: "someone-else", followers: 99999, avgViews: null }] });
yt = (await m.getKit("c1")).handles.find((h) => h.platform === "youtube")!;
assert(!m.isVerified(yt) && yt.followers === 99999, "changing the handle drops verification");
assert(!m.isVerified({ verifiedAt: new Date(Date.now() - 31 * 86_400_000) }), "verification lapses after 30 days");
await m.saveKit("c1", { ...kit, handles: [kit.handles[0]] });
assert((await m.getKit("c1")).handles.length === 1, "handles left out are removed");

// Slugs stay unique.
await m.joinMarketplace("c2", { role: "creator", uiLanguage: "en", terms: true, contact: false });
assert((await m.saveKit("c2", { ...kit, isPublic: false })).slug === "ruchi-trails-2", "a second creator with the same name gets a new slug");
assert((await m.getPublicKit("ruchi-trails-2")) === null, "private kits are not public");
assert(m.kitCompleteness(p, k.handles) > 70 && m.kitCompleteness(null, []) === 0, "completeness reflects what's filled in");

// Deal log: checks stored, ownership enforced, outcome and totals.
const deal = await m.createDeal("c1", m.NewDealInput.parse({ counterparty: "A dosa café", offerText: "1 reel + 2 stories for ₹6,000, post by 2 Nov", feeInr: "6000" }));
assert(deal.checks.some((c) => c.term === "pay" && c.state === "ok") && deal.status === "offered" && deal.source === "own", "a saved offer keeps the checker's result");
assert((await m.getDeal("c2", deal.id)) === null && !(await m.updateDeal("c2", deal.id, { status: "paid" })) && !(await m.deleteDeal("c2", deal.id)), "another creator can't read, change or delete it");
await m.updateDeal("c1", deal.id, m.UpdateDealInput.parse({ status: "paid", outcome: { promoCode: "DOSA10", redemptions: 38, paidInr: 6000, paidAt: "2026-11-05" } }));
const full = await m.getDeal("c1", deal.id);
assert(full?.status === "paid" && full.outcome?.paidInr === 6000 && full.outcome.redemptions === 38, "status and outcome saved");
await m.createDeal("c1", { counterparty: "A salon", source: "own", feeInr: 3000, offerText: null, deliverables: null, barter: null, paymentTerms: null, usageTerms: null, notes: null });
const totals = m.dealTotals(await m.listDeals("c1"));
assert(totals.earned === 6000 && totals.open === 1 && totals.count === 2, "totals: earned counts only money received");

// Business profile: budget order checked.
assert(!m.BusinessInput.safeParse({ name: "Café", budgetMinInr: 20000, budgetMaxInr: 5000 }).success, "budget 'from' above 'to' is refused");
await m.joinMarketplace("b1", { role: "business", uiLanguage: "en", terms: true, contact: true });
assert((await m.saveBusiness("b1", m.BusinessInput.parse({ name: "Dosa Corner", area: "Jayanagar", budgetMinInr: "5000" }))).budgetMinInr === 5000, "business profile saved");

// Rate range: hidden below 5 creators, then the middle half.
assert((await m.rateRange("c1", "reel", ["food"])) === null, "no range from fewer than 5 creators");
for (let i = 0; i < 6; i++) {
  await d.insert(schema.users).values({ id: `r${i}`, email: `r${i}@x.com` });
  await m.saveKit(`r${i}`, { ...kit, displayName: `Food ${i}`, rates: [{ deliverable: "reel", priceInr: 2000 + i * 1000 }], isPublic: false });
}
const range = await m.rateRange("c1", "reel", ["food"]);
assert(range && range.n === 7 && range.low >= 2000 && range.high <= 7000 && range.low < range.high, "range from similar creators, excluding the asker");

// Deleting the account removes everything.
await d.delete(schema.users).where(eq(schema.users.id, "c1"));
assert((await m.listDeals("c1")).length === 0 && (await m.getKit("c1")).profile === null && (await m.getMember("c1")) === null, "account deletion removes kit, deals and membership");
console.log("all marketplace tests passed");
