import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { checkOffer } from "@/lib/offer-check";
import { DELIVERABLES, MITRA_FEE_PCT, NICHES } from "./flag";
import { isVerified, type CreatorHandle, type CreatorProfile, type Deal, type DealOutcome } from "./store";

/*
 * The business side (weeks 3-4): a brief, Mitra's plan with matched creators and the reason for each, invites the
 * creator accepts or declines (contact details only after accepting), the deal room, and results counted by promo
 * code and tracked link. Matching is plain rules, so every suggestion can be explained.
 */

export type Opportunity = typeof schema.opportunities.$inferSelect;
export type Invite = typeof schema.invites.$inferSelect;

const optText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

/** https only, so a tracked link can't be turned into a redirect to anything else. */
const httpsUrl = z
  .string()
  .trim()
  .max(500)
  .optional()
  .nullable()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^https:\/\/[^\s/$.?#].[^\s]*$/i.test(v), "url");

export const BriefInput = z.object({
  goal: z.string().trim().min(3).max(160),
  brief: optText(1000),
  area: optText(60),
  niches: z.array(z.enum(NICHES)).max(4).default([]),
  languages: z.array(z.enum(["kn", "en"])).max(2).default([]),
  deliverables: z.array(z.enum(DELIVERABLES)).min(1).max(DELIVERABLES.length),
  budgetInr: z.coerce.number().int().min(500).max(10_000_000),
  postBy: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  destinationUrl: httpsUrl,
});

/* ---- Matching (pure) ---- */

export type Candidate = { profile: CreatorProfile; handles: CreatorHandle[] };
export type Match = { userId: string; displayName: string; slug: string; isPublic: boolean; area: string | null; score: number; reasons: string[]; suggestedFee: number | null; reach: number | null; verified: boolean };

const norm = (s: string | null | undefined) => (s ?? "").trim().toLowerCase();
const compact = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1).replace(/\.0$/, "")}K` : String(n));
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** What this creator charges for what the brief asks: the sum of their rates for those deliverables, if all are set. */
export function creatorFee(profile: Pick<CreatorProfile, "rates">, deliverables: readonly string[]): number | null {
  let total = 0;
  for (const d of deliverables) {
    const r = profile.rates.find((x) => x.deliverable === d)?.priceInr;
    if (!r) return null;
    total += r;
  }
  return total || null;
}

/**
 * Ranks creators for a brief, with the reasons a business sees. A creator must share the brief's niche or area to
 * be suggested at all; anyone whose own rates add up to more than the whole budget is left out. Verified numbers
 * and a known price rank higher.
 */
export function matchCreators(
  brief: Pick<Opportunity, "area" | "niches" | "languages" | "deliverables" | "budgetInr">,
  candidates: Candidate[],
  limit = 5,
): Match[] {
  const out: Match[] = [];
  for (const { profile: p, handles } of candidates) {
    const reasons: string[] = [];
    let score = 0;
    const niches = p.niches.filter((n) => brief.niches.includes(n));
    const sameArea = Boolean(brief.area && p.area && norm(brief.area) === norm(p.area));
    if (!niches.length && !sameArea) continue;
    if (niches.length) {
      score += 3 * niches.length;
      reasons.push(`Makes ${niches.join(" and ")} content`);
    }
    if (sameArea) {
      score += 4;
      reasons.push(`Based in ${p.area}`);
    }
    const langs = p.languages.filter((l) => brief.languages.includes(l));
    if (langs.length) {
      score += 2;
      reasons.push(`Posts in ${langs.map((l) => (l === "kn" ? "Kannada" : "English")).join(" and ")}`);
    } else if (brief.languages.length && p.languages.length) score -= 2;

    const verified = handles.filter((h) => isVerified(h) && h.followers != null);
    const reach = Math.max(0, ...handles.map((h) => h.followers ?? 0)) || null;
    if (verified.length) {
      score += 3;
      const v = verified.sort((a, b) => (b.followers ?? 0) - (a.followers ?? 0))[0];
      reasons.push(`Verified ${v.platform === "youtube" ? "YouTube" : v.platform}: ${compact(v.followers!)}`);
    } else if (reach) reasons.push(`${compact(reach)} followers (self-reported)`);

    const fee = creatorFee(p, brief.deliverables);
    if (fee != null && brief.budgetInr != null) {
      if (fee > brief.budgetInr) continue;
      score += 1;
      reasons.push(`Their rate: ${inr(fee)}`);
    }
    out.push({ userId: p.userId, displayName: p.displayName, slug: p.slug, isPublic: p.isPublic, area: p.area, score, reasons, suggestedFee: fee, reach, verified: verified.length > 0 });
  }
  return out.sort((a, b) => b.score - a.score || Number(b.verified) - Number(a.verified) || (b.reach ?? 0) - (a.reach ?? 0)).slice(0, limit);
}

/**
 * Mitra's plan for a budget: take the best matches in order while their fees fit, so the business sees who to invite
 * first and what's left. Creators without a stated price get an even share of what remains, marked as a suggestion.
 */
export function planBudget(budget: number, matches: Match[]): { picks: { userId: string; fee: number; suggested: boolean }[]; total: number; left: number } {
  const picks: { userId: string; fee: number; suggested: boolean }[] = [];
  let left = budget;
  for (const m of matches) {
    if (m.suggestedFee != null && m.suggestedFee <= left) {
      picks.push({ userId: m.userId, fee: m.suggestedFee, suggested: false });
      left -= m.suggestedFee;
    }
  }
  const unpriced = matches.filter((m) => m.suggestedFee == null).slice(0, Math.max(0, 3 - picks.length));
  if (unpriced.length && left >= 1000) {
    const share = Math.floor(left / unpriced.length / 100) * 100;
    for (const m of unpriced) if (share >= 500) picks.push({ userId: m.userId, fee: share, suggested: true });
    left -= share * picks.filter((p) => p.suggested).length;
  }
  return { picks, total: budget - left, left };
}

/** Mitra's fee on a deal it brought, in whole rupees. */
export const mitraFee = (feeInr: number | null) => (feeInr ? Math.round((feeInr * MITRA_FEE_PCT) / 100) : 0);

/* ---- Briefs ---- */

export async function createBrief(businessUserId: string, input: z.infer<typeof BriefInput>): Promise<Opportunity> {
  const [o] = await (await db())
    .insert(schema.opportunities)
    .values({ id: crypto.randomUUID(), businessUserId, ...input, status: "open" })
    .returning();
  return o;
}

export async function getBrief(businessUserId: string, id: string): Promise<Opportunity | null> {
  const [o] = await (await db())
    .select()
    .from(schema.opportunities)
    .where(and(eq(schema.opportunities.id, id), eq(schema.opportunities.businessUserId, businessUserId)));
  return o ?? null;
}

export async function listBriefs(businessUserId: string) {
  const d = await db();
  const briefs = await d.select().from(schema.opportunities).where(eq(schema.opportunities.businessUserId, businessUserId)).orderBy(desc(schema.opportunities.createdAt));
  if (!briefs.length) return [];
  const inv = await d
    .select({ opportunityId: schema.invites.opportunityId, status: schema.invites.status })
    .from(schema.invites)
    .where(inArray(schema.invites.opportunityId, briefs.map((b) => b.id)));
  return briefs.map((b) => ({ ...b, invited: inv.filter((i) => i.opportunityId === b.id).length, accepted: inv.filter((i) => i.opportunityId === b.id && i.status === "accepted").length }));
}

export async function setBriefStatus(businessUserId: string, id: string, status: "open" | "closed"): Promise<boolean> {
  const rows = await (await db())
    .update(schema.opportunities)
    .set({ status })
    .where(and(eq(schema.opportunities.id, id), eq(schema.opportunities.businessUserId, businessUserId)))
    .returning({ id: schema.opportunities.id });
  return rows.length > 0;
}

/** Creators who switched on "let businesses find me", minus anyone already invited to this brief. */
async function candidatesFor(briefId: string): Promise<Candidate[]> {
  const d = await db();
  const profiles = await d
    .select({ p: schema.creatorProfiles })
    .from(schema.creatorProfiles)
    .innerJoin(schema.members, and(eq(schema.members.userId, schema.creatorProfiles.userId), eq(schema.members.role, "creator")))
    .where(eq(schema.creatorProfiles.openToOffers, true));
  const invited = new Set((await d.select({ c: schema.invites.creatorUserId }).from(schema.invites).where(eq(schema.invites.opportunityId, briefId))).map((r) => r.c));
  const list = profiles.map((r) => r.p).filter((p) => !invited.has(p.userId));
  if (!list.length) return [];
  const handles = await d.select().from(schema.creatorHandles).where(inArray(schema.creatorHandles.userId, list.map((p) => p.userId)));
  return list.map((profile) => ({ profile, handles: handles.filter((h) => h.userId === profile.userId) }));
}

export async function matchesFor(brief: Opportunity, limit = 5): Promise<Match[]> {
  return matchCreators(brief, await candidatesFor(brief.id), limit);
}

/* ---- Invites ---- */

export const InviteInput = z.object({
  creatorUserId: z.string().min(1).max(80),
  feeInr: z.coerce.number().int().min(0).max(10_000_000),
  message: optText(600),
});

/** Invites a creator Mitra matched to this brief. The reasons shown to the business are kept with the invite. */
export async function inviteCreator(businessUserId: string, briefId: string, input: z.infer<typeof InviteInput>): Promise<Invite | "not_found" | "not_matched"> {
  const brief = await getBrief(businessUserId, briefId);
  if (!brief || brief.status !== "open") return "not_found";
  const match = (await matchesFor(brief, 50)).find((m) => m.userId === input.creatorUserId);
  if (!match) return "not_matched";
  const [inv] = await (await db())
    .insert(schema.invites)
    .values({ id: crypto.randomUUID(), opportunityId: brief.id, businessUserId, creatorUserId: input.creatorUserId, feeInr: input.feeInr, message: input.message, reasons: match.reasons })
    .onConflictDoNothing()
    .returning();
  return inv ?? "not_matched";
}

export async function withdrawInvite(businessUserId: string, inviteId: string): Promise<boolean> {
  const rows = await (await db())
    .update(schema.invites)
    .set({ status: "withdrawn", respondedAt: new Date() })
    .where(and(eq(schema.invites.id, inviteId), eq(schema.invites.businessUserId, businessUserId), eq(schema.invites.status, "pending")))
    .returning({ id: schema.invites.id });
  return rows.length > 0;
}

export async function invitesForCreator(creatorUserId: string) {
  return (await db())
    .select({ invite: schema.invites, brief: schema.opportunities, business: schema.businessProfiles })
    .from(schema.invites)
    .innerJoin(schema.opportunities, eq(schema.opportunities.id, schema.invites.opportunityId))
    .leftJoin(schema.businessProfiles, eq(schema.businessProfiles.userId, schema.invites.businessUserId))
    .where(and(eq(schema.invites.creatorUserId, creatorUserId), or(eq(schema.invites.status, "pending"), eq(schema.invites.status, "accepted"), eq(schema.invites.status, "declined"))))
    .orderBy(desc(schema.invites.createdAt));
}

export async function inviteForCreator(creatorUserId: string, inviteId: string) {
  const [row] = (await invitesForCreator(creatorUserId)).filter((r) => r.invite.id === inviteId);
  return row ?? null;
}

/** The brief as the creator reads it, also fed to the offer checker so the creator sees what's clear or missing. */
export function briefAsOffer(brief: Opportunity, feeInr: number | null, businessName: string): string {
  const what = brief.deliverables.map((d) => `1 ${d}`).join(" + ");
  return [
    `${businessName}: ${brief.goal}.`,
    brief.brief ?? "",
    `We'd like ${what}${feeInr ? ` for ₹${feeInr.toLocaleString("en-IN")}` : ""}${brief.postBy ? `, posted by ${brief.postBy}` : ""}.`,
    "Payment through the deal room after posting; posts are labelled as a paid partnership.",
  ]
    .filter(Boolean)
    .join(" ");
}

async function uniqueLinkCode(): Promise<string> {
  const d = await db();
  const abc = "abcdefghjkmnpqrstuvwxyz23456789";
  for (;;) {
    const code = Array.from(crypto.getRandomValues(new Uint8Array(7)), (b) => abc[b % abc.length]).join("");
    const [taken] = await d.select({ id: schema.dealOutcomes.dealId }).from(schema.dealOutcomes).where(eq(schema.dealOutcomes.linkCode, code));
    if (!taken) return code;
  }
}

/** A short code the shop can check at the counter: their name plus the creator's initials, e.g. RUCHI-SR. */
export function promoCodeFor(businessName: string, creatorName: string, n = 0): string {
  const biz = (businessName.normalize("NFKD").replace(/[^A-Za-z0-9 ]/g, "").split(/\s+/).find((w) => w.length >= 3) ?? "MITRA").slice(0, 6).toUpperCase();
  const who = creatorName
    .normalize("NFKD")
    .replace(/[^A-Za-z ]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return `${biz}-${who || "MT"}${n ? n + 1 : ""}`;
}

/**
 * The creator's answer. Accepting opens the deal in their log (source "mitra"), with a promo code and a tracked
 * link, and the deal room where both sides can see each other's contact details.
 */
export async function respondToInvite(creatorUserId: string, inviteId: string, accept: boolean): Promise<{ dealId: string | null } | null> {
  const d = await db();
  const row = await inviteForCreator(creatorUserId, inviteId);
  if (!row || row.invite.status !== "pending") return null;
  if (!accept) {
    await d.update(schema.invites).set({ status: "declined", respondedAt: new Date() }).where(eq(schema.invites.id, inviteId));
    return { dealId: null };
  }
  const { invite, brief } = row;
  const businessName = row.business?.name ?? "A local business";
  const offerText = briefAsOffer(brief, invite.feeInr, businessName);
  const [creator] = await d.select({ name: schema.creatorProfiles.displayName }).from(schema.creatorProfiles).where(eq(schema.creatorProfiles.userId, creatorUserId));
  const dealId = crypto.randomUUID();
  await d.insert(schema.deals).values({
    id: dealId,
    creatorUserId,
    businessUserId: invite.businessUserId,
    opportunityId: brief.id,
    source: "mitra",
    counterparty: businessName,
    channel: "other",
    offerText,
    deliverables: brief.deliverables.join(", "),
    feeInr: invite.feeInr,
    postBy: brief.postBy,
    paymentTerms: "Through the deal room after posting",
    status: "agreed",
    checks: checkOffer(offerText).map(({ term, state, text }) => ({ term, state, text })),
  });
  const taken = await d
    .select({ code: schema.dealOutcomes.promoCode })
    .from(schema.dealOutcomes)
    .innerJoin(schema.deals, eq(schema.deals.id, schema.dealOutcomes.dealId))
    .where(eq(schema.deals.businessUserId, invite.businessUserId));
  let n = 0;
  while (taken.some((t) => t.code === promoCodeFor(businessName, creator?.name ?? "", n))) n++;
  await d.insert(schema.dealOutcomes).values({ dealId, promoCode: promoCodeFor(businessName, creator?.name ?? "", n), linkCode: await uniqueLinkCode() });
  await d.update(schema.invites).set({ status: "accepted", respondedAt: new Date(), dealId }).where(eq(schema.invites.id, inviteId));
  return { dealId };
}

/* ---- Deal room and results ---- */

export type Room = {
  deal: Deal;
  outcome: DealOutcome | null;
  side: "creator" | "business";
  brief: Opportunity | null;
  creator: { name: string; slug: string | null; isPublic: boolean; email: string | null; whatsapp: string | null };
  business: { name: string; area: string | null; email: string; whatsapp: string | null; website: string | null; instagram: string | null };
  messages: { id: number; mine: boolean; body: string; at: Date }[];
};

/** A deal Mitra brought, for either side of it. Contact details are here because the creator accepted. */
export async function getRoom(userId: string, dealId: string): Promise<Room | null> {
  const d = await db();
  const [deal] = await d
    .select()
    .from(schema.deals)
    .where(and(eq(schema.deals.id, dealId), eq(schema.deals.source, "mitra"), or(eq(schema.deals.creatorUserId, userId), eq(schema.deals.businessUserId, userId))));
  if (!deal || !deal.businessUserId) return null;
  const [[outcome], [cp], [bp], [bu], [brief], msgs] = await Promise.all([
    d.select().from(schema.dealOutcomes).where(eq(schema.dealOutcomes.dealId, dealId)),
    d.select().from(schema.creatorProfiles).where(eq(schema.creatorProfiles.userId, deal.creatorUserId)),
    d.select().from(schema.businessProfiles).where(eq(schema.businessProfiles.userId, deal.businessUserId)),
    d.select({ email: schema.users.email }).from(schema.users).where(eq(schema.users.id, deal.businessUserId)),
    deal.opportunityId ? d.select().from(schema.opportunities).where(eq(schema.opportunities.id, deal.opportunityId)) : Promise.resolve([]),
    d.select().from(schema.dealMessages).where(eq(schema.dealMessages.dealId, dealId)).orderBy(schema.dealMessages.createdAt).limit(500),
  ]);
  return {
    deal,
    outcome: outcome ?? null,
    side: deal.creatorUserId === userId ? "creator" : "business",
    brief: brief ?? null,
    creator: { name: cp?.displayName ?? "Creator", slug: cp?.slug ?? null, isPublic: cp?.isPublic ?? false, email: cp?.contactEmail ?? null, whatsapp: cp?.whatsapp ?? null },
    business: { name: bp?.name ?? deal.counterparty, area: bp?.area ?? null, email: bu?.email ?? "", whatsapp: bp?.whatsapp ?? null, website: bp?.website ?? null, instagram: bp?.instagram ?? null },
    messages: msgs.map((m) => ({ id: m.id, mine: m.userId === userId, body: m.body, at: m.createdAt })),
  };
}

export async function postMessage(userId: string, dealId: string, body: string): Promise<boolean> {
  if (!(await getRoom(userId, dealId))) return false;
  await (await db()).insert(schema.dealMessages).values({ dealId, userId, body: body.trim().slice(0, 2000) });
  return true;
}

export const RoomUpdate = z.object({
  /** Business: customers who showed the code (+1 / -1 at the counter). */
  redemptionsDelta: z.number().int().min(-1).max(1).optional(),
  /** Business: amount paid to the creator. */
  paidInr: z.coerce.number().int().min(0).max(10_000_000).optional(),
  /** Creator: the post is live. */
  posted: z.boolean().optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
});

/** What each side may change in the room: the creator marks it posted; the business counts customers and pays. */
export async function updateRoom(userId: string, dealId: string, input: z.infer<typeof RoomUpdate>): Promise<boolean> {
  const room = await getRoom(userId, dealId);
  if (!room) return false;
  const d = await db();
  const now = new Date();
  if (room.side === "creator") {
    if (input.posted && ["agreed", "negotiating", "offered"].includes(room.deal.status)) await d.update(schema.deals).set({ status: "posted", updatedAt: now }).where(eq(schema.deals.id, dealId));
    if (input.rating) await d.update(schema.dealOutcomes).set({ creatorRating: input.rating, updatedAt: now }).where(eq(schema.dealOutcomes.dealId, dealId));
    return true;
  }
  if (input.redemptionsDelta) {
    await d
      .update(schema.dealOutcomes)
      .set({ redemptions: sql`greatest(0, coalesce(${schema.dealOutcomes.redemptions}, 0) + ${input.redemptionsDelta})`, updatedAt: now })
      .where(eq(schema.dealOutcomes.dealId, dealId));
  }
  if (input.paidInr != null) {
    await d.update(schema.dealOutcomes).set({ paidInr: input.paidInr, paidAt: input.paidInr > 0 ? now : null, updatedAt: now }).where(eq(schema.dealOutcomes.dealId, dealId));
    if (input.paidInr > 0) await d.update(schema.deals).set({ status: "paid", updatedAt: now }).where(eq(schema.deals.id, dealId));
  }
  if (input.rating) await d.update(schema.dealOutcomes).set({ businessRating: input.rating, updatedAt: now }).where(eq(schema.dealOutcomes.dealId, dealId));
  return true;
}

/** A brief's invites with their deals and results, and the totals a business cares about. */
export async function briefResults(businessUserId: string, briefId: string) {
  const d = await db();
  const rows = await d
    .select({ invite: schema.invites, creator: schema.creatorProfiles, deal: schema.deals, outcome: schema.dealOutcomes })
    .from(schema.invites)
    .leftJoin(schema.creatorProfiles, eq(schema.creatorProfiles.userId, schema.invites.creatorUserId))
    .leftJoin(schema.deals, eq(schema.deals.id, schema.invites.dealId))
    .leftJoin(schema.dealOutcomes, eq(schema.dealOutcomes.dealId, schema.invites.dealId))
    .where(and(eq(schema.invites.opportunityId, briefId), eq(schema.invites.businessUserId, businessUserId)))
    .orderBy(desc(schema.invites.createdAt));
  const spent = rows.reduce((s, r) => s + (r.outcome?.paidInr ?? 0), 0);
  const customers = rows.reduce((s, r) => s + (r.outcome?.redemptions ?? 0), 0);
  const clicks = rows.reduce((s, r) => s + (r.outcome?.clicks ?? 0), 0);
  return { rows, totals: { spent, customers, clicks, perCustomer: customers ? Math.round(spent / customers) : null } };
}

/** Counts a visit through a tracked link and says where to send it (the brief's link, else the business's site). */
export async function followLink(code: string): Promise<string | null> {
  if (!/^[a-z0-9]{5,12}$/.test(code)) return null;
  const d = await db();
  const [row] = await d
    .select({ dealId: schema.dealOutcomes.dealId, dest: schema.opportunities.destinationUrl, site: schema.businessProfiles.website })
    .from(schema.dealOutcomes)
    .innerJoin(schema.deals, eq(schema.deals.id, schema.dealOutcomes.dealId))
    .leftJoin(schema.opportunities, eq(schema.opportunities.id, schema.deals.opportunityId))
    .leftJoin(schema.businessProfiles, eq(schema.businessProfiles.userId, schema.deals.businessUserId))
    .where(eq(schema.dealOutcomes.linkCode, code));
  if (!row) return null;
  await d.update(schema.dealOutcomes).set({ clicks: sql`${schema.dealOutcomes.clicks} + 1` }).where(eq(schema.dealOutcomes.dealId, row.dealId));
  const url = row.dest ?? row.site;
  return url && /^https:\/\//i.test(url) ? url : null;
}

