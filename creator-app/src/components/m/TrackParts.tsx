"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Strings } from "@/lib/marketplace/i18n";
import { send } from "./client";

type CouponStrings = Strings["coupon"];

/** On the customer's phone: staff type the counter PIN to redeem. */
export function RedeemBox({ id, pinReady, locked, en, kn }: { id: string; pinReady: boolean; locked: boolean; en: CouponStrings; kn: CouponStrings }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<keyof CouponStrings | null>(locked ? "locked" : pinReady ? null : "noPin");

  async function redeem(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await send(`/api/c/${id}/redeem`, "POST", { pin });
    setBusy(false);
    const result = r.json?.result as string | undefined;
    if (result === "ok" || result === "already") return router.refresh();
    setPin("");
    setMsg(result === "locked" ? "locked" : result === "no_pin" ? "noPin" : result === "ended" ? "ended" : "badPin");
  }

  const note = msg && (
    <p className="mk-err mt-3" role="status">
      {en[msg]}
      <span className="kn block" lang="kn">
        {kn[msg]}
      </span>
    </p>
  );
  if (!pinReady || msg === "locked") return <div className="mk-coupon__staff">{note}</div>;
  return (
    <form className="mk-coupon__staff" onSubmit={redeem}>
      <p className="lp-label">
        {en.staff} · <span lang="kn">{kn.staff}</span>
      </p>
      <div className="mt-2 flex gap-2">
        <input
          aria-label={en.pin}
          placeholder={en.pin}
          inputMode="numeric"
          autoComplete="off"
          pattern="[0-9]*"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          style={{ maxWidth: 160, letterSpacing: pin ? "0.2em" : undefined }}
        />
        <button type="submit" className="lp-btn" disabled={busy || pin.length < 4}>
          {en.redeem}
        </button>
      </div>
      {note}
    </form>
  );
}

/** Start tracking a creator post: who, paid or barter, and what customers get. */
export function TrackForm({ s }: { s: Strings }) {
  const router = useRouter();
  const [f, setF] = useState({ creatorName: "", creatorHandle: "", kind: "paid" as "paid" | "barter", feeInr: "", barterNote: "", bonusPerCustomerInr: "", bonusCapInr: "", offerText: "", destinationUrl: "", postUrl: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await send("/api/m/track", "POST", {
      ...f,
      feeInr: f.kind === "paid" && f.feeInr ? Number(f.feeInr) : null,
      bonusPerCustomerInr: f.bonusPerCustomerInr ? Number(f.bonusPerCustomerInr) : null,
      bonusCapInr: f.bonusCapInr ? Number(f.bonusCapInr) : null,
    });
    setBusy(false);
    if (r.error) return setError(r.json?.field ? `${r.error} (${String(r.json.field)})` : r.error);
    router.push(`/m/track/${r.json?.id}`);
  }

  return (
    <form className="mk-form" onSubmit={save}>
      <section className="lp-card mk-fieldset">
        <div className="mk-row">
          <label className="mk-label">
            {s.track.creatorName}
            <input value={f.creatorName} onChange={set("creatorName")} maxLength={80} required />
          </label>
          <label className="mk-label">
            {s.track.creatorHandle}
            <input value={f.creatorHandle} onChange={set("creatorHandle")} maxLength={80} placeholder="@" />
          </label>
        </div>
        <fieldset className="grid gap-2">
          <legend className="text-[14px] font-semibold">{s.track.kind}</legend>
          <div className="mk-chips">
            {(["paid", "barter"] as const).map((k) => (
              <button key={k} type="button" aria-pressed={f.kind === k} onClick={() => setF({ ...f, kind: k })}>
                {k === "paid" ? s.track.paid : s.track.barter}
              </button>
            ))}
          </div>
        </fieldset>
        {f.kind === "paid" ? (
          <label className="mk-label">
            {s.track.baseFee}
            <input inputMode="numeric" value={f.feeInr} onChange={(e) => setF({ ...f, feeInr: e.target.value.replace(/\D/g, "") })} maxLength={8} placeholder="3000" />
          </label>
        ) : (
          <label className="mk-label">
            {s.track.barterNote}
            <input value={f.barterNote} onChange={set("barterNote")} maxLength={160} placeholder={s.track.barterPh} />
          </label>
        )}
        <div className="mk-row">
          <label className="mk-label">
            {s.terms.bonus} <small>({s.common.optional})</small>
            <input inputMode="numeric" value={f.bonusPerCustomerInr} onChange={(e) => setF({ ...f, bonusPerCustomerInr: e.target.value.replace(/\D/g, "") })} maxLength={6} placeholder="30" />
            <span className="lp-label">{s.terms.bonusHint}</span>
          </label>
          <label className="mk-label">
            {s.terms.cap} <small>({s.common.optional})</small>
            <input inputMode="numeric" value={f.bonusCapInr} onChange={(e) => setF({ ...f, bonusCapInr: e.target.value.replace(/\D/g, "") })} maxLength={8} placeholder="1500" disabled={!f.bonusPerCustomerInr} />
          </label>
        </div>
        <label className="mk-label">
          {s.track.offer}
          <input value={f.offerText} onChange={set("offerText")} maxLength={120} placeholder={s.track.offerPh} required />
          <span className="lp-label">{s.track.offerHint}</span>
        </label>
        <label className="mk-label">
          {s.track.destination}
          <input type="url" value={f.destinationUrl} onChange={set("destinationUrl")} maxLength={500} placeholder="https://" />
          <span className="lp-label">{s.track.destinationHint}</span>
        </label>
        <label className="mk-label">
          {s.track.postUrl}
          <input type="url" value={f.postUrl} onChange={set("postUrl")} maxLength={500} placeholder="https://instagram.com/…" />
        </label>
      </section>
      <div className="mk-bar">
        <button type="submit" className="lp-btn" disabled={busy || !f.creatorName.trim() || f.offerText.trim().length < 2 || (f.kind === "barter" ? !f.barterNote.trim() : !f.feeInr && !f.bonusPerCustomerInr)}>
          {busy ? s.common.saving : s.track.create}
        </button>
        {error && (
          <span className="mk-err" role="status">
            {error}
          </span>
        )}
      </div>
    </form>
  );
}

/** Copy the link (and a ready message for the creator) with the current site's address. */
export function ShareLink({ s, path, offer, code }: { s: Strings; path: string; offer: string; code: string }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState<"link" | "msg" | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- the origin only exists in the browser
  useEffect(() => setOrigin(location.origin), []);
  const url = `${origin}${path}`;
  const msg = `${s.track.shareText} "${offer}" (${code}): ${url}`;
  async function copy(what: "link" | "msg") {
    await navigator.clipboard?.writeText(what === "link" ? url : msg).catch(() => null);
    setCopied(what);
    setTimeout(() => setCopied(null), 1500);
  }
  return (
    <div className="grid gap-3">
      <p className="lp-label">{s.track.link}</p>
      <div className="mk-copy">
        <code className="min-w-0 truncate">{url}</code>
        <button type="button" className="lp-btn lp-btn--ghost" onClick={() => copy("link")} style={{ minHeight: 40 }}>
          {copied === "link" ? s.track.copied : s.track.copy}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="lp-btn" onClick={() => copy("msg")} style={{ minHeight: 44 }}>
          {copied === "msg" ? s.track.copied : s.track.shareTitle}
        </button>
        <a className="lp-btn lp-btn--ghost" href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer" style={{ minHeight: 44 }}>
          WhatsApp
        </a>
      </div>
    </div>
  );
}

/** Stop or resume tracking a post. */
export function TrackStatus({ s, id, status }: { s: Strings; id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function toggle() {
    setBusy(true);
    await send(`/api/m/track/${id}`, "PATCH", { status: status === "active" ? "ended" : "active" });
    setBusy(false);
    router.refresh();
  }
  return (
    <button type="button" className="lp-btn lp-btn--ghost" onClick={toggle} disabled={busy} style={{ minHeight: 44 }}>
      {status === "active" ? s.track.end : s.track.resume}
    </button>
  );
}

/** Set or change the counter PIN. */
export function PinForm({ s, isSet }: { s: Strings; isSet: boolean }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await send("/api/m/track/pin", "PUT", { pin });
    setBusy(false);
    setPin("");
    setMsg(r.error ? { ok: false, text: r.error } : { ok: true, text: s.track.pinSaved });
    if (!r.error) router.refresh();
  }
  return (
    <form onSubmit={save} className="grid gap-3">
      <p className={isSet ? "lp-label" : "mk-err"}>{isSet ? s.track.pinIsSet : s.track.pinMissing}</p>
      <div className="flex flex-wrap gap-2">
        <input
          aria-label={s.track.pinTitle}
          placeholder={s.track.pinPh}
          inputMode="numeric"
          autoComplete="off"
          type="password"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          style={{ maxWidth: 160, letterSpacing: pin ? "0.2em" : undefined }}
        />
        <button type="submit" className="lp-btn" disabled={busy || pin.length < 4}>
          {s.track.pinSave}
        </button>
      </div>
      {msg && (
        <p className={msg.ok ? "mk-ok" : "mk-err"} role="status">
          {msg.text}
        </p>
      )}
    </form>
  );
}

/** Counter mode: type a code, count one customer, undo a mistake. Big targets for a busy counter. */
export function CounterBox({ s }: { s: Strings }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<{ couponId: string; creatorName: string; code: string } | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function count(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await send("/api/m/track/counter", "POST", { code });
    setBusy(false);
    if (r.error) {
      setLast(null);
      return setMsg({ ok: false, text: r.json?.error === "ended" ? s.track.endedCode : s.track.notFound });
    }
    setCode("");
    setLast({ couponId: String(r.json?.couponId), creatorName: String(r.json?.creatorName), code: String(r.json?.code) });
    setMsg(null);
    router.refresh();
  }

  async function undo() {
    if (!last) return;
    setBusy(true);
    const r = await send("/api/m/track/counter", "DELETE", { couponId: last.couponId });
    setBusy(false);
    setLast(null);
    setMsg(r.error ? { ok: false, text: r.error } : { ok: true, text: s.track.undone });
    router.refresh();
  }

  return (
    <div className="grid gap-4">
      <form className="mk-counter" onSubmit={count}>
        <input
          aria-label={s.track.code}
          placeholder={s.track.counterPh}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          autoCapitalize="characters"
          autoComplete="off"
          maxLength={40}
        />
        <button type="submit" className="lp-btn" disabled={busy || code.trim().length < 3}>
          {s.track.counterAdd}
        </button>
      </form>
      {last && (
        <p className="mk-ok flex flex-wrap items-center gap-3" role="status">
          <span>
            ✓ {s.track.counted} {last.creatorName} ({last.code})
          </span>
          <button type="button" className="lp-link" onClick={undo} disabled={busy}>
            {s.track.undo}
          </button>
        </p>
      )}
      {msg && (
        <p className={msg.ok ? "mk-ok" : "mk-err"} role="status">
          {msg.text}
        </p>
      )}
    </div>
  );
}

/** "I'd pay for this" on a plan during the pilot: recorded, never charged. */
export function PlanInterest({ s, plan, chosen }: { s: Strings; plan: string; chosen: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function set(next: string | null) {
    setBusy(true);
    await send("/api/m/plans", "PUT", { plan: next });
    setBusy(false);
    router.refresh();
  }
  if (chosen)
    return (
      <div className="grid gap-2">
        <p className="mk-ok">{s.plans.wanted}</p>
        <button type="button" className="lp-link justify-self-start text-[14px]" onClick={() => set(null)} disabled={busy}>
          {s.plans.undo}
        </button>
      </div>
    );
  return (
    <button type="button" className="lp-btn" onClick={() => set(plan)} disabled={busy} style={{ minHeight: 44 }}>
      {s.plans.want}
    </button>
  );
}
