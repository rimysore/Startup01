"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Strings } from "@/lib/marketplace/i18n";
import { send } from "./client";

type MatchView = { userId: string; name: string; initials: string; area: string | null; reasons: string[]; verified: boolean; kit: string | null };

/** A matched creator with the reasons, Mitra's suggested fee and the invite. */
export function InviteCard({ s, briefId, match, fee, inPlan, suggested }: { s: Strings; briefId: string; match: MatchView; fee: number | null; inPlan: boolean; suggested: boolean }) {
  const router = useRouter();
  const [amount, setAmount] = useState(fee != null ? String(fee) : "");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function invite() {
    setBusy(true);
    setError(null);
    const r = await send(`/api/m/briefs/${briefId}/invites`, "POST", { creatorUserId: match.userId, feeInr: amount || 0, message: note });
    setBusy(false);
    if (r.error) return setError(r.error);
    router.refresh();
  }

  return (
    <article className="lp-card mk-panel grid gap-4" style={inPlan ? { boxShadow: "0 0 0 2px var(--ink), 0 24px 60px -36px rgb(0 0 0 / 0.25)" } : undefined}>
      <div className="flex items-center gap-3">
        <span className="lp-av">{match.initials}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-semibold">{match.name}</p>
          <p className="text-[14px]" style={{ color: "var(--ink-2)" }}>
            {match.area ?? ""}
          </p>
        </div>
        {inPlan && <span className="lp-chip lp-chip--ink">{s.brief.plan}</span>}
      </div>
      <ul className="grid gap-1.5 text-[14.5px]">
        {match.reasons.map((r) => (
          <li key={r} className="flex gap-2">
            <span aria-hidden style={{ color: r.startsWith("Verified") ? "var(--ok)" : "var(--ink-3)" }}>
              •
            </span>
            {r}
          </li>
        ))}
      </ul>
      <label className="mk-label">
        {s.brief.fee}
        <input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))} placeholder="₹" />
        {suggested && <small>{s.brief.planSuggested}</small>}
      </label>
      <label className="mk-label">
        {s.brief.message} <small>({s.common.optional})</small>
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={600} />
      </label>
      {error && <p className="mk-err">{error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="lp-btn" style={{ minHeight: 44 }} onClick={invite} disabled={busy || !amount}>
          {busy ? s.common.saving : s.brief.invite}
        </button>
        {match.kit && (
          <a href={match.kit} target="_blank" className="lp-link text-[14px]" style={{ color: "var(--ink-2)" }}>
            {s.brief.viewKit} ↗
          </a>
        )}
      </div>
    </article>
  );
}

/** At the counter: one tap per customer who shows the code. */
export function CustomerCounter({ s, dealId, count }: { s: Strings; dealId: string; count: number }) {
  const router = useRouter();
  const [n, setN] = useState(count);
  const [busy, setBusy] = useState(false);
  async function bump(delta: 1 | -1) {
    if (busy || (delta < 0 && n === 0)) return;
    setBusy(true);
    setN((x) => Math.max(0, x + delta));
    const r = await send(`/api/m/room/${dealId}`, "PATCH", { redemptionsDelta: delta });
    if (r.error) setN((x) => Math.max(0, x - delta));
    setBusy(false);
    router.refresh();
  }
  return (
    <span className="inline-flex items-center gap-1" title={s.room.customers}>
      <button type="button" className="mk-count" aria-label={s.room.remove} onClick={() => bump(-1)} disabled={busy || n === 0}>
        −
      </button>
      <span className="min-w-[2.5ch] text-center text-[18px] font-semibold tabular-nums" aria-live="polite">
        {n}
      </span>
      <button type="button" className="mk-count" aria-label={s.room.add} onClick={() => bump(1)} disabled={busy}>
        +
      </button>
    </span>
  );
}

export function BriefStatus({ s, id, status }: { s: Strings; id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function flip() {
    setBusy(true);
    await send(`/api/m/briefs/${id}`, "PATCH", { status: status === "open" ? "closed" : "open" });
    setBusy(false);
    router.refresh();
  }
  return (
    <div className="flex items-center gap-3">
      <span className={`lp-chip ${status === "open" ? "lp-chip--ok" : ""}`}>{status === "open" ? s.brief.open : s.brief.closed}</span>
      <button type="button" className="lp-btn lp-btn--ghost" style={{ minHeight: 40 }} onClick={flip} disabled={busy}>
        {status === "open" ? s.brief.close : s.brief.reopen}
      </button>
    </div>
  );
}

export function WithdrawInvite({ s, id }: { s: Strings; id: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="lp-link text-[14px]"
      style={{ color: "var(--ink-2)" }}
      onClick={async () => {
        await send(`/api/m/invites/${id}`, "DELETE");
        router.refresh();
      }}
    >
      {s.brief.withdraw}
    </button>
  );
}
