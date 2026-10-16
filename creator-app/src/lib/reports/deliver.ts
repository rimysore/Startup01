import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { User } from "../auth";
import { emailConfigured, sendMail } from "../email";
import { send, sendAll, splitText, templateLanguage, whatsappConfigured, type Out } from "../whatsapp/api";
import type { BuiltReport } from "./build";

export type Contact = typeof schema.whatsappContacts.$inferSelect;

/** The creator's WhatsApp, if linked and not opted out. */
export async function activeContact(userId: string): Promise<Contact | null> {
  const [c] = await (await db()).select().from(schema.whatsappContacts).where(eq(schema.whatsappContacts.userId, userId));
  return c && !c.optedOutAt ? c : null;
}

/** Free-form messages are allowed for 24 hours after the creator's last message; keep a margin. */
export function windowOpen(c: Pick<Contact, "lastInboundAt">, now = Date.now()): boolean {
  return Boolean(c.lastInboundAt && now - c.lastInboundAt.getTime() < 23 * 3_600_000);
}

/** The full report as WhatsApp messages: the text (split if long), then reply buttons. */
export function reportMessages(r: BuiltReport, footer?: string): Out[] {
  const parts = splitText(r.text, 1000);
  const last = parts.pop() ?? r.text;
  return [...parts.map((text): Out => ({ type: "text", text })), { type: "buttons", text: last, buttons: r.buttons, footer }];
}

export type Delivery = { channel: "whatsapp" | "email" | "none"; error?: string };

/**
 * Sends a report by the cheapest route that reaches the creator:
 *   WhatsApp, window open  → the full report as normal messages (free up to 1,000 a month, then ~₹0.115)
 *   WhatsApp, window closed → the approved template (~₹0.115 + GST); "Full report" opens the window for free
 *   no WhatsApp             → email, if they kept email reports on
 * If WhatsApp fails, falls back to email.
 */
export async function deliver(user: User, r: BuiltReport, now = Date.now(), footer?: string): Promise<Delivery> {
  const contact = whatsappConfigured() ? await activeContact(user.id) : null;
  let waError: string | undefined;
  if (contact) {
    try {
      if (windowOpen(contact, now)) await sendAll(contact.phone, reportMessages(r, footer));
      else await send(contact.phone, { type: "template", name: r.template.name, language: templateLanguage(user.language), params: r.template.params, buttons: r.template.buttons });
      return { channel: "whatsapp" };
    } catch (err) {
      waError = err instanceof Error ? err.message : String(err);
      console.error(`WhatsApp ${r.kind} to ${user.id} failed: ${waError}`);
    }
  }
  if (user.notifyEmail && emailConfigured()) {
    try {
      await sendMail({ to: user.email, subject: r.subject, text: r.text, link: { label: "Open Mitra", url: r.link } });
      return { channel: "email", ...(waError ? { error: waError } : {}) };
    } catch (err) {
      return { channel: "none", error: [waError, err instanceof Error ? err.message : String(err)].filter(Boolean).join("; ") };
    }
  }
  return { channel: "none", ...(waError ? { error: waError } : {}) };
}

/** Whether the creator can be reached at all (so the daily run skips everyone else without touching YouTube). */
export function reachable(user: Pick<User, "notifyEmail">, contact: Contact | null): boolean {
  return Boolean((contact && whatsappConfigured()) || (user.notifyEmail && emailConfigured()));
}

const MAX_ATTEMPTS = 3;
const STALE_MS = 15 * 60_000;

/**
 * Reserves the right to send one report. Returns the notification id, or null when it was already sent, is being
 * sent by another run, or failed too often. The unique (user, kind, key) row is what makes the daily run safe to
 * retry or run twice.
 */
export async function claim(userId: string, kind: BuiltReport["kind"], key: string, now = Date.now()): Promise<number | null> {
  const d = await db();
  const [fresh] = await d.insert(schema.notifications).values({ userId, kind, key, attempts: 1, createdAt: new Date(now) }).onConflictDoNothing().returning({ id: schema.notifications.id });
  if (fresh) return fresh.id;
  // Take over a failed attempt, or one a crashed run left pending.
  const [retry] = await d
    .update(schema.notifications)
    .set({ status: "pending", attempts: sql`${schema.notifications.attempts} + 1`, createdAt: new Date(now) })
    .where(
      and(
        eq(schema.notifications.userId, userId),
        eq(schema.notifications.kind, kind),
        eq(schema.notifications.key, key),
        sql`${schema.notifications.attempts} < ${MAX_ATTEMPTS}`,
        sql`(${schema.notifications.status} = 'failed' or (${schema.notifications.status} = 'pending' and ${schema.notifications.createdAt} < ${new Date(now - STALE_MS)}))`,
      ),
    )
    .returning({ id: schema.notifications.id });
  return retry?.id ?? null;
}

export async function finish(id: number, r: BuiltReport | null, d: Delivery & { status?: "sent" | "failed" | "skipped" }): Promise<void> {
  const status = d.status ?? (d.channel === "none" ? (d.error ? "failed" : "skipped") : "sent");
  await (await db())
    .update(schema.notifications)
    .set({
      status,
      channel: d.channel,
      error: d.error?.slice(0, 500) ?? null,
      sentAt: status === "sent" ? new Date() : null,
      ...(r ? { payload: { text: r.text, subject: r.subject } } : {}),
    })
    .where(eq(schema.notifications.id, id));
}

/** The most recent report of a kind (for "Full report" / "More tips" taps), if sent in the last `days`. */
export async function latestReport(userId: string, kind: BuiltReport["kind"], key?: string, days = 8): Promise<string | null> {
  const rows = await (await db())
    .select({ payload: schema.notifications.payload })
    .from(schema.notifications)
    .where(
      and(
        eq(schema.notifications.userId, userId),
        eq(schema.notifications.kind, kind),
        key ? eq(schema.notifications.key, key) : undefined,
        sql`${schema.notifications.createdAt} > now() - make_interval(days => ${days})`,
        sql`${schema.notifications.payload} is not null`,
      ),
    )
    .orderBy(sql`${schema.notifications.createdAt} desc`)
    .limit(1);
  const text = rows[0]?.payload?.text;
  return typeof text === "string" ? text : null;
}
