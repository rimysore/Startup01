import { and, eq, gt, inArray, isNotNull, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { PLANS, isPlanId } from "./flag";

/*
 * The pilot's five numbers (founder/research/01-progress.md §4), read straight from the database:
 * 1 businesses actively counting, 2 customers per post, 3 paying (and willing to pay), 4 repeat rate,
 * 5 creators using the inbox and scams caught. Plus a weekly trend for the deck.
 */

const DAY = 86_400_000;

export type PilotNumbers = Awaited<ReturnType<typeof pilotNumbers>>;

/** Percentile of a sorted list (nearest rank). */
function pct(sorted: number[], p: number): number | null {
  if (!sorted.length) return null;
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))];
}

/** `exclude`: user ids left out of every number (the founders' and test accounts). */
export async function pilotNumbers(opts: { now?: Date; exclude?: string[] } = {}) {
  const now = opts.now ?? new Date();
  const skip = new Set(opts.exclude ?? []);
  const d = await db();

  const posts = (await d.select().from(schema.trackedPosts)).filter((p) => !skip.has(p.businessUserId));
  const postIds = posts.map((p) => p.id);
  const coupons = postIds.length ? await d.select().from(schema.coupons).where(inArray(schema.coupons.trackedPostId, postIds)) : [];
  const redeemed = coupons.filter((c) => c.redeemedAt);
  const postOf = new Map(posts.map((p) => [p.id, p]));

  // 1. Businesses with a coupon redeemed in the last 14 days.
  const active = new Set(redeemed.filter((c) => now.getTime() - c.redeemedAt!.getTime() <= 14 * DAY).map((c) => postOf.get(c.trackedPostId)!.businessUserId));
  const tracking = new Set(posts.map((p) => p.businessUserId));

  // 2. Customers per post, for posts at least 3 days old (younger ones haven't had a fair chance).
  const perPost = new Map<string, number>();
  for (const c of redeemed) perPost.set(c.trackedPostId, (perPost.get(c.trackedPostId) ?? 0) + 1);
  const settled = posts.filter((p) => now.getTime() - p.createdAt.getTime() >= 3 * DAY).map((p) => perPost.get(p.id) ?? 0).sort((a, b) => a - b);
  const byPin = redeemed.filter((c) => c.redeemedBy === "pin").length;

  // 3. Paying businesses and MRR (plans aren't billed in the pilot, so "would pay" is shown next to it).
  const bizRows = (await d.select({ userId: schema.businessProfiles.userId, plan: schema.businessProfiles.plan, interest: schema.businessProfiles.planInterest }).from(schema.businessProfiles)).filter((b) => !skip.has(b.userId));
  const paying = bizRows.filter((b) => isPlanId(b.plan) && b.plan !== "free");
  const mrr = paying.reduce((s, b) => s + PLANS[b.plan as keyof typeof PLANS].priceInr, 0);
  const willing = bizRows.filter((b) => isPlanId(b.interest) && b.interest !== "free");
  const willingMrr = willing.reduce((s, b) => s + PLANS[b.interest as keyof typeof PLANS].priceInr, 0);
  const paidDeals = (await d.select({ creator: schema.deals.creatorUserId, business: schema.deals.businessUserId }).from(schema.deals).innerJoin(schema.dealOutcomes, eq(schema.dealOutcomes.dealId, schema.deals.id)).where(and(eq(schema.deals.source, "mitra"), isNotNull(schema.dealOutcomes.paidAt)))).filter((r) => !r.business || !skip.has(r.business));

  // 4. Repeat: a second tracked post within 30 days of the first. Counted over businesses whose first post is 30+
  // days old, plus any that already repeated sooner (they've answered the question).
  const firstTwo = new Map<string, Date[]>();
  for (const p of [...posts].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())) {
    const list = firstTwo.get(p.businessUserId) ?? [];
    if (list.length < 2) list.push(p.createdAt);
    firstTwo.set(p.businessUserId, list);
  }
  let repeatBase = 0;
  let repeated = 0;
  for (const [, [first, second]] of firstTwo) {
    const did = Boolean(second && second.getTime() - first.getTime() <= 30 * DAY);
    if (did || now.getTime() - first.getTime() >= 30 * DAY) {
      repeatBase++;
      if (did) repeated++;
    }
  }

  // 5. Creators using the inbox, by how offers arrived, and scams flagged.
  const inbox = (await d.select({ userId: schema.inboxOffers.userId, source: schema.inboxOffers.source, verdict: schema.inboxOffers.verdict, at: schema.inboxOffers.receivedAt }).from(schema.inboxOffers)).filter((r) => !skip.has(r.userId));
  const bySource: Record<string, number> = {};
  for (const r of inbox) bySource[r.source] = (bySource[r.source] ?? 0) + 1;
  const scams = inbox.filter((r) => (r.verdict as { verdict?: string } | null)?.verdict === "likely_scam").length;
  const reports = (await d.select({ userId: schema.senderReports.userId, kind: schema.senderReports.kind }).from(schema.senderReports)).filter((r) => !skip.has(r.userId));

  // Weekly trend, last 8 weeks (weeks end today).
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const end = now.getTime() - i * 7 * DAY;
    const start = end - 7 * DAY;
    const inWeek = (t: Date | null) => Boolean(t && t.getTime() > start && t.getTime() <= end);
    return {
      weekEnding: new Date(end).toISOString().slice(0, 10),
      newPosts: posts.filter((p) => inWeek(p.createdAt)).length,
      customers: redeemed.filter((c) => inWeek(c.redeemedAt)).length,
      inboxOffers: inbox.filter((r) => inWeek(r.at)).length,
      activeBusinesses: new Set(redeemed.filter((c) => inWeek(c.redeemedAt)).map((c) => postOf.get(c.trackedPostId)!.businessUserId)).size,
    };
  }).reverse();

  return {
    asOf: now.toISOString(),
    activeBusinesses: { value: active.size, target: 20, tracking: tracking.size, posts: posts.length },
    customersPerPost: { median: pct(settled, 50), p25: pct(settled, 25), p75: pct(settled, 75), max: settled.length ? settled[settled.length - 1] : null, posts: settled.length, total: redeemed.length, byPin, byCounter: redeemed.length - byPin },
    paying: { value: paying.length + new Set(paidDeals.map((r) => r.business)).size, onPlans: paying.length, mrrInr: mrr, paidDeals: paidDeals.length, wouldPay: willing.length, wouldPayMrrInr: willingMrr, target: "5-10" },
    repeat: { rate: repeatBase ? Math.round((repeated / repeatBase) * 100) : null, repeated, of: repeatBase, target: 50 },
    inbox: { creators: new Set(inbox.map((r) => r.userId)).size, offers: inbox.length, bySource, scamsFlagged: scams, scamReports: reports.filter((r) => r.kind === "scam").length, target: 100 },
    weeks,
  };
}

/**
 * Counted customers by day for checking against the bill book: one row per business, day and code, with how each
 * was redeemed. `businessUserId` limits it to one business (the owner's own download).
 */
export async function billCheckRows(opts: { businessUserId?: string; since?: Date; exclude?: string[] } = {}) {
  const d = await db();
  const since = opts.since ?? new Date(Date.now() - 60 * DAY);
  const rows = await d
    .select({
      business: schema.businessProfiles.name,
      area: schema.businessProfiles.area,
      businessUserId: schema.trackedPosts.businessUserId,
      code: schema.trackedPosts.promoCode,
      creator: schema.trackedPosts.creatorName,
      kind: schema.trackedPosts.kind,
      day: sql<string>`to_char(${schema.coupons.redeemedAt} at time zone 'Asia/Kolkata', 'YYYY-MM-DD')`,
      byPin: sql<number>`count(*) filter (where ${schema.coupons.redeemedBy} = 'pin')::int`,
      byCounter: sql<number>`count(*) filter (where ${schema.coupons.redeemedBy} = 'counter')::int`,
      customers: sql<number>`count(*)::int`,
    })
    .from(schema.coupons)
    .innerJoin(schema.trackedPosts, eq(schema.trackedPosts.id, schema.coupons.trackedPostId))
    .leftJoin(schema.businessProfiles, eq(schema.businessProfiles.userId, schema.trackedPosts.businessUserId))
    .where(and(isNotNull(schema.coupons.redeemedAt), gt(schema.coupons.redeemedAt, since), opts.businessUserId ? eq(schema.trackedPosts.businessUserId, opts.businessUserId) : undefined))
    .groupBy(schema.businessProfiles.name, schema.businessProfiles.area, schema.trackedPosts.businessUserId, schema.trackedPosts.promoCode, schema.trackedPosts.creatorName, schema.trackedPosts.kind, sql`7`)
    .orderBy(sql`7 desc`, schema.businessProfiles.name, schema.trackedPosts.promoCode);
  const skip = new Set(opts.exclude ?? []);
  return rows.filter((r) => !skip.has(r.businessUserId));
}

/** CSV with every cell quoted and spreadsheet formulas neutralised. */
export function toCsv(header: string[], rows: unknown[][]): string {
  const cell = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
  };
  return [header.map(cell).join(","), ...rows.map((r) => r.map(cell).join(","))].join("\n");
}

/** The bill-check sheet: counted customers per day and code, with blank columns for the bill count and a note. */
export function billCheckCsv(rows: Awaited<ReturnType<typeof billCheckRows>>): string {
  return toCsv(
    ["Date", "Business", "Area", "Code", "Creator", "Deal", "Customers counted", "By PIN", "By counter mode", "Customers on the bill (fill in)", "Note"],
    rows.map((r) => [r.day, r.business ?? "", r.area ?? "", r.code, r.creator, r.kind, r.customers, r.byPin, r.byCounter, "", ""]),
  );
}
