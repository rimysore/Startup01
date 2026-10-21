import { and, desc, eq, gt, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { checkOffer, offerFields } from "@/lib/offer-check";
import { checkSender, domainOf, extractEmails, isFreeMail, reportSender, senderKeys, type SenderCheck } from "./sender-check";
import { createDeal } from "./store";

/*
 * The offer inbox: offers land in Mitra however they arrive (pasted, a screenshot, forwarded by email or on
 * WhatsApp), each checked twice: what the offer says (offer-check.ts) and who sent it (sender-check.ts).
 */

export type InboxOffer = typeof schema.inboxOffers.$inferSelect;
export type Source = "paste" | "screenshot" | "email" | "whatsapp";
export type NewOffer = { source: Source; body: string; subject?: string | null; senderName?: string | null; senderEmail?: string | null; senderPhone?: string | null; senderHandle?: string | null };

/* ---- Pure helpers ---- */

/** A message that's probably a collaboration offer (for WhatsApp, where people also ask questions). */
export function looksLikeOffer(text: string): boolean {
  const t = text.toLowerCase();
  if (/^\s*(offer|ಆಫರ್|check offer|check this offer)\b/i.test(text)) return true;
  const what = /\b(reels?|stories|story|posts?|collab(oration)?|promotion|barter|sponsor(ed|ship)?|paid partnership|brand deal|influencer)\b|ರೀಲ್|ಸ್ಟೋರಿ|ಕೊಲ್ಯಾಬ್/i.test(t);
  const terms = /(₹|rs\.?\s?\d|\binr\b|\bfee\b|\bbudget\b|\bfree\b|\bpay(ment)?\b|\bdeliverables?\b|\bbarter\b)/i.test(t);
  return what && terms && text.length >= 40;
}

/** The brand a message says it's from: "from Mamaearth", "team Bewakoof", "on behalf of Ruchi Café". */
export function guessBrand(text: string, email?: string | null): string | null {
  const m = text.match(/\b(?:from|team|on behalf of|representing|at)\s+([A-Z][\w&'.-]+(?:\s+[A-Z][\w&'.-]+){0,2})/);
  if (m && !/^(Mitra|Instagram|YouTube|WhatsApp|Gmail|Hi|Hello|Dear)$/.test(m[1])) return m[1].trim();
  const dom = email ? domainOf(email) : null;
  if (dom && !isFreeMail(email!)) {
    const label = dom.split(".")[0];
    return label.length >= 3 ? label.charAt(0).toUpperCase() + label.slice(1) : null;
  }
  return null;
}

/**
 * When a creator forwards an email to Mitra, the real sender is inside the body ("---------- Forwarded message
 * ---------" / "From: Name <email>"). Returns that sender and the original subject, or nulls if not forwarded.
 */
export function parseForwarded(body: string): { name: string | null; email: string | null; subject: string | null; text: string } {
  const marker = body.search(/-{2,}\s*(forwarded message|original message)\s*-{2,}|^begin forwarded message:/im);
  if (marker < 0) return { name: null, email: null, subject: null, text: body.trim() };
  const rest = body.slice(marker);
  const from = rest.match(/^\s*from:\s*(?:"?([^"<\n]*?)"?\s*)?<?([\w.+-]+@[\w-]+(?:\.[\w-]+)+)>?/im);
  const subject = rest.match(/^\s*subject:\s*(.+)$/im)?.[1]?.trim() ?? null;
  // The original message starts after the header block (the first blank line after "From:").
  const headerEnd = rest.search(/\n\s*\n/);
  const text = (headerEnd > 0 ? rest.slice(headerEnd) : rest).trim();
  return { name: from?.[1]?.trim() || null, email: from?.[2]?.toLowerCase() ?? null, subject, text: text || body.trim() };
}

/* ---- Storage ---- */

/** Saves an offer to the inbox with both checks. `online: false` skips public lookups (tests). */
export async function addToInbox(userId: string, o: NewOffer, opts: { online?: boolean } = {}): Promise<InboxOffer> {
  const body = o.body.trim().slice(0, 6000);
  const email = (o.senderEmail ?? extractEmails(body)[0] ?? null)?.toLowerCase() ?? null;
  const [checks, sender] = await Promise.all([
    Promise.resolve(checkOffer(body).map(({ term, state, text }) => ({ term, state, text }))),
    checkSender({ text: body, email, phone: o.senderPhone, handle: o.senderHandle, brand: o.senderName || guessBrand(body, email) }, { online: opts.online }),
  ]);
  const [row] = await (await db())
    .insert(schema.inboxOffers)
    .values({
      id: crypto.randomUUID(),
      userId,
      source: o.source,
      senderName: o.senderName?.slice(0, 120) ?? null,
      senderEmail: email,
      senderPhone: o.senderPhone?.slice(0, 20) ?? null,
      senderHandle: o.senderHandle?.replace(/^@/, "").slice(0, 80) ?? null,
      subject: o.subject?.slice(0, 200) ?? null,
      body,
      checks,
      verdict: sender as unknown as Record<string, unknown>,
    })
    .returning();
  return row;
}

export async function listInbox(userId: string, limit = 100): Promise<InboxOffer[]> {
  return (await db())
    .select()
    .from(schema.inboxOffers)
    .where(eq(schema.inboxOffers.userId, userId))
    .orderBy(desc(schema.inboxOffers.receivedAt))
    .limit(limit);
}

export async function getInboxOffer(userId: string, id: string): Promise<InboxOffer | null> {
  const [row] = await (await db())
    .select()
    .from(schema.inboxOffers)
    .where(and(eq(schema.inboxOffers.id, id), eq(schema.inboxOffers.userId, userId)));
  return row ?? null;
}

export const verdictOf = (o: InboxOffer) => (o.verdict as unknown as SenderCheck | null) ?? null;

/** Runs the sender check again (e.g. after the creator adds who sent it, or when new reports exist). */
export async function recheck(userId: string, id: string, patch: { senderName?: string | null; senderEmail?: string | null; senderPhone?: string | null; senderHandle?: string | null } = {}): Promise<InboxOffer | null> {
  const o = await getInboxOffer(userId, id);
  if (!o) return null;
  const next = { senderName: patch.senderName ?? o.senderName, senderEmail: (patch.senderEmail ?? o.senderEmail)?.toLowerCase() ?? null, senderPhone: patch.senderPhone ?? o.senderPhone, senderHandle: patch.senderHandle?.replace(/^@/, "") ?? o.senderHandle };
  const sender = await checkSender({ text: o.body, email: next.senderEmail, phone: next.senderPhone, handle: next.senderHandle, brand: next.senderName || guessBrand(o.body, next.senderEmail) });
  const [row] = await (await db())
    .update(schema.inboxOffers)
    .set({ ...next, verdict: sender as unknown as Record<string, unknown> })
    .where(eq(schema.inboxOffers.id, id))
    .returning();
  return row;
}

export async function setInboxStatus(userId: string, id: string, status: "new" | "dismissed"): Promise<boolean> {
  const rows = await (await db())
    .update(schema.inboxOffers)
    .set({ status })
    .where(and(eq(schema.inboxOffers.id, id), eq(schema.inboxOffers.userId, userId)))
    .returning({ id: schema.inboxOffers.id });
  return rows.length > 0;
}

/** Moves an inbox offer into the deal log, pre-filled from the message. */
export async function saveToDeals(userId: string, id: string): Promise<string | null> {
  const o = await getInboxOffer(userId, id);
  if (!o) return null;
  if (o.dealId) return o.dealId;
  const f = offerFields(o.body);
  const deal = await createDeal(userId, {
    counterparty: o.senderName || o.senderHandle || o.senderEmail || "Unknown sender",
    channel: o.source === "email" ? "email" : o.source === "whatsapp" ? "whatsapp" : o.source === "screenshot" ? "instagram" : "other",
    offerText: o.body,
    feeInr: f.feeInr,
    deliverables: f.deliverables,
    barter: null,
    paymentTerms: null,
    usageTerms: null,
    notes: null,
    postBy: null,
    source: "own",
  });
  await (await db()).update(schema.inboxOffers).set({ status: "saved", dealId: deal.id }).where(eq(schema.inboxOffers.id, id));
  return deal.id;
}

/** "This was a scam" / "this was fine", recorded against every way the sender can be recognised. */
export async function reportInboxSender(userId: string, id: string, kind: "scam" | "ok"): Promise<boolean> {
  const o = await getInboxOffer(userId, id);
  if (!o) return false;
  const keys = senderKeys({ email: o.senderEmail, phone: o.senderPhone, handle: o.senderHandle });
  if (!keys.length) return false;
  await reportSender(userId, keys, kind);
  if (kind === "scam") await setInboxStatus(userId, id, "dismissed");
  return true;
}

/* ---- Forwarding address ---- */

/** The member's secret forwarding token, made on first use. */
export async function inboxToken(userId: string): Promise<string> {
  const d = await db();
  const [m] = await d.select({ t: schema.members.inboxToken }).from(schema.members).where(eq(schema.members.userId, userId));
  if (m?.t) return m.t;
  const abc = "abcdefghjkmnpqrstuvwxyz23456789";
  const token = Array.from(crypto.getRandomValues(new Uint8Array(10)), (b) => abc[b % abc.length]).join("");
  await d.update(schema.members).set({ inboxToken: token }).where(eq(schema.members.userId, userId));
  return token;
}

export async function userForToken(token: string): Promise<string | null> {
  if (!/^[a-z0-9]{6,20}$/.test(token)) return null;
  const [m] = await (await db()).select({ userId: schema.members.userId }).from(schema.members).where(eq(schema.members.inboxToken, token));
  return m?.userId ?? null;
}

/** Forwarded mail per member per day, so a leaked address can't flood an inbox. */
export async function inboxCountToday(userId: string, source: Source): Promise<number> {
  const [row] = await (await db())
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.inboxOffers)
    .where(and(eq(schema.inboxOffers.userId, userId), eq(schema.inboxOffers.source, source), gt(schema.inboxOffers.receivedAt, new Date(Date.now() - 86_400_000))));
  return row?.n ?? 0;
}
