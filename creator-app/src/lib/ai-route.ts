import { z } from "zod";
import { AiRefusal, aiConfigured, route, type AiResult, type Feature } from "./ai";
import { cacheKey, logCall, overDailyBudget, overRateLimit, readCache, writeCache } from "./ai-guard";
import { currentUser } from "./auth";
import { isLanguageCode } from "./languages";
import { monthKey, refundCredit, reserveCredit } from "./usage";

const Language = z.string().refine(isLanguageCode).catch("hinglish");

export type DemoReason = "signin" | "nokey";

/**
 * Every AI endpoint goes through this pipeline, cheapest checks first:
 *   1. validate the body            → 400
 *   2. signed out / no API key      → free sample answer
 *   3. per-user rate limit          → 429
 *   4. answer cache                 → cached answer, no model call, no credits
 *   5. daily spend circuit breaker  → 503
 *   6. reserve credits atomically   → 402 when the month's credits are used up
 *   7. call the routed model; refund the credits if it fails or refuses
 *   8. log tokens + cost, store in cache
 */
export function aiRoute<B extends z.ZodRawShape, R>(
  feature: Feature,
  body: B,
  demo: R,
  run: (input: z.infer<z.ZodObject<B>> & { language: string }) => Promise<AiResult<R>>,
) {
  const schema = z.object({ ...body, language: Language });
  return async (request: Request) => {
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
    const input = parsed.data as z.infer<z.ZodObject<B>> & { language: string };

    const user = await currentUser();
    if (!user) return Response.json({ demo: true, demoReason: "signin" satisfies DemoReason, result: demo });
    if (!aiConfigured()) return Response.json({ demo: true, demoReason: "nokey" satisfies DemoReason, result: demo });

    if (await overRateLimit(user.id)) {
      return Response.json({ error: "You're going a bit fast — wait a minute and try again." }, { status: 429 });
    }

    const r = route(feature);
    const key = r.cacheHours > 0 ? cacheKey(user.id, feature, r.model, input) : null;
    if (key) {
      const hit = await readCache<R>(key);
      if (hit) return Response.json({ demo: false, cached: true, result: hit });
    }

    if (await overDailyBudget()) {
      return Response.json({ error: "Mitra is taking a short break. Please try again in a few hours." }, { status: 503 });
    }

    const month = monthKey();
    if (!(await reserveCredit(user, r.credits))) {
      return Response.json({ error: "You've used all your AI credits for this month.", upgrade: true }, { status: 402 });
    }

    const started = Date.now();
    let out: AiResult<R>;
    try {
      out = await run(input);
    } catch (err) {
      await refundCredit(user.id, month, r.credits);
      if (err instanceof AiRefusal) return Response.json({ error: "Mitra can't help with that request." }, { status: 422 });
      console.error(err);
      return Response.json({ error: "Mitra is busy right now. Please try again in a moment." }, { status: 502 });
    }

    // Bookkeeping must never cost the user their answer.
    await Promise.all([
      logCall(user.id, feature, out.usage, Date.now() - started),
      key ? writeCache(key, user.id, feature, out.result, r.cacheHours) : null,
    ]).catch((err) => console.error("AI bookkeeping failed", err));

    return Response.json({ demo: false, result: out.result });
  };
}
