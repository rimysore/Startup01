import Image from "next/image";
import Link from "next/link";
import "./site.css";
import { FounderOfferPopup } from "@/components/Founding";
import { WaitlistForm } from "@/components/Waitlist";
import { LEGAL_LINKS } from "@/components/SiteFooter";
import { DoctorPanel, IndiaTime, Reveals, TitleCheck, WatchHours } from "@/components/site";
import { MitraMark } from "@/components/brand";
import { Logo, ThemeToggle } from "@/components/ui";
import { LandingTracker, TrackedLink } from "@/components/BetaWidgets";
import { BETA, offeredLanguage, SPRINT_UPLOADS } from "@/lib/beta";
import { COMPANY, INVITE_ONLY } from "@/lib/company";
import { LANGUAGES as ALL_LANGUAGES } from "@/lib/languages";
import { AGENCY, FOUNDER_FREE_USES, PLANS, rupees } from "@/lib/plans";

/*
 * The landing page, art-directed with the taste skill (direction "colour chapters"): each section is a full-bleed
 * field in one brand colour. The idea: Mitra's own retention curve, the second viewers left, carries the page, from
 * the stage cut as a step down to the live Video Doctor panel on it.
 */

const LANGUAGES = ALL_LANGUAGES.filter((l) => offeredLanguage(l.code));

const PRICING = [
  ...Object.values(PLANS).map((p) => ({
    name: p.name,
    price: rupees(p.pricePaise),
    per: p.pricePaise ? "/month" : "",
    points: p.points,
    cta: p.id === "free" ? "Start free" : `Get ${p.name}`,
    href: p.id === "free" ? "/login?next=/dashboard" : `/dashboard/billing?plan=${p.id}`,
  })),
  { name: AGENCY.name, price: rupees(AGENCY.pricePaise), per: "/month", points: AGENCY.points, cta: "Talk to us", href: `mailto:${COMPANY.supportEmail}?subject=Mitra%20Agency%20plan` },
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

/** Kannada on the street, from Wikimedia Commons (CC BY-SA). Credited in the footer; none of them is Mitra's. */
const SIGNS = [
  { src: "/site/metro.jpg", alt: "Indiranagar metro station sign in Kannada and English", caption: "Indiranagar metro station, Bengaluru", credit: "Blu Adi, CC BY-SA 4.0", page: "https://commons.wikimedia.org/w/index.php?curid=192876792" },
  { src: "/site/coorg-coffee.jpg", alt: "Hand-painted tea and coffee shop sign in Kannada and English", caption: "A tea and coffee stall, Kodagu", credit: "Subhashish Panigrahi, CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Signboard_of_a_coffee_shop_in_Coorg,_Karnataka.jpg" },
  { src: "/site/mysore-college.jpg", alt: "Maharaja's College sign in Kannada and English", caption: "Maharaja's College, Mysuru", credit: "Christopher J. Fynn, CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Maharaja%27s_College,_Mysore_sign.jpg" },
];

/** The Retention Sprint as one bar: widths follow how long each stage really takes (12% minimum). */
const STAGES = [
  { dur: "Two minutes", grow: 12, note: "First, sign in with Google and connect YouTube, read-only.", bg: "var(--navy-field)", fg: "#f1f5f9" },
  { dur: "About a minute", grow: 12, note: "Then Video Doctor reads your latest video and names the fixes.", bg: "var(--cobalt-field)", fg: "#ffffff" },
  { dur: `Your next ${SPRINT_UPLOADS} uploads`, grow: 52, note: `Next, you use the fixes on ${SPRINT_UPLOADS} uploads and tap "I'll apply these fixes".`, bg: "var(--mint-field)", fg: "#101b33" },
  { dur: "A week after each", grow: 24, note: "Last, Mitra compares their average % viewed with your channel before.", bg: "var(--pale-field)", fg: "var(--ink)" },
];

function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 36 36 12M16 12h20v20" />
    </svg>
  );
}

export default function Home() {
  const join = INVITE_ONLY ? "#waitlist" : "/dashboard/connections";
  const joinLabel = INVITE_ONLY ? (BETA ? "Join the free beta" : "Get early access") : "Connect YouTube";
  return (
    <div className="site">
      <LandingTracker />
      <Reveals />
      {!BETA && <FounderOfferPopup />}

      {/* ---- Hero: fragment on a shaped stage ---- */}
      <section className="s-hero" aria-labelledby="hero-title">
        <div className="s-wrap">
          <header className="s-nav">
            <Logo />
            <nav className="s-nav__links" aria-label="Main">
              <a href="#titles" className="s-nav__text s-link">Title check</a>
              <a href="#sprint" className="s-nav__text s-link">{BETA ? "The Sprint" : "How it works"}</a>
              {!BETA && <a href="#pricing" className="s-nav__text s-link">Pricing</a>}
              <a href="#faq" className="s-nav__text s-link">FAQ</a>
              <Link href="/login" className="s-link">Sign in</Link>
              <ThemeToggle />
            </nav>
          </header>
          <div className="s-grid s-hero__copy">
            <h1 id="hero-title">Find the second viewers&nbsp;left.</h1>
            <p className="s-hero__sub">
              {BETA
                ? "Mitra is a free Video Doctor for Hindi and Kannada YouTube creators. It finds the moment people stopped watching, says why in your language, and tells you what to change next."
                : "Mitra reads your YouTube analytics and tells you, in your own language, why a video dipped, what your viewers want and what to post next."}
            </p>
            <div className="s-hero__act">
              <TrackedLink href={join} event="signup_click" props={{ from: "hero" }} className="s-btn">
                {joinLabel}
              </TrackedLink>
              <Link href="/dashboard" className="s-link">Try the demo</Link>
            </div>
            <p className="s-hero__trust">Read-only YouTube access · {BETA ? "Free during the beta" : `Pro at ${rupees(PLANS.pro.pricePaise)}/month`}</p>
          </div>
        </div>
        <div className="s-stage" id="doctor">
          <div className="s-stage__inner">
            <DoctorPanel />
          </div>
        </div>
      </section>

      {/* ---- Title check: the headline you can type ---- */}
      <section id="titles" className="s-chapter s-navy scroll-mt-4" aria-labelledby="titles-title">
        <div className="s-wrap">
          <h2 id="titles-title" className="s-type__q" data-reveal>Type your next video title.</h2>
          <TitleCheck studioHref="/dashboard/studio" />
        </div>
      </section>

      {/* ---- What's in the beta: close-ups on a board ---- */}
      <section className="bg-bg" aria-labelledby="board-title">
        <div className="s-board">
          <div className="s-tile s-tile--head s-t1" style={{ background: "var(--surface-2)" }} data-reveal>
            <h2 id="board-title" className="font-black tracking-[-0.04em]" style={{ fontSize: "clamp(36px, 4vw, 60px)", lineHeight: 0.95 }}>
              {BETA ? "Two tools, done properly." : "A manager in your pocket."}
            </h2>
          </div>

          <div className="s-tile s-t2" style={{ background: "var(--cobalt-field)", color: "#fff" }} data-reveal>
            <div className="s-tile__ui" data-ui style={{ right: "-0.3em", top: "0.3em", fontSize: "clamp(48px, 7vw, 112px)" }}>
              <span className="ui-chip" style={{ fontSize: "1em", padding: "0.12em 0.4em", background: "#fff", color: "#b91c1c", fontWeight: 800, letterSpacing: "-0.03em" }}>
                0:42 −31%
              </span>
            </div>
            <p className="s-tile__name">Video Doctor</p>
            <p className="s-tile__line">Finds the second viewers left, says why, and gives the fixes for your next upload.</p>
          </div>

          <div className="s-tile s-t3" style={{ background: "var(--mint-field)", color: "#101b33" }} data-reveal>
            <div className="s-tile__ui indic" data-ui style={{ left: "-0.2em", top: "0.4em", fontSize: "clamp(32px, 3.4vw, 56px)", whiteSpace: "nowrap" }}>
              <span style={{ display: "inline-flex", gap: "0.1em", padding: "0.1em", borderRadius: 999, background: "#ffffff80" }}>
                <span style={{ padding: "0.05em 0.35em", borderRadius: 999, background: "#101b33", color: "#f1f5f9", fontWeight: 700 }}>हिन्दी</span>
                <span style={{ padding: "0.05em 0.35em", fontWeight: 700 }}>ಕನ್ನಡ</span>
              </span>
            </div>
            <p className="s-tile__name">In your language</p>
            <p className="s-tile__line">
              {BETA ? "Every answer in Hindi or Kannada, checked by native speakers during the beta." : `Every answer in ${LANGUAGES.length} languages.`}
            </p>
          </div>

          <div className="s-tile s-t4" style={{ background: "var(--navy-field)", color: "#f1f5f9" }} data-reveal>
            <div className="s-tile__ui" data-ui style={{ right: "-0.25em", top: "-0.2em", fontSize: "clamp(28px, 3vw, 48px)", whiteSpace: "nowrap" }}>
              <span style={{ display: "inline-block", padding: "0.1em 0.4em", borderRadius: "0.3em", background: "#72d9b0", color: "#101b33", fontWeight: 800 }}>Read-only</span>
            </div>
            <p className="s-tile__name">Can&apos;t touch your channel</p>
            <p className="s-tile__line">It reads analytics. It never uploads or deletes.</p>
          </div>

          <div className="s-tile s-t5" style={{ background: "var(--hover)", color: "var(--ink)" }} data-reveal>
            <div className="s-tile__ui" data-ui style={{ right: "-1.4em", top: "-0.3em", fontSize: "clamp(24px, 2.4vw, 38px)" }}>
              <span style={{ display: "inline-block", padding: "0.3em 0.8em", borderRadius: 999, background: "var(--accent)", color: "var(--accent-ink)", fontWeight: 700, whiteSpace: "nowrap" }}>
                I&apos;ll apply these fixes
              </span>
            </div>
            <p className="s-tile__name">One tap to commit</p>
            <p className="s-tile__line">Then Mitra measures your next {SPRINT_UPLOADS} uploads.</p>
          </div>

          <div className="s-tile s-t6" style={{ background: "var(--surface-2)" }} data-reveal>
            <div className="s-tile__ui indic" data-ui style={{ right: "-0.3em", top: "-0.25em", fontSize: "clamp(32px, 4vw, 64px)", whiteSpace: "nowrap" }}>
              <span style={{ display: "inline-block", padding: "0.12em 0.4em", background: "#101b33", color: "#fff", fontWeight: 800, borderRadius: "0.2em" }}>
                ₹500 ಫೋನ್ <span style={{ color: "#72d9b0" }}>ಗೆದ್ದಿತಾ?</span>
              </span>
            </div>
            <p className="s-tile__name">Title &amp; Thumbnail Studio</p>
            <p className="s-tile__line">Titles, a 15-second hook, and thumbnail text where Kannada and Hindi letters render right.</p>
          </div>
        </div>
      </section>

      {/* ---- Watch hours: the figure is the visitor's own ---- */}
      <section className="s-chapter s-mint" aria-label="Watch hours calculator">
        <div className="s-wrap">
          <WatchHours />
        </div>
      </section>

      {/* ---- Two languages ---- */}
      <section className="s-chapter s-navy flex flex-col justify-end" aria-labelledby="langs-title">
        <div className="s-wrap">
          <h2 id="langs-title" className="s-head" data-reveal>{BETA ? "Two languages, done properly." : "Your language, not ours."}</h2>
          <div className="s-langs mt-8">
            {BETA ? (
              <>
                <p className="s-langs__word s-langs__hi indic" lang="hi" data-reveal>हिन्दी</p>
                <p className="s-langs__word s-langs__kn indic" lang="kn" data-reveal style={{ color: "var(--mint-field)" }}>ಕನ್ನಡ</p>
              </>
            ) : (
              <p className="indic col-span-12 text-[clamp(40px,7vw,120px)] font-bold leading-[1.2]" data-reveal>
                {LANGUAGES.map((l) => l.native).join(" · ")}
              </p>
            )}
            <p className="s-langs__note s-lead" style={{ color: "var(--on-navy-2)" }} data-reveal>
              {BETA
                ? "Native speakers check Mitra's answers in both before more languages ship. Not translated English: the way you'd say it to your own viewers."
                : "Pick one in the top bar and every answer, title and report comes back in it."}
            </p>
          </div>
          <div className="s-signs">
            {SIGNS.map((g, i) => (
              <figure key={g.src} data-reveal style={{ ["--i" as string]: i }}>
                <Image src={g.src} alt={g.alt} width={1280} height={960} sizes="(max-width: 760px) 100vw, 33vw" />
                <figcaption>{g.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ---- The Retention Sprint as one bar ---- */}
      <section id="sprint" className="s-chapter scroll-mt-4" aria-labelledby="sprint-title">
        <div className="s-wrap">
          <h2 id="sprint-title" className="s-head" data-reveal>{BETA ? (
              <>
                The <span className="whitespace-nowrap">{SPRINT_UPLOADS}-upload</span> Sprint.
              </>
            ) : (
              "Up and running in minutes."
            )}</h2>
          <div className="s-bar" data-ui data-reveal>
            {STAGES.map((s) => (
              <div key={s.dur} className="s-bar__seg" style={{ flexGrow: s.grow, flexBasis: 0, background: s.bg, color: s.fg, ["--grow" as string]: s.grow }}>
                <p className="s-bar__dur">{s.dur}</p>
                <p className="s-bar__note-in">{s.note}</p>
              </div>
            ))}
          </div>
          <div className="s-bar__notes" aria-hidden>
            {STAGES.map((s) => (
              <p key={s.dur} className="s-bar__note" style={{ flexGrow: s.grow, flexBasis: 0 }}>
                {s.note}
              </p>
            ))}
          </div>
          {BETA && (
            <p className="s-promise" data-reveal>
              <b>Our promise:</b> if your average % viewed hasn&apos;t improved after {SPRINT_UPLOADS} uploads, we&apos;ll go through your channel with you one-on-one and
              tell you honestly why.
            </p>
          )}
        </div>
      </section>

      {/* ---- Waitlist (private beta) ---- */}
      {INVITE_ONLY && (
        <section id="waitlist" className="s-chapter s-pale scroll-mt-4" aria-labelledby="join-title">
          <div className="s-wrap s-join">
            <div className="s-join__copy" data-reveal>
              <h2 id="join-title" className="s-head">{BETA ? "Join the beta." : "Get early access."}</h2>
              <p className="s-lead mt-8 max-w-[34ch]">
                We let creators in a few at a time, so each one gets real help and we can fix things fast. Leave your email and we&apos;ll write when your spot opens.
              </p>
              <p className="mt-6 text-ink-2">Built first for creators who already earn from YouTube and for people who manage channels. Just starting out? You&apos;re welcome too.</p>
            </div>
            <div className="s-join__form" data-reveal>
              <WaitlistForm />
            </div>
          </div>
        </section>
      )}

      {/* ---- Pricing (hidden during the beta) ---- */}
      {!BETA && (
        <section id="pricing" className="s-chapter s-pale" aria-labelledby="pricing-title">
          <div className="s-wrap">
            <h2 id="pricing-title" className="s-head" data-reveal>Priced for Bharat. Pay with UPI.</h2>
            <div className="mt-16 grid gap-2 md:grid-cols-2 lg:grid-cols-4">
              {PRICING.map((p, i) => (
                <div key={p.name} className="flex flex-col rounded-[20px] p-6" style={i === 1 ? { background: "var(--cobalt-field)", color: "#fff" } : { background: "var(--surface)" }}>
                  <p className="text-xl font-bold">{p.name}</p>
                  <p className="mt-4 text-5xl font-black tracking-[-0.04em]">
                    {p.price}
                    <span className="text-base font-normal">{p.per}</span>
                  </p>
                  <ul className="mt-5 flex-1 space-y-2 text-[16px]">
                    {p.points.map((pt) => (
                      <li key={pt}>{pt}</li>
                    ))}
                  </ul>
                  <a href={p.href} className="s-btn mt-6 justify-center" style={i === 1 ? { background: "#fff", color: "#101b33" } : undefined}>
                    {p.cta}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---- FAQ: accordion of filled tiles ---- */}
      <section id="faq" className="s-chapter scroll-mt-4" aria-labelledby="faq-title">
        <div className="s-wrap s-faq">
          <h2 id="faq-title" className="s-faq__head">Questions, answered.</h2>
          <div className="s-faq__list">
            {FAQ.map(([q, a]) => (
              <details key={q} name="faq">
                <summary>
                  {q}
                  <span className="s-faq__plus" aria-hidden />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---- One word is the button ---- */}
      <TrackedLink href={join} event="signup_click" props={{ from: "cta" }} className="s-cta" aria-label={joinLabel}>
        <span className="s-cta__note">
          {BETA ? "Free during the beta. Hindi and Kannada. Read-only access to YouTube." : "Free to start. Read-only access to YouTube."}
        </span>
        <Arrow className="s-cta__arrow s-arrow" />
        <span className="s-cta__word" aria-hidden>
          {INVITE_ONLY ? "Join" : "Start"}
        </span>
      </TrackedLink>

      {/* ---- A footer of tiles ---- */}
      <footer className="s-foot" aria-label="Footer">
        <div className="s-foot__say">
          <div>
            <p className="text-[24px] font-bold leading-tight tracking-[-0.02em]">Mitra means friend.</p>
            <p className="mt-2 text-ink-2">Made for Bharat&apos;s creators.</p>
          </div>
          <p className="s-small text-ink-2">
            Photographs: {SIGNS.map((g, i) => (
              <span key={g.page}>
                {i ? "; " : ""}
                <a href={g.page} className="s-link font-normal">{g.credit}</a>
              </span>
            ))}
            , via Wikimedia Commons.
          </p>
          <p className="s-small text-ink-2">© 2026 {COMPANY.legalName.startsWith("[") ? COMPANY.product : COMPANY.legalName}</p>
        </div>
        <nav className="s-foot__nav" aria-label="Legal">
          <ul className="space-y-2 text-[16px]">
            {LEGAL_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="s-link font-semibold">{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="s-foot__time">
          <p className="text-[16px] text-ink-2">In India it&apos;s</p>
          <p className="mt-1 text-[28px] font-black tracking-[-0.03em]">
            <IndiaTime />
          </p>
        </div>
        <div className="s-foot__mail">
          <p className="text-[16px] text-ink-2">Write to us</p>
          <a href={`mailto:${COMPANY.supportEmail}`} className="s-link mt-1 break-words text-[17px]">
            {COMPANY.supportEmail}
          </a>
        </div>
        <div className="s-foot__mark">
          <MitraMark size={160} className="h-[9vw] w-[9vw] min-h-16 min-w-16" />
          <span>mitra</span>
        </div>
        <TrackedLink href={join} event="signup_click" props={{ from: "footer" }} className="s-foot__go">
          <span className="text-[28px] font-bold leading-tight tracking-[-0.02em]">{joinLabel}</span>
          <Arrow className="s-arrow absolute bottom-5 right-5 h-12 w-12" />
        </TrackedLink>
      </footer>
    </div>
  );
}
