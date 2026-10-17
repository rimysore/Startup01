"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { INVITE_ONLY } from "@/lib/company";
import { FOUNDER_FREE_LABELS, FOUNDER_FREE_USES, FOUNDER_PERKS, FOUNDING_SPOTS } from "@/lib/plans";

/** Where "claim your spot" goes: the waitlist during the private beta, otherwise straight to connecting YouTube. */
const CLAIM_HREF = INVITE_ONLY ? "/#waitlist" : "/login?next=/dashboard/connections";
import type { Me } from "./dashboard-context";

/** Live number of Founder Passes still open (null while loading or if the count can't be read). */
function useSpotsLeft(): number | null {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    fetch("/api/founders")
      .then((r) => r.json() as Promise<{ left: number | null }>)
      .then((d) => setLeft(d.left))
      .catch(() => setLeft(null));
  }, []);
  return left;
}

function SpotsPill({ left }: { left: number }) {
  return (
    <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-accent-ink">
      {left} of {FOUNDING_SPOTS} left
    </span>
  );
}

/** Landing banner with the live number of founding spots left. Hidden once they're gone. */
export function FoundingBanner() {
  const left = useSpotsLeft();
  if (left === 0) return null;
  return (
    <div className="mt-8 max-w-xl rounded-2xl border border-accent/40 bg-accent-soft p-4">
      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
        🏅 Founder Pass: free for life for the first {FOUNDING_SPOTS} creators {left != null && <SpotsPill left={left} />}
      </p>
      <ul className="mt-2 grid gap-1 text-sm text-ink-2">
        {FOUNDER_PERKS.map((p) => (
          <li key={p}>✓ {p}</li>
        ))}
      </ul>
      <Link href={CLAIM_HREF} className="mt-3 inline-block text-sm font-semibold text-accent hover:underline">
        {INVITE_ONLY ? "Get early access →" : "Claim yours: connect YouTube →"}
      </Link>
    </div>
  );
}

const DISMISS_KEY = "mitra-founder-offer-dismissed";
const DISMISS_DAYS = 3;

/**
 * A small offer card that slides up once the visitor has had a look around (8 seconds, or a third of the way
 * down the page). One tap closes it and it stays closed for a few days. Only shown while spots are left, with
 * the real count: no fake timers.
 */
export function FounderOfferPopup() {
  const left = useSpotsLeft();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!left) return;
    try {
      const at = Number(localStorage.getItem(DISMISS_KEY));
      if (at && Date.now() - at < DISMISS_DAYS * 86_400_000) return;
    } catch {}
    const show = () => setOpen(true);
    const t = setTimeout(show, 8000);
    const onScroll = () => {
      if (window.scrollY > document.body.scrollHeight / 3) show();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
    };
  }, [left]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  function close() {
    setOpen(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
  }
  if (!open || !left) return null;
  return (
    <div role="dialog" aria-label="Founder Pass offer" className="toast-in fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[380px]">
      <div className="relative overflow-hidden rounded-[24px] bg-ink p-5 text-bg shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
        <div className="bg-brand pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-50 blur-2xl" aria-hidden />
        <button onClick={close} className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-bg/10 text-xl hover:bg-bg/20" aria-label="Close">
          ×
        </button>
        <p className="relative text-3xl" aria-hidden>🎁</p>
        <p className="relative mt-2 font-display text-2xl leading-tight">Free for life, for the first {FOUNDING_SPOTS} creators</p>
        <p className="relative mt-2 text-sm text-bg/75">
          {FOUNDER_FREE_USES} free uses every month of titles, thumbnails, trends and more. No card needed.
        </p>
        <p className="relative mt-3"><SpotsPill left={left} /></p>
        <Link href={CLAIM_HREF} onClick={close} className="bg-brand relative mt-4 block rounded-full px-5 py-3.5 text-center font-semibold text-white">
          {INVITE_ONLY ? "Get early access" : "Claim my free spot"}
        </Link>
      </div>
    </div>
  );
}

/**
 * Dashboard box. Founders see their pass and how many free uses are left this month; everyone else sees the
 * offer while spots last (and how to claim it). Nothing once the spots are gone.
 */
export function FounderPassCard({ me }: { me: Me | null }) {
  const left = useSpotsLeft();
  if (!me) return null;
  if (me.founderNumber != null && me.founderPass) {
    const { used, limit } = me.founderPass;
    const remaining = Math.max(0, limit - used);
    return (
      <section className="card mt-6 p-5" aria-label="Your Founder Pass">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-semibold">Founder Pass · #{me.founderNumber}</p>
          <span className="rounded-md bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">Free for life</span>
        </div>
        <p className="mt-3 text-sm">
          <span className="font-semibold">{remaining}</span> of {limit} free uses left this month
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuemin={0} aria-valuemax={limit} aria-valuenow={remaining} aria-label="Free uses left">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(remaining / limit) * 100}%` }} />
        </div>
        <ul className="mt-3 flex flex-wrap gap-1.5 text-xs text-ink-2">
          {FOUNDER_FREE_LABELS.map((l) => (
            <li key={l} className="rounded-md bg-surface-2 px-2 py-1">{l}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs opacity-70">Resets on the 1st. Video Doctor, pro thumbnails and competitor analysis use your plan&apos;s credits.</p>
      </section>
    );
  }
  if (!left || me.youtube) return null;
  return (
    <section className="mt-6 flex flex-col gap-4 rounded-[24px] border border-accent/40 bg-accent-soft p-5 sm:flex-row sm:items-center" aria-label="Founder Pass offer">
      <p className="text-4xl" aria-hidden>🎁</p>
      <div className="min-w-0 sm:flex-1">
        <p className="flex flex-wrap items-center gap-2 font-display text-xl">Get Mitra free for life <SpotsPill left={left} /></p>
        <p className="mt-1 text-sm text-ink-2">
          The first {FOUNDING_SPOTS} creators to connect a channel get {FOUNDER_FREE_USES} free uses every month, forever.
        </p>
      </div>
      <Link href={me.user ? "/dashboard/connections" : "/login?next=/dashboard/connections"} className="bg-brand rounded-lg px-5 py-3.5 text-center font-semibold text-white">
        {me.user ? "Connect YouTube" : "Sign in & claim"}
      </Link>
    </section>
  );
}

/** "Founding Creator #17" pill for the dashboard hero. */
export function FounderBadge({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center rounded-md bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent" title="One of the first 100 creators on Mitra: perks for life">
      Founding Creator #{n}
    </span>
  );
}
