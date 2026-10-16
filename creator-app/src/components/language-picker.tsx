"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LANGUAGES, type LanguageCode } from "@/lib/languages";
import { useDashboard } from "./dashboard-context";

/** A short line in each language, so creators recognise theirs at a glance. */
const HELLO: Record<LanguageCode, string> = {
  hinglish: "Chalo shuru karte hain",
  hi: "चलिए शुरू करते हैं",
  te: "మొదలు పెడదాం",
  ta: "தொடங்கலாம்",
  mr: "चला सुरू करूया",
  bn: "চলুন শুরু করি",
  kn: "ಪ್ರಾರಂಭಿಸೋಣ",
  ml: "നമുക്ക് തുടങ്ങാം",
  en: "Let's get started",
};

function Grid({ value, onPick }: { value: LanguageCode | null; onPick: (l: LanguageCode) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          onClick={() => onPick(l.code)}
          aria-pressed={value === l.code}
          className={`rounded-2xl border-2 px-4 py-3.5 text-left transition active:scale-[0.98] ${
            value === l.code ? "border-accent bg-accent-soft" : "border-line bg-surface hover:border-ink/30"
          }`}
        >
          <span className="font-indic block text-xl font-bold leading-tight">{l.native}</span>
          <span className="mt-0.5 block text-xs text-muted">{l.native === l.label ? HELLO[l.code] : l.label}</span>
        </button>
      ))}
    </div>
  );
}

function Sheet({ children, onClose, label }: { children: React.ReactNode; onClose?: () => void; label: string }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-label={label} onClick={onClose}>
      <div
        className="toast-in max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] bg-bg p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-w-lg sm:rounded-[28px] sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

/**
 * Asked once, right after the first sign-in: everything Mitra writes (answers, reports, WhatsApp) follows this
 * choice. It can't be dismissed without choosing, but every option is one tap.
 */
export function LanguageOnboarding() {
  const { me, language, setLanguage, refreshMe } = useDashboard();
  const [done, setDone] = useState(false);
  const [hint, setHint] = useState(false);
  const show = Boolean(me?.user && me.languageChosen === false && !done);

  useEffect(() => {
    if (!hint) return;
    const t = setTimeout(() => setHint(false), 9000);
    return () => clearTimeout(t);
  }, [hint]);

  function pick(l: LanguageCode) {
    setLanguage(l);
    setDone(true);
    setHint(true);
    setTimeout(refreshMe, 800);
  }

  if (hint) {
    return (
      <div role="status" className="toast-in fixed inset-x-3 top-[4.5rem] z-50 sm:left-auto sm:right-6 sm:w-96">
        <div className="relative rounded-2xl bg-ink p-4 pr-10 text-sm text-bg shadow-2xl">
          <span className="absolute -top-2 right-24 h-4 w-4 rotate-45 bg-ink sm:right-32" aria-hidden />
          <p className="font-semibold">✅ Saved. Mitra will write in this language.</p>
          <p className="mt-1 text-bg/75">Change it any time with the 🌐 button at the top, or on WhatsApp: send &quot;menu&quot; → Language.</p>
          <button onClick={() => setHint(false)} className="absolute right-3 top-3 text-lg leading-none text-bg/70" aria-label="Close">
            ×
          </button>
        </div>
      </div>
    );
  }
  if (!show) return null;
  return (
    <Sheet label="Choose your language">
      <p className="text-4xl" aria-hidden>
        🌐
      </p>
      <h2 className="mt-2 font-display text-3xl leading-tight">Choose your language</h2>
      <p className="font-indic mt-1 text-sm text-muted">अपनी भाषा चुनें · మీ భాషను ఎంచుకోండి · உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்</p>
      <p className="mt-3 text-sm text-ink-2">Mitra will write your advice, reports and WhatsApp messages in it. You can change it any time.</p>
      <div className="mt-5">
        <Grid value={language} onPick={pick} />
      </div>
    </Sheet>
  );
}

/** The 🌐 button in the top bar: shows the current language in its own script, opens the same picker. */
export function LanguageButton() {
  const { language, setLanguage } = useDashboard();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="font-indic flex min-w-0 items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-2 text-sm font-semibold hover:bg-surface-2"
        title="Language Mitra writes in"
        aria-label={`Language: ${current.label}. Change`}
      >
        <span aria-hidden>🌐</span>
        <span className="truncate">{current.native}</span>
      </button>
      {open && (
        <Sheet label="Change language" onClose={() => setOpen(false)}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl">Language</h2>
              <p className="mt-1 text-sm text-muted">Mitra writes advice, reports and WhatsApp messages in this language.</p>
            </div>
            <button onClick={() => setOpen(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-2 text-xl" aria-label="Close">
              ×
            </button>
          </div>
          <div className="mt-5">
            <Grid
              value={language}
              onPick={(l) => {
                setLanguage(l);
                setOpen(false);
              }}
            />
          </div>
        </Sheet>
      )}
    </>
  );
}
