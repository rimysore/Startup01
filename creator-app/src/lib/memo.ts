/**
 * Tiny in-memory cache with a time limit and a size cap. Used for YouTube API responses so reloading a page
 * doesn't spend YouTube quota again. Per server instance; fine to lose on restart.
 */
const store = new Map<string, { expires: number; value: unknown }>();
const MAX_ENTRIES = 2_000;

export async function memo<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;
  const value = await load();
  if (store.size >= MAX_ENTRIES) store.delete(store.keys().next().value!); // drop the oldest
  store.set(key, { expires: Date.now() + ttlMs, value });
  return value;
}

/** Forget everything cached for a user (e.g. after they disconnect YouTube or delete their account). */
export function forgetUser(userId: string): void {
  for (const key of store.keys()) if (key.startsWith(`${userId}:`)) store.delete(key);
}
