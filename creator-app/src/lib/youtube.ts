import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { decrypt, encrypt } from "./crypto";
import type { ChannelSummary, Comment, DailyPoint, RetentionPoint, Video } from "./types";

export interface GoogleTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // epoch ms
}

export const LOGIN_SCOPES = ["openid", "email", "profile"];
export const YOUTUBE_SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
];

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function redirectUri(origin: string): string {
  return `${process.env.APP_URL ?? origin}/api/auth/google/callback`;
}

export function authUrl(origin: string, state: string, scopes: string[], loginHint?: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope: scopes.join(" "),
    include_granted_scopes: "true",
    state,
  });
  if (scopes.some((s) => YOUTUBE_SCOPES.includes(s))) {
    // A refresh token lets us keep reading analytics after the hour-long access token expires.
    params.set("access_type", "offline");
    params.set("prompt", "consent");
  } else {
    params.set("prompt", "select_account");
  }
  if (loginHint) params.set("login_hint", loginHint);
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

/** `revoked` means Google will never accept this refresh token again: the user must reconnect. */
export class GoogleTokenError extends Error {
  constructor(readonly status: number, readonly revoked: boolean, message: string) {
    super(message);
  }
}

async function tokenRequest(body: Record<string, string>): Promise<GoogleTokens> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      ...body,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new GoogleTokenError(res.status, /invalid_grant/.test(text), `Google token request failed: ${res.status} ${text}`);
  }
  const json = (await res.json()) as { access_token: string; refresh_token?: string; expires_in: number };
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? body.refresh_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
}

export function exchangeCode(code: string, origin: string): Promise<GoogleTokens> {
  return tokenRequest({ code, grant_type: "authorization_code", redirect_uri: redirectUri(origin) });
}

export async function googleProfile(tokens: GoogleTokens): Promise<{ email: string; emailVerified: boolean; name?: string; picture?: string }> {
  const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
  });
  if (!res.ok) throw new Error(`Google userinfo failed: ${res.status}`);
  const p = (await res.json()) as { email: string; email_verified?: boolean; name?: string; picture?: string };
  return { email: p.email, emailVerified: p.email_verified === true, name: p.name, picture: p.picture };
}

// ---- Stored YouTube connection ----------------------------------------------

export async function saveYouTubeConnection(userId: string, tokens: GoogleTokens, channel?: { id: string; title: string }) {
  const values = {
    accessToken: encrypt(tokens.accessToken),
    refreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : null,
    expiresAt: new Date(tokens.expiresAt),
    needsReconnectAt: null,
    updatedAt: new Date(),
    ...(channel ? { channelId: channel.id, channelTitle: channel.title } : {}),
  };
  await (await db())
    .insert(schema.youtubeConnections)
    .values({ userId, ...values })
    .onConflictDoUpdate({ target: schema.youtubeConnections.userId, set: values });
}

/**
 * Disconnects YouTube: tells Google to revoke Mitra's access (so the grant disappears from the creator's Google
 * account too), then forgets the tokens. Revocation is best effort; the tokens are deleted either way.
 */
export async function removeYouTubeConnection(userId: string) {
  const row = await youtubeConnection(userId);
  const token = row ? ((row.refreshToken && decrypt(row.refreshToken)) || decrypt(row.accessToken)) : null;
  if (token && googleConfigured()) {
    await fetch("https://oauth2.googleapis.com/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token }),
      signal: AbortSignal.timeout(5000),
    }).catch((err) => console.warn("Google token revoke failed", err instanceof Error ? err.message : err));
  }
  await (await db()).delete(schema.youtubeConnections).where(eq(schema.youtubeConnections.userId, userId));
}

export async function youtubeConnection(userId: string) {
  const [row] = await (await db()).select().from(schema.youtubeConnections).where(eq(schema.youtubeConnections.userId, userId));
  return row ?? null;
}

const refreshing = new Map<string, Promise<GoogleTokens | null>>();

/**
 * Usable tokens for the user's connected channel, refreshed (and re-saved) when within 5 minutes of expiry.
 * Concurrent requests share one refresh. If Google says the refresh token is revoked, the connection is flagged
 * so the dashboard can ask the user to reconnect, and we stop retrying.
 */
export async function youtubeTokens(userId: string): Promise<GoogleTokens | null> {
  const row = await youtubeConnection(userId);
  if (!row || row.needsReconnectAt) return null;
  const accessToken = decrypt(row.accessToken);
  const refreshToken = row.refreshToken ? decrypt(row.refreshToken) ?? undefined : undefined;
  if (!accessToken) return null;
  const tokens: GoogleTokens = { accessToken, refreshToken, expiresAt: row.expiresAt.getTime() };
  if (tokens.expiresAt - Date.now() > 5 * 60_000) return tokens;
  if (!refreshToken || !googleConfigured()) return null;

  const running = refreshing.get(userId);
  if (running) return running;
  const task = (async () => {
    try {
      const fresh = await tokenRequest({ refresh_token: refreshToken, grant_type: "refresh_token" });
      await saveYouTubeConnection(userId, fresh);
      return fresh;
    } catch (err) {
      if (err instanceof GoogleTokenError && err.revoked) {
        await (await db())
          .update(schema.youtubeConnections)
          .set({ needsReconnectAt: new Date() })
          .where(eq(schema.youtubeConnections.userId, userId));
        return null;
      }
      throw err;
    }
  })();
  refreshing.set(userId, task);
  try {
    return await task;
  } finally {
    refreshing.delete(userId);
  }
}

async function api<T>(tokens: GoogleTokens, url: string): Promise<T> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${tokens.accessToken}` } });
  if (!res.ok) throw new Error(`YouTube API ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

const DATA = "https://www.googleapis.com/youtube/v3";
const ANALYTICS = "https://youtubeanalytics.googleapis.com/v2/reports";

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseDuration(iso: string): number {
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso);
  if (!m) return 0;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}

interface AnalyticsReport {
  columnHeaders: Array<{ name: string }>;
  rows?: Array<Array<string | number>>;
}

function report(tokens: GoogleTokens, params: Record<string, string>) {
  const q = new URLSearchParams({ ids: "channel==MINE", ...params });
  return api<AnalyticsReport>(tokens, `${ANALYTICS}?${q}`);
}

export async function fetchSummary(tokens: GoogleTokens): Promise<ChannelSummary> {
  type ChannelsRes = {
    items?: Array<{
      id: string;
      snippet: { title: string; customUrl?: string; thumbnails?: { default?: { url: string } } };
      statistics: { subscriberCount?: string; viewCount?: string; videoCount?: string };
      contentDetails: { relatedPlaylists: { uploads: string } };
    }>;
  };
  const channels = await api<ChannelsRes>(tokens, `${DATA}/channels?part=snippet,statistics,contentDetails&mine=true`);
  const ch = channels.items?.[0];
  if (!ch) throw new Error("This Google account has no YouTube channel");

  type PlaylistRes = { items?: Array<{ contentDetails: { videoId: string } }> };
  const uploads = await api<PlaylistRes>(
    tokens,
    `${DATA}/playlistItems?part=contentDetails&maxResults=12&playlistId=${ch.contentDetails.relatedPlaylists.uploads}`,
  );
  const ids = (uploads.items ?? []).map((i) => i.contentDetails.videoId);

  type VideosRes = {
    items?: Array<{
      id: string;
      snippet: { title: string; publishedAt: string; liveBroadcastContent?: string; thumbnails?: { medium?: { url: string } } };
      statistics: { viewCount?: string; likeCount?: string; commentCount?: string };
      contentDetails: { duration: string };
      status?: { privacyStatus?: string };
      liveStreamingDetails?: { actualStartTime?: string };
    }>;
  };
  const videos: Video[] = ids.length
    ? ((await api<VideosRes>(tokens, `${DATA}/videos?part=snippet,statistics,contentDetails,status,liveStreamingDetails&id=${ids.join(",")}`)).items ?? []).map(
        (v) => ({
          id: v.id,
          title: v.snippet.title,
          publishedAt: v.snippet.publishedAt.slice(0, 10),
          // A premiere's clock starts when it goes live, not when it was uploaded.
          publishedAtIso: v.liveStreamingDetails?.actualStartTime ?? v.snippet.publishedAt,
          isPublic: v.status?.privacyStatus === "public" && (v.snippet.liveBroadcastContent ?? "none") === "none",
          thumbnail: v.snippet.thumbnails?.medium?.url ?? null,
          durationSec: parseDuration(v.contentDetails.duration),
          views: Number(v.statistics.viewCount ?? 0),
          likes: Number(v.statistics.likeCount ?? 0),
          comments: Number(v.statistics.commentCount ?? 0),
          avgViewPct: null,
        }),
      )
    : [];

  const end = new Date();
  const start = new Date(end.getTime() - 27 * 86_400_000);
  let daily: DailyPoint[] = [];
  try {
    const r = await report(tokens, {
      startDate: ymd(start),
      endDate: ymd(end),
      metrics: "views,estimatedMinutesWatched,subscribersGained",
      dimensions: "day",
      sort: "day",
    });
    daily = (r.rows ?? []).map(([date, views, minutes, subs]) => ({
      date: String(date),
      views: Number(views),
      watchMinutes: Number(minutes),
      subscribersGained: Number(subs),
    }));
  } catch {
    // Analytics can lag or be unavailable for brand-new channels; the dashboard handles an empty series.
  }

  if (ids.length) {
    try {
      const r = await report(tokens, {
        startDate: "2010-01-01",
        endDate: ymd(end),
        metrics: "averageViewPercentage",
        dimensions: "video",
        filters: `video==${ids.join(",")}`,
      });
      const pct = new Map((r.rows ?? []).map(([id, p]) => [String(id), Number(p)]));
      for (const v of videos) v.avgViewPct = pct.get(v.id) ?? null;
    } catch {
      // Leave avgViewPct null.
    }
  }

  return {
    mode: "live",
    channel: {
      id: ch.id,
      title: ch.snippet.title,
      handle: ch.snippet.customUrl ?? "",
      avatar: ch.snippet.thumbnails?.default?.url ?? null,
      subscribers: Number(ch.statistics.subscriberCount ?? 0),
      totalViews: Number(ch.statistics.viewCount ?? 0),
      videoCount: Number(ch.statistics.videoCount ?? 0),
    },
    daily,
    videos,
  };
}

/**
 * Views a video got on its upload day and the day after, from YouTube Analytics: the baseline for the 48-hour
 * check. Only meaningful for videos at least ~4 days old (Analytics lags by a day or two).
 */
export async function fetchEarlyViews(tokens: GoogleTokens, videoId: string, publishedDate: string): Promise<number> {
  const start = new Date(`${publishedDate}T00:00:00Z`);
  const r = await report(tokens, {
    startDate: ymd(start),
    endDate: ymd(new Date(start.getTime() + 86_400_000)),
    metrics: "views",
    filters: `video==${videoId}`,
  });
  return Number(r.rows?.[0]?.[0] ?? 0);
}

export async function fetchRetention(tokens: GoogleTokens, videoId: string): Promise<RetentionPoint[]> {
  const r = await report(tokens, {
    startDate: "2010-01-01",
    endDate: ymd(new Date()),
    metrics: "audienceWatchRatio",
    dimensions: "elapsedVideoTimeRatio",
    filters: `video==${videoId}`,
  });
  return (r.rows ?? []).map(([t, w]) => ({ t: Number(t), watching: Number(w) }));
}

export async function fetchComments(tokens: GoogleTokens, videoId: string): Promise<Comment[]> {
  type ThreadsRes = {
    items?: Array<{
      id: string;
      snippet: {
        topLevelComment: {
          snippet: { authorDisplayName: string; textOriginal: string; likeCount: number; publishedAt: string };
        };
      };
    }>;
  };
  const res = await api<ThreadsRes>(
    tokens,
    `${DATA}/commentThreads?part=snippet&order=relevance&maxResults=60&textFormat=plainText&videoId=${encodeURIComponent(videoId)}`,
  );
  return (res.items ?? []).map((t) => {
    const s = t.snippet.topLevelComment.snippet;
    return { id: t.id, author: s.authorDisplayName, text: s.textOriginal, likes: s.likeCount, publishedAt: s.publishedAt.slice(0, 10) };
  });
}

// ---- Audience: where viewers are, how they find the channel, who they are ----------------------------

export interface AudienceReport {
  days: number;
  countries: { country: string; views: number; minutes: number }[];
  cities: { city: string; country: string; views: number; minutes: number }[];
  sources: { source: string; views: number; minutes: number }[];
  searchTerms: { term: string; views: number }[];
  demographics: { ageGroup: string; gender: string; percent: number }[];
  subscribed: { status: string; views: number }[];
}

/**
 * Channel-wide (or, with `videoId`, one video's) audience for the last `days` days. Each part is fetched
 * separately and left empty if YouTube has no data yet (new channels, small videos), so one gap never
 * hides the rest. City data exists from 2022 on; search terms only for views from YouTube search.
 */
export async function fetchAudience(tokens: GoogleTokens, { days = 28, videoId }: { days?: number; videoId?: string } = {}): Promise<AudienceReport> {
  const end = new Date();
  const range = { startDate: ymd(new Date(end.getTime() - (days - 1) * 86_400_000)), endDate: ymd(end) };
  const video: Record<string, string> = videoId ? { filters: `video==${videoId}` } : {};
  const withFilter = (extra: string) => ({ filters: [videoId ? `video==${videoId}` : "", extra].filter(Boolean).join(";") });
  const rows = async (params: Record<string, string>) => {
    try {
      return (await report(tokens, { ...range, ...params })).rows ?? [];
    } catch (err) {
      console.error(`Audience report failed (${params.dimensions})`, err instanceof Error ? err.message.slice(0, 300) : err);
      return [];
    }
  };
  const [countries, cities, sources, searchTerms, demographics, subscribed] = await Promise.all([
    rows({ dimensions: "country", metrics: "views,estimatedMinutesWatched", sort: "-views", maxResults: "10", ...video }),
    rows({ dimensions: "city,country", metrics: "views,estimatedMinutesWatched", sort: "-views", maxResults: "15", ...video }),
    rows({ dimensions: "insightTrafficSourceType", metrics: "views,estimatedMinutesWatched", sort: "-views", ...video }),
    rows({ dimensions: "insightTrafficSourceDetail", metrics: "views", sort: "-views", maxResults: "15", ...withFilter("insightTrafficSourceType==YT_SEARCH") }),
    rows({ dimensions: "ageGroup,gender", metrics: "viewerPercentage", ...video }),
    rows({ dimensions: "subscribedStatus", metrics: "views", ...video }),
  ]);
  return {
    days,
    countries: countries.map(([c, v, m]) => ({ country: String(c), views: Number(v), minutes: Number(m) })),
    cities: cities.map(([city, c, v, m]) => ({ city: String(city), country: String(c), views: Number(v), minutes: Number(m) })),
    sources: sources.map(([s, v, m]) => ({ source: String(s), views: Number(v), minutes: Number(m) })),
    searchTerms: searchTerms.map(([t, v]) => ({ term: String(t), views: Number(v) })),
    demographics: demographics.map(([a, g, p]) => ({ ageGroup: String(a), gender: String(g), percent: Number(p) })),
    subscribed: subscribed.map(([s, v]) => ({ status: String(s), views: Number(v) })),
  };
}

// ---- Trending in a country -------------------------------------------------------------------------

export interface TrendingVideo {
  id: string;
  title: string;
  channelTitle: string;
  categoryId: string;
  language: string | null;
  publishedAt: string;
  durationSec: number;
  views: number;
  likes: number;
  comments: number;
  tags: string[];
  thumbnail: string | null;
}

/** YouTube's "Trending" chart for a country (1 quota unit per 50 videos). Region is country-level only. */
export async function fetchTrending(tokens: GoogleTokens, regionCode = "IN", pages = 2): Promise<TrendingVideo[]> {
  type Res = {
    nextPageToken?: string;
    items?: Array<{
      id: string;
      snippet: { title: string; channelTitle: string; categoryId: string; defaultAudioLanguage?: string; defaultLanguage?: string; publishedAt: string; tags?: string[]; thumbnails?: { medium?: { url: string } } };
      statistics: { viewCount?: string; likeCount?: string; commentCount?: string };
      contentDetails: { duration: string };
    }>;
  };
  const out: TrendingVideo[] = [];
  let pageToken = "";
  for (let i = 0; i < pages; i++) {
    const q = new URLSearchParams({ part: "snippet,statistics,contentDetails", chart: "mostPopular", regionCode, maxResults: "50", ...(pageToken ? { pageToken } : {}) });
    const res = await api<Res>(tokens, `${DATA}/videos?${q}`);
    for (const v of res.items ?? []) {
      out.push({
        id: v.id,
        title: v.snippet.title,
        channelTitle: v.snippet.channelTitle,
        categoryId: v.snippet.categoryId,
        language: v.snippet.defaultAudioLanguage ?? v.snippet.defaultLanguage ?? null,
        publishedAt: v.snippet.publishedAt,
        durationSec: parseDuration(v.contentDetails.duration),
        views: Number(v.statistics.viewCount ?? 0),
        likes: Number(v.statistics.likeCount ?? 0),
        comments: Number(v.statistics.commentCount ?? 0),
        tags: (v.snippet.tags ?? []).slice(0, 8),
        thumbnail: v.snippet.thumbnails?.medium?.url ?? null,
      });
    }
    if (!res.nextPageToken) break;
    pageToken = res.nextPageToken;
  }
  return out;
}

// ---- Competitors (public channel data) ------------------------------------------------------------

export interface ChannelRef {
  id: string;
  title: string;
  handle: string | null;
  avatar: string | null;
}

export interface ChannelSnapshot extends ChannelRef {
  subscribers: number;
  totalViews: number;
  videoCount: number;
  recent: { id: string; title: string; publishedAt: string; durationSec: number; views: number; likes: number; comments: number }[];
}

/**
 * Reads "@handle", a channel URL (youtube.com/@handle or /channel/UC…) or a "UC…" id. Plain names are refused:
 * finding a channel by name needs YouTube search, which costs 100 quota units per call.
 */
export function parseChannelInput(input: string): { handle: string } | { id: string } | null {
  const s = input.trim();
  const url = /youtube\.com\/(?:(@[\w.\-]+)|channel\/(UC[\w-]{22}))/i.exec(s);
  if (url) return url[1] ? { handle: url[1] } : { id: url[2] };
  if (/^@[\w.\-]{3,100}$/.test(s)) return { handle: s };
  if (/^UC[\w-]{22}$/.test(s)) return { id: s };
  return null;
}

type ChannelsRes = {
  items?: Array<{
    id: string;
    snippet: { title: string; customUrl?: string; thumbnails?: { default?: { url: string } } };
    statistics: { subscriberCount?: string; viewCount?: string; videoCount?: string };
    contentDetails: { relatedPlaylists: { uploads: string } };
  }>;
};

/** Finds a channel from a handle or id (1 quota unit). Null if it doesn't exist. */
export async function resolveChannel(tokens: GoogleTokens, ref: { handle: string } | { id: string }): Promise<ChannelRef | null> {
  const q = new URLSearchParams({ part: "snippet", ...("handle" in ref ? { forHandle: ref.handle } : { id: ref.id }) });
  const res = await api<ChannelsRes>(tokens, `${DATA}/channels?${q}`);
  const ch = res.items?.[0];
  if (!ch) return null;
  return { id: ch.id, title: ch.snippet.title, handle: ch.snippet.customUrl ?? null, avatar: ch.snippet.thumbnails?.default?.url ?? null };
}

/** Public stats and the latest 15 uploads of any channel (3 quota units). */
export async function fetchChannelSnapshot(tokens: GoogleTokens, channelId: string): Promise<ChannelSnapshot> {
  const res = await api<ChannelsRes>(tokens, `${DATA}/channels?part=snippet,statistics,contentDetails&id=${encodeURIComponent(channelId)}`);
  const ch = res.items?.[0];
  if (!ch) throw new Error(`Channel ${channelId} not found`);
  type PlaylistRes = { items?: Array<{ contentDetails: { videoId: string } }> };
  const uploads = await api<PlaylistRes>(tokens, `${DATA}/playlistItems?part=contentDetails&maxResults=15&playlistId=${ch.contentDetails.relatedPlaylists.uploads}`).catch(() => ({ items: [] }) as PlaylistRes);
  const ids = (uploads.items ?? []).map((i) => i.contentDetails.videoId);
  type VideosRes = { items?: Array<{ id: string; snippet: { title: string; publishedAt: string }; statistics: { viewCount?: string; likeCount?: string; commentCount?: string }; contentDetails: { duration: string } }> };
  const videos = ids.length ? (await api<VideosRes>(tokens, `${DATA}/videos?part=snippet,statistics,contentDetails&id=${ids.join(",")}`)).items ?? [] : [];
  return {
    id: ch.id,
    title: ch.snippet.title,
    handle: ch.snippet.customUrl ?? null,
    avatar: ch.snippet.thumbnails?.default?.url ?? null,
    subscribers: Number(ch.statistics.subscriberCount ?? 0),
    totalViews: Number(ch.statistics.viewCount ?? 0),
    videoCount: Number(ch.statistics.videoCount ?? 0),
    recent: videos.map((v) => ({
      id: v.id,
      title: v.snippet.title,
      publishedAt: v.snippet.publishedAt,
      durationSec: parseDuration(v.contentDetails.duration),
      views: Number(v.statistics.viewCount ?? 0),
      likes: Number(v.statistics.likeCount ?? 0),
      comments: Number(v.statistics.commentCount ?? 0),
    })),
  };
}

export interface NicheVideo {
  id: string;
  title: string;
  channelId: string;
  channelTitle: string;
  views: number;
  publishedAt: string;
  durationSec: number;
  thumbnail: string | null;
}

/** YouTube's language hint for a Mitra language: Hinglish searches lean Hindi. */
const SEARCH_LANGUAGE: Record<string, string> = { hinglish: "hi" };

/**
 * The most-watched videos of the last `days` days for a search, in India, leaning toward one language, with each
 * channel's subscriber count so they can be scored. Costs about 102 quota units (search alone is 100), so callers
 * must cache and ration it.
 */
export async function searchNiche(tokens: GoogleTokens, query: string, language: string, days = 30, now = Date.now()): Promise<{ videos: NicheVideo[]; subscribers: Record<string, number> }> {
  const q = new URLSearchParams({
    part: "snippet",
    type: "video",
    q: query,
    order: "viewCount",
    regionCode: "IN",
    relevanceLanguage: SEARCH_LANGUAGE[language] ?? language,
    publishedAfter: new Date(now - days * 86_400_000).toISOString(),
    maxResults: "25",
    safeSearch: "moderate",
  });
  type SearchRes = { items?: Array<{ id: { videoId?: string } }> };
  const ids = ((await api<SearchRes>(tokens, `${DATA}/search?${q}`)).items ?? []).map((i) => i.id.videoId).filter((x): x is string => Boolean(x));
  if (!ids.length) return { videos: [], subscribers: {} };
  type VideosRes = { items?: Array<{ id: string; snippet: { title: string; publishedAt: string; channelId: string; channelTitle: string; thumbnails?: { medium?: { url: string } } }; statistics: { viewCount?: string }; contentDetails: { duration: string } }> };
  const items = (await api<VideosRes>(tokens, `${DATA}/videos?part=snippet,statistics,contentDetails&id=${ids.join(",")}`)).items ?? [];
  const videos = items.map((v) => ({
    id: v.id,
    title: v.snippet.title,
    channelId: v.snippet.channelId,
    channelTitle: v.snippet.channelTitle,
    views: Number(v.statistics.viewCount ?? 0),
    publishedAt: v.snippet.publishedAt,
    durationSec: parseDuration(v.contentDetails.duration),
    thumbnail: v.snippet.thumbnails?.medium?.url ?? null,
  }));
  const channelIds = [...new Set(videos.map((v) => v.channelId))].slice(0, 50);
  type ChRes = { items?: Array<{ id: string; statistics: { subscriberCount?: string; hiddenSubscriberCount?: boolean } }> };
  const chs = (await api<ChRes>(tokens, `${DATA}/channels?part=statistics&id=${channelIds.join(",")}`)).items ?? [];
  const subscribers: Record<string, number> = {};
  for (const c of chs) if (!c.statistics.hiddenSubscriberCount) subscribers[c.id] = Number(c.statistics.subscriberCount ?? 0);
  return { videos, subscribers };
}

/** Just the subscriber count (1 quota unit), for the live counter on the dashboard. */
export async function fetchSubscriberCount(tokens: GoogleTokens): Promise<{ subscribers: number; views: number; hidden: boolean }> {
  type Res = { items?: Array<{ statistics: { subscriberCount?: string; viewCount?: string; hiddenSubscriberCount?: boolean } }> };
  const res = await api<Res>(tokens, `${DATA}/channels?part=statistics&mine=true`);
  const st = res.items?.[0]?.statistics;
  if (!st) throw new Error("No channel");
  return { subscribers: Number(st.subscriberCount ?? 0), views: Number(st.viewCount ?? 0), hidden: Boolean(st.hiddenSubscriberCount) };
}
