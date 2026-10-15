"use client";

import { useState } from "react";
import { useDashboard, useQueryParam } from "@/components/dashboard-context";
import { Button, Card, ErrorNote, PageHeader } from "@/components/ui";

const ERRORS: Record<string, string> = {
  not_configured: "YouTube sign-in isn't set up on this server yet. See the setup steps below.",
  denied: "You cancelled the Google sign-in, or didn't grant access.",
  state: "The sign-in link expired. Please try again.",
  exchange: "Google didn't accept the sign-in. Check the client ID, secret and redirect URI.",
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
  const { status, summary, reload } = useDashboard();
  const error = useQueryParam("error");
  const [busy, setBusy] = useState(false);
  const connected = status?.connected && summary?.mode === "live";

  async function disconnect() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
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
            {connected ? (
              <>
                <StatusPill on label={`Connected · ${summary?.channel.title}`} />
                <Button variant="ghost" onClick={disconnect} disabled={busy}>Disconnect</Button>
              </>
            ) : (
              <a href="/api/auth/youtube/start" className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink">
                Connect with Google
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
            <StatusPill on={Boolean(status?.googleConfigured)} label="Google sign-in" />
            <StatusPill on={Boolean(status?.aiConfigured)} label="Mitra AI" />
          </div>
          <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-sm text-ink-2">
            <li>Copy <code className="rounded bg-surface-2 px-1">.env.example</code> to <code className="rounded bg-surface-2 px-1">.env.local</code>.</li>
            <li>Create an OAuth client (Web) in Google Cloud and enable YouTube Data API v3 + YouTube Analytics API.</li>
            <li>Add <code className="rounded bg-surface-2 px-1">{"<your-url>"}/api/auth/youtube/callback</code> as a redirect URI.</li>
            <li>Set <code className="rounded bg-surface-2 px-1">ANTHROPIC_API_KEY</code> to switch on real AI answers.</li>
          </ol>
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
