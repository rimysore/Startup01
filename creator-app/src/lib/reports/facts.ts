import type { WeeklyCoach, VideoCoach } from "../ai";
import { compact, full, pctChange, shortDate } from "../format";
import type { ChannelSummary, Video } from "../types";

/**
 * The numbers behind the Monday report and the 48-hour check. Pure functions: no I/O, no AI, so they're cheap,
 * testable and exactly right. The AI only turns these facts into words; the plain versions below are the
 * fallback when AI is off.
 */

const IST_MS = 5.5 * 3_600_000;
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** ISO week in India time, e.g. "2026-W42": the Monday report's idempotency key. */
export function weekKey(now = Date.now()): string {
  const d = new Date(now + IST_MS);
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  const thursday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day + 3));
  // The ISO week belongs to the year of its Thursday; count weeks from that year's 1 January.
  const week = 1 + Math.floor((thursday.getTime() - Date.UTC(thursday.getUTCFullYear(), 0, 1)) / 604_800_000);
  return `${thursday.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function isMondayInIndia(now = Date.now()): boolean {
  return new Date(now + IST_MS).getUTCDay() === 1;
}

const MILESTONES = [100, 500, 1_000, 5_000, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000, 5_000_000, 10_000_000];

export interface WeeklyFacts {
  channel: string;
  /** "6–12 Oct" — the 7 days of analytics the report covers (YouTube Analytics lags 1-2 days). */
  period: string;
  views: number;
  viewsChange: number | null;
  watchHours: number;
  subscribersGained: number;
  subscribersChange: number | null;
  subscribers: number;
  bestDay: { date: string; views: number } | null;
  uploadsThisWeek: number;
  daysSinceUpload: number | null;
  /** Best recent video versus the average of the others. */
  star: { title: string; views: number; times: number } | null;
  /** A recent video people stopped watching early. */
  dropOff: { title: string; avgViewPct: number } | null;
  nextMilestone: { at: number; left: number } | null;
}

export function weeklyFacts(s: ChannelSummary, now = Date.now()): WeeklyFacts {
  const week = s.daily.slice(-7);
  const prev = s.daily.slice(-14, -7);
  const views = sum(week.map((d) => d.views));
  const subs = sum(week.map((d) => d.subscribersGained));
  const best = week.length ? week.reduce((a, b) => (b.views > a.views ? b : a)) : null;
  const ages = s.videos.map((v) => (now - Date.parse(v.publishedAtIso ?? `${v.publishedAt}T12:00:00Z`)) / 86_400_000);
  const recent = s.videos.filter((_, i) => ages[i] <= 60);
  const avg = recent.length > 1 ? sum(recent.map((v) => v.views)) / recent.length : 0;
  const star = [...recent].sort((a, b) => b.views - a.views)[0];
  const dropOff = recent.filter((v) => v.avgViewPct != null && v.avgViewPct < 30 && v.durationSec > 90).sort((a, b) => (a.avgViewPct ?? 0) - (b.avgViewPct ?? 0))[0];
  const next = MILESTONES.find((m) => m > s.channel.subscribers);
  return {
    channel: s.channel.title,
    period: week.length ? `${shortDate(week[0].date)} – ${shortDate(week[week.length - 1].date)}` : "last week",
    views,
    viewsChange: pctChange(views, sum(prev.map((d) => d.views))),
    watchHours: Math.round(sum(week.map((d) => d.watchMinutes)) / 60),
    subscribersGained: subs,
    subscribersChange: pctChange(subs, sum(prev.map((d) => d.subscribersGained))),
    subscribers: s.channel.subscribers,
    bestDay: best && best.views > 0 ? { date: best.date, views: best.views } : null,
    uploadsThisWeek: ages.filter((a) => a <= 7).length,
    daysSinceUpload: ages.length ? Math.floor(Math.min(...ages)) : null,
    star: star && avg > 0 && star.views >= avg * 1.3 ? { title: star.title, views: star.views, times: Math.round((star.views / avg) * 10) / 10 } : null,
    dropOff: dropOff ? { title: dropOff.title, avgViewPct: Math.round(dropOff.avgViewPct ?? 0) } : null,
    nextMilestone: next ? { at: next, left: next - s.channel.subscribers } : null,
  };
}

/** The facts as plain lines for the AI prompt. */
export function weeklyFactsText(f: WeeklyFacts): string {
  const pct = (n: number | null) => (n == null ? "no previous week to compare" : `${n >= 0 ? "+" : ""}${n.toFixed(0)}% vs the week before`);
  return [
    `Channel: ${f.channel}. Period: ${f.period}.`,
    `Views: ${f.views} (${pct(f.viewsChange)}). Watch time: ${f.watchHours} hours.`,
    `New subscribers: ${f.subscribersGained} (${pct(f.subscribersChange)}). Total subscribers: ${f.subscribers}.`,
    f.bestDay ? `Best day: ${f.bestDay.date} with ${f.bestDay.views} views.` : "",
    `Uploads in the last 7 days: ${f.uploadsThisWeek}. Days since the last upload: ${f.daysSinceUpload ?? "unknown"}.`,
    f.star ? `Best recent video: "${f.star.title}" with ${f.star.views} views, ${f.star.times}x the channel's recent average.` : "",
    f.dropOff ? `Video where viewers left early: "${f.dropOff.title}", only ${f.dropOff.avgViewPct}% watched on average.` : "",
    f.nextMilestone ? `Next milestone: ${f.nextMilestone.at} subscribers, ${f.nextMilestone.left} to go.` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Plain-English report for when AI is unavailable. */
export function plainWeekly(f: WeeklyFacts): WeeklyCoach {
  const wins: string[] = [];
  if (f.subscribersGained > 0) wins.push(`${full(f.subscribersGained)} new people subscribed this week.`);
  if (f.viewsChange != null && f.viewsChange > 0) wins.push(`Views are up ${f.viewsChange.toFixed(0)}% on the week before.`);
  if (f.star) wins.push(`"${f.star.title}" is doing ${f.star.times}x your usual views.`);
  if (f.bestDay) wins.push(`Your best day was ${shortDate(f.bestDay.date)} with ${compact(f.bestDay.views)} views.`);
  const fixes: string[] = [];
  if (f.daysSinceUpload != null && f.daysSinceUpload >= 10) fixes.push(`It's been ${f.daysSinceUpload} days since your last upload: post something this week, even a Short.`);
  if (f.dropOff) fixes.push(`Viewers watched only ${f.dropOff.avgViewPct}% of "${f.dropOff.title}": show the payoff in the first 10 seconds next time.`);
  if (f.viewsChange != null && f.viewsChange < -15) fixes.push("Views dipped: try a clearer title and a close-up face on the next thumbnail.");
  if (!fixes.length) fixes.push("Reply to the top comments on your latest video within a day: it brings people back.");
  return {
    headline: f.subscribersGained > 0 ? `Good week, ${f.channel}! Here's how it went.` : `Here's your week, ${f.channel}.`,
    wins: wins.slice(0, 3),
    fixes: fixes.slice(0, 3),
    nextVideo: f.star
      ? { idea: `A follow-up to "${f.star.title}"`, why: "It's your strongest recent video, so its viewers want more of it." }
      : { idea: "Answer the most-asked question in your comments", why: "Your viewers already told you what they want." },
  };
}

/** The numbers line, language-neutral (emoji + digits), shown at the top of every report. */
export function statsLine(f: WeeklyFacts): string {
  const chg = (n: number | null) => (n == null ? "" : ` (${n >= 0 ? "▲" : "▼"}${Math.abs(n).toFixed(0)}%)`);
  return `👀 ${compact(f.views)} views${chg(f.viewsChange)} · ⏱️ ${compact(f.watchHours)} hrs · 🙌 +${full(f.subscribersGained)} subs`;
}

/** The full Monday report as one WhatsApp message (WhatsApp formatting: *bold*). */
export function weeklyText(f: WeeklyFacts, c: WeeklyCoach): string {
  const lines = [`*📊 ${f.channel} · ${f.period}*`, "", c.headline, "", statsLine(f)];
  if (f.nextMilestone) lines.push(`🎯 ${full(f.nextMilestone.left)} more to ${compact(f.nextMilestone.at)} subscribers`);
  if (c.wins.length) lines.push("", "*🏆*", ...c.wins.map((w) => `• ${w}`));
  if (c.fixes.length) lines.push("", "*🔧*", ...c.fixes.map((w) => `• ${w}`));
  lines.push("", `*🎬 ${c.nextVideo.idea}*`, c.nextVideo.why);
  return lines.join("\n");
}

// ---- 48-hour check ----------------------------------------------------------------------------------------

/** Videos that turned 36-60 hours old: with one run a day, every upload is checked exactly once. */
export function videosDueForCheck(videos: Video[], now = Date.now()): Video[] {
  return videos.filter((v) => {
    const age = (now - Date.parse(v.publishedAtIso ?? `${v.publishedAt}T12:00:00Z`)) / 3_600_000;
    return age >= 36 && age < 60;
  });
}

/** Older uploads whose first two days we compare against (Analytics is complete for them). */
export function baselineVideos(videos: Video[], now = Date.now(), max = 5): Video[] {
  return videos.filter((v) => (now - Date.parse(v.publishedAtIso ?? `${v.publishedAt}T12:00:00Z`)) / 86_400_000 >= 4).slice(0, max);
}

export function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export type Pace = "ahead" | "on_track" | "slow" | "new";

export interface VideoFacts {
  videoId: string;
  title: string;
  hours: number;
  views: number;
  likes: number;
  comments: number;
  /** Median views of recent uploads in their first two days. */
  usual: number | null;
  ratio: number | null;
  pace: Pace;
  /** Likes per 100 views, this video and the channel's recent average. */
  likeRate: number;
  usualLikeRate: number | null;
}

export function videoFacts(v: Video, others: Video[], earlyViews: number[], now = Date.now()): VideoFacts {
  const usual = median(earlyViews.filter((n) => n > 0));
  const ratio = usual ? v.views / usual : null;
  const rate = (x: Video) => (x.views ? (x.likes / x.views) * 100 : 0);
  const rates = others.filter((o) => o.views > 50).map(rate);
  return {
    videoId: v.id,
    title: v.title,
    hours: Math.round((now - Date.parse(v.publishedAtIso ?? `${v.publishedAt}T12:00:00Z`)) / 3_600_000),
    views: v.views,
    likes: v.likes,
    comments: v.comments,
    usual,
    ratio,
    pace: ratio == null ? "new" : ratio >= 1.3 ? "ahead" : ratio >= 0.8 ? "on_track" : "slow",
    likeRate: Math.round(rate(v) * 10) / 10,
    usualLikeRate: rates.length ? Math.round((sum(rates) / rates.length) * 10) / 10 : null,
  };
}

export function videoFactsText(f: VideoFacts): string {
  return [
    `Video: "${f.title}", uploaded about ${f.hours} hours ago.`,
    `So far: ${f.views} views, ${f.likes} likes, ${f.comments} comments.`,
    f.usual != null
      ? `The channel's recent uploads usually get about ${Math.round(f.usual)} views in their first two days, so this one is at ${(f.ratio ?? 0).toFixed(1)}x usual (${f.pace.replace("_", " ")}).`
      : "Not enough earlier uploads to compare against yet.",
    `Likes per 100 views: ${f.likeRate}${f.usualLikeRate != null ? ` (channel's usual: ${f.usualLikeRate})` : ""}.`,
  ].join("\n");
}

const PACE_EMOJI: Record<Pace, string> = { ahead: "🚀", on_track: "👍", slow: "🐢", new: "🌱" };

/** Language-neutral status line for the check. */
export function paceLine(f: VideoFacts): string {
  const base = `${PACE_EMOJI[f.pace]} ${compact(f.views)} views in ${f.hours}h`;
  return f.usual != null ? `${base} · ${(f.ratio ?? 0).toFixed(1)}× your usual (${compact(f.usual)})` : base;
}

export function plainVideo(f: VideoFacts): VideoCoach {
  const verdict =
    f.pace === "ahead"
      ? "This one is beating your usual first two days. Keep the momentum going."
      : f.pace === "on_track"
        ? "Right on track with your usual first two days."
        : f.pace === "slow"
          ? "Slower than your usual start, but there's still time to turn it around."
          : "Early days for your channel: here's how to give this video a push.";
  const actions =
    f.pace === "slow"
      ? ["Try a new title or thumbnail with YouTube's Test & compare.", "Pin a comment with a question to start a conversation.", "Cut a 30-second Short from the best moment and link the video."]
      : ["Reply to every comment today: it keeps the video active.", "Cut a Short from the best moment and link the full video.", "Share it in your community tab with a question."];
  return { verdict, actions };
}

export function videoText(f: VideoFacts, c: VideoCoach): string {
  return [`*🎬 "${f.title}"*`, "", paceLine(f), `❤️ ${f.likeRate} likes per 100 views${f.usualLikeRate != null ? ` (usual ${f.usualLikeRate})` : ""} · 💬 ${full(f.comments)}`, "", c.verdict, "", ...c.actions.map((a, i) => `${i + 1}. ${a}`)].join("\n");
}
