// Run with: npm test. Founding-creator spots: numbering, the 100 cap, one per channel, concurrency, credits.
process.env.PGLITE_DIR = "memory://";
const { db, schema } = await import("@/db");
const { claimFounderSpot, foundingSpotsLeft } = await import("@/lib/founders");
const { creditLimit, FOUNDER_CREDITS, PLANS } = await import("@/lib/plans");
const { reserveCredit } = await import("@/lib/usage");
const { eq } = await import("drizzle-orm");
const assert = (c: unknown, m: string) => { if (!c) { console.error("FAIL", m); process.exit(1); } console.log("ok", m); };

const d = await db();
const mk = async (i: number, channel = `UC${i}`) => {
  await d.insert(schema.users).values({ id: `u${i}`, email: `u${i}@x.com` });
  await d.insert(schema.youtubeConnections).values({ userId: `u${i}`, channelId: channel, accessToken: "x", expiresAt: new Date() });
};
for (let i = 1; i <= 105; i++) await mk(i);

assert((await foundingSpotsLeft()) === 100, "100 spots at the start");
assert((await claimFounderSpot("u1", "UC1")) === 1, "first creator is #1");
assert((await claimFounderSpot("u1", "UC1")) === 1, "claiming again keeps the same number");

const results = await Promise.all(Array.from({ length: 30 }, (_, k) => claimFounderSpot(`u${k + 2}`, `UC${k + 2}`)));
const nums = results.filter((n): n is number => n != null);
assert(nums.length === 30 && new Set(nums).size === 30 && Math.max(...nums) === 31, "30 simultaneous claims get 30 unique numbers (2-31)");

await d.insert(schema.users).values({ id: "dup", email: "dup@x.com" });
await d.insert(schema.youtubeConnections).values({ userId: "dup", channelId: "UC1", accessToken: "x", expiresAt: new Date() });
assert((await claimFounderSpot("dup", "UC1")) === null, "the same channel on a second account doesn't get a second spot");

for (let i = 32; i <= 105; i++) await claimFounderSpot(`u${i}`, `UC${i}`);
const [u100] = await d.select().from(schema.users).where(eq(schema.users.id, "u100"));
const [u101] = await d.select().from(schema.users).where(eq(schema.users.id, "u101"));
assert(u100.founderNumber === 100 && u101.founderNumber === null, "#100 is the last spot; #101 gets none");
assert((await foundingSpotsLeft()) === 0, "no spots left");

assert(creditLimit("free", true) === FOUNDER_CREDITS && creditLimit("free", false) === PLANS.free.credits, "founders get 30 free credits a month");
assert(creditLimit("creator", true) === PLANS.creator.credits, "founder floor doesn't lower a bigger plan");
let granted = 0;
for (let i = 0; i < 40; i++) if (await reserveCredit(u100)) granted++;
assert(granted === FOUNDER_CREDITS, `founder can use exactly ${FOUNDER_CREDITS} credits on Free (got ${granted})`);
assert(PLANS.pro.pricePaise === 9_900 && PLANS.pro.credits === 100, "Pro is ₹99 with 100 credits");
console.log("all founder tests passed");
process.exit(0);
