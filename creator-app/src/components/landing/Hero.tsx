"use client";

import { useEffect } from "react";
import { MARKETPLACE } from "@/lib/marketplace/flag";
import { setAudience, useAudience, type Audience } from "./audience";
import { OfferStack } from "./OfferStack";

// Kannada lines are a first draft: a native speaker checks them before launch. Kannada leads, English follows.
const COPY: Record<Audience, { title: [string, string]; kn: string; sub: string; cta: string; href: string }> = {
  creator: {
    title: ["Forward any offer.", "Know if it's real."],
    kn: "ಯಾವುದೇ ಕೊಲಾಬ್ ಆಫರ್ ಬಂದರೆ ಮಿತ್ರಗೆ ಫಾರ್ವರ್ಡ್ ಮಾಡಿ. ಅದು ನಿಜವೋ ಮೋಸವೋ ನಾವು ಹೇಳುತ್ತೇವೆ.",
    sub: "Send a DM screenshot, an email or a WhatsApp message to Mitra. It flags registration-fee scams, fake brands and missing terms, and drafts your reply. Free forever, and you keep 100% of what you earn.",
    cta: "Join the pilot, free",
    href: "#join",
  },
  business: {
    title: ["See the customers", "each creator brings."],
    kn: "ಪ್ರತಿ ಕ್ರಿಯೇಟರ್ ಪೋಸ್ಟ್‌ನಿಂದ ಎಷ್ಟು ಗ್ರಾಹಕರು ಬಂದರು ಅಂತ ನೋಡಿ.",
    sub: "Every creator post gets a coupon. Customers show it at your counter, your staff tap redeem, and you see customers and cost per customer for each creator, paid or barter. Free.",
    cta: "Sign up your business, free",
    href: "/m/start?role=business",
  },
};

export function Arrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  );
}

export function AudienceSwitch() {
  const a = useAudience();
  return (
    <div className="lp-switch" data-on={a} role="group" aria-label="Who are you?">
      <span className="lp-switch__pill" aria-hidden />
      <button type="button" aria-pressed={a === "creator"} onClick={() => setAudience("creator")}>
        I&apos;m a creator
      </button>
      <button type="button" aria-pressed={a === "business"} onClick={() => setAudience("business")}>
        I run a business
      </button>
    </div>
  );
}

export function HeroCopy() {
  const a = useAudience();
  const c = COPY[a];
  // ?for=business opens the page on the business side (for links shared with shops).
  useEffect(() => {
    if (new URLSearchParams(location.search).get("for") === "business") setAudience("business");
  }, []);
  return (
    <>
      <p className="lp-hero__kn lp-kn-line kn lp-fade-in" lang="kn" style={{ ["--l" as string]: 0 }}>
        {c.kn}
      </p>
      <h1 className="lp-display" key={a}>
        {c.title.map((line, i) => (
          <span key={line} className="lp-line">
            <span style={{ ["--l" as string]: i }}>{line}</span>
          </span>
        ))}
      </h1>
      <p className="lp-hero__sub lp-lead lp-fade-in" style={{ ["--l" as string]: 2 }}>
        {c.sub}
      </p>
      <div className="lp-hero__act lp-fade-in" style={{ ["--l" as string]: 3 }}>
        {/* Launch: creators join the pilot waitlist; businesses sign up (the waitlist when the marketplace is off). */}
        <a href={a === "business" && !MARKETPLACE ? "#join" : c.href} className="lp-btn">
          {c.cta} <Arrow />
        </a>
        <a href={a === "creator" ? "#offer" : "#business"} className="lp-btn lp-btn--ghost">
          {a === "creator" ? "Try the offer check" : "See how counting works"}
        </a>
      </div>
      <p className="lp-hero__note lp-fade-in" style={{ ["--l" as string]: 4 }}>
        {a === "creator" ? "Free forever · No account access needed · ಕನ್ನಡ and English" : "Free during the Bengaluru pilot · Paid or barter · ಕನ್ನಡ and English"}
      </p>
    </>
  );
}

/** The hero picture: the product itself, as the person on each side would first see it. Clearly an example. */
export function HeroArt() {
  const a = useAudience();
  if (a === "business")
    return (
      <div className="lp-hero__art lp-fade-in" style={{ ["--l" as string]: 2 }}>
        <div className="lp-card p-6">
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-semibold">Creator posts this month</p>
            <span className="lp-label">Example</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              ["Paid posts", "41", "₹154 per customer"],
              ["Barter posts", "9", "for one lunch for two"],
            ].map(([k, n, sub]) => (
              <div key={k} className="lp-field grid gap-1" style={{ background: "var(--tint)", display: "grid" }}>
                <span>{k}</span>
                <b className="lp-big" style={{ color: "var(--ink)", fontSize: 40 }}>{n}</b>
                <span className="text-[13.5px]" style={{ color: "var(--ink-2)" }}>customers · {sub}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-2">
            {[
              ["SR", "Sita · RUCHI-SR", "₹3,000 + ₹30 per customer", "27"],
              ["AK", "Arun · RUCHI-AK", "₹2,500", "14"],
              ["MN", "Meena · RUCHI-MN", "Barter: lunch for two", "9"],
            ].map(([i, who, deal, n]) => (
              <div key={i} className="lp-match" style={{ background: "var(--tint)" }}>
                <span className="lp-av" style={{ background: "var(--card)" }}>{i}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{who}</span>
                  <span className="block text-[13.5px]" style={{ color: "var(--ink-2)" }}>{deal}</span>
                </span>
                <span className="text-right">
                  <span className="block text-[18px] font-semibold tabular-nums">{n}</span>
                  <span className="block text-[12px]" style={{ color: "var(--ink-2)" }}>customers</span>
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[13px]" style={{ color: "var(--ink-3)" }}>
            Counted when customers show the coupon at your counter.
          </p>
        </div>
      </div>
    );
  return (
    <div className="lp-hero__art lp-fade-in" style={{ ["--l" as string]: 2 }}>
      <OfferStack />
    </div>
  );
}
