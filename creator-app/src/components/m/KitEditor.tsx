"use client";

import { useState } from "react";
import { DELIVERABLES, NICHES, PLATFORM_LABEL, PLATFORMS, type Deliverable } from "@/lib/marketplace/flag";
import type { Strings } from "@/lib/marketplace/i18n";
import { send } from "./client";

type Handle = { platform: string; handle: string; followers: number | null; avgViews: number | null; verifiedAt: string | null };
type Initial = {
  displayName: string;
  bio: string;
  area: string;
  niches: string[];
  languages: string[];
  rates: { deliverable: string; priceInr: number }[];
  contactEmail: string;
  whatsapp: string;
  isPublic: boolean;
  openToOffers: boolean;
  slug: string | null;
  handles: Handle[];
};
type Range = { low: number; high: number; n: number } | null;

const num = (v: string) => (v.trim() === "" ? null : Math.max(0, Math.round(Number(v.replace(/[^\d.]/g, "")) || 0)));
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export function KitEditor({ s, initial, youtubeConnected, ranges }: { s: Strings; initial: Initial; youtubeConnected: boolean; ranges: Record<string, Range> }) {
  const [f, setF] = useState(initial);
  const [handles, setHandles] = useState<Record<string, Handle>>(() =>
    Object.fromEntries(PLATFORMS.map((p) => [p, initial.handles.find((h) => h.platform === p) ?? { platform: p, handle: "", followers: null, avgViews: null, verifiedAt: null }])),
  );
  const [rates, setRates] = useState<Record<string, string>>(() => Object.fromEntries(DELIVERABLES.map((d) => [d, String(initial.rates.find((r) => r.deliverable === d)?.priceInr ?? "")])));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [verifying, setVerifying] = useState(false);

  const toggle = (key: "niches" | "languages", v: string, max: number) =>
    setF((x) => ({ ...x, [key]: x[key].includes(v) ? x[key].filter((y) => y !== v) : x[key].length < max ? [...x[key], v] : x[key] }));
  const setHandle = (p: string, patch: Partial<Handle>) => setHandles((h) => ({ ...h, [p]: { ...h[p], ...patch } }));

  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setMsg(null);
    const r = await send("/api/m/kit", "PUT", {
      displayName: f.displayName,
      bio: f.bio,
      area: f.area,
      niches: f.niches,
      languages: f.languages,
      contactEmail: f.contactEmail,
      whatsapp: f.whatsapp,
      isPublic: f.isPublic,
      openToOffers: f.openToOffers,
      handles: Object.values(handles)
        .filter((h) => h.handle.trim())
        .map((h) => ({ platform: h.platform, handle: h.handle, followers: h.followers, avgViews: h.avgViews })),
      rates: DELIVERABLES.map((d) => ({ deliverable: d, priceInr: num(rates[d]) ?? 0 })).filter((r) => r.priceInr > 0),
    });
    setBusy(false);
    if (r.error) return setMsg({ ok: false, text: r.json?.field === "whatsapp" ? s.kit.whatsapp : r.error });
    setF((x) => ({ ...x, slug: String(r.json?.slug ?? x.slug) }));
    setMsg({ ok: true, text: s.common.saved });
  }

  async function verify() {
    setVerifying(true);
    setMsg(null);
    const r = await send("/api/m/kit/verify", "POST");
    setVerifying(false);
    if (r.error) return setMsg({ ok: false, text: r.error });
    setHandle("youtube", { handle: String(r.json?.handle ?? ""), followers: Number(r.json?.followers ?? 0), verifiedAt: String(r.json?.verifiedAt ?? new Date().toISOString()) });
    setMsg({ ok: true, text: s.common.verified });
  }

  return (
    <form className="mk-form" onSubmit={save}>
      <section className="lp-card mk-fieldset">
        <div className="mk-row">
          <label className="mk-label">
            {s.kit.name}
            <input value={f.displayName} onChange={(e) => setF({ ...f, displayName: e.target.value })} maxLength={60} required />
          </label>
          <label className="mk-label">
            {s.kit.area}
            <input value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })} placeholder={s.kit.areaPh} maxLength={60} />
          </label>
        </div>
        <label className="mk-label">
          {s.kit.bio}
          <input value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} placeholder={s.kit.bioPh} maxLength={160} />
        </label>
        <div className="grid gap-2">
          <p className="text-[14px] font-semibold">
            {s.kit.niches} <small className="font-normal" style={{ color: "var(--ink-3)" }}>(max 4)</small>
          </p>
          <div className="mk-chips">
            {NICHES.map((n) => (
              <button key={n} type="button" aria-pressed={f.niches.includes(n)} onClick={() => toggle("niches", n, 4)}>
                {s.niche[n]}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-2">
          <p className="text-[14px] font-semibold">{s.kit.languages}</p>
          <div className="mk-chips">
            {(["kn", "en"] as const).map((l) => (
              <button key={l} type="button" aria-pressed={f.languages.includes(l)} onClick={() => toggle("languages", l, 2)} className={l === "kn" ? "kn" : ""}>
                {l === "kn" ? "ಕನ್ನಡ" : "English"}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-card mk-fieldset" id="verify">
        <h2 className="mk-h2">{s.kit.handles}</h2>
        <div className="mk-handle mk-handle--head lp-label" aria-hidden>
          <span />
          <span>{s.kit.handle}</span>
          <span>{s.kit.followers}</span>
          <span>{s.kit.avgViews}</span>
          <span />
        </div>
        {PLATFORMS.map((p) => {
          const h = handles[p];
          const verified = Boolean(h.verifiedAt);
          return (
            <div key={p} className="mk-handle">
              <span>{PLATFORM_LABEL[p]}</span>
              <input aria-label={`${PLATFORM_LABEL[p]} ${s.kit.handle}`} value={h.handle} onChange={(e) => setHandle(p, { handle: e.target.value, ...(verified ? { verifiedAt: null } : {}) })} placeholder="@" maxLength={80} />
              <input aria-label={`${PLATFORM_LABEL[p]} ${s.kit.followers}`} inputMode="numeric" value={h.followers ?? ""} placeholder={s.kit.followers} disabled={verified} onChange={(e) => setHandle(p, { followers: num(e.target.value) })} />
              <input aria-label={`${PLATFORM_LABEL[p]} ${s.kit.avgViews}`} inputMode="numeric" value={h.avgViews ?? ""} placeholder={s.kit.avgViews} onChange={(e) => setHandle(p, { avgViews: num(e.target.value) })} />
              <span className={`lp-chip ${verified ? "lp-chip--ok" : ""}`} style={{ visibility: h.handle ? "visible" : "hidden" }}>
                {verified ? s.common.verified : s.common.selfReported}
              </span>
            </div>
          );
        })}
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {youtubeConnected ? (
            <button type="button" className="lp-btn lp-btn--ghost" style={{ minHeight: 42 }} onClick={verify} disabled={verifying}>
              {verifying ? s.common.saving : s.kit.verifyYt}
            </button>
          ) : (
            <a href="/api/auth/youtube/start?next=/m/kit%23verify" className="lp-btn lp-btn--ghost" style={{ minHeight: 42 }}>
              {s.kit.connectYt}
            </a>
          )}
          <span className="lp-label">{s.kit.verifyYtHint}</span>
        </div>
      </section>

      <section className="lp-card mk-fieldset">
        <h2 className="mk-h2">{s.kit.rates}</h2>
        <p className="lp-label">{s.kit.ratesHint}</p>
        <div className="mk-row">
          {DELIVERABLES.map((d) => {
            const range = ranges[d as Deliverable];
            return (
              <label key={d} className="mk-label">
                {s.deliverable[d]}
                <input inputMode="numeric" value={rates[d]} onChange={(e) => setRates({ ...rates, [d]: e.target.value.replace(/[^\d]/g, "") })} placeholder="₹" />
                <small>{range ? `${s.kit.fairRange}: ${inr(range.low)}–${inr(range.high)}` : ""}</small>
              </label>
            );
          })}
        </div>
        {Object.values(ranges).every((r) => !r) && <p className="lp-label">{s.kit.fairNone}</p>}
      </section>

      <section className="lp-card mk-fieldset">
        <div className="mk-row">
          <label className="mk-label">
            {s.kit.email}
            <input type="email" value={f.contactEmail} onChange={(e) => setF({ ...f, contactEmail: e.target.value })} maxLength={200} />
          </label>
          <label className="mk-label">
            {s.kit.whatsapp} <small>({s.common.optional})</small>
            <input type="tel" inputMode="tel" value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} placeholder="+91" maxLength={20} />
            <small>{s.kit.whatsappHint}</small>
          </label>
        </div>
        <label className="mk-check">
          <input type="checkbox" checked={f.openToOffers} onChange={(e) => setF({ ...f, openToOffers: e.target.checked })} />
          <span>
            <b className="font-semibold" style={{ color: "var(--ink)" }}>
              {s.kit.open}
            </b>
            <br />
            {s.kit.openHint}
          </span>
        </label>
        <label className="mk-check">
          <input type="checkbox" checked={f.isPublic} onChange={(e) => setF({ ...f, isPublic: e.target.checked })} />
          <span>
            <b className="font-semibold" style={{ color: "var(--ink)" }}>
              {s.kit.public}
            </b>
            <br />
            {s.kit.publicHint}
          </span>
        </label>
        {f.slug && f.isPublic && (
          <p className="text-[15px]">
            {s.kit.link}:{" "}
            <a href={`/kit/${f.slug}`} target="_blank" className="lp-link font-semibold underline">
              /kit/{f.slug}
            </a>
          </p>
        )}
      </section>

      <div className="mk-bar">
        <button type="submit" className="lp-btn" disabled={busy || !f.displayName.trim()}>
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
