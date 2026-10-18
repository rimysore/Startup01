"use client";

import { useEffect, useState } from "react";
import { INTERVIEW, QUESTION_IDS, type QuestionId } from "@/lib/interview";
import { Button } from "./ui";

type Answers = Partial<Record<QuestionId | "other" | "phone", string | string[]>>;

const DISMISS_DAYS = 7;
const dismissKey = (userId: string) => `mitra-interview-dismissed:${userId}`;

/**
 * "Help shape Mitra": a one-minute interview on the Overview. Shown once the channel is connected, until the
 * creator answers (then never again) or closes it (then back in a week).
 */
export function InterviewCard({ userId }: { userId: string }) {
  const [state, setState] = useState<"hidden" | "invite" | "open" | "sending" | "done">("hidden");
  const [a, setA] = useState<Answers>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    try {
      const at = Number(localStorage.getItem(dismissKey(userId)) ?? 0);
      if (Date.now() - at < DISMISS_DAYS * 86_400_000) return;
    } catch {}
    fetch("/api/interview", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { answers: unknown } | null) => live && d && !d.answers && setState("invite"))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [userId]);

  if (state === "hidden") return null;

  const dismiss = () => {
    try {
      localStorage.setItem(dismissKey(userId), String(Date.now()));
    } catch {}
    setState("hidden");
  };

  const toggle = (id: QuestionId, key: string, multi: boolean) =>
    setA((prev) => {
      if (!multi) return { ...prev, [id]: prev[id] === key ? undefined : key };
      const list = Array.isArray(prev[id]) ? (prev[id] as string[]) : [];
      return { ...prev, [id]: list.includes(key) ? list.filter((k) => k !== key) : [...list, key] };
    });

  async function send() {
    setState("sending");
    setError(null);
    const r = await fetch("/api/interview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(a) }).catch(() => null);
    if (r?.ok) return setState("done");
    const d = (await r?.json().catch(() => null)) as { error?: string } | null;
    setError(d?.error ?? "Couldn't send. Check your connection and try again.");
    setState("open");
  }

  if (state === "done")
    return (
      <section className="card mt-6 p-5">
        <p className="font-semibold">Thank you. The founder reads every answer.</p>
        <p className="mt-1 text-sm text-muted">{a.call === "yes" ? "We'll message you to find a time for a quick call." : "What you told us decides what we build next."}</p>
      </section>
    );

  if (state === "invite")
    return (
      <section className="card mt-6 flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="font-semibold">Help shape Mitra for your channel</p>
          <p className="mt-0.5 text-sm text-muted">One minute, six quick questions. You tell us what would actually grow your views, and we build that first.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={dismiss}>Later</Button>
          <Button onClick={() => setState("open")}>Answer</Button>
        </div>
      </section>
    );

  const chip = (on: boolean) => `rounded-lg border px-3 py-1.5 text-sm ${on ? "border-accent bg-accent-soft font-medium text-accent" : "border-line hover:bg-surface-2"}`;
  const input = "mt-2 w-full rounded-lg border border-line bg-surface p-3 text-sm outline-none focus:border-accent font-indic";

  return (
    <section className="card mt-6 p-5" aria-label="Help shape Mitra">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">Help shape Mitra for your channel</p>
          <p className="mt-0.5 text-sm text-muted">Answer any you like. Write in any language.</p>
        </div>
        <button onClick={dismiss} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xl hover:bg-surface-2" aria-label="Close">
          ×
        </button>
      </div>
      <div className="mt-4 space-y-5">
        {QUESTION_IDS.map((id) => {
          const def = INTERVIEW[id];
          return (
            <fieldset key={id}>
              <legend className="text-sm font-medium">
                {def.q} {"multi" in def && def.multi && <span className="font-normal text-muted">(pick any)</span>}
              </legend>
              {"options" in def ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(def.options).map(([key, label]) => {
                    const v = a[id];
                    const on = Array.isArray(v) ? v.includes(key) : v === key;
                    return (
                      <button key={key} type="button" aria-pressed={on} onClick={() => toggle(id, key, def.multi)} className={chip(on)}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <textarea rows={2} maxLength={1000} value={(a[id] as string) ?? ""} onChange={(e) => setA({ ...a, [id]: e.target.value })} placeholder="For example: tell me every Monday which topic to make next" className={input} />
              )}
              {id === "call" && a.call === "yes" && (
                <input value={(a.phone as string) ?? ""} onChange={(e) => setA({ ...a, phone: e.target.value })} maxLength={30} inputMode="tel" placeholder="Your WhatsApp number (optional, we can also email you)" className={input} />
              )}
            </fieldset>
          );
        })}
        <fieldset>
          <legend className="text-sm font-medium">Anything else you wish a tool did for your channel?</legend>
          <textarea rows={2} maxLength={1000} value={(a.other as string) ?? ""} onChange={(e) => setA({ ...a, other: e.target.value })} className={input} />
        </fieldset>
      </div>
      {error && <p className="mt-3 text-sm text-bad">{error}</p>}
      <div className="mt-4 flex justify-end">
        <Button onClick={send} disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send answers"}</Button>
      </div>
    </section>
  );
}
