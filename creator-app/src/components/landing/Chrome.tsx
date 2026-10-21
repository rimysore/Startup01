"use client";

import { useEffect, useRef, useState } from "react";

/** The top bar: transparent at the top of the page, a paper ground with a hairline once you scroll. */
export function StickyNav({ children }: { children: React.ReactNode }) {
  const [stuck, setStuck] = useState(false);
  const sentinel = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <>
      <span ref={sentinel} aria-hidden className="absolute top-0 h-px w-px" />
      <header className="lp-nav" data-stuck={stuck}>
        {children}
      </header>
    </>
  );
}

/**
 * Scroll reveals run on CSS scroll timelines where the browser has them. Elsewhere this observer adds .is-in once,
 * and the layout's 3-second fallback shows everything if no script runs.
 */
export function Reveals() {
  useEffect(() => {
    (window as unknown as { __mitraReveals?: boolean }).__mitraReveals = true;
    if (CSS.supports("animation-timeline: view()")) return;
    const els = [...document.querySelectorAll<HTMLElement>(".lp [data-reveal]")];
    if (!("IntersectionObserver" in window)) return els.forEach((el) => el.classList.add("is-in"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
