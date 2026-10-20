import { db, schema } from "@/db";
import { SPRINT_UPLOADS } from "./beta";

const DAY = 86_400_000;

export interface BetaEventRow {
  userId: string | null;
  anonId: string | null;
  name: string;
  props: Record<string, unknown>;
  source: string | null;
  createdAt: Date;
}

export interface BetaMetrics {
  from: string | null;
  to: string | null;
  events: number;
  sources: { source: string; visitors: number; connected: number; activated: number }[];
  retention: { window: string; eligible: number; returned: number }[];
  repeat: { creators: number; twoDays: number; twoWeeks: number; medianRuns: number | null; sprints: number; earlyReads: number };
  segments: { segment: string; creators: number; activated: number }[];
  language: { language: string; ratings: number; natural: number; okay: number; translated: number; helpful: number; helpfulAnswers: number }[];
  results: { at: string; language: string | null; baselinePct: number; afterPct: number; uploads: number; named: string | null }[];
  solidResults: number;
  wtp: { too_cheap: number; cheap: number; expensive: number; too_expensive: number; segment: string | null }[];
  benchmark: { group: string; channels: number; medianPct: number | null }[];
}

const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

/**
 * Turns the event log into the numbers the board asked for before any seed conversation. Pure, so it's tested
 * without a database. `segments` maps a user to their interview answer (earning / manager / starting).
 */
export function computeBetaMetrics(events: BetaEventRow[], segmentOf: Map<string, string>, now = Date.now()): BetaMetrics {
  const rows = [...events].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  // A person is an account; visits before sign-in are joined to it through the browser id they share.
  const userOfAnon = new Map<string, string>();
  for (const e of rows) if (e.userId && e.anonId && !userOfAnon.has(e.anonId)) userOfAnon.set(e.anonId, e.userId);
  const person = (e: BetaEventRow) => e.userId ?? (e.anonId ? (userOfAnon.get(e.anonId) ?? `anon:${e.anonId}`) : null);

  const sourceOf = new Map<string, string>();
  for (const e of rows) {
    const p = person(e);
    if (p && e.source && !sourceOf.has(p)) sourceOf.set(p, e.source);
  }
  const src = (p: string) => sourceOf.get(p) ?? "unknown";

  const visitors = new Set<string>();
  const connected = new Map<string, number>();
  const activated = new Map<string, number>();
  const runs = new Map<string, number[]>();
  const activeDays = new Map<string, Set<number>>();
  for (const e of rows) {
    const p = person(e);
    if (!p) continue;
    const t = e.createdAt.getTime();
    visitors.add(p);
    if (e.name === "channel_connected" && !connected.has(p)) connected.set(p, t);
    if (e.name === "doctor_run") {
      if (!activated.has(p)) activated.set(p, t);
      runs.set(p, [...(runs.get(p) ?? []), t]);
    }
    if (!p.startsWith("anon:") && e.name !== "landing_view" && e.name !== "signup_click") {
      if (!activeDays.has(p)) activeDays.set(p, new Set());
      activeDays.get(p)!.add(Math.floor(t / DAY));
    }
  }

  const allSources = [...new Set([...visitors].map(src))].sort();
  const sources = allSources.map((s) => ({
    source: s,
    visitors: [...visitors].filter((p) => src(p) === s).length,
    connected: [...connected.keys()].filter((p) => src(p) === s).length,
    activated: [...activated.keys()].filter((p) => src(p) === s).length,
  }));

  const windowed = (label: string, from: number, to: number) => {
    const eligible = [...activated.entries()].filter(([, at]) => now - at >= to * DAY);
    const returned = eligible.filter(([p, at]) => [...(activeDays.get(p) ?? [])].some((d) => d * DAY >= at + from * DAY && d * DAY < at + to * DAY));
    return { window: label, eligible: eligible.length, returned: returned.length };
  };

  const runLists = [...runs.values()];
  const distinct = (ts: number[], size: number) => new Set(ts.map((t) => Math.floor(t / size))).size;

  const segCounts = new Map<string, { creators: number; activated: number }>();
  for (const [userId, seg] of segmentOf) {
    const c = segCounts.get(seg) ?? { creators: 0, activated: 0 };
    c.creators++;
    if (activated.has(userId)) c.activated++;
    segCounts.set(seg, c);
  }

  const feedback = rows.filter((e) => e.name === "output_feedback");
  const langs = [...new Set(feedback.map((e) => String(e.props.language ?? "?")))];
  const language = langs.map((l) => {
    const f = feedback.filter((e) => String(e.props.language ?? "?") === l);
    const rated = f.filter((e) => e.props.natural);
    const helpfulAnswers = f.filter((e) => typeof e.props.helpful === "boolean");
    return {
      language: l,
      ratings: rated.length,
      natural: rated.filter((e) => e.props.natural === "natural").length,
      okay: rated.filter((e) => e.props.natural === "okay").length,
      translated: rated.filter((e) => e.props.natural === "translated").length,
      helpful: helpfulAnswers.filter((e) => e.props.helpful === true).length,
      helpfulAnswers: helpfulAnswers.length,
    };
  });

  const results = rows
    .filter((e) => e.name === "result_shared" && num(e.props.baselinePct) != null && num(e.props.afterPct) != null)
    .map((e) => ({
      at: e.createdAt.toISOString(),
      language: typeof e.props.language === "string" ? e.props.language : null,
      baselinePct: num(e.props.baselinePct)!,
      afterPct: num(e.props.afterPct)!,
      uploads: num(e.props.uploadsMeasured) ?? 0,
      named: typeof e.props.channelName === "string" ? `${e.props.channelName} ${e.props.channelHandle ?? ""}`.trim() : null,
    }));

  const wtp = rows
    .filter((e) => e.name === "wtp_survey")
    .map((e) => {
      const p = person(e);
      return {
        too_cheap: num(e.props.too_cheap) ?? 0,
        cheap: num(e.props.cheap) ?? 0,
        expensive: num(e.props.expensive) ?? 0,
        too_expensive: num(e.props.too_expensive) ?? 0,
        segment: p ? (segmentOf.get(p) ?? null) : null,
      };
    });

  const groups = new Map<string, { channels: Set<string>; pct: number[] }>();
  for (const e of rows.filter((x) => x.name === "benchmark_sample")) {
    const p = person(e);
    const k = `${e.props.language} · ${e.props.size} subs · ${e.props.length}`;
    const g = groups.get(k) ?? { channels: new Set<string>(), pct: [] };
    if (p) g.channels.add(p);
    const v = num(e.props.avgViewPct);
    if (v != null) g.pct.push(v);
    groups.set(k, g);
  }

  return {
    from: rows[0]?.createdAt.toISOString() ?? null,
    to: rows.at(-1)?.createdAt.toISOString() ?? null,
    events: rows.length,
    sources,
    retention: [windowed("Week 2 (days 7–13)", 7, 14), windowed("Month 2 (days 30–59)", 30, 60), windowed("Month 3 (days 60–89)", 60, 90)],
    repeat: {
      creators: runLists.length,
      twoDays: runLists.filter((t) => distinct(t, DAY) >= 2).length,
      twoWeeks: runLists.filter((t) => distinct(t, 7 * DAY) >= 2).length,
      medianRuns: median(runLists.map((t) => t.length)),
      sprints: rows.filter((e) => e.name === "fix_committed").length,
      earlyReads: rows.filter((e) => e.name === "doctor_run" && e.props.lowData === true).length,
    },
    segments: [...segCounts.entries()].map(([segment, c]) => ({ segment, ...c })),
    language,
    results,
    solidResults: results.filter((r) => r.uploads >= SPRINT_UPLOADS && r.afterPct > r.baselinePct).length,
    wtp,
    benchmark: [...groups.entries()].map(([group, g]) => ({ group, channels: g.channels.size, medianPct: median(g.pct) })),
  };
}

/** Loads every beta event and the interview segments, and computes the metrics. */
export async function loadBetaMetrics(): Promise<BetaMetrics> {
  const d = await db();
  const [events, interviews] = await Promise.all([
    d
      .select({
        userId: schema.betaEvents.userId,
        anonId: schema.betaEvents.anonId,
        name: schema.betaEvents.name,
        props: schema.betaEvents.props,
        source: schema.betaEvents.source,
        createdAt: schema.betaEvents.createdAt,
      })
      .from(schema.betaEvents),
    d.select({ userId: schema.creatorInterviews.userId, answers: schema.creatorInterviews.answers }).from(schema.creatorInterviews),
  ]);
  const segments = new Map<string, string>();
  for (const i of interviews) if (typeof i.answers.who === "string") segments.set(i.userId, i.answers.who);
  return computeBetaMetrics(events, segments);
}

/** Every rated AI answer, newest first, for the weekly native-speaker review. */
export async function loadLanguageReviews(): Promise<{ at: string; props: Record<string, unknown> }[]> {
  const rows = await (await db()).select({ name: schema.betaEvents.name, props: schema.betaEvents.props, createdAt: schema.betaEvents.createdAt }).from(schema.betaEvents);
  return rows
    .filter((r) => r.name === "output_feedback")
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((r) => ({ at: r.createdAt.toISOString(), props: r.props }));
}
