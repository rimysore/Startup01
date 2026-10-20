"use client";

import { useEffect, useState } from "react";
import { BETA } from "@/lib/beta";
import { useReducedMotion } from "./celebrate";

const ALL_WORDS = [
  { text: "हिन्दी", cls: "font-indic" },
  { text: "తెలుగు", cls: "font-indic" },
  { text: "தமிழ்", cls: "font-indic" },
  { text: "Hinglish", cls: "" },
  { text: "मराठी", cls: "font-indic" },
  { text: "বাংলা", cls: "font-indic" },
  { text: "ಕನ್ನಡ", cls: "font-indic" },
  { text: "മലയാളം", cls: "font-indic" },
];
// Hindi and Kannada only during the beta.
const WORDS = BETA ? ALL_WORDS.filter((w) => w.text === "हिन्दी" || w.text === "ಕನ್ನಡ") : ALL_WORDS;

/** The hero's rotating language word. Static for reduced motion. */
export function RotatingLanguage() {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => setI((n) => (n + 1) % WORDS.length), 1800);
    return () => clearInterval(t);
  }, [reduced]);
  const w = WORDS[i];
  return (
    <span className="relative inline-block">
      <span key={w.text} className={`word-in text-brand inline-block pb-2 ${w.cls}`}>
        {w.text}
      </span>
      <span className="sr-only">{BETA ? " and Kannada" : ", Telugu, Tamil, Hinglish, Marathi, Bengali, Kannada and Malayalam"}</span>
    </span>
  );
}

const ALL_SAMPLES = [
  { code: "Hinglish", text: "Intro bahut lamba hai — pehle result dikhao, phir kahani. 0:42 pe 31% log chale gaye.", cls: "" },
  { code: "हिन्दी", text: "आपका इंट्रो बहुत लंबा है — पहले नतीजा दिखाइए, फिर कहानी। 0:42 पर 31% दर्शक चले गए।", cls: "font-indic" },
  { code: "తెలుగు", text: "మీ ఇంట్రో చాలా పొడవుగా ఉంది — ముందు ఫలితం చూపించండి, తర్వాత కథ. 0:42 దగ్గర 31% మంది వెళ్లిపోయారు.", cls: "font-indic" },
  { code: "தமிழ்", text: "உங்க இன்ட்ரோ ரொம்ப நீளம் — முதல்ல ரிசல்ட் காட்டுங்க, அப்புறம் கதை. 0:42-ல 31% பேர் போயிட்டாங்க.", cls: "font-indic" },
  { code: "English", text: "Your intro is too long — show the result first, then the story. 31% of viewers left at 0:42.", cls: "" },
];
// Kannada line still needs a native speaker's check (docs/BETA.md).
const KANNADA = { code: "ಕನ್ನಡ", text: "ನಿಮ್ಮ ಇಂಟ್ರೋ ತುಂಬಾ ಉದ್ದ ಇದೆ — ಮೊದಲು ರಿಸಲ್ಟ್ ತೋರಿಸಿ, ಆಮೇಲೆ ಕಥೆ. 0:42 ಹತ್ತಿರ 31% ಜನ ಹೋಗಿಬಿಟ್ರು.", cls: "font-indic" };
const SAMPLES = BETA ? [ALL_SAMPLES[1], KANNADA] : ALL_SAMPLES;

/** The same Video Doctor advice in five languages: the core promise, shown not told. */
export function LanguageShowcase() {
  const [i, setI] = useState(0);
  const s = SAMPLES[i];
  return (
    <div className="rounded-[28px] border border-line bg-surface p-5 shadow-[0_30px_80px_-50px_rgba(0,0,0,0.5)] sm:p-7">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Language">
        {SAMPLES.map((x, n) => (
          <button
            key={x.code}
            role="tab"
            aria-selected={n === i}
            onClick={() => setI(n)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${x.cls} ${n === i ? "bg-ink text-bg" : "bg-surface-2 text-ink-2 hover:text-ink"}`}
          >
            {x.code}
          </button>
        ))}
      </div>
      <div className="mt-6 flex gap-3" role="tabpanel">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white" aria-hidden>
          M
        </span>
        <div key={s.code} className="word-in rounded-2xl rounded-tl-md bg-surface-2 px-5 py-4">
          <p className="text-xs font-semibold text-muted">Mitra · Video Doctor</p>
          <p className={`mt-1 text-lg leading-relaxed text-ink ${s.cls}`}>{s.text}</p>
        </div>
      </div>
    </div>
  );
}
