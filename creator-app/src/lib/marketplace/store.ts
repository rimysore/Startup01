import { and, desc, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { checkOffer } from "@/lib/offer-check";
import { CONSENT_VERSION, DEAL_STATUSES, DELIVERABLES, NICHES, PLATFORMS, ROLES, UI_LANGS, type Deliverable, type UiLang } from "./flag";

export type Member = typeof schema.members.$inferSelect;
export type CreatorProfile = typeof schema.creatorProfiles.$inferSelect;
export type CreatorHandle = typeof schema.creatorHandles.$inferSelect;
export type BusinessProfile = typeof schema.businessProfiles.$inferSelect;
export type Deal = typeof schema.deals.$inferSelect;
export type DealOutcome = typeof schema.dealOutcomes.$inferSelect;

/** Verification through a connected account counts for 30 days (YouTube's limit on keeping API data). */
export const VERIFIED_DAYS = 30;
export const isVerified = (h: Pick<CreatorHandle, "verifiedAt">, now = Date.now()) => Boolean(h.verifiedAt && now - h.verifiedAt.getTime() < VERIFIED_DAYS * 86_400_000);

const text = (max: number) => z.string().trim().max(max);
const optText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));
const rupees = z.coerce.number().int().min(0).max(10_000_000).optional().nullable();

/* ---- Members ---- */

export const JoinInput = z.object({
  role: z.enum(ROLES),
  uiLanguage: z.enum(UI_LANGS),
  terms: z.literal(true),
  contact: z.boolean().default(false),
});

export async function getMember(userId: string): Promise<Member | null> {
  const [m] = await (await db()).select().from(schema.members).where(eq(schema.members.userId, userId));
  return m ?? null;
}

/** Joins (or re-joins with a new role/language), and logs the consents with the wording version. */
export async function joinMarketplace(userId: string, input: z.infer<typeof JoinInput>): Promise<Member> {
  const d = await db();
  const [m] = await d
    .insert(schema.members)
    .values({ userId, role: input.role, uiLanguage: input.uiLanguage })
    .onConflictDoUpdate({ target: schema.members.userId, set: { role: input.role, uiLanguage: input.uiLanguage, updatedAt: new Date() } })
    .returning();
  await d.insert(schema.consents).values([
    { userId, kind: "terms", granted: true, version: CONSENT_VERSION },
    { userId, kind: "contact", granted: input.contact, version: CONSENT_VERSION },
  ]);
  return m;
}

export async function setUiLanguage(userId: string, lang: UiLang): Promise<void> {
  await (await db()).update(schema.members).set({ uiLanguage: lang, updatedAt: new Date() }).where(eq(schema.members.userId, userId));
}

/* ---- Creator profile and media kit ---- */

export const HandleInput = z.object({
  platform: z.enum(PLATFORMS),
  handle: text(80).transform((h) => h.replace(/^https?:\/\/(www\.)?[^/]+\//i, "").replace(/^@/, "").replace(/\/$/, "")),
  followers: z.coerce.number().int().min(0).max(1_000_000_000).optional().nullable(),
  avgViews: z.coerce.number().int().min(0).max(1_000_000_000).optional().nullable(),
});

export const KitInput = z.object({
  displayName: text(60).min(1),
  bio: optText(160),
  area: optText(60),
  niches: z.array(z.enum(NICHES)).max(4).default([]),
  languages: z.array(z.enum(["kn", "en"])).max(2).default([]),
  handles: z.array(HandleInput).max(PLATFORMS.length).default([]),
  rates: z.array(z.object({ deliverable: z.enum(DELIVERABLES), priceInr: z.coerce.number().int().min(0).max(10_000_000) })).max(DELIVERABLES.length).default([]),
  contactEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email()
    .max(200)
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  /** Indian mobile number for WhatsApp, shared with a business only after accepting its invite. */
  whatsapp: z
    .string()
    .trim()
    .max(20)
    .transform((v) => v.replace(/[^\d+]/g, ""))
    .refine((v) => v === "" || /^\+?\d{10,13}$/.test(v), "whatsapp")
    .optional()
    .nullable()
    .transform((v) => v || null),
  isPublic: z.boolean().default(false),
  openToOffers: z.boolean().default(false),
});

export function slugify(name: string): string {
  const s = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  return s.length >= 3 ? s : `creator-${s || "kit"}`;
}

async function uniqueSlug(base: string, userId: string): Promise<string> {
  const d = await db();
  for (let i = 0; i < 50; i++) {
    const slug = i ? `${base}-${i + 1}` : base;
    const [taken] = await d
      .select({ userId: schema.creatorProfiles.userId })
      .from(schema.creatorProfiles)
      .where(and(eq(schema.creatorProfiles.slug, slug), ne(schema.creatorProfiles.userId, userId)));
    if (!taken) return slug;
  }
  return `${base}-${crypto.randomUUID().slice(0, 6)}`;
}

export async function getKit(userId: string): Promise<{ profile: CreatorProfile | null; handles: CreatorHandle[] }> {
  const d = await db();
  const [profile] = await d.select().from(schema.creatorProfiles).where(eq(schema.creatorProfiles.userId, userId));
  const handles = await d.select().from(schema.creatorHandles).where(eq(schema.creatorHandles.userId, userId));
  return { profile: profile ?? null, handles };
}

export async function getPublicKit(slug: string): Promise<{ profile: CreatorProfile; handles: CreatorHandle[] } | null> {
  const d = await db();
  const [profile] = await d
    .select()
    .from(schema.creatorProfiles)
    .where(and(eq(schema.creatorProfiles.slug, slug), eq(schema.creatorProfiles.isPublic, true)));
  if (!profile) return null;
  const handles = await d.select().from(schema.creatorHandles).where(eq(schema.creatorHandles.userId, profile.userId));
  return { profile, handles };
}

/**
 * Saves the media kit. Handles not sent are removed. Typed numbers on a verified handle are ignored (its numbers
 * come from the connection), and changing a verified handle's name drops the verification.
 */
export async function saveKit(userId: string, input: z.infer<typeof KitInput>): Promise<CreatorProfile> {
  const d = await db();
  const existing = await getKit(userId);
  const slug = existing.profile?.slug ?? (await uniqueSlug(slugify(input.displayName), userId));
  const values = {
    displayName: input.displayName,
    bio: input.bio,
    area: input.area,
    niches: input.niches,
    languages: input.languages,
    rates: input.rates.filter((r) => r.priceInr > 0),
    contactEmail: input.contactEmail ?? null,
    whatsapp: input.whatsapp ?? null,
    isPublic: input.isPublic,
    openToOffers: input.openToOffers,
    updatedAt: new Date(),
  };
  const [profile] = await d
    .insert(schema.creatorProfiles)
    .values({ userId, slug, ...values })
    .onConflictDoUpdate({ target: schema.creatorProfiles.userId, set: values })
    .returning();
  if ((existing.profile?.isPublic ?? false) !== input.isPublic) {
    await d.insert(schema.consents).values({ userId, kind: "public_kit", granted: input.isPublic, version: CONSENT_VERSION });
  }
  if ((existing.profile?.openToOffers ?? false) !== input.openToOffers) {
    await d.insert(schema.consents).values({ userId, kind: "matching", granted: input.openToOffers, version: CONSENT_VERSION });
  }

  const keep = new Set(input.handles.filter((h) => h.handle).map((h) => h.platform));
  for (const old of existing.handles) if (!keep.has(old.platform as (typeof PLATFORMS)[number])) await d.delete(schema.creatorHandles).where(eq(schema.creatorHandles.id, old.id));
  for (const h of input.handles) {
    if (!h.handle) continue;
    const old = existing.handles.find((x) => x.platform === h.platform);
    const verified = old && isVerified(old) && old.handle === h.handle;
    const row = verified
      ? { handle: h.handle, updatedAt: new Date() }
      : { handle: h.handle, followers: h.followers ?? null, avgViews: h.avgViews ?? null, verifiedAt: null, verifiedBy: null, updatedAt: new Date() };
    if (old) await d.update(schema.creatorHandles).set(row).where(eq(schema.creatorHandles.id, old.id));
    else await d.insert(schema.creatorHandles).values({ userId, platform: h.platform, ...row });
  }
  return profile;
}

/** How complete a kit is (0-100): what a business needs to judge a creator. */
export function kitCompleteness(profile: CreatorProfile | null, handles: CreatorHandle[]): number {
  if (!profile) return 0;
  const parts = [
    Boolean(profile.displayName),
    Boolean(profile.bio),
    Boolean(profile.area),
    profile.niches.length > 0,
    profile.languages.length > 0,
    handles.length > 0,
    handles.some((h) => h.followers != null),
    profile.rates.length > 0,
    Boolean(profile.contactEmail),
  ];
  return Math.round((parts.filter(Boolean).length / parts.length) * 100);
}

/** Marks the YouTube handle verified with the connected channel's real subscriber count. */
export async function verifyYouTubeHandle(userId: string, channel: { title: string; subscribers: number }, now = new Date()): Promise<CreatorHandle> {
  const d = await db();
  const values = { handle: channel.title, followers: channel.subscribers, verifiedAt: now, verifiedBy: "youtube_connection", updatedAt: now };
  const [row] = await d
    .insert(schema.creatorHandles)
    .values({ userId, platform: "youtube", ...values })
    .onConflictDoUpdate({ target: [schema.creatorHandles.userId, schema.creatorHandles.platform], set: values })
    .returning();
  return row;
}

/**
 * What creators like this one charge for a deliverable: the middle half (25th-75th percentile) of rates set by
 * other creators sharing a niche. Only shown from 5 creators up, so no one's price can be singled out.
 */
export async function rateRange(userId: string, deliverable: Deliverable, niches: string[]): Promise<{ low: number; high: number; n: number } | null> {
  const d = await db();
  const rows = await d
    .select({ userId: schema.creatorProfiles.userId, niches: schema.creatorProfiles.niches, rates: schema.creatorProfiles.rates })
    .from(schema.creatorProfiles)
    .where(ne(schema.creatorProfiles.userId, userId));
  const prices = rows
    .filter((r) => !niches.length || r.niches.some((n) => niches.includes(n)))
    .map((r) => r.rates.find((x) => x.deliverable === deliverable)?.priceInr)
    .filter((p): p is number => typeof p === "number" && p > 0)
    .sort((a, b) => a - b);
  if (prices.length < 5) return null;
  const q = (p: number) => prices[Math.min(prices.length - 1, Math.floor(p * (prices.length - 1)))];
  return { low: q(0.25), high: q(0.75), n: prices.length };
}

/* ---- Business profile ---- */

export const BusinessInput = z
  .object({
    name: text(80).min(1),
    category: optText(80),
    area: optText(60),
    budgetMinInr: rupees,
    budgetMaxInr: rupees,
    website: optText(200),
    instagram: optText(80),
    /** Listed for creators on Mitra (name, category, area, website, Instagram; never budget or contacts). */
    listed: z.boolean().optional(),
    whatsapp: z
      .string()
      .trim()
      .max(20)
      .transform((v) => v.replace(/[^\d+]/g, ""))
      .refine((v) => v === "" || /^\+?\d{10,13}$/.test(v), "whatsapp")
      .optional()
      .nullable()
      .transform((v) => v || null),
  })
  .refine((b) => b.budgetMinInr == null || b.budgetMaxInr == null || b.budgetMinInr <= b.budgetMaxInr, { message: "budget", path: ["budgetMaxInr"] });

export async function getBusiness(userId: string): Promise<BusinessProfile | null> {
  const [b] = await (await db()).select().from(schema.businessProfiles).where(eq(schema.businessProfiles.userId, userId));
  return b ?? null;
}

export async function saveBusiness(userId: string, input: z.infer<typeof BusinessInput>): Promise<BusinessProfile> {
  const values = { ...input, listed: input.listed ?? true, budgetMinInr: input.budgetMinInr ?? null, budgetMaxInr: input.budgetMaxInr ?? null, whatsapp: input.whatsapp ?? null, updatedAt: new Date() };
  const [b] = await (await db())
    .insert(schema.businessProfiles)
    .values({ userId, ...values })
    .onConflictDoUpdate({ target: schema.businessProfiles.userId, set: values })
    .returning();
  return b;
}

/* ---- Deals (the creator's private log) ---- */

const DealFields = {
  counterparty: text(120).min(1),
  channel: z.enum(["whatsapp", "instagram", "email", "phone", "other"]).optional().nullable(),
  deliverables: optText(200),
  feeInr: rupees,
  barter: optText(200),
  postBy: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  paymentTerms: optText(200),
  usageTerms: optText(200),
  notes: optText(2000),
};

export const NewDealInput = z.object({
  ...DealFields,
  offerText: optText(4000),
  source: z.enum(["own", "mitra"]).default("own"),
});

export const UpdateDealInput = z
  .object({
    ...DealFields,
    status: z.enum(DEAL_STATUSES),
    outcome: z
      .object({
        promoCode: optText(40),
        trackedLink: optText(300),
        redemptions: z.coerce.number().int().min(0).max(10_000_000).optional().nullable(),
        paidInr: rupees,
        paidAt: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional()
          .nullable()
          .or(z.literal("").transform(() => null)),
        creatorRating: z.coerce.number().int().min(1).max(5).optional().nullable(),
      })
      .optional(),
  })
  .partial();

export async function createDeal(creatorUserId: string, input: z.infer<typeof NewDealInput>): Promise<Deal> {
  const checks = input.offerText ? checkOffer(input.offerText).map(({ term, state, text }) => ({ term, state, text })) : [];
  const [deal] = await (await db())
    .insert(schema.deals)
    .values({
      id: crypto.randomUUID(),
      creatorUserId,
      source: input.source,
      counterparty: input.counterparty,
      channel: input.channel ?? null,
      offerText: input.offerText,
      deliverables: input.deliverables,
      feeInr: input.feeInr ?? null,
      barter: input.barter,
      postBy: input.postBy ?? null,
      paymentTerms: input.paymentTerms,
      usageTerms: input.usageTerms,
      notes: input.notes,
      checks,
    })
    .returning();
  return deal;
}

export async function listDeals(creatorUserId: string): Promise<(Deal & { outcome: DealOutcome | null })[]> {
  const d = await db();
  const rows = await d
    .select({ deal: schema.deals, outcome: schema.dealOutcomes })
    .from(schema.deals)
    .leftJoin(schema.dealOutcomes, eq(schema.dealOutcomes.dealId, schema.deals.id))
    .where(eq(schema.deals.creatorUserId, creatorUserId))
    .orderBy(desc(schema.deals.createdAt));
  return rows.map((r) => ({ ...r.deal, outcome: r.outcome }));
}

/** A deal, only if it belongs to this creator. */
export async function getDeal(creatorUserId: string, id: string): Promise<(Deal & { outcome: DealOutcome | null }) | null> {
  const d = await db();
  const [row] = await d
    .select({ deal: schema.deals, outcome: schema.dealOutcomes })
    .from(schema.deals)
    .leftJoin(schema.dealOutcomes, eq(schema.dealOutcomes.dealId, schema.deals.id))
    .where(and(eq(schema.deals.id, id), eq(schema.deals.creatorUserId, creatorUserId)));
  return row ? { ...row.deal, outcome: row.outcome } : null;
}

export async function updateDeal(creatorUserId: string, id: string, input: z.infer<typeof UpdateDealInput>): Promise<boolean> {
  const d = await db();
  const { outcome, ...fields } = input;
  const set = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
  const [deal] = await d
    .update(schema.deals)
    .set({ ...set, updatedAt: new Date() })
    .where(and(eq(schema.deals.id, id), eq(schema.deals.creatorUserId, creatorUserId)))
    .returning({ id: schema.deals.id });
  if (!deal) return false;
  if (outcome) {
    const values = {
      promoCode: outcome.promoCode ?? null,
      trackedLink: outcome.trackedLink ?? null,
      redemptions: outcome.redemptions ?? null,
      paidInr: outcome.paidInr ?? null,
      paidAt: outcome.paidAt ? new Date(`${outcome.paidAt}T00:00:00Z`) : null,
      creatorRating: outcome.creatorRating ?? null,
      updatedAt: new Date(),
    };
    await d.insert(schema.dealOutcomes).values({ dealId: id, ...values }).onConflictDoUpdate({ target: schema.dealOutcomes.dealId, set: values });
  }
  return true;
}

export async function deleteDeal(creatorUserId: string, id: string): Promise<boolean> {
  const rows = await (await db())
    .delete(schema.deals)
    .where(and(eq(schema.deals.id, id), eq(schema.deals.creatorUserId, creatorUserId)))
    .returning({ id: schema.deals.id });
  return rows.length > 0;
}

/** The deal log's headline numbers: money actually received, and how many deals are still in play. */
export function dealTotals(deals: (Deal & { outcome: DealOutcome | null })[]) {
  const earned = deals.reduce((s, x) => s + (x.outcome?.paidInr ?? 0), 0);
  const open = deals.filter((x) => ["offered", "negotiating", "agreed", "posted"].includes(x.status)).length;
  const pending = deals.filter((x) => x.status === "agreed" || x.status === "posted").reduce((s, x) => s + (x.feeInr ?? 0), 0);
  return { earned, open, pending, count: deals.length };
}

