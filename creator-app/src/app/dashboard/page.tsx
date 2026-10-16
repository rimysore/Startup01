"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { burstConfetti, CelebrationToast, MilestoneRing, RollingNumber, Sparkline, useLiveSubscribers, type Celebration } from "@/components/celebrate";
import { useDashboard, useQueryParam, type Me } from "@/components/dashboard-context";
import { FounderBadge, FounderPassCard } from "@/components/Founding";
import { LineChart } from "@/components/LineChart";
import { Card, DemoNote, ErrorNote, Spinner } from "@/components/ui";
import { VideoThumb } from "@/components/VideoThumb";
import { compact, full, pctChange, shortDate } from "@/lib/format";
import type { ChannelSummary, Video } from "@/lib/types";

function sum(xs: number[]) {
  return xs.reduce((a, b) => a + b, 0);
}

function Kpi({ label, value, sub, change, trend }: { label: string; value: React.ReactNode; sub?: string; change?: number | null; trend?: number[] }) {
  return (
    <Card className="group !p-5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.35)]">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold leading-none tracking-tight sm:text-4xl">{value}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        {change != null && (
          <span className={`rounded-full px-2 py-0.5 font-semibold ${change >= 0 ? "bg-good/15 text-good" : "bg-bad/10 text-bad"}`}>
            {change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(0)}%
          </span>
        )}
        {sub && <span className="text-muted">{sub}</span>}
      </div>
      {trend && trend.length > 1 && (
        <div className="mt-3">
          <Sparkline values={trend} label={`${label}, last ${trend.length} days`} />
        </div>
      )}
    </Card>
  );
}

/** Small wins worth celebrating, computed from the numbers (no AI). */
function wins(s: ChannelSummary): { emoji: string; text: string }[] {
  const out: { emoji: string; text: string }[] = [];
  const { daily, videos } = s;
  if (daily.length) {
    const best = daily.reduce((a, b) => (b.views > a.views ? b : a));
    const recent = daily.slice(-3).some((d) => d.date === best.date);
    out.push({ emoji: "🔥", text: recent ? `Best day of the month: ${compact(best.views)} views on ${shortDate(best.date)}` : `Best day: ${compact(best.views)} views on ${shortDate(best.date)}` });
    let streak = 0;
    for (let i = daily.length - 1; i >= 0 && daily[i].subscribersGained > 0; i--) streak++;
    if (streak >= 2) out.push({ emoji: "⚡", text: `${streak}-day streak of new subscribers` });
    const gained7 = sum(daily.slice(-7).map((d) => d.subscribersGained));
    if (gained7 > 0) out.push({ emoji: "🙌", text: `${full(gained7)} people subscribed this week` });
  }
  const avg = videos.length ? sum(videos.map((v) => v.views)) / videos.length : 0;
  const star = [...videos].sort((a, b) => b.views - a.views)[0];
  if (star && avg > 0 && star.views >= avg * 1.5 && videos.length > 2) {
    out.push({ emoji: "🚀", text: `“${star.title.length > 38 ? `${star.title.slice(0, 37)}…` : star.title}” is ${(star.views / avg).toFixed(1)}× your average` });
  }
  return out.slice(0, 4);
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
  const { summary, refresh, me } = useDashboard();
  const newFounder = useQueryParam("founder");
  if (!summary) return <Spinner label="Loading your channel" />;
  return <OverviewBody summary={summary} refresh={refresh} me={me} founder={me?.founderNumber ?? null} newFounder={newFounder} />;
}

function OverviewBody({
  summary,
  refresh,
  me,
  founder,
  newFounder,
}: {
  summary: ChannelSummary & { error?: string };
  refresh: () => void;
  me: Me | null;
  founder: number | null;
  newFounder: string | null;
}) {
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const [popKey, setPopKey] = useState(0);
  const onGain = useCallback((gain: number, since: "visit" | "now") => {
    burstConfetti();
    setPopKey((k) => k + 1);
    setCelebration({
      id: Date.now(),
      title: `+${gain.toLocaleString("en-IN")} new subscriber${gain === 1 ? "" : "s"}!`,
      body: since === "visit" ? "since you last checked. Your audience is growing 🙌" : "just now. Keep going!",
    });
  }, []);
  const dismiss = useCallback(() => setCelebration(null), []);
  // Just became a founding creator (redirect from connecting YouTube): the biggest celebration we have.
  useEffect(() => {
    if (!newFounder || !/^\d+$/.test(newFounder)) return;
    const t = setTimeout(() => {
      burstConfetti(undefined, 220);
      setCelebration({ id: Date.now(), title: `You're Founding Creator #${newFounder}! 🏅`, body: "Lifetime perks unlocked: free credits every month and early brand deals." });
    }, 600);
    return () => clearTimeout(t);
  }, [newFounder]);
  const live = summary.mode === "live";
  const subscribers = useLiveSubscribers(summary.channel.id, summary.channel.subscribers, live, onGain);

  const { channel, daily, videos } = summary;
  const views28 = sum(daily.map((d) => d.views));
  const half = Math.floor(daily.length / 2);
  const viewsChange = pctChange(sum(daily.slice(half).map((d) => d.views)), sum(daily.slice(0, half).map((d) => d.views)));
  const subs28 = sum(daily.map((d) => d.subscribersGained));
  const hours28 = sum(daily.map((d) => d.watchMinutes)) / 60;
  const pcts = videos.map((v) => v.avgViewPct).filter((p): p is number => p != null);
  const avgPct = pcts.length ? sum(pcts) / pcts.length : null;

  const perDay = daily.length ? subs28 / daily.length : 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const winList = wins(summary);

  return (
    <div className="rise">
      <CelebrationToast celebration={celebration} onDone={dismiss} />
      {summary.error && <div className="mb-4"><ErrorNote>{summary.error}</ErrorNote></div>}

      <section className="relative overflow-hidden rounded-[28px] bg-ink p-6 text-bg sm:p-8" aria-label="Your channel right now">
        <div className="glow-blob pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-accent/40 blur-3xl" aria-hidden />
        <div className="glow-blob pointer-events-none absolute -bottom-40 left-10 h-72 w-72 rounded-full bg-peacock/30 blur-3xl" style={{ animationDelay: "-7s" }} aria-hidden />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-bg/75">
              {greeting}, <span className="font-semibold text-bg">{channel.title}</span> 👋
            </p>
            {founder != null && <FounderBadge n={founder} />}
          </div>
          <div className="flex items-center gap-2 text-xs">
            {live ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-bg/10 px-3 py-1.5">
                <span className="live-dot h-2 w-2 rounded-full bg-good" /> Live
                {summary.fetchedAt && <span className="text-bg/60">· {new Date(summary.fetchedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>}
              </span>
            ) : (
              <span className="rounded-full bg-accent/25 px-3 py-1.5 font-semibold text-accent">Demo channel</span>
            )}
            {live ? (
              <button onClick={refresh} className="rounded-full bg-bg/10 px-3 py-1.5 font-semibold hover:bg-bg/20" title="Fetch the latest numbers from YouTube">
                Refresh
              </button>
            ) : (
              <Link href="/dashboard/connections" className="rounded-full bg-accent px-3 py-1.5 font-semibold text-accent-ink">
                Connect YouTube
              </Link>
            )}
          </div>
        </div>
        <div className="relative mt-6 grid items-end gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">Subscribers</p>
            <p key={popKey} className={`mt-2 text-6xl font-semibold leading-none tracking-tight sm:text-7xl lg:text-8xl ${popKey ? "pop" : ""}`}>
              <RollingNumber value={subscribers} />
            </p>
            <p className="mt-3 text-sm text-bg/75">
              <span className="font-semibold text-good">+{full(subs28)}</span> in the last 28 days
              {perDay >= 1 && <> · about {Math.round(perDay).toLocaleString("en-IN")} a day</>}
            </p>
            {live && subscribers >= 1000 && (
              <p className="mt-1 text-xs text-bg/50">YouTube rounds counts above 1,000 to 3 digits, so the live number moves in steps; daily gains are exact.</p>
            )}
          </div>
          <MilestoneRing subscribers={subscribers} perDay={perDay} />
        </div>
        {winList.length > 0 && (
          <ul className="relative mt-6 flex flex-wrap gap-2" aria-label="Recent wins">
            {winList.map((w) => (
              <li key={w.text} className="rounded-full bg-bg/10 px-3 py-1.5 text-sm backdrop-blur">
                <span aria-hidden>{w.emoji}</span> {w.text}
              </li>
            ))}
          </ul>
        )}
      </section>
      {summary.mode === "demo" && (
        <div className="mt-4">
          <DemoNote>You&apos;re exploring a demo channel: the counter ticks up on its own so you can see the celebrations. Connect YouTube to see your own numbers, live.</DemoNote>
        </div>
      )}

      <FounderPassCard me={me} />

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Views · 28 days" value={<RollingNumber value={Math.round(views28)} format={compact} />} change={viewsChange} sub="vs previous 2 weeks" trend={daily.map((d) => d.views)} />
        <Kpi label="Watch hours · 28 days" value={<RollingNumber value={Math.round(hours28)} format={compact} />} sub={`${full(channel.videoCount)} videos total`} trend={daily.map((d) => d.watchMinutes)} />
        <Kpi label="New subscribers · 28 days" value={<RollingNumber value={subs28} format={full} />} trend={daily.map((d) => d.subscribersGained)} />
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
          {!videos.length && (
            <p className="py-6 text-sm text-muted">
              No uploads found yet. A new video can take a few minutes to show up after YouTube finishes processing it (drafts never
              appear). Press Refresh to check again.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
