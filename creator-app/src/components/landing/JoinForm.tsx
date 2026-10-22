"use client";

import { useState } from "react";
import { MARKETPLACE } from "@/lib/marketplace/flag";
import { useAudience } from "./audience";
import { Arrow } from "./Hero";

const ROLES = [
  {
    id: "creator",
    label: "Creator",
    handle: "Your Instagram handle",
    ph: "@yourhandle",
  },
  {
    id: "business",
    label: "Business",
    handle: "Business name",
    ph: "e.g. a café in Jayanagar",
  },
  { id: "brand", label: "Brand", handle: "Brand name", ph: "Your brand" },
  { id: "agency", label: "Agency", handle: "Agency name", ph: "Your agency" },
] as const;
type Role = (typeof ROLES)[number]["id"];

/**
 * Early access for the marketplace pilot. Uses the existing waitlist (role in `source`, handle and area in
 * `channel`), so no new table is needed until the marketplace data model lands.
 */
export function JoinForm({ contactEmail }: { contactEmail: string }) {
  const audience = useAudience();
  // Follows the hero's switch until the visitor picks a role here.
  const [picked, setRole] = useState<Role | null>(null);
  const role: Role =
    picked ?? (audience === "business" ? "business" : "creator");
  const [f, setF] = useState({
    name: "",
    email: "",
    handle: "",
    area: "",
    language: "kn",
    consent: false,
    website: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const r = ROLES.find((x) => x.id === role)!;
  const set =
    (k: keyof typeof f) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setF({
        ...f,
        [k]:
          e.target.type === "checkbox"
            ? (e.target as HTMLInputElement).checked
            : e.target.value,
      });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!f.consent)
      return setError("Please tick the box so we can contact you.");
    setBusy(true);
    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: f.email,
        name: f.name || undefined,
        channel: [f.handle, f.area].filter(Boolean).join(" · ") || undefined,
        language: f.language,
        consent: true,
        website: f.website,
        source: `mkt-${role}`,
      }),
    }).catch(() => null);
    const d = (await res?.json().catch(() => null)) as {
      position?: number;
      error?: string;
    } | null;
    setBusy(false);
    if (!res?.ok || !d?.position)
      return setError(d?.error ?? "Couldn't save that. Please try again.");
    setDone(true);
  }

  if (done)
    return (
      <div className="lp-card lp-form" role="status">
        <p className="lp-h2" style={{ fontSize: 40 }}>
          You&apos;re on the list.
        </p>
        <p className="lp-lead">
          We&apos;ll write to you from {contactEmail} when the Bengaluru pilot
          opens for {role === "creator" ? "creators" : "businesses"} in your
          area.
        </p>
        {MARKETPLACE && (
          <p className="lp-lead mt-4">
            Want to look around now?{" "}
            <a
              href={`/m/start?role=${role}`}
              className="lp-link font-semibold underline"
            >
              Create your free account
            </a>
            {role === "creator"
              ? ": check offers and see open brand and affiliate programs."
              : "."}
          </p>
        )}
      </div>
    );

  return (
    <form className="lp-card lp-form" onSubmit={submit} noValidate>
      <div>
        <p className="mb-2 text-[14px] font-semibold">I&apos;m joining as</p>
        <div className="lp-roles" role="group" aria-label="I'm joining as">
          {ROLES.map((x) => (
            <button
              key={x.id}
              type="button"
              aria-pressed={role === x.id}
              onClick={() => setRole(x.id)}
            >
              {x.label}
            </button>
          ))}
        </div>
      </div>
      {MARKETPLACE && role !== "creator" ? (
        <div className="grid gap-3">
          <p className="lp-lead">
            {role === "business"
              ? "Businesses"
              : role === "brand"
                ? "Brands"
                : "Agencies"}{" "}
            can start now: sign in with Google, add your details, and track your
            next creator post for free.
          </p>
          <a
            href={`/m/start?role=${role}`}
            className="lp-btn justify-self-start"
          >
            Sign up as a {role} <Arrow />
          </a>
          <p className="lp-label">
            Already have an account?{" "}
            <a href="/login?next=/m" className="lp-link underline">
              Sign in
            </a>
          </p>
        </div>
      ) : (
        <>
          <div className="lp-form__two">
            <label>
              Your name
              <input
                value={f.name}
                onChange={set("name")}
                autoComplete="name"
                maxLength={80}
              />
            </label>
            <label>
              Email *
              <input
                type="email"
                required
                value={f.email}
                onChange={set("email")}
                autoComplete="email"
                placeholder="you@gmail.com"
                maxLength={200}
              />
            </label>
          </div>
          <label>
            {r.handle}
            <input
              value={f.handle}
              onChange={set("handle")}
              placeholder={r.ph}
              maxLength={120}
            />
          </label>
          <div className="lp-form__two">
            <label>
              Area in Bengaluru
              <input
                value={f.area}
                onChange={set("area")}
                placeholder="e.g. Jayanagar"
                maxLength={60}
              />
            </label>
            <label>
              Language
              <select value={f.language} onChange={set("language")}>
                <option value="kn">ಕನ್ನಡ · Kannada</option>
                <option value="en">English</option>
              </select>
            </label>
          </div>
          {/* Honeypot: hidden from people, filled by bots. */}
          <input
            type="text"
            name="website"
            value={f.website}
            onChange={set("website")}
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden
          />
          <label className="lp-consent">
            <input
              type="checkbox"
              checked={f.consent}
              onChange={set("consent")}
            />
            <span>
              Mitra may email me about the Bengaluru pilot. See the{" "}
              <a href="/privacy" className="lp-link underline">
                Privacy Policy
              </a>
              .
            </span>
          </label>
          {error && (
            <p
              role="alert"
              className="text-[15px]"
              style={{ color: "var(--miss)" }}
            >
              {error}
            </p>
          )}
          <button type="submit" className="lp-btn" disabled={busy}>
            {busy ? "Saving…" : "Join the pilot"} {!busy && <Arrow />}
          </button>
        </>
      )}
    </form>
  );
}
