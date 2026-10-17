import path from "node:path";
import * as fontkit from "fontkit";
import PDFDocument from "pdfkit";
import type { WeeklyCoach } from "../ai";
import { compact, full, shortDate } from "../format";
import type { WeeklyFacts } from "./facts";
import { SITE_URL } from "../company";

/**
 * The Monday report as a one-page PDF a creator can save, print or forward. Big numbers, three short lists and a
 * chart, in their language. PDFKit shapes Indian scripts correctly with full Noto fonts; those fonts have no Latin
 * letters, so each line is split into runs and every run gets the font that has its characters.
 */

const FONT_DIR = path.join(process.cwd(), "assets", "pdf-fonts");
const SCRIPT_FONT: Record<string, string> = { hi: "NotoSansDevanagari", mr: "NotoSansDevanagari", te: "NotoSansTelugu", ta: "NotoSansTamil", bn: "NotoSansBengali", kn: "NotoSansKannada", ml: "NotoSansMalayalam" };

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

const C = { ink: "#1a1714", muted: "#6f675d", line: "#e7dfd3", violet: "#6C47FF", saffron: "#FF8A1F", fuchsia: "#D946EF", good: "#1f9d55", warm: "#fff4e8", soft: "#f4f0ff", sun: "#FFD23F" };

type Labels = NonNullable<WeeklyCoach["labels"]>;
const LABELS: Record<string, Labels> = {
  en: { report: "Weekly report", views: "Views", watchTime: "Watch hours", subscribers: "New subscribers", wins: "What went well", fixes: "Fix this week", next: "Your next video", milestone: "to your next milestone" },
  hinglish: { report: "Weekly report", views: "Views", watchTime: "Watch hours", subscribers: "Naye subscribers", wins: "Kya accha gaya", fixes: "Is hafte sudhaaro", next: "Aapka next video", milestone: "agle milestone tak" },
  hi: { report: "साप्ताहिक रिपोर्ट", views: "व्यूज़", watchTime: "देखने के घंटे", subscribers: "नए सब्सक्राइबर", wins: "क्या अच्छा रहा", fixes: "इस हफ्ते सुधारें", next: "आपका अगला वीडियो", milestone: "अगले माइलस्टोन तक" },
};

/** Emoji and pictographs aren't in these fonts; drop them rather than print empty boxes. */
function clean(s: string): string {
  return s.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{20E3}]/gu, "").replace(/\s{2,}/g, " ").trim();
}

const INDIC = /[ऀ-෿‌‍।॥₹]/u;

/** Splits text into runs that each need one font: the language's script font, or Latin. */
export function runs(text: string): { indic: boolean; text: string }[] {
  const out: { indic: boolean; text: string }[] = [];
  for (const ch of text) {
    // Spaces and joiners stay with the run they're in, so words aren't split across fonts.
    const indic = /\s/.test(ch) && out.length ? out[out.length - 1].indic : INDIC.test(ch);
    const last = out[out.length - 1];
    if (last && last.indic === indic) last.text += ch;
    else out.push({ indic, text: ch });
  }
  return out;
}

export function weeklyPdf(f: WeeklyFacts, coach: WeeklyCoach, language: string, opts: { channel?: string; site?: string } = {}): Promise<Buffer> {
  patchFontkit();
  const L = coach.labels ?? LABELS[language] ?? LABELS.en;
  const script = SCRIPT_FONT[language];
  const doc = new PDFDocument({ size: "A4", margin: 40, font: path.join(FONT_DIR, "NotoSans-Regular.ttf"), info: { Title: `Mitra · ${f.channel} · ${f.period}`, Author: "Mitra" } });
  doc.registerFont("latin", path.join(FONT_DIR, "NotoSans-Regular.ttf"));
  doc.registerFont("latin-bold", path.join(FONT_DIR, "NotoSans-Bold.ttf"));
  if (script) {
    doc.registerFont("script", path.join(FONT_DIR, `${script}-Regular.ttf`));
    doc.registerFont("script-bold", path.join(FONT_DIR, `${script}-Bold.ttf`));
  }
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const W = doc.page.width;
  const M = 40;
  const CW = W - M * 2;

  /** Writes mixed-script text at (x, y) within width, switching fonts per run. */
  function write(text: string, x: number, y: number | undefined, o: { size: number; bold?: boolean; color?: string; width?: number; lineGap?: number }) {
    const parts = runs(clean(text));
    doc.fillColor(o.color ?? C.ink).fontSize(o.size);
    parts.forEach((p, i) => {
      const font = p.indic && script ? (o.bold ? "script-bold" : "script") : o.bold ? "latin-bold" : "latin";
      doc.font(font);
      const opts = { width: o.width ?? CW, lineGap: o.lineGap ?? 2, continued: i < parts.length - 1 };
      if (i === 0) doc.text(p.text, x, y, opts);
      else doc.text(p.text, opts);
    });
  }

  // ---- Header band -----------------------------------------------------------------------------------
  const grad = doc.linearGradient(0, 0, W, 120);
  grad.stop(0, C.saffron).stop(0.5, C.fuchsia).stop(1, C.violet);
  doc.rect(0, 0, W, 120).fill(grad);
  // Mark: white circle with an "m", sun dot.
  doc.circle(M + 18, 42, 18).fill("#ffffff");
  doc.lineWidth(3.2).strokeColor(C.violet).lineCap("round").lineJoin("round");
  // The "m" is 14.4pt wide; centre it in the circle.
  doc.save().translate(M + 18 - 7.2 - 34, 0);
  doc.path("M 34 52 L 34 45 a 3.6 3.6 0 0 1 7.2 0 L 41.2 52 M 41.2 52 L 41.2 39 a 3.6 3.6 0 0 1 7.2 0 L 48.4 52").stroke();
  doc.restore();
  doc.circle(M + 29, 31, 3.2).fill(C.sun);
  write("mitra", M + 44, 28, { size: 20, bold: true, color: "#ffffff" });
  write(L.report, M, 72, { size: 22, bold: true, color: "#ffffff", width: CW * 0.6 });
  write(`${f.channel} · ${f.period}`, M + CW * 0.6, 80, { size: 11, color: "#ffffff", width: CW * 0.4 });
  doc.text("", M, 140);

  // ---- Headline ------------------------------------------------------------------------------------------
  write(coach.headline, M, 140, { size: 15, bold: true });
  let y = doc.y + 14;

  // ---- Three big numbers ---------------------------------------------------------------------------------
  const cardW = (CW - 20) / 3;
  const stats: [string, string, string | null][] = [
    [L.views, compact(f.views), f.viewsChange == null ? null : `${f.viewsChange >= 0 ? "+" : ""}${f.viewsChange.toFixed(0)}%`],
    [L.watchTime, compact(f.watchHours), null],
    [L.subscribers, `+${full(f.subscribersGained)}`, f.subscribersChange == null ? null : `${f.subscribersChange >= 0 ? "+" : ""}${f.subscribersChange.toFixed(0)}%`],
  ];
  stats.forEach(([label, value, change], i) => {
    const x = M + i * (cardW + 10);
    doc.roundedRect(x, y, cardW, 78, 12).fill(C.warm);
    write(label, x + 14, y + 12, { size: 10, color: C.muted, width: cardW - 28 });
    write(value, x + 14, y + 30, { size: 24, bold: true, width: cardW - 28 });
    if (change) write(change, x + 14, y + 60, { size: 9, bold: true, color: change.startsWith("-") ? "#c0392b" : C.good, width: cardW - 28 });
  });
  y += 92;

  // ---- Milestone -------------------------------------------------------------------------------------------
  if (f.nextMilestone) {
    const done = Math.max(0, Math.min(1, 1 - f.nextMilestone.left / f.nextMilestone.at));
    write(`${full(f.nextMilestone.left)} ${L.milestone}: ${compact(f.nextMilestone.at)}`, M, y, { size: 10, color: C.muted });
    y = doc.y + 4;
    doc.roundedRect(M, y, CW, 8, 4).fill(C.line);
    const bar = doc.linearGradient(M, 0, M + CW, 0);
    bar.stop(0, C.saffron).stop(0.5, C.fuchsia).stop(1, C.violet);
    doc.roundedRect(M, y, Math.max(8, CW * done), 8, 4).fill(bar);
    y += 22;
  }

  // ---- Chart: daily views, this week highlighted ----------------------------------------------------------
  if (f.days.length > 1) {
    const chartH = 90;
    const max = Math.max(...f.days.map((d) => d.views), 1);
    const bw = CW / f.days.length;
    f.days.forEach((d, i) => {
      const h = Math.max(2, (d.views / max) * chartH);
      const thisWeek = i >= f.days.length - 7;
      doc.roundedRect(M + i * bw + 3, y + chartH - h, bw - 6, h, 3).fill(thisWeek ? C.violet : C.line);
    });
    doc.fillColor(C.muted).font("latin").fontSize(8);
    doc.text(shortDate(f.days[0].date), M, y + chartH + 4, { width: 80 });
    doc.text(shortDate(f.days[f.days.length - 1].date), M + CW - 80, y + chartH + 4, { width: 80, align: "right" });
    y += chartH + 24;
  }

  // ---- Lists -----------------------------------------------------------------------------------------------
  function section(title: string, items: string[], color: string, bg: string) {
    if (!items.length) return;
    const top = y;
    // Measure by writing, then draw the background behind (PDFKit draws in order, so draw first with an estimate).
    const est = 30 + items.reduce((h, it) => h + Math.ceil(clean(it).length / 70) * 17 + 6, 0);
    doc.roundedRect(M, top, CW, est, 12).fill(bg);
    doc.rect(M, top, 4, est).fill(color);
    write(title, M + 16, top + 10, { size: 12, bold: true, color });
    let iy = doc.y + 4;
    for (const it of items) {
      write(`•  ${it}`, M + 16, iy, { size: 11, width: CW - 32 });
      iy = doc.y + 4;
    }
    y = Math.max(top + est, iy) + 12;
  }
  section(L.wins, coach.wins, C.good, "#eefaf2");
  section(L.fixes, coach.fixes, "#d35400", C.warm);
  section(L.next, [`${coach.nextVideo.idea} — ${coach.nextVideo.why}`], C.violet, C.soft);

  // ---- Footer ----------------------------------------------------------------------------------------------
  // Writing inside the bottom margin would start a new page; the footer belongs on this one.
  doc.page.margins.bottom = 0;
  const fy = doc.page.height - 48;
  doc.moveTo(M, fy - 8).lineTo(W - M, fy - 8).lineWidth(0.5).strokeColor(C.line).stroke();
  doc.fillColor(C.muted).font("latin").fontSize(8).text(`Mitra · ${opts.site ?? new URL(SITE_URL).host} · Numbers from YouTube Analytics (latest 7 days available)`, M, fy, { width: CW, align: "center" });

  doc.end();
  return done;
}
