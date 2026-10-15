"use client";

import { useEffect, useState } from "react";
import { postAi, useDashboard, type AiError } from "@/components/dashboard-context";
import { audienceRows, BarList, EmotionBars } from "@/components/insights";
import { SlangCard } from "@/components/SlangCard";
import { AiDemoNote, AiErrorNote, Button, Card, DemoNote, ErrorNote, PageHeader, Spinner } from "@/components/ui";
import type { AudienceInsights } from "@/lib/ai";
import { compact } from "@/lib/format";
import { languageLabel } from "@/lib/languages";
import { FEATURE_CREDITS } from "@/lib/plans";
import type { AudienceReport } from "@/lib/youtube";

interface AudienceResponse {
  mode: "live" | "demo";
  fetchedAt?: number;
  report: AudienceReport;
  error?: string;
}

export default function AudiencePage() {
  const { language, summary, refreshMe } = useDashboard();
  const [data, setData] = useState<AudienceResponse | null>(null);
  const [version, setVersion] = useState({ n: 0, force: false });
  const [insights, setInsights] = useState<{ demo?: boolean; demoReason?: "signin" | "nokey"; data: AudienceInsights } | null>(null);
  const [error, setError] = useState<AiError | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(`/api/audience${version.force ? "?refresh=1" : ""}`, { cache: "no-store" })
      .then((r) => r.json() as Promise<AudienceResponse>)
      .then((d) => live && setData(d))
      .catch(() => live && setData(null));
    return () => {
      live = false;
    };
  }, [version]);

  const rows = data ? audienceRows(data.report) : null;
  const totalViews = data?.report.countries.reduce((a, c) => a + c.views, 0) ?? 0;
  const strip = (xs: { label: string; value: number }[]) => xs.map(({ label, value }) => ({ label, value }));

  async function analyse() {
    if (!rows) return;
    setRunning(true);
    setError(null);
    const channel = summary ? `${summary.channel.title}\n${summary.videos.slice(0, 10).map((v) => `- ${v.title} (${v.views} views)`).join("\n")}` : "";
    const res = await postAi<AudienceInsights>("/api/ai/audience", {
      language,
      channel,
      countries: strip(rows.countries),
      cities: strip(rows.cities),
      sources: strip(rows.sources),
      searchTerms: strip(rows.searchTerms),
      demographics: strip(rows.demographics),
      subscribed: strip(rows.subscribed),
    });
    setRunning(false);
    refreshMe();
    if (res.result) setInsights({ demo: res.demo, demoReason: res.demoReason, data: res.result });
    else setError(res.error ?? { message: "Something went wrong." });
  }

  return (
    <div className="rise">
      <PageHeader eyebrow="Audience" title="Who watches, from where, and why">
        <div className="flex items-center gap-3">
          {data?.fetchedAt && <span className="text-xs text-muted">Last 28 days · updated {new Date(data.fetchedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>}
          {data?.mode === "live" && (
            <Button variant="ghost" onClick={() => setVersion((v) => ({ n: v.n + 1, force: true }))}>
              Refresh
            </Button>
          )}
        </div>
      </PageHeader>
      {data?.mode === "demo" && (
        <div className="mb-4">
          <DemoNote>Sample audience. Connect YouTube to see your own regions, traffic sources and search terms.</DemoNote>
        </div>
      )}
      {data?.error && <div className="mb-4"><ErrorNote>{data.error}</ErrorNote></div>}
      {!data && <Card><Spinner label="Loading audience" /></Card>}

      {rows && data && (
        <div className="space-y-6">
          {totalViews === 0 && data.mode === "live" && (
            <ErrorNote>YouTube doesn&apos;t have audience data for this channel yet. It appears 1–2 days after your videos start getting views.</ErrorNote>
          )}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <h2 className="mb-4 font-semibold">Top cities</h2>
              <BarList rows={rows.cities} format={compact} empty="City data appears once a video has a few hundred views." />
            </Card>
            <Card>
              <h2 className="mb-4 font-semibold">Top countries</h2>
              <BarList rows={rows.countries} format={compact} />
            </Card>
            <Card>
              <h2 className="mb-4 font-semibold">How they find you</h2>
              <BarList rows={rows.sources} format={compact} />
            </Card>
            <Card>
              <h2 className="mb-1 font-semibold">What they searched</h2>
              <p className="mb-4 text-xs text-muted">YouTube search terms that led to your videos</p>
              <BarList rows={rows.searchTerms} format={compact} empty="No search traffic yet." />
            </Card>
            <Card>
              <h2 className="mb-4 font-semibold">Age & gender</h2>
              <BarList rows={rows.demographics} format={(n) => `${n}%`} empty="YouTube shows age and gender only for channels with enough viewers." />
            </Card>
            <Card>
              <h2 className="mb-4 font-semibold">Subscribers vs new viewers</h2>
              <BarList rows={rows.subscribed} format={compact} />
            </Card>
          </div>

          <SlangCard report={data.report} />

          <Card className="bg-ink text-bg !border-ink">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Mitra&apos;s audience read</p>
                <p className="mt-2 max-w-xl text-sm text-bg/80">
                  Who your core viewer is, which regions to lean into, what they feel and what to do next, in {languageLabel(language)}.
                </p>
              </div>
              <Button onClick={analyse} disabled={running}>
                {running ? "Reading your audience…" : `Analyse with Mitra · ${FEATURE_CREDITS.audience} credit`}
              </Button>
            </div>
          </Card>
          {error && <AiErrorNote error={error} />}
          {running && <Card><Spinner label="Mitra is reading your audience…" /></Card>}
          {insights && !running && (
            <div className="rise space-y-4">
              {insights.demo && <AiDemoNote reason={insights.demoReason} what="audience analysis" />}
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Your core viewer</h3>
                  <p className="mt-2 font-indic leading-relaxed">{insights.data.persona}</p>
                  <h3 className="mb-3 mt-5 text-xs font-semibold uppercase tracking-wider text-muted">Emotions that bring them back</h3>
                  <EmotionBars emotions={insights.data.emotions} />
                </Card>
                <Card>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Regions</h3>
                  <ul className="mt-2 space-y-3">
                    {insights.data.regions.map((r) => (
                      <li key={r.place} className="font-indic text-sm">
                        <span className="font-semibold">📍 {r.place}</span> — {r.insight}
                      </li>
                    ))}
                  </ul>
                  <h3 className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted">How they discover you</h3>
                  <p className="mt-2 font-indic text-sm">{insights.data.discovery}</p>
                  {insights.data.searchIntent.length > 0 && (
                    <ul className="mt-2 list-disc space-y-1 pl-5 font-indic text-sm">{insights.data.searchIntent.map((s) => <li key={s}>{s}</li>)}</ul>
                  )}
                </Card>
              </div>
              <Card>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Do this next</h3>
                <ol className="mt-3 list-decimal space-y-2 pl-5 font-indic text-sm">{insights.data.actions.map((a) => <li key={a}>{a}</li>)}</ol>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
