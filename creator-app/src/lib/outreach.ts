/** Client-safe pieces of the prospecting tool: statuses and the outreach email text. */

export const STATUSES = ["new", "approved", "contacted", "replied", "joined", "not_interested", "do_not_contact"] as const;
export type ProspectStatus = (typeof STATUSES)[number];

/**
 * The fixed part of every outreach email: the offer and an easy opt-out. Written to the cold-email rules in
 * .claude/skills/mitra-outreach (repo root): short (about 100 words before the signature), about them before us, one ask that gives them
 * something either way (a free read of their channel), plain text, no link in the first email.
 */
export function outreachBody(opener: string, spotsLeft: number | null, sender: string, replyTo?: string, postal?: string): string {
  return [
    opener.trim(),
    "",
    "I'm building Mitra, a growth coach for creators who make videos in Indian languages. It reads a channel's numbers and says, in your language, what to post next and why a video did what it did.",
    "",
    "Before we open it up, I'm working closely with a few creators as design partners: free for life" +
      (spotsLeft != null && spotsLeft > 0 ? ` (${spotsLeft} of 100 spots left)` : "") +
      ", and you tell me what to build.",
    "",
    "Want me to send you a free one-page read of your last 10 videos: which one beat your usual and why, and what I'd post next? Just reply \"yes\".",
    "",
    sender,
    "Founder, Mitra",
    ...(replyTo ? [replyTo] : []),
    "",
    "Not for you? Reply \"stop\" and I won't write again.",
    // US law (CAN-SPAM) asks commercial email to carry a postal address.
    ...(postal ? [postal] : []),
  ].join("\n");
}
