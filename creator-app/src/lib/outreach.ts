/** Client-safe pieces of the prospecting tool: statuses and the outreach email text. */

export const STATUSES = ["new", "approved", "contacted", "replied", "joined", "not_interested", "do_not_contact"] as const;
export type ProspectStatus = (typeof STATUSES)[number];

/** The fixed part of every outreach email: what Mitra is, the offer, and an easy opt-out. */
export function outreachBody(opener: string, appUrl: string, spotsLeft: number | null, sender: string, replyTo?: string): string {
  return [
    opener.trim(),
    "",
    "I'm building Mitra, an AI growth manager for creators who make videos in Indian languages: it reads your YouTube analytics and tells you, in your language, why a video dipped, what to post next, better titles and thumbnails, and what your audience is searching for.",
    spotsLeft != null && spotsLeft > 0
      ? `The first 100 creators get it free for life as Founding Creators (${spotsLeft} spots left).`
      : "It's free to start.",
    `Have a look: ${appUrl}`,
    "",
    `— ${sender}, Mitra`,
    ...(replyTo ? [replyTo] : []),
    "",
    "Not interested? Just reply \"stop\" and I won't write again.",
  ].join("\n");
}
