import { createHmac, timingSafeEqual } from "node:crypto";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { SITE_URL } from "@/lib/company";
import { canUse } from "./pass";
import { DM_SCOPES, type Fetcher, IG_GRAPH, IG_VERSION, igJson, instagramConnection, instagramToken } from "./social";

/*
 * Auto-DM: someone comments a keyword on a creator's reel and Mitra sends them a private reply from the creator's
 * account, usually with a link (a business's coupon link, so the customer is counted at the counter). Built on
 * Instagram's official comment webhooks and private replies (instagram_business_manage_comments and
 * instagram_business_manage_messages). One DM per comment, never to the creator's own comments, and capped well
 * under Instagram's hourly limit.
 */

export type Automation = typeof schema.dmAutomations.$inferSelect;
/** Instagram allows about 200 private replies an hour per account; stay under it. */
export const DMS_PER_HOUR = 180;

const keyword = z
  .string()
  .trim()
  .min(1)
  .max(30)
  .transform((k) => k.replace(/^#/, ""));
export const AutomationInput = z
  .object({
    mediaId: z.string().trim().max(64).nullable().default(null),
    mediaCaption: z.string().trim().max(200).nullable().default(null),
    mediaUrl: z.string().trim().url().max(500).nullable().default(null),
    mediaThumb: z.string().trim().url().max(2000).nullable().default(null),
    keywords: z.array(keyword).max(5).default([]),
    anyComment: z.boolean().default(false),
    message: z.string().trim().min(1, "Write the DM").max(800),
    linkUrl: z
      .string()
      .trim()
      .max(500)
      .refine((v) => v === "" || /^https:\/\/\S+$/.test(v), "Links must start with https://")
      .transform((v) => v || null)
      .nullable()
      .default(null),
    publicReply: z
      .string()
      .trim()
      .max(200)
      .transform((v) => v || null)
      .nullable()
      .default(null),
    active: z.boolean().default(true),
  })
  .refine((a) => a.anyComment || a.keywords.length > 0, { message: "Add a keyword, or reply to every comment", path: ["keywords"] });

/** Does this comment trigger the automation? Keywords match as whole words, any case; Kannada matches anywhere. */
export function matches(text: string, a: Pick<Automation, "keywords" | "anyComment">): boolean {
  if (a.anyComment) return true;
  const t = text.toLowerCase();
  return a.keywords.some((k) => {
    const key = k.toLowerCase();
    if (/[^\x00-\x7f]/.test(key)) return t.includes(key);
    return new RegExp(`(^|[^a-z0-9])#?${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^a-z0-9])`).test(t);
  });
}

/** The DM text: the message (with {name} as the commenter's @handle) and the link on its own line. */
export function dmText(a: Pick<Automation, "message" | "linkUrl">, username: string | null): string {
  const msg = a.message.replace(/\{name\}/g, username ? `@${username}` : "there");
  return (a.linkUrl ? `${msg}\n\n${a.linkUrl}` : msg).slice(0, 1000);
}

export const hasDmScopes = (scopes: string | null | undefined) => DM_SCOPES.every((s) => (scopes ?? "").split(",").includes(s));

/* ---- Creator side ---- */

export async function listAutomations(userId: string) {
  const d = await db();
  const [rows, stats] = await Promise.all([
    d.select().from(schema.dmAutomations).where(eq(schema.dmAutomations.userId, userId)).orderBy(desc(schema.dmAutomations.createdAt)),
    d
      .select({ id: schema.dmEvents.automationId, status: schema.dmEvents.status, n: sql<number>`count(*)::int`, last: sql<Date>`max(${schema.dmEvents.createdAt})` })
      .from(schema.dmEvents)
      .where(eq(schema.dmEvents.userId, userId))
      .groupBy(schema.dmEvents.automationId, schema.dmEvents.status),
  ]);
  return rows.map((a) => {
    const mine = stats.filter((s) => s.id === a.id);
    const n = (st: string) => mine.find((s) => s.status === st)?.n ?? 0;
    const last = mine.reduce<Date | null>((m, s) => (s.last && (!m || new Date(s.last) > m) ? new Date(s.last) : m), null);
    return { ...a, sent: n("sent"), failed: n("failed"), skipped: n("skipped"), lastAt: last };
  });
}

export async function saveAutomation(userId: string, input: z.infer<typeof AutomationInput>, id?: string): Promise<Automation | null> {
  const d = await db();
  const values = { ...input, updatedAt: new Date() };
  if (id) {
    const [row] = await d.update(schema.dmAutomations).set(values).where(and(eq(schema.dmAutomations.id, id), eq(schema.dmAutomations.userId, userId))).returning();
    return row ?? null;
  }
  const [row] = await d.insert(schema.dmAutomations).values({ id: crypto.randomUUID(), userId, ...values }).returning();
  return row;
}

export async function setAutomationActive(userId: string, id: string, active: boolean): Promise<boolean> {
  const rows = await (await db()).update(schema.dmAutomations).set({ active, updatedAt: new Date() }).where(and(eq(schema.dmAutomations.id, id), eq(schema.dmAutomations.userId, userId))).returning();
  return rows.length > 0;
}

export async function deleteAutomation(userId: string, id: string): Promise<boolean> {
  const rows = await (await db()).delete(schema.dmAutomations).where(and(eq(schema.dmAutomations.id, id), eq(schema.dmAutomations.userId, userId))).returning();
  return rows.length > 0;
}

/** Coupon links from businesses' tracked posts with this creator, to put in a DM. */
export async function couponLinks(userId: string) {
  const rows = await (await db())
    .select({ linkCode: schema.trackedPosts.linkCode, offer: schema.trackedPosts.offerText, business: schema.businessProfiles.name })
    .from(schema.trackedPosts)
    .leftJoin(schema.businessProfiles, eq(schema.businessProfiles.userId, schema.trackedPosts.businessUserId))
    .where(and(eq(schema.trackedPosts.creatorUserId, userId), eq(schema.trackedPosts.status, "active")))
    .orderBy(desc(schema.trackedPosts.createdAt));
  return rows.map((r) => ({ url: `${SITE_URL}/r/${r.linkCode}`, label: `${r.business ?? "Business"}: ${r.offer}` }));
}

export type IgPost = { id: string; caption: string | null; url: string | null; thumb: string | null; kind: string | null; at: string };

/** The creator's recent posts and reels, to pick which one an automation watches. */
export async function recentPosts(userId: string, f: Fetcher = fetch): Promise<IgPost[] | null> {
  const token = await instagramToken(userId, f);
  if (!token) return null;
  const q = new URLSearchParams({ fields: "id,caption,media_type,media_product_type,permalink,thumbnail_url,media_url,timestamp", limit: "24", access_token: token });
  const r = await igJson<{ data?: { id: string; caption?: string; media_type?: string; media_product_type?: string; permalink?: string; thumbnail_url?: string; media_url?: string; timestamp: string }[] }>(
    await f(`${IG_GRAPH}/${IG_VERSION}/me/media?${q}`),
  );
  return (r.data ?? []).map((m) => ({
    id: m.id,
    caption: m.caption ? m.caption.split("\n")[0].slice(0, 120) : null,
    url: m.permalink ?? null,
    thumb: m.thumbnail_url ?? (m.media_type === "VIDEO" ? null : (m.media_url ?? null)),
    kind: m.media_product_type ?? m.media_type ?? null,
    at: m.timestamp,
  }));
}

/** Ask Instagram to send this account's comments to Mitra's webhook. Needed once per connect. */
export async function subscribeComments(userId: string, f: Fetcher = fetch): Promise<boolean> {
  const conn = await instagramConnection(userId);
  if (!conn || !hasDmScopes(conn.scopes)) return false;
  const token = await instagramToken(userId, f);
  if (!token) return false;
  await igJson(await f(`${IG_GRAPH}/${IG_VERSION}/me/subscribed_apps?${new URLSearchParams({ subscribed_fields: "comments", access_token: token })}`, { method: "POST" }));
  await (await db()).update(schema.instagramConnections).set({ subscribedAt: new Date() }).where(eq(schema.instagramConnections.userId, userId));
  return true;
}

/* ---- Webhook ---- */

/** Meta signs every webhook with the app secret: X-Hub-Signature-256: sha256=<hex>. */
export function validSignature(raw: string, header: string | null, secret = process.env.INSTAGRAM_APP_SECRET): boolean {
  if (!secret || !header?.startsWith("sha256=")) return false;
  const want = Buffer.from(createHmac("sha256", secret).update(raw).digest("hex"));
  const got = Buffer.from(header.slice(7));
  return want.length === got.length && timingSafeEqual(want, got);
}

type CommentValue = { id: string; text?: string; from?: { id?: string; username?: string }; media?: { id?: string }; parent_id?: string };
export type WebhookBody = { object?: string; entry?: { id: string; time?: number; changes?: { field: string; value: CommentValue }[] }[] };

export type DmResult = { commentId: string; status: "sent" | "failed" | "skipped"; reason?: string };

/** Handle a webhook delivery: for each new comment, find the creator's matching automation and send the DM. */
export async function handleWebhook(body: WebhookBody, f: Fetcher = fetch, now = new Date()): Promise<DmResult[]> {
  if (body.object !== "instagram") return [];
  const out: DmResult[] = [];
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "comments" || !change.value?.id) continue;
      const r = await handleComment(entry.id, change.value, f, now);
      if (r) out.push(r);
    }
  }
  return out;
}

async function handleComment(accountId: string, c: CommentValue, f: Fetcher, now: Date): Promise<DmResult | null> {
  const d = await db();
  const [conn] = await d.select().from(schema.instagramConnections).where(eq(schema.instagramConnections.igUserId, accountId));
  if (!conn) return null;
  // Never reply to the creator's own comments (including Mitra's public replies) or to replies in a thread.
  if (c.from?.id === accountId || (c.from?.username && c.from.username === conn.username) || c.parent_id) return null;
  const autos = await d.select().from(schema.dmAutomations).where(and(eq(schema.dmAutomations.userId, conn.userId), eq(schema.dmAutomations.active, true)));
  const text = c.text ?? "";
  // A post-specific automation wins over an "every post" one.
  const auto =
    autos.find((a) => a.mediaId && a.mediaId === c.media?.id && matches(text, a)) ?? autos.find((a) => !a.mediaId && matches(text, a));
  if (!auto) return null;

  // One row per comment: a redelivered webhook finds the row and stops here.
  const [claimed] = await d
    .insert(schema.dmEvents)
    .values({ commentId: c.id, automationId: auto.id, userId: conn.userId, commenterUsername: c.from?.username ?? null, text: text.slice(0, 500), status: "skipped", createdAt: now })
    .onConflictDoNothing()
    .returning();
  if (!claimed) return null;
  const finish = async (status: DmResult["status"], reason?: string) => {
    await d.update(schema.dmEvents).set({ status, error: reason ?? null }).where(eq(schema.dmEvents.commentId, c.id));
    return { commentId: c.id, status, reason };
  };

  if (!(await canUse(conn.userId, "autodm", now))) return finish("skipped", "no_pass");
  const [{ n }] = await d
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.dmEvents)
    .where(and(eq(schema.dmEvents.userId, conn.userId), eq(schema.dmEvents.status, "sent"), gte(schema.dmEvents.createdAt, new Date(now.getTime() - 3_600_000))));
  if (n >= DMS_PER_HOUR) return finish("skipped", "hourly_limit");
  const token = await instagramToken(conn.userId, f, now.getTime());
  if (!token) return finish("failed", "reconnect");

  try {
    await igJson(
      await f(`${IG_GRAPH}/${IG_VERSION}/me/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recipient: { comment_id: c.id }, message: { text: dmText(auto, c.from?.username ?? null) } }),
      }),
    );
  } catch (err) {
    return finish("failed", (err as Error).message.slice(0, 300));
  }
  if (auto.publicReply) {
    // The public reply is a nicety: if it fails, the DM still went.
    await f(`${IG_GRAPH}/${IG_VERSION}/${c.id}/replies?${new URLSearchParams({ message: auto.publicReply, access_token: token })}`, { method: "POST" }).catch(() => null);
  }
  return finish("sent");
}

/** The creator's recent Auto-DM activity, newest first. */
export async function recentEvents(userId: string, limit = 20) {
  return (await db()).select().from(schema.dmEvents).where(eq(schema.dmEvents.userId, userId)).orderBy(desc(schema.dmEvents.createdAt)).limit(limit);
}
