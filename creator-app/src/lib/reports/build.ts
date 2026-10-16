import { coachVideo, coachWeekly, type WeeklyCoach } from "../ai";
import { runFreeAi } from "../ai-route";
import type { User } from "../auth";
import { SITE_URL } from "../company";
import type { ChannelSummary, Video } from "../types";
import { fetchEarlyViews, fetchSummary } from "../youtube";
import { FRESH_MS, loadYouTube } from "../youtube-data";
import {
  baselineVideos,
  paceLine,
  plainVideo,
  plainWeekly,
  statsLine,
  videoFacts,
  videoFactsText,
  videoText,
  weekKey,
  weeklyFacts,
  weeklyFactsText,
  weeklyText,
  type WeeklyFacts,
} from "./facts";

/** A report ready to send on any channel: the full text, the template version, and the email version. */
export interface BuiltReport {
  kind: "weekly" | "video_check";
  key: string;
  /** Full WhatsApp message (also the email body). */
  text: string;
  /** For outside the 24-hour window: approved template name, its variables and quick-reply payloads. */
  template: { name: string; params: string[]; buttons: string[] };
  /** Reply buttons after the full text, inside the window. */
  buttons: { id: string; title: string }[];
  subject: string;
  link: string;
  /** Weekly only: the numbers and words behind the report, kept so the PDF can be drawn later. */
  data?: { facts: WeeklyFacts; coach: WeeklyCoach };
}

export type SummaryResult = { ok: true; summary: ChannelSummary } | { ok: false; reason: "nochannel" | "reconnect" | "error" };

export async function loadSummary(userId: string): Promise<SummaryResult> {
  try {
    const r = await loadYouTube(userId, "summary", FRESH_MS.summary, fetchSummary);
    if (r.kind === "demo") return { ok: false, reason: "nochannel" };
    if (r.kind === "reconnect") return { ok: false, reason: "reconnect" };
    return { ok: true, summary: r.value };
  } catch (err) {
    console.error("Report: couldn't load channel", err instanceof Error ? err.message : err);
    return { ok: false, reason: "error" };
  }
}

const firstName = (user: User, s: ChannelSummary) => user.name?.split(" ")[0] || s.channel.title;

export async function buildWeekly(user: User, s: ChannelSummary, labels: { ideas: string; menu: string }, now = Date.now()): Promise<BuiltReport> {
  const f = weeklyFacts(s, now);
  const coach = (await runFreeAi(user.id, "report", () => coachWeekly(user.language, weeklyFactsText(f)))) ?? plainWeekly(f);
  return {
    kind: "weekly",
    key: weekKey(now),
    text: weeklyText(f, coach),
    data: { facts: f, coach },
    template: {
      name: "mitra_weekly_report",
      params: [firstName(user, s), f.period, statsLine(f), coach.wins[0] ?? coach.headline, coach.fixes[0] ?? coach.nextVideo.idea],
      // Quick replies in the approved template: "Full report" and "Stop reports".
      buttons: ["report", "stop"],
    },
    buttons: [
      { id: "ideas", title: labels.ideas },
      { id: "menu", title: labels.menu },
    ],
    subject: `Your Mitra weekly report · ${f.period}`,
    link: `${SITE_URL}/dashboard`,
  };
}

/** Early (first two days) views of older uploads, cached for a month: they never change. */
async function earlyViews(userId: string, videos: Video[]): Promise<number[]> {
  const out = await Promise.all(
    videos.map(async (v) => {
      try {
        const r = await loadYouTube(userId, `early:${v.id}`, 30 * 86_400_000, (tokens) => fetchEarlyViews(tokens, v.id, v.publishedAt));
        return r.kind === "live" ? r.value : 0;
      } catch {
        return 0;
      }
    }),
  );
  return out.filter((n) => n > 0);
}

export async function buildVideoCheck(user: User, s: ChannelSummary, video: Video, labels: { titles: string; menu: string }, now = Date.now()): Promise<BuiltReport> {
  const others = s.videos.filter((v) => v.id !== video.id);
  const early = await earlyViews(user.id, baselineVideos(others, now));
  const f = videoFacts(video, others, early, now);
  const coach = (await runFreeAi(user.id, "report", () => coachVideo(user.language, videoFactsText(f)))) ?? plainVideo(f);
  return {
    kind: "video_check",
    key: video.id,
    text: videoText(f, coach),
    template: { name: "mitra_video_check", params: [firstName(user, s), video.title, paceLine(f), coach.actions[0] ?? coach.verdict], buttons: [`check:${video.id}`, `titles:${video.id}`] },
    buttons: [
      { id: `titles:${video.id}`, title: labels.titles },
      { id: "menu", title: labels.menu },
    ],
    subject: `How "${video.title.slice(0, 60)}" is doing after 2 days`,
    link: `${SITE_URL}/dashboard/doctor?v=${video.id}`,
  };
}
