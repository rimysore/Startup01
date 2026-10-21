"use client";

import { useEffect, useRef, useState } from "react";

type Offer = { place: string; meta: string; want: string; fee: string; by: string; note: { tone: "ok" | "warn"; text: string } };

/** Example offers only (labelled on each card). */
const OFFERS: Offer[] = [
  { place: "A dosa café in Jayanagar", meta: "2 km from you · Food · Kannada", want: "1 Reel + 2 Stories", fee: "₹6,000", by: "2 November", note: { tone: "warn", text: "Ask about usage rights" } },
  { place: "A salon in Basavanagudi", meta: "3 km from you · Beauty · Kannada", want: "1 Reel", fee: "₹4,500", by: "8 November", note: { tone: "ok", text: "Half paid in advance" } },
  { place: "A bookshop in Malleshwaram", meta: "5 km from you · Local finds · English", want: "2 Stories", fee: "₹2,000 + books", by: "15 November", note: { tone: "warn", text: "Part barter: check it's worth it" } },
];

const EVERY_MS = 3400;

function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 10.5 8 14.5 16 5.5" />
    </svg>
  );
}

/**
 * The hero's example offers as a deck: every few seconds the front card dips out and slides to the back while the
 * others step forward. Pauses on hover, on focus and in a background tab; holds still under reduced motion.
 */
export function OfferStack() {
  const [front, setFront] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const frontRef = useRef(0);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      if (document.hidden) return;
      const f = frontRef.current;
      frontRef.current = (f + 1) % OFFERS.length;
      setLeaving(f);
      setFront(frontRef.current);
    }, EVERY_MS);
    return () => clearInterval(t);
  }, [paused]);

  return (
    <div
      className="lp-stack"
      role="group"
      aria-roledescription="carousel"
      aria-label="Example offers"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {OFFERS.map((o, i) => {
        const pos = (i - front + OFFERS.length) % OFFERS.length;
        return (
          <article key={o.place} className="lp-card lp-stack__card" data-pos={pos} data-leaving={leaving === i && pos === OFFERS.length - 1} aria-hidden={pos !== 0}>
            <div className="flex items-center justify-between gap-3">
              <span className="lp-chip lp-chip--ink">New offer near you</span>
              <span className="lp-label">Example</span>
            </div>
            <p className="mt-5 font-[family-name:var(--font-display-face)] text-[28px] font-semibold leading-tight tracking-[-0.03em]">{o.place}</p>
            <p className="mt-1 text-[15px]" style={{ color: "var(--ink-2)" }}>
              {o.meta}
            </p>
            <div className="lp-deal__rows">
              <div className="lp-deal__row"><span>They want</span><b>{o.want}</b></div>
              <div className="lp-deal__row"><span>Fee</span><b>{o.fee}</b></div>
              <div className="lp-deal__row"><span>Post by</span><b>{o.by}</b></div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="lp-chip lp-chip--ok"><Check /> Offer checked</span>
              <span className={`lp-chip ${o.note.tone === "ok" ? "lp-chip--ok" : "lp-chip--warn"}`}>
                {o.note.tone === "ok" ? <Check /> : <span className="lp-dot" />} {o.note.text}
              </span>
            </div>
          </article>
        );
      })}
      <div className="lp-stack__dots" aria-hidden>
        {OFFERS.map((o, i) => (
          <span key={o.place} data-on={i === front} />
        ))}
      </div>
    </div>
  );
}
