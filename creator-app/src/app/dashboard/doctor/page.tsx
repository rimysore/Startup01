"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { OutputFeedback, PriceSurvey } from "@/components/BetaWidgets";
import { postAi, useDashboard, useQueryParam, type AiError } from "@/components/dashboard-context";
import { useStoredString } from "@/components/hooks";
import { audienceRows, BarList } from "@/components/insights";
import type { AudienceReport } from "@/lib/youtube";
import { LineChart } from "@/components/LineChart";
import { AiDemoNote, AiErrorNote, Button, Card, DemoNote, PageHeader, Spinner } from "@/components/ui";
import { OutlierBadge } from "@/components/outlier";
import { VideoThumb } from "@/components/VideoThumb";
import type { Doctor } from "@/lib/ai";
import { compact } from "@/lib/format";
import { outlierScores } from "@/lib/outliers";
import { BETA, LOW_DATA_VIEWS, SPRINT_UPLOADS } from "@/lib/beta";
import { FEATURE_CREDITS } from "@/lib/plans";
import { fmtTime, introDrop, isLowData, keyMoments } from "@/lib/retention";
import { track } from "@/lib/track";
import type { RetentionPoint, Video } from "@/lib/types";

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
    <svg width="88" height="88" viewBox="0 0 88 88" role="img" aria-label={`Mitra score ${s} out of 100`}>
      <circle cx="44" cy="44" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="8" />
      <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(s / 100) * c} ${c}`} transform="rotate(-90 44 44)" />
      <text x="44" y="44" dy="0.35em" textAnchor="middle" fontSize="24" fontWeight="700" fill="var(--ink)">
        {Math.round(s)}
      </text>
    </svg>
  );
}

/** Coarse, anonymous buckets for the Hindi/Kannada benchmark (no titles, no IDs). */
function lengthBucket(sec: number): string {
  return sec <= 60 ? "short" : sec <= 480 ? "under-8m" : sec <= 1200 ? "8-20m" : "over-20m";
}
function sizeBucket(subs: number): string {
  return subs < 1_000 ? "<1k" : subs < 10_000 ? "1k-10k" : subs < 100_000 ? "10k-100k" : subs < 1_000_000 ? "100k-1M" : "1M+";
}

/** Average % viewed across the channel's other recent uploads: the baseline a sprint is measured against. */
function baseline(videos: Video[], exceptId?: string): number | null {
  const pcts = videos.filter((v) => v.id !== exceptId).map((v) => v.avgViewPct).filter((p): p is number => p != null);
  return pcts.length ? pcts.reduce((a, b) => a + b, 0) / pcts.length : null;
}

export default function DoctorPage() {
  const { summary, language, refreshMe, me } = useDashboard();
  const userId = me?.user?.id ?? "";
  const [runs, setRuns] = useStoredString(`mitra-doctor-runs:${userId}`, "0");
  const [benchmark] = useStoredString("mitra-benchmark", "off");
  const [committed, setCommitted] = useState<string[]>([]);
  const [committing, setCommitting] = useState(false);
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
  const lowData = video ? isLowData(points, video.views) : false;
  const moments = lowData ? [] : keyMoments(points);
  const channelAvg = baseline(videos);

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
      otherTitles: videos.filter((v) => v.id !== id).map((v) => v.title),
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
    if (res.result) {
      setDiagnosis({ id, demo: res.demo, demoReason: res.demoReason, data: res.result });
      if (!res.demo) {
        setRuns(String((Number(runs) || 0) + 1));
        track("doctor_run", { language, lowData });
        // Anonymous stats for the Hindi/Kannada benchmark, only when the creator opted in (Connections).
        if (benchmark === "on" && !lowData && video.avgViewPct != null) {
          track("benchmark_sample", {
            language,
            length: lengthBucket(video.durationSec),
            size: sizeBucket(summary!.channel.subscribers),
            avgViewPct: Math.round(video.avgViewPct),
            introDrop: Math.round(introDrop(points) * 100),
            drops: keyMoments(points).filter((m) => m.kind === "drop").map((m) => Math.round(m.t * 100)),
          });
        }
      }
    } else setFailure({ id, error: res.error ?? { message: "Something went wrong." } });
  }

  async function commit() {
    if (!video || !result) return;
    setCommitting(true);
    const base = baseline(videos, video.id);
    const r = await fetch("/api/sprints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoId: video.id,
        videoTitle: video.title,
        fixes: [...result.data.nextVideo, ...result.data.whatHurt.map((h) => h.fix)].slice(0, 12),
        baselinePct: base == null ? null : Math.round(base * 10) / 10,
        language,
      }),
    }).catch(() => null);
    setCommitting(false);
    if (r?.ok) setCommitted((c) => [...c, video.id]);
  }

  return (
    <div className="rise">
      <PageHeader eyebrow="Video Doctor" title="Pick a video to see where viewers left, and what to change next time." />

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
                  {running
                    ? "Diagnosing…"
                    : result
                      ? "Re-run diagnosis"
                      : lowData
                        ? "Get an early read"
                        : BETA
                          ? "Diagnose with Mitra"
                          : `Diagnose with Mitra · ${FEATURE_CREDITS.doctor} credits`}
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
                        ...(retention.benchmark.length
                          ? [
                              {
                                label: "Typical video (sample)",
                                values: points.map((p, i) => (retention.benchmark[i]?.watching ?? 0) * 100),
                                color: "var(--chart-compare)",
                                dashed: true,
                              },
                            ]
                          : []),
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
                  <p className="py-6 text-center text-sm text-muted">{retention.error ?? "No retention curve for this video yet."}</p>
                )}
                {lowData && retention && (
                  <div className="mt-4 rounded-lg border border-dashed border-accent/50 bg-accent-soft/40 px-4 py-3 text-sm">
                    <p className="font-semibold">Not enough views for a full retention diagnosis yet</p>
                    <p className="mt-1 text-ink-2">
                      YouTube&apos;s drop-off data gets reliable at around {LOW_DATA_VIEWS} views. You can still get an early read: Mitra checks
                      the title, length and topic against your other videos and fixes your first 15 seconds.
                    </p>
                  </div>
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
                <div className="text-center" title="Mitra's own estimate from YouTube data, not a YouTube metric">
                  <ScoreRing score={result.data.score} />
                  <p className="mt-1 text-[11px] text-muted">Mitra score</p>
                </div>
                <p className="min-w-0 flex-1 font-display text-lg leading-snug sm:text-3xl">“{result.data.verdict}”</p>
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
              {!result.demo && (
                <>
                  <Card className="flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold">Retention Sprint</p>
                      <p className="mt-1 text-sm text-muted">
                        Apply these fixes on your next {SPRINT_UPLOADS} uploads. Mitra compares their average % viewed with your channel&apos;s
                        {channelAvg == null ? " average" : ` ${channelAvg.toFixed(0)}% average`} today.
                      </p>
                    </div>
                    {video && committed.includes(video.id) ? (
                      <Link href="/dashboard/progress" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink">
                        Track my progress →
                      </Link>
                    ) : (
                      <Button onClick={commit} disabled={committing}>
                        {committing ? "Saving…" : "I'll apply these fixes"}
                      </Button>
                    )}
                  </Card>
                  <OutputFeedback
                    feature="doctor"
                    language={language}
                    output={{ verdict: result.data.verdict, nextVideo: result.data.nextVideo, whatHurt: result.data.whatHurt, lowData }}
                  />
                  {BETA && userId && (Number(runs) || 0) >= 2 && <PriceSurvey userId={userId} />}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
