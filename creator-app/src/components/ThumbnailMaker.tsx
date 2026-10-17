"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ThumbnailDesign } from "@/lib/ai";
import { Button } from "./ui";

const W = 1280;
const H = 720;
const MAX_PHOTOS = 3;

/** Hand-made looks for when the creator styles it themselves (or before asking Mitra). */
const STYLES: { name: string; palette: ThumbnailDesign["palette"] }[] = [
  { name: "Marigold", palette: { accent: "#ffd23f", text: "#ffffff", stroke: "#1a0f05", glow: "#ffb347", bgFrom: "#ff7a1a", bgTo: "#7a0f2e" } },
  { name: "Night", palette: { accent: "#ff4d6d", text: "#ffd23f", stroke: "#000000", glow: "#7b5cff", bgFrom: "#0e0d0b", bgTo: "#2b2357" } },
  { name: "Peacock", palette: { accent: "#ff8a3d", text: "#ffffff", stroke: "#001014", glow: "#2ee6c9", bgFrom: "#0b6e6c", bgTo: "#062b3a" } },
  { name: "Paper", palette: { accent: "#e2620b", text: "#17140f", stroke: "#ffffff", glow: "#ffd23f", bgFrom: "#fff6e5", bgTo: "#f2b766" } },
];

export function defaultDesign(text: string): ThumbnailDesign {
  return {
    headline: text,
    highlight: "",
    badge: "NEW",
    layout: "subject-right",
    images: [],
    palette: STYLES[0].palette,
    backgroundQuery: "",
    imagePrompt: "",
    emoji: "",
    arrow: false,
    why: "",
  };
}

export interface Photo {
  img: HTMLImageElement;
  /** Shrunk JPEG (≤768px) as base64, what gets sent to the AI. */
  data: string;
}

/** Loads a file and makes a small JPEG copy for the AI: ~300-500 image tokens instead of thousands. */
function loadPhoto(file: File): Promise<Photo> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 768 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      resolve({ img, data: c.toDataURL("image/jpeg", 0.8).split(",")[1] });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/** Draws `img` to fill the box, cropped around its focus point. */
function cover(ctx: CanvasRenderingContext2D, img: CanvasImageSource & { width: number; height: number }, x: number, y: number, w: number, h: number, fx = 0.5, fy = 0.4, zoom = 1) {
  const scale = Math.max(w / img.width, h / img.height) * zoom;
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = Math.min(x, Math.max(x + w - dw, x + w / 2 - fx * dw));
  const dy = Math.min(y, Math.max(y + h - dh, y + h / 2 - fy * dh));
  ctx.drawImage(img, dx, dy, dw, dh);
}

function hexToRgba(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** A background with depth even without a photo: gradient, glow, light rays, grain and vignette. */
function richBackground(ctx: CanvasRenderingContext2D, p: ThumbnailDesign["palette"], glowX: number) {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, p.bgFrom);
  g.addColorStop(1, p.bgTo);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + (i - 4) * 0.22;
    ctx.beginPath();
    ctx.moveTo(glowX, H * 0.55);
    ctx.arc(glowX, H * 0.55, W, a - 0.05, a + 0.05);
    ctx.closePath();
    ctx.fillStyle = hexToRgba(p.glow, 0.06);
    ctx.fill();
  }
  const glow = ctx.createRadialGradient(glowX, H * 0.5, 10, glowX, H * 0.5, H * 0.75);
  glow.addColorStop(0, hexToRgba(p.glow, 0.75));
  glow.addColorStop(1, hexToRgba(p.glow, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // Fine grain so it reads as a photo-like surface, not a flat fill. Seeded, so redraws don't flicker.
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  for (let i = 0; i < 2600; i++) ctx.fillRect(rnd() * W, rnd() * H, 2, 2);
}

function vignette(ctx: CanvasRenderingContext2D, strength = 0.55) {
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.75);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}

/** Darkens the side the text sits on so it stays readable over any photo. */
function textScrim(ctx: CanvasRenderingContext2D, side: "left" | "right" | "bottom") {
  const g =
    side === "bottom" ? ctx.createLinearGradient(0, H, 0, H * 0.35) : side === "left" ? ctx.createLinearGradient(0, 0, W * 0.65, 0) : ctx.createLinearGradient(W, 0, W * 0.35, 0);
  g.addColorStop(0, "rgba(0,0,0,0.78)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

/** The subject as a tilted "sticker" card with a white border, shadow and glow behind it. */
function subjectCard(ctx: CanvasRenderingContext2D, photo: HTMLImageElement, cx: number, p: ThumbnailDesign["palette"], fx: number, fy: number, zoom: number, tilt: number) {
  const w = W * 0.42;
  const h = H * 0.8;
  ctx.save();
  const glow = ctx.createRadialGradient(cx, H / 2, 20, cx, H / 2, W * 0.36);
  glow.addColorStop(0, hexToRgba(p.glow, 0.9));
  glow.addColorStop(1, hexToRgba(p.glow, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.translate(cx, H / 2 + 10);
  ctx.rotate(tilt);
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(-w / 2 - 12, -h / 2 - 12, w + 24, h + 24, 34);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 24);
  ctx.clip();
  cover(ctx, photo, -w / 2, -h / 2, w, h, fx, fy, zoom);
  ctx.restore();
}

function inset(ctx: CanvasRenderingContext2D, photo: HTMLImageElement, x: number, y: number, r: number, accent: string, fx: number, fy: number, zoom: number) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 24;
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(x, y, r + 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  cover(ctx, photo, x - r, y - r, r * 2, r * 2, fx, fy, zoom);
  ctx.restore();
}

function arrow(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, color: string) {
  const ang = Math.atan2(toY - fromY, toX - fromX);
  ctx.save();
  ctx.strokeStyle = "#000";
  ctx.fillStyle = color;
  ctx.lineWidth = 10;
  ctx.lineJoin = "round";
  ctx.translate(fromX, fromY);
  ctx.rotate(ang);
  const len = Math.hypot(toX - fromX, toY - fromY);
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(len - 70, -16);
  ctx.lineTo(len - 70, -46);
  ctx.lineTo(len, 0);
  ctx.lineTo(len - 70, 46);
  ctx.lineTo(len - 70, 16);
  ctx.lineTo(0, 16);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
  ctx.restore();
}

/** Splits text into at most `maxLines` lines that fit `maxWidth`. */
function wrap(ctx: CanvasRenderingContext2D, words: string[], maxWidth: number, maxLines: number): string[][] {
  const lines: string[][] = [];
  let line: string[] = [];
  for (const word of words) {
    const test = [...line, word].join(" ");
    if (ctx.measureText(test).width > maxWidth && line.length) {
      lines.push(line);
      line = [word];
    } else line.push(word);
  }
  if (line.length) lines.push(line);
  return lines.slice(0, maxLines);
}

interface HeadlineLayout {
  size: number;
  lines: string[][];
  top: number;
  lineH: number;
  x: number;
  align: "left" | "center";
  box: Box;
}

/** Fits the headline: as big as possible in at most 3 lines within `maxWidth`. */
function layoutHeadline(ctx: CanvasRenderingContext2D, d: ThumbnailDesign, family: string, x: number, maxWidth: number, align: "left" | "center", offsetY = 0): HeadlineLayout | null {
  const words = d.headline.split(/\s+/).filter(Boolean);
  if (!words.length) return null;
  let size = 200;
  let lines: string[][] = [];
  do {
    ctx.font = `800 ${size}px ${family}`;
    lines = wrap(ctx, words, maxWidth, 3);
    size -= 6;
  } while (size > 56 && (lines.some((l) => ctx.measureText(l.join(" ")).width > maxWidth) || lines.length * size * 1.08 > H * 0.72 || lines.flat().length < words.length));
  size += 6;
  ctx.font = `800 ${size}px ${family}`;
  const lineH = size * 1.08;
  const top = (H - lines.length * lineH) / 2 + size * 0.82 + offsetY;
  const widths = lines.map((l) => ctx.measureText(l.join(" ")).width);
  const widest = Math.max(...widths);
  const left = align === "center" ? x - widest / 2 : x;
  const pad = size * 0.12;
  return { size, lines, top, lineH, x, align, box: { x: left - pad, y: top - size * 0.95 - pad, w: widest + pad * 2, h: (lines.length - 1) * lineH + size * 1.25 + pad * 2 } };
}

/** Big outlined headline; the highlight word gets the accent colour. */
function drawHeadline(ctx: CanvasRenderingContext2D, d: ThumbnailDesign, family: string, l: HeadlineLayout) {
  const norm = (w: string) => w.replace(/[^\p{L}\p{N}₹]/gu, "").toLowerCase();
  const hi = norm(d.highlight);
  ctx.font = `800 ${l.size}px ${family}`;
  const space = ctx.measureText(" ").width;
  ctx.lineJoin = "round";
  ctx.textBaseline = "alphabetic";
  l.lines.forEach((line, i) => {
    const y = l.top + i * l.lineH;
    const width = ctx.measureText(line.join(" ")).width;
    let cx = l.align === "center" ? l.x - width / 2 : l.x;
    for (const word of line) {
      const ww = ctx.measureText(word).width;
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 8;
      ctx.lineWidth = l.size * 0.16;
      ctx.strokeStyle = d.palette.stroke;
      ctx.strokeText(word, cx, y);
      ctx.restore();
      ctx.fillStyle = hi && norm(word) === hi ? d.palette.accent : d.palette.text;
      ctx.fillText(word, cx, y);
      cx += ww + space;
    }
  });
}

function badgeWidth(ctx: CanvasRenderingContext2D, text: string, family: string): number {
  ctx.font = `800 52px ${family}`;
  return ctx.measureText(text).width + 56;
}

function badge(ctx: CanvasRenderingContext2D, text: string, family: string, accent: string, stroke: string) {
  if (!text.trim()) return;
  ctx.save();
  ctx.font = `800 52px ${family}`;
  const bw = ctx.measureText(text).width + 56;
  ctx.translate(44, 40);
  ctx.rotate(-0.04);
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.roundRect(0, 0, bw, 84, 18);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.fillStyle = stroke;
  ctx.fillText(text, 28, 61);
  ctx.restore();
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
/** What can be dragged and resized on the thumbnail. */
export type LayerId = "headline" | "badge" | "emoji" | "subject" | "inset0" | "inset1";
export interface LayerEdit {
  dx: number;
  dy: number;
  scale: number;
}
export type LayerEdits = Partial<Record<LayerId, LayerEdit>>;

const NO_EDIT: LayerEdit = { dx: 0, dy: 0, scale: 1 };

/**
 * Draws one element moved and scaled around its own centre, and records where it ended up so the editor can put
 * a handle on it.
 */
function layer(ctx: CanvasRenderingContext2D, id: LayerId, box: Box, edits: LayerEdits, boxes: Partial<Record<LayerId, Box>>, draw: () => void) {
  const e = edits[id] ?? NO_EDIT;
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  ctx.save();
  ctx.translate(cx + e.dx, cy + e.dy);
  ctx.scale(e.scale, e.scale);
  ctx.translate(-cx, -cy);
  draw();
  ctx.restore();
  boxes[id] = { x: cx + e.dx - (box.w * e.scale) / 2, y: cy + e.dy - (box.h * e.scale) / 2, w: box.w * e.scale, h: box.h * e.scale };
}

/** Draws the whole thumbnail and returns where each movable element is (canvas pixels). */
export function drawThumbnail(
  ctx: CanvasRenderingContext2D,
  d: ThumbnailDesign,
  photos: Photo[],
  background: HTMLImageElement | null,
  family: string,
  edits: LayerEdits = {},
): Partial<Record<LayerId, Box>> {
  const boxes: Partial<Record<LayerId, Box>> = {};
  ctx.clearRect(0, 0, W, H);
  const role = (r: string) => d.images.filter((im) => im.role === r && photos[im.index]);
  const subjects = role("subject");
  const bgPick = role("background")[0];
  const insets = role("inset");
  // Without AI guidance, the first uploaded photo is the subject.
  const subject = subjects[0] ?? (photos[0] && !d.images.length ? { index: 0, role: "subject" as const, focusX: 0.5, focusY: 0.4, zoom: 1 } : undefined);
  const left = d.layout === "subject-left";
  const text = (l: HeadlineLayout | null) => l && layer(ctx, "headline", l.box, edits, boxes, () => drawHeadline(ctx, d, family, l));

  if (d.layout === "full-bleed" && (subject || bgPick)) {
    const im = (subject ?? bgPick)!;
    cover(ctx, photos[im.index].img, 0, 0, W, H, im.focusX, im.focusY, im.zoom);
    textScrim(ctx, im.focusX > 0.5 ? "left" : "right");
    vignette(ctx, 0.5);
    text(layoutHeadline(ctx, d, family, im.focusX > 0.5 ? 64 : W * 0.45, W * 0.5, "left"));
  } else if (d.layout === "split" && subjects.length >= 2) {
    subjects.slice(0, 2).forEach((im, i) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(i * W / 2, 0, W / 2, H);
      ctx.clip();
      cover(ctx, photos[im.index].img, i * W / 2, 0, W / 2, H, im.focusX, im.focusY, im.zoom);
      ctx.restore();
    });
    ctx.fillStyle = d.palette.accent;
    ctx.fillRect(W / 2 - 6, 0, 12, H);
    textScrim(ctx, "bottom");
    vignette(ctx, 0.4);
    text(layoutHeadline(ctx, d, family, W / 2, W * 0.9, "center", H * 0.24));
  } else {
    const subjX = left ? W * 0.27 : W * 0.73;
    if (bgPick) {
      cover(ctx, photos[bgPick.index].img, 0, 0, W, H, bgPick.focusX, bgPick.focusY, bgPick.zoom);
    } else if (background) {
      cover(ctx, background, 0, 0, W, H);
    }
    if (bgPick || background) {
      ctx.fillStyle = hexToRgba(d.palette.bgTo, 0.35); // tint the photo toward the palette
      ctx.fillRect(0, 0, W, H);
      textScrim(ctx, left ? "right" : "left");
      vignette(ctx);
    } else {
      richBackground(ctx, d.palette, subject ? subjX : W * 0.8);
      vignette(ctx, 0.45);
    }
    if (subject) {
      const sw = W * 0.42 + 24;
      const sh = H * 0.8 + 24;
      layer(ctx, "subject", { x: subjX - sw / 2, y: H / 2 + 10 - sh / 2, w: sw, h: sh }, edits, boxes, () =>
        subjectCard(ctx, photos[subject.index].img, subjX, d.palette, subject.focusX, subject.focusY, subject.zoom, left ? 0.035 : -0.035),
      );
    }
    const textX = subject ? (left ? W * 0.52 : 64) : 64;
    text(layoutHeadline(ctx, d, family, textX, subject ? W * 0.48 : W * 0.86, "left"));
    // The arrow points at the subject, so it moves with it.
    if (subject && d.arrow) {
      const e = edits.subject ?? NO_EDIT;
      arrow(ctx, left ? W * 0.62 : W * 0.4, H * 0.86, (left ? W * 0.47 : W * 0.53) + e.dx, H * 0.66 + e.dy, d.palette.accent);
    }
  }

  insets.slice(0, 2).forEach((im, i) => {
    const x = left ? W - 150 - i * 210 : 150 + i * 210;
    const r = 95;
    layer(ctx, i ? "inset1" : "inset0", { x: x - r - 10, y: H - 140 - r - 10, w: 2 * r + 20, h: 2 * r + 20 }, edits, boxes, () =>
      inset(ctx, photos[im.index].img, x, H - 140, r, d.palette.accent, im.focusX, im.focusY, im.zoom),
    );
  });
  if (d.emoji) {
    const ex = left ? 40 : W - 200;
    ctx.font = `150px ${family}`;
    const ew = ctx.measureText(d.emoji).width;
    layer(ctx, "emoji", { x: ex, y: 40, w: ew, h: 170 }, edits, boxes, () => {
      ctx.font = `150px ${family}`;
      ctx.fillText(d.emoji, ex, 180);
    });
  }
  if (d.badge.trim()) {
    layer(ctx, "badge", { x: 40, y: 34, w: badgeWidth(ctx, d.badge, family) + 8, h: 96 }, edits, boxes, () => badge(ctx, d.badge, family, d.palette.accent, d.palette.stroke));
  }
  return boxes;
}

const LAYER_NAMES: Record<LayerId, string> = { headline: "Text", badge: "Badge", emoji: "Emoji", subject: "Your photo", inset0: "Small photo", inset1: "Small photo 2" };
const NO_EDITS: LayerEdits = {};

/** Fonts for the text. Indian scripts always fall back to Noto, so every font works in every language. */
const FONTS = [
  { id: "bold", name: "Bold", probe: "font-indic" },
  { id: "display", name: "Display", probe: "font-display" },
  { id: "classic", name: "Classic", probe: "font-serif" },
] as const;
type FontId = (typeof FONTS)[number]["id"];

const TEXT_COLOURS = ["#ffffff", "#ffd23f", "#ff4d6d", "#2ee6c9", "#17140f"];
const MIN_SCALE = 0.3;
const MAX_SCALE = 3;
const clampScale = (n: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, n));

type Drag = { id: LayerId; mode: "move" | "scale"; startX: number; startY: number; start: LayerEdit; cx: number; cy: number; dist: number; ratio: number };

/**
 * The thumbnail canvas (1280x720). Mitra plans the design; the browser draws it, so Devanagari, Telugu,
 * Tamil etc. render correctly — which most AI image generators still get wrong. Every element can then be dragged
 * and resized by hand (mouse or finger), free.
 */
export function ThumbnailMaker({
  design,
  onDesignChange,
  photos,
  onPhotosChange,
  background,
  credit,
}: {
  design: ThumbnailDesign;
  onDesignChange: (d: ThumbnailDesign) => void;
  photos: Photo[];
  onPhotosChange: (p: Photo[]) => void;
  background: HTMLImageElement | null;
  credit: string | null;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const probes = useRef<Partial<Record<FontId, HTMLSpanElement | null>>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [font, setFont] = useState<FontId>("bold");
  // Hand edits belong to one design: a new design from Mitra (or new photos) starts clean.
  const designKey = `${design.layout}|${design.why}|${photos.length}|${design.images.length}`;
  const [edits, setEdits] = useState<{ key: string; layers: LayerEdits }>({ key: designKey, layers: {} });
  const layers = useMemo(() => (edits.key === designKey ? edits.layers : NO_EDITS), [edits, designKey]);
  const [boxes, setBoxes] = useState<Partial<Record<LayerId, Box>>>({});
  const [selected, setSelected] = useState<LayerId | null>(null);
  const drag = useRef<Drag | null>(null);

  const setLayer = (id: LayerId, e: LayerEdit) => setEdits({ key: designKey, layers: { ...layers, [id]: e } });

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    const probe = probes.current[font] ?? probes.current.bold;
    if (!ctx || !probe) return;
    const indic = probes.current.bold ? getComputedStyle(probes.current.bold).fontFamily : "sans-serif";
    // Latin from the chosen font; Indian scripts from Noto.
    const family = font === "bold" ? indic : `${getComputedStyle(probe).fontFamily}, ${indic}`;
    let live = true;
    const draw = () => {
      if (!live) return;
      const b = drawThumbnail(ctx, design, photos, background, family, layers);
      requestAnimationFrame(() => live && setBoxes(b));
    };
    document.fonts.ready.then(draw);
    draw();
    return () => {
      live = false;
    };
  }, [design, photos, background, layers, font]);

  /** Canvas pixels per screen pixel. */
  const ratio = () => W / (stage.current?.getBoundingClientRect().width || W);

  function startDrag(e: React.PointerEvent, id: LayerId, mode: Drag["mode"]) {
    e.preventDefault();
    e.stopPropagation();
    setSelected(id);
    const box = boxes[id];
    const rect = stage.current?.getBoundingClientRect();
    if (!box || !rect) return;
    const r = ratio();
    const cx = rect.left + (box.x + box.w / 2) / r;
    const cy = rect.top + (box.y + box.h / 2) / r;
    drag.current = { id, mode, startX: e.clientX, startY: e.clientY, start: layers[id] ?? NO_EDIT, cx, cy, dist: Math.max(8, Math.hypot(e.clientX - cx, e.clientY - cy)), ratio: r };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    // No accidental text selection on the rest of the page while dragging.
    document.documentElement.classList.add("select-none");
    window.getSelection()?.removeAllRanges();
  }

  function endDrag() {
    drag.current = null;
    document.documentElement.classList.remove("select-none");
  }

  function onDrag(e: React.PointerEvent) {
    const g = drag.current;
    if (!g) return;
    if (g.mode === "move") {
      setLayer(g.id, { ...g.start, dx: g.start.dx + (e.clientX - g.startX) * g.ratio, dy: g.start.dy + (e.clientY - g.startY) * g.ratio });
    } else {
      setLayer(g.id, { ...g.start, scale: clampScale((g.start.scale * Math.hypot(e.clientX - g.cx, e.clientY - g.cy)) / g.dist) });
    }
  }

  function resize(id: LayerId, factor: number) {
    const cur = layers[id] ?? NO_EDIT;
    setLayer(id, { ...cur, scale: clampScale(cur.scale * factor) });
  }

  function nudge(e: React.KeyboardEvent) {
    if (!selected) return;
    const cur = layers[selected] ?? NO_EDIT;
    const step = e.shiftKey ? 40 : 8;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (moves[e.key]) {
      e.preventDefault();
      setLayer(selected, { ...cur, dx: cur.dx + moves[e.key][0], dy: cur.dy + moves[e.key][1] });
    } else if (e.key === "+" || e.key === "=") resize(selected, 1.08);
    else if (e.key === "-") resize(selected, 1 / 1.08);
    else if (e.key === "Escape") setSelected(null);
  }

  // Scroll on the selected element to resize it (a non-passive listener, so the page doesn't scroll instead).
  useEffect(() => {
    const el = stage.current;
    if (!el || !selected) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      resize(selected, e.deltaY < 0 ? 1.05 : 1 / 1.05);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  });

  const edited = Object.keys(layers).length > 0;
  const pct = (n: number, of: number) => `${(n / of) * 100}%`;

  async function addPhotos(files: FileList | null) {
    if (!files) return;
    setLoadError(null);
    try {
      const added = await Promise.all([...files].slice(0, MAX_PHOTOS - photos.length).map(loadPhoto));
      // New photos invalidate the AI's per-image plan; keep the text and colours.
      onPhotosChange([...photos, ...added]);
      onDesignChange({ ...design, images: [] });
    } catch {
      setLoadError("That file couldn't be opened as an image.");
    }
  }

  function removePhoto(i: number) {
    onPhotosChange(photos.filter((_, j) => j !== i));
    onDesignChange({ ...design, images: [] });
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
    <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
      <div className="min-w-0">
        <div
          ref={stage}
          className="relative select-none outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl"
          tabIndex={0}
          onKeyDown={nudge}
          onPointerDown={() => setSelected(null)}
          aria-label="Thumbnail editor: drag to move, drag the corner or scroll to resize"
        >
          <canvas ref={canvas} width={W} height={H} className="block aspect-video w-full rounded-xl border border-line" aria-label="Thumbnail preview" />
          {(Object.keys(boxes) as LayerId[]).map((id) => {
            const b = boxes[id]!;
            const on = selected === id;
            return (
              <div
                key={id}
                role="button"
                aria-label={`Move ${LAYER_NAMES[id]}`}
                aria-pressed={on}
                onPointerDown={(e) => startDrag(e, id, "move")}
                onPointerMove={onDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className={`group absolute cursor-move touch-none rounded-lg border-2 transition-colors ${on ? "border-accent" : "border-transparent hover:border-white/70 hover:border-dashed"}`}
                style={{ left: pct(b.x, W), top: pct(b.y, H), width: pct(b.w, W), height: pct(b.h, H) }}
              >
                {on && (
                  <>
                    <span className="pointer-events-none absolute -top-6 left-0 whitespace-nowrap rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-ink">{LAYER_NAMES[id]}</span>
                    <span
                      role="button"
                      aria-label={`Resize ${LAYER_NAMES[id]}`}
                      onPointerDown={(e) => startDrag(e, id, "scale")}
                      onPointerMove={onDrag}
                      onPointerUp={endDrag}
                onPointerCancel={endDrag}
                      className="absolute -bottom-2.5 -right-2.5 h-5 w-5 cursor-nwse-resize touch-none rounded-full border-2 border-white bg-accent shadow"
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
        {FONTS.map((f) => (
          <span key={f.id} ref={(el) => void (probes.current[f.id] = el)} className={`pointer-events-none absolute opacity-0 ${f.probe}`} aria-hidden>
            .
          </span>
        ))}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          {selected ? (
            <>
              <span className="font-semibold">{LAYER_NAMES[selected]}:</span>
              <button onClick={() => resize(selected, 1 / 1.12)} className="rounded-full border border-line px-3 py-1.5 font-semibold hover:bg-surface-2" aria-label="Smaller">
                A− Smaller
              </button>
              <button onClick={() => resize(selected, 1.12)} className="rounded-full border border-line px-3 py-1.5 font-semibold hover:bg-surface-2" aria-label="Bigger">
                A+ Bigger
              </button>
              <button onClick={() => setLayer(selected, NO_EDIT)} className="rounded-full border border-line px-3 py-1.5 hover:bg-surface-2">
                Reset
              </button>
              <button onClick={() => setSelected(null)} className="rounded-full px-3 py-1.5 text-muted hover:bg-surface-2">
                Done
              </button>
            </>
          ) : (
            <span className="text-muted">✋ Drag text and photos to move them · pull the corner dot (or scroll) to resize · arrow keys nudge</span>
          )}
          {edited && (
            <button onClick={() => (setEdits({ key: designKey, layers: {} }), setSelected(null))} className="ml-auto rounded-full px-3 py-1.5 text-muted hover:bg-surface-2">
              Undo all moves
            </button>
          )}
        </div>
        {credit && <p className="mt-1.5 text-xs text-muted">Background: {credit}</p>}
        {design.why && <p className="mt-2 text-sm text-ink-2">💡 {design.why}</p>}
      </div>
      <div className="space-y-4">
        <label className="block text-xs font-medium text-muted">
          Thumbnail text
          <textarea
            value={design.headline}
            onChange={(e) => onDesignChange({ ...design, headline: e.target.value.slice(0, 60) })}
            rows={2}
            className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 font-indic text-base text-ink outline-none focus:border-accent"
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs font-medium text-muted">
            Highlight word
            <input
              value={design.highlight}
              onChange={(e) => onDesignChange({ ...design, highlight: e.target.value.slice(0, 30) })}
              className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 font-indic text-sm text-ink outline-none focus:border-accent"
            />
          </label>
          <label className="block text-xs font-medium text-muted">
            Badge
            <input
              value={design.badge}
              onChange={(e) => onDesignChange({ ...design, badge: e.target.value.slice(0, 14) })}
              className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </label>
        </div>
        {design.imagePrompt && (
          <label className="block text-xs font-medium text-muted">
            Background idea (for the AI image)
            <textarea
              value={design.imagePrompt}
              onChange={(e) => onDesignChange({ ...design, imagePrompt: e.target.value.slice(0, 400) })}
              rows={3}
              className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-accent"
            />
          </label>
        )}
        <div>
          <p className="text-xs font-medium text-muted">Colours</p>
          <div className="mt-1 flex gap-2">
            {STYLES.map((s) => (
              <button
                key={s.name}
                onClick={() => onDesignChange({ ...design, palette: s.palette })}
                className={`h-9 w-9 rounded-full border-2 ${design.palette.bgFrom === s.palette.bgFrom ? "border-ink" : "border-transparent"}`}
                style={{ background: `linear-gradient(135deg, ${s.palette.bgFrom}, ${s.palette.bgTo})` }}
                aria-label={`${s.name} colours`}
              />
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-muted">Font</p>
          <div className="mt-1 flex gap-2">
            {FONTS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFont(f.id)}
                aria-pressed={font === f.id}
                className={`flex-1 rounded-xl border px-2 py-2 text-sm font-extrabold ${f.probe} ${font === f.id ? "border-ink bg-ink text-bg" : "border-line hover:bg-surface-2"}`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-muted">Text colour</p>
          <div className="mt-1 flex gap-2">
            {TEXT_COLOURS.map((c) => (
              <button
                key={c}
                onClick={() => onDesignChange({ ...design, palette: { ...design.palette, text: c, stroke: c === "#17140f" ? "#ffffff" : design.palette.stroke === "#ffffff" ? "#000000" : design.palette.stroke } })}
                className={`h-8 w-8 rounded-full border-2 ${design.palette.text.toLowerCase() === c ? "border-accent" : "border-line"}`}
                style={{ background: c }}
                aria-label={`Text colour ${c}`}
              />
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-muted">Your photos (up to {MAX_PHOTOS}) — face, product, location</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {photos.map((p, i) => (
              <div key={p.img.src} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                <img src={p.img.src} alt={`Photo ${i + 1}`} className="h-14 w-14 rounded-lg object-cover" />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-ink text-xs text-bg"
                  aria-label={`Remove photo ${i + 1}`}
                >
                  ×
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <label className="grid h-14 w-14 cursor-pointer place-items-center rounded-lg border border-dashed border-line text-xl text-muted hover:border-accent">
                +
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} aria-label="Add photos" />
              </label>
            )}
          </div>
          {loadError && <p className="mt-1 text-xs text-bad">{loadError}</p>}
        </div>
        <Button onClick={download} className="w-full">Download PNG (1280×720)</Button>
      </div>
    </div>
  );
}
