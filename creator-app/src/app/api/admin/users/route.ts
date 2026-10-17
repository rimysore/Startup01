import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { currentUser, isAdmin } from "@/lib/auth";
import { monthKey } from "@/lib/usage";

/**
 * Admins only: who signed up and what they've done. Without `?id`, one row per creator; with it, that creator's
 * AI use by feature, latest calls and reports. Counts only real AI calls (cached answers aren't logged), and no
 * prompt or answer text is ever stored, so none is shown.
 */
export async function GET(request: Request) {
  const me = await currentUser();
  if (!isAdmin(me)) return Response.json({ error: "Not found" }, { status: 404 });
  const d = await db();
  const id = new URL(request.url).searchParams.get("id");
  const u = schema.users;
  const c = schema.aiCalls;
  const n = schema.notifications;
  const month = monthKey();

  if (!id) {
    const rows = await d
      .select({
        id: u.id,
        email: u.email,
        name: u.name,
        plan: u.plan,
        language: u.language,
        founderNumber: u.founderNumber,
        createdAt: u.createdAt,
        channel: schema.youtubeConnections.channelTitle,
        needsReconnect: schema.youtubeConnections.needsReconnectAt,
        whatsapp: schema.whatsappContacts.phone,
        creditsUsed: schema.usage.credits,
        founderUses: schema.usage.founderUses,
        lastSeen: sql<string | null>`(select max(${schema.sessions.createdAt}) from ${schema.sessions} where ${schema.sessions.userId} = ${u.id})`,
        aiCalls: sql<number>`(select count(*)::int from ${c} where ${c.userId} = ${u.id})`,
        lastAi: sql<string | null>`(select max(${c.createdAt}) from ${c} where ${c.userId} = ${u.id})`,
        costMicros: sql<number>`(select coalesce(sum(${c.costMicros}), 0)::bigint from ${c} where ${c.userId} = ${u.id})`,
        reportsSent: sql<number>`(select count(*)::int from ${n} where ${n.userId} = ${u.id} and ${n.status} = 'sent')`,
      })
      .from(u)
      .leftJoin(schema.youtubeConnections, eq(schema.youtubeConnections.userId, u.id))
      .leftJoin(schema.whatsappContacts, eq(schema.whatsappContacts.userId, u.id))
      .leftJoin(schema.usage, and(eq(schema.usage.userId, u.id), eq(schema.usage.month, month)))
      .orderBy(desc(u.createdAt))
      .limit(500);
    return Response.json({
      month,
      users: rows.map((r) => ({
        ...r,
        whatsapp: r.whatsapp ? `+${r.whatsapp.slice(0, 2)}••••${r.whatsapp.slice(-3)}` : null,
        needsReconnect: Boolean(r.needsReconnect),
        creditsUsed: r.creditsUsed ?? 0,
        founderUses: r.founderUses ?? 0,
        costUsd: Number(r.costMicros) / 1e6,
      })),
    });
  }

  const [user] = await d.select().from(u).where(eq(u.id, id));
  if (!user) return Response.json({ error: "No such user" }, { status: 404 });
  const [byFeature, recent, reports, months] = await Promise.all([
    d
      .select({
        feature: c.feature,
        calls: sql<number>`count(*)::int`,
        costMicros: sql<number>`sum(${c.costMicros})::bigint`,
        first: sql<string>`min(${c.createdAt})`,
        last: sql<string>`max(${c.createdAt})`,
      })
      .from(c)
      .where(eq(c.userId, id))
      .groupBy(c.feature)
      .orderBy(desc(sql`count(*)`)),
    d.select({ feature: c.feature, model: c.model, costMicros: c.costMicros, latencyMs: c.latencyMs, createdAt: c.createdAt }).from(c).where(eq(c.userId, id)).orderBy(desc(c.createdAt)).limit(40),
    d.select({ kind: n.kind, key: n.key, channel: n.channel, status: n.status, error: n.error, createdAt: n.createdAt, sentAt: n.sentAt }).from(n).where(eq(n.userId, id)).orderBy(desc(n.createdAt)).limit(30),
    d.select().from(schema.usage).where(eq(schema.usage.userId, id)).orderBy(desc(schema.usage.month)).limit(6),
  ]);
  return Response.json({
    user: { id: user.id, email: user.email, name: user.name, plan: user.plan, language: user.language, createdAt: user.createdAt, founderNumber: user.founderNumber },
    byFeature: byFeature.map((f) => ({ ...f, costUsd: Number(f.costMicros) / 1e6 })),
    recent: recent.map((r) => ({ ...r, costUsd: r.costMicros / 1e6 })),
    reports,
    months,
  });
}
