import { desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { currentUser, isAdmin } from "@/lib/auth";
import { COMPANY, SITE_URL } from "@/lib/company";
import { emailConfigured, sendMail } from "@/lib/email";

const notFound = () => Response.json({ error: "Not found" }, { status: 404 });

/** Admins only: the waitlist, with who already signed up. */
export async function GET() {
  if (!isAdmin(await currentUser())) return notFound();
  const rows = await (await db())
    .select({
      id: schema.waitlist.id,
      email: schema.waitlist.email,
      name: schema.waitlist.name,
      channel: schema.waitlist.channel,
      language: schema.waitlist.language,
      whatsapp: schema.waitlist.whatsapp,
      status: schema.waitlist.status,
      createdAt: schema.waitlist.createdAt,
      invitedAt: schema.waitlist.invitedAt,
      joined: sql<boolean>`exists (select 1 from users u where lower(u.email) = ${schema.waitlist.email})`,
    })
    .from(schema.waitlist)
    .orderBy(desc(schema.waitlist.createdAt))
    .limit(1000);
  return Response.json({ rows, emailReady: emailConfigured() });
}

const Patch = z.object({ ids: z.array(z.number().int()).min(1).max(200), status: z.enum(["waiting", "invited"]), notify: z.boolean().default(true) });

/** Invite (or un-invite) people. Inviting emails them when email is set up. */
export async function PATCH(request: Request) {
  if (!isAdmin(await currentUser())) return notFound();
  const p = Patch.safeParse(await request.json().catch(() => null));
  if (!p.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const d = await db();
  const rows = await d
    .update(schema.waitlist)
    .set({ status: p.data.status, invitedAt: p.data.status === "invited" ? new Date() : null })
    .where(inArray(schema.waitlist.id, p.data.ids))
    .returning();
  let emailed = 0;
  if (p.data.status === "invited" && p.data.notify && emailConfigured()) {
    for (const r of rows) {
      try {
        await sendMail({
          to: r.email,
          subject: "You're in! Your Mitra early access is ready",
          text:
            `Hi${r.name ? ` ${r.name.split(" ")[0]}` : ""},\n\nYour spot in the Mitra beta is open. 🎉\n\n` +
            `*Sign in with Google using ${r.email}* (the same email you joined with) and connect your YouTube channel. ` +
            `If you're one of the first 100, you'll get a Founder Pass, free for life.\n\n` +
            `Then connect WhatsApp to get your weekly report every Monday.\n\nReply to this email with any question.\n\n— ${COMPANY.product}`,
          link: { label: "Sign in to Mitra", url: `${SITE_URL}/login?next=/dashboard/connections` },
        });
        emailed++;
      } catch (err) {
        console.error("Invite email failed", err instanceof Error ? err.message : err);
      }
    }
  }
  return Response.json({ updated: rows.length, emailed });
}

export async function DELETE(request: Request) {
  if (!isAdmin(await currentUser())) return notFound();
  const id = Number(new URL(request.url).searchParams.get("id"));
  await (await db()).delete(schema.waitlist).where(eq(schema.waitlist.id, id));
  return Response.json({ ok: true });
}
