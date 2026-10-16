import { randomInt } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { currentUser, unauthorized } from "@/lib/auth";
import { chatLink, whatsappConfigured } from "@/lib/whatsapp/api";

const VALID_MS = 30 * 60_000;

/** A one-time code the creator sends to Mitra from their WhatsApp. Sending it proves the number and opts in. */
export async function POST() {
  const user = await currentUser();
  if (!user) return unauthorized();
  if (!whatsappConfigured()) return Response.json({ error: "WhatsApp isn't set up yet" }, { status: 503 });
  const d = await db();
  await d.delete(schema.whatsappLinkCodes).where(eq(schema.whatsappLinkCodes.userId, user.id));
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = String(randomInt(100_000, 1_000_000));
    const expiresAt = new Date(Date.now() + VALID_MS);
    const rows = await d.insert(schema.whatsappLinkCodes).values({ code, userId: user.id, expiresAt }).onConflictDoNothing().returning();
    if (rows.length) return Response.json({ code, expiresAt, link: chatLink(`JOIN ${code}`) });
  }
  return Response.json({ error: "Please try again" }, { status: 503 });
}
