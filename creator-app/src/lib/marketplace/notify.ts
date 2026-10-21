import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { SITE_URL } from "@/lib/company";
import { emailConfigured, sendMail } from "@/lib/email";

/** Transactional emails for the marketplace (an invite arrived; an invite was accepted). Best effort, never blocking. */
async function emailOf(userId: string) {
  const [u] = await (await db()).select({ email: schema.users.email, name: schema.users.name }).from(schema.users).where(eq(schema.users.id, userId));
  return u ?? null;
}

export async function notifyInvited(creatorUserId: string, inviteId: string, businessName: string, goal: string): Promise<void> {
  if (!emailConfigured()) return;
  const to = await emailOf(creatorUserId);
  if (!to) return;
  await sendMail({
    to: to.email,
    subject: `${businessName} sent you an offer on Mitra`,
    text: `Namaskara${to.name ? ` ${to.name.split(" ")[0]}` : ""},\n\n${businessName} would like to work with you: ${goal}.\n\nSee the fee, what they want and Mitra's check of the offer, then accept or decline:\n${SITE_URL}/m/invites/${inviteId}\n\nYour contact details are shared only if you accept.\n\nMitra`,
  }).catch((err) => console.error("Invite email failed", err));
}

export async function notifyAccepted(businessUserId: string, dealId: string, creatorName: string): Promise<void> {
  if (!emailConfigured()) return;
  const to = await emailOf(businessUserId);
  if (!to) return;
  await sendMail({
    to: to.email,
    subject: `${creatorName} accepted your offer on Mitra`,
    text: `${creatorName} accepted. Their contact details, the promo code and the tracked link are in the deal room:\n${SITE_URL}/m/room/${dealId}\n\nMitra`,
  }).catch((err) => console.error("Accepted email failed", err));
}
