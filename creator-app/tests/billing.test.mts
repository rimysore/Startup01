// Run with: npm test. Exercises the credit limit and billing plan logic against a fresh embedded database.
process.env.PGLITE_DIR = "memory://";
const { db, schema } = await import("@/db");
const { reserveCredit, refundCredit, creditsUsed, monthKey } = await import("@/lib/usage");
const { applySubscription } = await import("@/lib/billing");
const { eq } = await import("drizzle-orm");
const assert = (c: unknown, m: string) => { if (!c) { console.error("FAIL", m); process.exit(1); } console.log("ok", m); };

const d = await db();
const [u] = await d.insert(schema.users).values({ id: "u1", email: "a@b.c" }).returning();
let granted = 0;
for (let i = 0; i < 12; i++) if (await reserveCredit(u)) granted++;
assert(granted === 10, `free plan grants exactly 10 credits (got ${granted})`);
await refundCredit(u.id, monthKey());
assert((await creditsUsed(u.id)) === 9, "refund gives one back");
assert(await reserveCredit(u), "can use the refunded credit");
assert(!(await reserveCredit(u)), "then blocked again");

const results = await Promise.all(Array.from({ length: 20 }, () => reserveCredit({ ...u, plan: "pro" })));
assert(results.filter(Boolean).length === 20 && (await creditsUsed(u.id)) === 30, "20 concurrent reserves on pro all counted");

const [w] = await d.insert(schema.users).values({ id: "u2", email: "w@b.c" }).returning();
assert((await reserveCredit(w, 3)) && (await reserveCredit(w, 3)) && (await reserveCredit(w, 3)), "three 3-credit diagnoses fit in 10 free credits");
assert(!(await reserveCredit(w, 3)) && (await creditsUsed(w.id)) === 9, "a 4th 3-credit diagnosis is refused and nothing is taken");
assert(await reserveCredit(w, 1), "the last single credit is still usable");
assert(!(await reserveCredit(w, 11)), "a charge bigger than the whole plan is refused");

const end = Math.floor(Date.now() / 1000) + 30 * 86400;
await applySubscription({ id: "sub_1", plan_id: "", status: "active", current_end: end, notes: { userId: "u1", plan: "pro" } });
let [row] = await d.select().from(schema.users).where(eq(schema.users.id, "u1"));
assert(row.plan === "pro", "active subscription -> pro");
await applySubscription({ id: "sub_1", plan_id: "", status: "cancelled", current_end: end, notes: [] });
[row] = await d.select().from(schema.users).where(eq(schema.users.id, "u1"));
assert(row.plan === "pro", "cancelled but paid-up -> still pro");
await applySubscription({ id: "sub_1", plan_id: "", status: "cancelled", current_end: Math.floor(Date.now() / 1000) - 10, notes: [] });
[row] = await d.select().from(schema.users).where(eq(schema.users.id, "u1"));
assert(row.plan === "free", "cancelled and period over -> free");
await applySubscription({ id: "sub_2", plan_id: "", status: "halted", current_end: end, notes: { userId: "u1", plan: "creator" } });
[row] = await d.select().from(schema.users).where(eq(schema.users.id, "u1"));
assert(row.plan === "free", "halted (payments failed) -> free");
await applySubscription({ id: "sub_3", plan_id: "", status: "active", current_end: end, notes: { userId: "u1", plan: "creator" } });
await applySubscription({ id: "sub_4", plan_id: "", status: "active", current_end: end, notes: { userId: "u1", plan: "pro" } });
[row] = await d.select().from(schema.users).where(eq(schema.users.id, "u1"));
assert(row.plan === "creator", "two live subscriptions -> higher plan wins");
console.log("all passed");
process.exit(0);
