// Run with: npm test. Founding-creator spots: numbering, the 100 cap, one per channel, concurrency, credits.
process.env.PGLITE_DIR = "memory://";
// Plan limits are tested outside the beta; the beta's own allowance is checked separately below.
process.env.NEXT_PUBLIC_BETA = "0";
const { db, schema } = await import("@/db");
const { claimFounderSpot, foundingSpotsLeft } = await import("@/lib/founders");
const { creditLimit, FOUNDER_FREE_USES, PLANS } = await import("@/lib/plans");
const { monthKey, refundCredit, reserveCredit, usageThisMonth } = await import("@/lib/usage");
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

// Founder Pass: cheap features are free up to FOUNDER_FREE_USES a month, then fall back to credits.
const pools: string[] = [];
for (let i = 0; i < FOUNDER_FREE_USES + 3; i++) pools.push(String(await reserveCredit(u100, 1, "titles")));
assert(pools.slice(0, FOUNDER_FREE_USES).every((p) => p === "founder") && pools.slice(FOUNDER_FREE_USES).every((p) => p === "credits"), `${FOUNDER_FREE_USES} free uses, then credits`);
assert((await reserveCredit(u100, 3, "doctor")) === "credits", "Video Doctor always uses credits");
let u = await usageThisMonth("u100");
assert(u.founderUses === FOUNDER_FREE_USES && u.credits === 6, `pass and credits counted apart (got ${JSON.stringify(u)})`);
await refundCredit("u100", monthKey(), 1, "founder");
assert((await usageThisMonth("u100")).founderUses === FOUNDER_FREE_USES - 1, "a failed call gives the free use back");
assert((await reserveCredit(u101, 1, "titles")) === "credits", "non-founders pay credits for everything");
let granted = 0;
for (let i = 0; i < 20; i++) if (await reserveCredit(u101, 1, "chat")) granted++;
assert(granted === PLANS.free.credits - 1 && creditLimit("free") === PLANS.free.credits, "Free plan stops at its credits");
u = await usageThisMonth("u101");
assert(u.founderUses === 0, "non-founders never touch the pass");
assert(PLANS.creator.pricePaise === 24_900 && PLANS.creator.credits === 250, "Creator+ is ₹249 with 250 credits");
assert(PLANS.pro.pricePaise === 9_900 && PLANS.pro.credits === 100, "Pro is ₹99 with 100 credits");
console.log("all founder tests passed");
process.exit(0);
