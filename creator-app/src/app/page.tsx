import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { Logo, ThemeToggle } from "@/components/ui";
import { LANGUAGES } from "@/lib/languages";
import { PLANS, rupees } from "@/lib/plans";

const FEATURES = [
  { title: "Video Doctor", body: "See exactly where viewers left and why — then get three fixes for your next upload.", tag: "Retention" },
  { title: "Title & Thumbnail Studio", body: "Titles in Hinglish or your language, plus thumbnails where Hindi and Telugu text actually render right.", tag: "Packaging" },
  { title: "Trend Radar", body: "What's rising in Telugu tech, Bhojpuri comedy or Marathi food — before it peaks.", tag: "Ideas" },
  { title: "Comment Insights", body: "Thousands of mixed-language comments turned into requests, questions and reply drafts.", tag: "Audience" },
  { title: "Ask Mitra", body: "A manager who knows your numbers. Ask anything, in any language, any time.", tag: "Assistant" },
  { title: "WhatsApp Reports", body: "Every Monday: your 3 wins, 3 fixes and what to post this week.", tag: "Coming soon" },
];

const PRICING = [
  ...Object.values(PLANS).map((p) => ({
    name: p.name,
    price: rupees(p.pricePaise),
    per: p.pricePaise ? "/month" : "",
    points: p.points,
    cta: p.id === "free" ? "Start free" : `Get ${p.name}`,
    href: p.id === "free" ? "/login?next=/dashboard" : `/dashboard/billing?plan=${p.id}`,
    featured: p.id === "pro",
  })),
  {
    name: "Agency",
    price: "₹9,999",
    per: "/month",
    points: ["Up to 25 channels", "Team seats", "Client-ready reports", "API access"],
    cta: "Talk to us",
    href: "mailto:hello@mitracreators.com?subject=Mitra%20Agency%20plan",
    featured: false,
  },
];

function HeroPreview() {
  const pts = Array.from({ length: 41 }, (_, i) => {
    const t = i / 40;
    const w = (1 - 0.3 * Math.min(1, t / 0.1)) * Math.exp(-0.8 * t) - 0.07 * Math.exp(-((t - 0.42) ** 2) / 0.003) + 0.05 * Math.exp(-((t - 0.72) ** 2) / 0.001);
    return [16 + t * 328, 20 + (1 - w) * 130] as const;
  });
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("");
  return (
    <div className="relative">
      <div className="card rotate-[1.5deg] p-5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between text-xs text-muted">
          <span className="font-semibold text-ink">Video Doctor</span>
          <span>₹15,000 में Best Phone? 5 Phones Tested</span>
        </div>
        <svg viewBox="0 0 360 170" className="mt-3 w-full" role="img" aria-label="Example retention curve with a drop at 4:12">
          {[50, 90, 130].map((y) => (
            <line key={y} x1="16" x2="344" y1={y} y2={y} stroke="var(--chart-grid)" />
          ))}
          <path d={`${d}L344,150L16,150Z`} fill="var(--accent)" opacity="0.12" />
          <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx={pts[17][0]} cy={pts[17][1]} r="6" fill="var(--bad)" stroke="var(--surface)" strokeWidth="2" />
          <text x={pts[17][0]} y={pts[17][1] - 12} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--ink)">4:12</text>
          <circle cx={pts[29][0]} cy={pts[29][1]} r="6" fill="var(--good)" stroke="var(--surface)" strokeWidth="2" />
        </svg>
        <div className="mt-3 rounded-2xl rounded-bl-md bg-surface-2 p-4 text-sm leading-relaxed">
          <span className="font-semibold text-accent">Mitra: </span>
          4:12 pe sponsor segment bina transition ke aaya — 18% log wahin chale gaye. Sponsor ko 60% ke baad le jao.
        </div>
      </div>
      <div className="card absolute -left-6 -top-6 hidden rotate-[-4deg] px-4 py-3 sm:block">
        <p className="text-[11px] uppercase tracking-wider text-muted">Health score</p>
        <p className="font-display text-4xl text-good">71</p>
      </div>
      <div className="absolute -bottom-6 -right-3 rotate-[3deg] rounded-full bg-ink px-4 py-2 font-indic text-sm font-semibold text-bg shadow-lg">
        तेलुगु · हिन्दी · Hinglish
      </div>
    </div>
  );
}

export default function Home() {
  const marquee = [...LANGUAGES, ...LANGUAGES];
  return (
    <div className="overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-5 sm:px-8">
        <Logo />
        <nav className="ml-6 hidden gap-6 text-sm text-ink-2 md:flex">
          <a href="#features" className="hover:text-ink">Features</a>
          <a href="#languages" className="hover:text-ink">Languages</a>
          <a href="#pricing" className="hover:text-ink">Pricing</a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className="hidden rounded-full px-4 py-2.5 text-sm font-semibold hover:bg-surface-2 sm:block">
            Sign in
          </Link>
          <Link href="/dashboard" className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-bg">
            Open dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-10 sm:px-8 lg:grid-cols-[1.15fr_1fr] lg:pt-16">
        <div className="rise">
          <p className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> For creators who don&apos;t make videos in English
          </p>
          <h1 className="mt-6 font-display text-6xl leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
            Your channel&apos;s manager.
            <br />
            <em className="text-accent">Speaks your language.</em>
          </h1>
          <p className="mt-4 font-indic text-xl text-ink-2">आपके चैनल का अपना मैनेजर — मित्र।</p>
          <p className="mt-6 max-w-xl text-lg text-ink-2">
            Mitra connects to your YouTube, reads your retention, titles and comments, and tells you — in Hindi, Hinglish,
            Telugu, Tamil and more — exactly what to fix and what to post next.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard" className="rounded-full bg-accent px-6 py-3.5 text-base font-semibold text-accent-ink shadow-[0_10px_30px_-10px_var(--accent)] transition hover:brightness-105">
              Try the live demo →
            </Link>
            <Link href="/dashboard/connections" className="rounded-full border border-line px-6 py-3.5 text-base font-semibold hover:bg-surface-2">
              Connect YouTube
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted">Read-only access. Free to start. No credit card.</p>
        </div>
        <HeroPreview />
      </section>

      <section id="languages" className="border-y border-line bg-surface py-6" aria-label="Supported languages">
        <div className="flex w-max gap-12 whitespace-nowrap marquee">
          {marquee.map((l, i) => (
            <span key={i} className="font-indic text-4xl font-semibold text-ink-2 sm:text-5xl">
              {l.native}
              <span className="ml-12 text-accent">✦</span>
            </span>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-24 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Everything a manager does</p>
        <h2 className="mt-2 max-w-3xl font-display text-5xl leading-tight sm:text-6xl">From “why did this flop?” to “here&apos;s your next hit.”</h2>
        <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="group bg-surface p-7 transition hover:bg-surface-2">
              <div className="flex items-center justify-between">
                <span className="font-display text-5xl text-accent/70">{String(i + 1).padStart(2, "0")}</span>
                <span className="rounded-full border border-line px-2.5 py-1 text-[11px] font-medium text-muted">{f.tag}</span>
              </div>
              <h3 className="mt-6 text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 text-ink-2">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-ink py-24 text-bg">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-8 lg:grid-cols-2">
          <div>
            <p className="font-display text-[120px] leading-none text-accent sm:text-[160px]">6.4×</p>
            <p className="mt-4 max-w-md text-lg opacity-80">
              Growth in creators outside India&apos;s metro cities, 2020–2025. They&apos;re now the majority — and their tools
              are still built in English.
            </p>
            <p className="mt-3 text-xs opacity-50">Source: ISB–Hashfame creator economy report, 2026.</p>
          </div>
          <ol className="space-y-8 self-center">
            {[
              ["Connect", "Sign in with Google. Mitra gets read-only access to your channel analytics."],
              ["Understand", "Every video gets a health score, retention breakdown and plain-language diagnosis."],
              ["Grow", "Weekly actions, better titles, thumbnails and ideas pulled from your own audience."],
            ].map(([t, b], i) => (
              <li key={t} className="flex gap-5">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-bg/20 font-display text-2xl">{i + 1}</span>
                <div>
                  <p className="text-xl font-semibold">{t}</p>
                  <p className="mt-1 opacity-70">{b}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-4 py-24 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Pricing</p>
        <h2 className="mt-2 font-display text-5xl sm:text-6xl">Priced for Bharat. Pay with UPI.</h2>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PRICING.map((p) => (
            <div key={p.name} className={`card flex flex-col p-6 ${p.featured ? "!border-accent ring-2 ring-accent/30" : ""}`}>
              <div className="flex items-center justify-between">
                <p className="font-semibold">{p.name}</p>
                {p.featured && <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-ink">Popular</span>}
              </div>
              <p className="mt-4 font-display text-5xl">
                {p.price}
                <span className="font-sans text-sm text-muted">{p.per}</span>
              </p>
              <ul className="mt-5 flex-1 space-y-2 text-sm text-ink-2">
                {p.points.map((pt) => (
                  <li key={pt} className="flex gap-2"><span className="text-accent">✓</span>{pt}</li>
                ))}
              </ul>
              <a
                href={p.href}
                className={`mt-6 rounded-full px-4 py-2.5 text-center text-sm font-semibold ${p.featured ? "bg-accent text-accent-ink" : "border border-line hover:bg-surface-2"}`}
              >
                {p.cta}
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-8">
        <div className="grain card flex flex-col items-center px-6 py-16 text-center">
          <h2 className="max-w-2xl font-display text-5xl leading-tight sm:text-6xl">Chalo, channel badhate hain.</h2>
          <p className="mt-3 text-ink-2">Let&apos;s grow your channel — starting with your last video.</p>
          <Link href="/dashboard" className="mt-8 rounded-full bg-accent px-7 py-3.5 font-semibold text-accent-ink">
            Open the dashboard →
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
