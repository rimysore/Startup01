"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { COMPANY } from "@/lib/company";

const KINDS = [
  { id: "bug", label: "Something's broken" },
  { id: "idea", label: "An idea" },
  { id: "question", label: "A question" },
] as const;
type Kind = (typeof KINDS)[number]["id"];

/**
 * "Help & feedback": a short form that lands in the support inbox with the page and account attached, so testers
 * never have to explain where they were. Falls back to plain email when sending isn't set up.
 */
export function FeedbackButton({ className, children }: { className: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className={className} aria-haspopup="dialog">
        {children}
      </button>
      {open && createPortal(<FeedbackDialog onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

function FeedbackDialog({ onClose }: { onClose: () => void }) {
  const page = usePathname();
  const [kind, setKind] = useState<Kind>("bug");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function send() {
    setState("sending");
    setError(null);
    const r = await fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, message, page }) }).catch(() => null);
    const d = (await r?.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    if (r?.ok && d?.ok) return setState("sent");
    setState("idle");
    if (r?.status === 503) setFallback(true);
    else setError(d?.error ?? "Couldn't send right now. Check your connection and try again.");
  }

  const mailto = `mailto:${COMPANY.supportEmail}?subject=${encodeURIComponent(`Mitra: ${KINDS.find((k) => k.id === kind)!.label}`)}&body=${encodeURIComponent(`${message}\n\n(Page: ${page})`)}`;
  return (
    <div className="app fade-in fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Help and feedback" onClick={onClose}>
      <div className="card modal-in w-full max-w-md p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Help &amp; feedback</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-xl hover:bg-surface-2" aria-label="Close">
            ×
          </button>
        </div>
        {state === "sent" ? (
          <div className="py-6 text-center">
            <p className="font-semibold">Thanks, got it.</p>
            <p className="mt-1 text-sm text-muted">The founder reads every message and replies by email, usually within a day.</p>
            <button onClick={onClose} className="mt-5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink">
              Done
            </button>
          </div>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted">Goes straight to the founder. We attach this page and your account so you don&apos;t have to explain.</p>
            <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="What is it about?">
              {KINDS.map((k) => (
                <button
                  key={k.id}
                  onClick={() => setKind(k.id)}
                  aria-pressed={kind === k.id}
                  className={`rounded-lg border px-3 py-1.5 text-sm ${kind === k.id ? "border-accent bg-accent-soft font-medium text-accent" : "border-line hover:bg-surface-2"}`}
                >
                  {k.label}
                </button>
              ))}
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              maxLength={4000}
              autoFocus
              placeholder={kind === "bug" ? "What happened, and what did you expect?" : kind === "idea" ? "What would make Mitra more useful for you?" : "Ask anything about Mitra."}
              className="mt-3 w-full resize-y rounded-lg border border-line bg-surface p-3 text-sm outline-none focus:border-accent"
            />
            {error && <p className="mt-2 text-sm text-bad">{error}</p>}
            {fallback && (
              <p className="mt-2 rounded-lg bg-surface-2 p-3 text-sm text-ink-2">
                Sending from here isn&apos;t available right now.{" "}
                <a href={mailto} className="font-semibold text-accent underline">
                  Email {COMPANY.supportEmail}
                </a>{" "}
                instead; your message is filled in.
              </p>
            )}
            <div className="mt-4 flex items-center justify-between gap-3">
              <a href={`mailto:${COMPANY.supportEmail}`} className="text-xs text-muted hover:text-ink">
                {COMPANY.supportEmail}
              </a>
              <button
                onClick={send}
                disabled={state === "sending" || message.trim().length < 3}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:brightness-105 disabled:opacity-50"
              >
                {state === "sending" ? "Sending…" : "Send"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
