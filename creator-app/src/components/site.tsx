"use client";

import { useEffect, useMemo, useState } from "react";

/* ------------------------------------------------------------------------------------------------------------------
 * The landing page's live pieces: the Video Doctor panel on the hero stage, the title check, the watch-hours slider,
 * the India clock in the footer and the reveal observer. Every number they show is computed from what's on screen.
 * ---------------------------------------------------------------------------------------------------------------- */

type Lang = "hi" | "kn" | "en";
const LANGS: { code: Lang; label: string }[] = [
  { code: "hi", label: "हिन्दी" },
  { code: "kn", label: "ಕನ್ನಡ" },
  { code: "en", label: "English" },
];

/** Viewers still watching (%) at each second of a 10-minute example video; straight lines between these points. */
const KEYS: [number, number][] = [
  [0, 100], [12, 95], [30, 90], [42, 74], [55, 62], [90, 58], [150, 54], [240, 49], [252, 44], [275, 39], [330, 37],
  [420, 34], [440, 33], [450, 37], [462, 36], [500, 33], [560, 30], [585, 27], [600, 21],
];
const LENGTH = 600;
function at(t: number) {
  for (let i = 1; i < KEYS.length; i++) {
    const [t1, v1] = KEYS[i];
    const [t0, v0] = KEYS[i - 1];
    if (t <= t1) return v0 + ((v1 - v0) * (t - t0)) / (t1 - t0);
  }
  return KEYS[KEYS.length - 1][1];
}
const CURVE = Array.from({ length: LENGTH + 1 }, (_, t) => at(t));
/** Average percentage viewed = the mean of the curve, as YouTube defines it. */
const AVG = Math.round(CURVE.reduce((a, b) => a + b, 0) / CURVE.length);

type Moment = { t: number; tag: string; tone: "bad" | "good"; say: Record<Lang, { why: string; fixes: string[] }> };
// Kannada lines are a first draft: a native speaker checks them before launch (docs/BETA.md).
const MOMENTS: Moment[] = [
  {
    t: 42,
    tag: "0:42  −31%",
    tone: "bad",
    say: {
      hi: { why: "आपका इंट्रो बहुत लंबा है। पहले नतीजा दिखाइए, फिर कहानी।", fixes: ["शुरुआत आख़िरी तुलना वाले शॉट से कीजिए।", "चैनल इंट्रो 3 सेकंड का कर दीजिए।"] },
      kn: { why: "ನಿಮ್ಮ ಇಂಟ್ರೋ ತುಂಬಾ ಉದ್ದ ಇದೆ. ಮೊದಲು ರಿಸಲ್ಟ್ ತೋರಿಸಿ, ಆಮೇಲೆ ಕಥೆ.", fixes: ["ಕೊನೆಯ ಹೋಲಿಕೆಯ ಶಾಟ್‌ನಿಂದ ಶುರು ಮಾಡಿ.", "ಚಾನೆಲ್ ಇಂಟ್ರೋವನ್ನು 3 ಸೆಕೆಂಡ್‌ಗೆ ಇಳಿಸಿ."] },
      en: { why: "Your intro is too long. Show the result first, then the story.", fixes: ["Open on the final side-by-side shot.", "Cut the channel intro to 3 seconds."] },
    },
  },
  {
    t: 252,
    tag: "4:12  −18%",
    tone: "bad",
    say: {
      hi: { why: "यहाँ आप कीमत की तुलना दोबारा कर रहे हैं। दर्शक ये पहले से जानते हैं।", fixes: ["ये 40 सेकंड काट दीजिए।", "इसकी जगह कैमरा टेस्ट यहाँ लाइए।"] },
      kn: { why: "ಇಲ್ಲಿ ಬೆಲೆ ಹೋಲಿಕೆಯನ್ನು ಮತ್ತೆ ಹೇಳುತ್ತಿದ್ದೀರಿ. ವೀಕ್ಷಕರಿಗೆ ಅದು ಈಗಾಗಲೇ ಗೊತ್ತು.", fixes: ["ಈ 40 ಸೆಕೆಂಡ್ ಕಟ್ ಮಾಡಿ.", "ಅದರ ಬದಲು ಕ್ಯಾಮೆರಾ ಟೆಸ್ಟ್ ಇಲ್ಲಿ ಇಡಿ."] },
      en: { why: "You repeat the price comparison here. Viewers already know it.", fixes: ["Cut these 40 seconds.", "Move the camera test up to here."] },
    },
  },
  {
    t: 450,
    tag: "7:30  rewatched",
    tone: "good",
    say: {
      hi: { why: "दर्शकों ने रात वाला कैमरा टेस्ट पीछे जाकर दोबारा देखा।", fixes: ["अगला वीडियो ऐसे ही टेस्ट से शुरू कीजिए।", "थंबनेल के लिए यही फ्रेम लीजिए।"] },
      kn: { why: "ವೀಕ್ಷಕರು ರಾತ್ರಿ ಕ್ಯಾಮೆರಾ ಟೆಸ್ಟ್ ಅನ್ನು ಹಿಂದೆ ಹೋಗಿ ಮತ್ತೆ ನೋಡಿದರು.", fixes: ["ಮುಂದಿನ ವೀಡಿಯೊವನ್ನು ಇಂಥದ್ದೇ ಟೆಸ್ಟ್‌ನಿಂದ ಶುರು ಮಾಡಿ.", "ಥಂಬ್‌ನೇಲ್‌ಗೆ ಇದೇ ಫ್ರೇಮ್ ಬಳಸಿ."] },
      en: { why: "Viewers rewound to watch the night camera test again.", fixes: ["Open your next video with a test like this.", "Use this frame for the thumbnail."] },
    },
  },
];

const W = 600;
const H = 150;
const x = (t: number) => (t / LENGTH) * W;
const y = (v: number) => 10 + (1 - v / 100) * (H - 20);

/** The hero's live thing: tap a moment on the example video's retention curve and read why, in Hindi, Kannada or English. */
export function DoctorPanel() {
  const [lang, setLang] = useState<Lang>("hi");
  const [pick, setPick] = useState(0);
  const m = MOMENTS[pick];
  const say = m.say[lang];
  const d = useMemo(() => CURVE.filter((_, t) => t % 3 === 0 || t === LENGTH).map((v, i, a) => `${i ? "L" : "M"}${x(i === a.length - 1 ? LENGTH : i * 3).toFixed(1)},${y(v).toFixed(1)}`).join(""), []);
  return (
    <div data-ui className="ui-panel p-5 sm:p-6" style={{ boxShadow: "none" }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold text-muted">Video Doctor · example video</p>
          <p className="mt-0.5 text-[17px] font-semibold leading-snug">₹15,000 vs ₹1,50,000 phone camera</p>
        </div>
        <div className="text-right">
          <p className="text-[13px] text-muted">Average viewed</p>
          <p className="text-[22px] font-bold leading-none tabular-nums">{AVG}%</p>
        </div>
      </div>

      <div className="relative mt-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label={`Retention curve for a 10-minute video. Average viewed ${AVG}%. Drops at 0:42 and 4:12, a rewatch at 7:30.`}>
          {[25, 50, 75].map((v) => (
            <line key={v} x1="0" x2={W} y1={y(v)} y2={y(v)} stroke="var(--chart-grid)" strokeWidth="1" />
          ))}
          <path d={`${d}L${W},${H}L0,${H}Z`} fill="var(--accent)" opacity="0.1" />
          <path className="ui-line" d={d} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
          {MOMENTS.map((mm, i) => (
            <circle key={mm.t} cx={x(mm.t)} cy={y(at(mm.t))} r={i === pick ? 8 : 6} fill={mm.tone === "bad" ? "var(--bad)" : "var(--good)"} stroke="var(--surface)" strokeWidth="3" />
          ))}
        </svg>
        <div className="mt-1 flex justify-between text-[13px] tabular-nums text-muted" aria-hidden>
          <span>0:00</span>
          <span>5:00</span>
          <span>10:00</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Moments in the video">
        {MOMENTS.map((mm, i) => (
          <button
            key={mm.t}
            onClick={() => setPick(i)}
            aria-pressed={i === pick}
            className="ui-chip min-h-9 transition-colors"
            style={
              i === pick
                ? { background: mm.tone === "bad" ? "var(--bad)" : "var(--good)", color: "var(--surface)" }
                : { background: "var(--surface-2)", color: "var(--ink)" }
            }
          >
            {mm.tag}
          </button>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-[13px] font-semibold text-muted">Why, and what to change</p>
        <div className="ui-tabs" role="tablist" aria-label="Language">
          {LANGS.map((l) => (
            <button key={l.code} role="tab" aria-selected={l.code === lang} onClick={() => setLang(l.code)} className="ui-tab">
              {l.label}
            </button>
          ))}
        </div>
      </div>
      <div key={`${pick}-${lang}`} className="word-in mt-3" role="tabpanel" lang={lang}>
        <p className="text-[19px] font-semibold leading-snug">{say.why}</p>
        <ul className="mt-3 space-y-1.5 text-[15px] text-ink-2">
          {say.fixes.map((f) => (
            <li key={f} className="flex gap-2">
              <span className="text-accent" aria-hidden>→</span>
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ---- Title check ---- */

type Row = { ok: boolean; text: string };
const BEGGING = /(subscribe|please watch|must watch|like and share|support me|plz)/i;

/** Plain, rule-based checks on a title. Mitra's Title Studio does the real rewriting with AI; this is the free taste. */
export function checkTitle(raw: string): Row[] {
  const title = raw.trim();
  const len = [...title].length;
  const rows: Row[] = [];
  rows.push(
    len <= 60
      ? { ok: true, text: `${len} characters. Short enough to be read whole on a phone.` }
      : { ok: false, text: `${len} characters. The end may be cut off on phones, so put the hook in the first 50.` },
  );
  rows.push(
    /[0-9०-९೦-೯₹]/.test(title)
      ? { ok: true, text: "Has a number or price. Specifics make a title easier to trust." }
      : { ok: false, text: "No number or price. A specific detail (₹, minutes, days) gives viewers a reason to click." },
  );
  const latin = title.replace(/[^A-Za-z]/g, "");
  const caps = latin.replace(/[^A-Z]/g, "").length;
  if (BEGGING.test(title)) rows.push({ ok: false, text: "Asks for likes or subscribes. That space belongs to the hook; ask at the end of the video instead." });
  else if (latin.length >= 8 && caps / latin.length > 0.6) rows.push({ ok: false, text: "Mostly capital letters. It reads as shouting; keep capitals for one word at most." });
  else if (/[!?]{2,}/.test(title)) rows.push({ ok: false, text: "Repeated !! or ??. One mark is enough." });
  else if (/[?？]$/.test(title)) rows.push({ ok: true, text: "Ends on a question. Good, as long as the video answers it early." });
  else rows.push({ ok: true, text: "No shouting and no begging. Good." });
  return rows;
}

const EXAMPLES = ["₹500 ಫೋನ್ vs ₹50,000 ಫೋನ್: ಯಾವುದು ಗೆದ್ದಿತು?", "मैंने 30 दिन सिर्फ़ सत्तू खाया", "MY FIRST VLOG!!! PLEASE WATCH AND SUBSCRIBE"];

export function TitleCheck({ studioHref }: { studioHref: string }) {
  const [title, setTitle] = useState(EXAMPLES[0]);
  const rows = title.trim() ? checkTitle(title) : null;
  return (
    <div>
      <div className="s-type__field" data-ui>
        <label htmlFor="title-check" className="sr-only">
          Type a video title to check it
        </label>
        <input
          id="title-check"
          className="s-type__input indic"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Your next title"
          maxLength={100}
          spellCheck={false}
          autoComplete="off"
        />
      </div>
      <div className="s-type__answer" aria-live="polite" data-ui>
        {rows ? (
          rows.map((r) => (
            <div key={r.text} className="s-type__row">
              <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden className="mt-0.5" fill="none" stroke={r.ok ? "#72d9b0" : "#ffb4a8"} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                {r.ok ? <path d="M4 10.5 8 14.5 16 5.5" /> : <path d="M10 4v7M10 15.5v.5" />}
              </svg>
              <span>
                <span className="sr-only">{r.ok ? "Good: " : "Fix: "}</span>
                {r.text}
              </span>
            </div>
          ))
        ) : (
          <p className="text-[17px]">Type a title above and Mitra checks it as you type.</p>
        )}
        <p className="mt-6 text-[17px]" style={{ color: "var(--on-navy-2)" }}>
          These are quick checks. In the beta, Title Studio reads your video and writes three new titles and a 15-second hook in Hindi or Kannada.{" "}
          <a href={studioHref} className="s-link text-white">
            Open Title Studio
          </a>
        </p>
      </div>
      <div className="s-type__examples" role="group" aria-label="Example titles">
        {EXAMPLES.map((e) => (
          <button key={e} type="button" className="indic" aria-pressed={title === e} onClick={() => setTitle(e)}>
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---- Watch hours ---- */

const fmt = new Intl.NumberFormat("en-IN");

/** Watch hours gained when viewers watch 5 more percentage points of a 10-minute video: views × 10 × 0.05 ÷ 60. */
export function watchHoursGained(views: number) {
  return Math.round((views * 10 * 0.05) / 60);
}

export function WatchHours() {
  const [views, setViews] = useState(24_000);
  const hours = watchHoursGained(views);
  return (
    <div className="s-calc">
      <h2 className="s-calc__q">How many views per video?</h2>
      <div className="s-calc__control" data-ui>
        <label htmlFor="views" className="flex justify-between text-[15px] font-semibold">
          <span>Views per video</span>
          <span className="tabular-nums">{fmt.format(views)}</span>
        </label>
        <input id="views" type="range" min={1000} max={200000} step={1000} value={views} onChange={(e) => setViews(Number(e.target.value))} />
      </div>
      <div className="s-calc__foot">
        <p className="s-calc__figure" aria-live="polite">
          +{fmt.format(hours)}
          <span className="s-calc__unit">watch hours a video</span>
        </p>
        <p className="s-calc__how">
          If viewers watch 5 more percentage points of a 10-minute video: views × 10 minutes × 0.05 ÷ 60. YouTube asks for 4,000 public watch hours in 12
          months before it pays you.
        </p>
      </div>
    </div>
  );
}

/* ---- Footer clock ---- */

export function IndiaTime() {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const f = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
    const tick = () => setNow(f.format(new Date()));
    tick();
    const t = setInterval(tick, 20_000);
    return () => clearInterval(t);
  }, []);
  return <span className="tabular-nums">{now ?? "IST"}</span>;
}

/* ---- Reveal on scroll (once) ---- */

/** Adds .is-in to [data-reveal] blocks and the hero stage as they enter. html.js and a no-script fallback live in layout. */
export function Reveals() {
  useEffect(() => {
    (window as unknown as { __mitraReveals?: boolean }).__mitraReveals = true;
    // The hero stage is on the first screen, and its clip-path hides it from IntersectionObserver: open it now.
    const stages = document.querySelectorAll<HTMLElement>(".site .s-stage");
    const raf = requestAnimationFrame(() => stages.forEach((el) => el.classList.add("is-in")));
    const els = [...document.querySelectorAll<HTMLElement>(".site [data-reveal]")];
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );
    els.forEach((el) => io.observe(el));
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);
  return null;
}
