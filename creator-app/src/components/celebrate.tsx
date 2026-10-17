"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

// ---- Motion preference -------------------------------------------------------------------------------

function subscribeMotion(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

// ---- Rolling (odometer) number ----------------------------------------------------------------------

const DIGITS = "0123456789";

/**
 * Each digit rolls to its value like a mechanical counter. On first render the digits roll up from 0;
 * afterwards they roll from the previous value. Screen readers get the plain number.
 */
export function RollingNumber({ value, format = (n) => n.toLocaleString("en-IN"), className = "" }: { value: number; format?: (n: number) => string; className?: string }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState<number | null>(null);
  useEffect(() => {
    // Next frame, so the columns first paint at 0 and then animate to the value.
    const id = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(id);
  }, [value]);
  const text = format(value);
  const chars = [...text];
  return (
    <span className={`inline-flex items-start leading-none ${className}`} aria-label={text} role="text">
      {chars.map((ch, i) => {
        const fromRight = chars.length - i;
        if (!DIGITS.includes(ch)) {
          return (
            <span key={`s${fromRight}`} aria-hidden className="inline-block h-[1em] leading-none">
              {ch}
            </span>
          );
        }
        const d = shown === null && !reduced ? 0 : Number(ch);
        return (
          <span key={`d${fromRight}`} aria-hidden className="relative inline-block h-[1em] overflow-hidden leading-none" style={{ width: "0.62em" }}>
            <span
              className="absolute inset-x-0 top-0 flex flex-col items-center"
              style={{
                transform: `translateY(${-d * 10}%)`,
                transition: reduced ? "none" : `transform ${900 + fromRight * 90}ms cubic-bezier(.2,.9,.2,1.04)`,
              }}
            >
              {[...DIGITS].map((n) => (
                <span key={n} className="block h-[1em] leading-none">
                  {n}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}

// ---- Confetti --------------------------------------------------------------------------------------

const CONFETTI_COLORS = ["#e2620b", "#ffd23f", "#0b6e6c", "#ff4d6d", "#7b5cff", "#1f7a3a"];

/** A short confetti burst from a point on screen (defaults to the top centre). No-op for reduced motion. */
export function burstConfetti(origin?: { x: number; y: number }, count = 140) {
  if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const canvas = document.createElement("canvas");
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  Object.assign(canvas.style, { position: "fixed", inset: "0", width: "100vw", height: "100vh", pointerEvents: "none", zIndex: "60" });
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);
  const ox = origin?.x ?? window.innerWidth / 2;
  const oy = origin?.y ?? window.innerHeight * 0.25;
  const parts = Array.from({ length: count }, () => {
    const a = Math.random() * Math.PI * 2;
    const v = 4 + Math.random() * 9;
    return {
      x: ox,
      y: oy,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - 6,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.4,
      c: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    };
  });
  const start = performance.now();
  const frame = (t: number) => {
    const age = t - start;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (const p of parts) {
      p.vy += 0.28;
      p.vx *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - age / 2600);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2)));
      ctx.restore();
    }
    if (age < 2600) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}

// ---- Celebration toast ---------------------------------------------------------------------------------

export interface Celebration {
  id: number;
  title: string;
  body?: string;
}

/** A toast that slides in, stays for a few seconds and leaves. Announced politely to screen readers. */
export function CelebrationToast({ celebration, onDone }: { celebration: Celebration | null; onDone: () => void }) {
  useEffect(() => {
    if (!celebration) return;
    const t = setTimeout(onDone, 6000);
    return () => clearTimeout(t);
  }, [celebration, onDone]);
  // Portalled to <body> so an animated (transformed) ancestor can't trap the fixed position.
  // Rendered only while showing (null on the server and first paint), so hydration always matches.
  if (!celebration || typeof document === "undefined") return null;
  return createPortal(
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      {celebration && (
        <div key={celebration.id} className="toast-in pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl bg-ink px-5 py-4 text-bg shadow-2xl">
          <span className="text-3xl" aria-hidden>
            🎉
          </span>
          <div>
            <p className="font-semibold">{celebration.title}</p>
            {celebration.body && <p className="text-sm text-bg/75">{celebration.body}</p>}
          </div>
          <button onClick={onDone} className="ml-2 rounded-full px-2 text-bg/70 hover:text-bg" aria-label="Dismiss">
            ×
          </button>
        </div>
      )}
    </div>,
    document.body,
  );
}

// ---- Milestones ----------------------------------------------------------------------------------------

const MILESTONES: { at: number; name: string }[] = [
  { at: 100, name: "First 100" },
  { at: 500, name: "500 club" },
  { at: 1_000, name: "1K — monetisation eligible" },
  { at: 5_000, name: "5K" },
  { at: 10_000, name: "10K" },
  { at: 50_000, name: "50K" },
  { at: 100_000, name: "Silver Creator Award" },
  { at: 500_000, name: "5 lakh" },
  { at: 1_000_000, name: "Gold Creator Award" },
  { at: 5_000_000, name: "50 lakh" },
  { at: 10_000_000, name: "Diamond Creator Award" },
];

export function nextMilestone(subs: number): { prev: number; at: number; name: string } {
  const i = MILESTONES.findIndex((m) => m.at > subs);
  if (i === -1) {
    const at = Math.ceil((subs + 1) / 10_000_000) * 10_000_000;
    return { prev: at - 10_000_000, at, name: `${at / 10_000_000} crore` };
  }
  return { prev: i ? MILESTONES[i - 1].at : 0, ...MILESTONES[i] };
}

/** Progress to the next subscriber milestone, with an ETA from the recent daily pace. */
export function MilestoneRing({ subscribers, perDay }: { subscribers: number; perDay: number }) {
  const m = nextMilestone(subscribers);
  const progress = Math.min(1, Math.max(0, (subscribers - m.prev) / (m.at - m.prev)));
  const reduced = useReducedMotion();
  const [drawn, setDrawn] = useState(reduced ? progress : 0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setDrawn(progress));
    return () => cancelAnimationFrame(id);
  }, [progress]);
  const r = 52;
  const c = 2 * Math.PI * r;
  const togo = m.at - subscribers;
  const days = perDay > 0 ? Math.ceil(togo / perDay) : null;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 128 128" className="h-28 w-28 shrink-0 -rotate-90" role="img" aria-label={`${Math.round(progress * 100)}% of the way to ${m.at.toLocaleString("en-IN")} subscribers`}>
        <circle cx="64" cy="64" r={r} fill="none" stroke="var(--ring-track)" strokeWidth="12" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - drawn)}
          style={{ transition: reduced ? "none" : "stroke-dashoffset 1.6s cubic-bezier(.2,.9,.2,1)" }}
        />
        <text x="64" y="64" transform="rotate(90 64 64)" textAnchor="middle" dominantBaseline="central" fontSize="24" fontWeight="700" fill="currentColor">
          {Math.round(progress * 100)}%
        </text>
      </svg>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider opacity-70">Next milestone</p>
        <p className="mt-1 text-lg font-semibold leading-tight">{m.name}</p>
        <p className="mt-1 text-sm opacity-80">
          {togo.toLocaleString("en-IN")} to go{days != null && days < 3650 ? ` · ~${days <= 1 ? "1 day" : `${days} days`} at your pace` : ""}
        </p>
      </div>
    </div>
  );
}

// ---- Sparkline -----------------------------------------------------------------------------------------

/** A tiny trend line: de-emphasised history, accent on the latest point. */
export function Sparkline({ values, label }: { values: number[]; label: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * 100, 26 - ((v - min) / span) * 22] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("");
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg viewBox="-2 0 104 30" className="h-8 w-full" preserveAspectRatio="none" role="img" aria-label={label}>
      <path d={d} fill="none" stroke="var(--chart-compare)" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="3" fill="var(--accent)" stroke="var(--surface)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// ---- Live subscriber count -----------------------------------------------------------------------------

const POLL_MS = 3 * 60_000;

/**
 * The subscriber count, kept live: polls a 1-quota-unit endpoint every 3 minutes while the tab is visible,
 * and remembers the last count seen on this device so a return visit can celebrate the gain. On the demo
 * channel it simulates a trickle of new subscribers so the experience can be tried without an account.
 */
export function useLiveSubscribers(channelId: string, initial: number, live: boolean, onGain: (gain: number, since: "visit" | "now") => void) {
  const [count, setCount] = useState(initial);
  const countRef = useRef(initial);
  const gainRef = useRef(onGain);
  useEffect(() => {
    gainRef.current = onGain;
  }, [onGain]);

  useEffect(() => {
    const key = `mitra-subs-${channelId}`;
    const update = (next: number, since: "visit" | "now") => {
      const gain = next - countRef.current;
      countRef.current = next;
      setCount(next);
      try {
        localStorage.setItem(key, String(next));
      } catch {}
      if (gain > 0) gainRef.current(gain, since);
    };
    // Return visit: start from the last count this device saw, then roll up to today's.
    let lastSeen: number | null = null;
    try {
      const v = localStorage.getItem(key);
      lastSeen = v === null ? null : Number(v);
    } catch {}
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (lastSeen !== null && Number.isFinite(lastSeen) && lastSeen < initial && initial - lastSeen < 1_000_000) {
      countRef.current = lastSeen;
      timers.push(setTimeout(() => setCount(lastSeen!), 0));
      timers.push(setTimeout(() => update(initial, "visit"), 700));
    } else {
      countRef.current = initial;
      timers.push(setTimeout(() => setCount(initial), 0));
      try {
        localStorage.setItem(key, String(initial));
      } catch {}
    }

    if (!live) {
      // Demo: a new subscriber every 20-40 seconds.
      const tick = () => {
        timers.push(
          setTimeout(() => {
            update(countRef.current + 1 + Math.floor(Math.random() * 3), "now");
            tick();
          }, 20_000 + Math.random() * 20_000),
        );
      };
      tick();
      return () => timers.forEach(clearTimeout);
    }

    const poll = async () => {
      if (document.visibilityState !== "visible") return;
      const res = await fetch("/api/channel/live", { cache: "no-store" }).catch(() => null);
      const body = (await res?.json().catch(() => null)) as { subscribers?: number } | null;
      if (typeof body?.subscribers === "number") update(body.subscribers, "now");
    };
    const interval = setInterval(poll, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && poll();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      timers.forEach(clearTimeout);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [channelId, initial, live]);

  return count;
}
