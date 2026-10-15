import { desc, gte, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { currentUser, isAdmin } from "@/lib/auth";

/** Admins only (ADMIN_EMAILS, comma-separated): AI spend for the last N days, by feature and model. */
export async function GET(request: Request) {
  const user = await currentUser();
  if (!isAdmin(user)) return Response.json({ error: "Not found" }, { status: 404 });

  const days = Math.min(90, Math.max(1, Number(new URL(request.url).searchParams.get("days")) || 30));
  const since = new Date(Date.now() - days * 86_400_000);
  const c = schema.aiCalls;
  const rows = await (await db())
    .select({
      feature: c.feature,
      model: c.model,
      calls: sql<number>`count(*)::int`,
      inputTokens: sql<number>`sum(${c.inputTokens})::bigint`,
      outputTokens: sql<number>`sum(${c.outputTokens})::bigint`,
      costMicros: sql<number>`sum(${c.costMicros})::bigint`,
      avgLatencyMs: sql<number>`avg(${c.latencyMs})::int`,
      users: sql<number>`count(distinct ${c.userId})::int`,
    })
    .from(c)
    .where(gte(c.createdAt, since))
    .groupBy(c.feature, c.model);

  const recent = await (await db())
    .select({
      feature: c.feature,
      model: c.model,
      inputTokens: c.inputTokens,
      outputTokens: c.outputTokens,
      costMicros: c.costMicros,
      latencyMs: c.latencyMs,
      createdAt: c.createdAt,
    })
    .from(c)
    .where(gte(c.createdAt, since))
    .orderBy(desc(c.createdAt))
    .limit(25);

  const byRoute = rows.map((r) => {
    const usd = Number(r.costMicros) / 1e6;
    const inputTokens = Number(r.inputTokens);
    const outputTokens = Number(r.outputTokens);
    return {
      ...r,
      inputTokens,
      outputTokens,
      avgInputTokens: Math.round(inputTokens / r.calls),
      avgOutputTokens: Math.round(outputTokens / r.calls),
      costUsd: +usd.toFixed(4),
      usdPerCall: +(usd / r.calls).toFixed(5),
    };
  });
  const totalUsd = byRoute.reduce((a, r) => a + r.costUsd, 0);
  return Response.json({
    days,
    totalUsd: +totalUsd.toFixed(4),
    dailyBudgetUsd: Number(process.env.AI_DAILY_BUDGET_USD) || null,
    byRoute: byRoute.sort((a, b) => b.costUsd - a.costUsd),
    recent: recent.map((r) => ({ ...r, costUsd: r.costMicros / 1e6 })),
  });
}
