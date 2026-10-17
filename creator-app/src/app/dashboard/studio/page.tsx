"use client";

import { useState } from "react";
import { postAi, useDashboard, useQueryParam, type AiError } from "@/components/dashboard-context";
import { defaultDesign, loadPhoto, ThumbnailMaker, type Photo } from "@/components/ThumbnailMaker";
import { AiDemoNote, AiErrorNote, Card, DemoNote, PageHeader, Spinner } from "@/components/ui";
import type { ThumbnailDesign, Titles } from "@/lib/ai";
import { compact } from "@/lib/format";
import type { ProvenVideo } from "@/lib/ideas";
import { languageLabel } from "@/lib/languages";
import { FEATURE_CREDITS } from "@/lib/plans";

const TONES = ["Energetic", "Honest", "Funny", "Educational", "Dramatic"];
const MAX_REFS = 3;

interface Research {
  mode: "live" | "demo";
  query: string;
  videos: ProvenVideo[];
  left?: number;
}

function Step({ n, label, done, active }: { n: number; label: string; done: boolean; active: boolean }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
          done ? "bg-brand text-white" : active ? "bg-ink text-bg" : "bg-surface-2 text-muted"
        }`}
      >
        {done ? "✓" : n}
      </span>
      <span className={`text-sm font-semibold ${done || active ? "text-ink" : "text-muted"}`}>{label}</span>
    </li>
  );
}

function Strength({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${value} out of 10 click strength`}>
      {Array.from({ length: 10 }, (_, i) => (
        <span key={i} className={`h-2 w-1.5 rounded-sm ${i < value ? (value >= 8 ? "bg-good" : "bg-accent") : "bg-surface-2"}`} />
      ))}
    </span>
  );
}

export default function StudioPage() {
  const { summary, language, refreshMe, me } = useDashboard();
  const prefill = useQueryParam("topic");
  const [typed, setTopic] = useState<string | null>(null);
  const topic = typed ?? prefill ?? "";
  const [tone, setTone] = useState(TONES[0]);

  const [phase, setPhase] = useState<"idle" | "research" | "titles">("idle");
  const [research, setResearch] = useState<Research | null>(null);
  const [researchNote, setResearchNote] = useState<string | null>(null);
  const [refs, setRefs] = useState<string[]>([]);
  const [result, setResult] = useState<{ demo?: boolean; demoReason?: "signin" | "nokey"; data: Titles } | null>(null);
  const [error, setError] = useState<AiError | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const [design, setDesign] = useState<ThumbnailDesign>(() => defaultDesign("कौन जीता?"));
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [background, setBackground] = useState<{ img: HTMLImageElement; credit: string | null; query: string; n: number; count: number; ai: boolean } | null>(null);
  const [designing, setDesigning] = useState(false);
  const [painting, setPainting] = useState(false);
  const [mode, setMode] = useState<"ai" | "blend">("ai");
  const [designNote, setDesignNote] = useState<{ demo?: boolean; demoReason?: "signin" | "nokey"; error?: AiError } | null>(null);
  const setThumbText = (t: string) => setDesign((d) => ({ ...d, headline: t }));
  const busy = phase !== "idle";
  const canAi = me?.config.images;

  /** Step 1 + 2: research what already went viral for this topic, then write titles that learn from it. */
  async function researchAndWrite() {
    setError(null);
    setResearchNote(null);
    setPhase("research");
    const r = await fetch("/api/studio/research", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic, language }) }).catch(() => null);
    const d = (await r?.json().catch(() => null)) as (Research & { error?: string }) | null;
    let found: ProvenVideo[] = [];
    if (r?.ok && d?.videos) {
      setResearch(d);
      found = d.videos;
      setRefs(d.videos.filter((v) => v.thumbnail).slice(0, MAX_REFS).map((v) => v.id));
      if (!d.videos.length) setResearchNote("No big hits for this exact topic yet, so Mitra wrote titles from your description. Try fewer, broader words.");
    } else {
      setResearch(null);
      setRefs([]);
      setResearchNote(d?.error ?? "Couldn't research YouTube right now, so Mitra wrote titles from your description.");
    }
    setPhase("titles");
    const res = await postAi<Titles>("/api/ai/titles", {
      language,
      topic,
      tone,
      channel: summary?.channel.title ?? "",
      research: found.slice(0, 8).map((v) => ({ title: v.title, views: v.views, score: v.score })),
    });
    setPhase("idle");
    refreshMe();
    if (res.result) {
      setResult({ demo: res.demo, demoReason: res.demoReason, data: res.result });
      const best = [...res.result.titles].sort((a, b) => b.strength - a.strength)[0];
      setChosen(best?.title ?? null);
      if (res.result.thumbnailText[0]) setThumbText(res.result.thumbnailText[0]);
    } else setError(res.error ?? { message: "Something went wrong." });
  }

  function toggleRef(id: string) {
    setRefs((r) => (r.includes(id) ? r.filter((x) => x !== id) : r.length >= MAX_REFS ? [...r.slice(1), id] : [...r, id]));
  }

  function copy(text: string) {
    void navigator.clipboard?.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied((c) => (c === text ? null : c)), 1500);
  }

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

  /** A stock photo for the AI's search words. Quietly keeps the drawn background if none is available. */
  async function loadBackground(query: string, n: number) {
    if (!query) return setBackground(null);
    const res = await fetch(`/api/thumbnail/background?${new URLSearchParams({ q: query, n: String(n) })}`).catch(() => null);
    if (!res?.ok) return setBackground(null);
    await showImage(res, { query, n, count: Number(res.headers.get("X-Photo-Count")) || 1, ai: false });
  }

  /** Paints a new background with the free image model (1 credit, free on the Founder Pass). */
  async function paintBackground(prompt: string) {
    if (!prompt.trim()) return;
    setPainting(true);
    const res = await fetch("/api/thumbnail/background", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) }).catch(() => null);
    if (res?.ok) await showImage(res, { query: prompt, n: 0, count: 1, ai: true });
    else {
      const body = (await res?.json().catch(() => null)) as { error?: string; upgrade?: boolean; detail?: string } | null;
      setDesignNote({ error: { message: body?.error ?? "Couldn't make a background right now.", upgrade: body?.upgrade, detail: body?.detail } });
    }
    setPainting(false);
    refreshMe();
  }

  async function designWithMitra() {
    setDesigning(true);
    setDesignNote(null);
    const res = await postAi<ThumbnailDesign>("/api/ai/thumbnail", {
      language,
      title: (chosen ?? topic).trim() || design.headline,
      text: design.headline,
      images: photos.map((p) => ({ mediaType: "image/jpeg", data: p.data })),
      references: research?.mode === "live" ? refs : [],
      blend: mode === "blend",
    });
    setDesigning(false);
    refreshMe();
    if (!res.result) return setDesignNote({ error: res.error ?? { message: "Something went wrong." } });
    const d = res.result;
    setDesign(d);
    setDesignNote({ demo: res.demo, demoReason: res.demoReason });
    // A generated or stock background only when the creator's own photos don't already fill it.
    if (mode === "blend") return setBackground(null);
    const ownBackground = d.images.some((im) => im.role === "background") || (d.layout === "full-bleed" && photos.length > 0) || (d.layout === "split" && photos.length > 1);
    if (ownBackground || res.demo) setBackground(null);
    else if (canAi) await paintBackground(d.imagePrompt || d.backgroundQuery);
    else await loadBackground(d.backgroundQuery, 0);
  }

  async function addPhotos(files: FileList | null) {
    if (!files) return;
    const added = await Promise.all([...files].slice(0, 5 - photos.length).map((f) => loadPhoto(f).catch(() => null)));
    setPhotos([...photos, ...added.filter((p): p is Photo => p != null)]);
    // New photos invalidate the AI's per-photo plan; keep the text and colours.
    setDesign((d) => ({ ...d, images: [] }));
  }

  const titles = result ? [...result.data.titles].sort((a, b) => b.strength - a.strength) : [];

  return (
    <div className="rise">
      <PageHeader eyebrow="Title & Thumbnail Studio" title="Package it so people click" />

      <ol className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2" aria-label="Steps">
        <Step n={1} label="Research hits" done={Boolean(research || researchNote) && phase !== "research"} active={phase === "research"} />
        <Step n={2} label="Pick a title" done={Boolean(result)} active={phase === "titles"} />
        <Step n={3} label="Make the thumbnail" done={Boolean(designNote && !designNote.error)} active={Boolean(result) && !designNote} />
      </ol>

      <Card className="relative overflow-hidden">
        <div className="bg-brand pointer-events-none absolute inset-x-0 top-0 h-1" aria-hidden />
        <label htmlFor="topic" className="text-sm font-semibold">
          What is your video about?
        </label>
        <textarea
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          rows={3}
          placeholder="e.g. Testing 3 phones under ₹20,000 for night photography in Lucknow"
          maxLength={500}
          className="mt-2 w-full resize-none rounded-2xl border border-line bg-surface px-4 py-3 font-indic text-base text-ink outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label="Tone">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-muted">Tone</span>
          {TONES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTone(t)}
              aria-pressed={tone === t}
              className={`rounded-full px-3.5 py-1.5 text-sm transition ${tone === t ? "bg-ink text-bg" : "border border-line text-ink-2 hover:bg-surface-2"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            Mitra first looks up videos on this topic that went viral in India this year, then writes in{" "}
            <span className="font-semibold text-ink">{languageLabel(language)}</span>.
          </p>
          <button
            onClick={researchAndWrite}
            disabled={busy || topic.trim().length < 3}
            className="bg-brand shrink-0 rounded-full px-6 py-3.5 text-base font-bold text-white shadow-[0_12px_30px_-12px_rgba(217,70,239,0.6)] transition hover:brightness-110 disabled:opacity-50"
          >
            {phase === "research" ? "Researching YouTube…" : phase === "titles" ? "Writing titles…" : `Research & write titles · ${FEATURE_CREDITS.titles} credit`}
          </button>
        </div>
      </Card>

      {error && (
        <div className="mt-4">
          <AiErrorNote error={error} />
        </div>
      )}

      {(phase === "research" || research || researchNote) && (
        <Card className="mt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-semibold">What&apos;s working on YouTube</h2>
            {research && (
              <p className="text-xs text-muted">
                “{research.query}” · India · last 12 months{research.left != null && research.mode === "live" ? ` · ${research.left} searches left today` : ""}
              </p>
            )}
          </div>
          {research?.mode === "demo" && (
            <div className="mt-3">
              <DemoNote>Sample hits. Connect YouTube to research real videos on your topic.</DemoNote>
            </div>
          )}
          {phase === "research" && (
            <div className="mt-4">
              <Spinner label="Finding the videos that won on this topic" />
            </div>
          )}
          {researchNote && phase !== "research" && <p className="mt-3 text-sm text-muted">{researchNote}</p>}
          {research && research.videos.length > 0 && phase !== "research" && (
            <>
              <p className="mt-1 text-xs text-muted">Tap up to {MAX_REFS} thumbnails for Mitra to study when it designs yours.</p>
              <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {research.videos.map((v) => {
                  const on = refs.includes(v.id);
                  return (
                    <li key={v.id} className="min-w-0">
                      <button
                        type="button"
                        onClick={() => v.thumbnail && toggleRef(v.id)}
                        aria-pressed={on}
                        className={`group relative block w-full overflow-hidden rounded-xl ring-offset-2 ring-offset-surface transition ${on ? "ring-2 ring-accent" : "hover:opacity-90"}`}
                      >
                        {v.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element -- YouTube thumbnail
                          <img src={v.thumbnail} alt="" className="aspect-video w-full object-cover" />
                        ) : (
                          <div className="grid aspect-video w-full place-items-center bg-surface-2 text-2xl" aria-hidden>
                            🔥
                          </div>
                        )}
                        {v.score != null && v.score >= 1.5 && (
                          <span className="bg-brand absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold text-white">{v.score >= 10 ? Math.round(v.score) : v.score.toFixed(1)}× subs</span>
                        )}
                        {on && <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-accent text-xs font-bold text-accent-ink">✓</span>}
                      </button>
                      <a href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noreferrer" className="mt-1.5 line-clamp-2 font-indic text-xs font-medium hover:underline">
                        {v.title}
                      </a>
                      <p className="mt-0.5 truncate text-[11px] text-muted">
                        {compact(v.views)} views · {v.channelTitle}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </Card>
      )}

      {phase === "titles" && (
        <Card className="mt-6">
          <Spinner label="Mitra is writing titles from what's working…" />
        </Card>
      )}

      {result && phase === "idle" && (
        <div className="rise mt-6 space-y-6">
          {result.demo && <AiDemoNote reason={result.demoReason} what="set of titles" />}
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <Card>
              <h2 className="font-semibold">Pick your title</h2>
              <p className="mt-1 text-xs text-muted">The one you pick is used to design the thumbnail.</p>
              <ul className="mt-4 space-y-3">
                {titles.map((t, i) => {
                  const on = chosen === t.title;
                  return (
                    <li key={t.title}>
                      <div
                        className={`rounded-2xl border p-4 transition ${on ? "border-accent bg-accent-soft" : "border-line hover:border-ink-2/40"}`}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          {i === 0 && <span className="bg-brand rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white">Mitra&apos;s pick</span>}
                          {t.pattern && <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-semibold text-ink-2">{t.pattern}</span>}
                          <span className="ml-auto flex items-center gap-2 text-[11px] tabular-nums text-muted">
                            <Strength value={t.strength} /> {t.strength}/10
                          </span>
                        </div>
                        <p className="mt-2 font-indic text-lg font-semibold leading-snug">{t.title}</p>
                        <p className="mt-1 text-sm text-ink-2">{t.why}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => setChosen(t.title)}
                            aria-pressed={on}
                            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${on ? "bg-ink text-bg" : "border border-line hover:bg-surface-2"}`}
                          >
                            {on ? "✓ Using this" : "Use this"}
                          </button>
                          <button onClick={() => copy(t.title)} className="rounded-full border border-line px-3.5 py-1.5 text-xs font-semibold hover:bg-surface-2">
                            {copied === t.title ? "Copied!" : "Copy"}
                          </button>
                          <span className={`ml-auto text-[11px] tabular-nums ${t.title.length > 70 ? "font-semibold text-bad" : "text-muted"}`}>{t.title.length}/70</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
            <div className="space-y-6">
              <Card className="!border-ink bg-ink text-bg">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Say this in the first 15 seconds</p>
                <p className="mt-3 font-indic text-xl leading-snug">{result.data.hook}</p>
                <button onClick={() => copy(result.data.hook)} className="mt-4 rounded-full bg-bg/10 px-3.5 py-1.5 text-xs font-semibold hover:bg-bg/20">
                  {copied === result.data.hook ? "Copied!" : "Copy script"}
                </button>
              </Card>
              <Card>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Thumbnail text</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {result.data.thumbnailText.map((t) => (
                    <button
                      key={t}
                      onClick={() => setThumbText(t)}
                      aria-pressed={design.headline === t}
                      className={`rounded-xl px-4 py-2 font-indic text-base font-extrabold ${design.headline === t ? "bg-brand text-white" : "bg-surface-2 hover:bg-accent-soft"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      <Card className="mt-6">
        <h2 className="font-semibold">Thumbnail</h2>
        <p className="mt-1 text-sm text-muted">
          Full HD (1920×1080){refs.length && research?.mode === "live" ? `, styled after the ${refs.length} hit${refs.length === 1 ? "" : "s"} you picked` : ""}. Drag and resize anything after;
          Indian scripts always render correctly.
        </p>
        <div className="mt-5 grid gap-6 lg:grid-cols-[250px_1fr]">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Choose your style</p>
            {(
              [
                { id: "ai", emoji: "🎨", name: "AI image", text: "Mitra paints a full-HD scene for your topic. Add your face photo if you like." },
                { id: "blend", emoji: "📸", name: "Blend my photos", text: "Upload 3 or more photos. Mitra cuts you out and blends them like top YouTubers do." },
              ] as const
            ).map((o) => (
              <button
                key={o.id}
                onClick={() => setMode(o.id)}
                aria-pressed={mode === o.id}
                className={`block w-full rounded-2xl border-2 p-4 text-left transition ${mode === o.id ? "border-accent bg-accent-soft" : "border-line hover:border-ink-2/40"}`}
              >
                <span className="flex items-center gap-2 font-semibold">
                  <span className="text-xl" aria-hidden>
                    {o.emoji}
                  </span>
                  {o.name}
                  {mode === o.id && <span className="ml-auto grid h-5 w-5 place-items-center rounded-full bg-accent text-[11px] font-bold text-accent-ink">✓</span>}
                </span>
                <span className="mt-1 block text-xs text-ink-2">{o.text}</span>
              </button>
            ))}

            {mode === "blend" && (
              <div className="rounded-2xl border border-dashed border-line p-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>Your photos</span>
                  <span className={photos.length >= 3 ? "text-good" : "text-muted"}>{photos.length}/3 needed · max 5</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div className="bg-brand h-full rounded-full transition-all" style={{ width: `${Math.min(100, (photos.length / 3) * 100)}%` }} />
                </div>
                <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-surface-2 px-3 py-3 text-sm font-semibold hover:bg-accent-soft">
                  + Add photos
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} aria-label="Add photos to blend" />
                </label>
                <p className="mt-2 text-[11px] text-muted">Best mix: 1 clear photo of you, 1 of the place, 1-3 of the thing you show.</p>
              </div>
            )}

            <button
              onClick={designWithMitra}
              disabled={designing || (mode === "blend" ? photos.length < 3 : (chosen ?? topic).trim().length < 3 && design.headline.trim().length < 3)}
              className="bg-brand w-full rounded-full px-5 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {designing ? "Designing…" : mode === "blend" ? `✨ Blend with Mitra · ${FEATURE_CREDITS.thumbnail}` : `✨ Design with Mitra · ${FEATURE_CREDITS.thumbnail}`}
            </button>
            {mode === "ai" && canAi && (
              <button
                onClick={() => paintBackground(design.imagePrompt || design.backgroundQuery || chosen || topic)}
                disabled={painting || !(design.imagePrompt || design.backgroundQuery || chosen || topic).trim()}
                className="w-full rounded-full border border-line px-4 py-2.5 text-sm font-semibold hover:bg-surface-2 disabled:opacity-50"
              >
                {painting ? "Painting…" : `🎨 New AI background · ${FEATURE_CREDITS.image}`}
              </button>
            )}
            {mode === "ai" && background && !background.ai && background.count > 1 && (
              <button onClick={() => loadBackground(background.query, (background.n + 1) % background.count)} className="w-full rounded-full border border-line px-4 py-2.5 text-sm font-semibold hover:bg-surface-2">
                Another photo
              </button>
            )}
            {designNote?.error && <AiErrorNote error={designNote.error} />}
            {designNote?.demo && <AiDemoNote reason={designNote.demoReason} what="thumbnail design" />}
            {(designing || painting) && <Spinner label={designing ? "Mitra is designing…" : "Painting a full-HD background…"} />}
          </div>

          <div className="min-w-0">
            <ThumbnailMaker
              design={design}
              onDesignChange={setDesign}
              photos={photos}
              onPhotosChange={setPhotos}
              background={mode === "ai" ? (background?.img ?? null) : null}
              credit={mode === "ai" ? (background?.credit ?? null) : null}
              blend={mode === "blend"}
            />
            <p className="mt-3 text-xs text-muted">
              {mode === "blend" ? "Cutting you out happens on your device. " : ""}Photos are only sent (as small copies) when you press Design or Blend with Mitra, to plan the
              layout, and aren&apos;t kept.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
