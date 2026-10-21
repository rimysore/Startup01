// Run with: npm test. Track: tracked creator posts (paid and barter), coupons, counter PIN, counter mode, totals.
process.env.PGLITE_DIR = "memory://";
const { db, schema } = await import("@/db");
const m = await import("@/lib/marketplace/store");
const b = await import("@/lib/marketplace/business");
const t = await import("@/lib/marketplace/track");
const { eq } = await import("drizzle-orm");
const assert = (c: unknown, msg: string) => { if (!c) { console.error("FAIL", msg); process.exit(1); } console.log("ok", msg); };

const d = await db();
const user = async (id: string, role: "creator" | "business") => {
  await d.insert(schema.users).values({ id, email: `${id}@x.com` });
  await m.joinMarketplace(id, { role, uiLanguage: "en", terms: true, contact: false });
};
await user("biz", "business");
await user("other", "business");

// No business profile yet: nothing to track against.
const input = (x: Record<string, unknown> = {}) => t.TrackInput.parse({ creatorName: "Sita Rao", kind: "paid", feeInr: 3000, offerText: "10% off your bill", ...x });
assert((await t.createTrackedPost("biz", input())) === "no_business", "a business profile comes first");
await m.saveBusiness("biz", m.BusinessInput.parse({ name: "Ruchi Dosa Café", area: "Jayanagar", website: "https://ruchi.example" }));
await m.saveBusiness("other", m.BusinessInput.parse({ name: "Other Place" }));

// Validation.
assert(!t.TrackInput.safeParse({ creatorName: "X", kind: "paid", offerText: "10% off", destinationUrl: "http://plain.example" }).success, "links must be https");
assert(!t.TrackInput.safeParse({ creatorName: "", kind: "paid", offerText: "10% off" }).success, "a creator name is needed");
assert(!t.PinInput.safeParse({ pin: "12" }).success && t.PinInput.safeParse({ pin: "4821" }).success, "PIN is 4-6 digits");

// Tracked posts: paid and barter, codes unique per business.
const paid = await t.createTrackedPost("biz", input({ creatorHandle: "@sitaeats" }));
const paid2 = await t.createTrackedPost("biz", input());
const barter = await t.createTrackedPost("biz", input({ creatorName: "Arun Kumar", kind: "barter", feeInr: 2000, barterNote: "Dinner for two" }));
assert(typeof paid === "object" && paid.promoCode === "RUCHI-SR" && paid.creatorHandle === "sitaeats", "promo code from business + creator initials; handle without @");
assert(typeof paid2 === "object" && paid2.promoCode === "RUCHI-SR2", "the same creator twice gets a second code");
assert(typeof barter === "object" && barter.baseFeeInr === null && barter.barterNote === "Dinner for two", "barter posts carry what the creator gets, no fee");
if (typeof paid !== "object" || typeof barter !== "object" || typeof paid2 !== "object") process.exit(1);
assert(/^[a-z0-9]{7}$/.test(paid.linkCode) && paid.linkCode !== barter.linkCode, "each post gets its own link code");
assert(t.normaliseCode(" ruchi sr ") === "RUCHISR", "codes match however they're typed");

// Coupons from the link.
assert((await t.openCoupon("nope!")) === null && (await t.openCoupon("zzzzzzz")) === null, "unknown links give no coupon");
const c1 = (await t.openCoupon(paid.linkCode))!;
const again = (await t.openCoupon(paid.linkCode, c1.couponId))!;
assert(again.couponId === c1.couponId, "reopening the link keeps the same open coupon");
const c2 = (await t.openCoupon(paid.linkCode))!;
assert(c2.couponId !== c1.couponId, "a new visitor gets a new coupon");
assert((await t.openCoupon(barter.linkCode, c1.couponId))!.couponId !== c1.couponId, "a coupon from one post isn't reused for another");
const view = (await t.couponView(c1.couponId))!;
assert(view.code === "RUCHI-SR" && view.offer === "10% off your bill" && view.business.name === "Ruchi Dosa Café" && !view.pinReady, "the coupon shows the code, the offer and the business");
assert(view.destinationUrl === "https://ruchi.example", "with no post link, 'visit' goes to the business's website");

// Redeeming with the counter PIN.
assert((await t.redeemCoupon(c1.couponId, "4821")) === "no_pin", "no PIN set yet: staff are told to set one");
assert(await t.setCounterPin("biz", "4821"), "PIN saved");
const [bp] = await d.select().from(schema.businessProfiles).where(eq(schema.businessProfiles.userId, "biz"));
assert(bp.counterPinHash && !bp.counterPinHash.includes("4821"), "the PIN is stored hashed");
assert(await t.hasCounterPin("biz"), "has a PIN");
assert((await t.redeemCoupon(c1.couponId, "0000")) === "bad_pin", "wrong PIN refused");
assert((await t.redeemCoupon(c1.couponId, "4821")) === "ok", "right PIN redeems");
assert((await t.redeemCoupon(c1.couponId, "4821")) === "already", "a coupon counts once");
assert((await t.openCoupon(paid.linkCode, c1.couponId))!.couponId !== c1.couponId, "after redeeming, the next visit is a new coupon");
for (let i = 0; i < 4; i++) await t.redeemCoupon(c2.couponId, "1111");
assert((await t.redeemCoupon(c2.couponId, "1111")) === "locked" && (await t.redeemCoupon(c2.couponId, "4821")) === "locked", "five wrong PINs lock the coupon");
assert((await t.couponView(c2.couponId))!.locked, "the coupon says it's locked");
// Guessing by opening fresh coupons pauses PIN redeeming for the business.
for (let i = 0; i < 4; i++) {
  const c = (await t.openCoupon(barter.linkCode))!;
  for (let j = 0; j < 5; j++) await t.redeemCoupon(c.couponId, String(1000 + i * 10 + j));
}
const fresh = (await t.openCoupon(paid.linkCode))!;
assert((await t.redeemCoupon(fresh.couponId, "4821")) === "locked", "20+ wrong PINs in an hour pause PIN redeeming");
await d.update(schema.coupons).set({ createdAt: new Date(Date.now() - 2 * 3_600_000) }).where(eq(schema.coupons.source, "link"));
assert((await t.redeemCoupon(fresh.couponId, "4821")) === "ok", "the pause lifts after an hour");

// Counter mode.
assert((await t.counterRedeem("biz", "nothing")) === "not_found", "unknown code");
assert((await t.counterRedeem("other", "RUCHI-SR")) === "not_found", "another business can't count this business's codes");
const typed = await t.counterRedeem("biz", "ruchi sr");
assert(typeof typed === "object" && typed.post.id === paid.id, "typed code counts a customer on the right post");
const typedBarter = await t.counterRedeem("biz", "RUCHI-AK");
assert(typeof typedBarter === "object", "barter posts count customers too");
if (typeof typed !== "object") process.exit(1);
assert(!(await t.undoCounter("other", typed.couponId)), "only the business can undo its entry");
assert(await t.undoCounter("biz", typed.couponId), "undo a mistaken entry");
assert(!(await t.undoCounter("biz", fresh.couponId)), "can't undo a customer's PIN redeem from counter mode");
const late = await t.counterRedeem("biz", "RUCHI-SR");
if (typeof late !== "object") process.exit(1);
assert(!(await t.undoCounter("biz", late.couponId, new Date(Date.now() + 11 * 60_000))), "undo only within ten minutes");

// Stats and totals: paid vs barter side by side.
const list = await t.listTracked("biz");
const sp = list.find((p) => p.id === paid.id)!;
assert(sp.stats.customers === 3 && sp.stats.perCustomer === 1000, "paid post: 3 customers (2 PIN + 1 counter), ₹3,000 / 3 = ₹1,000 each");
assert(sp.stats.opened >= 4, "opened counts visitors through the link");
const sb = list.find((p) => p.id === barter.id)!;
assert(sb.stats.customers === 1 && sb.stats.perCustomer === null, "barter post counts customers, no cost per customer");
assert(list.find((p) => p.id === paid2.id)!.stats.perCustomer === null, "no customers yet: no cost per customer");
const tot = t.trackTotals(list);
assert(tot.customers === 4 && tot.paid.perCustomer === 1000 && tot.barter.customers === 1 && tot.paid.posts === 2, "totals compare paid and barter");
assert((await t.getTracked("other", paid.id)) === null, "other businesses can't see the post");

// Ending a post stops new coupons and redeems.
assert(await t.updateTracked("biz", paid2.id, { status: "ended" }), "end a post");
assert((await t.openCoupon(paid2.linkCode)) === null, "ended posts hand out no coupons");
assert((await t.counterRedeem("biz", "RUCHI-SR2")) === "ended", "ended posts can't be counted");
assert(!(await t.updateTracked("other", paid.id, { status: "ended" })), "only the owner can change a post");

// Plans not enforced in the pilot.
assert(t.trackedThisMonth && (await t.trackedThisMonth("biz")) === 3, "posts this month are counted for the free plan later");

// A Mitra deal gets a tracked post sharing its code and link; coupons count towards the deal.
await user("sr", "creator");
await m.saveKit("sr", m.KitInput.parse({ displayName: "Sita Rao", niches: ["food"], languages: ["kn"], area: "Jayanagar", rates: [{ deliverable: "reel", priceInr: 4000 }], openToOffers: true }));
const brief = await b.createBrief("biz", b.BriefInput.parse({ goal: "More lunch orders", area: "Jayanagar", niches: ["food"], languages: ["kn"], deliverables: ["reel"], budgetInr: 10000 }));
const inv = await b.inviteCreator("biz", brief.id, { creatorUserId: "sr", feeInr: 4000, message: null });
if (typeof inv !== "object") process.exit(1);
const { dealId } = (await b.respondToInvite("sr", inv.id, true))!;
const [out] = await d.select().from(schema.dealOutcomes).where(eq(schema.dealOutcomes.dealId, dealId!));
assert(out.promoCode === "RUCHI-SR3", "the deal's code doesn't clash with tracked posts");
const dealPost = (await t.listTracked("biz")).find((p) => p.dealId === dealId)!;
assert(dealPost && dealPost.linkCode === out.linkCode && dealPost.baseFeeInr === 4000 && dealPost.creatorUserId === "sr", "deal's tracked post shares its code, link and fee");
const dc = (await t.openCoupon(out.linkCode!))!;
assert((await t.redeemCoupon(dc.couponId, "4821")) === "ok", "deal coupon redeemed");
const [out2] = await d.select().from(schema.dealOutcomes).where(eq(schema.dealOutcomes.dealId, dealId!));
assert(out2.redemptions === 1 && out2.clicks === 1, "redeems and visits count towards the deal's results");

// Deleting the business removes its posts and coupons.
await d.delete(schema.users).where(eq(schema.users.id, "biz"));
assert((await d.select().from(schema.trackedPosts)).length === 0 && (await d.select().from(schema.coupons)).length === 0, "account deletion removes posts and coupons");
console.log("all track tests passed");
