import { gte, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { detectLanguage, type LanguageCode } from "./languages";
import { youtubeTokens } from "./youtube";

/**
 * Creator prospecting for outreach (admin only). Uses only public YouTube data via the official API:
 * search.list (100 quota units per page of 50 videos) to find channels that uploaded recently, then
 * channels.list (1 unit per 50 channels) for their public stats and description. Emails are only ones the
 * creator published in their channel description. No scraping.
 */

const DATA = "https://www.googleapis.com/youtube/v3";
export const SEARCH_UNITS = 100;
export const DAILY_UNITS = Number(process.env.PROSPECT_DAILY_UNITS) || 3000;

export { STATUSES, type ProspectStatus } from "./outreach";

export type YouTubeAuth = { key: string } | { token: string };

/** API key (YOUTUBE_API_KEY) if set, otherwise the admin's own connected YouTube account. */
export async function prospectingAuth(adminUserId: string): Promise<YouTubeAuth | null> {
  if (process.env.YOUTUBE_API_KEY) return { key: process.env.YOUTUBE_API_KEY };
  const tokens = await youtubeTokens(adminUserId).catch(() => null);
  return tokens ? { token: tokens.accessToken } : null;
}

async function yt<T>(auth: YouTubeAuth, path: string, params: Record<string, string>): Promise<T> {
  const q = new URLSearchParams({ ...params, ...("key" in auth ? { key: auth.key } : {}) });
  const res = await fetch(`${DATA}/${path}?${q}`, "token" in auth ? { headers: { Authorization: `Bearer ${auth.token}` } } : undefined);
  if (!res.ok) throw new Error(`YouTube API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as T;
}

export async function unitsUsedToday(): Promise<number> {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const [row] = await (await db())
    .select({ n: sql<number>`coalesce(sum(${schema.prospectRuns.units}), 0)::int` })
    .from(schema.prospectRuns)
    .where(gte(schema.prospectRuns.createdAt, start));
  return row?.n ?? 0;
}

// ---- Contact details the creator published ------------------------------------------------------------

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

/** Emails written in a channel description, including the common "name [at] gmail [dot] com" style. */
export function extractEmails(text: string): string[] {
  const normal = text
    .replace(/\s*[[(]\s*at\s*[\])]\s*/gi, "@")
    .replace(/\s*[[(]\s*dot\s*[\])]\s*/gi, ".");
  const found = (normal.match(EMAIL) ?? []).map((e) => e.toLowerCase().replace(/\.+$/, ""));
  return [...new Set(found)].filter((e) => !/\.(png|jpe?g|gif|webp)$/.test(e)).slice(0, 3);
}

const URL_RE = /https?:\/\/[^\s)<>"']+/gi;
export function extractLinks(text: string): string[] {
  const links = (text.match(URL_RE) ?? []).map((u) => u.replace(/[.,;!]+$/, ""));
  // Social and business links first; YouTube's own links are noise here.
  const useful = links.filter((u) => !/youtube\.com|youtu\.be/i.test(u));
  return [...new Set(useful)].sort((a, b) => Number(/instagram|wa\.me|linktr|facebook|x\.com|twitter/i.test(b)) - Number(/instagram|wa\.me|linktr|facebook|x\.com|twitter/i.test(a))).slice(0, 5);
}

// ---- Scoring ----------------------------------------------------------------------------------------

export interface Candidate {
  channelId: string;
  title: string;
  handle: string | null;
  avatar: string | null;
  country: string | null;
  language: LanguageCode | null;
  subscribers: number;
  views: number;
  videoCount: number;
  lastUploadAt: string | null;
  latestVideoTitle: string | null;
  description: string;
  emails: string[];
  links: string[];
  score: number;
}

/**
 * 0-100. Rewards our sweet spot (≈2K-50K subscribers: big enough to care about growth, small enough to need
 * help), recent uploads, the wanted language, healthy views per video, and a public way to reach them.
 */
export function scoreCandidate(c: Omit<Candidate, "score">, wanted: LanguageCode | "any", now = Date.now()): number {
  let s = 0;
  const logSubs = Math.log10(Math.max(1, c.subscribers));
  s += Math.max(0, 30 - Math.abs(logSubs - 4.1) * 18); // peak ≈ 12.5K
  if (c.lastUploadAt) {
    const days = (now - new Date(c.lastUploadAt).getTime()) / 86_400_000;
    s += days <= 7 ? 20 : days <= 30 ? 12 : 0;
  }
  if (wanted === "any" || c.language === wanted) s += 20;
  else if (!c.language) s += 8;
  const perVideo = c.videoCount ? c.views / c.videoCount : 0;
  s += Math.min(15, (perVideo / Math.max(1, c.subscribers)) * 30);
  if (c.emails.length) s += 15;
  else if (c.links.length) s += 6;
  return Math.round(Math.min(100, s));
}

// ---- Discovery --------------------------------------------------------------------------------------

export interface DiscoverOptions {
  query: string;
  language: LanguageCode | "any";
  minSubs: number;
  maxSubs: number;
  days: number;
  pages: number;
}

const RELEVANCE: Partial<Record<LanguageCode, string>> = { hinglish: "hi", hi: "hi", te: "te", ta: "ta", mr: "mr", bn: "bn", kn: "kn", ml: "ml", en: "en" };

export function estimateUnits(pages: number): number {
  return pages * SEARCH_UNITS + pages; // searches + at most one channels.list per page of 50
}

/**
 * Finds channels that uploaded videos matching `query` in the last `days` days in India, then keeps the ones
 * in the subscriber range and the wanted language. `exclude` holds channel ids to skip (already prospects,
 * already Mitra users).
 */
export async function discover(auth: YouTubeAuth, o: DiscoverOptions, exclude: Set<string>, now = Date.now()): Promise<{ units: number; found: number; candidates: Candidate[] }> {
  type SearchRes = { nextPageToken?: string; items?: { snippet: { channelId: string; title: string; publishedAt: string } }[] };
  const latest = new Map<string, { title: string; publishedAt: string }>();
  let units = 0;
  let pageToken = "";
  for (let page = 0; page < o.pages; page++) {
    const res = await yt<SearchRes>(auth, "search", {
      part: "snippet",
      type: "video",
      q: o.query,
      regionCode: "IN",
      ...(o.language !== "any" && RELEVANCE[o.language] ? { relevanceLanguage: RELEVANCE[o.language]! } : {}),
      publishedAfter: new Date(now - o.days * 86_400_000).toISOString(),
      order: "date",
      maxResults: "50",
      ...(pageToken ? { pageToken } : {}),
    });
    units += SEARCH_UNITS;
    for (const it of res.items ?? []) {
      const prev = latest.get(it.snippet.channelId);
      if (!prev || prev.publishedAt < it.snippet.publishedAt) latest.set(it.snippet.channelId, { title: it.snippet.title, publishedAt: it.snippet.publishedAt });
    }
    if (!res.nextPageToken) break;
    pageToken = res.nextPageToken;
  }
  const ids = [...latest.keys()].filter((id) => !exclude.has(id));

  type ChannelsRes = {
    items?: {
      id: string;
      snippet: { title: string; description?: string; customUrl?: string; country?: string; thumbnails?: { default?: { url: string } } };
      statistics: { subscriberCount?: string; hiddenSubscriberCount?: boolean; viewCount?: string; videoCount?: string };
    }[];
  };
  const candidates: Candidate[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const res = await yt<ChannelsRes>(auth, "channels", { part: "snippet,statistics", id: ids.slice(i, i + 50).join(","), maxResults: "50" });
    units += 1;
    for (const ch of res.items ?? []) {
      const subs = Number(ch.statistics.subscriberCount ?? 0);
      if (ch.statistics.hiddenSubscriberCount || subs < o.minSubs || subs > o.maxSubs) continue;
      const last = latest.get(ch.id);
      const description = (ch.snippet.description ?? "").slice(0, 2000);
      const language = detectLanguage(`${last?.title ?? ""} ${ch.snippet.title}`, null);
      // A clearly different script than wanted (e.g. Tamil when looking for Telugu) is out.
      if (o.language !== "any" && language && language !== o.language && !(o.language === "hinglish" && language === "hi") && !(o.language === "hi" && language === "hinglish")) continue;
      const base = {
        channelId: ch.id,
        title: ch.snippet.title,
        handle: ch.snippet.customUrl ?? null,
        avatar: ch.snippet.thumbnails?.default?.url ?? null,
        country: ch.snippet.country ?? null,
        language,
        subscribers: subs,
        views: Number(ch.statistics.viewCount ?? 0),
        videoCount: Number(ch.statistics.videoCount ?? 0),
        lastUploadAt: last?.publishedAt ?? null,
        latestVideoTitle: last?.title ?? null,
        description,
        emails: extractEmails(description),
        links: extractLinks(description),
      };
      candidates.push({ ...base, score: scoreCandidate(base, o.language, now) });
    }
  }
  return { units, found: latest.size, candidates: candidates.sort((a, b) => b.score - a.score) };
}
