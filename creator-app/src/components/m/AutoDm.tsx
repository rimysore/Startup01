"use client";

import { useState } from "react";
import type { Strings } from "@/lib/marketplace/i18n";
import { send } from "./client";

export type AutomationRow = {
  id: string;
  mediaId: string | null;
  mediaCaption: string | null;
  mediaUrl: string | null;
  mediaThumb: string | null;
  keywords: string[];
  anyComment: boolean;
  message: string;
  linkUrl: string | null;
  publicReply: string | null;
  active: boolean;
  sent: number;
  failed: number;
  skipped: number;
};
type Post = { id: string; caption: string | null; url: string | null; thumb: string | null; kind: string | null; at: string };
type Coupon = { url: string; label: string };
type Draft = Omit<AutomationRow, "id" | "sent" | "failed" | "skipped">;

const EMPTY: Draft = { mediaId: null, mediaCaption: null, mediaUrl: null, mediaThumb: null, keywords: [], anyComment: false, message: "", linkUrl: null, publicReply: null, active: true };

/** The creator's Auto-DMs: a list with on/off, counts and edit, and the form to make one. */
export function AutoDmManager({ s, initial, coupons }: { s: Strings; initial: AutomationRow[]; coupons: Coupon[] }) {
  const t = s.autodm;
  const [rows, setRows] = useState(initial);
  const [editing, setEditing] = useState<{ id: string | null; draft: Draft } | null>(initial.length ? null : { id: null, draft: EMPTY });

  async function toggle(id: string, active: boolean) {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, active } : x)));
    const r = await send(`/api/m/autodm/${id}`, "PUT", { active });
    if (r.error) setRows((r2) => r2.map((x) => (x.id === id ? { ...x, active: !active } : x)));
  }
  async function remove(id: string) {
    if (!confirm(t.deleteAsk)) return;
    const r = await send(`/api/m/autodm/${id}`, "DELETE");
    if (!r.error) setRows((x) => x.filter((a) => a.id !== id));
  }

  return (
    <div className="grid gap-6">
      {editing ? (
        <AutoDmForm
          s={s}
          id={editing.id}
          initial={editing.draft}
          coupons={coupons}
          onCancel={rows.length ? () => setEditing(null) : undefined}
          onSaved={() => location.reload()}
        />
      ) : (
        <div>
          <button type="button" className="lp-btn" onClick={() => setEditing({ id: null, draft: EMPTY })}>
            + {t.newTitle}
          </button>
        </div>
      )}

      {rows.length > 0 && (
        <section className="grid gap-3">
          <h2 className="mk-h2">{t.listTitle}</h2>
          {rows.map((a) => (
            <article key={a.id} className="lp-card mk-panel mk-dm">
              <PostThumb thumb={a.mediaThumb} />
              <div className="grid min-w-0 gap-1.5">
                <p className="truncate font-semibold">{a.mediaId ? (a.mediaCaption ?? "Post") : t.everyPost}</p>
                <div className="flex flex-wrap gap-1.5">
                  {a.anyComment ? <span className="lp-chip">{t.anyComment}</span> : a.keywords.map((k) => <span key={k} className="lp-chip lp-chip--ink">{k}</span>)}
                </div>
                <p className="line-clamp-2 text-[14px]" style={{ color: "var(--ink-2)" }}>
                  {a.message}
                </p>
                <p className="lp-label tabular-nums">
                  {a.sent} {t.sent}
                  {a.failed > 0 && ` · ${a.failed} ${t.failed}`}
                  {a.skipped > 0 && ` · ${a.skipped} ${t.skipped}`}
                </p>
              </div>
              <div className="mk-dm__end">
                <label className="mk-switch">
                  <input type="checkbox" checked={a.active} onChange={(e) => toggle(a.id, e.target.checked)} aria-label={a.active ? t.on : t.off} />
                  <span>{a.active ? t.on : t.off}</span>
                </label>
                <button type="button" className="lp-link text-[14px]" onClick={() => setEditing({ id: a.id, draft: a })}>
                  {t.edit}
                </button>
                <button type="button" className="lp-link text-[14px]" style={{ color: "var(--ink-3)" }} onClick={() => remove(a.id)}>
                  {t.delete}
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

function PostThumb({ thumb }: { thumb: string | null }) {
  return thumb ? (
    // Instagram's own image URLs; not worth proxying through next/image.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={thumb} alt="" className="mk-dm__thumb" referrerPolicy="no-referrer" />
  ) : (
    <span className="mk-dm__thumb" aria-hidden>
      IG
    </span>
  );
}

function AutoDmForm({ s, id, initial, coupons, onCancel, onSaved }: { s: Strings; id: string | null; initial: Draft; coupons: Coupon[]; onCancel?: () => void; onSaved: () => void }) {
  const t = s.autodm;
  const [d, setD] = useState<Draft>(initial);
  const [kw, setKw] = useState("");
  const [posts, setPosts] = useState<Post[] | "loading" | "failed" | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const couponUrls = new Set(coupons.map((c) => c.url));
  const [linkMode, setLinkMode] = useState<string>(!initial.linkUrl ? "" : couponUrls.has(initial.linkUrl) ? initial.linkUrl : "custom");

  async function loadPosts() {
    if (posts && posts !== "failed") return;
    setPosts("loading");
    const r = await send("/api/m/autodm/posts", "GET");
    setPosts(r.error ? "failed" : ((r.json?.posts as Post[]) ?? []));
  }
  const addKw = () => {
    const k = kw.trim().replace(/^#/, "");
    if (k && d.keywords.length < 5 && !d.keywords.some((x) => x.toLowerCase() === k.toLowerCase())) setD({ ...d, keywords: [...d.keywords, k] });
    setKw("");
  };
  const preview = (d.message || t.messagePh).replace(/\{name\}/g, "@someone") + (d.linkUrl ? `\n\n${d.linkUrl}` : "");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const payload = { ...d, keywords: kw.trim() && d.keywords.length < 5 ? [...d.keywords, kw.trim().replace(/^#/, "")] : d.keywords };
    const r = await send(id ? `/api/m/autodm/${id}` : "/api/m/autodm", id ? "PUT" : "POST", payload);
    setBusy(false);
    if (r.error) return setErr(r.error);
    onSaved();
  }

  return (
    <form className="lp-card mk-fieldset" onSubmit={save}>
      <h2 className="mk-h2">{id ? t.editTitle : t.newTitle}</h2>

      <div className="grid gap-2">
        <p className="text-[14px] font-semibold">{t.pickPost}</p>
        <div className="mk-chips">
          <button type="button" aria-pressed={!d.mediaId} onClick={() => setD({ ...d, mediaId: null, mediaCaption: null, mediaUrl: null, mediaThumb: null })}>
            {t.anyPost}
          </button>
          {d.mediaId && (
            <button type="button" aria-pressed>
              {d.mediaCaption ?? "Post"}
            </button>
          )}
        </div>
        {!posts ? (
          <button type="button" className="lp-link justify-self-start text-[14px] underline" onClick={loadPosts}>
            {t.pickPost} ↓
          </button>
        ) : posts === "loading" ? (
          <p className="lp-label">{t.loadingPosts}</p>
        ) : posts === "failed" ? (
          <p className="lp-label">{t.noPosts}</p>
        ) : (
          <div className="mk-posts">
            {posts.map((p) => (
              <button
                key={p.id}
                type="button"
                className="mk-post"
                aria-pressed={d.mediaId === p.id}
                onClick={() => setD({ ...d, mediaId: p.id, mediaCaption: p.caption, mediaUrl: p.url, mediaThumb: p.thumb })}
                title={p.caption ?? ""}
              >
                <PostThumb thumb={p.thumb} />
                <span className="truncate">{p.caption ?? (p.kind === "REELS" ? "Reel" : "Post")}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-2">
        <p className="text-[14px] font-semibold">{t.keywords}</p>
        {!d.anyComment && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {d.keywords.map((k) => (
                <button key={k} type="button" className="lp-chip lp-chip--ink" onClick={() => setD({ ...d, keywords: d.keywords.filter((x) => x !== k) })} aria-label={`Remove ${k}`}>
                  {k} ×
                </button>
              ))}
              {d.keywords.length < 5 && (
                <span className="flex gap-2">
                  <input
                    value={kw}
                    onChange={(e) => setKw(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addKw();
                      }
                    }}
                    placeholder={t.keywordPh}
                    maxLength={30}
                    aria-label={t.keywords}
                    style={{ width: 160 }}
                  />
                  <button type="button" className="lp-btn lp-btn--ghost" style={{ minHeight: 40 }} onClick={addKw}>
                    {t.add}
                  </button>
                </span>
              )}
            </div>
            <small className="lp-label">{t.keywordsHint}</small>
          </>
        )}
        <label className="mk-check">
          <input type="checkbox" checked={d.anyComment} onChange={(e) => setD({ ...d, anyComment: e.target.checked })} />
          <span>{t.anyComment}</span>
        </label>
      </div>

      <label className="mk-label">
        {t.message}
        <textarea value={d.message} onChange={(e) => setD({ ...d, message: e.target.value })} placeholder={t.messagePh} maxLength={800} rows={4} required />
        <small>{t.messageHint}</small>
      </label>

      <label className="mk-label">
        {t.link}
        <select
          value={linkMode}
          onChange={(e) => {
            setLinkMode(e.target.value);
            setD({ ...d, linkUrl: e.target.value && e.target.value !== "custom" ? e.target.value : e.target.value === "custom" ? (d.linkUrl && !couponUrls.has(d.linkUrl) ? d.linkUrl : "") : null });
          }}
        >
          <option value="">{t.linkNone}</option>
          {coupons.map((c) => (
            <option key={c.url} value={c.url}>
              {c.label}
            </option>
          ))}
          <option value="custom">{t.linkCustom}</option>
        </select>
        {linkMode === "custom" && <input value={d.linkUrl ?? ""} onChange={(e) => setD({ ...d, linkUrl: e.target.value })} placeholder="https://" inputMode="url" maxLength={500} aria-label={t.linkCustom} />}
        {coupons.length > 0 && <small>{t.linkCouponHint}</small>}
      </label>

      <label className="mk-label">
        {t.publicReply}
        <input value={d.publicReply ?? ""} onChange={(e) => setD({ ...d, publicReply: e.target.value })} placeholder={t.publicReplyPh} maxLength={200} />
      </label>

      <div className="grid gap-1.5">
        <p className="text-[14px] font-semibold">{t.preview}</p>
        <p className="mk-bubble">{preview}</p>
      </div>

      {err && (
        <p className="mk-err" role="alert">
          {err}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="lp-btn" disabled={busy}>
          {busy ? s.common.saving : id ? t.save : t.create}
        </button>
        {onCancel && (
          <button type="button" className="lp-link text-[14px]" onClick={onCancel}>
            {t.cancel}
          </button>
        )}
      </div>
    </form>
  );
}

/** "I want the Creator Pass": records interest; nothing is charged. */
export function PassInterest({ s, wanted }: { s: Strings; wanted: boolean }) {
  const [done, setDone] = useState(wanted);
  const [busy, setBusy] = useState(false);
  if (done) return <p className="mk-ok">{s.pass.wanted}</p>;
  return (
    <button
      type="button"
      className="lp-btn"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const r = await send("/api/m/pass", "PUT");
        setBusy(false);
        if (!r.error) setDone(true);
      }}
    >
      {s.pass.want}
    </button>
  );
}
