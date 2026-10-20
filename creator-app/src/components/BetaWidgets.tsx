"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { languageLabel } from "@/lib/languages";
import { rememberSource, track, trackDailySession } from "@/lib/track";
import type { EventName } from "@/lib/beta-event-names";
import { useStoredString } from "./hooks";
import { Button } from "./ui";

const NATURALNESS = [
  { value: "natural", label: "Sounds natural" },
  { value: "okay", label: "Understandable, a bit off" },
  { value: "translated", label: "Sounds translated" },
] as const;

const chip = (on: boolean) => `rounded-lg border px-3 py-1.5 text-sm ${on ? "border-accent bg-accent-soft font-medium text-accent" : "border-line hover:bg-surface-2"}`;

/**
 * "Was this useful? How does the Hindi/Kannada sound?" under each AI answer. Ratings (with the answer attached)
 * are what the native-speaker reviewers go through each week: docs/BETA.md.
 */
export function OutputFeedback({ feature, language, output }: { feature: "doctor" | "studio"; language: string; output: unknown }) {
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [natural, setNatural] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  if (sent) return <p className="text-sm text-muted">Thanks. This goes straight to the people checking Mitra&apos;s {languageLabel(language)}.</p>;
  return (
    <section className="card p-5" aria-label="Rate this answer">
      <p className="text-sm font-semibold">Was this useful?</p>
      <div className="mt-2 flex gap-2">
        {[true, false].map((v) => (
          <button key={String(v)} onClick={() => setHelpful(v)} aria-pressed={helpful === v} className={chip(helpful === v)}>
            {v ? "Yes" : "Not really"}
          </button>
        ))}
      </div>
      <p className="mt-4 text-sm font-semibold">How does the {languageLabel(language)} sound?</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {NATURALNESS.map((n) => (
          <button key={n.value} onClick={() => setNatural(n.value)} aria-pressed={natural === n.value} className={chip(natural === n.value)}>
            {n.label}
          </button>
        ))}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, 1000))}
        rows={2}
        placeholder="Anything wrong or unnatural? Paste the line and how you'd say it."
        className="mt-4 w-full rounded-lg border border-line bg-surface p-3 text-sm outline-none focus:border-accent"
      />
      <Button
        className="mt-3"
        disabled={helpful == null && natural == null}
        onClick={() => {
          track("output_feedback", { feature, language, helpful, natural, note: note.trim() || null, output });
          setSent(true);
        }}
      >
        Send feedback
      </Button>
    </section>
  );
}

const PRICE_QUESTIONS = [
  { key: "too_cheap", label: "So cheap you'd doubt it works" },
  { key: "cheap", label: "A bargain" },
  { key: "expensive", label: "Getting expensive, but you'd still pay" },
  { key: "too_expensive", label: "Too expensive, you wouldn't pay" },
] as const;

/**
 * Four price questions (Van Westendorp), shown only after a creator has used Video Doctor twice. No prices are
 * shown during the beta; this is how the price test runs. Answers are on the admin Beta page and export as CSV.
 */
export function PriceSurvey({ userId }: { userId: string }) {
  const [done, setDone] = useStoredString(`mitra-wtp-done:${userId}`, "");
  const [values, setValues] = useState<Record<string, string>>({});
  if (done) return null;
  const complete = PRICE_QUESTIONS.every((q) => Number(values[q.key]) > 0);
  return (
    <section className="card p-5" aria-label="Price survey">
      <p className="font-semibold">Mitra is free during the beta. Help us price it fairly?</p>
      <p className="mt-1 text-sm text-muted">If Mitra kept helping like this, what monthly price (₹) would be…</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {PRICE_QUESTIONS.map((q) => (
          <label key={q.key} className="flex flex-col gap-1 text-xs font-medium text-muted">
            {q.label}
            <span className="flex items-center gap-1 rounded-lg border border-line bg-surface px-3 py-2 focus-within:border-accent">
              <span className="text-ink-2">₹</span>
              <input
                inputMode="numeric"
                value={values[q.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [q.key]: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
                className="w-full bg-transparent text-sm text-ink outline-none"
                aria-label={`${q.label}, rupees per month`}
              />
            </span>
          </label>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <Button
          disabled={!complete}
          onClick={() => {
            track("wtp_survey", Object.fromEntries(PRICE_QUESTIONS.map((q) => [q.key, Number(values[q.key])])));
            setDone("1");
          }}
        >
          Send
        </Button>
        <Button variant="ghost" onClick={() => setDone("1")}>
          Skip
        </Button>
      </div>
    </section>
  );
}

/** Captures the first-touch source and logs a landing view. */
export function LandingTracker() {
  useEffect(() => {
    rememberSource();
    track("landing_view");
  }, []);
  return null;
}

/** Records the source (if this is the first visit) and one session a day, for the beta's retention numbers. */
export function SessionTracker({ signedIn }: { signedIn: boolean }) {
  useEffect(() => {
    if (!signedIn) return;
    rememberSource();
    trackDailySession();
  }, [signedIn]);
  return null;
}

/** A link that logs an event when clicked. */
export function TrackedLink({ event, props, ...link }: React.ComponentProps<typeof Link> & { event: EventName; props?: Record<string, unknown> }) {
  return <Link {...link} onClick={() => track(event, props)} />;
}
