"use client";

import Link from "next/link";
import { useDashboard } from "@/components/dashboard-context";
import { LineChart } from "@/components/LineChart";
import { Card, DemoNote, ErrorNote, PageHeader, Spinner } from "@/components/ui";
import { VideoThumb } from "@/components/VideoThumb";
import { compact, full, pctChange, shortDate } from "@/lib/format";
import type { ChannelSummary, Video } from "@/lib/types";

function sum(xs: number[]) {
  return xs.reduce((a, b) => a + b, 0);
}

function Kpi({ label, value, sub, change }: { label: string; value: string; sub?: string; change?: number | null }) {
  return (
    <Card className="!p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-2 font-display text-4xl leading-none tabular-nums">{value}</p>
      <div className="mt-3 flex items-center gap-2 text-xs">
        {change != null && (
          <span className={`font-semibold ${change >= 0 ? "text-good" : "text-bad"}`}>
            {change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(0)}%
          </span>
        )}
        {sub && <span className="text-muted">{sub}</span>}
      </div>
    </Card>
  );
}

/** Rule-based weekly actions, so the overview is useful before any AI call. */
function actions(s: ChannelSummary): Array<{ title: string; body: string; href: string; cta: string }> {
  const out = [];
  const withPct = s.videos.filter((v): v is Video & { avgViewPct: number } => v.avgViewPct != null);
  const worst = [...withPct].sort((a, b) => a.avgViewPct - b.avgViewPct)[0];
  const best = [...s.videos].sort((a, b) => b.views - a.views)[0];
  if (worst) {
    out.push({
      title: "Fix your weakest hook",
      body: `"${worst.title}" kept only ${worst.avgViewPct}% of viewers on average. Find where they left.`,
      href: `/dashboard/doctor?v=${worst.id}`,
      cta: "Diagnose",
    });
  }
  if (best) {
    out.push({
      title: "Make a Part 2",
      body: `"${best.title}" is your top recent video with ${compact(best.views)} views. Viewers want more of it.`,
      href: `/dashboard/studio?topic=${encodeURIComponent(`Part 2: ${best.title}`)}`,
      cta: "Write titles",
    });
  }
  out.push({
    title: "Answer your audience",
    body: "Turn the most-liked questions in your comments into your next Short.",
    href: "/dashboard/comments",
    cta: "See comments",
  });
  return out;
}

export default function Overview() {
  const { summary } = useDashboard();
  if (!summary) return <Spinner label="Loading your channel" />;

  const { channel, daily, videos } = summary;
  const views28 = sum(daily.map((d) => d.views));
  const half = Math.floor(daily.length / 2);
  const viewsChange = pctChange(sum(daily.slice(half).map((d) => d.views)), sum(daily.slice(0, half).map((d) => d.views)));
  const subs28 = sum(daily.map((d) => d.subscribersGained));
  const hours28 = sum(daily.map((d) => d.watchMinutes)) / 60;
  const pcts = videos.map((v) => v.avgViewPct).filter((p): p is number => p != null);
  const avgPct = pcts.length ? sum(pcts) / pcts.length : null;

  return (
    <div className="rise">
      <PageHeader eyebrow="Overview" title={`Namaste, ${channel.title} 👋`}>
        {summary.mode === "demo" && (
          <Link href="/dashboard/connections" className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink">
            Connect your YouTube
          </Link>
        )}
      </PageHeader>
      {summary.error && <div className="mb-4"><ErrorNote>{summary.error}</ErrorNote></div>}
      {summary.mode === "demo" && (
        <div className="mb-6">
          <DemoNote>You&apos;re exploring a demo channel. Connect your account to see your own numbers.</DemoNote>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Subscribers" value={compact(channel.subscribers)} sub={`+${full(subs28)} in 28 days`} />
        <Kpi label="Views · 28 days" value={compact(views28)} change={viewsChange} sub="vs previous 2 weeks" />
        <Kpi label="Watch hours · 28 days" value={compact(hours28)} sub={`${full(channel.videoCount)} videos total`} />
        <Kpi label="Avg. % viewed" value={avgPct == null ? "—" : `${avgPct.toFixed(0)}%`} sub="recent uploads" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="font-semibold">Daily views</h2>
            <span className="text-xs text-muted">Last 28 days</span>
          </div>
          {daily.length ? (
            <LineChart
              ariaLabel="Daily views over the last 28 days"
              xLabels={daily.map((d) => shortDate(d.date))}
              series={[{ label: "Views", values: daily.map((d) => d.views), color: "var(--accent)", area: true }]}
              yFormat={compact}
            />
          ) : (
            <p className="py-16 text-center text-sm text-muted">Analytics for this period aren&apos;t available yet.</p>
          )}
        </Card>

        <Card className="bg-ink text-bg !border-ink">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">This week, Mitra suggests</p>
          <ol className="mt-4 space-y-5">
            {actions(summary).map((a, i) => (
              <li key={a.title} className="flex gap-3">
                <span className="font-display text-3xl leading-none text-accent">{i + 1}</span>
                <div>
                  <p className="font-semibold">{a.title}</p>
                  <p className="mt-1 text-sm opacity-75">{a.body}</p>
                  <Link href={a.href} className="mt-2 inline-block text-sm font-semibold text-accent underline-offset-4 hover:underline">
                    {a.cta} →
                  </Link>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="mb-4 font-semibold">Recent uploads</h2>
        <div className="divide-y divide-line">
          {videos.map((v) => (
            <div key={v.id} className="flex items-center gap-3 py-3 sm:gap-4">
              <VideoThumb video={v} className="w-24 sm:w-36" />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 font-medium">{v.title}</p>
                <p className="mt-1 text-xs text-muted">
                  {shortDate(v.publishedAt)} · {compact(v.views)} views<span className="hidden sm:inline"> · {compact(v.likes)} likes · {compact(v.comments)} comments</span>
                </p>
              </div>
              <div className="hidden w-28 sm:block">
                {v.avgViewPct != null && (
                  <>
                    <div className="h-1.5 rounded-full bg-surface-2">
                      <div className="h-1.5 rounded-full bg-accent" style={{ width: `${Math.min(100, v.avgViewPct)}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-muted">{v.avgViewPct.toFixed(0)}% viewed</p>
                  </>
                )}
              </div>
              <Link
                href={`/dashboard/doctor?v=${v.id}`}
                className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-semibold hover:bg-surface-2"
              >
                Diagnose
              </Link>
            </div>
          ))}
          {!videos.length && <p className="py-6 text-sm text-muted">No uploads yet.</p>}
        </div>
      </Card>
    </div>
  );
}
