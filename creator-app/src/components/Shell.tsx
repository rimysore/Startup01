"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { DashboardProvider, useDashboard } from "./dashboard-context";
import { LEGAL_LINKS } from "./SiteFooter";
import { AssistantWidget } from "./Assistant";
import { LanguageButton, LanguageOnboarding } from "./language-picker";
import { Logo, ThemeToggle } from "./ui";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: "M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z" },
  { href: "/dashboard/doctor", label: "Video Doctor", icon: "M22 12h-4l-3 9L9 3l-3 9H2" },
  { href: "/dashboard/studio", label: "Title Studio", icon: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" },
  { href: "/dashboard/trends", label: "Trend Radar", icon: "M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M16.2 7.8a6 6 0 0 1 0 8.5M7.8 16.2a6 6 0 0 1 0-8.5M19.1 4.9a10 10 0 0 1 0 14.1M4.9 19.1a10 10 0 0 1 0-14.1" },
  { href: "/dashboard/ideas", label: "Breakout ideas", icon: "M13 2L3 14h9l-1 8 10-12h-9z" },
  { href: "/dashboard/audience", label: "Audience", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" },
  { href: "/dashboard/competitors", label: "Competitors", icon: "M3 3v18h18M7 15l4-4 3 3 5-6" },
  { href: "/dashboard/comments", label: "Comments", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
  { href: "/dashboard/whatsapp", label: "WhatsApp & reports", icon: "M3 21l1.7-5A8.5 8.5 0 1 1 8 19.3zM9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1a4 4 0 0 1-2-2l1-1-1-2z" },
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

const ADMIN_NAV = [
  { href: "/dashboard/admin", label: "AI costs", hint: "Spend, calls and errors by feature", icon: "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
  { href: "/dashboard/prospects", label: "Find creators", hint: "Search channels and write outreach", icon: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35" },
  { href: "/dashboard/waitlist", label: "Waitlist", hint: "Invite creators to the private beta", icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M19 8v6M22 11h-6" },
];
const ADMIN_ICON = "M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z";

const navItem = (active: boolean) =>
  `flex w-full shrink-0 items-center gap-3 rounded-full px-4 py-2 text-sm transition ${active ? "bg-ink text-bg" : "text-ink-2 hover:bg-surface-2 hover:text-ink"}`;

/**
 * The admin pages in one place: a single "Admin" entry opens this panel instead of three more sidebar rows.
 * Fades and scales in; Esc, the backdrop or a choice closes it (with the same animation in reverse).
 */
function AdminPanel({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  const [state, setState] = useState<"closed" | "open" | "closing">("closed");
  const active = ADMIN_NAV.some((a) => path.startsWith(a.href));
  const close = () => {
    setState("closing");
    setTimeout(() => setState("closed"), 180);
  };
  useEffect(() => {
    if (state !== "open") return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state]);
  return (
    <>
      <button onClick={() => setState("open")} className={navItem(active)} aria-haspopup="dialog">
        <Icon d={ADMIN_ICON} />
        Admin
        <span className="ml-auto rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent">{ADMIN_NAV.length}</span>
      </button>
      {state !== "closed" &&
        // Rendered at the page root: inside the phone "More" sheet, its animation would trap a fixed overlay.
        createPortal(
        <div
          className={`fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm ${state === "closing" ? "fade-out" : "fade-in"}`}
          role="dialog"
          aria-modal="true"
          aria-label="Admin"
          onClick={close}
        >
          <div className={`card w-full max-w-md !p-5 shadow-2xl ${state === "closing" ? "modal-out" : "modal-in"}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 font-display text-2xl">
                <Icon d={ADMIN_ICON} /> Admin
              </p>
              <button onClick={close} className="grid h-9 w-9 place-items-center rounded-full text-xl hover:bg-surface-2" aria-label="Close">
                ×
              </button>
            </div>
            <ul className="mt-4 grid gap-2">
              {ADMIN_NAV.map((a) => {
                const on = path.startsWith(a.href);
                return (
                  <li key={a.href}>
                    <Link
                      href={a.href}
                      onClick={() => {
                        close();
                        onNavigate?.();
                      }}
                      className={`flex items-center gap-3 rounded-2xl border p-3 transition hover:-translate-y-0.5 ${on ? "border-accent bg-accent-soft" : "border-line hover:bg-surface-2"}`}
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-2">
                        <Icon d={a.icon} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{a.label}</span>
                        <span className="block truncate text-xs text-muted">{a.hint}</span>
                      </span>
                      <span className="ml-auto text-muted" aria-hidden>
                        →
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  const { me } = useDashboard();
  return (
    <>
      {NAV.map((item) => {
        const active = item.href === "/dashboard" ? path === item.href : path.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} onClick={onNavigate} className={navItem(active)} aria-current={active ? "page" : undefined}>
            <Icon d={item.icon} />
            {item.label}
          </Link>
        );
      })}
      {me?.admin && <AdminPanel onNavigate={onNavigate} />}
    </>
  );
}

function AccountMenu() {
  const { me } = useDashboard();
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
    // Drop everything this account left in the tab (chats, page state) before anyone else signs in.
    try {
      for (const k of Object.keys(sessionStorage)) if (k.startsWith("mitra-chat")) sessionStorage.removeItem(k);
    } catch {}
    // A full page load (not router.push) so no page keeps the last account's data in memory.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/");
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
          <div className="flex items-center justify-between rounded-xl px-3 py-1 text-sm sm:hidden">
            Dark mode <ThemeToggle />
          </div>
          <button onClick={signOut} className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-surface-2">
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

/** The things creators use most, under the thumb. Everything else is one tap away in "More". */
const icon = (href: string) => NAV.find((n) => n.href === href)!.icon;
const TABS = [
  { href: "/dashboard", label: "Home", icon: icon("/dashboard") },
  { href: "/dashboard/doctor", label: "Videos", icon: icon("/dashboard/doctor") },
  { href: "/dashboard/studio", label: "Titles", icon: icon("/dashboard/studio") },
  { href: "/dashboard/whatsapp", label: "WhatsApp", icon: icon("/dashboard/whatsapp") },
];

function BottomTabs() {
  const path = usePathname();
  const [more, setMore] = useState(false);
  const isActive = (href: string) => (href === "/dashboard" ? path === href : path.startsWith(href));
  const inTabs = TABS.some((t) => isActive(t.href));
  const tab = (active: boolean) => `flex flex-col items-center gap-1 py-2 text-[11px] font-semibold ${active ? "text-accent" : "text-muted"}`;
  const pill = (active: boolean) => `grid h-8 w-12 place-items-center rounded-full ${active ? "bg-accent-soft" : ""}`;
  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Main">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {TABS.map((t) => (
            <Link key={t.href} href={t.href} className={tab(isActive(t.href))} aria-current={isActive(t.href) ? "page" : undefined}>
              <span className={pill(isActive(t.href))}>
                <Icon d={t.icon} />
              </span>
              {t.label}
            </Link>
          ))}
          <button onClick={() => setMore(true)} className={tab(!inTabs)} aria-haspopup="dialog">
            <span className={pill(!inTabs)}>
              <Icon d="M4 6h16M4 12h16M4 18h16" />
            </span>
            More
          </button>
        </div>
      </nav>
      {more && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/50 lg:hidden" role="dialog" aria-modal="true" aria-label="All pages" onClick={() => setMore(false)}>
          <div className="toast-in max-h-[85dvh] w-full overflow-y-auto rounded-t-[28px] bg-bg p-4 pb-[max(1rem,env(safe-area-inset-bottom))]" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-line" aria-hidden />
            <nav className="grid gap-1">
              <NavLinks onNavigate={() => setMore(false)} />
            </nav>
            <nav className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-line px-4 pt-3 text-xs text-muted" aria-label="Legal">
              {LEGAL_LINKS.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setMore(false)}>
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

/** Pages a signed-in creator can use before connecting YouTube. Everything else needs their real channel. */
const OPEN_PATHS = ["/dashboard/connections", "/dashboard/billing"];

/**
 * No demo channel inside the app: signed-out visitors are asked to sign in, and signed-in creators connect YouTube
 * first (right after picking their language), so nobody mistakes sample numbers for their own.
 */
function ChannelGate({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { me } = useDashboard();
  if (!me) return <div className="h-64 animate-pulse rounded-3xl bg-surface-2" aria-label="Loading" />;
  const open = OPEN_PATHS.some((p) => path.startsWith(p)) || (me.admin && ADMIN_NAV.some((a) => path.startsWith(a.href)));
  if (me.user && ((me.youtube && !me.youtube.needsReconnect) || open)) return <>{children}</>;

  const signedIn = Boolean(me.user);
  const reconnect = Boolean(me.youtube?.needsReconnect);
  return (
    <div className="mx-auto max-w-xl py-6 text-center sm:py-12">
      <span className="bg-brand mx-auto grid h-16 w-16 place-items-center rounded-2xl text-white">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.7 15.1V8.9l5.8 3.1z" />
        </svg>
      </span>
      <h1 className="mt-5 font-display text-3xl sm:text-4xl">
        {!signedIn ? "Sign in to see your channel" : reconnect ? "Reconnect your YouTube channel" : "Connect your YouTube channel"}
      </h1>
      <p className="mt-3 text-ink-2">
        {!signedIn
          ? "Mitra works on your own YouTube numbers. Sign in with the Google account that owns your channel."
          : reconnect
            ? "Google stopped sharing your channel with Mitra. Connect again to see your latest numbers."
            : "Everything in Mitra is built from your own channel: how each video did, what to post next, your Monday report. It takes one minute."}
      </p>
      {signedIn && (
        <ul className="mx-auto mt-5 max-w-sm space-y-1.5 text-left text-sm text-ink-2">
          <li>🔒 Read-only: Mitra can never upload, edit or delete anything</li>
          <li>👤 Only you see your data</li>
          <li>↩️ Disconnect any time in Connections</li>
        </ul>
      )}
      <a
        href={signedIn ? "/api/auth/youtube/start" : `/login?next=${encodeURIComponent(path)}`}
        className="bg-brand mt-7 inline-block rounded-full px-7 py-3.5 font-bold text-white transition hover:-translate-y-0.5"
      >
        {!signedIn ? "Sign in with Google" : reconnect ? "Reconnect YouTube" : "Connect YouTube"}
      </a>
      {signedIn && process.env.NEXT_PUBLIC_GOOGLE_VERIFIED !== "1" && (
        <p className="mx-auto mt-5 max-w-sm rounded-xl bg-surface-2 p-3 text-xs text-ink-2">
          If Google says it hasn&apos;t verified this app, tap <b>Advanced</b>, then <b>Go to trymitraapp.com</b>. Google is still reviewing Mitra.
        </p>
      )}
    </div>
  );
}

function TopBar() {
  const { summary: loaded, me } = useDashboard();
  // Sample numbers never show as someone's channel.
  const summary = loaded?.mode === "live" && me?.youtube ? loaded : null;
  const live = Boolean(summary);
  return (
    <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-line bg-bg/85 px-3 py-2.5 backdrop-blur sm:gap-3 sm:px-8 sm:py-3">
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
          <div className="truncate text-sm font-semibold">{summary?.channel.title ?? (me?.user ? me.youtube?.channelTitle ?? "No channel connected" : "Mitra")}</div>
          <div className="truncate text-xs text-muted">{summary?.channel.handle}</div>
        </div>
        {live && <span className="ml-1 rounded-full bg-good/15 px-2.5 py-1 text-[11px] font-semibold text-good">● Live</span>}
      </div>
      <div className="ml-auto flex min-w-0 items-center gap-2">
        <LanguageButton />
        <span className="hidden sm:block">
          <ThemeToggle />
        </span>
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
          {/* Scrolls on short screens so nothing below is ever cut off. */}
          <nav className="-mx-1 mt-6 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-1 pb-2">
            <NavLinks />
          </nav>
          <Link href="/dashboard/whatsapp" className="mt-3 block shrink-0 rounded-2xl bg-ink px-4 py-3 text-bg transition hover:-translate-y-0.5">
            <p className="font-display text-lg leading-snug">Your report on WhatsApp</p>
            <p className="mt-0.5 text-xs font-semibold text-[#25D366]">Every Monday · Connect →</p>
          </Link>
          <nav className="mt-3 flex shrink-0 flex-wrap gap-x-3 gap-y-1 px-3 text-[11px] text-muted" aria-label="Legal">
            {LEGAL_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-ink">
                {l.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 sm:px-8 sm:py-8 lg:pb-8">
            <ChannelGate>{children}</ChannelGate>
          </main>
          <BottomTabs />
          <AssistantWidget />
          <LanguageOnboarding />
        </div>
      </div>
    </DashboardProvider>
  );
}
