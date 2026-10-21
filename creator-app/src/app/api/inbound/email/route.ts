import { timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { MARKETPLACE } from "@/lib/marketplace/flag";
import { addToInbox, inboxCountToday, parseForwarded, userForToken } from "@/lib/marketplace/inbox";

/**
 * Inbound email for the offer inbox. An email provider's inbound webhook (Postmark's JSON, or any service posting
 * { from, to, subject, text }) calls this with the shared secret in `x-inbound-secret`. Mail to
 * offers+<token>@<INBOUND_EMAIL_DOMAIN> lands in that member's inbox; forwarded mail is credited to the original
 * sender. See docs/MARKETPLACE.md.
 */
export async function POST(request: Request) {
  if (!MARKETPLACE) return new Response("Not found", { status: 404 });
  const secret = process.env.INBOUND_EMAIL_SECRET ?? "";
  const given = request.headers.get("x-inbound-secret") ?? new URL(request.url).searchParams.get("secret") ?? "";
  if (!secret || given.length !== secret.length || !timingSafeEqual(Buffer.from(given), Buffer.from(secret))) return new Response("Forbidden", { status: 403 });

  const j = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!j) return new Response("Bad request", { status: 400 });
  // Postmark: To/ToFull, From/FromFull, Subject, TextBody. Generic: to, from, subject, text.
  const recipients = [
    ...(Array.isArray(j.ToFull) ? (j.ToFull as { Email?: string }[]).map((t) => t.Email ?? "") : []),
    String(j.To ?? j.to ?? ""),
    String(j.OriginalRecipient ?? ""),
  ].join(",");
  const token = recipients.match(/offers\+([a-z0-9]{6,20})@/i)?.[1]?.toLowerCase();
  const userId = token ? await userForToken(token) : null;
  // Unknown addresses get a 200 so the provider doesn't retry them forever.
  if (!userId) return Response.json({ ok: true, ignored: "unknown recipient" });
  if ((await inboxCountToday(userId, "email")) >= 50) return Response.json({ ok: true, ignored: "daily limit" });

  const text = String(j.TextBody ?? j.text ?? "").slice(0, 20_000);
  const subject = String(j.Subject ?? j.subject ?? "") || null;
  const fromFull = j.FromFull as { Email?: string; Name?: string } | undefined;
  const fwd = parseForwarded(text);
  const body = fwd.text.trim();
  if (body.length < 10) return Response.json({ ok: true, ignored: "empty" });
  const from = (fwd.email ?? fromFull?.Email ?? String(j.From ?? j.from ?? "").match(/[\w.+-]+@[\w-]+(\.[\w-]+)+/)?.[0] ?? "").toLowerCase();
  // Forwarded without the usual header, "From" is the creator themselves: not a sender to check.
  const [me] = await (await db()).select({ email: schema.users.email }).from(schema.users).where(eq(schema.users.id, userId));
  const isMe = Boolean(from && me?.email.toLowerCase() === from);
  await addToInbox(userId, {
    source: "email",
    body,
    subject: fwd.subject ?? subject,
    senderEmail: from && !isMe ? from : null,
    senderName: isMe ? null : (fwd.name ?? fromFull?.Name ?? null),
  });
  return Response.json({ ok: true });
}
