// Run with: npm test. Deal money (base fee or barter + bonus per customer), invites with terms, plans and the upgrade nudge.
process.env.PGLITE_DIR = "memory://";
const { db, schema } = await import("@/db");
const m = await import("@/lib/marketplace/store");
const b = await import("@/lib/marketplace/business");
const t = await import("@/lib/marketplace/track");
const money = await import("@/lib/marketplace/money");
const plans = await import("@/lib/marketplace/plans");
const { PLANS } = await import("@/lib/marketplace/flag");
const { eq } = await import("drizzle-orm");
const assert = (c: unknown, msg: string) => { if (!c) { console.error("FAIL", msg); process.exit(1); } console.log("ok", msg); };

// Money rules.
const T = (x: object) => money.terms(money.TermsInput.parse(x));
const deal = T({ kind: "paid", feeInr: 3000, bonusPerCustomerInr: 30, bonusCapInr: 1500 });
assert(money.bonusDue(deal, 0) === 0 && money.bonusDue(deal, 10) === 300 && money.bonusDue(deal, 80) === 1500, "bonus = per customer × customers, up to the cap");
assert(money.amountDue(deal, 10) === 3300 && money.maxEarn(deal) === 4500, "owed so far and the most the creator can earn");
assert(money.costPerCustomer(deal, 10) === 330 && money.costPerCustomer(deal, 0) === null, "cost per customer includes the bonus; none before a customer");
const uncapped = T({ kind: "paid", feeInr: 2000, bonusPerCustomerInr: 25 });
assert(money.maxEarn(uncapped) === null && money.bonusDue(uncapped, 100) === 2500, "no cap: bonus keeps counting, no maximum");
const barter = T({ kind: "barter", feeInr: 999, barterNote: " Dinner for two ", bonusPerCustomerInr: 20, bonusCapInr: 400 });
assert(barter.feeInr === null && barter.barterNote === "Dinner for two" && money.amountDue(barter, 5) === 100, "barter: no fee, a cash bonus can still apply");
assert(money.costPerCustomer(T({ kind: "barter", barterNote: "Meal" }), 4) === null, "plain barter has no cost per customer");
assert(!money.TermsInput.safeParse({ kind: "paid" }).success, "a paid deal needs a fee or a bonus");
assert(money.TermsInput.safeParse({ kind: "paid", bonusPerCustomerInr: 40 }).success, "bonus-only deals are allowed");
assert(!money.TermsInput.safeParse({ kind: "barter" }).success, "barter says what the creator gets");
assert(!money.TermsInput.safeParse({ kind: "paid", feeInr: 1000, bonusCapInr: 500 }).success, "a cap needs a bonus");
assert(!money.TermsInput.safeParse({ kind: "paid", feeInr: 1000, bonusPerCustomerInr: 50, bonusCapInr: 20 }).success, "cap can't be below one customer's bonus");
assert(money.termsText(deal) === "₹3,000 for the post plus ₹30 for every customer who uses your code, up to ₹1,500", "terms read as one sentence");
assert(money.termsOf({ feeInr: null, barter: "Free haircut", bonusPerCustomerInr: null, bonusCapInr: null }).kind === "barter", "a stored barter deal reads as barter");

// Invite with bonus terms flows into the deal, the tracked post and the results.
const d = await db();
const user = async (id: string, role: "creator" | "business") => {
  await d.insert(schema.users).values({ id, email: `${id}@x.com` });
  await m.joinMarketplace(id, { role, uiLanguage: "en", terms: true, contact: false });
};
await user("biz", "business");
await m.saveBusiness("biz", m.BusinessInput.parse({ name: "Ruchi Dosa Café", area: "Jayanagar" }));
for (const [id, name] of [["sr", "Sita Rao"], ["ak", "Arun Kumar"]] as const) {
  await user(id, "creator");
  await m.saveKit(id, m.KitInput.parse({ displayName: name, niches: ["food"], languages: ["kn"], area: "Jayanagar", rates: [{ deliverable: "reel", priceInr: 3000 }], openToOffers: true }));
}
const brief = await b.createBrief("biz", b.BriefInput.parse({ goal: "More weekday lunch", area: "Jayanagar", niches: ["food"], languages: ["kn"], deliverables: ["reel"], budgetInr: 10000 }));
const inv = await b.inviteCreator("biz", brief.id, { creatorUserId: "sr", kind: "paid", feeInr: 3000, bonusPerCustomerInr: 30, bonusCapInr: 1500, message: null });
assert(typeof inv === "object" && inv.bonusPerCustomerInr === 30 && inv.bonusCapInr === 1500 && inv.kind === "paid", "the invite carries base fee and bonus");
const binv = await b.inviteCreator("biz", brief.id, { creatorUserId: "ak", kind: "barter", barterNote: "Lunch for two", message: null });
assert(typeof binv === "object" && binv.kind === "barter" && binv.feeInr === null, "barter invites work");
if (typeof inv !== "object" || typeof binv !== "object") process.exit(1);
const offer = b.briefAsOffer(brief, money.termsOf(inv), "Ruchi Dosa Café");
assert(offer.includes("₹3,000 for the post plus ₹30 for every customer"), "the creator's offer text states the bonus");
const { dealId } = (await b.respondToInvite("sr", inv.id, true))!;
const [dl] = await d.select().from(schema.deals).where(eq(schema.deals.id, dealId!));
assert(dl.feeInr === 3000 && dl.bonusPerCustomerInr === 30 && dl.bonusCapInr === 1500, "the deal keeps the terms");
const { dealId: bdeal } = (await b.respondToInvite("ak", binv.id, true))!;
const [bd] = await d.select().from(schema.deals).where(eq(schema.deals.id, bdeal!));
assert(bd.barter === "Lunch for two" && bd.feeInr === null && bd.paymentTerms === null, "the barter deal records what the creator gets");
const posts = await t.listTracked("biz");
const sp = posts.find((p) => p.dealId === dealId)!;
assert(sp.kind === "paid" && sp.bonusPerCustomerInr === 30 && sp.bonusCapInr === 1500, "the deal's tracked post has the bonus");
assert(posts.find((p) => p.dealId === bdeal)!.kind === "barter", "the barter deal's tracked post is barter");

await t.setCounterPin("biz", "4821");
for (let i = 0; i < 12; i++) {
  const c = (await t.openCoupon(sp.linkCode))!;
  await t.redeemCoupon(c.couponId, "4821");
}
const after = (await t.getTracked("biz", sp.id))!;
assert(after.stats.customers === 12 && after.stats.bonus === 360 && after.stats.due === 3360 && after.stats.perCustomer === 280, "12 customers: ₹360 bonus, ₹3,360 owed, ₹280 per customer");
const res = await b.briefResults("biz", brief.id);
assert(res.totals.customers === 12 && res.totals.due === 3360, "brief results show customers and what's owed (base + bonus)");

// Tracked post with its own bonus, outside Mitra deals.
const own = await t.createTrackedPost("biz", { creatorName: "Kavya", kind: "paid", feeInr: 1000, bonusPerCustomerInr: 50, bonusCapInr: 500, offerText: "Free dessert" });
assert(typeof own === "object" && own.baseFeeInr === 1000 && own.bonusCapInr === 500, "track any post with a bonus too");

// Plans.
assert((await plans.planOf("biz")) === "free", "everyone starts on the free plan");
assert(PLANS.local.priceInr === 499 && PLANS.growth.priceInr === 1499 && PLANS.free.trackedPerMonth === 2, "plan prices and limits");
assert(plans.withinLimit(null, 1000) && plans.withinLimit(3, 2) && !plans.withinLimit(3, 3), "limits: null is unlimited");
assert((await plans.customersThisMonth("biz")) === 12, "customers counted this month");
assert((await plans.matchesThisMonth("biz")) === 2, "matched invites this month");
assert(plans.shouldNudge("free", 12, null) && !plans.shouldNudge("free", 9, null), "nudge to upgrade only after 10+ customers on free");
assert(!plans.shouldNudge("local", 50, null) && !plans.shouldNudge("free", 50, "local"), "no nudge on a paid plan or once they've said which plan");
assert(await plans.setPlanInterest("biz", "local"), "record 'I'd pay for Local'");
const st = await plans.planState("biz");
assert(st.interest === "local" && st.interestAt instanceof Date && st.plan === "free", "interest is recorded; the plan (and billing) don't change");
await plans.setPlanInterest("biz", null);
assert((await plans.planState("biz")).interest === null, "interest can be taken back");
assert(!(await plans.setPlanInterest("nobody", "growth")), "no business profile, nothing recorded");
console.log("all deals tests passed");
