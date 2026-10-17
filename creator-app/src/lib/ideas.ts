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

async function searchesThisWeek(userId: string, now: number): Promise<number> {
  const [{ n }] = await (await db()).select({ n: count() }).from(schema.webhookEvents).where(like(schema.webhookEvents.id, `niche:${userId}:${weekKey(now)}:%`));
  return n;
}

/**
 * Most-watched videos of the last 30 days for a search in the creator's language, scored by views per
 * subscriber. Cached a week per creator, query and language; a new search counts toward SEARCHES_PER_WEEK.
 */
export async function nicheBreakouts(userId: string, ownChannelId: string | null, query: string, language: string, now = Date.now()) {
  const r = await cached(userId, `niche:${language}:${query}`, SEARCH_MS, async () => {
    const id = `niche:${userId}:${weekKey(now)}:${language}:${query}`;
    const d = await db();
    const [already] = await d.select().from(schema.webhookEvents).where(eq(schema.webhookEvents.id, id));
    if (!already && (await searchesThisWeek(userId, now)) >= SEARCHES_PER_WEEK) throw new SearchLimitError();
    const tokens = await youtubeTokens(userId);
    if (!tokens) throw new Error("YouTube access is no longer valid");
    const found = await searchNiche(tokens, query, language, 30, now);
    // Counted only once YouTube answered: a failed search doesn't use up the week's allowance.
    await d.insert(schema.webhookEvents).values({ id }).onConflictDoNothing();
    return found;
  });
  return {
    fetchedAt: r.fetchedAt,
    breakouts: searchBreakouts(r.value.videos, new Map(Object.entries(r.value.subscribers)), { exclude: ownChannelId }),
    left: Math.max(0, SEARCHES_PER_WEEK - (await searchesThisWeek(userId, now))),
  };
}

export async function searchesLeft(userId: string, now = Date.now()): Promise<number> {
  return Math.max(0, SEARCHES_PER_WEEK - (await searchesThisWeek(userId, now)));
}

