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
  if (!res.ok) throw new Error(`Google token request failed: ${res.status} ${await res.text()}`);
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
    updatedAt: new Date(),
    ...(channel ? { channelId: channel.id, channelTitle: channel.title } : {}),
  };
  await (await db())
    .insert(schema.youtubeConnections)
    .values({ userId, ...values })
    .onConflictDoUpdate({ target: schema.youtubeConnections.userId, set: values });
}

export async function removeYouTubeConnection(userId: string) {
  await (await db()).delete(schema.youtubeConnections).where(eq(schema.youtubeConnections.userId, userId));
}

export async function youtubeConnection(userId: string) {
  const [row] = await (await db()).select().from(schema.youtubeConnections).where(eq(schema.youtubeConnections.userId, userId));
  return row ?? null;
}

/** Usable tokens for the user's connected channel, refreshed (and re-saved) when close to expiry. */
export async function youtubeTokens(userId: string): Promise<GoogleTokens | null> {
  const row = await youtubeConnection(userId);
  if (!row) return null;
  const accessToken = decrypt(row.accessToken);
  const refreshToken = row.refreshToken ? decrypt(row.refreshToken) ?? undefined : undefined;
  if (!accessToken) return null;
  const tokens: GoogleTokens = { accessToken, refreshToken, expiresAt: row.expiresAt.getTime() };
  if (tokens.expiresAt - Date.now() > 60_000) return tokens;
  if (!refreshToken || !googleConfigured()) return null;
  const fresh = await tokenRequest({ refresh_token: refreshToken, grant_type: "refresh_token" });
  await saveYouTubeConnection(userId, fresh);
  return fresh;
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
