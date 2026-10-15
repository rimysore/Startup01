"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./ui";

const STYLES = [
  { name: "Marigold", from: "#ff7a1a", to: "#b3261e", text: "#ffffff", stroke: "#1a0f05", band: "#ffd23f" },
  { name: "Night", from: "#0e0d0b", to: "#2b2357", text: "#ffd23f", stroke: "#000000", band: "#ff4d6d" },
  { name: "Peacock", from: "#0b6e6c", to: "#062b3a", text: "#ffffff", stroke: "#001014", band: "#ff8a3d" },
  { name: "Paper", from: "#fff6e5", to: "#f2d7a6", text: "#17140f", stroke: "#ffffff", band: "#e2620b" },
] as const;

const W = 1280;
const H = 720;

/** Wraps text into at most `maxLines` lines that fit `maxWidth` at the current font. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines.slice(0, maxLines);
}

/**
 * Draws a 1280x720 thumbnail on a canvas. The browser's text shaper renders Devanagari, Telugu, Tamil etc.
 * correctly — which most AI image generators still get wrong.
 */
export function ThumbnailMaker({ text, onTextChange }: { text: string; onTextChange: (t: string) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const fontProbe = useRef<HTMLSpanElement>(null);
  const [badge, setBadge] = useState("NEW");
  const [style, setStyle] = useState(0);
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx || !fontProbe.current) return;
    const family = getComputedStyle(fontProbe.current).fontFamily;
    const s = STYLES[style];

    const draw = () => {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, s.from);
      g.addColorStop(1, s.to);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      if (photo) {
        // Cover the right 48% with the photo, fading into the background.
        const pw = W * 0.48;
        const scale = Math.max(pw / photo.width, H / photo.height);
        const dw = photo.width * scale;
        const dh = photo.height * scale;
        ctx.save();
        ctx.beginPath();
        ctx.rect(W - pw, 0, pw, H);
        ctx.clip();
        ctx.drawImage(photo, W - pw + (pw - dw) / 2, (H - dh) / 2, dw, dh);
        const fade = ctx.createLinearGradient(W - pw, 0, W - pw + 160, 0);
        fade.addColorStop(0, s.from);
        fade.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = fade;
        ctx.fillRect(W - pw, 0, 160, H);
        ctx.restore();
      }

      const maxWidth = photo ? W * 0.56 : W * 0.86;
      let size = 190;
      let lines: string[] = [];
      do {
        ctx.font = `800 ${size}px ${family}`;
        lines = wrap(ctx, text || " ", maxWidth, 3);
        size -= 8;
      } while (size > 60 && (lines.some((l) => ctx.measureText(l).width > maxWidth) || lines.length * size * 1.1 > H * 0.7));
      size += 8;

      const lineH = size * 1.12;
      const top = (H - lines.length * lineH) / 2 + size * 0.85;
      ctx.lineJoin = "round";
      ctx.textBaseline = "alphabetic";
      lines.forEach((l, i) => {
        const yy = top + i * lineH;
        ctx.lineWidth = size * 0.14;
        ctx.strokeStyle = s.stroke;
        ctx.strokeText(l, 64, yy);
        ctx.fillStyle = i === lines.length - 1 && lines.length > 1 ? s.band : s.text;
        ctx.fillText(l, 64, yy);
      });

      if (badge.trim()) {
        ctx.font = `800 54px ${family}`;
        const bw = ctx.measureText(badge).width + 56;
        ctx.fillStyle = s.band;
        ctx.beginPath();
        ctx.roundRect(48, 44, bw, 84, 18);
        ctx.fill();
        ctx.fillStyle = s.stroke;
        ctx.fillText(badge, 76, 106);
      }
    };

    document.fonts.ready.then(draw);
    draw();
  }, [text, badge, style, photo]);

  function onPhoto(file: File | undefined) {
    if (!file) return;
    const img = new Image();
    img.onload = () => setPhoto(img);
    img.src = URL.createObjectURL(file);
  }

  function download() {
    const url = canvas.current?.toDataURL("image/png");
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = "mitra-thumbnail.png";
    a.click();
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
      <div>
        <canvas ref={canvas} width={W} height={H} className="aspect-video w-full rounded-xl border border-line" aria-label="Thumbnail preview" />
        <span ref={fontProbe} className="pointer-events-none absolute opacity-0 font-indic" aria-hidden>
          .
        </span>
      </div>
      <div className="space-y-4">
        <label className="block text-xs font-medium text-muted">
          Thumbnail text
          <textarea
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 font-indic text-base text-ink outline-none focus:border-accent"
          />
        </label>
        <label className="block text-xs font-medium text-muted">
          Badge
          <input
            value={badge}
            onChange={(e) => setBadge(e.target.value.slice(0, 14))}
            className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          />
        </label>
        <div>
          <p className="text-xs font-medium text-muted">Style</p>
          <div className="mt-1 flex gap-2">
            {STYLES.map((s, i) => (
              <button
                key={s.name}
                onClick={() => setStyle(i)}
                className={`h-9 w-9 rounded-full border-2 ${i === style ? "border-ink" : "border-transparent"}`}
                style={{ background: `linear-gradient(135deg, ${s.from}, ${s.to})` }}
                aria-label={`${s.name} style`}
                aria-pressed={i === style}
              />
            ))}
          </div>
        </div>
        <label className="block cursor-pointer rounded-xl border border-dashed border-line px-3 py-3 text-center text-sm text-ink-2 hover:border-accent">
          {photo ? "Change photo" : "Add your photo (optional)"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
        </label>
        <Button onClick={download} className="w-full">Download PNG (1280×720)</Button>
      </div>
    </div>
  );
}
