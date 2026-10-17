import type { ChannelSnapshot } from "./youtube";

/** Videos this long or shorter count as short-form (YouTube Shorts can now run up to 3 minutes). */
const SHORT_MAX_SEC = 180;

export interface ChannelMetrics {
  avgViews: number;
  medianViews: number;
  uploadsPerWeek: number;
  shortsShare: number; // %
  avgLongMinutes: number | null;
  engagement: number; // (likes + comments) / views, %
  viewsPerSub: number; // recent avg views / subscribers, %
  titleChars: number;
  titlesWithNumbers: number; // %
  titlesWithQuestion: number; // %
  topVideo: { title: string; views: number } | null;
}

const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : 0);

/** Comparable numbers from a channel's latest uploads. Videos less than a day old are left out of view averages. */
export function channelMetrics(c: Pick<ChannelSnapshot, "subscribers" | "recent">, now = Date.now()): ChannelMetrics {
  const recent = c.recent;
  const settled = recent.filter((v) => now - new Date(v.publishedAt).getTime() > 86_400_000);
  const pool = settled.length ? settled : recent;
  const views = pool.map((v) => v.views);
  const avgViews = views.length ? Math.round(views.reduce((a, b) => a + b, 0) / views.length) : 0;
  const times = recent.map((v) => new Date(v.publishedAt).getTime()).sort((a, b) => a - b);
  const spanWeeks = times.length > 1 ? Math.max(1, (times.at(-1)! - times[0]) / (7 * 86_400_000)) : 0;
  const shorts = recent.filter((v) => v.durationSec > 0 && v.durationSec <= SHORT_MAX_SEC);
  const long = recent.filter((v) => v.durationSec > SHORT_MAX_SEC);
  const totalViews = pool.reduce((a, v) => a + v.views, 0);
  const top = [...recent].sort((a, b) => b.views - a.views)[0];
  return {
    avgViews,
    medianViews: Math.round(median(views)),
    uploadsPerWeek: spanWeeks ? Math.round(((times.length - 1) / spanWeeks) * 10) / 10 : 0,
    shortsShare: pct(shorts.length, recent.length),
    avgLongMinutes: long.length ? Math.round(long.reduce((a, v) => a + v.durationSec, 0) / long.length / 6) / 10 : null,
    engagement: pct(pool.reduce((a, v) => a + v.likes + v.comments, 0), totalViews),
    viewsPerSub: pct(avgViews, c.subscribers),
    titleChars: recent.length ? Math.round(recent.reduce((a, v) => a + [...v.title].length, 0) / recent.length) : 0,
    titlesWithNumbers: pct(recent.filter((v) => /\d/.test(v.title)).length, recent.length),
    titlesWithQuestion: pct(recent.filter((v) => /[?？]/.test(v.title)).length, recent.length),
    topVideo: top ? { title: top.title, views: top.views } : null,
  };
}
