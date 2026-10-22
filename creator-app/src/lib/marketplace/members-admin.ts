import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { isVerified } from "./store";

/** Admin: everyone on the marketplace with their profile and what they've done, newest first. */
export async function adminMembers() {
  const d = await db();
  const toMap = async (q: Promise<{ id: string; n: number }[]>) => new Map((await q).map((r) => [r.id, r.n]));
  const n = sql<number>`count(*)::int`;
  const [rows, creators, businesses, handles, lastSeen, tracked, inbox, programs, interestsGiven, interestsGot, briefs, deals, passes, autos, dmsSent] = await Promise.all([
    d.select({ m: schema.members, email: schema.users.email, name: schema.users.name, joined: schema.users.createdAt }).from(schema.members).innerJoin(schema.users, eq(schema.users.id, schema.members.userId)).orderBy(desc(schema.users.createdAt)),
    d.select().from(schema.creatorProfiles),
    d.select().from(schema.businessProfiles),
    d.select().from(schema.creatorHandles),
    d.select({ id: schema.sessions.userId, at: sql<Date>`max(${schema.sessions.createdAt})` }).from(schema.sessions).groupBy(schema.sessions.userId),
    toMap(d.select({ id: schema.trackedPosts.businessUserId, n }).from(schema.trackedPosts).groupBy(schema.trackedPosts.businessUserId)),
    toMap(d.select({ id: schema.inboxOffers.userId, n }).from(schema.inboxOffers).groupBy(schema.inboxOffers.userId)),
    toMap(d.select({ id: schema.programInterests.userId, n }).from(schema.programInterests).groupBy(schema.programInterests.userId)),
    toMap(d.select({ id: schema.businessInterests.creatorUserId, n }).from(schema.businessInterests).groupBy(schema.businessInterests.creatorUserId)),
    toMap(d.select({ id: schema.businessInterests.businessUserId, n }).from(schema.businessInterests).groupBy(schema.businessInterests.businessUserId)),
    toMap(d.select({ id: schema.opportunities.businessUserId, n }).from(schema.opportunities).groupBy(schema.opportunities.businessUserId)),
    toMap(d.select({ id: schema.deals.creatorUserId, n }).from(schema.deals).groupBy(schema.deals.creatorUserId)),
    d.select().from(schema.creatorPasses),
    toMap(d.select({ id: schema.dmAutomations.userId, n }).from(schema.dmAutomations).groupBy(schema.dmAutomations.userId)),
    toMap(d.select({ id: schema.dmEvents.userId, n }).from(schema.dmEvents).where(eq(schema.dmEvents.status, "sent")).groupBy(schema.dmEvents.userId)),
  ]);
  const pass = new Map(passes.map((p) => [p.userId, p]));
  const cp = new Map(creators.map((c) => [c.userId, c]));
  const bp = new Map(businesses.map((b) => [b.userId, b]));
  const seen = new Map(lastSeen.map((r) => [r.id, r.at]));
  return rows.map(({ m, email, name, joined }) => {
    const c = cp.get(m.userId);
    const b = bp.get(m.userId);
    const hs = handles.filter((h) => h.userId === m.userId);
    return {
      userId: m.userId,
      role: m.role,
      email,
      name: c?.displayName ?? b?.name ?? name ?? "",
      language: m.uiLanguage,
      area: c?.area ?? b?.area ?? null,
      what: c ? c.niches.join(", ") : (b?.category ?? null),
      handles: hs.map((h) => ({ platform: h.platform, handle: h.handle, followers: h.followers, verified: isVerified(h) })),
      openToOffers: c?.openToOffers ?? null,
      publicKit: c?.isPublic ? `/kit/${c.slug}` : null,
      listed: b?.listed ?? null,
      plan: b?.plan ?? null,
      planInterest: b?.planInterest ?? null,
      joined,
      lastSeen: seen.get(m.userId) ?? null,
      pass: { paidUntil: pass.get(m.userId)?.paidUntil ?? null, wantsAt: pass.get(m.userId)?.interestAt ?? null },
      counts: {
        trackedPosts: tracked.get(m.userId) ?? 0,
        briefs: briefs.get(m.userId) ?? 0,
        inboxOffers: inbox.get(m.userId) ?? 0,
        deals: deals.get(m.userId) ?? 0,
        programInterests: programs.get(m.userId) ?? 0,
        businessInterests: interestsGiven.get(m.userId) ?? 0,
        creatorsInterested: interestsGot.get(m.userId) ?? 0,
        autoDms: autos.get(m.userId) ?? 0,
        dmsSent: dmsSent.get(m.userId) ?? 0,
      },
    };
  });
}

export type AdminMember = Awaited<ReturnType<typeof adminMembers>>[number];
