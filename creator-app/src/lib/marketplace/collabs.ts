import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import { isVerified } from "./store";

/*
 * Collabs in one go: every business that joins Mitra appears for creators straight away (unless it unlists
 * itself), ranked to the creator's profile with the reasons shown; creators say "I'm interested" and the business
 * sees them. The business side gets the same: opted-in creators who fit it, with reasons.
 */

/** Words in a business's category that mean a creator niche. */
const NICHE_WORDS: Record<string, RegExp> = {
  food: /caf[eé]|restaurant|bakery|dosa|darshini|hotel|tea|coffee|biryani|sweet|juice|food|kitchen|mess|bar|pub|brew|pizza|burger|ice ?cream|chaat/i,
  fitness: /gym|yoga|fitness|crossfit|pilates|zumba|martial|sports|dance/i,
  beauty: /salon|spa|beauty|makeup|parlou?r|nail|skin|hair|derma|aesthetic/i,
  fashion: /boutique|cloth|saree|fashion|tailor|jewel|apparel|footwear|ethnic|wear/i,
  tech: /mobile|electronic|tech|gadget|computer|laptop|software|app\b/i,
  education: /coaching|tuition|school|academy|class|institute|training|learn/i,
  travel: /travel|tour|resort|homestay|hotel|stay|trek/i,
  family: /kids|toy|play ?school|baby|family/i,
  lifestyle: /home|decor|furniture|florist|gift|pet|book|store|shop|mall/i,
  devotional: /temple|puja|pooja|devotional|spiritual/i,
};

export function nichesForCategory(category: string | null | undefined): string[] {
  if (!category) return [];
  return Object.entries(NICHE_WORDS)
    .filter(([, re]) => re.test(category))
    .map(([n]) => n);
}

const sameArea = (a?: string | null, b?: string | null) => Boolean(a && b && a.trim().toLowerCase() === b.trim().toLowerCase());
const compact = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1).replace(/\.0$/, "")}K` : String(n));

export type BusinessCard = {
  userId: string;
  name: string;
  category: string | null;
  area: string | null;
  website: string | null;
  instagram: string | null;
  openBriefs: number;
  reasons: string[];
  score: number;
  interested: boolean;
  isNew: boolean;
};

/** Listed businesses, best fit for this creator first, with why each fits. */
export async function businessesFor(creatorUserId: string, now = new Date()): Promise<BusinessCard[]> {
  const d = await db();
  const [[creator], rows, briefs, mine] = await Promise.all([
    d.select().from(schema.creatorProfiles).where(eq(schema.creatorProfiles.userId, creatorUserId)),
    d
      .select({ biz: schema.businessProfiles, role: schema.members.role })
      .from(schema.businessProfiles)
      .innerJoin(schema.members, eq(schema.members.userId, schema.businessProfiles.userId))
      .where(and(eq(schema.businessProfiles.listed, true), ne(schema.businessProfiles.userId, creatorUserId))),
    d.select({ business: schema.opportunities.businessUserId }).from(schema.opportunities).where(eq(schema.opportunities.status, "open")),
    d.select({ business: schema.businessInterests.businessUserId }).from(schema.businessInterests).where(eq(schema.businessInterests.creatorUserId, creatorUserId)),
  ]);
  const open = new Map<string, number>();
  for (const b of briefs) open.set(b.business, (open.get(b.business) ?? 0) + 1);
  const interested = new Set(mine.map((m) => m.business));
  const niches = new Set(creator?.niches ?? []);
  return rows
    .filter((r) => r.role !== "creator")
    .map(({ biz, role }) => {
      const reasons: string[] = [];
      let score = 0;
      if (sameArea(biz.area, creator?.area)) {
        reasons.push(`In ${biz.area}, your area`);
        score += 3;
      } else if (biz.area) reasons.push(`In ${biz.area}`);
      const shared = nichesForCategory(biz.category).filter((n) => niches.has(n));
      if (shared.length) {
        reasons.push(`Fits your ${shared.join(" and ")} content`);
        score += 3;
      }
      const briefsOpen = open.get(biz.userId) ?? 0;
      if (briefsOpen) {
        reasons.push(briefsOpen === 1 ? "Looking for creators now" : `${briefsOpen} open briefs`);
        score += 2;
      }
      if (role === "brand") reasons.push("Brand");
      const isNew = now.getTime() - biz.createdAt.getTime() < 7 * 86_400_000;
      if (isNew) score += 1;
      return { userId: biz.userId, name: biz.name, category: biz.category, area: biz.area, website: biz.website, instagram: biz.instagram, openBriefs: briefsOpen, reasons, score, interested: interested.has(biz.userId), isNew };
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

export async function setBusinessInterest(creatorUserId: string, businessUserId: string, on: boolean): Promise<boolean> {
  const d = await db();
  const [b] = await d.select({ id: schema.businessProfiles.userId }).from(schema.businessProfiles).where(and(eq(schema.businessProfiles.userId, businessUserId), eq(schema.businessProfiles.listed, true)));
  if (!b || businessUserId === creatorUserId) return false;
  if (on) await d.insert(schema.businessInterests).values({ creatorUserId, businessUserId }).onConflictDoNothing();
  else await d.delete(schema.businessInterests).where(and(eq(schema.businessInterests.creatorUserId, creatorUserId), eq(schema.businessInterests.businessUserId, businessUserId)));
  return true;
}

export type CreatorCard = { userId: string; name: string; area: string | null; niches: string[]; kit: string | null; reach: string | null; verified: boolean; reasons: string[]; score: number };

async function creatorCards(userIds: string[] | null, business: { area: string | null; category: string | null }): Promise<CreatorCard[]> {
  const d = await db();
  const profiles = await d
    .select()
    .from(schema.creatorProfiles)
    .where(userIds ? inArray(schema.creatorProfiles.userId, userIds.length ? userIds : ["-"]) : eq(schema.creatorProfiles.openToOffers, true));
  if (!profiles.length) return [];
  const handles = await d.select().from(schema.creatorHandles).where(inArray(schema.creatorHandles.userId, profiles.map((p) => p.userId)));
  const wanted = new Set(nichesForCategory(business.category));
  return profiles
    .map((p) => {
      const hs = handles.filter((h) => h.userId === p.userId && h.followers);
      const best = hs.sort((a, b) => (isVerified(b) ? 1 : 0) - (isVerified(a) ? 1 : 0) || (b.followers ?? 0) - (a.followers ?? 0))[0];
      const verified = Boolean(best && isVerified(best));
      const reasons: string[] = [];
      let score = 0;
      if (sameArea(p.area, business.area)) {
        reasons.push(`Based in ${p.area}`);
        score += 3;
      }
      const shared = p.niches.filter((n) => wanted.has(n));
      if (shared.length) {
        reasons.push(`Makes ${shared.join(" and ")} content`);
        score += 3;
      }
      if (best) reasons.push(`${compact(best.followers!)} on ${best.platform === "youtube" ? "YouTube" : best.platform === "instagram" ? "Instagram" : best.platform}${verified ? " (verified)" : " (self-reported)"}`);
      if (best?.avgViews) reasons.push(`${compact(best.avgViews)} average views`);
      if (verified && best?.stats?.engagementRate != null) reasons.push(`${best.stats.engagementRate}% engagement`);
      const topCity = verified ? best?.stats?.audience?.cities[0] : undefined;
      if (topCity) reasons.push(`${topCity.pct}% of followers in ${topCity.name}`);
      if (verified) score += 2;
      if (p.languages.includes("kn")) reasons.push("Posts in Kannada");
      return { userId: p.userId, name: p.displayName, area: p.area, niches: p.niches, kit: p.isPublic ? `/kit/${p.slug}` : null, reach: best ? compact(best.followers!) : null, verified, reasons, score };
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

/** Creators who said they're interested in this business, newest first. */
export async function interestedCreators(businessUserId: string): Promise<(CreatorCard & { at: Date })[]> {
  const d = await db();
  const rows = await d.select().from(schema.businessInterests).where(eq(schema.businessInterests.businessUserId, businessUserId)).orderBy(desc(schema.businessInterests.createdAt));
  if (!rows.length) return [];
  const [biz] = await d.select().from(schema.businessProfiles).where(eq(schema.businessProfiles.userId, businessUserId));
  const cards = await creatorCards(rows.map((r) => r.creatorUserId), { area: biz?.area ?? null, category: biz?.category ?? null });
  const at = new Map(rows.map((r) => [r.creatorUserId, r.createdAt]));
  return cards.map((c) => ({ ...c, at: at.get(c.userId)! })).sort((a, b) => b.at.getTime() - a.at.getTime());
}

/** Creators who opted in to be found and fit this business (same area or a matching niche), best first. */
export async function creatorsFor(businessUserId: string, limit = 6): Promise<CreatorCard[]> {
  const [biz] = await (await db()).select().from(schema.businessProfiles).where(eq(schema.businessProfiles.userId, businessUserId));
  if (!biz) return [];
  return (await creatorCards(null, { area: biz.area, category: biz.category })).filter((c) => c.score >= 3 && c.userId !== businessUserId).slice(0, limit);
}
