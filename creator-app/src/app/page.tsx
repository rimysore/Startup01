import type { Metadata } from "next";
import Link from "next/link";
import "./landing.css";
import { LEGAL_LINKS } from "@/components/SiteFooter";
import { MitraMark } from "@/components/brand";
import { Logo, ThemeToggle } from "@/components/ui";
import { LandingTracker } from "@/components/BetaWidgets";
import { AudienceSwitch, HeroArt, HeroCopy } from "@/components/landing/Hero";
import { DealStory } from "@/components/landing/DealStory";
import { OfferChecker } from "@/components/landing/OfferChecker";
import { JoinForm } from "@/components/landing/JoinForm";
import { Reveals, StickyNav } from "@/components/landing/Chrome";
import { COMPANY } from "@/lib/company";

/*
 * The landing page for the marketplace direction: paid deals between Kannada and English creators and the
 * businesses near them, Bengaluru first. Neutral by design: the logo is the only colour on the page.
 * Kannada lines are first drafts for a native speaker to check before launch.
 */

export const metadata: Metadata = {
  title: "Mitra: paid deals between Bengaluru creators and the businesses near them",
  description:
    "Mitra matches Kannada and English creators with brands and shops near them, checks every offer, and tracks each post with a promo code. Free for creators.",
};

const AREAS = [
  ["Jayanagar", "ಜಯನಗರ"],
  ["Malleshwaram", "ಮಲ್ಲೇಶ್ವರಂ"],
  ["Indiranagar", "ಇಂದಿರಾನಗರ"],
  ["Koramangala", "ಕೋರಮಂಗಲ"],
  ["Basavanagudi", "ಬಸವನಗುಡಿ"],
  ["Rajajinagar", "ರಾಜಾಜಿನಗರ"],
  ["HSR Layout", "ಎಚ್‌ಎಸ್‌ಆರ್ ಲೇಔಟ್"],
  ["JP Nagar", "ಜೆಪಿ ನಗರ"],
];

const FAQ = [
  ["Do I have to connect Instagram or YouTube?", "No. Join with your handles and the numbers you see in your own insights; they're shown as self-reported. Connecting an account later, read-only, gets you a Verified badge and puts you first in matches."],
  ["How does Mitra make money?", "Creators never pay: not to join, not to apply, not to get Verified. Mitra takes no cut of deals, so you keep every rupee of your fee and any customer bonus. Businesses pay a monthly plan for counting customers and finding creators. During the Bengaluru pilot it's all free."],
  ["How do I know an offer is real?", "Forward it to your Mitra inbox, send it on WhatsApp, or upload a screenshot. Mitra checks what the offer says and who sent it: scam patterns like registration fees, when their website was registered, whether the brand's official site matches, and what other creators reported. It shows its sources, so you decide."],
  ["Which platforms count?", "Any you post on: Instagram, YouTube, Facebook, ShareChat, Moj or Josh. Businesses care about whether your audience lives near them, not which app it's on."],
  ["Which languages and cities?", "Kannada and English, in Bengaluru first. One city done properly before we go wider."],
  ["Are paid posts labelled?", "Yes. Paid and gifted posts carry \"Paid partnership\" or #ad, as the ASCI rules require. It protects your audience's trust, and yours."],
  ["I use Mitra's Video Doctor today. What happens to it?", "It stays. Connected creators keep Video Doctor and Title Studio as part of their growth plan, alongside their deals."],
] as const;

function Tick() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 10.5 8 14.5 16 5.5" />
    </svg>
  );
}

export default function Home() {
  const areas = [...AREAS, ...AREAS];
  return (
    <div className="lp">
      <LandingTracker />
      <Reveals />

      <StickyNav>
        <div className="lp-wrap lp-nav__in">
          <Logo />
          <nav className="lp-nav__links" aria-label="Main">
            <a href="#how" className="lp-hide-sm">How it works</a>
            <a href="#offer" className="lp-hide-sm">Check an offer</a>
            <a href="#business" className="lp-hide-sm">For businesses</a>
            <Link href="/login">Sign in</Link>
            <ThemeToggle />
            <a href="#join" className="lp-btn" style={{ minHeight: 40, padding: "0 18px", fontSize: 15 }}>
              Join
            </a>
          </nav>
        </div>
      </StickyNav>

      {/* ---- Hero ---- */}
      <section className="lp-hero" aria-label="Mitra">
        <div className="lp-wrap lp-hero__grid">
          <div>
            <div className="lp-fade-in">
              <AudienceSwitch />
            </div>
            <HeroCopy />
          </div>
          <HeroArt />
        </div>
      </section>

      <div className="lp-marquee" aria-label="Starting in these Bengaluru areas">
        <div className="lp-marquee__row">
          {areas.map(([en, kn], i) => (
            <span key={i} className={i % 2 ? "kn" : ""} lang={i % 2 ? "kn" : "en"} aria-hidden={i >= AREAS.length}>
              {i % 2 ? kn : en}
            </span>
          ))}
        </div>
      </div>

      {/* ---- No access needed ---- */}
      <section className="lp-section">
        <div className="lp-wrap">
          <p className="lp-statement" data-reveal>
            Join without connecting a single account. <em>Add your handles and your own numbers. Connect later, read-only, to get Verified.</em>
          </p>
          <div className="lp-pills" data-reveal>
            {["Instagram", "YouTube", "Facebook", "ShareChat", "Moj", "Josh"].map((p) => (
              <span key={p} className="lp-chip">{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ---- How a deal moves ---- */}
      <section id="how" className="lp-section scroll-mt-16" style={{ paddingTop: 0 }} aria-labelledby="how-title">
        <div className="lp-wrap">
          <div data-reveal>
            <h2 id="how-title" className="lp-h2">How a deal moves.</h2>
            <p className="lp-kn-line kn" lang="kn">ಒಂದು ಡೀಲ್ ಹೇಗೆ ನಡೆಯುತ್ತದೆ</p>
          </div>
          <div className="mt-8">
            <DealStory />
          </div>
        </div>
      </section>

      {/* ---- Paste an offer ---- */}
      <section id="offer" className="lp-section scroll-mt-16" style={{ background: "var(--tint)" }} aria-labelledby="offer-title">
        <div className="lp-wrap">
          <div data-reveal>
            <h2 id="offer-title" className="lp-h2">Got an offer? Paste it.</h2>
            <p className="lp-kn-line kn" lang="kn">ಆಫರ್ ಅನ್ನು ಇಲ್ಲಿ ಹಾಕಿ, ಏನು ಕಾಣೆಯಾಗಿದೆ ನೋಡಿ</p>
            <p className="lp-lead mt-6">Most offers reach creators on WhatsApp or in DMs, and most leave out the fee, the date or how your video will be used. Try one.</p>
          </div>
          <div data-reveal>
            <OfferChecker />
          </div>
        </div>
      </section>

      {/* ---- Media kit ---- */}
      <section className="lp-section" aria-labelledby="kit-title">
        <div className="lp-wrap lp-two">
          <div data-reveal>
            <h2 id="kit-title" className="lp-h2">A media kit with honest numbers.</h2>
            <p className="lp-kn-line kn" lang="kn">ಪ್ರಾಮಾಣಿಕ ಸಂಖ್ಯೆಗಳ ಮೀಡಿಯಾ ಕಿಟ್</p>
            <ul className="lp-ticks">
              {[
                "One page for every platform you post on, ready to send to any brand.",
                "Numbers you enter are labelled self-reported. Nobody is fooled, so nobody is let down.",
                "Connect an account and those numbers turn Verified. Verified creators are matched first.",
                "You set your own rates. Mitra shows what similar creators nearby charge.",
              ].map((t) => (
                <li key={t}>
                  <Tick />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div data-reveal className="lp-card lp-kit">
            <div className="flex items-center gap-4">
              <span className="lp-av" style={{ width: 56, height: 56, fontSize: 18 }}>YN</span>
              <div className="min-w-0 flex-1">
                <p className="text-[19px] font-semibold">Your name</p>
                <p className="text-[14.5px]" style={{ color: "var(--ink-2)" }}>Food and local finds · South Bengaluru</p>
              </div>
              <span className="lp-label">Example</span>
            </div>
            <div className="mt-4">
              {(
                [
                  ["Instagram", "18.4K", "followers", false],
                  ["YouTube", "6.2K", "subscribers", true],
                  ["ShareChat", "3.1K", "followers", false],
                ] as const
              ).map(([p, n, unit, v]) => (
                <div key={p} className="lp-kit__row">
                  <span>
                    <span className="block font-semibold">{p}</span>
                    <span className="lp-label">{unit}</span>
                  </span>
                  <span className="lp-kit__num">{n}</span>
                  <span className={`lp-chip ${v ? "lp-chip--ok" : ""}`}>
                    {v && <Tick />}
                    {v ? "Verified" : "Self-reported"}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="lp-chip kn">ಕನ್ನಡ</span>
              <span className="lp-chip">English</span>
              <span className="lp-chip">Reel from ₹4,000</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---- For businesses (the inverted chapter) ---- */}
      <section id="business" className="lp-invert lp-section scroll-mt-16" aria-labelledby="biz-title">
        <div className="lp-wrap">
          <div data-reveal className="lp-two" style={{ alignItems: "end" }}>
            <div>
              <h2 id="biz-title" className="lp-h2">From a goal to customers at your door.</h2>
              <p className="lp-kn-line kn" lang="kn">ಗುರಿಯಿಂದ ನಿಮ್ಮ ಅಂಗಡಿಗೆ ಬರುವ ಗ್ರಾಹಕರವರೆಗೆ</p>
            </div>
            <p className="lp-lead">
              For cafés, salons, gyms and shops. You don&apos;t need to know any influencers. Say what you want and what you can spend. Mitra suggests creators whose audience lives near you, and every post gets its own code
              so you can count what it brought in.
            </p>
          </div>
          <div className="lp-flow">
            <div data-reveal>
              <h3>Your brief</h3>
              <p className="lp-sub3">Three answers, two minutes.</p>
              <div className="lp-flow__body">
                <div className="lp-field"><span>Goal</span><b className="font-semibold">Weekday lunch orders</b></div>
                <div className="lp-field"><span>Budget</span><b className="font-semibold">₹15,000</b></div>
                <div className="lp-field"><span>Area</span><b className="font-semibold">Jayanagar · 3 km</b></div>
              </div>
            </div>
            <div data-reveal style={{ ["--i" as string]: 1 }}>
              <h3>Matched creators</h3>
              <p className="lp-sub3">A few that fit, with the reason for each.</p>
              <div className="lp-flow__body">
                {[
                  ["SR", "Food · Kannada · Verified"],
                  ["AK", "Lifestyle · Kannada + English"],
                  ["MN", "Food · Kannada · lives 1 km away"],
                ].map(([i, t]) => (
                  <div key={i} className="lp-match">
                    <span className="lp-av">{i}</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div data-reveal style={{ ["--i" as string]: 2 }}>
              <h3>Results</h3>
              <p className="lp-sub3">Counted at your counter, not guessed.</p>
              <div className="lp-flow__body">
                <div className="lp-field" style={{ display: "block", padding: 18 }}>
                  <span className="lp-big block" style={{ color: "var(--ink)" }}>38</span>
                  <span className="mt-2 block" style={{ color: "var(--ink-2)" }}>customers used code DOSA10</span>
                </div>
                <div className="lp-field"><span>Cost per customer</span><b className="font-semibold">₹158</b></div>
              </div>
            </div>
          </div>
          <p className="mt-8 text-[14px]" style={{ color: "var(--ink-3)" }}>
            Example campaign: ₹6,000 spent, 38 customers. Free for businesses during the Bengaluru pilot.
          </p>
        </div>
      </section>

      {/* ---- What we promise ---- */}
      <section className="lp-section" aria-labelledby="rules-title">
        <div className="lp-wrap">
          <div data-reveal>
            <h2 id="rules-title" className="lp-h2">Three promises.</h2>
            <p className="lp-kn-line kn" lang="kn">ನಮ್ಮ ಮೂರು ಭರವಸೆಗಳು</p>
          </div>
          <div className="lp-rules">
            {[
              ["Free for creators.", "No joining fee, no yearly plan, and Mitra takes no cut: your fee and every customer bonus are yours."],
              ["Your accounts stay yours.", "Join without connecting anything. If you connect later, it's read-only: Mitra can never post for you."],
              ["Kannada and English, Bengaluru first.", "One city and two languages, done properly, before we go anywhere else."],
            ].map(([t, b], i) => (
              <div key={t} data-reveal style={{ ["--i" as string]: i }}>
                <h3>{t}</h3>
                <p>{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- FAQ ---- */}
      <section className="lp-section" style={{ paddingTop: 0 }} aria-labelledby="faq-title">
        <div className="lp-wrap lp-faq">
          <div className="lp-faq__head">
            <h2 id="faq-title" className="lp-h2">Questions.</h2>
            <p className="lp-kn-line kn" lang="kn">ಪ್ರಶ್ನೆಗಳು</p>
          </div>
          <div>
            {FAQ.map(([q, a]) => (
              <details key={q} name="faq">
                <summary>
                  {q}
                  <span className="lp-faq__x" aria-hidden />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Join ---- */}
      <section id="join" className="lp-section scroll-mt-16" style={{ background: "var(--tint)" }} aria-labelledby="join-title">
        <div className="lp-wrap lp-join">
          <div data-reveal>
            <h2 id="join-title" className="lp-h2">Be first in your area.</h2>
            <p className="lp-kn-line kn" lang="kn">ನಿಮ್ಮ ಏರಿಯಾದಲ್ಲಿ ಮೊದಲಿಗರಾಗಿ</p>
            <p className="lp-lead mt-6">
              The pilot starts with a small group of creators and local businesses in Bengaluru, so every deal gets real attention. Tell us who you are and where; we&apos;ll write when
              your area opens.
            </p>
          </div>
          <div data-reveal>
            <JoinForm contactEmail={COMPANY.supportEmail} />
          </div>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="lp-foot">
        <div className="lp-wrap">
          <div className="lp-foot__top">
            <div className="flex items-end gap-[1.5vw]">
              <MitraMark size={200} className="h-[13vw] max-h-[200px] w-[13vw] max-w-[200px] min-h-16 min-w-16" />
              <span className="lp-foot__word">mitra</span>
            </div>
            <div className="grid gap-4">
              <p className="max-w-[30ch] text-[17px]" style={{ color: "var(--ink-2)" }}>
                Mitra means friend. Built for the creators and shops of Bengaluru.
              </p>
              <a href={`mailto:${COMPANY.supportEmail}`} className="lp-link text-[17px] font-semibold">{COMPANY.supportEmail}</a>
            </div>
          </div>
          <div className="lp-foot__base">
            <nav className="lp-foot__links" aria-label="Legal">
              {LEGAL_LINKS.map((l) => (
                <Link key={l.href} href={l.href} className="lp-link">{l.label}</Link>
              ))}
            </nav>
            <span>© 2026 {COMPANY.legalName.startsWith("[") ? COMPANY.product : COMPANY.legalName}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
