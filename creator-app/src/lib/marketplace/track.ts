import { scryptSync, timingSafeEqual } from "node:crypto";
import { and, desc, eq, gt, inArray, isNotNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { promoCodeFor, uniqueLinkCode } from "./business";
import { PLANS, PLANS_ENFORCED } from "./flag";
import { amountDue, bonusDue, costPerCustomer, terms, termsOf, TermsInput, type Terms } from "./money";
import { planOf, withinLimit } from "./plans";

/*
 * Track: a business counts the customers any creator post brings, paid or barter, found through Mitra or not.
 * The post's link hands each visitor a coupon; staff redeem it with the counter PIN on the customer's phone, or type
 * the code in counter mode. Redeemed coupons are the customer count. Free; Mitra takes nothing from these.
 */

export type TrackedPost = typeof schema.trackedPosts.$inferSelect;
export type Coupon = typeof schema.coupons.$inferSelect;

const httpsUrl = z
  .string()
  .trim()
  .max(500)
  .refine((u) => /^https:\/\/[^\s]+$/i.test(u), "Use a link starting with https://");
const optional = <T extends z.ZodTypeAny>(t: T) => z.union([t, z.literal("").transform(() => null), z.null()]).optional();

/** Who the creator is, the deal (base fee or barter, plus an optional bonus per customer) and the customer's offer. */
export const TrackInput = z.intersection(
  z.object({
    creatorName: z.string().trim().min(1).max(80),
    creatorHandle: optional(z.string().trim().max(80)),
    offerText: z.string().trim().min(2).max(120),
    destinationUrl: optional(httpsUrl),
    postUrl: optional(httpsUrl),
  }),
  TermsInput,
);

export const TrackUpdate = z.object({
  status: z.enum(["active", "ended"]).optional(),
  postUrl: optional(httpsUrl),
  offerText: z.string().trim().min(2).max(120).optional(),
});

/* ---- Codes ---- */

/** The first promo code for this creator that the business hasn't used (on a tracked post or a deal). */
export async function freePromoCode(businessUserId: string, businessName: string, creatorName: string): Promise<string> {
  const d = await db();
  const [tracked, dealt] = await Promise.all([
    d.select({ code: schema.trackedPosts.promoCode }).from(schema.trackedPosts).where(eq(schema.trackedPosts.businessUserId, businessUserId)),
    d
      .select({ code: schema.dealOutcomes.promoCode })
      .from(schema.dealOutcomes)
      .innerJoin(schema.deals, eq(schema.deals.id, schema.dealOutcomes.dealId))
      .where(eq(schema.deals.businessUserId, businessUserId)),
  ]);
  const taken = new Set([...tracked, ...dealt].map((r) => r.code));
  let n = 0;
  while (taken.has(promoCodeFor(businessName, creatorName, n))) n++;
  return promoCodeFor(businessName, creatorName, n);
}

/** Codes as people type them at a counter: case, spaces and dashes don't matter. */
export const normaliseCode = (code: string) => code.toUpperCase().replace(/[^A-Z0-9]/g, "");

/* ---- Counter PIN ---- */

const pinHash = (userId: string, pin: string) => scryptSync(pin, `mitra-counter:${userId}`, 32).toString("hex");

export const PinInput = z.object({ pin: z.string().regex(/^\d{4,6}$/, "Use 4 to 6 digits") });

export async function setCounterPin(businessUserId: string, pin: string): Promise<boolean> {
  const rows = await (await db())
    .update(schema.businessProfiles)
    .set({ counterPinHash: pinHash(businessUserId, pin), updatedAt: new Date() })
    .where(eq(schema.businessProfiles.userId, businessUserId))
    .returning({ id: schema.businessProfiles.userId });
  return rows.length > 0;
}

export async function hasCounterPin(businessUserId: string): Promise<boolean> {
  const [row] = await (await db()).select({ h: schema.businessProfiles.counterPinHash }).from(schema.businessProfiles).where(eq(schema.businessProfiles.userId, businessUserId));
  return Boolean(row?.h);
}

function pinMatches(userId: string, pin: string, stored: string | null): boolean {
  if (!stored || !/^\d{4,6}$/.test(pin)) return false;
  const a = Buffer.from(pinHash(userId, pin), "hex");
  const b = Buffer.from(stored, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/* ---- Tracked posts ---- */

/** Tracked posts started this calendar month (the free plan's allowance, once plans are switched on). */
export async function trackedThisMonth(businessUserId: string, now = new Date()): Promise<number> {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const [row] = await (await db())
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.trackedPosts)
    .where(and(eq(schema.trackedPosts.businessUserId, businessUserId), gt(schema.trackedPosts.createdAt, start)));
  return row?.n ?? 0;
}

export async function createTrackedPost(businessUserId: string, raw: z.input<typeof TrackInput>): Promise<TrackedPost | "no_business" | "limit"> {
  const input = TrackInput.parse(raw);
  const d = await db();
  const [biz] = await d.select({ name: schema.businessProfiles.name }).from(schema.businessProfiles).where(eq(schema.businessProfiles.userId, businessUserId));
  if (!biz) return "no_business";
  if (PLANS_ENFORCED && !withinLimit(PLANS[await planOf(businessUserId)].trackedPerMonth, await trackedThisMonth(businessUserId))) return "limit";
  const t = terms(input);
  const [row] = await d
    .insert(schema.trackedPosts)
    .values({
      id: crypto.randomUUID(),
      businessUserId,
      creatorName: input.creatorName,
      creatorHandle: input.creatorHandle?.replace(/^@/, "") ?? null,
      kind: t.kind,
      baseFeeInr: t.feeInr,
      barterNote: t.barterNote,
      bonusPerCustomerInr: t.bonusPerCustomerInr,
      bonusCapInr: t.bonusCapInr,
      offerText: input.offerText,
      promoCode: await freePromoCode(businessUserId, biz.name, input.creatorName),
      linkCode: await uniqueLinkCode(),
      destinationUrl: input.destinationUrl ?? null,
      postUrl: input.postUrl ?? null,
    })
    .returning();
  return row;
}

/** A Mitra deal's tracked post, sharing the deal's promo code and link. */
export async function startTrackedForDeal(p: { businessUserId: string; creatorUserId: string; creatorName: string; dealId: string; terms: Terms; promoCode: string; linkCode: string; destinationUrl: string | null }) {
  await (await db()).insert(schema.trackedPosts).values({
    id: crypto.randomUUID(),
    businessUserId: p.businessUserId,
    creatorName: p.creatorName,
    creatorUserId: p.creatorUserId,
    dealId: p.dealId,
    kind: p.terms.kind,
    baseFeeInr: p.terms.feeInr,
    barterNote: p.terms.barterNote,
    bonusPerCustomerInr: p.terms.bonusPerCustomerInr,
    bonusCapInr: p.terms.bonusCapInr,
    offerText: "Show this at the counter",
    promoCode: p.promoCode,
    linkCode: p.linkCode,
    destinationUrl: p.destinationUrl,
  });
}

export type TrackedStats = { opened: number; customers: number; bonus: number; due: number; perCustomer: number | null };

/** Opened coupons, redeemed customers, bonus earned, what's owed so far, and money per customer (none before a customer, or when nothing is paid). */
function statsFor(post: TrackedPost, counts: { opened: number; customers: number } | undefined): TrackedStats {
  const opened = counts?.opened ?? 0;
  const customers = counts?.customers ?? 0;
  const t = termsOf(post);
  return { opened, customers, bonus: bonusDue(t, customers), due: amountDue(t, customers), perCustomer: costPerCustomer(t, customers) };
}

async function countsFor(ids: string[]) {
  if (!ids.length) return new Map<string, { opened: number; customers: number }>();
  const rows = await (await db())
    .select({
      id: schema.coupons.trackedPostId,
      opened: sql<number>`count(*) filter (where ${schema.coupons.source} = 'link')::int`,
      customers: sql<number>`count(${schema.coupons.redeemedAt})::int`,
    })
    .from(schema.coupons)
    .where(inArray(schema.coupons.trackedPostId, ids))
    .groupBy(schema.coupons.trackedPostId);
  return new Map(rows.map((r) => [r.id, { opened: r.opened, customers: r.customers }]));
}

export async function listTracked(businessUserId: string): Promise<(TrackedPost & { stats: TrackedStats })[]> {
  const posts = await (await db()).select().from(schema.trackedPosts).where(eq(schema.trackedPosts.businessUserId, businessUserId)).orderBy(desc(schema.trackedPosts.createdAt)).limit(200);
  const counts = await countsFor(posts.map((p) => p.id));
  return posts.map((p) => ({ ...p, stats: statsFor(p, counts.get(p.id)) }));
}

export async function getTracked(businessUserId: string, id: string): Promise<(TrackedPost & { stats: TrackedStats }) | null> {
  const [post] = await (await db())
    .select()
    .from(schema.trackedPosts)
    .where(and(eq(schema.trackedPosts.id, id), eq(schema.trackedPosts.businessUserId, businessUserId)));
  if (!post) return null;
  return { ...post, stats: statsFor(post, (await countsFor([post.id])).get(post.id)) };
}

export async function updateTracked(businessUserId: string, id: string, input: z.infer<typeof TrackUpdate>): Promise<boolean> {
  const set: Partial<TrackedPost> = {};
  if (input.status) set.status = input.status;
  if (input.postUrl !== undefined) set.postUrl = input.postUrl;
  if (input.offerText) set.offerText = input.offerText;
  if (!Object.keys(set).length) return true;
  const rows = await (await db())
    .update(schema.trackedPosts)
    .set(set)
    .where(and(eq(schema.trackedPosts.id, id), eq(schema.trackedPosts.businessUserId, businessUserId)))
    .returning({ id: schema.trackedPosts.id });
  return rows.length > 0;
}

/**
 * What a business's tracked posts add up to: customers from paid posts and barter posts side by side, so the owner
 * can compare a free-meal creator with a paid one.
 */
export function trackTotals(posts: (TrackedPost & { stats: TrackedStats })[]) {
  const sum = (kind: "paid" | "barter") => {
    const ps = posts.filter((p) => p.kind === kind);
    const customers = ps.reduce((s, p) => s + p.stats.customers, 0);
    // Money counts once a post has brought someone in (a fee for a post that brought nobody isn't a cost per customer).
    const spent = ps.reduce((s, p) => s + (p.stats.customers ? p.stats.due : 0), 0);
    return { posts: ps.length, customers, perCustomer: customers && spent ? Math.round(spent / customers) : null };
  };
  return { paid: sum("paid"), barter: sum("barter"), customers: posts.reduce((s, p) => s + p.stats.customers, 0) };
}

/* ---- Coupons ---- */

const COUPON_ID = /^[0-9a-f-]{36}$/;
const MAX_PIN_TRIES = 5;
/** Wrong PINs across all of a business's coupons in an hour before PIN redeeming pauses (stops guessing by opening new coupons). */
const MAX_BUSINESS_PIN_TRIES_PER_HOUR = 20;

/**
 * A visitor following a post's link: reuses their open coupon for this post if they have one (the cookie), else
 * makes a new one. Returns null for unknown or ended posts.
 */
export async function openCoupon(linkCode: string, existing?: string | null): Promise<{ couponId: string } | null> {
  if (!/^[a-z0-9]{5,12}$/.test(linkCode)) return null;
  const d = await db();
  const [post] = await d.select().from(schema.trackedPosts).where(eq(schema.trackedPosts.linkCode, linkCode));
  if (!post || post.status !== "active") return null;
  if (existing && COUPON_ID.test(existing)) {
    const [c] = await d.select().from(schema.coupons).where(and(eq(schema.coupons.id, existing), eq(schema.coupons.trackedPostId, post.id)));
    if (c && !c.redeemedAt) return { couponId: c.id };
  }
  const id = crypto.randomUUID();
  await d.insert(schema.coupons).values({ id, trackedPostId: post.id, source: "link" });
  if (post.dealId) await d.update(schema.dealOutcomes).set({ clicks: sql`${schema.dealOutcomes.clicks} + 1` }).where(eq(schema.dealOutcomes.dealId, post.dealId));
  return { couponId: id };
}

export type CouponView = {
  id: string;
  code: string;
  offer: string;
  business: { name: string; area: string | null };
  creatorName: string;
  destinationUrl: string | null;
  redeemedAt: Date | null;
  locked: boolean;
  ended: boolean;
  pinReady: boolean;
};

/** The coupon as the customer (and the staff member redeeming it) sees it. */
export async function couponView(couponId: string): Promise<CouponView | null> {
  if (!COUPON_ID.test(couponId)) return null;
  const [row] = await (await db())
    .select({ coupon: schema.coupons, post: schema.trackedPosts, biz: schema.businessProfiles })
    .from(schema.coupons)
    .innerJoin(schema.trackedPosts, eq(schema.trackedPosts.id, schema.coupons.trackedPostId))
    .leftJoin(schema.businessProfiles, eq(schema.businessProfiles.userId, schema.trackedPosts.businessUserId))
    .where(eq(schema.coupons.id, couponId));
  if (!row) return null;
  return {
    id: row.coupon.id,
    code: row.post.promoCode,
    offer: row.post.offerText,
    business: { name: row.biz?.name ?? "This business", area: row.biz?.area ?? null },
    creatorName: row.post.creatorName,
    destinationUrl: row.post.destinationUrl ?? row.biz?.website ?? null,
    redeemedAt: row.coupon.redeemedAt,
    locked: row.coupon.pinTries >= MAX_PIN_TRIES,
    ended: row.post.status !== "active",
    pinReady: Boolean(row.biz?.counterPinHash),
  };
}

async function countDealCustomer(dealId: string | null) {
  if (!dealId) return;
  await (await db())
    .update(schema.dealOutcomes)
    .set({ redemptions: sql`coalesce(${schema.dealOutcomes.redemptions}, 0) + 1`, updatedAt: new Date() })
    .where(eq(schema.dealOutcomes.dealId, dealId));
}

export type RedeemResult = "ok" | "already" | "bad_pin" | "locked" | "no_pin" | "ended" | "not_found";

/** Staff type the counter PIN on the customer's phone. Five wrong PINs lock the coupon. */
export async function redeemCoupon(couponId: string, pin: string): Promise<RedeemResult> {
  if (!COUPON_ID.test(couponId)) return "not_found";
  const d = await db();
  const [row] = await d
    .select({ coupon: schema.coupons, post: schema.trackedPosts, pinHash: schema.businessProfiles.counterPinHash })
    .from(schema.coupons)
    .innerJoin(schema.trackedPosts, eq(schema.trackedPosts.id, schema.coupons.trackedPostId))
    .leftJoin(schema.businessProfiles, eq(schema.businessProfiles.userId, schema.trackedPosts.businessUserId))
    .where(eq(schema.coupons.id, couponId));
  if (!row) return "not_found";
  if (row.coupon.redeemedAt) return "already";
  if (row.post.status !== "active") return "ended";
  if (row.coupon.pinTries >= MAX_PIN_TRIES) return "locked";
  if (!row.pinHash) return "no_pin";
  const [recent] = await d
    .select({ n: sql<number>`coalesce(sum(${schema.coupons.pinTries}), 0)::int` })
    .from(schema.coupons)
    .innerJoin(schema.trackedPosts, eq(schema.trackedPosts.id, schema.coupons.trackedPostId))
    .where(and(eq(schema.trackedPosts.businessUserId, row.post.businessUserId), gt(schema.coupons.createdAt, new Date(Date.now() - 3_600_000))));
  if ((recent?.n ?? 0) >= MAX_BUSINESS_PIN_TRIES_PER_HOUR) return "locked";
  if (!pinMatches(row.post.businessUserId, pin, row.pinHash)) {
    await d.update(schema.coupons).set({ pinTries: sql`${schema.coupons.pinTries} + 1` }).where(eq(schema.coupons.id, couponId));
    return row.coupon.pinTries + 1 >= MAX_PIN_TRIES ? "locked" : "bad_pin";
  }
  // Only the first redeem counts, even if two taps race.
  const done = await d
    .update(schema.coupons)
    .set({ redeemedAt: new Date(), redeemedBy: "pin" })
    .where(and(eq(schema.coupons.id, couponId), sql`${schema.coupons.redeemedAt} is null`))
    .returning({ id: schema.coupons.id });
  if (!done.length) return "already";
  await countDealCustomer(row.post.dealId);
  return "ok";
}

/** Counter mode: staff type the code a customer shows or says. Counts one customer on that post. */
export async function counterRedeem(businessUserId: string, code: string): Promise<{ post: TrackedPost; couponId: string } | "not_found" | "ended"> {
  const want = normaliseCode(code);
  if (want.length < 3) return "not_found";
  const d = await db();
  const posts = await d.select().from(schema.trackedPosts).where(eq(schema.trackedPosts.businessUserId, businessUserId));
  const post = posts.find((p) => normaliseCode(p.promoCode) === want);
  if (!post) return "not_found";
  if (post.status !== "active") return "ended";
  const id = crypto.randomUUID();
  await d.insert(schema.coupons).values({ id, trackedPostId: post.id, source: "counter", redeemedAt: new Date(), redeemedBy: "counter" });
  await countDealCustomer(post.dealId);
  return { post, couponId: id };
}

/** Undo a counter entry typed by mistake, within ten minutes. */
export async function undoCounter(businessUserId: string, couponId: string, now = new Date()): Promise<boolean> {
  if (!COUPON_ID.test(couponId)) return false;
  const d = await db();
  const [row] = await d
    .select({ coupon: schema.coupons, post: schema.trackedPosts })
    .from(schema.coupons)
    .innerJoin(schema.trackedPosts, eq(schema.trackedPosts.id, schema.coupons.trackedPostId))
    .where(and(eq(schema.coupons.id, couponId), eq(schema.trackedPosts.businessUserId, businessUserId), eq(schema.coupons.source, "counter"), isNotNull(schema.coupons.redeemedAt)));
  if (!row || now.getTime() - row.coupon.redeemedAt!.getTime() > 10 * 60_000) return false;
  await d.delete(schema.coupons).where(eq(schema.coupons.id, couponId));
  if (row.post.dealId) {
    await d
      .update(schema.dealOutcomes)
      .set({ redemptions: sql`greatest(0, coalesce(${schema.dealOutcomes.redemptions}, 0) - 1)`, updatedAt: now })
      .where(eq(schema.dealOutcomes.dealId, row.post.dealId));
  }
  return true;
}
