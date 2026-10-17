"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { postAi, useDashboard, type AiError } from "@/components/dashboard-context";
import { OutlierBadge } from "@/components/outlier";
import { AiDemoNote, AiErrorNote, Button, Card, DemoNote, ErrorNote, PageHeader, Spinner } from "@/components/ui";
import { VideoThumb } from "@/components/VideoThumb";
import type { BreakoutIdeas } from "@/lib/ai";
import { compact } from "@/lib/format";
import { languageLabel } from "@/lib/languages";
import { formatScore, isShort, outlierScores, pickBreakouts, type BreakoutVideo } from "@/lib/outliers";
import { FEATURE_CREDITS } from "@/lib/plans";

interface IdeasResponse {
  mode: "live" | "demo";
  tracked: BreakoutVideo[];
  trackedCount: number;
  search?: { query: string; breakouts: BreakoutVideo[] };
  searchesLeft: number;
  searchEnabled: boolean;
  error?: string;
}

const QUERY_KEY = "mitra-niche-query";

function BreakoutRow({ v }: { v: BreakoutVideo }) {
  return (
    <li className="flex gap-3 py-3">
      {v.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element -- YouTube thumbnail
        <img src={v.thumbnail} alt="" className="h-16 w-28 shrink-0 rounded-lg object-cover" />
      ) : (
        <div className="grid h-16 w-28 shrink-0 place-items-center rounded-lg bg-surface-2 text-2xl" aria-hidden>
          🚀
        </div>
      )}
      <div className="min-w-0 flex-1">
        <a href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noreferrer" className="line-clamp-2 font-indic text-sm font-medium hover:underline">
          {v.title}
        </a>
        <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted">
          <span className="bg-brand rounded-full px-2 py-0.5 text-[11px] font-bold text-white">
            {formatScore(v.score)} {v.basis === "channel" ? "their usual" : "their subs"}
          </span>
          {v.channelTitle} · {compact(v.views)} views · {isShort(v) ? "Short" : "Long"}
        </p>
      </div>
    </li>
  );
}

export default function IdeasPage() {
  const { language, summary, refreshMe } = useDashboard();
  const [data, setData] = useState<IdeasResponse | null>(null);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState<{ query: string; breakouts: BreakoutVideo[] } | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<{ demo?: boolean; demoReason?: "signin" | "nokey"; data: BreakoutIdeas } | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<AiError | null>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/ideas", { cache: "no-store" })
      .then((r) => r.json() as Promise<IdeasResponse>)
      .then((d) => {
        if (!live) return;
        setData(d);
        if (d.search) {
          setSearch(d.search);
          setQuery(d.search.query);
          return;
        }
        // Re-open the last search: it's cached for a week, so this costs nothing.
        let last = "";
        try {
          last = localStorage.getItem(QUERY_KEY) ?? "";
        } catch {}
        if (last) {
          setQuery(last);
          void runSearch(last);
        }
      })
      .catch(() => live && setData(null));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once
  }, []);

  async function runSearch(q = query) {
    if (q.trim().length < 2) return;
    setSearching(true);
    setSearchError(null);
    const r = await fetch("/api/ideas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: q, language }) }).catch(() => null);
    const d = (await r?.json().catch(() => null)) as { query?: string; breakouts?: BreakoutVideo[]; searchesLeft?: number; error?: string } | null;
    setSearching(false);
    if (d?.searchesLeft != null) setData((x) => (x ? { ...x, searchesLeft: d.searchesLeft! } : x));
    if (!r?.ok || !d?.breakouts) return setSearchError(d?.error ?? "Couldn't search right now.");
    setSearch({ query: d.query ?? q, breakouts: d.breakouts });
    try {
      localStorage.setItem(QUERY_KEY, d.query ?? q);
    } catch {}
  }

  const videos = summary?.videos ?? [];
  const scores = outlierScores(videos.map((v) => ({ ...v, publishedAt: v.publishedAtIso ?? v.publishedAt })));
  const ranked = videos.filter((v) => scores.get(v.id)?.score != null).sort((a, b) => scores.get(b.id)!.score! - scores.get(a.id)!.score!);
  const pool = pickBreakouts([data?.tracked ?? [], search?.breakouts ?? []], 15);

  async function makeIdeas() {
    setRunning(true);
    setError(null);
    const line = (v: (typeof videos)[number]) => `- ${v.title} (${formatScore(scores.get(v.id)?.score ?? null)} usual, ${v.views} views)`;
    const channel = summary
      ? `${summary.channel.title}, ${summary.channel.subscribers} subscribers\nBest:\n${ranked.slice(0, 3).map(line).join("\n")}\nWeakest:\n${ranked.slice(-2).map(line).join("\n")}`
      : "";
    const res = await postAi<BreakoutIdeas>("/api/ai/breakouts", {
      language,
      channel,
      videos: pool.map((v) => ({ title: v.title, channel: v.channelTitle, score: v.score, basis: v.basis, views: v.views, short: isShort(v) })),
    });
    setRunning(false);
    refreshMe();
    if (res.result) setIdeas({ demo: res.demo, demoReason: res.demoReason, data: res.result });
    else setError(res.error ?? { message: "Something went wrong." });
  }

  return (
    <div className="rise">
      <PageHeader eyebrow="Breakout ideas" title="What's breaking out, and what to make next" />

      <Card className="mb-6 !p-4 sm:!p-5">
        <p className="text-sm text-ink-2">
          <b className="text-ink">How the × works:</b> a video&apos;s views divided by its channel&apos;s usual (the middle of its previous 9 uploads of the same kind).{" "}
          <b className="text-ink">3×</b> means three times the usual: YouTube showed it to far more new people. Small channels&apos; hits count as much as big ones&apos;.
        </p>
      </Card>

      {data?.mode === "demo" && (
        <div className="mb-4">
          <DemoNote>Sample breakouts. Connect YouTube and add competitors to see real ones from your niche.</DemoNote>
        </div>
      )}
      {data?.error && (
        <div className="mb-4">
          <ErrorNote>{data.error}</ErrorNote>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="min-w-0 space-y-6">
          <Card>
            <h2 className="font-semibold">Your outliers</h2>
            <p className="mb-3 mt-1 text-xs text-muted">Your recent uploads against your own usual. Make more of what&apos;s on top.</p>
            {!summary ? (
              <Spinner label="Loading your videos" />
            ) : !ranked.length ? (
              <p className="py-4 text-sm text-muted">Upload a few more videos and Mitra will start scoring them: it needs 3 earlier uploads to know your usual.</p>
            ) : (
              <ul className="divide-y divide-line">
                {ranked.slice(0, 5).map((v) => (
                  <li key={v.id} className="flex items-center gap-3 py-2.5">
                    <VideoThumb video={v} className="w-20 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium">{v.title}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                        <OutlierBadge outlier={scores.get(v.id)} /> {compact(v.views)} views
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="font-semibold">Search your niche</h2>
            <p className="mt-1 text-xs text-muted">
              The most-watched videos of the last 30 days in India for a topic, leaning {languageLabel(language)}, scored by views ÷ the channel&apos;s subscribers.
            </p>
            <form
              className="mt-3 flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                void runSearch();
              }}
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                maxLength={60}
                placeholder="e.g. budget phones, village cooking, UPSC tips"
                aria-label="Your niche"
                className="min-w-0 flex-1 rounded-full border border-line bg-surface px-4 py-3 text-base outline-none focus:border-accent"
              />
              <Button type="submit" disabled={searching || query.trim().length < 2 || data?.searchEnabled === false} className="py-3">
                {searching ? "Searching…" : "Search"}
              </Button>
            </form>
            {data && (
              <p className="mt-2 text-xs text-muted">
                {data.searchesLeft} new search{data.searchesLeft === 1 ? "" : "es"} left this week · repeating a search is free
              </p>
            )}
            {searchError && (
              <div className="mt-3">
                <ErrorNote>{searchError}</ErrorNote>
              </div>
            )}
            {searching && (
              <div className="mt-3">
                <Spinner label="Searching YouTube" />
              </div>
            )}
            {search && !searching && (
              <>
                {search.breakouts.length ? (
                  <ul className="mt-2 divide-y divide-line">{search.breakouts.slice(0, 10).map((v) => <BreakoutRow key={v.id} v={v} />)}</ul>
                ) : (
                  <p className="mt-3 text-sm text-muted">Nothing for “{search.query}” beat its channel&apos;s size this month. Try a broader topic.</p>
                )}
              </>
            )}
          </Card>

          <Card>
            <h2 className="font-semibold">From your competitors</h2>
            <p className="mb-2 mt-1 text-xs text-muted">Their videos that did at least 2× their own usual.</p>
            {!data ? (
              <Spinner label="Loading" />
            ) : data.tracked.length ? (
              <ul className="divide-y divide-line">{data.tracked.slice(0, 8).map((v) => <BreakoutRow key={v.id} v={v} />)}</ul>
            ) : (
              <p className="py-3 text-sm text-muted">
                {data.trackedCount ? "No breakouts among your competitors' latest uploads yet. " : "You're not tracking any channels yet. "}
                <Link href="/dashboard/competitors" className="font-semibold text-accent hover:underline">
                  Add competitors →
                </Link>
              </p>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="!border-ink bg-ink text-bg">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Mitra&apos;s ideas</p>
            <p className="mt-2 text-sm text-bg/80">
              Why these videos broke out, and five ideas made for your channel and audience, in {languageLabel(language)}. Learn from the pattern; never copy.
            </p>
            <Button className="mt-4" onClick={makeIdeas} disabled={running || !pool.length}>
              {running ? "Thinking…" : `Give me ideas · ${FEATURE_CREDITS.breakouts} credit`}
            </Button>
            {!pool.length && data && <p className="mt-2 text-xs text-bg/60">Search your niche or add competitors first.</p>}
          </Card>
          {error && <AiErrorNote error={error} />}
          {running && (
            <Card>
              <Spinner label="Mitra is studying the breakouts…" />
            </Card>
          )}
          {ideas && !running && (
            <div className="rise space-y-4">
              {ideas.demo && <AiDemoNote reason={ideas.demoReason} what="set of ideas" />}
              <Card>
                <p className="font-indic text-sm leading-relaxed">{ideas.data.summary}</p>
                {ideas.data.patterns.length > 0 && (
                  <>
                    <h3 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider text-muted">Why they broke out</h3>
                    <ul className="list-disc space-y-1 pl-5 font-indic text-sm">
                      {ideas.data.patterns.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </>
                )}
              </Card>
              {ideas.data.ideas.map((i) => (
                <Card key={i.title}>
                  <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold">{i.format === "short" ? "Short" : "Long video"}</span>
                  <h3 className="mt-2 font-indic text-lg font-semibold leading-snug">{i.title}</h3>
                  <p className="mt-2 font-indic text-sm">
                    <span className="font-semibold">First 5 seconds: </span>
                    {i.hook}
                  </p>
                  <p className="mt-1 font-indic text-sm text-ink-2">{i.why}</p>
                  <p className="mt-2 text-xs text-muted">Inspired by: {i.inspiredBy}</p>
                  <Link href={`/dashboard/studio?topic=${encodeURIComponent(i.title)}`} className="mt-3 inline-block text-sm font-semibold text-accent hover:underline">
                    Make titles & thumbnail →
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
