"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Strings } from "@/lib/marketplace/i18n";
import { send } from "./client";

export function InviteAnswer({ s, id }: { s: Strings; id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function answer(accept: boolean) {
    setBusy(true);
    setError(null);
    const r = await send(`/api/m/invites/${id}`, "POST", { accept });
    setBusy(false);
    if (r.error) return setError(r.error);
    if (accept && r.json?.dealId) router.push(`/m/room/${r.json.dealId}`);
    else router.refresh();
  }
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-3">
        <button type="button" className="lp-btn" disabled={busy} onClick={() => answer(true)}>
          {s.invite.accept}
        </button>
        <button type="button" className="lp-btn lp-btn--ghost" disabled={busy} onClick={() => answer(false)}>
          {s.invite.decline}
        </button>
      </div>
      <p className="lp-label">{s.invite.acceptNote}</p>
      {error && <p className="mk-err">{error}</p>}
    </div>
  );
}

/** What this side can do: the creator marks it posted; the business records payment. Both rate it. */
export function RoomActions({ s, dealId, side, status, paidInr, fee, rating }: { s: Strings; dealId: string; side: "creator" | "business"; status: string; paidInr: number | null; fee: number | null; rating: number | null }) {
  const router = useRouter();
  const [amount, setAmount] = useState(paidInr != null ? String(paidInr) : fee != null ? String(fee) : "");
  const [busy, setBusy] = useState(false);
  const act = async (data: Record<string, unknown>) => {
    setBusy(true);
    await send(`/api/m/room/${dealId}`, "PATCH", data);
    setBusy(false);
    router.refresh();
  };
  return (
    <section className="lp-card mk-panel grid gap-4">
      {side === "creator" ? (
        status === "posted" || status === "paid" ? (
          <span className="lp-chip lp-chip--ok" style={{ justifySelf: "start" }}>
            {s.room.postedDone}
          </span>
        ) : (
          <button type="button" className="lp-btn" style={{ justifySelf: "start" }} disabled={busy} onClick={() => act({ posted: true })}>
            {s.room.posted}
          </button>
        )
      ) : (
        <div className="flex flex-wrap items-end gap-3">
          <label className="mk-label" style={{ flex: "1 1 160px" }}>
            {s.room.pay}
            <input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))} placeholder="₹" />
          </label>
          <button type="button" className="lp-btn" disabled={busy || !amount} onClick={() => act({ paidInr: Number(amount) })}>
            {paidInr ? s.common.save : s.room.paid}
          </button>
        </div>
      )}
      <div>
        <p className="mb-2 text-[14px] font-semibold">{s.room.rate}</p>
        <div className="mk-chips" role="group" aria-label={s.room.rate}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" aria-pressed={rating === n} disabled={busy} onClick={() => act({ rating: n })} aria-label={`${n} / 5`}>
              {"★".repeat(n)}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MessageBox({ s, dealId, messages }: { s: Strings; dealId: string; messages: { id: number; mine: boolean; body: string; at: string }[] }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  async function post(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    const r = await send(`/api/m/room/${dealId}/messages`, "POST", { body: text });
    setBusy(false);
    if (!r.error) {
      setText("");
      router.refresh();
    }
  }
  return (
    <section className="lp-card mk-panel grid gap-3">
      <h2 className="mk-h2">{s.room.messages}</h2>
      <div className="mk-thread">
        {messages.length ? (
          messages.map((m) => (
            <div key={m.id} className="mk-msg" data-mine={m.mine}>
              <p>{m.body}</p>
              <time dateTime={m.at}>{new Date(m.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</time>
            </div>
          ))
        ) : (
          <p className="lp-label">{s.room.noMsgs}</p>
        )}
      </div>
      <form onSubmit={post} className="flex gap-2">
        <label htmlFor={`msg-${dealId}`} className="sr-only">
          {s.room.msgPh}
        </label>
        <input id={`msg-${dealId}`} value={text} onChange={(e) => setText(e.target.value)} placeholder={s.room.msgPh} maxLength={2000} />
        <button type="submit" className="lp-btn" style={{ minHeight: 46 }} disabled={busy || !text.trim()}>
          {s.room.send}
        </button>
      </form>
    </section>
  );
}

/** A site path shown as a full link on whichever address this page is open on (live site, preview or local). */
export function HereLink({ path }: { path: string }) {
  const [origin, setOrigin] = useState("");
  // eslint-disable-next-line react-hooks/set-state-in-effect -- the origin only exists in the browser
  useEffect(() => setOrigin(location.origin), []);
  return <>{origin}{path}</>;
}
