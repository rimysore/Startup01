import type { ChannelSummary, Comment, DailyPoint, RetentionPoint, Video } from "./types";
import { readTokens, writeTokens, type YouTubeTokens } from "./session";

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
];

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.SESSION_SECRET);
}

export function redirectUri(origin: string): string {
  return `${process.env.APP_URL ?? origin}/api/auth/youtube/callback`;
}

export function authUrl(origin: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

async function tokenRequest(body: Record<string, string>): Promise<YouTubeTokens> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      ...body,
    }),
  });
  if (!res.ok) throw new Error(`Google token request failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { access_token: string; refresh_token?: string; expires_in: number };
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? body.refresh_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
}

export function exchangeCode(code: string, origin: string): Promise<YouTubeTokens> {
  return tokenRequest({ code, grant_type: "authorization_code", redirect_uri: redirectUri(origin) });
}

/** Returns usable tokens for the current visitor, refreshing (and re-saving) them if they're about to expire. */
export async function currentTokens(): Promise<YouTubeTokens | null> {
  const tokens = await readTokens();
  if (!tokens) return null;
  if (tokens.expiresAt - Date.now() > 60_000) return tokens;
  if (!tokens.refreshToken) return null;
  const fresh = await tokenRequest({ refresh_token: tokens.refreshToken, grant_type: "refresh_token" });
  await writeTokens(fresh);
  return fresh;
}

async function api<T>(tokens: YouTubeTokens, url: string): Promise<T> {
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

function report(tokens: YouTubeTokens, params: Record<string, string>) {
  const q = new URLSearchParams({ ids: "channel==MINE", ...params });
  return api<AnalyticsReport>(tokens, `${ANALYTICS}?${q}`);
}

export async function fetchSummary(tokens: YouTubeTokens): Promise<ChannelSummary> {
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
      snippet: { title: string; publishedAt: string; thumbnails?: { medium?: { url: string } } };
      statistics: { viewCount?: string; likeCount?: string; commentCount?: string };
      contentDetails: { duration: string };
    }>;
  };
  const videos: Video[] = ids.length
    ? ((await api<VideosRes>(tokens, `${DATA}/videos?part=snippet,statistics,contentDetails&id=${ids.join(",")}`)).items ?? []).map(
        (v) => ({
          id: v.id,
          title: v.snippet.title,
          publishedAt: v.snippet.publishedAt.slice(0, 10),
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

export async function fetchRetention(tokens: YouTubeTokens, videoId: string): Promise<RetentionPoint[]> {
  const r = await report(tokens, {
    startDate: "2010-01-01",
    endDate: ymd(new Date()),
    metrics: "audienceWatchRatio",
    dimensions: "elapsedVideoTimeRatio",
    filters: `video==${videoId}`,
  });
  return (r.rows ?? []).map(([t, w]) => ({ t: Number(t), watching: Number(w) }));
}

export async function fetchComments(tokens: YouTubeTokens, videoId: string): Promise<Comment[]> {
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
