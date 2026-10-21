"use client";

import { useState } from "react";
import type { Strings } from "@/lib/marketplace/i18n";
import { send } from "./client";

type F = { name: string; category: string; area: string; budgetMinInr: string; budgetMaxInr: string; website: string; instagram: string; whatsapp: string };

export function BusinessForm({ s, initial }: { s: Strings; initial: F }) {
  const [f, setF] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const field = (k: keyof F) => ({ value: f[k], onChange: (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value }) });
  const digits = (k: "budgetMinInr" | "budgetMaxInr") => ({ value: f[k], inputMode: "numeric" as const, onChange: (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value.replace(/[^\d]/g, "") }) });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const r = await send("/api/m/business", "PUT", { ...f, budgetMinInr: f.budgetMinInr || null, budgetMaxInr: f.budgetMaxInr || null });
    setBusy(false);
    setMsg(
      r.error
        ? { ok: false, text: r.json?.field === "budgetMaxInr" ? `${s.business.budget}: ${s.business.min} ≤ ${s.business.max}` : r.json?.field === "whatsapp" ? s.business.whatsapp : r.error }
        : { ok: true, text: s.common.saved },
    );
  }

  return (
    <form className="mk-form" onSubmit={save}>
      <section className="lp-card mk-fieldset">
        <label className="mk-label">
          {s.business.name}
          <input {...field("name")} maxLength={80} required />
        </label>
        <div className="mk-row">
          <label className="mk-label">
            {s.business.category}
            <input {...field("category")} placeholder={s.business.categoryPh} maxLength={80} />
          </label>
          <label className="mk-label">
            {s.business.area}
            <input {...field("area")} placeholder={s.kit.areaPh} maxLength={60} />
          </label>
        </div>
        <div className="grid gap-2">
          <p className="text-[14px] font-semibold">{s.business.budget}</p>
          <div className="mk-row">
            <label className="mk-label">
              <small>{s.business.min}</small>
              <input {...digits("budgetMinInr")} placeholder="₹" />
            </label>
            <label className="mk-label">
              <small>{s.business.max}</small>
              <input {...digits("budgetMaxInr")} placeholder="₹" />
            </label>
          </div>
        </div>
        <div className="mk-row">
          <label className="mk-label">
            {s.business.website} <small>({s.common.optional})</small>
            <input {...field("website")} maxLength={200} placeholder="https://" />
          </label>
          <label className="mk-label">
            {s.business.instagram} <small>({s.common.optional})</small>
            <input {...field("instagram")} maxLength={80} placeholder="@" />
          </label>
        </div>
        <label className="mk-label">
          {s.business.whatsapp} <small>({s.common.optional})</small>
          <input {...field("whatsapp")} type="tel" inputMode="tel" maxLength={20} placeholder="+91" />
          <small>{s.business.whatsappHint}</small>
        </label>
      </section>
      <div className="mk-bar">
        <button type="submit" className="lp-btn" disabled={busy || !f.name.trim()}>
          {busy ? s.common.saving : s.common.save}
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
