import { and, eq, gt, gte, lt, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Feature, Usage } from "./ai";
import { sha256 } from "./crypto";

/** Max real AI calls per user per minute. Stops runaway scripts and accidental double-submits. */
const PER_MINUTE = Number(process.env.AI_RATE_PER_MINUTE ?? 8);

export async function overRateLimit(userId: string): Promise<boolean> {
  const since = new Date(Date.now() - 60_000);
  const [row] = await (await db())
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.aiCalls)
    .where(and(eq(schema.aiCalls.userId, userId), gt(schema.aiCalls.createdAt, since)));
  return (row?.n ?? 0) >= PER_MINUTE;
}

/**
 * Circuit breaker: when today's estimated AI spend (UTC) reaches AI_DAILY_BUDGET_USD, new AI calls pause until
 * tomorrow. Protects against bugs, abuse or a viral day blowing through the budget. Unset = no cap.
 */
export async function overDailyBudget(): Promise<boolean> {
  const budget = Number(process.env.AI_DAILY_BUDGET_USD);
  if (!budget) return false;
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const [row] = await (await db())
    .select({ micros: sql<number>`coalesce(sum(${schema.aiCalls.costMicros}), 0)::bigint` })
    .from(schema.aiCalls)
    .where(gte(schema.aiCalls.createdAt, start));
  const over = Number(row?.micros ?? 0) >= budget * 1e6;
  if (over) console.error(`AI daily budget of $${budget} reached; AI calls paused until 00:00 UTC`);
  return over;
}

export async function logCall(userId: string, feature: Feature | "image", usage: Usage, latencyMs: number): Promise<void> {
  await (await db()).insert(schema.aiCalls).values({ userId, feature, latencyMs, ...usage });
}

// ---- Answer cache ------------------------------------------------------------------

/** Per user, so one person's cached answer is never shown to another. */
export function cacheKey(userId: string, feature: Feature, model: string, input: unknown): string {
  return sha256(JSON.stringify([userId, feature, model, input]));
}

export async function readCache<T>(key: string): Promise<T | null> {
  const [row] = await (await db())
    .select({ result: schema.aiCache.result })
    .from(schema.aiCache)
    .where(and(eq(schema.aiCache.key, key), gt(schema.aiCache.expiresAt, new Date())));
  return (row?.result as T) ?? null;
}

export async function writeCache(key: string, userId: string, feature: Feature, result: unknown, hours: number): Promise<void> {
  const d = await db();
  const expiresAt = new Date(Date.now() + hours * 3_600_000);
  await d
    .insert(schema.aiCache)
    .values({ key, userId, feature, result, expiresAt })
    .onConflictDoUpdate({ target: schema.aiCache.key, set: { result, expiresAt } });
  // Occasionally sweep expired rows so the table stays small without a separate job.
  if (Math.random() < 0.05) await d.delete(schema.aiCache).where(lt(schema.aiCache.expiresAt, new Date()));
}
