"use client";

import { useState } from "react";
import { postAi, useDashboard, useQueryParam, type AiError } from "@/components/dashboard-context";
import { defaultDesign, ThumbnailMaker, type Photo } from "@/components/ThumbnailMaker";
import { AiDemoNote, AiErrorNote, Button, Card, PageHeader, Select, Spinner } from "@/components/ui";
import type { ThumbnailDesign, Titles } from "@/lib/ai";
import { FEATURE_CREDITS } from "@/lib/plans";
import { languageLabel } from "@/lib/languages";

const TONES = ["Energetic", "Honest & trustworthy", "Funny", "Educational", "Dramatic"];

export default function StudioPage() {
  const { summary, language, refreshMe, me } = useDashboard();
  const prefill = useQueryParam("topic");
  const [typed, setTopic] = useState<string | null>(null);
  const topic = typed ?? prefill ?? "";
  const [tone, setTone] = useState(TONES[0]);
  const [result, setResult] = useState<{ demo?: boolean; demoReason?: "signin" | "nokey"; data: Titles } | null>(null);
  const [error, setError] = useState<AiError | null>(null);
  const [running, setRunning] = useState(false);
  const [design, setDesign] = useState<ThumbnailDesign>(() => defaultDesign("कौन जीता?"));
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [background, setBackground] = useState<{ img: HTMLImageElement; credit: string | null; query: string; n: number; count: number; ai: boolean } | null>(null);
  const [designing, setDesigning] = useState(false);
  const [painting, setPainting] = useState(false);
  const [designNote, setDesignNote] = useState<{ demo?: boolean; demoReason?: "signin" | "nokey"; error?: AiError } | null>(null);
  const setThumbText = (t: string) => setDesign((d) => ({ ...d, headline: t }));

  function showImage(res: Response, extra: { query: string; n: number; count: number; ai: boolean }) {
    return res.blob().then(
      (blob) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            const credit = res.headers.get("X-Photo-Credit");
            setBackground({ img, credit: credit && decodeURIComponent(credit), ...extra });
            resolve();
          };
          img.onerror = () => resolve();
          img.src = URL.createObjectURL(blob);
        }),
    );
  }

  /** Fetches a stock photo for the AI's search words. Quietly keeps the drawn background if none is available. */
  async function loadBackground(query: string, n: number) {
    if (!query) return setBackground(null);
    const res = await fetch(`/api/thumbnail/background?${new URLSearchParams({ q: query, n: String(n) })}`).catch(() => null);
    if (!res?.ok) return setBackground(null);
    await showImage(res, { query, n, count: Number(res.headers.get("X-Photo-Count")) || 1, ai: false });
  }

  /** Paints a new background with the image model (1 credit). */
  async function paintBackground(prompt: string) {
    if (!prompt.trim()) return;
    setPainting(true);
    const res = await fetch("/api/thumbnail/background", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    }).catch(() => null);
    if (res?.ok) await showImage(res, { query: prompt, n: 0, count: 1, ai: true });
    else {
      const body = (await res?.json().catch(() => null)) as { error?: string; upgrade?: boolean } | null;
      setDesignNote({ error: { message: body?.error ?? "Couldn't make a background right now.", upgrade: body?.upgrade } });
    }
    setPainting(false);
    refreshMe();
  }

  async function designWithMitra() {
    setDesigning(true);
    setDesignNote(null);
    const res = await postAi<ThumbnailDesign>("/api/ai/thumbnail", {
      language,
      title: topic.trim() || design.headline,
      text: design.headline,
      images: photos.map((p) => ({ mediaType: "image/jpeg", data: p.data })),
    });
    setDesigning(false);
    refreshMe();
    if (!res.result) return setDesignNote({ error: res.error ?? { message: "Something went wrong." } });
    const d = res.result;
    setDesign(d);
    setDesignNote({ demo: res.demo, demoReason: res.demoReason });
    // A stock photo only when the creator's own photos don't already fill the background.
    const ownBackground = d.images.some((im) => im.role === "background") || (d.layout === "full-bleed" && photos.length > 0) || (d.layout === "split" && photos.length > 1);
    if (ownBackground || res.demo) setBackground(null);
    else if (me?.config.images) await paintBackground(d.imagePrompt || d.backgroundQuery);
    else await loadBackground(d.backgroundQuery, 0);
  }

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
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">Thumbnail maker</h2>
            <p className="mt-1 max-w-xl text-sm text-muted">
              Add your photos (optional), then let Mitra design it: layout, crop, colours, text and a matching background photo. Everything stays
              editable, and Hindi, Telugu and other scripts render correctly.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {me?.config.images && design.imagePrompt && (
              <Button variant="ghost" onClick={() => paintBackground(design.imagePrompt)} disabled={painting}>
                {painting ? "Painting…" : `New AI background · ${FEATURE_CREDITS.image} credit`}
              </Button>
            )}
            {background && !background.ai && background.count > 1 && (
              <Button variant="ghost" onClick={() => loadBackground(background.query, (background.n + 1) % background.count)}>
                Another background
              </Button>
            )}
            <Button onClick={designWithMitra} disabled={designing || (topic.trim().length < 3 && design.headline.trim().length < 3)}>
              {designing ? "Designing…" : `Design with Mitra · ${FEATURE_CREDITS.thumbnail} credit`}
            </Button>
          </div>
        </div>
        {designNote?.error && <div className="mb-4"><AiErrorNote error={designNote.error} /></div>}
        {designNote?.demo && <div className="mb-4"><AiDemoNote reason={designNote.demoReason} what="thumbnail design" /></div>}
        <ThumbnailMaker
          design={design}
          onDesignChange={setDesign}
          photos={photos}
          onPhotosChange={setPhotos}
          background={background?.img ?? null}
          credit={background?.credit ?? null}
        />
        <p className="mt-3 text-xs text-muted">
          Photos stay in your browser until you press Design with Mitra; then a small copy is sent to our AI provider to plan the layout and isn&apos;t kept.
        </p>
      </Card>
    </div>
  );
}
