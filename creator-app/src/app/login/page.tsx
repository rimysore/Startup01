"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQueryParam } from "@/components/hooks";
import { Button, ErrorNote, Logo, ThemeToggle } from "@/components/ui";
import { INVITE_ONLY } from "@/lib/company";
import { MARKETPLACE } from "@/lib/marketplace/flag";

/** A same-site path to go to after sign-in; anything that could leave the site ("//x", "/\\x", tabs) goes to the dashboard. */
function sameSite(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(next)) return "/dashboard";
  try {
    const u = new URL(next, "https://mitra.invalid");
    return u.origin === "https://mitra.invalid" ? `${u.pathname}${u.search}${u.hash}` : "/dashboard";
  } catch {
    return "/dashboard";
  }
}

const ERRORS: Record<string, string> = {
  not_configured: "Google sign-in isn't set up on this server yet.",
  denied: "Sign-in was cancelled, or Google blocked it because your account isn't invited to the beta yet. Join the waitlist below and we'll invite you.",
  state: "That sign-in link expired. Please try again.",
  exchange: "Google didn't accept the sign-in. Please try again.",
  unverified: "Your Google email address isn't verified.",
  session: "Please sign in again.",
};

interface Config {
  google: boolean;
  devLogin: boolean;
}

export default function LoginPage() {
  const next = sameSite(useQueryParam("next"));
  const error = useQueryParam("error");
  const [config, setConfig] = useState<Config | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/me")
      .then((r) => r.json())
      .then((m: { user: unknown; config: Config }) => {
        if (!live) return;
        if (m.user) window.location.replace(next);
        else setConfig(m.config);
      });
    return () => {
      live = false;
    };
  }, [next]);

  async function devLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    const res = await fetch("/api/auth/dev-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name }),
    });
    const json = (await res.json()) as { error?: string };
    setBusy(false);
    if (json.error) setFormError(json.error);
    else window.location.assign(next);
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-6 sm:px-12">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="font-display text-5xl leading-tight">Namaste 🙏</h1>
          <p className="mt-2 text-ink-2">
            {MARKETPLACE ? "Sign in with Google. No channel access needed: creators check offers and see open programs; businesses count the customers each creator brings." : "Sign in to connect your channel and get real answers from Mitra."}
          </p>

          {error && ERRORS[error] && <div className="mt-6"><ErrorNote>{ERRORS[error]}</ErrorNote></div>}

          {INVITE_ONLY && (
            <div className="mt-6 rounded-2xl border border-accent/40 bg-accent-soft p-4 text-sm">
              <p className="font-semibold">🔒 Private beta</p>
              <p className="mt-1 text-ink-2">
                Sign-in works for creators we&apos;ve invited (Google shows &quot;Access blocked&quot; for everyone else until we open up).{" "}
                <Link href="/#waitlist" className="font-semibold text-accent underline underline-offset-2">Join the waitlist →</Link>
              </p>
            </div>
          )}

          <div className="mt-8 space-y-4">
            {config?.google && (
              <a
                href={`/api/auth/google/start?next=${encodeURIComponent(next)}`}
                className="flex w-full items-center justify-center gap-3 rounded-full border border-line bg-surface px-5 py-3 font-semibold hover:bg-surface-2"
              >
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
                  <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                  <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
                </svg>
                Continue with Google
              </a>
            )}

            {config?.devLogin && (
              <form onSubmit={devLogin} className="space-y-3 rounded-2xl border border-dashed border-line p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-accent">Local test sign-in</p>
                <p className="text-xs text-muted">No password, for development only. Turned off in production.</p>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
                />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
                />
                {formError && <p className="text-sm text-bad">{formError}</p>}
                <Button type="submit" disabled={busy} className="w-full">
                  {busy ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            )}

            {config && !config.google && !config.devLogin && (
              <ErrorNote>Sign-in isn&apos;t configured on this server yet.</ErrorNote>
            )}
          </div>

          <p className="mt-8 text-xs text-muted">
            By continuing you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-2">Terms</Link> and{" "}
            <Link href="/privacy" className="underline underline-offset-2">Privacy Policy</Link>. Mitra only reads your YouTube data
            when you connect it, and never posts for you.
          </p>
          <Link href="/dashboard" className="mt-4 text-sm font-semibold text-accent">
            ← Keep exploring the demo
          </Link>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-ink text-bg lg:block">
        <div className="absolute inset-0 grain opacity-30" />
        <div className="relative flex h-full flex-col justify-end p-14">
          <p className="font-indic text-3xl text-accent">आपका चैनल, आपकी भाषा।</p>
          <p className="mt-4 max-w-md font-display text-5xl leading-tight">
            “Mitra ne bataya ki intro me 30% log ja rahe the. Agle video me views double.”
          </p>
          <p className="mt-4 text-sm opacity-60">— the kind of message we want every creator to send us</p>
        </div>
      </div>
    </div>
  );
}
