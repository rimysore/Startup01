"use client";

import { useState } from "react";
import { postAi, useDashboard, type AiError } from "./dashboard-context";
import { AiDemoNote, AiErrorNote, Button, Card, Spinner } from "./ui";
import type { SlangInsights } from "@/lib/ai";
import { languageLabel } from "@/lib/languages";
import { FEATURE_CREDITS } from "@/lib/plans";
import type { TrendItem } from "@/lib/trends";
import type { AudienceReport } from "@/lib/youtube";

const GEN = { genz: "Gen Z", millennial: "Millennial", everyone: "Everyone" } as const;
const FRESH = { rising: { label: "Rising", cls: "bg-good/15 text-good" }, steady: { label: "Steady", cls: "bg-surface-2 text-ink-2" }, fading: { label: "Fading", cls: "bg-bad/10 text-bad" } } as const;
const SOURCE = { comments: "Seen in your comments", trending: "Seen in trending titles", knowledge: "From Mitra's general knowledge — may be dated" } as const;

/** Builds a one-line audience description from the analytics: main age group, gender split, top cities. */
function describeAudience(report: AudienceReport | null): string {
  if (!report || !report.demographics.length) return "Age data not available yet; assume a broad 18-34 audience.";
  const byAge = new Map<string, number>();
  for (const d of report.demographics) byAge.set(d.ageGroup, (byAge.get(d.ageGroup) ?? 0) + d.percent);
  const ages = [...byAge.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([a, p]) => `${a.replace("age", "")} (${Math.round(p)}%)`);
  const cities = report.cities.slice(0, 3).map((c) => c.city);
  return `Main age groups: ${ages.join(", ")}.${cities.length ? ` Top cities: ${cities.join(", ")}.` : ""}`;
}

/** "How your viewers talk": slang by generation, grounded in trending titles and the channel's own comments. */
export function SlangCard({ report }: { report: AudienceReport | null }) {
  const { language, summary, refreshMe } = useDashboard();
  const [result, setResult] = useState<{ demo?: boolean; demoReason?: "signin" | "nokey"; data: SlangInsights; lang: string } | null>(null);
  const [error, setError] = useState<AiError | null>(null);
  const [running, setRunning] = useState(false);
  const [gen, setGen] = useState<"all" | "genz" | "millennial">("all");

  async function run() {
    setRunning(true);
    setError(null);
    const trends = (await fetch("/api/trends").then((r) => r.json()).catch(() => null)) as { videos?: TrendItem[] } | null;
    const all = trends?.videos ?? [];
    const mine = all.filter((v) => v.detected === language);
    const trending = (mine.length >= 5 ? mine : all).slice(0, 40).map((v) => v.title.slice(0, 200));
    const latest = summary?.mode === "live" ? summary.videos[0]?.id : undefined;
    const comments = latest
      ? ((await fetch(`/api/videos/${encodeURIComponent(latest)}/comments`).then((r) => r.json()).catch(() => null)) as { comments?: { text: string }[] } | null)?.comments ?? []
      : [];
    const res = await postAi<SlangInsights>("/api/ai/slang", {
      language,
      audience: describeAudience(report),
      trending,
      comments: comments.slice(0, 60).map((c) => c.text.slice(0, 300)),
    });
    setRunning(false);
    refreshMe();
    if (res.result) setResult({ demo: res.demo, demoReason: res.demoReason, data: res.result, lang: language });
    else setError(res.error ?? { message: "Something went wrong." });
  }

  const terms = result?.data.terms.filter((t) => gen === "all" || t.generation === gen || t.generation === "everyone") ?? [];

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">How your viewers talk</h2>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Current slang and catchphrases in {languageLabel(language)}, split by generation, taken from what your viewers write and what&apos;s trending. Use one in a
            title or hook to sound like them.
          </p>
        </div>
        <Button onClick={run} disabled={running}>
          {running ? "Listening…" : `Find their slang · ${FEATURE_CREDITS.slang} credit`}
        </Button>
      </div>
      {error && <div className="mt-4"><AiErrorNote error={error} /></div>}
      {running && <div className="mt-4"><Spinner label="Reading trending titles and your comments…" /></div>}
      {result && !running && (
        <div className="rise mt-5 space-y-5">
          {result.demo && <AiDemoNote reason={result.demoReason} what="slang list" />}
          <p className="rounded-xl bg-accent-soft px-4 py-3 font-indic text-sm text-ink">{result.data.shift}</p>
          <div className="flex gap-2" role="group" aria-label="Generation">
            {(["all", "genz", "millennial"] as const).map((g) => (
              <button key={g} onClick={() => setGen(g)} aria-pressed={gen === g} className={`rounded-full px-3 py-1 text-xs ${gen === g ? "bg-ink text-bg" : "bg-surface-2 text-ink-2"}`}>
                {g === "all" ? "All ages" : GEN[g]}
              </button>
            ))}
          </div>
          <ul className="grid gap-3 md:grid-cols-2">
            {terms.map((t) => (
              <li key={t.term} className="rounded-2xl border border-line p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-indic text-lg font-bold">{t.term}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${FRESH[t.freshness].cls}`}>{FRESH[t.freshness].label}</span>
                  <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-ink-2">{GEN[t.generation]}</span>
                </div>
                <p className="mt-1 font-indic text-sm text-ink-2">{t.meaning}</p>
                <button
                  onClick={() => navigator.clipboard?.writeText(t.example)}
                  className="mt-2 w-full rounded-xl bg-surface-2 px-3 py-2 text-left font-indic text-sm hover:ring-1 hover:ring-accent"
                  title="Copy"
                >
                  “{t.example}”
                </button>
                <p className="mt-1.5 text-[11px] text-muted">{SOURCE[t.source]}</p>
              </li>
            ))}
          </ul>
          {result.data.avoid.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Sounds dated now</h3>
              <ul className="flex flex-wrap gap-2">
                {result.data.avoid.map((a) => (
                  <li key={a.term} className="rounded-full bg-bad/10 px-3 py-1.5 font-indic text-sm text-bad" title={a.why}>
                    <s>{a.term}</s> <span className="text-xs opacity-80">— {a.why}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <ul className="list-disc space-y-1 pl-5 font-indic text-sm text-ink-2">{result.data.tips.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
      )}
    </Card>
  );
}
