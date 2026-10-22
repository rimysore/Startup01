// Run with: npm test. Marketplace business side: briefs, matching, plan, invites, deal room, results, tracked links.
process.env.PGLITE_DIR = "memory://";
const { db, schema } = await import("@/db");
const m = await import("@/lib/marketplace/store");
const b = await import("@/lib/marketplace/business");
const { eq } = await import("drizzle-orm");
const assert = (c: unknown, msg: string) => { if (!c) { console.error("FAIL", msg); process.exit(1); } console.log("ok", msg); };

const d = await db();
const user = async (id: string, role: "creator" | "business") => {
  await d.insert(schema.users).values({ id, email: `${id}@x.com` });
  await m.joinMarketplace(id, { role, uiLanguage: "en", terms: true, contact: false });
};
const kit = (name: string, extra: Partial<Parameters<typeof m.saveKit>[1]> = {}) =>
  m.KitInput.parse({ displayName: name, niches: ["food"], languages: ["kn"], area: "Jayanagar", rates: [{ deliverable: "reel", priceInr: 4000 }], openToOffers: true, contactEmail: `${name.split(" ")[0].toLowerCase()}@kit.com`, whatsapp: "+91 98765 43210", ...extra });

await user("biz", "business");
await m.saveBusiness("biz", m.BusinessInput.parse({ name: "Ruchi Dosa Café", area: "Jayanagar", website: "https://ruchi.example" }));
for (const [id, k] of [
  ["sr", kit("Sita Rao")],
  ["ak", kit("Arun Kumar", { area: "Malleshwaram", rates: [{ deliverable: "reel", priceInr: 3000 }] })],
  ["far", kit("Far Away", { area: "Whitefield", niches: ["tech"] })],
  ["pricey", kit("Big Star", { rates: [{ deliverable: "reel", priceInr: 90000 }] })],
  ["shy", kit("Not Looking", { openToOffers: false })],
  ["noprice", kit("New Face", { rates: [] })],
] as const) {
  await user(id, "creator");
  await m.saveKit(id, k);
}
await m.verifyYouTubeHandle("ak", { title: "Arun Eats", subscribers: 61000 });
const consent = await d.select().from(schema.consents).where(eq(schema.consents.kind, "matching"));
assert(consent.length === 5, "switching on 'let businesses find me' is logged as a consent");
assert(!m.KitInput.safeParse({ displayName: "X", whatsapp: "12" }).success, "a WhatsApp number must look like one");

// Brief validation.
assert(!b.BriefInput.safeParse({ goal: "More lunch orders", deliverables: ["reel"], budgetInr: 10000, destinationUrl: "javascript:alert(1)" }).success, "tracked links must be https");
assert(!b.BriefInput.safeParse({ goal: "More lunch orders", deliverables: [], budgetInr: 10000 }).success, "a brief asks for at least one deliverable");
const brief = await b.createBrief("biz", b.BriefInput.parse({ goal: "More weekday lunch orders", area: "Jayanagar", niches: ["food"], languages: ["kn"], deliverables: ["reel"], budgetInr: 10000, destinationUrl: "https://maps.example/ruchi" }));

// Matching.
const matches = await b.matchesFor(brief);
const ids = matches.map((x) => x.userId);
assert(!ids.includes("shy"), "creators who haven't opted in are never suggested");
assert(!ids.includes("far"), "no shared niche or area, no suggestion");
assert(!ids.includes("pricey"), "creators priced above the whole budget are left out");
assert(ids[0] === "sr" || ids[0] === "ak", "best matches first");
const ak = matches.find((x) => x.userId === "ak")!;
assert(ak.verified && ak.reasons.some((r) => r.startsWith("Verified YouTube: 61K")) && ak.reasons.includes("Their rate: ₹3,000"), "each match explains itself (verified reach, rate)");
assert(matches.find((x) => x.userId === "sr")!.reasons.includes("Based in Jayanagar"), "same area is a reason");

// Plan.
const plan = b.planBudget(10000, matches);
assert(plan.total <= 10000 && plan.picks.filter((p) => !p.suggested).reduce((s, p) => s + p.fee, 0) === 7000, "plan takes priced matches that fit (4,000 + 3,000)");
assert(plan.picks.some((p) => p.userId === "noprice" && p.suggested), "creators without a price get a suggested share, marked as such");

// Invites.
assert((await b.inviteCreator("biz", brief.id, { creatorUserId: "shy", feeInr: 4000, message: null })) === "not_matched", "can't invite someone who didn't opt in");
const inv = await b.inviteCreator("biz", brief.id, { creatorUserId: "sr", feeInr: 4000, message: "Loved your dosa reel" });
assert(typeof inv === "object" && inv.status === "pending" && inv.reasons.length > 0, "invite created with the reasons the business saw");
assert(!(await b.matchesFor(brief)).some((x) => x.userId === "sr"), "invited creators drop out of new matches");
assert((await b.inviteForCreator("ak", (inv as { id: string }).id)) === null, "another creator can't open the invite");
const inv2 = await b.inviteCreator("biz", brief.id, { creatorUserId: "ak", feeInr: 3000, message: null });
assert((await b.respondToInvite("ak", (inv2 as { id: string }).id, false))?.dealId === null, "declining opens nothing");

// No contact details before accepting.
assert((await b.getRoom("biz", "nope")) === null, "no deal room without a deal");
const res = await b.respondToInvite("sr", (inv as { id: string }).id, true);
assert(res?.dealId, "accepting opens a deal");
assert((await b.respondToInvite("sr", (inv as { id: string }).id, true)) === null, "an invite can be answered once");
const deal = (await m.getDeal("sr", res!.dealId!))!;
assert(deal?.source === "mitra" && deal.status === "agreed" && deal.feeInr === 4000 && deal.checks.length > 0, "the deal lands in the creator's log as a Mitra deal, checked");
assert(deal.outcome?.promoCode === "RUCHI-SR" && /^[a-z0-9]{7}$/.test(deal.outcome.linkCode ?? ""), "promo code from both names, plus a tracked link code");

// Deal room.
const roomB = await b.getRoom("biz", deal.id);
const roomC = await b.getRoom("sr", deal.id);
assert(roomB?.side === "business" && roomB.creator.email === "sita@kit.com" && roomB.creator.whatsapp === "+919876543210", "after accepting, the business sees the creator's contact");
assert(roomC?.side === "creator" && roomC.business.email === "biz@x.com", "and the creator sees the business's");
assert((await b.getRoom("ak", deal.id)) === null, "outsiders can't open the room");
await b.postMessage("biz", deal.id, "Can you come Thursday at 1pm?");
assert((await b.getRoom("sr", deal.id))!.messages[0].mine === false, "messages show on both sides");
assert(!(await b.postMessage("ak", deal.id, "hi")), "outsiders can't post");

// Results.
await b.updateRoom("sr", deal.id, { posted: true });
for (let i = 0; i < 3; i++) await b.updateRoom("biz", deal.id, { redemptionsDelta: 1 });
await b.updateRoom("biz", deal.id, { redemptionsDelta: -1 });
await b.updateRoom("biz", deal.id, { paidInr: 4000 });
await b.updateRoom("sr", deal.id, { paidInr: 1 }); // a creator can't record the business's payment
const dest = await b.followLink(deal.outcome!.linkCode!);
await b.followLink(deal.outcome!.linkCode!);
assert(dest === "https://maps.example/ruchi" && (await b.followLink("zzzzzzz")) === null && (await b.followLink("../../x")) === null, "tracked link goes to the brief's https link; unknown codes go nowhere");
const r = await b.briefResults("biz", brief.id);
assert(r.totals.customers === 2 && r.totals.spent === 4000 && r.totals.perCustomer === 2000 && r.totals.clicks === 2, "results: customers, spend, cost per customer, clicks");
assert((await m.getDeal("sr", deal.id))?.status === "paid", "paying marks the deal paid in the creator's log");
assert((await b.briefResults("ak", brief.id)).rows.length === 0, "other accounts see no results");
assert((await b.listBriefs("biz"))[0].accepted === 1 && (await b.listBriefs("biz"))[0].invited === 2, "brief list counts invites and acceptances");

// Account deletion.
await d.delete(schema.users).where(eq(schema.users.id, "biz"));
assert((await d.select().from(schema.invites)).length === 0 && (await m.getDeal("sr", deal.id))?.businessUserId === null, "deleting the business removes its briefs and invites; the creator keeps their deal record");
console.log("all business tests passed");
