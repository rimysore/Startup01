"use client";

import { useEffect, useRef, useState } from "react";
import { MilestoneRing, RollingNumber, useReducedMotion } from "./celebrate";

/**
 * The landing page's "feel it" moment: a sample channel's subscriber counter that ticks up, with a
 * milestone ring and a toast-style win. Clearly labelled as an example.
 */
export function LandingCounter() {
  const reduced = useReducedMotion();
  const [subs, setSubs] = useState(98_742);
  const [gain, setGain] = useState<number | null>(null);
  const [pop, setPop] = useState(0);
  const card = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => {
      const g = 3 + Math.floor(Math.random() * 18);
      setSubs((s) => (s + g >= 100_000 ? 98_742 : s + g));
      setGain(g);
      setPop((p) => p + 1);
    }, 2600);
    return () => clearInterval(t);
  }, [reduced]);

  return (
    <div ref={card} className="relative">
      <div className="relative overflow-hidden rounded-[28px] bg-ink p-6 text-bg shadow-[0_40px_90px_-40px_rgba(0,0,0,0.6)] sm:p-7">
        <div className="glow-blob pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-accent/45 blur-3xl" aria-hidden />
        <div className="glow-blob pointer-events-none absolute -bottom-28 -left-10 h-56 w-56 rounded-full bg-peacock/35 blur-3xl" style={{ animationDelay: "-6s" }} aria-hidden />
        <div className="relative flex items-center justify-between text-xs">
          <span className="text-bg/70">Example channel · Telugu tech</span>
          <span className="inline-flex items-center gap-2 rounded-full bg-bg/10 px-3 py-1">
            <span className="live-dot h-2 w-2 rounded-full bg-good" /> Live
          </span>
        </div>
        <p className="relative mt-5 text-xs font-medium uppercase tracking-[0.18em] text-accent">Subscribers</p>
        <p key={pop} className={`relative mt-1 text-5xl font-semibold leading-none tracking-tight sm:text-6xl ${pop ? "pop" : ""}`}>
          <RollingNumber value={subs} />
        </p>
        <p className="relative mt-2 h-5 text-sm text-good">{gain ? `+${gain} just now 🎉` : " "}</p>
        <div className="relative mt-5 border-t border-bg/10 pt-5">
          <MilestoneRing subscribers={subs} perDay={260} />
        </div>
      </div>
      <div className="card absolute -left-6 -top-14 hidden rotate-[-4deg] px-4 py-3 shadow-lg sm:block">
        <p className="text-[11px] uppercase tracking-wider text-muted">This week</p>
        <p className="text-sm font-semibold">🔥 Best day ever: 48K views</p>
      </div>
      <div className="absolute -bottom-5 -right-3 rotate-[3deg] rounded-full bg-accent px-4 py-2 font-indic text-sm font-semibold text-accent-ink shadow-lg">
        ⚡ 12-day subscriber streak
      </div>
    </div>
  );
}
