"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { postAi, useDashboard, type AiError } from "@/components/dashboard-context";
import { EMOTION_STYLE, EmotionBars } from "@/components/insights";
import { AiDemoNote, AiErrorNote, Button, Card, DemoNote, ErrorNote, PageHeader, Spinner } from "@/components/ui";
import type { TrendInsights } from "@/lib/ai";
import { compact } from "@/lib/format";
import { LANGUAGES, languageLabel } from "@/lib/languages";
import { FEATURE_CREDITS } from "@/lib/plans";
import type { TrendItem } from "@/lib/trends";

interface TrendsResponse {
  mode: "live" | "demo";
  region: string;
  fetchedAt?: number;
  videos: TrendItem[];
  error?: string;
}

const ALL = "all";

export default function TrendsPage() {
  const { language, summary, refreshMe } = useDashboard();
  const [picked, setPicked] = useState<string | null>(null);
  const lang = picked ?? language;
  const [category, setCategory] = useState(ALL);
  const [data, setData] = useState<TrendsResponse | null>(null);
  const [version, setVersion] = useState({ n: 0, force: false });
  const [insights, setInsights] = useState<{ key: string; demo?: boolean; demoReason?: "signin" | "nokey"; data: TrendInsights } | null>(null);
  const [error, setError] = useState<AiError | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(`/api/trends${version.force ? "?refresh=1" : ""}`, { cache: "no-store" })
      .then((r) => r.json() as Promise<TrendsResponse>)
      .then((d) => live && setData(d))
      .catch(() => live && setData(null));
    return () => {
      live = false;
    };
  }, [version]);

  const inLanguage = (data?.videos ?? []).filter((v) => lang === ALL || v.detected === lang);
  const categories = [ALL, ...new Set(inLanguage.map((v) => v.category))];
  const shown = inLanguage.filter((v) => category === ALL || v.category === category).sort((a, b) => b.velocity - a.velocity);
  const counts = new Map<string, number>();
  for (const v of data?.videos ?? []) if (v.detected) counts.set(v.detected, (counts.get(v.detected) ?? 0) + 1);
  const key = `${lang}:${category}:${data?.fetchedAt ?? "demo"}`;

  async function analyse() {
    setRunning(true);
    setError(null);
    const channel = summary ? `${summary.channel.title}\n${summary.videos.slice(0, 10).map((v) => `- ${v.title}`).join("\n")}` : "";
    const res = await postAi<TrendInsights>("/api/ai/trends", {
      language,
      channel,
      videos: shown.slice(0, 40).map((v) => ({ title: v.title, channel: v.channelTitle, category: v.category, views: v.views, velocity: v.velocity })),
    });
    setRunning(false);
    refreshMe();
    if (res.result) setInsights({ key, demo: res.demo, demoReason: res.demoReason, data: res.result });
    else setError(res.error ?? { message: "Something went wrong." });
  }

  const current = insights?.key === key ? insights : null;

  return (
    <div className="rise">
      <PageHeader eyebrow="Trend Radar" title="What's trending on YouTube in India, by language.">
        <div className="flex items-center gap-3">
          {data?.fetchedAt && (
            <span className="text-xs text-muted">Updated {new Date(data.fetchedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
          )}
          {data?.mode === "live" && (
            <Button variant="ghost" onClick={() => setVersion((v) => ({ n: v.n + 1, force: true }))}>
              Refresh
            </Button>
          )}
        </div>
      </PageHeader>

      {data?.mode === "demo" && !data.error && (
        <div className="mb-4">
          <DemoNote>Sample trends. Connect YouTube to see the live Trending chart for India, sorted by language.</DemoNote>
        </div>
      )}
      {data?.error && <div className="mb-4"><ErrorNote>{data.error}</ErrorNote></div>}

      <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Language">
        {[{ code: ALL, native: "All languages" }, ...LANGUAGES].map((l) => {
          const n = l.code === ALL ? data?.videos.length ?? 0 : counts.get(l.code) ?? 0;
          return (
            <button
              key={l.code}
              onClick={() => (setPicked(l.code), setCategory(ALL))}
              aria-pressed={lang === l.code}
              className={`rounded-full border px-3.5 py-1.5 font-indic text-sm ${lang === l.code ? "border-ink bg-ink text-bg" : "border-line text-ink-2 hover:bg-surface-2"}`}
            >
              {l.native} <span className="opacity-60">{n}</span>
            </button>
          );
        })}
      </div>
      {categories.length > 2 && (
        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Category">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={`rounded-full px-3 py-1 text-xs ${category === c ? "bg-accent text-accent-ink" : "bg-surface-2 text-ink-2"}`}
            >
              {c === ALL ? "All categories" : c}
            </button>
          ))}
        </div>
      )}

      {!data && <Card><Spinner label="Loading trends" /></Card>}

      {data && (
        <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <Card>
            <h2 className="mb-1 font-semibold">
              Trending in {lang === ALL ? "all languages" : languageLabel(lang)} · India
            </h2>
            <p className="mb-4 text-xs text-muted">Sorted by views per hour since upload. Language is read from each title&apos;s script and YouTube&apos;s audio language.</p>
            {!shown.length ? (
              <p className="py-6 text-sm text-muted">
                Nothing in {languageLabel(lang)} in India&apos;s top 100 right now. YouTube&apos;s chart is country-wide, so smaller languages appear less often. Try All
                languages, or check back after a big release or festival.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {shown.slice(0, 25).map((v) => (
                  <li key={v.id} className="flex gap-3 py-3">
                    {v.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element -- YouTube thumbnail
                      <img src={v.thumbnail} alt="" className="h-16 w-28 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <div className="h-16 w-28 shrink-0 rounded-lg bg-surface-2" />
                    )}
                    <div className="min-w-0 flex-1">
                      <a href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noreferrer" className="line-clamp-2 font-indic text-sm font-medium hover:underline">
                        {v.title}
                      </a>
                      <p className="mt-1 text-xs text-muted">
                        {v.channelTitle} · {v.category} · {compact(v.views)} views · <span className="font-semibold text-good">{compact(v.velocity)}/hr</span>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div className="space-y-4">
            <Card className="border-accent/25 bg-accent-soft/30">
              <p className="text-sm font-semibold text-accent">Mitra&apos;s read</p>
              <p className="mt-2 text-sm text-ink-2">
                Topics, emotions, places and formats behind these trends, turned into ideas for your channel, in {languageLabel(language)}.
              </p>
              <Button className="mt-4" onClick={analyse} disabled={running || !shown.length}>
                {running ? "Reading the trends…" : `Analyse with Mitra · ${FEATURE_CREDITS.trends} credit`}
              </Button>
            </Card>
            {error && <AiErrorNote error={error} />}
            {running && <Card><Spinner label="Mitra is reading the trends…" /></Card>}
            {current && !running && (
              <div className="rise space-y-4">
                {current.demo && <AiDemoNote reason={current.demoReason} what="trend analysis" />}
                <Card>
                  <p className="font-indic text-sm leading-relaxed">{current.data.summary}</p>
                  <h3 className="mb-3 mt-5 text-xs font-semibold uppercase tracking-wider text-muted">Emotions driving views</h3>
                  <EmotionBars emotions={current.data.emotions} />
                </Card>
                {current.data.topics.map((t) => (
                  <Card key={t.topic}>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="rounded-full px-2.5 py-1 font-semibold text-white" style={{ background: EMOTION_STYLE[t.emotion].color }}>
                        {EMOTION_STYLE[t.emotion].emoji} {EMOTION_STYLE[t.emotion].label}
                      </span>
                    </div>
                    <h3 className="mt-2 font-indic font-semibold">{t.topic}</h3>
                    <p className="mt-1 font-indic text-sm text-ink-2">{t.why}</p>
                    <p className="mt-2 font-indic text-sm"><span className="font-semibold">Your angle: </span>{t.angle}</p>
                    <Link href={`/dashboard/studio?topic=${encodeURIComponent(t.angle)}`} className="mt-3 inline-block text-sm font-semibold text-accent hover:underline">
                      Package this idea →
                    </Link>
                  </Card>
                ))}
                {current.data.regional.length > 0 && (
                  <Card>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Places & events</h3>
                    <ul className="list-disc space-y-1 pl-5 font-indic text-sm">{current.data.regional.map((r) => <li key={r}>{r}</li>)}</ul>
                    <h3 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider text-muted">Formats that work</h3>
                    <ul className="list-disc space-y-1 pl-5 font-indic text-sm">{current.data.formats.map((r) => <li key={r}>{r}</li>)}</ul>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
