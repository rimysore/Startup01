/** Client-safe pieces of the prospecting tool: statuses and the outreach email text. */

export const STATUSES = ["new", "approved", "contacted", "replied", "joined", "not_interested", "do_not_contact"] as const;
export type ProspectStatus = (typeof STATUSES)[number];

/** The fixed part of every outreach email: what Mitra is, the offer, and an easy opt-out. */
export function outreachBody(opener: string, appUrl: string, spotsLeft: number | null, sender: string, replyTo?: string, postal?: string): string {
  // The "design partner" invitation (docs/SALES_SCRIPT.md): an honest ask for feedback, not an ad.
  return [
    opener.trim(),
    "",
    "I'm building Mitra, a growth manager for creators who make videos in Indian languages. It reads your YouTube analytics and tells you, in your language and on WhatsApp, why a video dipped, what to post next, and which titles and thumbnails are working in your niche.",
    "",
    "I'm picking a small group of creators as design partners before we open it up, and I'd love you to be one. What that means:",
    "• You use it free, for life" + (spotsLeft != null && spotsLeft > 0 ? ` (we're keeping it to the first 100 creators; ${spotsLeft} spots left)` : "") + ".",
    "• Every couple of weeks I ask you what's useful and what's annoying, and we build what you ask for. You'll talk to me directly, not a support desk.",
    "• No card, no contract. If it doesn't help your channel, tell me why and walk away.",
    "",
    `If that sounds good, reply "yes" and I'll set you up, or try it yourself here: ${appUrl}`,
    "",
    `${sender}`,
    `Founder, Mitra`,
    ...(replyTo ? [replyTo] : []),
    "",
    "Not for you? Just reply \"stop\" and I won't write again.",
    // US law (CAN-SPAM) asks commercial email to carry a postal address.
    ...(postal ? [postal] : []),
  ].join("\n");
}
