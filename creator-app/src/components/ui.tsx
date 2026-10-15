"use client";

import Link from "next/link";
import { useTheme } from "./hooks";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`} aria-label="Mitra home">
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
        <circle cx="16" cy="16" r="15" fill="var(--accent)" />
        <path d="M9 21V11l7 7 7-7v10" fill="none" stroke="var(--accent-ink)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="font-display text-2xl leading-none tracking-tight">Mitra</span>
    </Link>
  );
}

export function ThemeToggle() {
  const theme = useTheme();
  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("mitra-theme", next);
    } catch {}
  }
  return (
    <button
      onClick={toggle}
      className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink-2 transition hover:bg-surface-2 hover:text-ink"
      aria-label="Toggle dark mode"
    >
      {theme === "dark" ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`card p-5 sm:p-6 ${className}`}>{children}</section>;
}

export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
        <h1 className="mt-1 font-display text-4xl leading-tight sm:text-5xl">{title}</h1>
      </div>
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }) {
  const styles =
    variant === "primary"
      ? "bg-accent text-accent-ink hover:brightness-105"
      : "border border-line text-ink hover:bg-surface-2";
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-accent" />
      {label}
    </span>
  );
}

export function DemoNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-line bg-surface-2/60 px-3 py-2 text-xs text-ink-2">
      <span className="mr-1 font-semibold text-accent">Sample</span>
      {children}
    </p>
  );
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-bad/40 px-3 py-2 text-sm text-bad">{children}</p>;
}

export function Select({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  label: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-muted">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Explains why an AI answer is a sample, with the next step to get a real one. */
export function AiDemoNote({ reason, what }: { reason?: "signin" | "nokey"; what: string }) {
  return (
    <DemoNote>
      {reason === "signin" ? (
        <>
          This is a sample {what}.{" "}
          <Link href="/login?next=/dashboard" className="font-semibold underline underline-offset-2">
            Sign in free
          </Link>{" "}
          to get a real one.
        </>
      ) : (
        <>This is a sample {what}. Add an Anthropic API key on the server to get real answers.</>
      )}
    </DemoNote>
  );
}

export function AiErrorNote({ error }: { error: { message: string; upgrade?: boolean; signin?: boolean } }) {
  return (
    <ErrorNote>
      {error.message}{" "}
      {error.upgrade && (
        <Link href="/dashboard/billing" className="font-semibold underline underline-offset-2">
          Upgrade your plan →
        </Link>
      )}
      {error.signin && (
        <Link href="/login?next=/dashboard" className="font-semibold underline underline-offset-2">
          Sign in →
        </Link>
      )}
    </ErrorNote>
  );
}
