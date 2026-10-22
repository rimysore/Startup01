import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { HandleStats } from "@/db/schema";
import { decrypt, encrypt } from "@/lib/crypto";
import type { NICHES } from "./flag";
import { slugify, uniqueSlug } from "./store";

type Niche = (typeof NICHES)[number];

/*
 * Verifying a creator's accounts, read-only: followers, posts, views, recent posts' likes and comments, and where
 * followers are. Instagram through the Instagram API with Instagram Login (instagram_business_basic for the profile
 * and posts, instagram_business_manage_insights for views and audience; professional accounts only). Connecting
 * also fills in the creator's profile. YouTube verification (youtube.readonly) is kept for later but not offered
 * now. Other apps have no public API, so their numbers stay self-reported.
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

export const IG_VERSION = process.env.INSTAGRAM_GRAPH_VERSION || "v23.0";
export const IG_GRAPH = "https://graph.instagram.com";
export const IG_SCOPES = ["instagram_business_basic", "instagram_business_manage_insights", "instagram_business_manage_comments", "instagram_business_manage_messages"];
/** What Auto-DM needs on top of reading the profile: reading comments and sending private replies. */
export const DM_SCOPES = ["instagram_business_manage_comments", "instagram_business_manage_messages"];

export function instagramConfigured(): boolean {
  return Boolean(process.env.INSTAGRAM_APP_ID && process.env.INSTAGRAM_APP_SECRET);
}

export const instagramRedirectUri = (origin: string) => `${process.env.APP_URL ?? origin}/api/auth/instagram/callback`;

export function instagramAuthUrl(origin: string, state: string): string {
  const p = new URLSearchParams({ client_id: process.env.INSTAGRAM_APP_ID!, redirect_uri: instagramRedirectUri(origin), response_type: "code", scope: IG_SCOPES.join(","), state });
  return `https://www.instagram.com/oauth/authorize?${p}`;
}

export async function igJson<T>(res: Response): Promise<T> {
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

export type IgProfile = { user_id?: string; id?: string; username: string; name?: string; biography?: string; account_type?: string; profile_picture_url?: string; followers_count?: number; follows_count?: number; media_count?: number };
export type IgMedia = { id: string; caption?: string; media_type?: string; media_product_type?: string; permalink?: string; timestamp: string; like_count?: number; comments_count?: number; views?: number | null };
type Breakdown = { name: string; value: number }[];
export type IgSnapshot = { profile: IgProfile; media: IgMedia[]; audience: { city: Breakdown; age: Breakdown; gender: Breakdown } };

/**
 * The account's profile numbers, bio, last 12 posts (with views where Instagram gives them) and where followers
 * are. Only the profile is required; everything else is filled in when Instagram answers and left empty otherwise.
 */
export async function instagramSnapshot(token: string, f: Fetcher = fetch): Promise<IgSnapshot> {
  const q = (fields: Record<string, string>) => new URLSearchParams({ ...fields, access_token: token });
  const get = async <T,>(path: string, params: Record<string, string>) => igJson<T>(await f(`${IG_GRAPH}/${IG_VERSION}/${path}?${q(params)}`));
  const profile = await get<IgProfile>("me", { fields: "user_id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count" });
  const [bio, media] = await Promise.all([
    get<{ biography?: string }>("me", { fields: "biography" }).catch(() => ({ biography: undefined })),
    get<{ data?: IgMedia[] }>("me/media", { fields: "id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count", limit: "12" })
      .then((r) => r.data ?? [])
      .catch(() => [] as IgMedia[]),
  ]);
  type Insight = { data?: { name: string; values?: { value: number }[]; total_value?: { value?: number; breakdowns?: { results?: { dimension_values: string[]; value: number }[] }[] } }[] };
  await Promise.all(
    media.map(async (m) => {
      const r = await get<Insight>(`${m.id}/insights`, { metric: "views" }).catch(() => null);
      const v = r?.data?.[0];
      m.views = v?.values?.[0]?.value ?? v?.total_value?.value ?? null;
    }),
  );
  const demo = async (breakdown: string): Promise<Breakdown> => {
    const r = await get<Insight>("me/insights", { metric: "follower_demographics", period: "lifetime", metric_type: "total_value", breakdown }).catch(() => null);
    return (r?.data?.[0]?.total_value?.breakdowns?.[0]?.results ?? []).map((x) => ({ name: x.dimension_values[0], value: x.value }));
  };
  const [city, age, gender] = await Promise.all([demo("city"), demo("age"), demo("gender")]);
  return { profile: { ...profile, biography: bio.biography }, media, audience: { city, age, gender } };
}

const shares = (b: Breakdown, n: number) => {
  const total = b.reduce((t, x) => t + x.value, 0);
  return total ? [...b].sort((a, c) => c.value - a.value).slice(0, n).map((x) => ({ name: x.name.replace(/, Karnataka$/, ""), pct: Math.round((x.value / total) * 100) })) : [];
};

/** Instagram numbers as Mitra keeps them: followers, median views of recent posts, engagement, posting rhythm, audience. */
export function instagramVerified(s: IgSnapshot, now = Date.now()) {
  const recent = s.media.slice(0, 12);
  const followers = s.profile.followers_count ?? 0;
  const avgEngagement = recent.length ? Math.round(recent.reduce((t, m) => t + (m.like_count ?? 0) + (m.comments_count ?? 0), 0) / recent.length) : null;
  const reels = recent.filter((m) => m.media_product_type === "REELS");
  // Reels are what businesses buy, so their views count when there are enough of them.
  const viewed = (reels.length >= 3 ? reels : recent).map((m) => m.views).filter((v): v is number => typeof v === "number");
  const oldest = recent.length ? Math.min(...recent.map((m) => new Date(m.timestamp).getTime())) : now;
  const weeks = Math.max(1, (now - oldest) / (7 * 86_400_000));
  const women = s.audience.gender.length ? shares(s.audience.gender, 3).find((g) => g.name === "F")?.pct ?? 0 : null;
  const audience = s.audience.city.length || s.audience.age.length ? { cities: shares(s.audience.city, 3), ages: shares(s.audience.age, 2), women } : null;
  const stats: HandleStats = {
    posts: s.profile.media_count ?? null,
    following: s.profile.follows_count ?? null,
    avgEngagement,
    engagementRate: avgEngagement != null && followers ? Math.round((avgEngagement / followers) * 1000) / 10 : null,
    postsPerWeek: recent.length >= 2 ? Math.round((recent.length / weeks) * 10) / 10 : null,
    reelsShare: recent.length ? Math.round((reels.length / recent.length) * 100) : null,
    audience,
    recent: recent.slice(0, 6).map((m) => ({
      id: m.id,
      title: (m.caption ?? "").split("\n")[0].slice(0, 90) || (m.media_product_type === "REELS" ? "Reel" : "Post"),
      url: m.permalink ?? null,
      at: m.timestamp,
      views: m.views ?? null,
      likes: m.like_count ?? null,
      comments: m.comments_count ?? null,
      kind: m.media_product_type ?? m.media_type ?? null,
    })),
  };
  return {
    handle: s.profile.username,
    followers,
    avgViews: median(viewed),
    stats,
    avatarUrl: s.profile.profile_picture_url ?? null,
    profileUrl: `https://www.instagram.com/${s.profile.username}/`,
    verifiedBy: "instagram_connection",
  };
}

/* ---- Filling in the profile from Instagram ---- */

/** Words in a bio, captions and hashtags that mean a niche. */
const CREATOR_NICHES: [Niche, RegExp][] = [
  ["food", /food|foodie|eat|dosa|biryani|cafe|café|restaurant|recipe|cook|kitchen|chai|coffee|street ?food|ಊಟ|ಅಡುಗೆ|ರುಚಿ/i],
  ["fitness", /fitness|gym|workout|yoga|run(ning|ner)|athlete|health|ಯೋಗ/i],
  ["beauty", /beauty|makeup|skin ?care|hair|nails|mua\b|salon|ಸೌಂದರ್ಯ/i],
  ["fashion", /fashion|ootd|outfit|style|saree|ethnic ?wear|thrift|ಸೀರೆ/i],
  ["tech", /tech|gadget|unboxing|smartphone|mobile review|coding|laptop/i],
  ["travel", /travel|trip|trek|wander|explore|roadtrip|ಪ್ರವಾಸ/i],
  ["comedy", /comedy|funny|meme|prank|sketch|ಹಾಸ್ಯ|ಕಾಮಿಡಿ/i],
  ["education", /educat|learn|teach|tips|exam|study|career|finance|ಕಲಿ/i],
  ["family", /mom|mother|dad|parent|kids|baby|family|ಅಮ್ಮ|ಕುಟುಂಬ/i],
  ["devotional", /temple|devotional|spiritual|bhakti|god|ದೇವ|ಭಕ್ತಿ/i],
  ["lifestyle", /lifestyle|vlog|daily ?life|home ?decor|minimal/i],
];

/** Bengaluru areas, so the creator's own area is filled in when the bio or captions name one. */
const AREAS = ["Jayanagar", "Malleshwaram", "Indiranagar", "Koramangala", "Basavanagudi", "Rajajinagar", "HSR Layout", "JP Nagar", "Whitefield", "BTM Layout", "Banashankari", "Hebbal", "Yelahanka", "Electronic City", "Marathahalli", "Vijayanagar", "Sadashivanagar", "Frazer Town", "RR Nagar", "Kengeri", "Bellandur", "Sarjapur", "Vidyaranyapura", "Hennur", "Kammanahalli", "Ulsoor", "Shivajinagar", "Yeshwanthpur", "Mysore Road", "Bannerghatta Road"];
const norm = (x: string) => x.toLowerCase().replace(/[^a-z]/g, "");

export type ProfileFill = { displayName: string | null; bio: string | null; niches: Niche[]; languages: ("kn" | "en")[]; area: string | null };

/** What Instagram tells us about the creator, for the profile: name, bio, niches, languages and area. */
export function instagramProfileFill(s: IgSnapshot): ProfileFill {
  const text = [s.profile.biography ?? "", ...s.media.map((m) => m.caption ?? "")].join("\n");
  const niches = CREATOR_NICHES.map(([n, re]) => [n, (text.match(new RegExp(re.source, "gi")) ?? []).length] as const)
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([n]) => n);
  if (!niches.length && (s.profile.biography || s.media.length)) niches.push("lifestyle");
  const kannada = (text.match(/[\u0C80-\u0CFF]/g) ?? []).length;
  const latin = (text.match(/[a-z]{3,}/gi) ?? []).length;
  const languages: ("kn" | "en")[] = [];
  if (kannada >= 10 || /kannada|ಕನ್ನಡ/i.test(text)) languages.push("kn");
  if (latin >= 5) languages.push("en");
  const flat = norm(text);
  const area = AREAS.find((a) => flat.includes(norm(a))) ?? null;
  const bio = (s.profile.biography ?? "").replace(/\s+/g, " ").trim().slice(0, 160) || null;
  return { displayName: s.profile.name?.trim().slice(0, 60) || null, bio, niches, languages, area };
}

/**
 * Fills the creator's profile from Instagram. Only empty fields are filled, so nothing the creator typed is
 * overwritten; languages Instagram shows are added. Creates the profile if there isn't one yet.
 */
export async function applyProfileFill(userId: string, fill: ProfileFill, fallbackName: string): Promise<string[]> {
  const d = await db();
  const [p] = await d.select().from(schema.creatorProfiles).where(eq(schema.creatorProfiles.userId, userId));
  const filled: string[] = [];
  if (!p) {
    const displayName = fill.displayName ?? fallbackName;
    await d.insert(schema.creatorProfiles).values({ userId, slug: await uniqueSlug(slugify(displayName), userId), displayName, bio: fill.bio, area: fill.area, niches: fill.niches, languages: fill.languages });
    return ["name", ...(fill.bio ? ["bio"] : []), ...(fill.area ? ["area"] : []), ...(fill.niches.length ? ["niches"] : []), ...(fill.languages.length ? ["languages"] : [])];
  }
  const set: Partial<typeof schema.creatorProfiles.$inferInsert> = {};
  if (!p.bio && fill.bio) set.bio = fill.bio;
  if (!p.area && fill.area) set.area = fill.area;
  if (!p.niches.length && fill.niches.length) set.niches = fill.niches;
  const langs = [...new Set([...p.languages, ...fill.languages])].slice(0, 2);
  if (langs.length !== p.languages.length) set.languages = langs;
  filled.push(...Object.keys(set));
  if (filled.length) await d.update(schema.creatorProfiles).set({ ...set, updatedAt: new Date() }).where(eq(schema.creatorProfiles.userId, userId));
  return filled;
}

/** Connect or refresh: save the verified numbers and fill in the profile. */
export async function syncInstagram(userId: string, snap: IgSnapshot, fallbackName: string) {
  const handle = await saveVerifiedHandle(userId, "instagram", instagramVerified(snap));
  const filled = await applyProfileFill(userId, instagramProfileFill(snap), fallbackName);
  return { handle, filled };
}

export async function saveInstagramConnection(userId: string, c: { igUserId: string; username: string; token: string; expiresAt: Date; scopes?: string[] }) {
  const values = { igUserId: c.igUserId, username: c.username, accessToken: encrypt(c.token), expiresAt: c.expiresAt, scopes: (c.scopes ?? IG_SCOPES).join(","), updatedAt: new Date() };
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

/** Disconnect Instagram: drop the token, the verified numbers and Auto-DM activity (typed numbers can be entered again). */
export async function removeInstagram(userId: string) {
  const d = await db();
  await d.delete(schema.instagramConnections).where(eq(schema.instagramConnections.userId, userId));
  // Auto-DM activity goes with the connection; the creator's Auto-DM settings stay for when they reconnect.
  await d.delete(schema.dmEvents).where(eq(schema.dmEvents.userId, userId));
  await d
    .update(schema.creatorHandles)
    .set({ verifiedAt: null, verifiedBy: null, stats: null, avatarUrl: null, followers: null, updatedAt: new Date() })
    .where(and(eq(schema.creatorHandles.userId, userId), eq(schema.creatorHandles.platform, "instagram")));
}
