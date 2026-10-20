"use client";

import { useCallback, useEffect, useState } from "react";
import { MitraMark } from "@/components/brand";
import { burstConfetti } from "@/components/celebrate";
import { useDashboard } from "@/components/dashboard-context";
import { WHATSAPP_LOCKED } from "@/lib/company";
import { Button, Card, ErrorNote, PageHeader, Spinner } from "@/components/ui";
import { languageLabel } from "@/lib/languages";

interface Status {
  configured: boolean;
  emailConfigured: boolean;
  number: string | null;
  chat: string | null;
  contact: { phone: string; optedOut: boolean; since: string } | null;
  prefs: { weekly: boolean; videoCheck: boolean; email: boolean; language: string };
  email: string;
  recent: { id: number; kind: string; key: string; channel: string; status: string; at: string; hasPdf: boolean }[];
}

const WA_GREEN = "#25D366";

const SAMPLE = `*📊 Rima Vlogs · 6 Oct – 12 Oct*

Badhiya hafta raha! Views 50% upar gaye aur 140 naye log jude.

👀 10.5K views (▲50%) · ⏱️ 525 hrs · 🙌 +140 subs
🎯 600 more to 10K subscribers

*🏆*
• "Hyderabad street food" aapke usual se 2.6× chal raha hai.
• 3 din lagatar naye subscribers aaye.

*🔧*
• "Room tour" sirf 22% dekha gaya: pehle 10 second mein result dikhao.

*🎬 Hyderabad street food, part 2*
Pichla video sabse zyada chala, log aur chahte hain.`;

function Toggle({ on, onChange, label, sub, disabled }: { on: boolean; onChange: (v: boolean) => void; label: string; sub: string; disabled?: boolean }) {
  return (
    <label className={`flex cursor-pointer items-start justify-between gap-4 py-4 ${disabled ? "opacity-50" : ""}`}>
      <span>
        <span className="block font-semibold">{label}</span>
        <span className="mt-0.5 block text-sm text-muted">{sub}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!on)}
        className={`relative mt-1 h-7 w-12 shrink-0 rounded-full transition ${on ? "bg-good" : "bg-line"}`}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-6" : "left-1"}`} />
      </button>
    </label>
  );
}

/** A phone-shaped preview of a report, so creators see exactly what they'll get. */
function PhonePreview({ text }: { text: string }) {
  const html = text
    .split("\n")
    .map((line, i) => {
      const parts = line.split(/(\*[^*]+\*)/g).map((p, j) => (p.startsWith("*") && p.endsWith("*") && p.length > 2 ? <strong key={j}>{p.slice(1, -1)}</strong> : <span key={j}>{p}</span>));
      return line ? <p key={i}>{parts}</p> : <div key={i} className="h-2" />;
    });
  return (
    <div className="mx-auto w-full max-w-[340px] rounded-[38px] border-[10px] border-ink bg-ink shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]">
      <div className="flex items-center gap-2 rounded-t-[28px] px-4 py-3 text-white" style={{ background: "#075E54" }}>
        <MitraMark size={32} id="wa-preview" />
        <span>
          <span className="block text-sm font-semibold leading-tight">Mitra</span>
          <span className="block text-[11px] opacity-75">your channel manager</span>
        </span>
      </div>
      <div className="max-h-[440px] overflow-y-auto rounded-b-[28px] px-3 py-4" style={{ background: "#ECE5DD" }}>
        <div className="max-w-[92%] rounded-xl rounded-tl-sm bg-white px-3 py-2 text-[13px] leading-snug text-[#111b21] shadow-sm">
          {html}
          <p className="mt-1 text-right text-[10px] text-[#667781]">8:45 am</p>
        </div>
        <div className="mt-1.5 grid max-w-[92%] grid-cols-2 gap-1.5 text-center text-[13px] font-medium text-[#027eb5]">
          <span className="rounded-lg bg-white py-2 shadow-sm">Video ideas</span>
          <span className="rounded-lg bg-white py-2 shadow-sm">Menu</span>
        </div>
      </div>
    </div>
  );
}

export default function WhatsAppPage() {
  const { me, language } = useDashboard();
  const [s, setS] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<{ code: string; link: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [sample, setSample] = useState<{ text: string; note: string; pdf: string | null } | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/whatsapp", { cache: "no-store" });
    if (!r.ok) throw new Error(String(r.status));
    return (await r.json()) as Status;
  }, []);

  useEffect(() => {
    if (!me?.user) return;
    let live = true;
    load()
      .then((d) => live && setS(d))
      .catch(() => live && setError("Couldn't load your WhatsApp settings."));
    return () => {
      live = false;
    };
  }, [me?.user, load]);

  // While a code is out, watch for the creator's message to arrive.
  useEffect(() => {
    if (!code) return;
    const timer = setInterval(async () => {
      const d = await load().catch(() => null);
      if (d?.contact) {
        setS(d);
        setCode(null);
        burstConfetti();
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [code, load]);

  async function connect() {
    setBusy("connect");
    setError(null);
    const r = await fetch("/api/whatsapp/link", { method: "POST" });
    const d = (await r.json()) as { code?: string; link?: string; error?: string };
    setBusy(null);
    if (!r.ok || !d.code || !d.link) return setError(d.error ?? "Couldn't start connecting. Try again.");
    setCode({ code: d.code, link: d.link });
    window.open(d.link, "_blank", "noopener");
  }

  async function save(patch: Record<string, unknown>) {
    if (!s) return;
    const before = s;
    setS({ ...s, prefs: { ...s.prefs, ...patch }, contact: patch.resume && s.contact ? { ...s.contact, optedOut: false } : s.contact });
    const r = await fetch("/api/whatsapp", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) }).catch(() => null);
    // A switch that didn't save goes back, so what's shown is what Mitra will actually do.
    if (!r?.ok) {
      setS(before);
      setError("Couldn't save that. Check your connection and try again.");
    }
  }

  async function disconnect() {
    if (!window.confirm("Disconnect WhatsApp? Mitra will forget your number and stop messaging you there.")) return;
    setBusy("disconnect");
    await fetch("/api/whatsapp", { method: "DELETE" });
    setS(await load());
    setBusy(null);
  }

  async function sendSample(kind: "weekly" | "video_check") {
    setBusy(kind);
    setError(null);
    const r = await fetch("/api/notifications/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind }) });
    const d = (await r.json()) as { channel?: string; preview?: string; pdf?: string | null; error?: string };
    setBusy(null);
    if (!r.ok || !d.preview) return setError(d.error ?? "Couldn't make a sample right now.");
    const where = d.channel === "whatsapp" ? "Sent to your WhatsApp ✅" : d.channel === "email" ? `Sent to ${s?.email} ✅` : "Here's how it looks (connect WhatsApp to receive it).";
    setSample({ text: d.preview, note: where, pdf: d.pdf ?? null });
    setS(await load());
  }

  if (!me) return <Spinner label="Loading" />;
  if (!me.user) {
    return (
      <div className="rise">
        <PageHeader eyebrow="WhatsApp & reports" title="Your Monday report and video checks, on WhatsApp or email." />
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <Card>
            <p className="text-lg">Sign in and connect your channel to get your Monday report and a check on every new video, right in WhatsApp.</p>
            <a href="/login?next=/dashboard/whatsapp" className="mt-4 inline-block rounded-full bg-ink px-5 py-3 font-semibold text-bg">Sign in</a>
          </Card>
          <PhonePreview text={SAMPLE} />
        </div>
      </div>
    );
  }

  const linked = s?.contact;
  return (
    <div className="rise">
      <PageHeader eyebrow="WhatsApp & reports" title="Your Monday report and video checks, on WhatsApp or email." />
      {error && <div className="mb-4"><ErrorNote>{error}</ErrorNote></div>}

      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-6">
          {/* ---- Connect ---- */}
          <section className="card relative p-5 sm:p-6" aria-label="WhatsApp connection">
            {!s ? (
              <Spinner label="Checking" />
            ) : !s.configured || (WHATSAPP_LOCKED && !me?.admin) ? (
              <div className="relative">
                <p className="flex items-center gap-2 font-display text-xl">
                  WhatsApp is coming soon <span className="rounded-md bg-surface-2 px-1.5 py-0.5 font-sans text-xs font-semibold text-muted">Soon</span>
                </p>
                <p className="mt-2 text-ink-2">We&apos;re setting up Mitra&apos;s WhatsApp number. Until then, your Monday report comes by email{s.prefs.email ? ` to ${s.email}` : ""}.</p>
              </div>
            ) : linked ? (
              <div className="relative">
                <p className="text-sm font-semibold" style={{ color: WA_GREEN }}>● Connected</p>
                <p className="mt-1 font-display text-xl">{linked.phone}</p>
                {linked.optedOut ? (
                  <p className="mt-2 text-ink-2">Reports are paused because you sent STOP. You can still chat with Mitra.</p>
                ) : (
                  <p className="mt-2 text-ink-2">Your report arrives every Monday morning, and a check 2 days after each upload.</p>
                )}
                <div className="mt-5 flex flex-wrap gap-2">
                  {s.chat && (
                    <a href={s.chat} target="_blank" rel="noopener noreferrer" className="rounded-full px-5 py-3 font-semibold text-[#073b1d]" style={{ background: WA_GREEN }}>
                      Open chat
                    </a>
                  )}
                  {linked.optedOut && (
                    <button onClick={() => save({ resume: true })} className="rounded-full bg-bg px-5 py-3 font-semibold text-ink">
                      Turn reports back on
                    </button>
                  )}
                  <button onClick={disconnect} disabled={busy !== null} className="rounded-full px-5 py-3 font-semibold text-ink-2 hover:bg-surface">
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <p className="font-display text-3xl leading-tight sm:text-4xl">Get Mitra on WhatsApp</p>
                <p className="mt-2 text-ink-2">No app to install. Your report, video checks and answers, right where you already are.</p>
                <ol className="mt-5 space-y-2 text-sm">
                  <li><b>1.</b> Tap <b>Connect WhatsApp</b> below</li>
                  <li><b>2.</b> WhatsApp opens with a message ready</li>
                  <li><b>3.</b> Press <b>Send</b>. That&apos;s it.</li>
                </ol>
                {code ? (
                  <div className="mt-5 rounded-2xl bg-surface p-4">
                    <p className="text-sm text-ink-2">Waiting for your message…</p>
                    <p className="mt-1 text-sm">
                      Didn&apos;t open? Send <b className="font-mono text-lg">JOIN {code.code}</b> to <b>+{s.number}</b> on WhatsApp.
                    </p>
                    <a href={code.link} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block rounded-full px-5 py-3 font-semibold text-[#073b1d]" style={{ background: WA_GREEN }}>
                      Open WhatsApp again
                    </a>
                  </div>
                ) : (
                  <button onClick={connect} disabled={busy !== null} className="mt-5 w-full rounded-full px-6 py-4 text-lg font-bold text-[#073b1d] transition hover:brightness-105 sm:w-auto" style={{ background: WA_GREEN }}>
                    {busy === "connect" ? "Opening…" : "Connect WhatsApp"}
                  </button>
                )}
                <p className="mt-4 text-xs text-muted">By connecting you agree to get reports from Mitra on WhatsApp. Reply STOP any time.</p>
                {me?.admin && <SetupCheck />}
              </div>
            )}
          </section>

          {/* ---- Preferences ---- */}
          {s && (
            <Card>
              <h2 className="font-display text-lg">What Mitra sends</h2>
              <div className="divide-y divide-line">
                <Toggle on={s.prefs.weekly} onChange={(v) => save({ weekly: v })} label="Monday report" sub="Every Monday ~8:45 am: wins, fixes and what to post next" />
                <Toggle on={s.prefs.videoCheck} onChange={(v) => save({ videoCheck: v })} label="2-day video check" sub="Two days after each upload: how it's doing and what to do" />
                <Toggle on={s.prefs.email} onChange={(v) => save({ email: v })} label="Email if WhatsApp isn't connected" sub={`To ${s.email}`} />
              </div>
              <p className="mt-2 text-sm text-muted">Reports are written in <b className="text-ink">{languageLabel(language)}</b>. Change it in the top bar, or send &quot;menu&quot; → Language on WhatsApp.</p>
            </Card>
          )}

          {/* ---- Try it ---- */}
          {s && (
            <Card>
              <h2 className="font-display text-lg">See it now</h2>
              <p className="mt-1 text-sm text-muted">Mitra builds a real report from your channel and sends it the way you&apos;ll get it.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={() => sendSample("weekly")} disabled={busy !== null}>{busy === "weekly" ? "Making it…" : "Send my weekly report"}</Button>
                <Button variant="ghost" onClick={() => sendSample("video_check")} disabled={busy !== null}>{busy === "video_check" ? "Checking…" : "Check my latest video"}</Button>
              </div>
              {sample && (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <p className="text-sm font-semibold text-good">{sample.note}</p>
                  {sample.pdf && (
                    <a href={sample.pdf} className="rounded-full border border-line px-4 py-2 text-sm font-semibold hover:bg-surface-2">
                      📄 Download PDF
                    </a>
                  )}
                </div>
              )}
              {s.recent.length > 0 && (
                <ul className="mt-5 text-sm text-ink-2">
                  {s.recent.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 border-b border-line py-2 last:border-0">
                      <span className="min-w-0">
                        <span className="block font-medium text-ink">
                          {r.kind === "weekly" ? "Weekly report" : "Video check"}
                          {r.key.includes(":") ? <span className="font-normal text-muted"> · on request</span> : null}
                        </span>
                        <span className="block text-xs text-muted">
                          {r.status === "sent" ? (r.channel === "whatsapp" ? "WhatsApp" : r.channel === "email" ? "Email" : "Saved") : r.status} ·{" "}
                          {new Date(r.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      </span>
                      {r.hasPdf && (
                        <a href={`/api/reports/pdf?id=${r.id}`} className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-semibold hover:bg-surface-2" aria-label="Download PDF">
                          📄 PDF
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <PhonePreview text={sample?.text ?? SAMPLE} />
          <Card>
            <h2 className="font-display text-lg">On WhatsApp you can</h2>
            <ul className="mt-3 space-y-2 text-sm text-ink-2">
              <li>💬 <b className="text-ink">Ask anything</b>: &quot;is hafte kya upload karun?&quot;</li>
              <li>✍️ <b className="text-ink">Get 5 titles</b> for any topic</li>
              <li>💡 <b className="text-ink">Next video ideas</b> from what&apos;s working</li>
              <li>🎬 <b className="text-ink">Check your latest video</b> any time</li>
              <li>📄 <b className="text-ink">Weekly report as a PDF</b> in your language, to save or share</li>
              <li>🌐 <b className="text-ink">Switch language</b> in two taps</li>
              <li>🔕 <b className="text-ink">STOP</b> to pause reports, <b className="text-ink">START</b> to resume</li>
            </ul>
            <p className="mt-3 text-xs text-muted">Just send &quot;menu&quot;. Answers use the same AI uses as the website; reports are always free.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface Health {
  settings: Record<string, boolean>;
  phone: { ok: boolean; detail: string };
  webhook: Record<"ok" | "badsig" | "fail", { at: string; detail: string } | null>;
  callbackUrl: string;
}

const CheckRow = ({ ok, label, detail }: { ok: boolean | null; label: string; detail?: string }) => (
  <li className="flex gap-2">
    <span className={ok ? "text-good" : ok === false ? "text-bad" : "text-muted"}>{ok ? "✓" : ok === false ? "✗" : "•"}</span>
    <span>
      {label}
      {detail && <span className="block break-all text-xs text-muted">{detail}</span>}
    </span>
  </li>);

/** Admins only: where the WhatsApp setup breaks, without opening server logs. */
function SetupCheck() {
  const [h, setH] = useState<Health | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    setH(await fetch("/api/whatsapp/health", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null));
    setBusy(false);
  };
  const ago = (s: string) => new Date(s).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  return (
    <div className="mt-5 rounded-lg border border-line p-4 text-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold">Setup check <span className="text-xs font-normal text-muted">(admins only)</span></p>
        <button onClick={run} disabled={busy} className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold hover:bg-surface-2 disabled:opacity-50">
          {busy ? "Checking…" : "Run check"}
        </button>
      </div>
      {h && (
        <ul className="mt-3 space-y-2">
          {Object.entries(h.settings).map(([k, v]) => (
            <CheckRow key={k} ok={v} label={`${k} ${v ? "is set" : "is missing in Vercel"}`} />
          ))}
          <CheckRow ok={h.phone.ok} label={h.phone.ok ? "Meta accepts the token for this number" : "Meta rejects the token or number ID"} detail={h.phone.detail} />
          <CheckRow
            ok={h.webhook.ok ? true : false}
            label={h.webhook.ok ? `Last message from Meta: ${ago(h.webhook.ok.at)}` : "Meta has never delivered a message to the webhook"}
            detail={h.webhook.ok ? h.webhook.ok.detail : `In Meta: WhatsApp → Configuration → Callback URL ${h.callbackUrl}, then subscribe the "messages" field.`}
          />
          {h.webhook.badsig && <CheckRow ok={false} label={`Signature failed ${ago(h.webhook.badsig.at)}`} detail="WHATSAPP_APP_SECRET must equal App settings → Basic → App secret, then redeploy." />}
          {h.webhook.fail && <CheckRow ok={false} label={`Last error ${ago(h.webhook.fail.at)}`} detail={h.webhook.fail.detail} />}
        </ul>
      )}
    </div>
  );
}

