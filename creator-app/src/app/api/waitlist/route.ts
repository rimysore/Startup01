import { and, eq, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { isLanguageCode } from "@/lib/languages";

const Body = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  name: z.string().trim().max(80).optional(),
  channel: z.string().trim().max(200).optional(),
  language: z.string().refine(isLanguageCode).optional(),
  whatsapp: z
    .string()
    .trim()
    .max(20)
    .transform((s) => s.replace(/[^\d+]/g, ""))
    .optional(),
  consent: z.literal(true),
  /** Honeypot: people never fill this in, bots do. */
  website: z.string().max(0).optional(),
  source: z.string().max(40).optional(),
});

/** Joins the early-access list. Joining twice keeps the original place. Returns the place in line. */
export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    const msg = field === "email" ? "Please enter a valid email." : field === "consent" ? "Please tick the box so we can contact you." : "Please check the form.";
    return Response.json({ error: msg }, { status: 400 });
  }
  const { email, name, channel, language, whatsapp, source } = parsed.data;
  const d = await db();
  const inserted = await d
    .insert(schema.waitlist)
    .values({ email, name: name || null, channel: channel || null, language: language ?? null, whatsapp: whatsapp || null, source: source ?? null })
    .onConflictDoNothing()
    .returning({ id: schema.waitlist.id, createdAt: schema.waitlist.createdAt });
  const [me] = inserted.length ? inserted : await d.select({ id: schema.waitlist.id, createdAt: schema.waitlist.createdAt }).from(schema.waitlist).where(eq(schema.waitlist.email, email));
  const [ahead] = await d
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.waitlist)
    .where(and(eq(schema.waitlist.status, "waiting"), lt(schema.waitlist.id, me.id)));
  // Same answer whether or not the email was already listed, so the form can't be used to check who signed up.
  return Response.json({ position: (ahead?.n ?? 0) + 1 });
}
