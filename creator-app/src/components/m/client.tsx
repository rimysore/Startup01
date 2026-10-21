"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** EN / ಕನ್ನಡ for the marketplace screens. Saved to the member; before joining it only changes the welcome page. */
export function LangSwitch({ lang, canSave }: { lang: string; canSave: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function pick(next: "en" | "kn") {
    if (next === lang || busy) return;
    setBusy(true);
    if (canSave) await fetch("/api/m/language", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lang: next }) }).catch(() => null);
    else {
      const u = new URL(location.href);
      u.searchParams.set("lang", next);
      history.replaceState(null, "", u);
    }
    router.refresh();
    setBusy(false);
  }
  return (
    <div className="lp-switch mk-lang" data-on={lang === "kn" ? "business" : "creator"} role="group" aria-label="Language">
      <span className="lp-switch__pill" aria-hidden />
      <button type="button" aria-pressed={lang !== "kn"} onClick={() => pick("en")}>
        EN
      </button>
      <button type="button" aria-pressed={lang === "kn"} onClick={() => pick("kn")} className="kn" lang="kn">
        ಕನ್ನಡ
      </button>
    </div>
  );
}

export function SignOut({ label }: { label: string }) {
  const router = useRouter();
  async function out() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.replace("/");
    router.refresh();
  }
  return (
    <button type="button" onClick={out} className="mk-hide-sm lp-link text-[14px]" style={{ color: "var(--ink-2)" }}>
      {label}
    </button>
  );
}

/** JSON request helper for marketplace forms: returns the error message to show, or null on success. */
export async function send(url: string, method: string, data?: unknown): Promise<{ error: string | null; json: Record<string, unknown> | null }> {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: data === undefined ? undefined : JSON.stringify(data) }).catch(() => null);
  const json = (await res?.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res?.ok) return { error: (json?.error as string) ?? "Something went wrong. Please try again.", json };
  return { error: null, json };
}
