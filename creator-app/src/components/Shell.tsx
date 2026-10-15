"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { DashboardProvider, useDashboard } from "./dashboard-context";
import { LEGAL_LINKS } from "./SiteFooter";
import { Logo, ThemeToggle } from "./ui";
import { LANGUAGES, type LanguageCode } from "@/lib/languages";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: "M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z" },
  { href: "/dashboard/doctor", label: "Video Doctor", icon: "M22 12h-4l-3 9L9 3l-3 9H2" },
  { href: "/dashboard/studio", label: "Title Studio", icon: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" },
  { href: "/dashboard/trends", label: "Trend Radar", icon: "M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M16.2 7.8a6 6 0 0 1 0 8.5M7.8 16.2a6 6 0 0 1 0-8.5M19.1 4.9a10 10 0 0 1 0 14.1M4.9 19.1a10 10 0 0 1 0-14.1" },
  { href: "/dashboard/comments", label: "Comments", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
  { href: "/dashboard/assistant", label: "Ask Mitra", icon: "M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2zM19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8z" },
  { href: "/dashboard/connections", label: "Connections", icon: "M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" },
  { href: "/dashboard/billing", label: "Plan & billing", icon: "M2 7h20v12H2zM2 11h20M6 15h4" },
];

function Icon({ d }: { d: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

function NavLinks({ compact }: { compact?: boolean }) {
  const path = usePathname();
  return (
    <>
      {NAV.map((item) => {
        const active = item.href === "/dashboard" ? path === item.href : path.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 text-sm transition ${
              active ? "bg-ink text-bg" : "text-ink-2 hover:bg-surface-2 hover:text-ink"
            } ${compact ? "py-2" : ""}`}
          >
            <Icon d={item.icon} />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

function AccountMenu() {
  const { me, reload } = useDashboard();
  const [open, setOpen] = useState(false);
  if (!me) return <div className="h-9 w-9 rounded-full bg-surface-2" />;
  if (!me.user) {
    return (
      <Link href="/login?next=/dashboard" className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-bg">
        Sign in
      </Link>
    );
  }
  const { user, plan, usage } = me;
  const initial = (user.name ?? user.email).slice(0, 1).toUpperCase();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    reload();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3 hover:bg-surface-2"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatar} alt="" className="h-7 w-7 rounded-full" />
        ) : (
          <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-xs font-bold text-accent-ink">{initial}</span>
        )}
        <span className="text-xs font-semibold">{plan?.name}</span>
      </button>
      {open && (
        <div role="menu" className="card absolute right-0 top-12 z-30 w-64 !p-4 shadow-xl">
          <p className="truncate text-sm font-semibold">{user.name ?? user.email}</p>
          <p className="truncate text-xs text-muted">{user.email}</p>
          {usage && (
            <div className="mt-4">
              <div className="flex justify-between text-xs">
                <span className="text-muted">AI credits this month</span>
                <span className="font-semibold tabular-nums">
                  {usage.used} / {usage.limit}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-surface-2">
                <div className="h-1.5 rounded-full bg-accent" style={{ width: `${Math.min(100, (usage.used / Math.max(1, usage.limit)) * 100)}%` }} />
              </div>
            </div>
          )}
          <Link href="/dashboard/billing" onClick={() => setOpen(false)} className="mt-4 block rounded-xl px-3 py-2 text-sm hover:bg-surface-2">
            Plan & billing
          </Link>
          <button onClick={signOut} className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-surface-2">
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function TopBar() {
  const { summary, language, setLanguage } = useDashboard();
  const live = summary?.mode === "live";
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-bg/85 px-4 py-3 backdrop-blur sm:px-8">
      <div className="lg:hidden">
        <Logo />
      </div>
      <div className="hidden min-w-0 items-center gap-3 lg:flex">
        {summary?.channel.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={summary.channel.avatar} alt="" className="h-9 w-9 rounded-full" />
        ) : (
          <div className="grid h-9 w-9 place-items-center rounded-full bg-accent-soft font-display text-lg text-accent">
            {summary?.channel.title.slice(0, 1) ?? "·"}
          </div>
        )}
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{summary?.channel.title ?? "Loading…"}</div>
          <div className="truncate text-xs text-muted">{summary?.channel.handle}</div>
        </div>
        {summary && (
          <span
            className={`ml-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              live ? "bg-good/15 text-good" : "bg-accent-soft text-accent"
            }`}
          >
            {live ? "● Live" : "Demo channel"}
          </span>
        )}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <label className="sr-only" htmlFor="lang">
          Output language
        </label>
        <select
          id="lang"
          value={language}
          onChange={(e) => setLanguage(e.target.value as LanguageCode)}
          className="rounded-full border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          title="Language Mitra writes in"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.native === l.label ? l.label : `${l.native} · ${l.label}`}
            </option>
          ))}
        </select>
        <ThemeToggle />
        <AccountMenu />
      </div>
    </header>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line px-4 py-6 lg:flex">
          <Logo className="px-3" />
          <nav className="mt-8 flex flex-col gap-1">
            <NavLinks />
          </nav>
          <div className="mt-auto rounded-2xl bg-ink p-4 text-bg">
            <p className="font-display text-xl leading-snug">Weekly report on WhatsApp</p>
            <p className="mt-1 text-xs opacity-70">Every Monday, your 3 biggest wins and fixes. Coming soon.</p>
          </div>
          <nav className="mt-4 flex flex-wrap gap-x-3 gap-y-1 px-3 text-[11px] text-muted" aria-label="Legal">
            {LEGAL_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-ink">
                {l.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <nav className="flex gap-1 overflow-x-auto border-b border-line px-4 py-2 lg:hidden">
            <NavLinks compact />
          </nav>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8">{children}</main>
        </div>
      </div>
    </DashboardProvider>
  );
}
