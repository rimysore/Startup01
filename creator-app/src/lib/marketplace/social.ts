import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { HandleStats } from "@/db/schema";
import { decrypt, encrypt } from "@/lib/crypto";

/*
 * Verifying a creator's accounts, read-only and public numbers only: followers, posts, views and recent posts'
 * likes and comments. YouTube through the existing Google connection (youtube.readonly); Instagram through the
 * Instagram API with Instagram Login (instagram_business_basic, professional accounts only). Other apps have no
 * public API, so their numbers stay self-reported.
 */

export type Fetcher = typeof fetch;
const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

/** Stores verified numbers for a platform, replacing whatever was typed. */
export async function saveVerifiedHandle(
  userId: string,
  platform: "youtube" | "instagram",
  v: { handle: string; followers: number; avgViews: number | null; stats: HandleStats; avatarUrl: string | null; profileUrl: string | null; verifiedBy: string },
  now = new Date(),
) {
  const values = { handle: v.handle, followers: v.followers, avgViews: v.avgViews, stats: v.stats, avatarUrl: v.avatarUrl, profileUrl: v.profileUrl, verifiedAt: now, verifiedBy: v.verifiedBy, updatedAt: now };
  const [row] = await (await db())
    .insert(schema.creatorHandles)
    .values({ userId, platform, ...values })
    .onConflictDoUpdate({ target: [schema.creatorHandles.userId, schema.creatorHandles.platform], set: values })
    .returning();
  return row;
}

/* ---- YouTube ---- */

export type ChannelSnapshotLike = {
  id: string;
  title: string;
  handle: string | null;
  avatar: string | null;
  subscribers: number;
  totalViews: number;
  videoCount: number;
  recent: { id: string; title: string; publishedAt: string; views: number; likes: number; comments: number }[];
};

/** Public channel numbers as Mitra keeps them: subscribers, videos, total views, median views of recent uploads. */
export function youtubeVerified(snap: ChannelSnapshotLike) {
  const recent = snap.recent.slice(0, 12);
  const stats: HandleStats = {
    posts: snap.videoCount,
    totalViews: snap.totalViews,
    avgEngagement: recent.length ? Math.round(recent.reduce((s, v) => s + v.likes + v.comments, 0) / recent.length) : null,
    recent: recent.slice(0, 6).map((v) => ({ id: v.id, title: v.title, url: `https://www.youtube.com/watch?v=${v.id}`, at: v.publishedAt, views: v.views, likes: v.likes, comments: v.comments })),
  };
  return {
    handle: snap.handle ?? snap.title,
    followers: snap.subscribers,
    avgViews: median(recent.map((v) => v.views)),
    stats,
    avatarUrl: snap.avatar,
    profileUrl: snap.handle ? `https://www.youtube.com/${snap.handle.startsWith("@") ? snap.handle : `@${snap.handle}`}` : `https://www.youtube.com/channel/${snap.id}`,
    verifiedBy: "youtube_connection",
  };
}

/* ---- Instagram (Instagram API with Instagram Login) ---- */

const IG_VERSION = process.env.INSTAGRAM_GRAPH_VERSION || "v23.0";
const IG_GRAPH = "https://graph.instagram.com";
export const IG_SCOPES = ["instagram_business_basic"];

export function instagramConfigured(): boolean {
  return Boolean(process.env.INSTAGRAM_APP_ID && process.env.INSTAGRAM_APP_SECRET);
}

export const instagramRedirectUri = (origin: string) => `${process.env.APP_URL ?? origin}/api/auth/instagram/callback`;

export function instagramAuthUrl(origin: string, state: string): string {
  const p = new URLSearchParams({ client_id: process.env.INSTAGRAM_APP_ID!, redirect_uri: instagramRedirectUri(origin), response_type: "code", scope: IG_SCOPES.join(","), state });
  return `https://www.instagram.com/oauth/authorize?${p}`;
}

async function igJson<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => null)) as (T & { error?: { message?: string; type?: string } | string; error_message?: string }) | null;
  if (!res.ok || !body) {
    const msg = typeof body?.error === "object" ? body.error.message : (body?.error_message ?? String(body?.error ?? res.status));
    throw new Error(`Instagram: ${msg}`);
  }
  return body;
}

/** Code → short-lived token → long-lived token (about 60 days). */
export async function instagramExchange(code: string, origin: string, f: Fetcher = fetch): Promise<{ token: string; userId: string; expiresAt: Date }> {
  const short = await igJson<{ access_token: string; user_id: number | string }>(
    await f("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: process.env.INSTAGRAM_APP_ID!, client_secret: process.env.INSTAGRAM_APP_SECRET!, grant_type: "authorization_code", redirect_uri: instagramRedirectUri(origin), code }),
    }),
  );
  const long = await igJson<{ access_token: string; expires_in: number }>(
    await f(`${IG_GRAPH}/access_token?${new URLSearchParams({ grant_type: "ig_exchange_token", client_secret: process.env.INSTAGRAM_APP_SECRET!, access_token: short.access_token })}`),
  );
  return { token: long.access_token, userId: String(short.user_id), expiresAt: new Date(Date.now() + long.expires_in * 1000) };
}

export type IgProfile = { user_id?: string; id?: string; username: string; name?: string; account_type?: string; profile_picture_url?: string; followers_count?: number; follows_count?: number; media_count?: number };
export type IgMedia = { id: string; caption?: string; media_type?: string; media_product_type?: string; permalink?: string; timestamp: string; like_count?: number; comments_count?: number };

/** The account's public profile numbers and its last 12 posts' likes and comments. */
export async function instagramSnapshot(token: string, f: Fetcher = fetch): Promise<{ profile: IgProfile; media: IgMedia[] }> {
  const q = (fields: string, extra: Record<string, string> = {}) => new URLSearchParams({ fields, access_token: token, ...extra });
  const profile = await igJson<IgProfile>(await f(`${IG_GRAPH}/${IG_VERSION}/me?${q("user_id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count")}`));
  const media = await igJson<{ data?: IgMedia[] }>(await f(`${IG_GRAPH}/${IG_VERSION}/me/media?${q("id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count", { limit: "12" })}`))
    .then((r) => r.data ?? [])
    .catch(() => [] as IgMedia[]);
  return { profile, media };
}

/** Public Instagram numbers as Mitra keeps them. Instagram doesn't share reel views on this API, so avgViews is null. */
export function instagramVerified(s: { profile: IgProfile; media: IgMedia[] }) {
  const recent = s.media.slice(0, 12);
  const stats: HandleStats = {
    posts: s.profile.media_count ?? null,
    following: s.profile.follows_count ?? null,
    avgEngagement: recent.length ? Math.round(recent.reduce((t, m) => t + (m.like_count ?? 0) + (m.comments_count ?? 0), 0) / recent.length) : null,
    recent: recent.slice(0, 6).map((m) => ({
      id: m.id,
      title: (m.caption ?? "").split("\n")[0].slice(0, 90) || (m.media_product_type === "REELS" ? "Reel" : "Post"),
      url: m.permalink ?? null,
      at: m.timestamp,
      likes: m.like_count ?? null,
      comments: m.comments_count ?? null,
      kind: m.media_product_type ?? m.media_type ?? null,
    })),
  };
  return {
    handle: s.profile.username,
    followers: s.profile.followers_count ?? 0,
    avgViews: null,
    stats,
    avatarUrl: s.profile.profile_picture_url ?? null,
    profileUrl: `https://www.instagram.com/${s.profile.username}/`,
    verifiedBy: "instagram_connection",
  };
}

export async function saveInstagramConnection(userId: string, c: { igUserId: string; username: string; token: string; expiresAt: Date }) {
  const values = { igUserId: c.igUserId, username: c.username, accessToken: encrypt(c.token), expiresAt: c.expiresAt, updatedAt: new Date() };
  await (await db()).insert(schema.instagramConnections).values({ userId, ...values }).onConflictDoUpdate({ target: schema.instagramConnections.userId, set: values });
}

export async function instagramConnection(userId: string) {
  const [row] = await (await db()).select().from(schema.instagramConnections).where(eq(schema.instagramConnections.userId, userId));
  return row ?? null;
}

/** The decrypted token, refreshed when it has under a week left (long-lived tokens last ~60 days). */
export async function instagramToken(userId: string, f: Fetcher = fetch, now = Date.now()): Promise<string | null> {
  const c = await instagramConnection(userId);
  if (!c) return null;
  const token = decrypt(c.accessToken);
  if (!token) return null;
  if (c.expiresAt.getTime() < now) return null;
  if (c.expiresAt.getTime() - now > 7 * 86_400_000) return token;
  const r = await igJson<{ access_token: string; expires_in: number }>(await f(`${IG_GRAPH}/refresh_access_token?${new URLSearchParams({ grant_type: "ig_refresh_token", access_token: token })}`)).catch(() => null);
  if (!r) return token;
  await (await db()).update(schema.instagramConnections).set({ accessToken: encrypt(r.access_token), expiresAt: new Date(now + r.expires_in * 1000), updatedAt: new Date() }).where(eq(schema.instagramConnections.userId, userId));
  return r.access_token;
}

/** Disconnect Instagram: drop the token and the verified numbers (typed numbers can be entered again). */
export async function removeInstagram(userId: string) {
  const d = await db();
  await d.delete(schema.instagramConnections).where(eq(schema.instagramConnections.userId, userId));
  await d
    .update(schema.creatorHandles)
    .set({ verifiedAt: null, verifiedBy: null, stats: null, avatarUrl: null, followers: null, updatedAt: new Date() })
    .where(and(eq(schema.creatorHandles.userId, userId), eq(schema.creatorHandles.platform, "instagram")));
}
