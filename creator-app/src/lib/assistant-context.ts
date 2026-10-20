import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { User } from "./auth";
import { channelContext } from "./channel-context";
import { languageLabel } from "./languages";
import { formatScore, outlierScores } from "./outliers";
import { creditLimit, planOf } from "./plans";
import { loadSummary } from "./reports/build";
import { latestReport } from "./reports/deliver";
import { weeklyFacts, weeklyFactsText } from "./reports/facts";
import { usageThisMonth } from "./usage";

/** Pages the assistant can be opened from, so it knows what the creator is looking at. */
const PAGES: Record<string, string> = {
  "/dashboard": "Overview (channel stats)",
  "/dashboard/doctor": "Video Doctor (why a video did what it did)",
  "/dashboard/studio": "Title & Thumbnail Studio",
  "/dashboard/trends": "Trend Radar",
  "/dashboard/ideas": "Breakout ideas",
  "/dashboard/audience": "Audience",
  "/dashboard/competitors": "Competitors",
  "/dashboard/comments": "Comments",
  "/dashboard/whatsapp": "WhatsApp & reports",
  "/dashboard/billing": "Plan & billing",
};

const MAX = 6000;

/**
 * Everything Ask Mitra knows about this creator, built on the server from data we already hold (no extra YouTube
 * quota beyond the hourly-cached summary): their account and plan, channel numbers, recent uploads with outlier
 * scores, this week's facts, tracked competitors, WhatsApp status and the latest Monday report.
 */
export async function assistantContext(user: User, page?: string, language: string = user.language): Promise<string> {
  const d = await db();
  const [loaded, usage, competitors, [contact], report] = await Promise.all([
    loadSummary(user.id, { allowStale: true }),
    usageThisMonth(user.id),
    d.select({ title: schema.competitors.title }).from(schema.competitors).where(eq(schema.competitors.userId, user.id)),
    d.select().from(schema.whatsappContacts).where(eq(schema.whatsappContacts.userId, user.id)),
    latestReport(user.id, "weekly"),
  ]);
  const plan = planOf(user.plan);
  const parts = [
    `Creator: ${user.name ?? "unknown name"}. Chosen language: ${languageLabel(language)}. Plan: ${plan.name}, ${usage.credits}/${creditLimit(user.plan)} AI credits used this month${user.founderNumber != null ? `, Founding Creator #${user.founderNumber}` : ""}.`,
    page && PAGES[page] ? `They are looking at: ${PAGES[page]}.` : "",
  ];
  if (loaded.ok) {
    const s = loaded.summary;
    parts.push(channelContext(s));
    const scores = outlierScores(s.videos.map((v) => ({ ...v, publishedAt: v.publishedAtIso ?? v.publishedAt })));
    const scored = s.videos.filter((v) => scores.get(v.id)?.score != null).map((v) => `- "${v.title}": ${formatScore(scores.get(v.id)!.score)} their usual (${scores.get(v.id)!.label})`);
    if (scored.length) parts.push(`Outlier scores (views vs the channel's usual for that kind of video):\n${scored.join("\n")}`);
    parts.push(`This week:\n${weeklyFactsText(weeklyFacts(s))}`);
  } else {
    parts.push(loaded.reason === "reconnect" ? "Their YouTube connection needs reconnecting (Connections page)." : "They haven't connected a YouTube channel yet (Connections page).");
  }
  parts.push(competitors.length ? `Competitors they track: ${competitors.map((c) => c.title).join(", ")}.` : "They don't track any competitors yet.");
  parts.push(contact && !contact.optedOutAt ? "WhatsApp is connected: they get the Monday report and 2-day video checks there." : "WhatsApp isn't connected yet (WhatsApp & reports page).");
  if (report) parts.push(`Their latest Monday report:\n${report.text.slice(0, 1200)}`);
  const all = parts.filter(Boolean).join("\n\n");
  return all.length > MAX ? `${all.slice(0, MAX - 1)}…` : all;
}
