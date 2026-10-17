"use client";

import { useEffect } from "react";
import { OFFICIAL_EMAIL } from "@/lib/company";

const RELOAD_KEY = "mitra-reloaded-after-deploy";

/** A tab opened before a new deploy asks for code files that no longer exist; one reload fixes it. */
function isStaleBuild(err: Error): boolean {
  return /ChunkLoadError|Loading (CSS )?chunk|dynamically imported module|Failed to load chunk|module script failed/i.test(`${err.name} ${err.message}`);
}

/**
 * Shown instead of a blank "This page couldn't load" when a dashboard page crashes in the browser. A stale build
 * reloads itself once; anything else shows the real message so the creator (or we) can report it.
 */
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const stale = isStaleBuild(error);
  useEffect(() => {
    console.error(error);
    if (!stale) return;
    try {
      if (sessionStorage.getItem(RELOAD_KEY)) return;
      sessionStorage.setItem(RELOAD_KEY, "1");
    } catch {}
    window.location.reload();
  }, [error, stale]);

  return (
    <div className="mx-auto max-w-lg py-16 text-center" role="alert">
      <p className="text-4xl" aria-hidden>
        {stale ? "✨" : "😕"}
      </p>
      <h1 className="mt-3 font-display text-3xl">{stale ? "Mitra just got an update" : "This page hit a problem"}</h1>
      <p className="mt-2 text-sm text-ink-2">
        {stale ? "Reloading to get the newest version…" : `Try again. If it keeps happening, send us the message below at ${OFFICIAL_EMAIL}.`}
      </p>
      {!stale && (
        <p className="mt-4 break-words rounded-xl bg-surface-2 px-3 py-2 text-left font-mono text-xs text-ink-2">
          {error.message || "Unknown error"}
          {error.digest ? ` (ref ${error.digest})` : ""}
        </p>
      )}
      <div className="mt-6 flex justify-center gap-2">
        <button onClick={() => (stale ? window.location.reload() : reset())} className="bg-brand rounded-full px-5 py-2.5 text-sm font-semibold text-white">
          {stale ? "Reload now" : "Try again"}
        </button>
        {/* A full page load, not client navigation: the client app may be the thing that broke. */}
        <a href="/dashboard" className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold">
          Go to Overview
        </a>
      </div>
    </div>
  );
}
