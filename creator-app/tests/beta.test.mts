// Run with: npm test. The beta: Free allowance, paused features, languages, low-data rule and the metrics.
delete process.env.NEXT_PUBLIC_BETA;
delete process.env.FREE_CREDITS;
const { aiPaused, BETA, BETA_FREE_CREDITS, offeredLanguage } = await import("@/lib/beta");
const { creditLimit, PLANS } = await import("@/lib/plans");
const { isLowData } = await import("@/lib/retention");
const { computeBetaMetrics } = await import("@/lib/beta-metrics");
const assert = (c: unknown, m: string) => { if (!c) { console.error("FAIL", m); process.exit(1); } console.log("ok", m); };

assert(BETA, "the beta is on by default");
assert(creditLimit("free") === BETA_FREE_CREDITS, "Free accounts get the beta allowance");
assert(creditLimit("pro") === PLANS.pro.credits, "paid plans keep their own credits");
assert(aiPaused("chat") && aiPaused("trends") && !aiPaused("doctor") && !aiPaused("titles") && !aiPaused("thumbnail"), "only Video Doctor and Studio AI stay on");
assert(offeredLanguage("hi") && offeredLanguage("kn") && !offeredLanguage("te") && !offeredLanguage("hinglish"), "Hindi and Kannada only");

const curve = Array.from({ length: 100 }, (_, i) => ({ t: i / 100, watching: 1 - i / 200 }));
assert(isLowData(curve, 120) && isLowData([], 5000) && !isLowData(curve, 5000), "early read below 300 views or without a curve");

const DAY = 86_400_000;
const now = Date.UTC(2026, 11, 31);
const at = (daysAgo: number) => new Date(now - daysAgo * DAY);
const ev = (name: string, daysAgo: number, extra: Partial<{ userId: string | null; anonId: string | null; props: Record<string, unknown>; source: string | null }> = {}) => ({
  userId: null,
  anonId: null,
  props: {},
  source: null,
  ...extra,
  name,
  createdAt: at(daysAgo),
});
const events = [
  // Came from Instagram before signing in; the browser id joins the visit to the account.
  ev("landing_view", 70, { anonId: "abc12345", source: "dm-ig" }),
  ev("channel_connected", 69, { userId: "u1" }),
  ev("session_start", 69, { userId: "u1", anonId: "abc12345", source: "dm-ig" }),
  ev("doctor_run", 69, { userId: "u1", props: { language: "kn", lowData: false } }),
  ev("doctor_run", 60, { userId: "u1", props: { language: "kn", lowData: true } }),
  ev("session_start", 35, { userId: "u1" }),
  ev("output_feedback", 60, { userId: "u1", props: { language: "kn", natural: "translated", helpful: true } }),
  ev("result_shared", 20, { userId: "u1", props: { language: "kn", baselinePct: 38, afterPct: 44.5, uploadsMeasured: 4 } }),
  ev("wtp_survey", 59, { userId: "u1", props: { too_cheap: 49, cheap: 149, expensive: 299, too_expensive: 599 } }),
  // A second creator who never came back.
  ev("doctor_run", 65, { userId: "u2", source: "wa-blr", props: { language: "hi" } }),
];
const m = computeBetaMetrics(events, new Map([["u1", "earning"]]), now);
const ig = m.sources.find((s) => s.source === "dm-ig");
assert(ig?.connected === 1 && ig.activated === 1, `first-touch source survives sign-in (got ${JSON.stringify(m.sources)})`);
assert(m.retention[1].eligible === 2 && m.retention[1].returned === 1, "month-2 retention counts the creator who came back");
assert(m.repeat.twoDays === 1 && m.repeat.earlyReads === 1, "repeat use and early reads");
assert(m.language[0].translated === 1 && m.language[0].helpful === 1, "language ratings");
assert(m.solidResults === 1 && m.wtp[0].segment === "earning", "documented results and segmented price answers");
console.log("all beta tests passed");
process.exit(0);
