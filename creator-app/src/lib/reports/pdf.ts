import path from "node:path";
import * as fontkit from "fontkit";
import PDFDocument from "pdfkit";
import type { WeeklyCoach } from "../ai";
import { compact, full } from "../format";
import { times, type WeeklyFacts } from "./facts";
import { reportLabels, weekday } from "./labels";
import { SITE_URL } from "../company";

/**
 * The Monday report as a one-page PDF a creator can save, print or forward. Big numbers, three short lists and a
 * chart, in their language. PDFKit shapes Indian scripts correctly with full Noto fonts; those fonts have no Latin
 * letters, so each line is split into runs and every run gets the font that has its characters.
 */

const FONT_DIR = path.join(process.cwd(), "assets", "pdf-fonts");

/**
 * fontkit (PDFKit's shaper) crashes on mark-to-base lookups whose anchor is missing, which happens in Noto
 * Malayalam and a few Telugu clusters. A missing anchor just means "no offset", so treat it that way.
 */
let patched = false;
function patchFontkit() {
  if (patched) return;
  patched = true;
  try {
    const font = fontkit.openSync(path.join(FONT_DIR, "NotoSansMalayalam-Regular.ttf"));
    font.layout("ക");
    const proto = Object.getPrototypeOf(font._layoutEngine?.engine?.GPOSProcessor ?? {});
    const original = proto?.getAnchor;
    if (typeof original === "function") {
      proto.getAnchor = function (this: unknown, anchor: unknown) {
        return anchor ? original.call(this, anchor) : { x: 0, y: 0 };
      };
    }
  } catch (err) {
    console.error("Couldn't patch fontkit", err);
  }
}

const C = { ink: "#1c1b19", ink2: "#4a4540", muted: "#7a7268", line: "#ece6dc", card: "#faf7f2", accent: "#e2620b", soft: "#fdf0e5", good: "#1f7a3a", bad: "#b3261e", saffron: "#FF8A1F", fuchsia: "#D946EF", violet: "#6C47FF" };
const LOGO = path.join(process.cwd(), "public", "brand", "mitra-120.png");

/** Emoji and pictographs aren't in these fonts; drop them rather than print empty boxes. */
function clean(s: string): string {
  return s.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{20E3}]/gu, "").replace(/\s{2,}/g, " ").trim();
}

/** Splits text into runs that each need one font: the language's script font, or Latin. */
export function runs(text: string): { indic: boolean; text: string }[] {
  return scriptRuns(text).map((r) => ({ indic: r.font != null, text: r.text }));
}

/** Unicode blocks of the scripts we have fonts for. Titles can be in any of them, whatever the report language. */
const BLOCKS: [number, number, string][] = [
  [0x0900, 0x097f, "NotoSansDevanagari"],
  [0x0980, 0x09ff, "NotoSansBengali"],
  [0x0b80, 0x0bff, "NotoSansTamil"],
  [0x0c00, 0x0c7f, "NotoSansTelugu"],
  [0x0c80, 0x0cff, "NotoSansKannada"],
  [0x0d00, 0x0d7f, "NotoSansMalayalam"],
];
function fontOf(ch: string): string | null {
  const c = ch.codePointAt(0) ?? 0;
  return BLOCKS.find(([lo, hi]) => c >= lo && c <= hi)?.[2] ?? null;
}

/** Splits text into runs that each need one font (null = Latin). Spaces and joiners stay with their run. */
export function scriptRuns(text: string): { font: string | null; text: string }[] {
  const out: { font: string | null; text: string }[] = [];
  for (const ch of text) {
    const last = out[out.length - 1];
    const font = last && /[\s\u200c\u200d]/u.test(ch) ? last.font : fontOf(ch);
    if (last && last.font === font) last.text += ch;
    else out.push({ font, text: ch });
  }
  return out;
}

/**
 * One A4 page, top to bottom: header, the week's headline, three numbers with the change on last week, the
 * milestone bar, a this-week-vs-last-week chart beside the video of the week, the one move for this week, then
 * what went well and what to fix. Every block has a fixed place, so the page reads the same every Monday.
 */
export function weeklyPdf(f: WeeklyFacts, coach: WeeklyCoach, language: string, opts: { site?: string } = {}): Promise<Buffer> {
  patchFontkit();
  const L = reportLabels(language, coach);
  const doc = new PDFDocument({ size: "A4", margin: 40, font: path.join(FONT_DIR, "NotoSans-Regular.ttf"), info: { Title: `Mitra · ${f.channel} · ${f.period}`, Author: "Mitra" } });
  doc.registerFont("latin", path.join(FONT_DIR, "NotoSans-Regular.ttf"));
  doc.registerFont("latin-bold", path.join(FONT_DIR, "NotoSans-Bold.ttf"));
  // Registering only records the file; a font is embedded only if some text uses it.
  for (const [, , font] of BLOCKS) {
    doc.registerFont(font, path.join(FONT_DIR, `${font}-Regular.ttf`));
    doc.registerFont(`${font}-bold`, path.join(FONT_DIR, `${font}-Bold.ttf`));
  }
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
  // Everything is placed by hand; never let PDFKit start a second page.
  doc.page.margins.bottom = 0;

  const W = doc.page.width;
  const H = doc.page.height;
  const M = 40;
  const CW = W - M * 2;
  type Style = { size: number; bold?: boolean; color?: string; width?: number; lineGap?: number; align?: "left" | "right" | "center" };

  const fontFor = (font: string | null, bold?: boolean) => (font ? (bold ? `${font}-bold` : font) : bold ? "latin-bold" : "latin");

  /** Writes mixed-script text at (x, y), switching fonts per run. Returns the y below it. */
  function write(text: string, x: number, y: number, o: Style): number {
    const parts = scriptRuns(clean(text));
    if (!parts.length) return y;
    doc.fillColor(o.color ?? C.ink).fontSize(o.size);
    // PDFKit can't right-align or centre text continued across fonts, so short aligned lines are placed by hand.
    if (o.align && o.align !== "left" && parts.length > 1) {
      const widths = parts.map((p) => doc.font(fontFor(p.font, o.bold)).widthOfString(p.text));
      const total = widths.reduce((t, w) => t + w, 0);
      const box = o.width ?? CW;
      if (total <= box) {
        let px = x + (o.align === "right" ? box - total : (box - total) / 2);
        parts.forEach((p, i) => {
          doc.font(fontFor(p.font, o.bold)).text(p.text, px, y, { lineBreak: false });
          px += widths[i];
        });
        return y + doc.currentLineHeight(true);
      }
    }
    parts.forEach((p, i) => {
      doc.font(fontFor(p.font, o.bold));
      const opts = { width: o.width ?? CW, lineGap: o.lineGap ?? 2, align: o.align, continued: i < parts.length - 1 };
      if (i === 0) doc.text(p.text, x, y, opts);
      else doc.text(p.text, opts);
    });
    return doc.y;
  }

  /** Height `write` will take, so a box can be drawn behind text before the text. */
  function measure(text: string, o: Style): number {
    const t = clean(text);
    // The tallest script in the text decides the height.
    const font = scriptRuns(t).find((r) => r.font)?.font ?? null;
    doc.font(fontFor(font, o.bold)).fontSize(o.size);
    return doc.heightOfString(t || " ", { width: o.width ?? CW, lineGap: o.lineGap ?? 2 });
  }

  const pct = (n: number | null | undefined) => (n == null || !Number.isFinite(n) ? null : `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(0)}%`);
  const gradient = (x0: number, x1: number) => doc.linearGradient(x0, 0, x1, 0).stop(0, C.saffron).stop(0.5, C.fuchsia).stop(1, C.violet);

  // ---- Header: logo, report name and period ---------------------------------------------------------
  let y = 34;
  try {
    doc.image(LOGO, M, y, { width: 28, height: 28 });
  } catch {
    doc.circle(M + 14, y + 14, 14).fill(gradient(M, M + 28));
  }
  write("mitra", M + 36, y + 2, { size: 17, bold: true, width: 120 });
  write(L.report, M + CW - 240, y + 1, { size: 10, bold: true, color: C.accent, width: 240, align: "right" });
  write(f.period, M + CW - 240, y + 15, { size: 9.5, color: C.muted, width: 240, align: "right" });
  y += 40;
  doc.rect(M, y, CW, 2.5).fill(gradient(M, M + CW));

  // ---- Channel and headline -------------------------------------------------------------------------
  y += 16;
  y = write(f.channel, M, y, { size: 10, color: C.muted });
  y = write(coach.headline, M, y + 2, { size: 18, bold: true, lineGap: 1 }) + 14;

  // ---- Scorecard ------------------------------------------------------------------------------------
  const cardW = (CW - 24) / 3;
  const stats: [string, string, number | null | undefined][] = [
    [L.views, compact(f.views), f.viewsChange],
    [L.watchTime, compact(f.watchHours), f.watchHoursChange],
    [L.subscribers, `+${full(f.subscribersGained)}`, f.subscribersChange],
  ];
  stats.forEach(([label, value, chg], i) => {
    const x = M + i * (cardW + 12);
    doc.roundedRect(x, y, cardW, 82, 12).fill(C.card);
    write(label, x + 14, y + 12, { size: 9.5, color: C.muted, width: cardW - 28 });
    write(value, x + 14, y + 27, { size: 26, bold: true, width: cardW - 28 });
    const p = pct(chg);
    if (p) {
      const up = !p.startsWith("−");
      const text = `${p}  vs ${L.lastWeek.toLowerCase()}`;
      write(text, x + 14, y + 62, { size: 8.5, bold: true, color: up ? C.good : C.bad, width: cardW - 28 });
    }
  });
  y += 82 + 16;

  // ---- Milestone ------------------------------------------------------------------------------------
  if (f.nextMilestone) {
    const share = Math.max(0, Math.min(1, f.subscribers / f.nextMilestone.at));
    write(`${full(f.nextMilestone.left)} ${L.milestone}`, M, y, { size: 9.5, bold: true, width: CW * 0.7 });
    write(`${full(f.subscribers)} / ${compact(f.nextMilestone.at)}`, M + CW * 0.6, y, { size: 9.5, color: C.muted, width: CW * 0.4, align: "right" });
    y += 17;
    doc.roundedRect(M, y, CW, 7, 3.5).fill(C.line);
    doc.roundedRect(M, y, Math.max(7, CW * share), 7, 3.5).fill(gradient(M, M + CW));
    y += 7 + 18;
  }

  // ---- Chart (this week vs last week) beside the video of the week -----------------------------------
  const rowH = 150;
  const leftW = CW * 0.6 - 6;
  const rightX = M + leftW + 12;
  const rightW = CW - leftW - 12;
  doc.roundedRect(M, y, leftW, rowH, 12).lineWidth(0.8).strokeColor(C.line).stroke();
  write(L.views, M + 14, y + 11, { size: 10, bold: true, width: 120 });
  // Legend
  const legend = (x: number, color: string, label: string) => {
    doc.roundedRect(x, y + 15, 7, 7, 2).fill(color);
    write(label, x + 10, y + 12.5, { size: 8, color: C.muted, width: 70 });
  };
  legend(M + leftW - 150, C.accent, L.thisWeek);
  legend(M + leftW - 76, "#d9d1c5", L.lastWeek);
  const thisWeek = f.days.slice(-7);
  const lastWeek = f.days.length > 7 ? f.days.slice(-14, -7) : [];
  const max = Math.max(1, ...f.days.map((d) => d.views));
  const plotTop = y + 36;
  const plotH = rowH - 36 - 26;
  const slot = (leftW - 28) / Math.max(7, thisWeek.length);
  const bw = Math.min(11, (slot - 8) / 2);
  doc.moveTo(M + 14, plotTop + plotH).lineTo(M + leftW - 14, plotTop + plotH).lineWidth(0.6).strokeColor(C.line).stroke();
  thisWeek.forEach((d, i) => {
    const cx = M + 14 + slot * i + slot / 2;
    const prev = lastWeek[i - (thisWeek.length - lastWeek.length)] ?? lastWeek[i];
    if (prev) {
      const h = Math.max(1.5, (prev.views / max) * plotH);
      doc.roundedRect(cx - bw - 1, plotTop + plotH - h, bw, h, 2).fill("#d9d1c5");
    }
    const h = Math.max(1.5, (d.views / max) * plotH);
    doc.roundedRect(cx + 1, plotTop + plotH - h, bw, h, 2).fill(C.accent);
    write(weekday(d.date, language), cx - slot / 2, plotTop + plotH + 6, { size: 7.5, color: C.muted, width: slot, align: "center" });
  });

  doc.roundedRect(rightX, y, rightW, rowH, 12).fill(C.card);
  if (f.star) {
    write(L.videoOfWeek, rightX + 14, y + 11, { size: 10, bold: true, width: rightW - 28 });
    const title = f.star.title.length > 70 ? `${f.star.title.slice(0, 68).trim()}…` : f.star.title;
    write(title, rightX + 14, y + 29, { size: 9.5, color: C.ink2, width: rightW - 28, lineGap: 1 });
    write(times(f.star.times), rightX + 14, y + rowH - 64, { size: 28, bold: true, color: C.accent, width: rightW - 28 });
    write(`${L.usual} · ${compact(f.star.views)} ${L.views.toLowerCase()}`, rightX + 14, y + rowH - 26, { size: 8.5, color: C.muted, width: rightW - 28 });
  } else {
    write(L.thisWeek, rightX + 14, y + 11, { size: 10, bold: true, width: rightW - 28 });
    write(String(f.uploadsThisWeek), rightX + 14, y + 34, { size: 28, bold: true, color: C.accent, width: rightW - 28 });
    write(L.uploads, rightX + 14, y + 74, { size: 9, color: C.muted, width: rightW - 28 });
    if (f.bestDay) write(`${weekday(f.bestDay.date, language)} · ${compact(f.bestDay.views)} ${L.views.toLowerCase()}`, rightX + 14, y + rowH - 26, { size: 8.5, color: C.muted, width: rightW - 28 });
  }
  y += rowH + 16;

  // ---- The one move ---------------------------------------------------------------------------------
  const ideaH = measure(coach.nextVideo.idea, { size: 14, bold: true, width: CW - 40 });
  const whyH = measure(coach.nextVideo.why, { size: 10, width: CW - 40 });
  const moveH = 14 + 16 + ideaH + 4 + whyH + 14;
  doc.roundedRect(M, y, CW, moveH, 12).fill(C.soft);
  doc.roundedRect(M, y, 4, moveH, 2).fill(C.accent);
  write(L.next, M + 20, y + 13, { size: 9.5, bold: true, color: C.accent, width: CW - 40 });
  const iy = write(coach.nextVideo.idea, M + 20, y + 30, { size: 14, bold: true, width: CW - 40 });
  write(coach.nextVideo.why, M + 20, iy + 4, { size: 10, color: C.ink2, width: CW - 40 });
  y += moveH + 16;

  // ---- What went well / Fix this week ---------------------------------------------------------------
  const colW = (CW - 16) / 2;
  const column = (x: number, title: string, items: string[], color: string, mark: "check" | "arrow"): number => {
    write(title, x, y, { size: 10.5, bold: true, color, width: colW });
    let iy2 = y + 20;
    for (const it of items.slice(0, 2)) {
      doc.circle(x + 5, iy2 + 6.5, 5).fill(color);
      doc.lineWidth(1.2).strokeColor("#ffffff").lineCap("round").lineJoin("round");
      if (mark === "check") doc.moveTo(x + 2.7, iy2 + 6.7).lineTo(x + 4.4, iy2 + 8.3).lineTo(x + 7.4, iy2 + 4.9).stroke();
      else doc.moveTo(x + 2.8, iy2 + 6.5).lineTo(x + 7.2, iy2 + 6.5).moveTo(x + 5.3, iy2 + 4.6).lineTo(x + 7.2, iy2 + 6.5).lineTo(x + 5.3, iy2 + 8.4).stroke();
      iy2 = write(it, x + 16, iy2, { size: 10, width: colW - 16, lineGap: 1.5 }) + 8;
    }
    return iy2;
  };
  const listsEnd = Math.max(
    coach.wins.length ? column(M, L.wins, coach.wins, C.good, "check") : y,
    coach.fixes.length ? column(M + colW + 16, L.fixes, coach.fixes, C.accent, "arrow") : y,
  );

  // ---- Latest uploads, when the page has room (it always does in English; long scripts may fill it) ------
  y = listsEnd + 4;
  const uploads = f.uploads ?? [];
  const fy = H - 52;
  if (uploads.length && y + 26 + uploads.length * 22 < fy - 8) {
    y = Math.max(y, fy - 26 - uploads.length * 22 - 22);
    write(L.recent, M, y, { size: 10.5, bold: true, width: CW });
    y += 20;
    for (const u of uploads) {
      doc.moveTo(M, y).lineTo(W - M, y).lineWidth(0.5).strokeColor(C.line).stroke();
      const title = u.title.length > 64 ? `${u.title.slice(0, 62).trim()}…` : u.title;
      write(title, M, y + 5, { size: 9.5, width: CW - 210 });
      const meta = [`${compact(u.views)} ${L.views.toLowerCase()}`, u.avgViewPct != null ? `${u.avgViewPct}% ${L.watched}` : null, `${u.days} ${L.daysAgo}`].filter(Boolean).join("  ·  ");
      write(meta, M + CW - 205, y + 5, { size: 9, color: C.muted, width: 205, align: "right" });
      y += 22;
    }
  }

  // ---- Footer ---------------------------------------------------------------------------------------
  const site = opts.site ?? new URL(SITE_URL).host;
  doc.moveTo(M, fy).lineTo(W - M, fy).lineWidth(0.5).strokeColor(C.line).stroke();
  doc.fillColor(C.ink).font("latin-bold").fontSize(8.5).text(`${site}/dashboard`, M, fy + 9, { width: CW / 2 });
  doc.fillColor(C.muted).font("latin").fontSize(7.5).text("Numbers from YouTube Analytics (latest 7 days available).", M + CW / 2, fy + 9, { width: CW / 2, align: "right" });
  doc.text("× scores are Mitra's calculation from your YouTube data, not YouTube metrics.", M, fy + 23, { width: CW, align: "right" });

  doc.end();
  return done;
}
