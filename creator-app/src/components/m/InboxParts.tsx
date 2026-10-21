"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { Strings } from "@/lib/marketplace/i18n";
import { send } from "./client";

/** Shrinks a screenshot to a JPEG of at most 1600px on the long side (enough to read text, small to upload). */
function shrink(file: File): Promise<{ mediaType: "image/jpeg"; data: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolve({ mediaType: "image/jpeg", data: c.toDataURL("image/jpeg", 0.85).split(",")[1] });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/** Add an offer: paste the text (with who sent it, optional) or upload a screenshot for Mitra to read. */
export function InboxAdd({ s }: { s: Strings }) {
  const router = useRouter();
  const [mode, setMode] = useState<"paste" | "shot">("paste");
  const [text, setText] = useState("");
  const [who, setWho] = useState({ senderName: "", senderEmail: "", senderPhone: "", senderHandle: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

  async function addPaste(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await send("/api/m/inbox", "POST", { body: text, ...who });
    setBusy(false);
    if (r.error) return setError(r.error);
    router.push(`/m/inbox/${r.json?.id}`);
  }

  async function addShot(f: File | undefined) {
    if (!f) return;
    setBusy(true);
    setError(null);
    try {
      const r = await send("/api/m/inbox/screenshot", "POST", await shrink(f));
      if (r.error) return setError(r.error);
      router.push(`/m/inbox/${r.json?.id}`);
    } catch {
      setError(s.common.error);
    } finally {
      setBusy(false);
      if (file.current) file.current.value = "";
    }
  }

  return (
    <section className="lp-card mk-panel grid content-start gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="mk-h2">{s.inbox.add}</h2>
        <div className="lp-switch" data-on={mode === "shot" ? "business" : "creator"} style={{ fontSize: 14 }}>
          <span className="lp-switch__pill" aria-hidden />
          <button type="button" aria-pressed={mode === "paste"} onClick={() => setMode("paste")} style={{ minHeight: 34 }}>
            {s.inbox.paste}
          </button>
          <button type="button" aria-pressed={mode === "shot"} onClick={() => setMode("shot")} style={{ minHeight: 34 }}>
            {s.inbox.screenshot}
          </button>
        </div>
      </div>
      {mode === "paste" ? (
        <form className="grid gap-3" onSubmit={addPaste}>
          <label htmlFor="inbox-text" className="sr-only">
            {s.inbox.pastePh}
          </label>
          <textarea id="inbox-text" value={text} onChange={(e) => setText(e.target.value)} placeholder={s.inbox.pastePh} maxLength={6000} style={{ minHeight: 160 }} />
          <details>
            <summary className="cursor-pointer text-[14px] font-semibold">{s.inbox.who}</summary>
            <p className="lp-label mt-1">{s.inbox.whoHint}</p>
            <div className="mk-row mt-3">
              <input aria-label={s.inbox.name} placeholder={s.inbox.name} value={who.senderName} onChange={(e) => setWho({ ...who, senderName: e.target.value })} maxLength={120} />
              <input aria-label={s.inbox.email} placeholder={s.inbox.email} type="email" value={who.senderEmail} onChange={(e) => setWho({ ...who, senderEmail: e.target.value })} maxLength={200} />
              <input aria-label={s.inbox.phone} placeholder={s.inbox.phone} type="tel" value={who.senderPhone} onChange={(e) => setWho({ ...who, senderPhone: e.target.value })} maxLength={20} />
              <input aria-label={s.inbox.handle} placeholder={s.inbox.handle} value={who.senderHandle} onChange={(e) => setWho({ ...who, senderHandle: e.target.value })} maxLength={80} />
            </div>
          </details>
          {error && <p className="mk-err">{error}</p>}
          <div>
            <button type="submit" className="lp-btn" disabled={busy || text.trim().length < 10}>
              {busy ? s.common.saving : s.inbox.check}
            </button>
          </div>
        </form>
      ) : (
        <div className="grid gap-3">
          <label className="mk-drop" aria-busy={busy}>
            <input ref={file} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => addShot(e.target.files?.[0])} disabled={busy} />
            <span className="lp-btn" aria-hidden>
              {busy ? s.inbox.reading : s.inbox.upload}
            </span>
          </label>
          <p className="lp-label">{s.inbox.uploadHint}</p>
          {error && <p className="mk-err">{error}</p>}
        </div>
      )}
    </section>
  );
}

/** Fill in or correct who sent it; the sender check runs again. */
export function SenderForm({ s, id, initial }: { s: Strings; id: string; initial: { senderName: string; senderEmail: string; senderPhone: string; senderHandle: string } }) {
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await send(`/api/m/inbox/${id}`, "PATCH", f);
    setBusy(false);
    if (r.error) return setError(r.error);
    router.refresh();
  }
  return (
    <details className="mt-4">
      <summary className="cursor-pointer text-[14px] font-semibold">{s.inbox.who}</summary>
      <form className="mt-3 grid gap-2" onSubmit={save}>
        <div className="mk-row">
          <input aria-label={s.inbox.name} placeholder={s.inbox.name} value={f.senderName} onChange={(e) => setF({ ...f, senderName: e.target.value })} maxLength={120} />
          <input aria-label={s.inbox.email} placeholder={s.inbox.email} type="email" value={f.senderEmail} onChange={(e) => setF({ ...f, senderEmail: e.target.value })} maxLength={200} />
          <input aria-label={s.inbox.phone} placeholder={s.inbox.phone} type="tel" value={f.senderPhone} onChange={(e) => setF({ ...f, senderPhone: e.target.value })} maxLength={20} />
          <input aria-label={s.inbox.handle} placeholder={s.inbox.handle} value={f.senderHandle} onChange={(e) => setF({ ...f, senderHandle: e.target.value })} maxLength={80} />
        </div>
        {error && <p className="mk-err">{error}</p>}
        <div>
          <button type="submit" className="lp-btn lp-btn--ghost" style={{ minHeight: 40 }} disabled={busy}>
            {busy ? s.common.saving : s.inbox.recheck}
          </button>
        </div>
      </form>
    </details>
  );
}

export function ReplyBox({ s, lang, replies }: { s: Strings; lang: "en" | "kn"; replies: { en: string | null; kn: string | null } }) {
  const [l, setL] = useState(lang);
  const [copied, setCopied] = useState(false);
  const reply = replies[l];
  return (
    <section className="lp-card mk-panel">
      <div className="flex items-center justify-between gap-3">
        <h2 className="mk-h2">{s.offer.reply}</h2>
        <div className="lp-switch" data-on={l === "kn" ? "business" : "creator"} style={{ fontSize: 13 }}>
          <span className="lp-switch__pill" aria-hidden />
          <button type="button" aria-pressed={l === "en"} onClick={() => setL("en")} style={{ minHeight: 32 }}>
            English
          </button>
          <button type="button" aria-pressed={l === "kn"} onClick={() => setL("kn")} className="kn" style={{ minHeight: 32 }}>
            ಕನ್ನಡ
          </button>
        </div>
      </div>
      <p className={`lp-reply ${l === "kn" ? "kn" : ""}`} lang={l}>
        {reply}
      </p>
      <button
        type="button"
        className="lp-btn lp-btn--ghost mt-3"
        style={{ minHeight: 42 }}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(reply ?? "");
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {}
        }}
      >
        {copied ? s.offer.copied : s.offer.copy}
      </button>
    </section>
  );
}

export function InboxActions({ s, id, status, dealId }: { s: Strings; id: string; status: string; dealId: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const run = async (url: string, method: string, data?: unknown, after?: (j: Record<string, unknown> | null) => void) => {
    setBusy(true);
    setMsg(null);
    const r = await send(url, method, data);
    setBusy(false);
    if (r.error) return setMsg({ ok: false, text: r.error });
    after?.(r.json);
    router.refresh();
  };
  return (
    <section className="lp-card mk-panel grid gap-3">
      <div className="flex flex-wrap gap-2">
        {dealId ? (
          <Link href={`/m/deals/${dealId}`} className="lp-btn">
            {s.inbox.openDeal}
          </Link>
        ) : (
          <button type="button" className="lp-btn" disabled={busy} onClick={() => run(`/api/m/inbox/${id}/save`, "POST", undefined, (j) => router.push(`/m/deals/${j?.dealId}`))}>
            {s.inbox.saveDeal}
          </button>
        )}
        <button type="button" className="lp-btn lp-btn--ghost" disabled={busy} onClick={() => run(`/api/m/inbox/${id}`, "PATCH", { status: status === "dismissed" ? "new" : "dismissed" })}>
          {status === "dismissed" ? s.inbox.restore : s.inbox.dismiss}
        </button>
      </div>
      <div className="flex flex-wrap gap-4 text-[14px]">
        <button type="button" className="lp-link" style={{ color: "var(--miss)" }} disabled={busy} onClick={() => run(`/api/m/inbox/${id}/report`, "POST", { kind: "scam" }, () => setMsg({ ok: true, text: s.inbox.reported }))}>
          {s.inbox.reportScam}
        </button>
        <button type="button" className="lp-link" style={{ color: "var(--ok)" }} disabled={busy} onClick={() => run(`/api/m/inbox/${id}/report`, "POST", { kind: "ok" }, () => setMsg({ ok: true, text: s.inbox.reported }))}>
          {s.inbox.reportOk}
        </button>
      </div>
      {msg && <p className={msg.ok ? "mk-ok" : "mk-err"}>{msg.text}</p>}
    </section>
  );
}
