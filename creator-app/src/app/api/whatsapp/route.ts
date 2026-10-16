import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { currentUser, unauthorized } from "@/lib/auth";
import { emailConfigured } from "@/lib/email";
import { isLanguageCode } from "@/lib/languages";
import { chatLink, mitraNumber, whatsappConfigured } from "@/lib/whatsapp/api";
import { z } from "zod";

const mask = (phone: string) => `+${phone.slice(0, phone.length - 10)} ${phone.slice(-10, -7)}•••${phone.slice(-3)}`;

/** WhatsApp link status, report preferences and the latest reports, for the settings page. */
export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();
  const d = await db();
  const [contact] = await d.select().from(schema.whatsappContacts).where(eq(schema.whatsappContacts.userId, user.id));
  const recent = await d
    .select({ kind: schema.notifications.kind, key: schema.notifications.key, channel: schema.notifications.channel, status: schema.notifications.status, at: schema.notifications.createdAt })
    .from(schema.notifications)
    .where(eq(schema.notifications.userId, user.id))
    .orderBy(desc(schema.notifications.createdAt))
    .limit(8);
  return Response.json({
    configured: whatsappConfigured(),
    emailConfigured: emailConfigured(),
    number: whatsappConfigured() ? mitraNumber() : null,
    chat: whatsappConfigured() ? chatLink("menu") : null,
    contact: contact ? { phone: mask(contact.phone), optedOut: Boolean(contact.optedOutAt), since: contact.optedInAt } : null,
    prefs: { weekly: user.notifyWeekly, videoCheck: user.notifyVideoCheck, email: user.notifyEmail, language: user.language },
    email: user.email,
    recent,
  });
}

const Prefs = z.object({
  weekly: z.boolean().optional(),
  videoCheck: z.boolean().optional(),
  email: z.boolean().optional(),
  language: z.string().refine(isLanguageCode).optional(),
  /** Resume WhatsApp reports after STOP. */
  resume: z.literal(true).optional(),
});

export async function PATCH(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const p = Prefs.safeParse(await request.json().catch(() => null));
  if (!p.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const d = await db();
  const set = {
    ...(p.data.weekly != null ? { notifyWeekly: p.data.weekly } : {}),
    ...(p.data.videoCheck != null ? { notifyVideoCheck: p.data.videoCheck } : {}),
    ...(p.data.email != null ? { notifyEmail: p.data.email } : {}),
    ...(p.data.language ? { language: p.data.language } : {}),
  };
  if (Object.keys(set).length) await d.update(schema.users).set(set).where(eq(schema.users.id, user.id));
  if (p.data.resume) await d.update(schema.whatsappContacts).set({ optedOutAt: null }).where(eq(schema.whatsappContacts.userId, user.id));
  return Response.json({ ok: true });
}

/** Disconnects WhatsApp: the number is forgotten. */
export async function DELETE() {
  const user = await currentUser();
  if (!user) return unauthorized();
  await (await db()).delete(schema.whatsappContacts).where(eq(schema.whatsappContacts.userId, user.id));
  return Response.json({ ok: true });
}
