// Run with: npm test. The pilot's five numbers and the bill-check export.
process.env.PGLITE_DIR = "memory://";
const { db, schema } = await import("@/db");
const m = await import("@/lib/marketplace/store");
const t = await import("@/lib/marketplace/track");
const plans = await import("@/lib/marketplace/plans");
const inbox = await import("@/lib/marketplace/inbox");
const p = await import("@/lib/marketplace/pilot");
const { eq } = await import("drizzle-orm");
const assert = (c: unknown, msg: string) => { if (!c) { console.error("FAIL", msg); process.exit(1); } console.log("ok", msg); };

const d = await db();
const DAY = 86_400_000;
const user = async (id: string, role: "creator" | "business") => {
  await d.insert(schema.users).values({ id, email: `${id}@x.com` });
  await m.joinMarketplace(id, { role, uiLanguage: "en", terms: true, contact: false });
};
const empty = await p.pilotNumbers();
assert(empty.activeBusinesses.value === 0 && empty.customersPerPost.median === null && empty.repeat.rate === null && empty.weeks.length === 8, "empty pilot: zeros, no medians, 8 weeks");

for (const [id, name] of [["cafe", "Ruchi Café"], ["salon", "Glow Salon"], ["gym", "Iron Gym"], ["founder", "Test Shop"]] as const) {
  await user(id, "business");
  await m.saveBusiness(id, m.BusinessInput.parse({ name, area: "Indiranagar" }));
  await t.setCounterPin(id, "4821");
}
const post = async (biz: string, creator: string, daysAgo: number, kind: "paid" | "barter" = "paid") => {
  const r = await t.createTrackedPost(biz, kind === "paid" ? { creatorName: creator, kind, feeInr: 3000, offerText: "10% off" } : { creatorName: creator, kind, barterNote: "Meal", offerText: "Free coffee" });
  if (typeof r !== "object") throw new Error("post");
  await d.update(schema.trackedPosts).set({ createdAt: new Date(Date.now() - daysAgo * DAY) }).where(eq(schema.trackedPosts.id, r.id));
  return r;
};
const redeem = async (post: { linkCode: string }, n: number, daysAgo = 1) => {
  for (let i = 0; i < n; i++) {
    const c = (await t.openCoupon(post.linkCode))!;
    await t.redeemCoupon(c.couponId, "4821");
    await d.update(schema.coupons).set({ redeemedAt: new Date(Date.now() - daysAgo * DAY), createdAt: new Date(Date.now() - daysAgo * DAY) }).where(eq(schema.coupons.id, c.couponId));
  }
};
// Café: first post 40 days ago, second 10 days later (repeat), customers recently.
const c1 = await post("cafe", "Sita Rao", 40);
const c2 = await post("cafe", "Arun Kumar", 30, "barter");
await redeem(c1, 6, 2);
await redeem(c2, 2, 3);
// Salon: one post 35 days ago, customers 20 days ago (not active now, no repeat).
const s1 = await post("salon", "Kavya", 35);
await redeem(s1, 3, 20);
// Gym: one post 5 days ago, counter-mode customers today.
const g1 = await post("gym", "Ravi", 5);
await t.counterRedeem("gym", g1.promoCode);
await t.counterRedeem("gym", g1.promoCode);
// Founder's own test shop is excluded.
const f1 = await post("founder", "Me", 2);
await redeem(f1, 9, 1);

const n = await p.pilotNumbers({ exclude: ["founder"] });
assert(n.activeBusinesses.value === 2 && n.activeBusinesses.tracking === 3 && n.activeBusinesses.posts === 4, "active = café and gym (salon's last customer was 20 days ago); founder excluded");
assert(n.customersPerPost.posts === 4 && n.customersPerPost.median === 2 && n.customersPerPost.max === 6 && n.customersPerPost.total === 13, "customers per post: 6, 2, 3, 2 → median 2, max 6, total 13");
assert(n.customersPerPost.byPin === 11 && n.customersPerPost.byCounter === 2, "split by PIN vs counter mode");
assert(n.repeat.of === 2 && n.repeat.repeated === 1 && n.repeat.rate === 50, "repeat: café repeated within 30 days, salon didn't; gym too new to count");
assert(n.paying.value === 0 && n.paying.wouldPay === 0, "nobody paying yet");
await plans.setPlanInterest("cafe", "local");
await d.update(schema.businessProfiles).set({ plan: "growth" }).where(eq(schema.businessProfiles.userId, "salon"));
const n2 = await p.pilotNumbers({ exclude: ["founder"] });
assert(n2.paying.onPlans === 1 && n2.paying.mrrInr === 1499 && n2.paying.wouldPay === 1 && n2.paying.wouldPayMrrInr === 499, "paying on a plan (MRR) and 'would pay' counted separately");

// Inbox.
await user("cr1", "creator");
await user("cr2", "creator");
await inbox.addToInbox("cr1", { source: "whatsapp", body: "Hi dear, pay ₹499 registration fee to join our brand collab program and get free products. Limited slots, reply fast on Telegram." }, { online: false });
await inbox.addToInbox("cr1", { source: "paste", body: "Ruchi Café would like 1 reel for ₹3,000, posted by 30 Oct, paid on posting." }, { online: false });
await inbox.addToInbox("cr2", { source: "email", body: "We'd like a reel and a story for our new menu. Fee ₹4,000 paid within 7 days of posting." }, { online: false });
const n3 = await p.pilotNumbers({ exclude: ["founder"] });
assert(n3.inbox.creators === 2 && n3.inbox.offers === 3 && n3.inbox.bySource.whatsapp === 1 && n3.inbox.bySource.email === 1, "inbox: creators and offers by source");
assert(n3.inbox.scamsFlagged === 1, "scams flagged counted");
const thisWeek = n3.weeks[n3.weeks.length - 1];
assert(thisWeek.customers === 13 - 3 && thisWeek.inboxOffers === 3 && thisWeek.activeBusinesses === 2, "this week's trend: customers redeemed this week, offers, active businesses");

// Bill check.
const all = await p.billCheckRows({ exclude: ["founder"] });
assert(all.every((r) => r.businessUserId !== "founder") && all.reduce((s, r) => s + r.customers, 0) === 13, "bill check covers every counted customer, founder excluded");
const gym = await p.billCheckRows({ businessUserId: "gym" });
assert(gym.length === 1 && gym[0].customers === 2 && gym[0].byCounter === 2 && gym[0].code === g1.promoCode && /^\d{4}-\d{2}-\d{2}$/.test(gym[0].day), "one business's rows: by day and code");
const csv = p.billCheckCsv(gym);
assert(csv.split("\n")[0].includes("Customers on the bill (fill in)") && csv.includes(`"${g1.promoCode}"`), "CSV has a column to fill in from the bill book");
assert(p.toCsv(["a"], [["=HYPERLINK(1)"]]).includes(`"'=HYPERLINK(1)"`), "CSV neutralises spreadsheet formulas");
console.log("all pilot tests passed");
