"use client";

import { useEffect, useRef, useState } from "react";

const STEPS = [
  { title: "Matched", body: "Mitra shows you a few offers that fit your niche, language and area. Not a hundred you'll never hear back from.", status: "3 offers fit you", foot: "Picked because the café's customers live where your viewers do." },
  { title: "Checked", body: "Before you reply, the offer checker flags what's missing: the fee, the date, when you're paid, how they'll use your video.", status: "Offer checked", foot: "One question to ask: can they run your reel as an ad, and for how long?" },
  { title: "Agreed", body: "The terms you both said yes to are saved in your deal log. No more scrolling WhatsApp to remember what was promised.", status: "Terms saved", foot: "Half in advance, half on posting. Usage: 30 days on their page." },
  { title: "Posted", body: "Your post carries its own promo code. The business sees the customers it brought; you get proof for your next deal.", status: "Live", foot: "Customers show code DOSA10 at the counter." },
  { title: "Paid", body: "The business pays you your full fee. On deals Mitra brought, the business pays Mitra's fee on top, shown to both of you before anyone agrees.", status: "Paid", foot: "You received ₹6,000 in full. The café paid Mitra ₹600 (10%) on top." },
];

/** Steps scroll past a pinned deal card that moves through its stages with them. The numbers are an example. */
export function DealStory() {
  const [step, setStep] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setStep(Number((e.target as HTMLElement).dataset.step));
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);
  const s = STEPS[step];
  const at = (n: number) => step >= n;
  return (
    <div className="lp-story">
      <div className="lp-story__steps">
        {STEPS.map((st, i) => (
          <div key={st.title} ref={(el) => { refs.current[i] = el; }} data-step={i} data-active={i === step} className="lp-step">
            <h3>{st.title}</h3>
            <p>{st.body}</p>
          </div>
        ))}
      </div>
      <div className="lp-story__pin">
        <div className="lp-card lp-deal" aria-live="polite">
          <div className="flex items-center justify-between gap-3">
            <span className="lp-chip lp-chip--ink">{s.status}</span>
            <span className="lp-label">Example deal</span>
          </div>
          <div className="lp-deal__bar" aria-hidden>
            {STEPS.map((_, i) => (
              <span key={i} data-on={at(i)} />
            ))}
          </div>
          <div className="lp-deal__rows">
            <div className="lp-deal__row lp-deal__row--minor"><span>Business</span><b>A dosa café · Jayanagar</b></div>
            <div className="lp-deal__row lp-deal__row--minor"><span>They want</span><b>1 Reel + 2 Stories</b></div>
            <div className="lp-deal__row"><span>Fee</span><b className="lp-swap" data-dim={!at(1)}>₹6,000</b></div>
            <div className="lp-deal__row lp-deal__row--minor"><span>Paid when</span><b className="lp-swap" data-dim={!at(2)}>{at(2) ? "50% now, 50% on posting" : "Not stated"}</b></div>
            <div className="lp-deal__row"><span>Promo code</span><b className="lp-swap" data-dim={!at(3)}>{at(3) ? "DOSA10" : "Made when it's live"}</b></div>
            <div className="lp-deal__row lp-deal__row--minor"><span>Customers who used it</span><b className="lp-swap tabular-nums" data-dim={!at(3)}>{at(3) ? "38" : "–"}</b></div>
            <div className="lp-deal__row"><span>Paid to you</span><b className="lp-swap tabular-nums" data-dim={!at(4)}>{at(4) ? "₹6,000" : "–"}</b></div>
          </div>
          <p className="lp-deal__foot" key={step} style={{ animation: "lp-fade 500ms var(--ease) both" }}>
            {s.foot}
          </p>
        </div>
      </div>
    </div>
  );
}
