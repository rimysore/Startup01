import Link from "next/link";
import { COMPANY, LEGAL_EFFECTIVE_DATE, hasPlaceholders } from "@/lib/company";
import { LEGAL_LINKS, SiteFooter } from "./SiteFooter";
import { Logo, ThemeToggle } from "./ui";

export interface LegalSection {
  id: string;
  title: string;
  body: React.ReactNode;
}

/** Shared frame for Terms, Privacy, Refunds and Contact: header, summary, table of contents, sections. */
export function LegalPage({
  eyebrow,
  title,
  summary,
  sections,
  current,
}: {
  eyebrow: string;
  title: string;
  summary: React.ReactNode;
  sections: LegalSection[];
  current: string;
}) {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-5 sm:px-8">
        <Logo />
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Link href="/dashboard" className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-bg">
            Open dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-8">
        {hasPlaceholders() && (
          <p className="mb-8 rounded-xl border border-dashed border-warn/60 bg-warn/10 px-4 py-3 text-sm text-ink">
            <strong className="text-warn">Draft:</strong> company details in [brackets] still need to be filled in
            (src/lib/company.ts), and this document should be reviewed by a lawyer before launch.
          </p>
        )}
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
        <h1 className="mt-2 font-display text-5xl leading-tight sm:text-6xl">{title}</h1>
        <p className="mt-3 text-sm text-muted">Effective {LEGAL_EFFECTIVE_DATE}</p>

        <div className="mt-10 grid gap-12 lg:grid-cols-[220px_1fr]">
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <nav aria-label="Legal pages" className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
              {LEGAL_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={l.href === current ? "page" : undefined}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    l.href === current ? "bg-ink text-bg" : "text-ink-2 hover:bg-surface-2 hover:text-ink"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            {sections.length > 2 && (
              <nav aria-label="On this page" className="mt-8 hidden lg:block">
                <p className="px-4 text-xs font-semibold uppercase tracking-wider text-muted">On this page</p>
                <ol className="mt-2 space-y-1">
                  {sections.map((s, i) => (
                    <li key={s.id}>
                      <a href={`#${s.id}`} className="block rounded-lg px-4 py-1 text-xs text-ink-2 hover:text-ink">
                        {i + 1}. {s.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}
          </aside>

          <article className="min-w-0 max-w-3xl">
            <div className="card grain p-6 text-[15px] leading-relaxed sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">In short</p>
              <div className="mt-3 space-y-2 text-ink">{summary}</div>
            </div>
            <div className="mt-10 space-y-12">
              {sections.map((s, i) => (
                <section key={s.id} id={s.id} className="scroll-mt-8">
                  <h2 className="font-display text-3xl">
                    <span className="mr-2 text-accent">{i + 1}.</span>
                    {s.title}
                  </h2>
                  <div className="legal-body mt-4 space-y-4 text-[15px] leading-relaxed text-ink-2">{s.body}</div>
                </section>
              ))}
            </div>
            <p className="mt-16 border-t border-line pt-6 text-sm text-muted">
              Questions? Write to <a className="font-medium text-ink underline underline-offset-2" href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a> or see{" "}
              <Link href="/contact" className="font-medium text-ink underline underline-offset-2">Contact</Link>.
            </p>
          </article>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

/** A plain external link with consistent styling. */
export function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-ink underline underline-offset-2">
      {children}
    </a>
  );
}
