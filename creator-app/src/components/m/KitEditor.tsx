"use client";

import { useEffect, useRef, useState } from "react";
import { DELIVERABLES, NICHES, PLATFORM_LABEL, PLATFORMS, type Deliverable } from "@/lib/marketplace/flag";
import type { Strings } from "@/lib/marketplace/i18n";
import { send } from "./client";

type Stats = { posts: number | null; totalViews?: number | null; avgEngagement?: number | null; recent: { id: string; title: string; url: string | null; at: string; views?: number | null; likes?: number | null; comments?: number | null }[] };
type Handle = { platform: string; handle: string; followers: number | null; avgViews: number | null; verifiedAt: string | null; stats?: Stats | null; profileUrl?: string | null };
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

const compact = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1).replace(/\.0$/, "")}K` : String(n));

export function KitEditor({
  s,
  initial,
  youtubeConnected,
  instagram,
  ranges,
}: {
  s: Strings;
  initial: Initial;
  youtubeConnected: boolean;
  instagram: { configured: boolean; connected: boolean; message: string | null };
  ranges: Record<string, Range>;
}) {
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

  async function refreshInstagram() {
    setVerifying(true);
    setMsg(null);
    const r = await send("/api/m/kit/instagram", "POST");
    setVerifying(false);
    if (r.error) return setMsg({ ok: false, text: r.error });
    location.reload();
  }

  async function disconnectInstagram() {
    setVerifying(true);
    await send("/api/m/kit/instagram", "DELETE");
    location.reload();
  }

  // Back from Google with ?verify=1: verify straight away, once.
  const autoVerified = useRef(false);
  useEffect(() => {
    if (autoVerified.current || !youtubeConnected || new URLSearchParams(location.search).get("verify") !== "1") return;
    autoVerified.current = true;
    history.replaceState(null, "", `${location.pathname}#verify`);
    void verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on arrival
  }, [youtubeConnected]);

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
        <div className="mk-verify">
          <h3 className="text-[16px] font-semibold">{s.kit.verifyTitle}</h3>
          <p className="lp-label">{s.kit.verifySub}</p>
          {instagram.message && (
            <p className={instagram.message === "ok" ? "mk-ok" : "mk-err"} role="status">
              {s.kit.igMsg[instagram.message] ?? s.kit.igMsg.failed}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {youtubeConnected ? (
              <button type="button" className="lp-btn lp-btn--ghost" style={{ minHeight: 42 }} onClick={verify} disabled={verifying}>
                {verifying ? s.common.saving : handles.youtube.verifiedAt ? s.kit.refreshYt : s.kit.verifyYt}
              </button>
            ) : (
              <a href="/api/auth/youtube/start?only=count&next=/m/kit%3Fverify%3D1%23verify" className="lp-btn lp-btn--ghost" style={{ minHeight: 42 }}>
                {s.kit.connectYt}
              </a>
            )}
            {instagram.configured ? (
              instagram.connected ? (
                <>
                  <button type="button" className="lp-btn lp-btn--ghost" style={{ minHeight: 42 }} onClick={refreshInstagram} disabled={verifying}>
                    {s.kit.refreshIg}
                  </button>
                  <button type="button" className="lp-link text-[14px]" style={{ color: "var(--ink-2)" }} onClick={disconnectInstagram} disabled={verifying}>
                    {s.kit.disconnectIg}
                  </button>
                </>
              ) : (
                <a href="/api/auth/instagram/start" className="lp-btn lp-btn--ghost" style={{ minHeight: 42 }}>
                  {s.kit.connectIg}
                </a>
              )
            ) : (
              <span className="lp-label">{s.kit.igSoon}</span>
            )}
          </div>
          {instagram.configured && !instagram.connected && <p className="lp-label">{s.kit.igHint}</p>}
          <p className="lp-label">{s.kit.otherSelf}</p>
          {(["youtube", "instagram"] as const)
            .filter((p) => handles[p].verifiedAt && handles[p].stats)
            .map((p) => {
              const h = handles[p];
              const st = h.stats!;
              return (
                <div key={p} className="mk-stats">
                  <p className="font-semibold">
                    {PLATFORM_LABEL[p]} ·{" "}
                    {h.profileUrl ? (
                      <a href={h.profileUrl} target="_blank" rel="noopener noreferrer" className="lp-link underline">
                        {h.handle}
                      </a>
                    ) : (
                      h.handle
                    )}{" "}
                    <span className="lp-chip lp-chip--ok">{s.common.verified}</span>
                  </p>
                  <p className="mt-1 text-[14px] tabular-nums" style={{ color: "var(--ink-2)" }}>
                    {[
                      h.followers != null ? `${compact(h.followers)} ${s.kit.followers.toLowerCase()}` : null,
                      st.posts != null ? `${compact(st.posts)} ${s.kit.statPosts}` : null,
                      h.avgViews != null ? `${compact(h.avgViews)} ${s.kit.statAvgViews}` : null,
                      st.avgEngagement != null ? `${compact(st.avgEngagement)} ${s.kit.statEngagement}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {st.recent.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-[14px] font-semibold">{s.kit.statRecent}</summary>
                      <ul className="mt-2 grid gap-1.5 text-[14px]">
                        {st.recent.map((r) => (
                          <li key={r.id} className="flex justify-between gap-3">
                            {r.url ? (
                              <a href={r.url} target="_blank" rel="noopener noreferrer" className="lp-link truncate">
                                {r.title}
                              </a>
                            ) : (
                              <span className="truncate">{r.title}</span>
                            )}
                            <span className="shrink-0 tabular-nums" style={{ color: "var(--ink-2)" }}>
                              {[r.views != null ? `${compact(r.views)} views` : null, r.likes != null ? `${compact(r.likes)} likes` : null].filter(Boolean).join(" · ")}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              );
            })}
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
