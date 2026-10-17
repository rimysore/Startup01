"use client";

import { useEffect, useState } from "react";
import { postAi, useDashboard, useQueryParam, type AiError } from "@/components/dashboard-context";
import { audienceRows, BarList } from "@/components/insights";
import type { AudienceReport } from "@/lib/youtube";
import { LineChart } from "@/components/LineChart";
import { AiDemoNote, AiErrorNote, Button, Card, DemoNote, PageHeader, Spinner } from "@/components/ui";
import { OutlierBadge } from "@/components/outlier";
import { VideoThumb } from "@/components/VideoThumb";
import type { Doctor } from "@/lib/ai";
import { compact } from "@/lib/format";
import { outlierScores } from "@/lib/outliers";
import { FEATURE_CREDITS } from "@/lib/plans";
import { fmtTime, introDrop, keyMoments } from "@/lib/retention";
import type { RetentionPoint } from "@/lib/types";

interface RetentionRes {
  mode: string;
  points: RetentionPoint[];
  benchmark: RetentionPoint[];
  error?: string;
}

function ScoreRing({ score }: { score: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const s = Math.max(0, Math.min(100, score));
  const color = s >= 70 ? "var(--good)" : s >= 45 ? "var(--warn)" : "var(--bad)";
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" role="img" aria-label={`Health score ${s} out of 100`}>
      <circle cx="44" cy="44" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="8" />
      <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(s / 100) * c} ${c}`} transform="rotate(-90 44 44)" />
      <text x="44" y="44" dy="0.35em" textAnchor="middle" fontSize="24" fontWeight="700" fill="var(--ink)">
        {Math.round(s)}
      </text>
    </svg>
  );
}

export default function DoctorPage() {
  const { summary, language, refreshMe } = useDashboard();
  const requested = useQueryParam("v");
  const [picked, setPicked] = useState<string | null>(null);
  // Each piece of state remembers which video it belongs to, so switching videos never shows stale data.
  const [loaded, setLoaded] = useState<{ id: string; data: RetentionRes } | null>(null);
  const [aud, setAud] = useState<{ id: string; report: AudienceReport | null } | null>(null);
  const [diagnosis, setDiagnosis] = useState<{ id: string; demo?: boolean; demoReason?: "signin" | "nokey"; data: Doctor } | null>(null);
  const [failure, setFailure] = useState<{ id: string; error: AiError } | null>(null);
  const [running, setRunning] = useState(false);

  const videos = summary?.videos ?? [];
  const outliers = outlierScores(videos.map((v) => ({ ...v, publishedAt: v.publishedAtIso ?? v.publishedAt })));
  const videoId = picked ?? (videos.some((v) => v.id === requested) ? requested : (videos[0]?.id ?? null));
  const video = videos.find((v) => v.id === videoId) ?? null;
  const retention = loaded?.id === videoId ? loaded.data : null;
  const result = diagnosis?.id === videoId ? diagnosis : null;
  const error = failure?.id === videoId ? failure.error : null;

  useEffect(() => {
    if (!videoId) return;
    let live = true;
    fetch(`/api/videos/${encodeURIComponent(videoId)}/retention`)
      .then((r) => r.json())
      .then((data: RetentionRes) => live && setLoaded({ id: videoId, data }));
    fetch(`/api/audience?video=${encodeURIComponent(videoId)}`)
      .then((r) => r.json() as Promise<{ report?: AudienceReport }>)
      .then((d) => live && setAud({ id: videoId, report: d.report ?? null }))
      .catch(() => live && setAud({ id: videoId, report: null }));
    return () => {
      live = false;
    };
  }, [videoId]);

  if (!summary) return <Spinner label="Loading your videos" />;

  const points = retention?.points ?? [];
  const audience = aud?.id === videoId && aud.report ? audienceRows(aud.report) : null;
  const moments = keyMoments(points);
  const pcts = videos.map((v) => v.avgViewPct).filter((p): p is number => p != null);
  const channelAvg = pcts.length ? pcts.reduce((a, b) => a + b, 0) / pcts.length : null;

  async function run() {
    if (!video) return;
    const id = video.id;
    setRunning(true);
    setFailure(null);
    const res = await postAi<Doctor>("/api/ai/doctor", {
      language,
      channel: summary!.channel.title,
      channelAvgViewPct: channelAvg == null ? null : Math.round(channelAvg),
      video,
      retention: points,
      ...(audience
        ? {
            audience: {
              cities: audience.cities.slice(0, 8).map(({ label, value }) => ({ label, value })),
              sources: audience.sources.slice(0, 8).map(({ label, value }) => ({ label, value })),
              searchTerms: audience.searchTerms.slice(0, 8).map(({ label, value }) => ({ label, value })),
            },
          }
        : {}),
    });
    setRunning(false);
    refreshMe();
    if (res.result) setDiagnosis({ id, demo: res.demo, demoReason: res.demoReason, data: res.result });
    else setFailure({ id, error: res.error ?? { message: "Something went wrong." } });
  }

  return (
    <div className="rise">
      <PageHeader eyebrow="Video Doctor" title="Why did this video do what it did?" />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card className="!p-3 lg:max-h-[calc(100vh-180px)] lg:overflow-y-auto">
          <p className="px-2 pb-2 pt-1 text-xs font-medium uppercase tracking-wider text-muted">Pick a video</p>
          <div className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {videos.map((v) => (
              <button
                key={v.id}
                onClick={() => setPicked(v.id)}
                className={`flex w-60 shrink-0 items-center gap-3 rounded-xl p-2 text-left transition lg:w-auto ${
                  v.id === videoId ? "bg-accent-soft" : "hover:bg-surface-2"
                }`}
              >
                <VideoThumb video={v} className="w-20" />
                <span className="min-w-0">
                  <span className="line-clamp-2 text-xs font-medium">{v.title}</span>
                  <span className="mt-1 block"><OutlierBadge outlier={outliers.get(v.id)} compact /></span>
                </span>
              </button>
            ))}
          </div>
        </Card>

        <div className="min-w-0 space-y-6">
          {video && (
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold">{video.title}</h2>
                  <p className="mt-1 text-sm text-muted">
                    <OutlierBadge outlier={outliers.get(video.id)} /> {compact(video.views)} views · {fmtTime(video.durationSec)} long
                    {video.avgViewPct != null && ` · ${video.avgViewPct.toFixed(0)}% viewed on average`}
                  </p>
                </div>
                <Button onClick={run} disabled={running || !retention}>
                  {running ? "Diagnosing…" : result ? "Re-run diagnosis" : `Diagnose with Mitra · ${FEATURE_CREDITS.doctor} credits`}
                </Button>
              </div>

              <div className="mt-5">
                {!retention ? (
                  <div className="py-20 text-center"><Spinner label="Loading retention" /></div>
                ) : points.length ? (
                  <>
                    <div className="mb-3 flex flex-wrap gap-6 text-sm">
                      <div>
                        <span className="text-muted">Lost in first 8%: </span>
                        <span className="font-semibold">{Math.round(introDrop(points) * 100)}% of viewers</span>
                      </div>
                      <div>
                        <span className="text-muted">Biggest drop: </span>
                        <span className="font-semibold">
                          {moments.find((m) => m.kind === "drop") ? fmtTime((moments.find((m) => m.kind === "drop")?.t ?? 0) * video.durationSec) : "—"}
                        </span>
                      </div>
                    </div>
                    <LineChart
                      ariaLabel="Audience retention for this video compared with a typical video"
                      xLabels={points.map((p) => fmtTime(p.t * video.durationSec))}
                      series={[
                        { label: "This video", values: points.map((p) => p.watching * 100), color: "var(--accent)", area: true },
                        {
                          label: "Typical for channel",
                          values: points.map((p, i) => (retention.benchmark[i]?.watching ?? 0) * 100),
                          color: "var(--chart-compare)",
                          dashed: true,
                        },
                      ]}
                      markers={moments.map((m) => ({
                        index: points.findIndex((p) => p.t === m.t),
                        label: fmtTime(m.t * video.durationSec),
                        tone: m.kind === "drop" ? "bad" : "good",
                      }))}
                      yFormat={(v) => `${Math.round(v)}%`}
                      yMin={0}
                      yMaxFloor={100}
                    />
                    {retention.mode === "demo" && <div className="mt-3"><DemoNote>Retention curve is simulated for the demo channel.</DemoNote></div>}
                  </>
                ) : (
                  <p className="py-12 text-center text-sm text-muted">{retention.error ?? "No retention data yet."}</p>
                )}
              </div>
            </Card>
          )}

          {audience && (
            <Card>
              <h3 className="mb-4 font-semibold">Where this video&apos;s viewers came from · last 28 days</h3>
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Cities</p>
                  <BarList rows={audience.cities.slice(0, 5)} empty="Not enough views yet." />
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Traffic sources</p>
                  <BarList rows={audience.sources.slice(0, 5)} empty="Not enough views yet." />
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Search terms</p>
                  <BarList rows={audience.searchTerms.slice(0, 5)} empty="No search traffic yet." />
                </div>
              </div>
            </Card>
          )}

          {error && <AiErrorNote error={error} />}
          {running && <Card><Spinner label="Mitra is watching the curve and reading the numbers…" /></Card>}

          {result && !running && (
            <div className="rise space-y-6">
              {result.demo && <AiDemoNote reason={result.demoReason} what="diagnosis" />}
              <Card className="flex flex-wrap items-center gap-5">
                <ScoreRing score={result.data.score} />
                <p className="min-w-0 flex-1 font-display text-2xl leading-snug sm:text-3xl">“{result.data.verdict}”</p>
              </Card>
              {result.data.traffic && (
                <Card>
                  <h3 className="mb-2 font-semibold">📍 Who it reached</h3>
                  <p className="font-indic text-sm">{result.data.traffic}</p>
                </Card>
              )}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <h3 className="mb-3 font-semibold text-good">What worked</h3>
                  <ul className="space-y-2 text-sm">
                    {result.data.whatWorked.map((w) => (
                      <li key={w} className="flex gap-2"><span className="text-good">✓</span>{w}</li>
                    ))}
                  </ul>
                </Card>
                <Card>
                  <h3 className="mb-3 font-semibold">Do this in your next video</h3>
                  <ol className="space-y-2 text-sm">
                    {result.data.nextVideo.map((w, i) => (
                      <li key={w} className="flex gap-2"><span className="font-semibold text-accent">{i + 1}.</span>{w}</li>
                    ))}
                  </ol>
                </Card>
              </div>
              <Card>
                <h3 className="mb-4 font-semibold text-bad">Where viewers left, and how to fix it</h3>
                <ol className="relative space-y-5 border-l border-line pl-6">
                  {result.data.whatHurt.map((h) => (
                    <li key={h.at + h.issue}>
                      <span className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full border-2 border-surface bg-bad" />
                      <p className="text-xs font-semibold tabular-nums text-muted">{h.at}</p>
                      <p className="font-medium">{h.issue}</p>
                      <p className="mt-1 text-sm text-ink-2"><span className="font-semibold text-accent">Fix: </span>{h.fix}</p>
                    </li>
                  ))}
                </ol>
              </Card>
              <Card>
                <h3 className="mb-3 font-semibold">Try these titles instead</h3>
                <div className="flex flex-wrap gap-2">
                  {result.data.titleIdeas.map((t) => (
                    <button
                      key={t}
                      onClick={() => navigator.clipboard?.writeText(t)}
                      className="rounded-full border border-line px-4 py-2 text-left text-sm hover:border-accent"
                      title="Copy"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
