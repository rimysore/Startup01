import { eq, lt } from "drizzle-orm";
import { db, schema } from "@/db";
import { decrypt, encrypt } from "./crypto";

/**
 * Two-level cache for YouTube API responses:
 *   1. server memory (instant, per instance), then
 *   2. Postgres (shared by every instance and survives restarts; values encrypted).
 * Identical requests that arrive together share one YouTube call. If YouTube fails (quota used up, outage) we
 * serve the last good copy for up to STALE_DAYS and say so, instead of falling back to demo data.
 */
const STALE_DAYS = 7;
const MAX_ENTRIES = 2_000;
const memory = new Map<string, { expires: number; value: unknown; fetchedAt: number }>();
const inflight = new Map<string, Promise<Cached<unknown>>>();

export interface Cached<T> {
  value: T;
  fetchedAt: number;
  /** True when YouTube couldn't be reached and this is an older copy. */
  stale: boolean;
}

function remember(key: string, value: unknown, fetchedAt: number, expires: number) {
  if (memory.size >= MAX_ENTRIES) memory.delete(memory.keys().next().value!); // drop the oldest
  memory.set(key, { value, fetchedAt, expires });
}

/** A manual refresh never refetches data younger than this, so a refresh button can't burn YouTube quota. */
export const MIN_REFRESH_MS = 60_000;

export async function cached<T>(
  userId: string,
  name: string,
  ttlMs: number,
  load: () => Promise<T>,
  { force = false }: { force?: boolean } = {},
): Promise<Cached<T>> {
  const key = `${userId}:${name}`;
  // With force, anything older than MIN_REFRESH_MS counts as expired.
  const freshUntil = (fetchedAt: number, expires: number) => (force ? Math.min(expires, fetchedAt + MIN_REFRESH_MS) : expires);
  const hit = memory.get(key);
  if (hit && freshUntil(hit.fetchedAt, hit.expires) > Date.now()) return { value: hit.value as T, fetchedAt: hit.fetchedAt, stale: false };

  const running = inflight.get(key);
  if (running) return running as Promise<Cached<T>>;
  const task = (async (): Promise<Cached<T>> => {
    const d = await db();
    const [row] = await d.select().from(schema.youtubeCache).where(eq(schema.youtubeCache.key, key));
    const stored = row ? decrypt(row.value) : null;
    if (row && stored && freshUntil(row.fetchedAt.getTime(), row.expiresAt.getTime()) > Date.now()) {
      remember(key, JSON.parse(stored), row.fetchedAt.getTime(), row.expiresAt.getTime());
      return { value: JSON.parse(stored) as T, fetchedAt: row.fetchedAt.getTime(), stale: false };
    }
    let value: T;
    try {
      value = await load();
    } catch (err) {
      if (row && stored && row.keepUntil.getTime() > Date.now()) {
        console.error(`YouTube fetch failed for ${name}; serving copy from ${row.fetchedAt.toISOString()}`, err);
        return { value: JSON.parse(stored) as T, fetchedAt: row.fetchedAt.getTime(), stale: true };
      }
      throw err;
    }
    const now = Date.now();
    remember(key, value, now, now + ttlMs);
    const values = {
      value: encrypt(JSON.stringify(value)),
      fetchedAt: new Date(now),
      expiresAt: new Date(now + ttlMs),
      keepUntil: new Date(now + STALE_DAYS * 86_400_000),
    };
    await d.insert(schema.youtubeCache).values({ key, userId, ...values }).onConflictDoUpdate({ target: schema.youtubeCache.key, set: values });
    // Occasionally sweep rows past their fallback window so the table stays small without a separate job.
    if (Math.random() < 0.02) await d.delete(schema.youtubeCache).where(lt(schema.youtubeCache.keepUntil, new Date()));
    return { value, fetchedAt: now, stale: false };
  })();
  inflight.set(key, task);
  try {
    return await task;
  } finally {
    inflight.delete(key);
  }
}

/** Forget everything cached for a user (after they disconnect YouTube or delete their account). */
export async function forgetUser(userId: string): Promise<void> {
  for (const key of memory.keys()) if (key.startsWith(`${userId}:`)) memory.delete(key);
  await (await db()).delete(schema.youtubeCache).where(eq(schema.youtubeCache.userId, userId));
}
