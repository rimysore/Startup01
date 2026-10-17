"use client";

import { useEffect, useState } from "react";
import { postAi, useDashboard, type AiError } from "@/components/dashboard-context";
import { BarList, EmotionBars } from "@/components/insights";
import { AiDemoNote, AiErrorNote, Button, Card, DemoNote, ErrorNote, PageHeader, Spinner } from "@/components/ui";
import type { CompetitorInsights } from "@/lib/ai";
import type { ChannelMetrics } from "@/lib/competitors";
import { compact } from "@/lib/format";
import { languageLabel } from "@/lib/languages";
import { FEATURE_CREDITS } from "@/lib/plans";
import type { ChannelSnapshot } from "@/lib/youtube";

type Row = ChannelSnapshot & { metrics: ChannelMetrics; missing?: undefined };
interface Res {
  mode: "live" | "demo";
  me: Row;
  rivals: (Row | { id: string; title: string; missing: true })[];
  error?: string;
}

/** Each row: label, how to read a value, and whether higher is better (null = no "best"). */
const METRICS: { label: string; get: (c: Row) => number | null; fmt: (n: number) => string; higher: boolean | null; hint?: string }[] = [
  { label: "Subscribers", get: (c) => c.subscribers, fmt: compact, higher: true },
  { label: "Avg views (last 15)", get: (c) => c.metrics.avgViews, fmt: compact, higher: true },
  { label: "Median views", get: (c) => c.metrics.medianViews, fmt: compact, higher: true, hint: "Less skewed by one viral hit" },
  { label: "Views per subscriber", get: (c) => c.metrics.viewsPerSub, fmt: (n) => `${n}%`, higher: true, hint: "How much of the audience shows up" },
  { label: "Uploads per week", get: (c) => c.metrics.uploadsPerWeek, fmt: (n) => String(n), higher: true },
  { label: "Short-form share", get: (c) => c.metrics.shortsShare, fmt: (n) => `${n}%`, higher: null, hint: "Videos 3 minutes or shorter" },
  { label: "Avg long video", get: (c) => c.metrics.avgLongMinutes, fmt: (n) => `${n} min`, higher: null },
  { label: "Engagement", get: (c) => c.metrics.engagement, fmt: (n) => `${n}%`, higher: true, hint: "(Likes + comments) ÷ views" },
  { label: "Title length", get: (c) => c.metrics.titleChars, fmt: (n) => `${n} chars`, higher: null },
  { label: "Titles with numbers", get: (c) => c.metrics.titlesWithNumbers, fmt: (n) => `${n}%`, higher: null },
];

export default function CompetitorsPage() {
  const { language, refreshMe } = useDashboard();
  const [data, setData] = useState<Res | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [insights, setInsights] = useState<{ demo?: boolean; demoReason?: "signin" | "nokey"; data: CompetitorInsights } | null>(null);
  const [error, setError] = useState<AiError | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let live = true;
    fetch("/api/competitors", { cache: "no-store" })
      .then(async (r) => ({ ok: r.ok, body: (await r.json()) as Res }))
      .then(({ ok, body }) => live && (ok ? (setData(body), setFailed(null)) : setFailed(body.error ?? "Couldn't load channels.")))
      .catch(() => live && setFailed("Couldn't load channels."));
    return () => {
      live = false;
    };
  }, [version]);

  async function add() {
    setAdding(true);
    setAddError(null);
    const res = await fetch("/api/competitors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input }) });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    setAdding(false);
    if (!res.ok) return setAddError(body.error ?? "Couldn't add that channel.");
    setInput("");
    setInsights(null);
    setVersion((v) => v + 1);
  }

  async function remove(id: string) {
    await fetch(`/api/competitors?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setInsights(null);
    setVersion((v) => v + 1);
  }

  const channels: Row[] = data ? [data.me, ...data.rivals.filter((r): r is Row => !r.missing)] : [];

  async function compare() {
    setRunning(true);
    setError(null);
    const res = await postAi<CompetitorInsights>("/api/ai/competitors", {
      language,
      channels: channels.map((c, i) => ({
        name: c.title,
        you: i === 0,
        subscribers: c.subscribers,
        stats: METRICS.slice(1)
          .map((m) => {
            const v = m.get(c);
            return v == null ? null : `${m.label}: ${m.fmt(v)}`;
          })
          .filter(Boolean)
          .join("; "),
        titles: c.recent.slice(0, 15).map((v) => ({ title: v.title, views: v.views, minutes: Math.round(v.durationSec / 6) / 10 })),
      })),
    });
    setRunning(false);
    refreshMe();
    if (res.result) setInsights({ demo: res.demo, demoReason: res.demoReason, data: res.result });
    else setError(res.error ?? { message: "Something went wrong." });
  }

  return (
    <div className="rise">
      <PageHeader eyebrow="Competitors" title="Channels like yours, and what's working for them." />
      {data?.mode === "demo" && (
        <div className="mb-4">
          <DemoNote>Sample channels. Connect YouTube, then add up to 5 channels you compete with.</DemoNote>
        </div>
      )}
      {(failed || data?.error) && <div className="mb-4"><ErrorNote>{failed ?? data?.error}</ErrorNote></div>}

      <Card className="mb-6">
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void add();
          }}
        >
          <label className="flex min-w-[240px] flex-1 flex-col gap-1 text-xs font-medium text-muted">
            Add a channel to compare
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="youtube.com/@channel or @handle"
              className="rounded-xl border border-line bg-surface px-3 py-2.5 text-base text-ink outline-none focus:border-accent"
            />
          </label>
          <Button type="submit" disabled={adding || input.trim().length < 3 || data?.mode !== "live"}>
            {adding ? "Adding…" : "Add"}
          </Button>
        </form>
        {addError && <p className="mt-2 text-sm text-bad">{addError}</p>}
        {data && data.rivals.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {data.rivals.map((r) => (
              <span key={r.id} className="inline-flex items-center gap-2 rounded-full border border-line py-1 pl-3 pr-1.5 text-sm">
                {r.title}
                {"missing" in r && r.missing && <span className="text-xs text-bad">unavailable</span>}
                {data.mode === "live" && (
                  <button onClick={() => remove(r.id)} className="grid h-6 w-6 place-items-center rounded-full hover:bg-surface-2" aria-label={`Remove ${r.title}`}>
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
      </Card>

      {!data && !failed && <Card><Spinner label="Loading channels" /></Card>}

      {data && channels.length < 2 && data.mode === "live" && (
        <Card className="grain py-12 text-center">
          <p className="font-display text-xl">Add your first competitor</p>
          <p className="mt-2 text-sm text-muted">Pick 2–5 channels in your niche and language. Mitra compares their last 15 uploads with yours.</p>
        </Card>
      )}

      {channels.length >= 2 && (
        <div className="space-y-6">
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="text-xs text-muted">
                    <th className="py-2 pr-4 font-medium" />
                    {channels.map((c, i) => (
                      <th key={c.id} className={`py-2 pr-4 font-semibold ${i === 0 ? "text-accent" : "text-ink"}`}>
                        {i === 0 ? `You · ${c.title}` : c.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {METRICS.map((m) => {
                    const values = channels.map((c) => m.get(c));
                    const nums = values.filter((v): v is number => v != null);
                    const best = m.higher == null || nums.length < 2 ? null : m.higher ? Math.max(...nums) : Math.min(...nums);
                    return (
                      <tr key={m.label}>
                        <td className="py-2.5 pr-4 text-ink-2" title={m.hint}>
                          {m.label}
                          {m.hint && <span className="ml-1 text-xs text-muted">ⓘ</span>}
                        </td>
                        {values.map((v, i) => (
                          <td key={channels[i].id} className={`py-2.5 pr-4 tabular-nums ${v != null && v === best ? "font-semibold text-good" : ""} ${i === 0 ? "bg-accent-soft/40" : ""}`}>
                            {v == null ? "—" : m.fmt(v)}
                            {v != null && v === best && " 🏆"}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="mb-4 font-semibold">Average views per recent video</h2>
              <BarList rows={channels.map((c, i) => ({ label: i === 0 ? `You · ${c.title}` : c.title, value: c.metrics.avgViews }))} format={compact} />
            </Card>
            <Card>
              <h2 className="mb-4 font-semibold">Each channel&apos;s best recent video</h2>
              <ul className="space-y-3">
                {channels.map((c, i) => (
                  <li key={c.id} className="text-sm">
                    <p className="text-xs text-muted">{i === 0 ? "You" : c.title}</p>
                    <p className="font-indic font-medium">{c.metrics.topVideo?.title ?? "—"}</p>
                    {c.metrics.topVideo && <p className="text-xs text-good">{compact(c.metrics.topVideo.views)} views</p>}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card className="border-accent/25 bg-accent-soft/30">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-accent">Mitra&apos;s comparison</p>
                <p className="mt-2 max-w-xl text-sm text-ink-2">What they do better, the gaps you can own, why their titles work and five moves for this month, in {languageLabel(language)}.</p>
              </div>
              <Button onClick={compare} disabled={running}>
                {running ? "Comparing…" : `Compare with Mitra · ${FEATURE_CREDITS.competitors} credit`}
              </Button>
            </div>
          </Card>
          {error && <AiErrorNote error={error} />}
          {running && <Card><Spinner label="Mitra is studying the channels…" /></Card>}
          {insights && !running && (
            <div className="rise space-y-4">
              {insights.demo && <AiDemoNote reason={insights.demoReason} what="comparison" />}
              <Card>
                <p className="font-display text-lg leading-snug">{insights.data.verdict}</p>
              </Card>
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">What they do better</h3>
                  <ul className="space-y-3">
                    {insights.data.theyDoBetter.map((t) => (
                      <li key={t.channel + t.what} className="font-indic text-sm">
                        <span className="font-semibold">{t.channel}:</span> {t.what}
                        <p className="text-xs text-muted">{t.evidence}</p>
                      </li>
                    ))}
                  </ul>
                </Card>
                <Card>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Gaps you can own</h3>
                  <ul className="space-y-3">
                    {insights.data.gaps.map((g) => (
                      <li key={g.idea} className="font-indic text-sm">
                        <span className="font-semibold">💡 {g.idea}</span>
                        <p className="text-xs text-muted">{g.why}</p>
                      </li>
                    ))}
                  </ul>
                </Card>
                <Card>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Why their titles work</h3>
                  <ul className="list-disc space-y-1 pl-5 font-indic text-sm">{insights.data.titlePatterns.map((t) => <li key={t}>{t}</li>)}</ul>
                  <h3 className="mb-3 mt-5 text-xs font-semibold uppercase tracking-wider text-muted">Emotions they lean on</h3>
                  <EmotionBars emotions={insights.data.emotions} />
                </Card>
                <Card>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Your moves this month</h3>
                  <ol className="list-decimal space-y-2 pl-5 font-indic text-sm">{insights.data.moves.map((m) => <li key={m}>{m}</li>)}</ol>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
