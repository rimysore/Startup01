import type { Metadata } from "next";
import Link from "next/link";
import "./landing.css";
import { LEGAL_LINKS } from "@/components/SiteFooter";
import { MitraMark } from "@/components/brand";
import { Logo, ThemeToggle } from "@/components/ui";
import { LandingTracker } from "@/components/BetaWidgets";
import { Arrow, AudienceSwitch, HeroArt, HeroCopy } from "@/components/landing/Hero";
import { DealStory } from "@/components/landing/DealStory";
import { OfferChecker } from "@/components/landing/OfferChecker";
import { JoinForm } from "@/components/landing/JoinForm";
import { Reveals, StickyNav } from "@/components/landing/Chrome";
import { COMPANY, SUPPORT_WHATSAPP, TEAM } from "@/lib/company";

/*
 * The landing page for the marketplace direction: paid deals between Kannada and English creators and the
 * businesses near them, Bengaluru first. Neutral by design: the logo is the only colour on the page.
 * Kannada lines are first drafts for a native speaker to check before launch.
 */

export const metadata: Metadata = {
  title: "Mitra (beta): find collabs that fit you, and creators who bring customers",
  description:
    "For Bengaluru's Kannada and English creators: every brand, affiliate program and local business that fits your profile, in one place. For cafés, salons and gyms: creators matched to you, and the customers each post brings, counted at your counter.",
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
  ["How does Mitra find collabs for me?", "You make one profile: your area, the kind of content you make, your languages and your numbers. Every brand, affiliate program and local business on Mitra shows up for you, best fit first, with the reasons (same area, matches your content, looking for creators now). Tap \"Interested\" and the business sees your profile. New businesses appear as soon as they join."],
  ["Is this the finished app?", "No, it's a beta. We're running a pilot in Bengaluru and changing things every week from what creators and owners tell us. Everything is free during the pilot."],
  ["How does Mitra make money?", "Creators never pay: not to join, not to check offers, not to get Verified. Mitra takes no cut of deals, so creators keep every rupee of their fee and any customer bonus. Businesses pay a monthly plan for counting customers and finding creators. During the Bengaluru pilot it's all free."],
  ["How do I know an offer is real?", "Forward it to Mitra on WhatsApp or email, or upload a screenshot. Mitra checks what the offer says and who sent it: scam patterns like registration fees, when their website was registered, whether the brand's official site matches, and what other creators reported. It shows its sources, so you decide."],
  ["Will the customer count be right?", "Each customer shows the creator's coupon on their phone and your staff redeem it with your counter PIN, or type the code in counter mode. Nothing is guessed from views. You can download your daily counts and check them against your bill book."],
  ["Does it work for barter deals?", "Yes. Track any creator post, paid or barter, whether you found the creator on Mitra or not. Seeing a free-meal post next to a paid one is usually the first useful thing an owner learns."],
  ["Do I have to connect Instagram or YouTube?", "No. Join with your handles and the numbers you see in your own insights; they're shown as self-reported. Connecting YouTube or an Instagram professional account, read-only, fetches your public numbers (followers, posts, views, likes on recent posts), gives you a Verified badge and puts you higher in matches. Mitra never posts for you. Other apps stay self-reported."],
  ["Which languages and cities?", "Kannada and English, in Bengaluru first. One city done properly before we go wider."],
  ["Are paid posts labelled?", "Yes. Paid and gifted posts carry \"Paid partnership\" or #ad, as the ASCI rules require. It protects your audience's trust, and yours."],
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
          <span className="flex items-center gap-2">
            <Logo />
            <span className="lp-beta lp-nav__beta">Beta</span>
          </span>
          <nav className="lp-nav__links" aria-label="Main">
            <a href="#collabs" className="lp-hide-sm">For creators</a>
            <a href="#business" className="lp-hide-sm">For businesses</a>
            <a href="#team" className="lp-hide-sm">Who we are</a>
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

      {/* ---- Two front doors ---- */}
      <section id="collabs" className="lp-section scroll-mt-16" aria-labelledby="doors-title">
        <div className="lp-wrap">
          <div data-reveal>
            <p className="lp-kn-line kn" lang="kn">ಎರಡು ಬಾಗಿಲುಗಳು, ಒಂದೇ ಮಿತ್ರ</p>
            <h2 id="doors-title" className="lp-h2">One for creators. One for the places they post about.</h2>
          </div>
          <div className="lp-doors">
            <a href="#join" className="lp-card lp-door" data-reveal>
              <span className="lp-label">For creators · ಕ್ರಿಯೇಟರ್‌ಗಳಿಗೆ</span>
              <h3>Collabs matched to you</h3>
              <p>
                One profile: your area, your content, your verified numbers. See every brand, affiliate program and local business that fits you, with why, and tap &quot;Interested&quot;. Got an offer
                elsewhere? Mitra checks it for scams too.
              </p>
              <span className="lp-door__go">Join the pilot <Arrow /></span>
            </a>
            <a href="#business" className="lp-card lp-door" data-reveal style={{ ["--i" as string]: 1 }}>
              <span className="lp-label">For businesses · ವ್ಯಾಪಾರಗಳಿಗೆ</span>
              <h3>Creators who fit you</h3>
              <p>Add your business and creators near you see it straight away. See who&apos;s interested and who fits your area, then give each post a coupon and count the customers it brings.</p>
              <span className="lp-door__go">See how it works <Arrow /></span>
            </a>
          </div>
        </div>
      </section>

      {/* ---- How a deal moves ---- */}
      <section id="how" className="lp-section scroll-mt-16" style={{ paddingTop: 0 }} aria-labelledby="how-title">
        <div className="lp-wrap">
          <div data-reveal>
            <p className="lp-kn-line kn" lang="kn">ಒಂದು ಡೀಲ್ ಹೇಗೆ ನಡೆಯುತ್ತದೆ</p>
            <h2 id="how-title" className="lp-h2">How a deal moves.</h2>
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
            <p className="lp-kn-line kn" lang="kn">ಆಫರ್ ಅನ್ನು ಇಲ್ಲಿ ಹಾಕಿ, ಏನು ಕಾಣೆಯಾಗಿದೆ ನೋಡಿ</p>
            <h2 id="offer-title" className="lp-h2">Got an offer? Try it here.</h2>
            <p className="lp-lead mt-6">
              Most offers reach creators on WhatsApp or in DMs, and many ask for a &quot;registration fee&quot; or leave out the fee, the date or how your video will be used. Paste one below. In the app you can
              also forward it on WhatsApp or email, or upload a screenshot, and Mitra checks who sent it too.
            </p>
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
            <p className="lp-kn-line kn" lang="kn">ಪ್ರಾಮಾಣಿಕ ಸಂಖ್ಯೆಗಳ ಮೀಡಿಯಾ ಕಿಟ್</p>
            <h2 id="kit-title" className="lp-h2">A media kit with honest numbers.</h2>
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
              <p className="lp-kn-line kn" lang="kn">ಪ್ರತಿ ಕ್ರಿಯೇಟರ್ ಪೋಸ್ಟ್‌ನಿಂದ ಎಷ್ಟು ಗ್ರಾಹಕರು ಬಂದರು</p>
              <h2 id="biz-title" className="lp-h2">Count the customers, not the likes.</h2>
            </div>
            <p className="lp-lead">
              For cafés, salons, gyms and shops that already work with creators, paid or for a free meal. Mitra gives every post a coupon your customers show at the counter, so you finally know which creator
              brings people in, and what each one costs you.
            </p>
          </div>
          <div className="lp-flow">
            <div data-reveal>
              <h3>1 · Track a post</h3>
              <p className="lp-sub3">Any creator, paid or barter. Thirty seconds.</p>
              <div className="lp-flow__body">
                <div className="lp-field"><span>Creator</span><b className="font-semibold">Sita · @sita.eats</b></div>
                <div className="lp-field"><span>Deal</span><b className="font-semibold">₹3,000 + ₹30 a customer</b></div>
                <div className="lp-field"><span>Customers get</span><b className="font-semibold">10% off the bill</b></div>
              </div>
            </div>
            <div data-reveal style={{ ["--i" as string]: 1 }}>
              <h3>2 · Customers show the coupon</h3>
              <p className="lp-sub3">From the creator&apos;s link, on their phone.</p>
              <div className="lp-flow__body">
                <div className="lp-field" style={{ display: "block", padding: 18, textAlign: "center" }}>
                  <span className="block text-[14px]" style={{ color: "var(--ink-2)" }}>10% off your bill</span>
                  <span className="mt-1 block font-semibold" style={{ color: "var(--ink)", letterSpacing: "0.04em", fontSize: "clamp(28px, 3vw, 40px)", whiteSpace: "nowrap" }}>RUCHI-SR</span>
                  <span className="mt-1 block text-[13px]" style={{ color: "var(--ink-2)" }}>Staff: enter PIN to redeem</span>
                </div>
              </div>
            </div>
            <div data-reveal style={{ ["--i" as string]: 2 }}>
              <h3>3 · You see who brought whom</h3>
              <p className="lp-sub3">Paid and barter side by side.</p>
              <div className="lp-flow__body">
                <div className="lp-field" style={{ display: "block", padding: 18 }}>
                  <span className="lp-big block" style={{ color: "var(--ink)" }}>27</span>
                  <span className="mt-2 block" style={{ color: "var(--ink-2)" }}>customers used RUCHI-SR</span>
                </div>
                <div className="lp-field"><span>Cost per customer</span><b className="font-semibold">₹141</b></div>
              </div>
            </div>
          </div>
          <p className="mt-8 text-[14px]" style={{ color: "var(--ink-3)" }}>
            Example: ₹3,000 + ₹30 × 27 customers = ₹3,810, or ₹141 a customer. When you want new creators, Mitra suggests ones whose audience lives near you. Free during the Bengaluru pilot.
          </p>
        </div>
      </section>

      {/* ---- What we promise ---- */}
      <section className="lp-section" aria-labelledby="rules-title">
        <div className="lp-wrap">
          <div data-reveal>
            <p className="lp-kn-line kn" lang="kn">ನಮ್ಮ ಮೂರು ಭರವಸೆಗಳು</p>
            <h2 id="rules-title" className="lp-h2">Three promises.</h2>
          </div>
          <div className="lp-rules">
            {[
              ["Free for creators.", "No joining fee, no yearly plan, and Mitra takes no cut: your fee and every customer bonus are yours."],
              ["Counted, never guessed.", "A customer is counted only when they show the coupon at your counter. You can check every day against your bill book."],
              ["ಕನ್ನಡ first, then English.", "Bengaluru first, one neighbourhood at a time, with support in Kannada from day one."],
            ].map(([t, b], i) => (
              <div key={t} data-reveal style={{ ["--i" as string]: i }}>
                <h3>{t}</h3>
                <p>{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Who we are ---- */}
      <section id="team" className="lp-section scroll-mt-16" style={{ paddingTop: 0 }} aria-labelledby="team-title">
        <div className="lp-wrap lp-two" style={{ alignItems: "start" }}>
          <div data-reveal>
            <p className="lp-kn-line kn" lang="kn">ಮಿತ್ರದ ಹಿಂದೆ ಯಾರು</p>
            <h2 id="team-title" className="lp-h2">Who&apos;s behind Mitra.</h2>
            <p className="lp-lead mt-6">
              A small team building for Bengaluru&apos;s creators and the shops they post about. Write to us in Kannada or English; a person answers.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {SUPPORT_WHATSAPP && (
                <a href={`https://wa.me/${SUPPORT_WHATSAPP}`} className="lp-btn" target="_blank" rel="noopener noreferrer">
                  WhatsApp us
                </a>
              )}
              <a href={`mailto:${COMPANY.supportEmail}`} className={SUPPORT_WHATSAPP ? "lp-btn lp-btn--ghost" : "lp-btn"}>
                {COMPANY.supportEmail}
              </a>
            </div>
          </div>
          <div className="grid gap-3" data-reveal>
            {TEAM.map((p) => (
              <div key={p.name} className="lp-card flex items-start gap-4 p-5">
                <span className="lp-av" style={{ width: 48, height: 48 }}>
                  {p.name
                    .split(/\s+/)
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block text-[17px] font-semibold">{p.name}</span>
                  <span className="lp-label block">{p.role}</span>
                  <span className="mt-1 block text-[15px]" style={{ color: "var(--ink-2)" }}>{p.line}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- FAQ ---- */}
      <section className="lp-section" style={{ paddingTop: 0 }} aria-labelledby="faq-title">
        <div className="lp-wrap lp-faq">
          <div className="lp-faq__head">
            <p className="lp-kn-line kn" lang="kn">ಪ್ರಶ್ನೆಗಳು</p>
            <h2 id="faq-title" className="lp-h2">Questions.</h2>
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
            <p className="lp-kn-line kn" lang="kn">ನಿಮ್ಮ ಏರಿಯಾದಲ್ಲಿ ಮೊದಲಿಗರಾಗಿ</p>
            <h2 id="join-title" className="lp-h2">Be first in your area.</h2>
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
