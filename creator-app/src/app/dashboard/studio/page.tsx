"use client";

import { useState } from "react";
import { postAi, useDashboard, useQueryParam, type AiError } from "@/components/dashboard-context";
import { ThumbnailMaker } from "@/components/ThumbnailMaker";
import { AiDemoNote, AiErrorNote, Button, Card, PageHeader, Select, Spinner } from "@/components/ui";
import type { Titles } from "@/lib/ai";
import { languageLabel } from "@/lib/languages";

const TONES = ["Energetic", "Honest & trustworthy", "Funny", "Educational", "Dramatic"];

export default function StudioPage() {
  const { summary, language, refreshMe } = useDashboard();
  const prefill = useQueryParam("topic");
  const [typed, setTopic] = useState<string | null>(null);
  const topic = typed ?? prefill ?? "";
  const [tone, setTone] = useState(TONES[0]);
  const [result, setResult] = useState<{ demo?: boolean; demoReason?: "signin" | "nokey"; data: Titles } | null>(null);
  const [error, setError] = useState<AiError | null>(null);
  const [running, setRunning] = useState(false);
  const [thumbText, setThumbText] = useState("कौन जीता?");

  async function generate() {
    setRunning(true);
    setError(null);
    const res = await postAi<Titles>("/api/ai/titles", { language, topic, tone, channel: summary?.channel.title ?? "" });
    setRunning(false);
    if (res.result) {
      setResult({ demo: res.demo, demoReason: res.demoReason, data: res.result });
      if (res.result.thumbnailText[0]) setThumbText(res.result.thumbnailText[0]);
    } else setError(res.error ?? { message: "Something went wrong." });
    refreshMe();
  }

  return (
    <div className="rise">
      <PageHeader eyebrow="Title & Thumbnail Studio" title="Package it so people click" />

      <Card>
        <div className="grid gap-4 md:grid-cols-[1fr_220px]">
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">
            What is your video about?
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={3}
              placeholder="e.g. Testing 3 phones under ₹20,000 for night photography in Lucknow"
              maxLength={500}
              className="rounded-xl border border-line bg-surface px-3 py-2 text-base text-ink outline-none focus:border-accent"
            />
          </label>
          <div className="flex flex-col gap-3">
            <Select label="Tone" value={tone} onChange={setTone} options={TONES.map((t) => ({ value: t, label: t }))} />
            <p className="text-xs text-muted">Writing in <span className="font-semibold text-ink">{languageLabel(language)}</span> — change it in the top bar.</p>
            <Button onClick={generate} disabled={running || topic.trim().length < 3}>
              {running ? "Writing…" : "Generate titles"}
            </Button>
          </div>
        </div>
      </Card>

      {error && <div className="mt-4"><AiErrorNote error={error} /></div>}
      {running && <Card className="mt-6"><Spinner label="Mitra is writing options…" /></Card>}

      {result && !running && (
        <div className="rise mt-6 space-y-6">
          {result.demo && <AiDemoNote reason={result.demoReason} what="set of titles" />}
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Card>
              <h2 className="mb-4 font-semibold">Title options</h2>
              <ul className="space-y-4">
                {[...result.data.titles].sort((a, b) => b.strength - a.strength).map((t) => (
                  <li key={t.title} className="group">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium">{t.title}</p>
                      <button
                        onClick={() => navigator.clipboard?.writeText(t.title)}
                        className="shrink-0 rounded-full border border-line px-3 py-1 text-xs opacity-70 hover:opacity-100"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3">
                      <div className="h-1.5 w-24 rounded-full bg-surface-2">
                        <div className="h-1.5 rounded-full bg-accent" style={{ width: `${Math.min(10, t.strength) * 10}%` }} />
                      </div>
                      <span className="text-xs tabular-nums text-muted">{t.strength}/10 click strength</span>
                    </div>
                    <p className="mt-1 text-sm text-ink-2">{t.why}</p>
                    <p className={`mt-1 text-xs ${t.title.length > 70 ? "text-bad" : "text-muted"}`}>{t.title.length} characters</p>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="bg-ink text-bg !border-ink">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">First 15 seconds</p>
              <p className="mt-3 font-display text-2xl leading-snug">{result.data.hook}</p>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-accent">Thumbnail text</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.data.thumbnailText.map((t) => (
                  <button key={t} onClick={() => setThumbText(t)} className="rounded-full bg-bg/10 px-4 py-2 font-indic text-sm font-semibold hover:bg-bg/20">
                    {t}
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      <Card className="mt-6">
        <h2 className="mb-1 font-semibold">Thumbnail maker</h2>
        <p className="mb-4 text-sm text-muted">Hindi, Telugu and other scripts render correctly here. Add your photo, pick a style, download.</p>
        <ThumbnailMaker text={thumbText} onTextChange={setThumbText} />
      </Card>
    </div>
  );
}
