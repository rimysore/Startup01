import Link from "next/link";
import { COMPANY } from "@/lib/company";
import { Logo } from "./ui";

export const LEGAL_LINKS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/refunds", label: "Refunds & cancellation" },
  { href: "/contact", label: "Contact" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-8 text-sm text-muted sm:px-8">
        <Logo />
        <span>Made for Bharat&apos;s creators.</span>
        <a href={`mailto:${COMPANY.supportEmail}`} className="hover:text-ink">{COMPANY.supportEmail}</a>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 sm:ml-auto" aria-label="Legal">
          {LEGAL_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
        <span className="w-full text-xs sm:w-auto">© 2026 {COMPANY.legalName.startsWith("[") ? COMPANY.product : COMPANY.legalName}</span>
      </div>
    </footer>
  );
}
