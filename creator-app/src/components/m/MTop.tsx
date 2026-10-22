import Link from "next/link";
import { Logo, ThemeToggle } from "@/components/ui";
import type { Strings } from "@/lib/marketplace/i18n";
import { LangSwitch, SignOut } from "./client";

type Tab = "home" | "kit" | "autodm" | "inbox" | "offers" | "deals" | "business" | "briefs" | "track";

/** The marketplace top bar: the logo, this side's pages, the language switch and the account links. */
export function MTop({ s, role, lang, active }: { s: Strings; role: string | null; lang: string; active?: Tab }) {
  const tabs: { id: Tab; href: string; label: string }[] =
    role === "creator"
      ? [
          { id: "home", href: "/m", label: s.nav.home },
          { id: "kit", href: "/m/kit", label: s.nav.kit },
          { id: "autodm", href: "/m/autodm", label: s.nav.autodm },
          { id: "inbox", href: "/m/inbox", label: s.nav.inbox },
          { id: "deals", href: "/m/deals", label: s.nav.deals },
        ]
      : role
        ? [
            { id: "home", href: "/m", label: s.nav.home },
            { id: "track", href: "/m/track", label: s.nav.track },
            { id: "briefs", href: "/m/briefs/new", label: s.nav.briefs },
            { id: "business", href: "/m/business", label: s.nav.business },
          ]
        : [];
  return (
    <header className="mk-top">
      <div className="lp-wrap mk-top__in">
        <span className="flex items-center gap-2">
          <Logo />
          <span className="lp-beta">Beta</span>
        </span>
        {tabs.length > 0 && (
          <nav className="mk-tabs" aria-label="Marketplace">
            {tabs.map((t) => (
              <Link key={t.id} href={t.href} aria-current={t.id === active ? "page" : undefined}>
                {t.label}
              </Link>
            ))}
          </nav>
        )}
        <div className="mk-top__end">
          <LangSwitch lang={lang} canSave={Boolean(role)} />
          <ThemeToggle />
          <SignOut label={s.nav.signOut} />
        </div>
      </div>
    </header>
  );
}
