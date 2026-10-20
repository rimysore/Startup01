import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { AiRefusal, aiConfigured, route, type AiResult, type Feature } from "./ai";
import { cacheKey, logCall, overDailyBudget, overRateLimit, readCache, writeCache } from "./ai-guard";
import { currentUser, isAdmin, type User } from "./auth";
import { aiPaused, BETA, BETA_DEFAULT_LANGUAGE, offeredLanguage } from "./beta";
import { isLanguageCode } from "./languages";
import { monthKey, refundCredit, reserveCredit } from "./usage";

// During the beta only Hindi and Kannada are offered; anything else falls back to Hindi.
const Language = z
  .string()
  .refine(isLanguageCode)
  .catch(BETA_DEFAULT_LANGUAGE)
  .transform((l) => (offeredLanguage(l) ? l : BETA_DEFAULT_LANGUAGE));

export type DemoReason = "signin" | "nokey";

/**
 * Every AI endpoint goes through this pipeline, cheapest checks first:
 *   1. validate the body            → 400
 *   2. signed out / no API key      → free sample answer
 *   3. per-user rate limit          → 429
 *   4. answer cache                 → cached answer, no model call, no credits
 *   5. daily spend circuit breaker  → 503
 *   (3-8 are runPaidAi, shared with the WhatsApp bot)
 *   6. reserve atomically (Founder Pass first, then credits) → 402 when the month's credits are used up
 *   7. call the routed model; refund the credits if it fails or refuses
 *   8. log tokens + cost, store in cache
 */
export type PaidAi<R> =
  | { ok: true; result: R; cached?: boolean; founderPass?: boolean }
  | { ok: false; status: number; error: string; upgrade?: boolean; detail?: string };

/**
 * Steps 3-8 of the pipeline for a signed-in user, shared by the website's AI endpoints and the WhatsApp bot so
 * both charge, limit, cache and log exactly the same way.
 */
export async function runPaidAi<R>(user: User, feature: Feature, input: unknown, run: () => Promise<AiResult<R>>): Promise<PaidAi<R>> {
  if (await overRateLimit(user.id)) return { ok: false, status: 429, error: "You're going a bit fast — wait a minute and try again." };

  const r = route(feature);
  const key = r.cacheHours > 0 ? cacheKey(user.id, feature, r.model, input) : null;
  if (key) {
    const hit = await readCache<R>(key);
    if (hit) return { ok: true, cached: true, result: hit };
  }

  if (await overDailyBudget()) return { ok: false, status: 503, error: "Mitra is taking a short break. Please try again in a few hours." };

  const month = monthKey();
  const pool = await reserveCredit(user, r.credits, feature);
  if (!pool) {
    if (BETA) return { ok: false, status: 402, error: "You've reached this month's beta limit. It resets on the 1st; tell us via Help & feedback if you need more." };
    return { ok: false, status: 402, error: "You've used all your AI credits for this month.", upgrade: true };
  }

  const started = Date.now();
  let out: AiResult<R>;
  try {
    out = await run();
  } catch (err) {
    await refundCredit(user.id, month, r.credits, pool);
    if (err instanceof AiRefusal) return { ok: false, status: 422, error: "Mitra can't help with that request." };
    const detail = describeError(err);
    console.error(`AI ${feature} failed: ${detail}`);
    // Problems with our own setup (bad key, no credit, rejected request) aren't the user's to retry.
    const ours = err instanceof Anthropic.APIError && [400, 401, 403, 404].includes(err.status ?? 0);
    const message = ours ? "Mitra's AI isn't available right now. We've been notified." : "Mitra is busy right now. Please try again in a moment.";
    return { ok: false, status: 502, error: message, ...(isAdmin(user) ? { detail } : {}) };
  }

  // Bookkeeping must never cost the user their answer.
  await Promise.all([
    logCall(user.id, feature, out.usage, Date.now() - started),
    key ? writeCache(key, user.id, feature, out.result, r.cacheHours) : null,
  ]).catch((err) => console.error("AI bookkeeping failed", err));

  return { ok: true, result: out.result, ...(pool === "founder" ? { founderPass: true } : {}) };
}

/**
 * AI that Mitra pays for itself (reports): no credits, but the same daily budget, and cost logging. Returns null
 * when AI is off, paused or failing, so the caller falls back to a plain report.
 */
export async function runFreeAi<R>(userId: string, feature: Feature, run: () => Promise<AiResult<R>>): Promise<R | null> {
  if (!aiConfigured() || (await overDailyBudget())) return null;
  const started = Date.now();
  try {
    const out = await run();
    await logCall(userId, feature, out.usage, Date.now() - started).catch(() => {});
    return out.result;
  } catch (err) {
    console.error(`AI ${feature} failed: ${describeError(err)}`);
    return null;
  }
}

export function aiRoute<B extends z.ZodRawShape, R>(
  feature: Feature,
  body: B,
  demo: R,
  run: (input: z.infer<z.ZodObject<B>> & { language: string }, user: User) => Promise<AiResult<R>>,
) {
  const schema = z.object({ ...body, language: Language });
  return async (request: Request) => {
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
    const input = parsed.data as z.infer<z.ZodObject<B>> & { language: string };

    const user = await currentUser();
    // Features on hold during the beta (admins can still test them).
    if (aiPaused(feature) && !isAdmin(user)) return Response.json({ error: "This feature is paused during the Mitra beta." }, { status: 404 });
    if (!user) return Response.json({ demo: true, demoReason: "signin" satisfies DemoReason, result: demo });
    if (!aiConfigured()) return Response.json({ demo: true, demoReason: "nokey" satisfies DemoReason, result: demo });

    const out = await runPaidAi(user, feature, input, () => run(input, user));
    if (!out.ok) {
      return Response.json({ error: out.error, ...(out.upgrade ? { upgrade: true } : {}), ...(out.detail ? { detail: out.detail } : {}) }, { status: out.status });
    }
    return Response.json({ demo: false, ...(out.cached ? { cached: true } : {}), result: out.result, ...(out.founderPass ? { founderPass: true } : {}) });
  };
}

/** One line for logs (and for admins): status, error type and message. Never includes the API key. */
function describeError(err: unknown): string {
  if (err instanceof Anthropic.APIError) {
    const type = (err.error as { error?: { type?: string } } | undefined)?.error?.type ?? err.name;
    return `Anthropic ${err.status ?? "network"} ${type}: ${err.message}`;
  }
  return err instanceof Error ? `${err.name}: ${err.message}` : String(err);
}
