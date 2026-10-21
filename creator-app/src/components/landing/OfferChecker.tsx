"use client";

import { useMemo, useState } from "react";
import { checkOffer, offerReply, type OfferLang } from "@/lib/offer-check";

const EXAMPLES = [
  {
    label: "Free meal + “exposure”",
    text: "Hi! Loved your food reels 😍 We'd like 1 reel + 3 stories for our new outlet in Jayanagar. We'll give a free meal for 2 and exposure to our followers. Need it this weekend.",
  },
  {
    label: "A fair offer",
    text: "Hello! We'd pay ₹6,000 for 1 reel and 2 stories, 50% advance and the rest on posting, live by 2 Nov as a paid partnership. We may repost it on our page for 30 days.",
  },
  {
    label: "Exclusive, no fee",
    text: "We want you as our exclusive face for 3 months, no other cafes. Post 4 reels a month about us. We'll grow your page with shoutouts.",
  },
];

const ICON = {
  ok: { stroke: "var(--ok)", d: "M4 10.5 8 14.5 16 5.5", label: "Clear" },
  warn: { stroke: "var(--warn)", d: "M10 4v7M10 15.5v.5", label: "Careful" },
  missing: { stroke: "var(--miss)", d: "M5 5l10 10M15 5 5 15", label: "Missing" },
};

/** Paste an offer, see what's clear, risky or missing, and copy a reply that asks for the rest. */
export function OfferChecker() {
  const [text, setText] = useState(EXAMPLES[0].text);
  const [lang, setLang] = useState<OfferLang>("en");
  const [copied, setCopied] = useState(false);
  const checks = useMemo(() => (text.trim() ? checkOffer(text) : []), [text]);
  const reply = useMemo(() => offerReply(checks, lang), [checks, lang]);
  const clear = checks.filter((c) => c.state === "ok").length;

  async function copy() {
    if (!reply) return;
    try {
      await navigator.clipboard.writeText(reply);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }

  return (
    <div className="lp-check">
      <div>
        <label htmlFor="offer" className="sr-only">
          Paste the offer you received
        </label>
        <textarea id="offer" value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste the message a brand or shop sent you…" spellCheck={false} />
        <div className="lp-examples" role="group" aria-label="Example offers">
          {EXAMPLES.map((e) => (
            <button key={e.label} type="button" aria-pressed={text === e.text} onClick={() => setText(e.text)}>
              {e.label}
            </button>
          ))}
        </div>
      </div>
      <div className="lp-card lp-check__out" aria-live="polite">
        {checks.length ? (
          <>
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-[15px] font-semibold">
                {clear} of {checks.length} things are clear
              </p>
              <span className="lp-label">Rule-based check, no AI</span>
            </div>
            <div className="mt-2" key={text}>
              {checks.map((c, i) => (
                <div key={c.term} className="lp-res" style={{ ["--i" as string]: i }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={ICON[c.state].stroke} strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                    <path d={ICON[c.state].d} />
                  </svg>
                  <span>
                    <span className="sr-only">{ICON[c.state].label}: </span>
                    {c.text}
                  </span>
                </div>
              ))}
            </div>
            {reply && (
              <div className="mt-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[15px] font-semibold">Your reply</p>
                  <div className="lp-switch" data-on={lang === "kn" ? "business" : "creator"} style={{ fontSize: 13 }}>
                    <span className="lp-switch__pill" aria-hidden />
                    <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")} style={{ minHeight: 32 }}>
                      English
                    </button>
                    <button type="button" aria-pressed={lang === "kn"} onClick={() => setLang("kn")} className="kn" style={{ minHeight: 32 }}>
                      ಕನ್ನಡ
                    </button>
                  </div>
                </div>
                <p className={`lp-reply ${lang === "kn" ? "kn" : ""}`} lang={lang}>
                  {reply}
                </p>
                <button type="button" onClick={copy} className="lp-btn lp-btn--ghost mt-3" style={{ minHeight: 44 }}>
                  {copied ? "Copied" : "Copy reply"}
                </button>
              </div>
            )}
          </>
        ) : (
          <p style={{ color: "var(--ink-2)" }}>Paste an offer on the left and Mitra reads it as you type.</p>
        )}
      </div>
    </div>
  );
}
