"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Strings } from "@/lib/marketplace/i18n";
import { checkOffer, offerFields, offerReply, type OfferLang } from "@/lib/offer-check";
import { send } from "./client";

const ICON = {
  ok: { stroke: "var(--ok)", d: "M4 10.5 8 14.5 16 5.5" },
  warn: { stroke: "var(--warn)", d: "M10 4v7M10 15.5v.5" },
  missing: { stroke: "var(--miss)", d: "M5 5l10 10M15 5 5 15" },
};
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const CHANNELS = ["whatsapp", "instagram", "email", "phone", "other"] as const;

/** Paste an offer, read the check, copy a reply, and save it all to the deal log with the fields pre-filled. */
export function OfferForm({ s, lang, reelRange, myReel }: { s: Strings; lang: OfferLang; reelRange: { low: number; high: number } | null; myReel: number | null }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [replyLang, setReplyLang] = useState<OfferLang>(lang);
  const [copied, setCopied] = useState(false);
  const [f, setF] = useState({ counterparty: "", channel: "whatsapp", feeInr: "", barter: "", deliverables: "", postBy: "", paymentTerms: "", usageTerms: "", source: "own" });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checks = useMemo(() => (text.trim() ? checkOffer(text) : []), [text]);
  const reply = useMemo(() => offerReply(checks, replyLang), [checks, replyLang]);
  const parsed = useMemo(() => offerFields(text), [text]);
  // Pre-filled from the offer until the creator edits the field themselves.
  const fee = touched.feeInr ? f.feeInr : f.feeInr || (parsed.feeInr != null ? String(parsed.feeInr) : "");
  const deliverables = touched.deliverables ? f.deliverables : f.deliverables || (parsed.deliverables ?? "");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setTouched((t) => ({ ...t, [k]: true }));
    setF({ ...f, [k]: k === "feeInr" ? e.target.value.replace(/[^\d]/g, "") : e.target.value });
  };
  const feeNum = Number(fee) || 0;

  async function copy() {
    if (!reply) return;
    try {
      await navigator.clipboard.writeText(reply);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await send("/api/m/deals", "POST", { ...f, feeInr: fee || null, deliverables, offerText: text || null });
    if (r.error) {
      setBusy(false);
      return setError(r.error);
    }
    router.push(`/m/deals/${r.json?.id}`);
  }

  return (
    <div className="mk-form">
      <div className="lp-check" style={{ marginTop: 0 }}>
        <div>
          <label htmlFor="offer" className="sr-only">
            {s.offer.ph}
          </label>
          <textarea id="offer" value={text} onChange={(e) => setText(e.target.value)} placeholder={s.offer.ph} style={{ minHeight: 280 }} />
        </div>
        <div className="lp-card lp-check__out" aria-live="polite">
          {checks.length ? (
            <>
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-[15px] font-semibold">
                  {checks.filter((c) => c.state === "ok").length}/{checks.length} {s.offer.clear}
                </p>
                <span className="lp-label">{s.offer.rule}</span>
              </div>
              <div className="mt-2" key={text.length > 0 ? "t" : "e"}>
                {checks.map((c, i) => (
                  <div key={c.term} className="lp-res" style={{ ["--i" as string]: i }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={ICON[c.state].stroke} strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                      <path d={ICON[c.state].d} />
                    </svg>
                    <span>{c.text}</span>
                  </div>
                ))}
              </div>
              {reply && (
                <div className="mt-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[15px] font-semibold">{s.offer.reply}</p>
                    <div className="lp-switch" data-on={replyLang === "kn" ? "business" : "creator"} style={{ fontSize: 13 }}>
                      <span className="lp-switch__pill" aria-hidden />
                      <button type="button" aria-pressed={replyLang === "en"} onClick={() => setReplyLang("en")} style={{ minHeight: 32 }}>
                        English
                      </button>
                      <button type="button" aria-pressed={replyLang === "kn"} onClick={() => setReplyLang("kn")} className="kn" style={{ minHeight: 32 }}>
                        ಕನ್ನಡ
                      </button>
                    </div>
                  </div>
                  <p className={`lp-reply ${replyLang === "kn" ? "kn" : ""}`} lang={replyLang}>
                    {reply}
                  </p>
                  <button type="button" onClick={copy} className="lp-btn lp-btn--ghost mt-3" style={{ minHeight: 42 }}>
                    {copied ? s.offer.copied : s.offer.copy}
                  </button>
                </div>
              )}
            </>
          ) : (
            <p style={{ color: "var(--ink-2)" }}>{s.offer.sub}</p>
          )}
        </div>
      </div>

      <form className="lp-card mk-fieldset" onSubmit={save}>
        <h2 className="mk-h2">{s.offer.saveTitle}</h2>
        <div className="mk-row">
          <label className="mk-label">
            {s.offer.counterparty}
            <input value={f.counterparty} onChange={set("counterparty")} placeholder={s.offer.counterpartyPh} maxLength={120} required />
          </label>
          <label className="mk-label">
            {s.offer.channel}
            <select value={f.channel} onChange={set("channel")}>
              {CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {c === "whatsapp" ? "WhatsApp" : c === "instagram" ? "Instagram DM" : c === "email" ? "Email" : c === "phone" ? "Phone" : "Other"}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mk-row">
          <label className="mk-label">
            {s.offer.fee}
            <input inputMode="numeric" value={fee} onChange={set("feeInr")} placeholder="₹" />
            <small>
              {reelRange ? `${s.kit.fairRange} (${s.deliverable.reel}): ${inr(reelRange.low)}–${inr(reelRange.high)}` : myReel && feeNum && feeNum < myReel ? `${s.kit.rates}: ${s.deliverable.reel} ${inr(myReel)}` : ""}
            </small>
          </label>
          <label className="mk-label">
            {s.offer.barter} <small>({s.common.optional})</small>
            <input value={f.barter} onChange={set("barter")} placeholder={s.offer.barterPh} maxLength={200} />
          </label>
        </div>
        <div className="mk-row">
          <label className="mk-label">
            {s.offer.deliverables}
            <input
              value={deliverables}
              onChange={(e) => {
                setTouched((t) => ({ ...t, deliverables: true }));
                setF({ ...f, deliverables: e.target.value });
              }}
              maxLength={200}
            />
          </label>
          <label className="mk-label">
            {s.offer.postBy}
            <input type="date" value={f.postBy} onChange={set("postBy")} />
          </label>
        </div>
        <div className="mk-row">
          <label className="mk-label">
            {s.offer.payment}
            <input value={f.paymentTerms} onChange={set("paymentTerms")} maxLength={200} />
          </label>
          <label className="mk-label">
            {s.offer.usage}
            <input value={f.usageTerms} onChange={set("usageTerms")} maxLength={200} />
          </label>
        </div>
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-[14px] font-semibold">{s.offer.source}</legend>
          <div className="mk-chips">
            {(["own", "mitra"] as const).map((v) => (
              <button key={v} type="button" aria-pressed={f.source === v} onClick={() => setF({ ...f, source: v })}>
                {v === "own" ? s.offer.sourceOwn : s.offer.sourceMitra}
              </button>
            ))}
          </div>
          <p className="lp-label">{s.deals.mitraFee}</p>
        </fieldset>
        {error && (
          <p className="mk-err" role="alert">
            {error}
          </p>
        )}
        <div>
          <button type="submit" className="lp-btn" disabled={busy || !f.counterparty.trim()}>
            {busy ? s.common.saving : s.offer.save}
          </button>
        </div>
      </form>
    </div>
  );
}
