/**
 * Outlier score, the ViewStats idea: how a video did against the same channel's usual. A 3× outlier got three
 * times the median views of the channel's previous uploads of the same kind (Shorts are compared with Shorts,
 * long videos with long videos). Comparing a channel with itself makes a 2K-subscriber channel's hit as visible
 * as a 2M one's. Pure functions, no I/O.
 */

/** Videos this long or shorter count as Shorts (YouTube Shorts can run up to 3 minutes). */
export const SHORT_MAX_SEC = 180;
/** How many earlier uploads make up "usual". */
export const COMPARE_WITH = 9;
/** Fewer earlier uploads than this and the score isn't shown: one or two videos aren't a "usual". */
const MIN_COMPARE = 3;
/** Younger than this and a video is still collecting views, so its score will grow. */
export const EARLY_DAYS = 7;

export type OutlierLabel = "breakout" | "above" | "usual" | "below";

export interface Outlier {
  /** Views ÷ median views of up to COMPARE_WITH earlier uploads. Null when there's too little history. */
  score: number | null;
  label: OutlierLabel | null;
  /** Median views of the uploads it was compared with. */
  usual: number | null;
  /** Under EARLY_DAYS old: the score will still move. */
  early: boolean;
}

export interface ScoredInput {
  id: string;
  views: number;
  durationSec: number;
  /** ISO date or date-time. */
  publishedAt: string;
}

export const isShort = (v: { durationSec: number }) => v.durationSec > 0 && v.durationSec <= SHORT_MAX_SEC;

export function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function outlierLabel(score: number): OutlierLabel {
  if (score >= 3) return "breakout";
  if (score >= 1.5) return "above";
  if (score >= 0.67) return "usual";
  return "below";
}

const time = (iso: string) => Date.parse(iso.length === 10 ? `${iso}T12:00:00Z` : iso);

/**
 * Scores every video against the uploads of the same kind that came before it. Shorts and long videos are never
 * mixed: a Short routinely gets 10× a long video's views, so mixing them would make every Short look like a hit.
 */
export function outlierScores<V extends ScoredInput>(videos: V[], at?: number): Map<string, Outlier> {
  const out = new Map<string, Outlier>();
  // Nothing to score while a page is still loading (and no clock read during Next's prerender).
  if (!videos.length) return out;
  const now = at ?? Date.now();
  const sorted = [...videos].sort((a, b) => time(b.publishedAt) - time(a.publishedAt));
  sorted.forEach((v, i) => {
    const older = sorted.slice(i + 1);
    const pool = older.filter((o) => isShort(o) === isShort(v)).slice(0, COMPARE_WITH).map((o) => o.views);
    const usual = pool.length >= MIN_COMPARE ? median(pool) : null;
    const score = usual ? Math.round((v.views / usual) * 10) / 10 : null;
    out.set(v.id, { score, label: score == null ? null : outlierLabel(score), usual, early: now - time(v.publishedAt) < EARLY_DAYS * 86_400_000 });
  });
  return out;
}

/** "3.2×" for a score; "–" when there isn't one. */
export function formatScore(score: number | null): string {
  if (score == null) return "–";
  return `${score >= 10 ? Math.round(score) : score.toFixed(1)}×`;
}

export const OUTLIER_TEXT: Record<OutlierLabel, string> = {
  breakout: "Breakout",
  above: "Above usual",
  usual: "Usual",
  below: "Below usual",
};

// ---- Breakouts from other channels --------------------------------------------------------------------

export interface BreakoutVideo {
  id: string;
  title: string;
  channelId: string;
  channelTitle: string;
  views: number;
  publishedAt: string;
  durationSec: number;
  /** Outlier score against its own channel (tracked competitors) or views per subscriber (niche search). */
  score: number;
  /** How the score was worked out. */
  basis: "channel" | "subscribers";
  thumbnail?: string | null;
}

/** Tracked channels' videos that did at least `min`× their own channel's usual, best first. */
export function competitorBreakouts(
  channels: { id: string; title: string; recent: { id: string; title: string; publishedAt: string; durationSec: number; views: number }[] }[],
  now = Date.now(),
  min = 2,
): BreakoutVideo[] {
  const out: BreakoutVideo[] = [];
  for (const c of channels) {
    const scores = outlierScores(c.recent, now);
    for (const v of c.recent) {
      const s = scores.get(v.id);
      // Brand-new uploads jump around; wait two days before calling one a breakout.
      if (!s?.score || s.score < min || now - time(v.publishedAt) < 2 * 86_400_000) continue;
      out.push({ id: v.id, title: v.title, channelId: c.id, channelTitle: c.title, views: v.views, publishedAt: v.publishedAt, durationSec: v.durationSec, score: s.score, basis: "channel" });
    }
  }
  return out.sort((a, b) => b.score - a.score);
}

/**
 * Niche search results scored by views per subscriber: a video watched far beyond its channel's audience was
 * pushed by YouTube to new people, the signal we want. Channels under 1,000 subscribers are skipped (one viral
 * video makes the ratio meaningless), as are hidden subscriber counts.
 */
export function searchBreakouts(
  videos: { id: string; title: string; channelId: string; channelTitle: string; views: number; publishedAt: string; durationSec: number; thumbnail?: string | null }[],
  subscribers: Map<string, number>,
  { exclude = null as string | null, min = 1.5 } = {},
): BreakoutVideo[] {
  const out: BreakoutVideo[] = [];
  for (const v of videos) {
    const subs = subscribers.get(v.channelId) ?? 0;
    if (v.channelId === exclude || subs < 1000) continue;
    const score = Math.round((v.views / subs) * 10) / 10;
    if (score >= min) out.push({ ...v, score, basis: "subscribers" });
  }
  return out.sort((a, b) => b.score - a.score);
}

/** Best breakouts across sources, at most `perChannel` from one channel so one hit channel doesn't fill the list. */
export function pickBreakouts(lists: BreakoutVideo[][], max = 12, perChannel = 2): BreakoutVideo[] {
  const seen = new Set<string>();
  const per = new Map<string, number>();
  const out: BreakoutVideo[] = [];
  for (const v of lists.flat().sort((a, b) => b.score - a.score)) {
    if (seen.has(v.id) || (per.get(v.channelId) ?? 0) >= perChannel) continue;
    seen.add(v.id);
    per.set(v.channelId, (per.get(v.channelId) ?? 0) + 1);
    out.push(v);
    if (out.length >= max) break;
  }
  return out;
}
