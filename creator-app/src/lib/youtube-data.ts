import { cached, type Cached } from "./memo";
import { youtubeConnection, youtubeTokens, type GoogleTokens } from "./youtube";

/** How long each kind of YouTube data stays fresh. YouTube Analytics itself only updates about once a day. */
export const FRESH_MS = {
  summary: 60 * 60_000, // channel totals and latest videos: 1 hour
  retention: 24 * 3_600_000, // a video's retention curve: 1 day
  comments: 6 * 3_600_000, // top comments: 6 hours
};

export type Loaded<T> =
  | { kind: "demo" }
  | { kind: "reconnect" }
  | ({ kind: "live" } & Cached<T>);

/**
 * Loads one piece of the signed-in user's YouTube data through the shared cache. Tokens are only looked up
 * (and refreshed) on a cache miss, so a cache hit costs one database read and no Google calls.
 */
export async function loadYouTube<T>(
  userId: string | undefined,
  name: string,
  ttlMs: number,
  fetch: (tokens: GoogleTokens) => Promise<T>,
  { force = false }: { force?: boolean } = {},
): Promise<Loaded<T>> {
  if (!userId) return { kind: "demo" };
  const yt = await youtubeConnection(userId);
  if (!yt) return { kind: "demo" };
  if (yt.needsReconnectAt) return { kind: "reconnect" };
  // Keyed by channel too, so reconnecting a different channel never shows the old one's data.
  const result = await cached(userId, `${yt.channelId ?? "channel"}:${name}`, ttlMs, async () => {
    const tokens = await youtubeTokens(userId);
    if (!tokens) throw new Error("YouTube access is no longer valid");
    return fetch(tokens);
  }, { force });
  return { kind: "live", ...result };
}

export const RECONNECT_MESSAGE = "Google stopped accepting Mitra's access to your channel. Reconnect YouTube in Connections to see live data.";

export function staleNote(fetchedAt: number): string {
  const hours = Math.max(1, Math.round((Date.now() - fetchedAt) / 3_600_000));
  return `YouTube isn't responding right now, so this is your data from ${hours} hour${hours === 1 ? "" : "s"} ago.`;
}
