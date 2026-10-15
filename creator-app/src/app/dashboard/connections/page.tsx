"use client";

import Link from "next/link";
import { useState } from "react";
import { useDashboard, useQueryParam } from "@/components/dashboard-context";
import { Button, Card, ErrorNote, PageHeader } from "@/components/ui";

const ERRORS: Record<string, string> = {
  not_configured: "YouTube sign-in isn't set up on this server yet. See the setup steps below.",
  denied: "You cancelled the Google sign-in, or didn't grant access.",
  exchange: "Google didn't accept the sign-in. Check the client ID, secret and redirect URI.",
  no_channel: "That Google account doesn't seem to have a YouTube channel. Try a different account.",
};

function StatusPill({ on, label }: { on: boolean; label: string }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${on ? "bg-good/15 text-good" : "bg-surface-2 text-muted"}`}>
      {on ? "●" : "○"} {label}
    </span>
  );
}

const SOON = [
  { name: "Instagram Reels", body: "Cross-post Shorts and compare performance." },
  { name: "WhatsApp reports", body: "A Monday summary of wins, drops and what to post next." },
  { name: "Brand deals inbox", body: "Track sponsor offers, rates and payments." },
];

export default function ConnectionsPage() {
  const { me, reload } = useDashboard();
  const error = useQueryParam("error");
  const [busy, setBusy] = useState(false);

  async function disconnect() {
    setBusy(true);
    await fetch("/api/youtube/disconnect", { method: "POST" });
    setBusy(false);
    reload();
  }

  return (
    <div className="rise">
      <PageHeader eyebrow="Connections" title="Plug in your channels" />
      {error && ERRORS[error] && <div className="mb-4"><ErrorNote>{ERRORS[error]}</ErrorNote></div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#ff0033] text-white">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M10 15.5v-7l6 3.5z" /></svg>
            </div>
            <div>
              <h2 className="font-semibold">YouTube</h2>
              <p className="text-sm text-muted">Channel stats, analytics, retention and comments (read-only).</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {!me ? null : !me.user ? (
              <Link href="/login?next=/dashboard/connections" className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink">
                Sign in to connect
              </Link>
            ) : me.youtube ? (
              <>
                <StatusPill on label={`Connected · ${me.youtube.channelTitle ?? "your channel"}`} />
                <Button variant="ghost" onClick={disconnect} disabled={busy}>Disconnect</Button>
              </>
            ) : (
              <a href="/api/auth/youtube/start" className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink">
                Connect YouTube
              </a>
            )}
          </div>
          <p className="mt-4 text-xs text-muted">
            Mitra only asks for read-only access. We never upload, delete or change anything on your channel.
          </p>
        </Card>

        <Card>
          <h2 className="font-semibold">Server setup</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusPill on={Boolean(me?.config.google)} label="Google sign-in" />
            <StatusPill on={Boolean(me?.config.ai)} label="Mitra AI" />
            <StatusPill on={Boolean(me?.config.billing)} label="Razorpay" />
          </div>
          <p className="mt-4 text-sm text-ink-2">
            Copy <code className="rounded bg-surface-2 px-1">.env.example</code> to <code className="rounded bg-surface-2 px-1">.env.local</code> and
            fill in the keys. The README walks through Google Cloud and Razorpay setup.
          </p>
        </Card>
      </div>

      <h2 className="mb-3 mt-10 text-xs font-semibold uppercase tracking-[0.18em] text-muted">Coming soon</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {SOON.map((s) => (
          <Card key={s.name} className="opacity-80">
            <p className="font-semibold">{s.name}</p>
            <p className="mt-1 text-sm text-muted">{s.body}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
