"use client";

import { useState } from "react";
import { BETA_DEFAULT_LANGUAGE, offeredLanguage } from "@/lib/beta";
import { LANGUAGES as ALL_LANGUAGES } from "@/lib/languages";

// Hindi and Kannada only during the beta.
const LANGUAGES = ALL_LANGUAGES.filter((l) => offeredLanguage(l.code));

/** Early-access form. Short on purpose: email is the only must; the rest helps us invite the right creators first. */
export function WaitlistForm({ source = "landing" }: { source?: string }) {
  const [form, setForm] = useState({ email: "", name: "", channel: "", language: offeredLanguage("hinglish") ? "hinglish" : BETA_DEFAULT_LANGUAGE, whatsapp: "", consent: false, website: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ position: number; already: boolean } | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, source, consent: form.consent || undefined }),
    }).catch(() => null);
    const d = (await r?.json().catch(() => null)) as { position?: number; already?: boolean; error?: string } | null;
    setBusy(false);
    if (!r?.ok || !d?.position) return setError(d?.error ?? "Couldn't save that. Please try again.");
    setDone({ position: d.position, already: Boolean(d.already) });
  }

  if (done) {
    const share = `https://wa.me/?text=${encodeURIComponent(`I just joined the waitlist for Mitra, an AI channel manager that speaks Hindi, Telugu, Tamil & more. Join here: ${typeof window === "undefined" ? "" : window.location.origin}`)}`;
    return (
      <div className="rounded-[24px] border border-good/40 bg-good/10 p-6 text-center" role="status">
        <p className="text-4xl" aria-hidden>
          🎉
        </p>
        <p className="mt-2 font-display text-3xl">{done.already ? "You're already on the list" : "You're on the list!"}</p>
        <p className="mt-1 text-ink-2">
          You&apos;re <b className="text-ink">#{done.position}</b> in line. We invite creators personally, a few every week, and we&apos;ll message you when
          your spot opens.
        </p>
        <a href={share} target="_blank" rel="noopener noreferrer" className="mt-5 inline-block rounded-full bg-[#25D366] px-5 py-3 font-semibold text-[#073b1d]">
          Share with a creator friend
        </a>
      </div>
    );
  }

  const input = "w-full rounded-xl border border-line bg-surface px-4 py-3 text-base outline-none focus:border-accent";
  return (
    <form onSubmit={submit} className="grid gap-3" noValidate>
      <label className="grid gap-1 text-sm font-semibold">
        Email (the Google account you&apos;ll sign in with) *
        <input type="email" required autoComplete="email" inputMode="email" value={form.email} onChange={set("email")} placeholder="you@gmail.com" className={input} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-semibold">
          Your name
          <input autoComplete="name" value={form.name} onChange={set("name")} placeholder="Rima" className={input} />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Your language
          <select value={form.language} onChange={set("language")} className={input}>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.native === l.label ? l.label : `${l.native} · ${l.label}`}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="grid gap-1 text-sm font-semibold">
        YouTube channel link or @handle
        <input value={form.channel} onChange={set("channel")} placeholder="youtube.com/@yourchannel" className={input} />
      </label>
      <label className="grid gap-1 text-sm font-semibold">
        WhatsApp number (optional)
        <input type="tel" inputMode="tel" autoComplete="tel" value={form.whatsapp} onChange={set("whatsapp")} placeholder="+91 98765 43210" className={input} />
      </label>
      {/* Honeypot: hidden from people, tempting for bots. */}
      <input tabIndex={-1} autoComplete="off" aria-hidden value={form.website} onChange={set("website")} className="absolute -left-[9999px] h-0 w-0 opacity-0" name="website" />
      <label className="flex items-start gap-3 text-sm text-ink-2">
        <input type="checkbox" checked={form.consent} onChange={set("consent")} className="mt-1 h-5 w-5 shrink-0 accent-[var(--accent)]" />
        <span>Mitra may contact me by email (and WhatsApp, if I gave a number) about my early-access invite. See our <a href="/privacy" className="underline">Privacy Policy</a>.</span>
      </label>
      {error && <p className="text-sm text-bad">{error}</p>}
      <button type="submit" disabled={busy} className="bg-brand mt-1 rounded-full px-6 py-4 text-lg font-bold text-white transition hover:brightness-110 disabled:opacity-60">
        {busy ? "Joining…" : "Get early access"}
      </button>
    </form>
  );
}
