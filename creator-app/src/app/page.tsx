import Link from "next/link";
import { FounderOfferPopup, FoundingBanner } from "@/components/Founding";
import { WaitlistForm } from "@/components/Waitlist";
import { LandingCounter } from "@/components/LandingCounter";
import { LanguageShowcase, RotatingLanguage } from "@/components/landing";
import { SiteFooter } from "@/components/SiteFooter";
import { Logo, ThemeToggle } from "@/components/ui";
import { LandingTracker, TrackedLink } from "@/components/BetaWidgets";
import { BETA, offeredLanguage, SPRINT_UPLOADS } from "@/lib/beta";
import { COMPANY, INVITE_ONLY } from "@/lib/company";
import { LANGUAGES as ALL_LANGUAGES } from "@/lib/languages";
import { AGENCY, FOUNDER_FREE_USES, PLANS, rupees } from "@/lib/plans";

const LANGUAGES = ALL_LANGUAGES.filter((l) => offeredLanguage(l.code));

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
    name: AGENCY.name,
    price: rupees(AGENCY.pricePaise),
    per: "/month",
    points: AGENCY.points,
    cta: "Talk to us",
    href: `mailto:${COMPANY.supportEmail}?subject=Mitra%20Agency%20plan`,
    featured: false,
  },
];

const BETA_FAQ = [
  ["Is my channel safe?", "Mitra only gets read-only access to your YouTube analytics. It can never upload, delete or change anything on your channel, and you can disconnect in one click."],
  ["Which languages does it speak?", "Hindi and Kannada during the beta, so native speakers can check every answer before we add more."],
  ["How is this different from YouTube Studio?", "Studio shows you where viewers left. Mitra tells you why, in your language, and what to change in your next upload."],
  ["What does it cost?", "Nothing during the beta. Before paid plans start we'll tell you what they cost, and you'll never be charged without choosing a plan yourself."],
  ["My channel is small. Will it work?", "Yes. Videos with too few views for a reliable retention curve get an early read on the title, length and first 15 seconds instead."],
  ["What happens to my data?", "Your analytics stay yours. We don't sell data or show ads, and deleting your account removes everything from Mitra."],
] as const;

const FAQ_FULL = [
  ["Is my channel safe?", "Mitra only gets read-only access to your YouTube analytics. It can never upload, delete or change anything on your channel, and you can disconnect in one click."],
  ["Which languages does it speak?", "Hindi, Hinglish, Telugu, Tamil, Marathi, Bengali, Kannada, Malayalam and English. Pick one in the top bar and every answer, title and report comes back in it."],
  ["How is this different from YouTube Studio?", "Studio shows numbers. Mitra explains them in your language and tells you what to do: why a video dipped at 0:42, what your viewers are searching, which trend to ride and how your competitors are winning."],
  ["What does it cost?", `Free to start with ${PLANS.free.credits} AI credits a month. Pro is ${rupees(PLANS.pro.pricePaise)}/month, Creator+ ${rupees(PLANS.creator.pricePaise)}/month. The first 100 creators to connect a channel get a Founder Pass: ${FOUNDER_FREE_USES} free uses a month of titles, thumbnails, trends and more, for life.`],
  ["Can I cancel any time?", "Yes, in one click from Plan & billing. You keep your plan until the end of the period you paid for."],
  ["What happens to my data?", "Your analytics stay yours. We don't sell data or show ads, and deleting your account removes everything from Mitra."],
] as const;

const FAQ = BETA ? BETA_FAQ : FAQ_FULL;

const SPRINT = [
  ["Diagnose", "Connect YouTube (read-only) and run Video Doctor on your latest video."],
  ["Apply", `Use Mitra's fixes on your next ${SPRINT_UPLOADS} uploads. Tap "I'll apply these fixes" so Mitra knows.`],
  ["Measure", "Mitra compares their average % viewed with your channel's average before the fixes."],
];

function Bento({ title, body, tag, className = "", dark = false, children }: { title: string; body: string; tag: string; className?: string; dark?: boolean; children?: React.ReactNode }) {
  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-[28px] border p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_60px_-40px_rgba(0,0,0,0.45)] ${dark ? "border-ink bg-ink text-bg" : "border-line bg-surface"} ${className}`}
    >
      <span className={`self-start rounded-full px-2.5 py-1 text-[11px] font-semibold ${dark ? "bg-bg/10 text-bg/80" : "bg-surface-2 text-ink-2"}`}>{tag}</span>
      <h3 className="mt-4 font-display text-2xl">{title}</h3>
      <p className={`mt-2 ${dark ? "text-bg/70" : "text-ink-2"}`}>{body}</p>
      {children && <div className="mt-6 flex-1">{children}</div>}
    </div>
  );
}

function RetentionMini() {
  const pts = Array.from({ length: 41 }, (_, i) => {
    const t = i / 40;
    const w = (1 - 0.3 * Math.min(1, t / 0.1)) * Math.exp(-0.8 * t) - 0.07 * Math.exp(-((t - 0.42) ** 2) / 0.003);
    return [8 + t * 304, 12 + (1 - w) * 96] as const;
  });
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("");
  return (
    <svg viewBox="0 0 320 120" className="w-full" role="img" aria-label="Retention curve with a drop marked at 4:12">
      <path d={`${d}L312,112L8,112Z`} fill="var(--accent)" opacity="0.12" />
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={pts[17][0]} cy={pts[17][1]} r="6" fill="var(--bad)" stroke="var(--surface)" strokeWidth="2" />
      <text x={pts[17][0]} y={pts[17][1] - 11} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink)">4:12 −18%</text>
    </svg>
  );
}

export default function Home() {
  const marquee = [...LANGUAGES, ...LANGUAGES];
  return (
    <div className="overflow-x-hidden">
      <LandingTracker />
      {!BETA && <FounderOfferPopup />}
      {/* ---- Nav ---- */}
      <header className="sticky top-0 z-40 border-b border-transparent bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-4 sm:px-8">
          <span className="flex items-center gap-2">
            <Logo />
            {BETA && <span className="rounded border border-accent/50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">Beta</span>}
          </span>
          <nav className="ml-6 hidden gap-6 text-sm font-medium text-ink-2 md:flex">
            <a href="#features" className="hover:text-ink">Features</a>
            <a href="#languages" className="hover:text-ink">Languages</a>
            {BETA ? <a href="#sprint" className="hover:text-ink">The beta</a> : <a href="#pricing" className="hover:text-ink">Pricing</a>}
            <a href="#faq" className="hover:text-ink">FAQ</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className="hidden rounded-full px-4 py-2.5 text-sm font-semibold hover:bg-surface-2 sm:block">
              Sign in
            </Link>
            <Link href="/dashboard" className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-bg transition hover:opacity-90">
              Try the demo
            </Link>
          </div>
        </div>
      </header>

      {/* ---- Hero ---- */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-[640px] opacity-60 [mask-image:radial-gradient(60%_60%_at_50%_30%,black,transparent)]" aria-hidden>
          <div className="glow-blob absolute left-[8%] top-24 h-80 w-80 rounded-full bg-[#ff8a1f]/40 blur-3xl" />
          <div className="glow-blob absolute right-[10%] top-10 h-96 w-96 rounded-full bg-[#d946ef]/30 blur-3xl" style={{ animationDelay: "-5s" }} />
          <div className="glow-blob absolute left-[40%] top-64 h-72 w-72 rounded-full bg-[#6c47ff]/25 blur-3xl" style={{ animationDelay: "-9s" }} />
        </div>
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-10 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
          <div className="rise">
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1.5 text-xs font-semibold text-ink-2 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-brand" /> {BETA ? "Free beta · for Hindi and Kannada YouTube creators" : "The AI channel manager for India's creators"}
            </p>
            <h1 className="mt-6 font-display text-[3.4rem] leading-[0.95] sm:text-7xl lg:text-[5.4rem]">
              Grow your channel in <RotatingLanguage />
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-2">
              {BETA
                ? "Mitra finds the exact second viewers left your video, explains why in Hindi or Kannada, and tells you what to change in your next upload. YouTube shows you where. Mitra tells you why."
                : "Mitra reads your YouTube analytics and tells you, in your own language, why a video dipped, what your viewers want, which trend to ride and what to post next. Then it celebrates every new subscriber with you."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dashboard" className="bg-brand rounded-full px-7 py-4 text-base font-semibold text-white shadow-[0_14px_40px_-12px_#d946ef] transition hover:brightness-110">
                Try the live demo →
              </Link>
              <TrackedLink
                href={INVITE_ONLY ? "#waitlist" : "/dashboard/connections"}
                event="signup_click"
                props={{ from: "hero" }}
                className="rounded-full border border-line bg-surface px-7 py-4 text-base font-semibold hover:bg-surface-2"
              >
                {INVITE_ONLY ? (BETA ? "Join the free beta" : "Get early access") : "Connect YouTube"}
              </TrackedLink>
            </div>
            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
              <li>✓ Read-only access</li>
              <li>✓ {BETA ? "Free during the beta" : "Free to start"}</li>
              {!BETA && <li>✓ Pro at ₹99/month</li>}
            </ul>
            {!BETA && <FoundingBanner />}
          </div>
          <div className="float-y">
            <LandingCounter />
          </div>
        </div>
      </section>

      {/* ---- Languages ---- */}
      {BETA ? (
        <section id="languages" className="border-y border-line bg-surface py-10" aria-label="Supported languages">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:grid-cols-2 sm:px-8">
            {LANGUAGES.map((l) => (
              <div key={l.code} className="flex items-baseline justify-between gap-4">
                <span className="font-indic text-5xl font-semibold sm:text-6xl">{l.native}</span>
                <span className="text-sm text-muted">{l.label}</span>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-5 max-w-6xl px-4 text-sm text-ink-2 sm:px-8">
            Two languages, done properly: native speakers check Mitra&apos;s answers during the beta. More languages come after.
          </p>
        </section>
      ) : (
      <section id="languages" className="border-y border-line bg-surface py-6" aria-label="Supported languages">
        <div className="flex w-max gap-12 whitespace-nowrap marquee">
          {marquee.map((l, i) => (
            <span key={i} className="font-indic text-4xl font-semibold text-ink-2 sm:text-5xl">
              {l.native}
              <span className="text-brand ml-12">✦</span>
            </span>
          ))}
        </div>
      </section>
      )}

      {/* ---- Why ---- */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Why Mitra</p>
            <h2 className="mt-3 font-display text-5xl leading-[1.02] sm:text-6xl">
              Most of India&apos;s creators don&apos;t create in English. <span className="text-brand">Their tools still do.</span>
            </h2>
            <p className="mt-5 max-w-lg text-lg text-ink-2">
              Mitra gives the same advice a big-city channel manager would, in the language you and your viewers actually speak. Try it: switch the
              language.
            </p>
          </div>
          <LanguageShowcase />
        </div>
        <dl className="mt-16 grid gap-px overflow-hidden rounded-[28px] border border-line bg-line sm:grid-cols-3">
          {[
            ["6.4×", "growth in creators outside metro cities, 2020–2025"],
            ["66%", "of India's creators now live outside the metros"],
            ["58%", "create in a regional language other than Hindi"],
          ].map(([n, t]) => (
            <div key={n} className="bg-surface p-7">
              <dt className="text-brand font-display text-6xl">{n}</dt>
              <dd className="mt-2 text-ink-2">{t}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-muted">Source: ISB–Hashfame, &ldquo;Understanding the Canvas of India&apos;s Creator Economy&rdquo;, July 2026.</p>
      </section>

      {/* ---- Features (bento) ---- */}
      <section id="features" className="mx-auto max-w-6xl px-4 pb-24 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Everything a manager does</p>
        <h2 className="mt-3 max-w-3xl font-display text-5xl leading-[1.02] sm:text-6xl">From &ldquo;why did this flop?&rdquo; to &ldquo;here&apos;s your next hit.&rdquo;</h2>
        <div className="mt-12 grid gap-4 md:grid-cols-6">
          <Bento className="md:col-span-4" tag="Retention" title="Video Doctor" body="Pinpoints the second viewers left, explains why in your language, and gives three fixes. Also shows which cities watched and what they searched.">
            <RetentionMini />
          </Bento>
          {!BETA && (
          <Bento className="md:col-span-2" dark tag="Motivation" title="Every win, celebrated" body="Live subscriber counter, confetti for new subscribers, milestones to your Silver Creator Award.">
            <p className="font-display text-6xl text-accent">+128</p>
            <p className="text-sm opacity-70">subscribers since you last looked 🎉</p>
          </Bento>
          )}
          <Bento
            className="md:col-span-2"
            tag="Packaging"
            title="Title & Thumbnail Studio"
            body={BETA ? "Titles and a 15-second hook in your language, plus thumbnails where Hindi and Kannada text renders right, which most AI image tools still get wrong." : "Titles in your language and AI-designed thumbnails where Hindi and Telugu text render right."}
          >
            <div className="grid aspect-video place-items-center rounded-2xl bg-gradient-to-br from-[#1b1446] via-[#7a1f8c] to-[#ff8a1f] p-4">
              <p className="text-center font-indic text-3xl font-extrabold leading-tight text-white [text-shadow:0_3px_0_#000]">
                ₹20K में <span className="text-[#ffd23f]">कौन जीता?</span>
              </p>
            </div>
          </Bento>
          {!BETA && (
          <>
          <Bento className="md:col-span-2" tag="Ideas" title="Trend Radar" body="What India is watching right now, sorted by language, with the emotions and festivals behind it.">
            <div className="flex flex-wrap gap-2">
              {["😊 Joy 30%", "🤔 Curiosity 26%", "🙏 Devotion 16%", "😂 Humour 14%"].map((c) => (
                <span key={c} className="rounded-full bg-surface-2 px-3 py-1.5 text-sm">{c}</span>
              ))}
            </div>
          </Bento>
          <Bento className="md:col-span-2" tag="Audience" title="Who watches, from where" body="Top cities, search terms, age and gender, and the slang your Gen Z and millennial viewers really use.">
            <ul className="space-y-2 text-sm">
              {[["Hyderabad", 84], ["Vijayawada", 52], ["Dubai", 21]].map(([c, v]) => (
                <li key={c}>
                  <div className="flex justify-between"><span>{c}</span><span className="text-muted">{v}K</span></div>
                  <div className="mt-1 h-1.5 rounded-full bg-surface-2"><div className="bg-brand h-1.5 rounded-full" style={{ width: `${Number(v)}%` }} /></div>
                </li>
              ))}
            </ul>
          </Bento>
          <Bento className="md:col-span-3" tag="Strategy" title="Competitor compare" body="Line up against up to 5 channels: views, upload rhythm, Shorts mix, title patterns, and the gaps you can own." />
          <Bento className="md:col-span-3" tag="Assistant" title="Ask Mitra anything" body="A manager who knows your numbers, on call in your language.">
            <p className="rounded-2xl rounded-tl-md bg-surface-2 px-4 py-3 text-sm">
              <span className="font-semibold">Is hafte kya upload karun?</span>
              <br />
              <span className="text-ink-2">Tumhara UPI fraud video 2.2× chala — iska Part 2 banao, aur ek 45-sec Short Friday ko. 🔥</span>
            </p>
          </Bento>
          </>
          )}
        </div>
      </section>

      {/* ---- The beta: Retention Sprint ---- */}
      {BETA && (
        <section id="sprint" className="scroll-mt-20 mx-auto max-w-6xl px-4 pb-24 sm:px-8">
          <div className="grid gap-10 rounded-[36px] border border-line bg-surface p-6 sm:p-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">The beta programme</p>
              <h2 className="mt-3 font-display text-5xl leading-tight">The {SPRINT_UPLOADS}-upload Retention Sprint</h2>
              <p className="mt-4 text-lg text-ink-2">Not more charts. One goal: more of your viewers watching to the end, measured on your own channel.</p>
              <p className="mt-6 rounded-2xl border border-accent/40 bg-accent-soft p-4 text-sm">
                <b>Our promise:</b> if your average % viewed hasn&apos;t improved after {SPRINT_UPLOADS} uploads, we&apos;ll go through your channel with you
                one-on-one and tell you honestly why.
              </p>
              <p className="mt-4 text-sm text-muted">
                Built first for creators who already earn from YouTube and for people who manage channels. Just starting out? You&apos;re welcome too.
              </p>
            </div>
            <ol className="space-y-6">
              {SPRINT.map(([t, b], i) => (
                <li key={t} className="flex gap-4">
                  <span className="text-brand font-display text-5xl leading-none">{i + 1}</span>
                  <div>
                    <p className="text-xl font-semibold">{t}</p>
                    <p className="mt-1 text-ink-2">{b}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* ---- How it works ---- */}
      <section className="bg-ink py-24 text-bg">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <h2 className="font-display text-5xl sm:text-6xl">Up and running in a minute.</h2>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              ["Connect", "Sign in with Google and connect YouTube with read-only access."],
              ["Understand", "Every video gets a health score, a retention breakdown and a plain-language diagnosis."],
              ["Grow", "Weekly actions, better titles and thumbnails, trends and ideas from your own audience."],
            ].map(([t, b], i) => (
              <li key={t} className="rounded-[28px] border border-bg/10 bg-bg/5 p-7">
                <span className="text-brand font-display text-6xl">{i + 1}</span>
                <p className="mt-4 text-2xl font-semibold">{t}</p>
                <p className="mt-2 opacity-70">{b}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---- Waitlist (private beta) ---- */}
      {INVITE_ONLY && (
        <section id="waitlist" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-20 sm:px-8">
          <div className="grid gap-10 rounded-[36px] border border-line bg-surface p-6 sm:p-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Private beta</p>
              <h2 className="mt-3 font-display text-5xl leading-tight">Get early access</h2>
              <p className="mt-4 text-lg text-ink-2">
                We&apos;re letting creators in a few at a time, so every one of them gets real help (and we can fix things fast). Join the list and
                we&apos;ll message you when your spot opens.
              </p>
              <ul className="mt-6 space-y-2 text-ink-2">
                {BETA ? (
                  <>
                    <li>🎯 Video Doctor on your own videos, in Hindi or Kannada</li>
                    <li>📈 The {SPRINT_UPLOADS}-upload Retention Sprint, free during the beta</li>
                  </>
                ) : (
                  <>
                    <li>🏅 The first 100 creators get a Founder Pass, free for life</li>
                    <li>📲 Your weekly report on WhatsApp, in your language</li>
                  </>
                )}
                <li>🔒 Read-only YouTube access. Mitra never posts for you</li>
              </ul>
            </div>
            <WaitlistForm />
          </div>
        </section>
      )}

      {/* ---- Pricing (hidden during the beta) ---- */}
      {!BETA && (
      <section id="pricing" className="mx-auto max-w-6xl px-4 py-24 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Pricing</p>
        <h2 className="mt-3 font-display text-5xl sm:text-6xl">Priced for Bharat. Pay with UPI.</h2>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PRICING.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col rounded-[28px] border p-6 ${p.featured ? "border-transparent bg-ink text-bg shadow-[0_30px_70px_-30px_#d946ef]" : "border-line bg-surface"}`}
            >
              {p.featured && <span className="bg-brand absolute -top-3 left-6 rounded-full px-3 py-1 text-xs font-bold text-white">Launch price</span>}
              <p className="font-semibold">{p.name}</p>
              <p className="mt-4 font-display text-5xl">
                {p.price}
                <span className={`font-sans text-sm font-normal ${p.featured ? "opacity-60" : "text-muted"}`}>{p.per}</span>
              </p>
              <ul className={`mt-5 flex-1 space-y-2 text-sm ${p.featured ? "opacity-85" : "text-ink-2"}`}>
                {p.points.map((pt) => (
                  <li key={pt} className="flex gap-2"><span className="text-accent">✓</span>{pt}</li>
                ))}
              </ul>
              <a
                href={p.href}
                className={`mt-6 rounded-full px-4 py-3 text-center text-sm font-semibold ${p.featured ? "bg-brand text-white" : "border border-line hover:bg-surface-2"}`}
              >
                {p.cta}
              </a>
            </div>
          ))}
        </div>
      </section>

      )}

      {/* ---- FAQ ---- */}
      <section id="faq" className="mx-auto max-w-3xl px-4 pb-24 sm:px-8">
        <h2 className="text-center font-display text-5xl">Questions</h2>
        <div className="mt-10 divide-y divide-line rounded-[28px] border border-line bg-surface">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group px-6 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                {q}
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-2 transition group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="mt-3 text-ink-2">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ---- Final CTA ---- */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-8">
        <div className="bg-brand relative overflow-hidden rounded-[36px] px-6 py-16 text-center text-white sm:py-20">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/15 blur-2xl" aria-hidden />
          {BETA ? (
            <>
              <h2 className="font-indic text-5xl font-bold leading-tight sm:text-6xl">चलो, चैनल बढ़ाते हैं।</h2>
              <p className="font-indic mt-2 text-2xl text-white/90">ಬನ್ನಿ, ನಿಮ್ಮ ಚಾನೆಲ್ ಬೆಳೆಸೋಣ.</p>
            </>
          ) : (
            <h2 className="font-display text-5xl leading-tight sm:text-7xl">Chalo, channel badhate hain.</h2>
          )}
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/85">Let&apos;s grow your channel, starting with your last video.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/dashboard" className="rounded-full bg-white px-7 py-4 font-semibold text-[#1a0f05] transition hover:bg-white/90">
              Try the live demo →
            </Link>
            <Link href={INVITE_ONLY ? "#waitlist" : "/dashboard/connections"} className="rounded-full border border-white/50 px-7 py-4 font-semibold text-white hover:bg-white/10">
              {INVITE_ONLY ? "Get early access" : "Connect YouTube"}
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
