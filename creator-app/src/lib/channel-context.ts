import type { ChannelSummary } from "./types";

/** The channel facts Ask Mitra answers from, on the website and on WhatsApp. Kept short: it's sent with every reply. */
export function channelContext(s: ChannelSummary): string {
  const views = s.daily.reduce((a, d) => a + d.views, 0);
  const subs = s.daily.reduce((a, d) => a + d.subscribersGained, 0);
  const vids = s.videos
    .map((v) => `- "${v.title}" (${v.publishedAt}): ${v.views} views, ${v.likes} likes, ${v.comments} comments, ${v.avgViewPct ?? "?"}% viewed, ${Math.round(v.durationSec / 60)} min`)
    .join("\n");
  return `${s.channel.title} (${s.channel.handle}), ${s.channel.subscribers} subscribers, ${s.channel.videoCount} videos.\nLast 28 days: ${views} views, ${subs} new subscribers.\nRecent uploads:\n${vids}`;
}
