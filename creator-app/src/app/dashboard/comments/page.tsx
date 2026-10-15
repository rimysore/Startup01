"use client";

import { useEffect, useState } from "react";
import { postAi, useDashboard, type AiError } from "@/components/dashboard-context";
import { EmotionBars } from "@/components/insights";
import { AiDemoNote, AiErrorNote, Button, Card, DemoNote, PageHeader, Select, Spinner } from "@/components/ui";
import type { CommentInsights } from "@/lib/ai";
import type { Comment } from "@/lib/types";

interface CommentsRes {
  mode: string;
  comments: Comment[];
  error?: string;
}

function MoodBar({ mood }: { mood: CommentInsights["mood"] }) {
  const parts = [
    { key: "Positive", v: mood.positive, color: "var(--good)" },
    { key: "Neutral", v: mood.neutral, color: "var(--chart-compare)" },
    { key: "Negative", v: mood.negative, color: "var(--bad)" },
  ];
  const total = parts.reduce((a, p) => a + p.v, 0) || 1;
  return (
    <div>
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={parts.map((p) => `${p.key} ${p.v}%`).join(", ")}>
        {parts.map((p) => (
          <div key={p.key} style={{ width: `${(p.v / total) * 100}%`, background: p.color }} />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-ink-2">
        {parts.map((p) => (
          <span key={p.key} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            {p.key} <span className="font-semibold text-ink">{Math.round(p.v)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function CommentsPage() {
  const { summary, language, refreshMe } = useDashboard();
  const [picked, setPicked] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<{ id: string; data: CommentsRes } | null>(null);
  const [insights, setInsights] = useState<{ id: string; demo?: boolean; demoReason?: "signin" | "nokey"; data: CommentInsights } | null>(null);
  const [error, setError] = useState<AiError | null>(null);
  const [running, setRunning] = useState(false);

  const videoId = picked ?? summary?.videos[0]?.id ?? null;
  const comments = loaded?.id === videoId ? loaded.data : null;
  const result = insights?.id === videoId ? insights : null;

  useEffect(() => {
    if (!videoId) return;
    let live = true;
    fetch(`/api/videos/${encodeURIComponent(videoId)}/comments`)
      .then((r) => r.json())
      .then((data: CommentsRes) => live && setLoaded({ id: videoId, data }));
    return () => {
      live = false;
    };
  }, [videoId]);

  if (!summary) return <Spinner label="Loading" />;

  async function analyse() {
    if (!comments?.comments.length || !videoId) return;
    const id = videoId;
    setRunning(true);
    setError(null);
    const res = await postAi<CommentInsights>("/api/ai/comments", {
      language,
      comments: comments.comments.slice(0, 60).map(({ author, text, likes }) => ({ author: author.slice(0, 100), text: text.slice(0, 1000), likes })),
    });
    setRunning(false);
    refreshMe();
    if (res.result) setInsights({ id, demo: res.demo, demoReason: res.demoReason, data: res.result });
    else setError(res.error ?? { message: "Something went wrong." });
  }

  return (
    <div className="rise">
      <PageHeader eyebrow="Comment Insights" title="What your viewers are really saying">
        <Button onClick={analyse} disabled={running || !comments?.comments.length}>
          {running ? "Reading…" : "Summarise comments"}
        </Button>
      </PageHeader>

      <div className="mb-6 max-w-md">
        <Select
          label="Video"
          value={videoId ?? ""}
          onChange={(v) => {
            setPicked(v);
            setError(null);
          }}
          options={summary.videos.map((v) => ({ value: v.id, label: v.title }))}
        />
      </div>

      {error && <div className="mb-4"><AiErrorNote error={error} /></div>}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card className="lg:max-h-[640px] lg:overflow-y-auto">
          <h2 className="mb-3 font-semibold">Top comments</h2>
          {!comments ? (
            <Spinner label="Loading comments" />
          ) : comments.comments.length ? (
            <ul className="divide-y divide-line">
              {comments.comments.map((c) => (
                <li key={c.id} className="py-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold">{c.author}</span>
                    <span className="text-xs text-muted">♥ {c.likes}</span>
                  </div>
                  <p className="mt-1 font-indic text-sm text-ink-2">{c.text}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">{comments.error ?? "No comments yet."}</p>
          )}
          {comments?.mode === "demo" && <div className="mt-3"><DemoNote>Demo comments.</DemoNote></div>}
        </Card>

        <div className="space-y-6">
          {running && <Card><Spinner label="Mitra is reading every comment…" /></Card>}
          {!result && !running && (
            <Card className="grain flex min-h-[240px] flex-col items-center justify-center text-center">
              <p className="font-display text-3xl">Hundreds of comments, one clear picture.</p>
              <p className="mt-2 max-w-sm text-sm text-muted">Mood, recurring requests, questions worth a video, and reply drafts — in mixed Hindi, English and regional scripts.</p>
            </Card>
          )}
          {result && !running && (
            <div className="rise space-y-6">
              {result.demo && <AiDemoNote reason={result.demoReason} what="analysis" />}
              <Card>
                <h3 className="mb-3 font-semibold">Mood</h3>
                <MoodBar mood={result.data.mood} />
                {result.data.emotions?.length > 0 && (
                  <>
                    <h3 className="mb-3 mt-6 font-semibold">Emotions</h3>
                    <EmotionBars emotions={result.data.emotions} />
                  </>
                )}
              </Card>
              <Card>
                <h3 className="mb-4 font-semibold">Themes</h3>
                <ul className="space-y-4">
                  {result.data.themes.map((t) => (
                    <li key={t.theme}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="font-medium">{t.theme}</span>
                        <span className="tabular-nums text-muted">{Math.round(t.share)}%</span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-surface-2">
                        <div className="h-1.5 rounded-full bg-accent" style={{ width: `${Math.min(100, t.share)}%` }} />
                      </div>
                      <p className="mt-1.5 font-indic text-xs italic text-muted">“{t.example}”</p>
                    </li>
                  ))}
                </ul>
              </Card>
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <h3 className="mb-3 font-semibold">Questions to answer</h3>
                  <ul className="space-y-2 text-sm">{result.data.questions.map((q) => <li key={q}>❓ {q}</li>)}</ul>
                </Card>
                <Card>
                  <h3 className="mb-3 font-semibold">Video ideas from comments</h3>
                  <ul className="space-y-2 text-sm">{result.data.videoIdeas.map((q) => <li key={q}>💡 {q}</li>)}</ul>
                </Card>
              </div>
              <Card>
                <h3 className="mb-3 font-semibold">Reply drafts</h3>
                <ul className="space-y-3">
                  {result.data.replies.map((r) => (
                    <li key={r.to + r.reply} className="rounded-xl bg-surface-2 p-3">
                      <p className="text-xs font-semibold text-muted">To {r.to}</p>
                      <p className="mt-1 font-indic text-sm">{r.reply}</p>
                      <button onClick={() => navigator.clipboard?.writeText(r.reply)} className="mt-2 text-xs font-semibold text-accent">
                        Copy reply
                      </button>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
