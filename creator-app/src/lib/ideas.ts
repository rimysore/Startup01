import { count, eq, like } from "drizzle-orm";
import { db, schema } from "@/db";
import { cached } from "./memo";
import { competitorBreakouts, searchBreakouts, type BreakoutVideo } from "./outliers";
import { weekKey } from "./reports/facts";
import { fetchChannelSnapshot, searchNiche, youtubeTokens, type ChannelSnapshot } from "./youtube";

/** New niche searches a creator can run per week. Repeats of a recent search are free (cached). */
export const SEARCHES_PER_WEEK = 3;
const SEARCH_MS = 7 * 86_400_000;
const SNAPSHOT_MS = 6 * 3_600_000;

export class SearchLimitError extends Error {}

/** The YouTube search budget can be switched off without a deploy: YOUTUBE_SEARCH=0. */
export const searchEnabled = () => process.env.YOUTUBE_SEARCH !== "0";

export function normalizeQuery(q: unknown): string | null {
  if (typeof q !== "string") return null;
  const s = q.replace(/\s+/g, " ").trim().toLowerCase().slice(0, 60);
  return s.length >= 2 ? s : null;
}

/** Same cache entry as the Competitors page, so opening both costs YouTube quota once. */
export function loadSnapshot(userId: string, channelId: string): Promise<ChannelSnapshot> {
  return cached(userId, `snapshot:${channelId}`, SNAPSHOT_MS, async () => {
    const tokens = await youtubeTokens(userId);
    if (!tokens) throw new Error("YouTube access is no longer valid");
    return fetchChannelSnapshot(tokens, channelId);
  }).then((r) => r.value);
}

/** Breakouts among the creator's tracked competitors (no extra quota beyond the cached snapshots). */
export async function trackedBreakouts(userId: string): Promise<{ breakouts: BreakoutVideo[]; tracked: number }> {
  const rows = await (await db()).select().from(schema.competitors).where(eq(schema.competitors.userId, userId));
  const snaps = (await Promise.all(rows.map((r) => loadSnapshot(userId, r.channelId).catch(() => null)))).filter((s): s is ChannelSnapshot => s != null);
  return { breakouts: competitorBreakouts(snaps), tracked: rows.length };
}

/** How YouTube search is rationed: niche search on Breakout ideas, and topic research in Title Studio. */
export const SEARCH_KINDS = {
  niche: { limit: SEARCHES_PER_WEEK, period: (now: number) => weekKey(now), days: 30 },
  // Research before writing titles: proven hits on the same topic from the last year.
  studio: { limit: 6, period: (now: number) => new Date(now + 5.5 * 3_600_000).toISOString().slice(0, 10), days: 365 },
} as const;
export type SearchKind = keyof typeof SEARCH_KINDS;

async function searchesUsed(userId: string, kind: SearchKind, now: number): Promise<number> {
  const [{ n }] = await (await db()).select({ n: count() }).from(schema.webhookEvents).where(like(schema.webhookEvents.id, `${kind}:${userId}:${SEARCH_KINDS[kind].period(now)}:%`));
  return n;
}

/**
 * Most-watched recent videos for a search in the creator's language, scored by views per subscriber. Cached a week
 * per creator, kind, query and language; a new search counts toward that kind's allowance (per week or per day).
 */
export async function rationedSearch(userId: string, ownChannelId: string | null, kind: SearchKind, query: string, language: string, now = Date.now()) {
  const k = SEARCH_KINDS[kind];
  const r = await cached(userId, `${kind}:${language}:${query}`, SEARCH_MS, async () => {
    const id = `${kind}:${userId}:${k.period(now)}:${language}:${query}`;
    const d = await db();
    // Claim the slot before calling YouTube, so many requests at once can't all slip under the limit; give it
    // back if the limit is passed or the search fails (a failed search doesn't use up the allowance).
    const claimed = (await d.insert(schema.webhookEvents).values({ id }).onConflictDoNothing().returning()).length > 0;
    const release = () => (claimed ? d.delete(schema.webhookEvents).where(eq(schema.webhookEvents.id, id)) : null);
    if (claimed && (await searchesUsed(userId, kind, now)) > k.limit) {
      await release();
      throw new SearchLimitError();
    }
    try {
      const tokens = await youtubeTokens(userId);
      if (!tokens) throw new Error("YouTube access is no longer valid");
      return await searchNiche(tokens, query, language, k.days, now);
    } catch (err) {
      await release();
      throw err;
    }
  });
  const subscribers = new Map(Object.entries(r.value.subscribers));
  return {
    fetchedAt: r.fetchedAt,
    videos: r.value.videos.filter((v) => v.channelId !== ownChannelId),
    subscribers,
    breakouts: searchBreakouts(r.value.videos, subscribers, { exclude: ownChannelId }),
    left: Math.max(0, k.limit - (await searchesUsed(userId, kind, now))),
  };
}

/** Breakout ideas' niche search (3 new searches a week). */
export function nicheBreakouts(userId: string, ownChannelId: string | null, query: string, language: string, now = Date.now()) {
  return rationedSearch(userId, ownChannelId, "niche", query, language, now);
}

export async function searchesLeft(userId: string, kind: SearchKind = "niche", now = Date.now()): Promise<number> {
  return Math.max(0, SEARCH_KINDS[kind].limit - (await searchesUsed(userId, kind, now)));
}


/** Search words from a creator's free-text video description: the first few meaningful words, max 60 characters. */
export function researchQuery(topic: string): string | null {
  const words = topic
    .replace(/[^\p{L}\p{M}\p{N}₹ ]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8);
  return normalizeQuery(words.join(" "));
}

export interface ProvenVideo {
  id: string;
  title: string;
  channelTitle: string;
  views: number;
  /** Views ÷ the channel's subscribers; null when hidden or the channel is tiny. */
  score: number | null;
  publishedAt: string;
  durationSec: number;
  thumbnail: string | null;
}

/** The videos worth learning from: breakouts first (beat their channel's size), then plain big hits. */
export function provenVideos(
  videos: { id: string; title: string; channelId: string; channelTitle: string; views: number; publishedAt: string; durationSec: number; thumbnail?: string | null }[],
  subscribers: Map<string, number>,
  max = 8,
): ProvenVideo[] {
  const scored = videos.map((v) => {
    const subs = subscribers.get(v.channelId) ?? 0;
    return { ...v, thumbnail: v.thumbnail ?? null, score: subs >= 1000 ? Math.round((v.views / subs) * 10) / 10 : null };
  });
  const rank = (v: (typeof scored)[number]) => ((v.score ?? 0) >= 1.5 ? 1e12 + (v.score ?? 0) * 1e6 : 0) + v.views / 1e3;
  const perChannel = new Map<string, number>();
  return scored
    .sort((a, b) => rank(b) - rank(a))
    .filter((v) => {
      const n = perChannel.get(v.channelId) ?? 0;
      perChannel.set(v.channelId, n + 1);
      return n < 2;
    })
    .slice(0, max)
    .map(({ id, title, channelTitle, views, score, publishedAt, durationSec, thumbnail }) => ({ id, title, channelTitle, views, score, publishedAt, durationSec, thumbnail }));
}
