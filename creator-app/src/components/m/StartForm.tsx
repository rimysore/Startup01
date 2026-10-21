"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ROLES, type Role } from "@/lib/marketplace/flag";
import type { Strings } from "@/lib/marketplace/i18n";
import { send } from "./client";

export function StartForm({ s, lang, initialRole }: { s: Strings; lang: "en" | "kn"; initialRole: Role }) {
  const router = useRouter();
  const [role, setRole] = useState<Role>(initialRole);
  const [terms, setTerms] = useState(false);
  const [contact, setContact] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!terms) return setError(s.start.needTerms);
    setBusy(true);
    setError(null);
    const r = await send("/api/m/join", "POST", { role, uiLanguage: lang, terms: true, contact });
    if (r.error) {
      setBusy(false);
      return setError(r.error);
    }
    router.push(String(r.json?.next ?? "/m"));
  }

  return (
    <form className="mk-form" onSubmit={submit}>
      <fieldset className="grid gap-3">
        <legend className="mk-h2 mb-3">{s.start.roleQ}</legend>
        <div className="mk-choice">
          {ROLES.map((r) => (
            <button key={r} type="button" aria-pressed={role === r} onClick={() => setRole(r)}>
              <b>{s.start.role[r]}</b>
              <span>{s.start.roleHint[r]}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-3">
        <label className="mk-check">
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
          <span>
            {s.start.terms}{" "}
            <a href="/terms" className="lp-link underline" target="_blank">
              Terms
            </a>{" "}
            ·{" "}
            <a href="/privacy" className="lp-link underline" target="_blank">
              Privacy
            </a>
          </span>
        </label>
        <label className="mk-check">
          <input type="checkbox" checked={contact} onChange={(e) => setContact(e.target.checked)} />
          <span>{s.start.contact}</span>
        </label>
      </div>
      {error && (
        <p className="mk-err" role="alert">
          {error}
        </p>
      )}
      <div>
        <button type="submit" className="lp-btn" disabled={busy}>
          {busy ? s.common.saving : s.start.go}
        </button>
      </div>
    </form>
  );
}
