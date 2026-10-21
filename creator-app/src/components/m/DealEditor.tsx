"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DEAL_STATUSES, type DealStatus } from "@/lib/marketplace/flag";
import type { Strings } from "@/lib/marketplace/i18n";
import { send } from "./client";

type D = {
  id: string;
  counterparty: string;
  source: string;
  status: string;
  feeInr: string;
  barter: string;
  deliverables: string;
  postBy: string;
  paymentTerms: string;
  usageTerms: string;
  notes: string;
  offerText: string;
  checks: { term: string; state: string; text: string }[];
  promoCode: string;
  trackedLink: string;
  redemptions: string;
  paidInr: string;
  paidAt: string;
  creatorRating: string;
};

const ICON: Record<string, { stroke: string; d: string }> = {
  ok: { stroke: "var(--ok)", d: "M4 10.5 8 14.5 16 5.5" },
  warn: { stroke: "var(--warn)", d: "M10 4v7M10 15.5v.5" },
  missing: { stroke: "var(--miss)", d: "M5 5l10 10M15 5 5 15" },
};
const digits = (v: string) => v.replace(/[^\d]/g, "");
const orNull = (v: string) => (v.trim() === "" ? null : v);

/** One deal in the log: its terms, where it stands, and what it produced. Everything saves together. */
export function DealEditor({ s, deal }: { s: Strings; deal: D }) {
  const router = useRouter();
  const [d, setD] = useState(deal);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const field = (k: keyof D, opts: { num?: boolean } = {}) => ({
    value: d[k] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setD({ ...d, [k]: opts.num ? digits(e.target.value) : e.target.value }),
  });

  async function save(e?: React.FormEvent, status = d.status) {
    e?.preventDefault();
    setBusy(true);
    setMsg(null);
    const r = await send(`/api/m/deals/${d.id}`, "PATCH", {
      counterparty: d.counterparty,
      status,
      feeInr: orNull(d.feeInr),
      barter: d.barter,
      deliverables: d.deliverables,
      postBy: d.postBy,
      paymentTerms: d.paymentTerms,
      usageTerms: d.usageTerms,
      notes: d.notes,
      outcome: {
        promoCode: d.promoCode,
        trackedLink: d.trackedLink,
        redemptions: orNull(d.redemptions),
        paidInr: orNull(d.paidInr),
        paidAt: d.paidAt,
        creatorRating: orNull(d.creatorRating),
      },
    });
    setBusy(false);
    setMsg(r.error ? { ok: false, text: r.error } : { ok: true, text: s.common.saved });
  }

  async function remove() {
    if (!confirm(s.deals.deleteQ)) return;
    const r = await send(`/api/m/deals/${d.id}`, "DELETE");
    if (!r.error) router.push("/m/deals");
    else setMsg({ ok: false, text: r.error });
  }

  return (
    <form className="mk-form" style={{ marginTop: 0 }} onSubmit={save}>
      <div>
        <Link href="/m/deals" className="lp-link text-[14px]" style={{ color: "var(--ink-2)" }}>
          ← {s.deals.title}
        </Link>
        <input aria-label={s.offer.counterparty} className="mk-h1 mk-title-input mt-3" {...field("counterparty")} maxLength={120} />
        {d.source === "mitra" && <p className="lp-label mt-2">{s.deals.mitraFee}</p>}
      </div>

      <section className="grid gap-3">
        <p className="text-[14px] font-semibold">{s.deals.status}</p>
        <div className="mk-steps" role="group" aria-label={s.deals.status}>
          {DEAL_STATUSES.map((st) => (
            <button
              key={st}
              type="button"
              aria-pressed={d.status === st}
              onClick={() => {
                setD({ ...d, status: st });
                void save(undefined, st);
              }}
            >
              {s.deals.statuses[st as DealStatus]}
            </button>
          ))}
        </div>
      </section>

      <section className="lp-card mk-fieldset">
        <div className="mk-row">
          <label className="mk-label">
            {s.offer.fee}
            <input inputMode="numeric" {...field("feeInr", { num: true })} placeholder="₹" />
          </label>
          <label className="mk-label">
            {s.offer.barter}
            <input {...field("barter")} maxLength={200} />
          </label>
          <label className="mk-label">
            {s.offer.postBy}
            <input type="date" {...field("postBy")} />
          </label>
        </div>
        <label className="mk-label">
          {s.offer.deliverables}
          <input {...field("deliverables")} maxLength={200} />
        </label>
        <div className="mk-row">
          <label className="mk-label">
            {s.offer.payment}
            <input {...field("paymentTerms")} maxLength={200} />
          </label>
          <label className="mk-label">
            {s.offer.usage}
            <input {...field("usageTerms")} maxLength={200} />
          </label>
        </div>
      </section>

      <section className="lp-card mk-fieldset">
        <h2 className="mk-h2">{s.deals.outcome}</h2>
        <div className="mk-row">
          <label className="mk-label">
            {s.deals.promo}
            <input {...field("promoCode")} maxLength={40} />
          </label>
          <label className="mk-label">
            {s.deals.redemptions}
            <input inputMode="numeric" {...field("redemptions", { num: true })} />
          </label>
          <label className="mk-label">
            {s.deals.link}
            <input {...field("trackedLink")} maxLength={300} placeholder="https://" />
          </label>
        </div>
        <div className="mk-row">
          <label className="mk-label">
            {s.deals.paid}
            <input inputMode="numeric" {...field("paidInr", { num: true })} placeholder="₹" />
          </label>
          <label className="mk-label">
            {s.deals.paidOn}
            <input type="date" {...field("paidAt")} />
          </label>
          <label className="mk-label">
            {s.deals.rating}
            <select value={d.creatorRating} onChange={(e) => setD({ ...d, creatorRating: e.target.value })}>
              <option value="">–</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {"★".repeat(n)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="mk-label">
          {s.deals.notes}
          <textarea {...field("notes")} maxLength={2000} style={{ minHeight: 100 }} />
        </label>
      </section>

      {d.offerText && (
        <section className="lp-card mk-fieldset">
          <h2 className="mk-h2">{s.deals.offerText}</h2>
          <p className="lp-reply" style={{ marginTop: 0 }}>
            {d.offerText}
          </p>
          {d.checks.length > 0 && (
            <>
              <p className="text-[14px] font-semibold">{s.deals.checks}</p>
              <div>
                {d.checks.map((c) => (
                  <div key={c.term} className="lp-res">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={ICON[c.state]?.stroke} strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                      <path d={ICON[c.state]?.d} />
                    </svg>
                    <span>{c.text}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      <div className="mk-bar">
        <button type="submit" className="lp-btn" disabled={busy || !d.counterparty.trim()}>
          {busy ? s.common.saving : s.common.save}
        </button>
        <button type="button" className="lp-link text-[15px]" style={{ color: "var(--miss)" }} onClick={remove}>
          {s.common.delete}
        </button>
        {msg && (
          <span className={msg.ok ? "mk-ok" : "mk-err"} role="status">
            {msg.text}
          </span>
        )}
      </div>
    </form>
  );
}
