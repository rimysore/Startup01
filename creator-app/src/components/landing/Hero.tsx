"use client";

import { useEffect } from "react";
import { MARKETPLACE } from "@/lib/marketplace/flag";
import { setAudience, useAudience, type Audience } from "./audience";
import { OfferStack } from "./OfferStack";

// Kannada lines are a first draft: a native speaker checks them before launch.
const COPY: Record<Audience, { title: [string, string]; kn: string; sub: string; cta: string }> = {
  creator: {
    title: ["Get paid by brands", "and shops near you."],
    kn: "ನಿಮ್ಮ ಹತ್ತಿರದ ಬ್ರ್ಯಾಂಡ್‌ಗಳು ಮತ್ತು ಅಂಗಡಿಗಳಿಂದ ಹಣ ಪಡೆಯಿರಿ.",
    sub: "Mitra finds paid deals for Kannada and English creators in Bengaluru, checks every offer before you say yes, and keeps your deals in one place. Free for creators, and you keep your whole fee.",
    cta: "Join as a creator",
  },
  business: {
    title: ["Local creators who", "bring real customers."],
    kn: "ನಿಜವಾದ ಗ್ರಾಹಕರನ್ನು ಕರೆತರುವ ಸ್ಥಳೀಯ ಕ್ರಿಯೇಟರ್‌ಗಳು.",
    sub: "Tell Mitra your goal, budget and area. Get a short list of Kannada and English creators whose audience lives near you, and a promo code that shows what each post brought in.",
    cta: "Join as a business",
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
      <h1 className="lp-display" key={a}>
        {c.title.map((line, i) => (
          <span key={line} className="lp-line">
            <span style={{ ["--l" as string]: i }}>{line}</span>
          </span>
        ))}
      </h1>
      <p className="lp-hero__kn lp-kn-line kn lp-fade-in" lang="kn" style={{ ["--l" as string]: 1 }}>
        {c.kn}
      </p>
      <p className="lp-hero__sub lp-lead lp-fade-in" style={{ ["--l" as string]: 2 }}>
        {c.sub}
      </p>
      <div className="lp-hero__act lp-fade-in" style={{ ["--l" as string]: 3 }}>
        {/* With the marketplace on, sign up straight away; otherwise join the pilot waitlist below. */}
        <a href={MARKETPLACE ? `/m/start?role=${a}` : "#join"} className="lp-btn">
          {c.cta} <Arrow />
        </a>
        <a href="#how" className="lp-btn lp-btn--ghost">
          See how a deal works
        </a>
      </div>
      <p className="lp-hero__note lp-fade-in" style={{ ["--l" as string]: 4 }}>
        {a === "creator" ? "Free for creators · No account access needed · ಕನ್ನಡ and English" : "Free during the Bengaluru pilot · Creators within your area · ಕನ್ನಡ and English"}
      </p>
    </>
  );
}

function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 10.5 8 14.5 16 5.5" />
    </svg>
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
            <p className="text-[15px] font-semibold">Your brief</p>
            <span className="lp-label">Example</span>
          </div>
          <div className="mt-4 grid gap-2">
            {[
              ["Goal", "More weekday lunch orders"],
              ["Budget", "₹15,000"],
              ["Area", "Jayanagar, within 3 km"],
            ].map(([k, v]) => (
              <div key={k} className="lp-field" style={{ background: "var(--tint)" }}>
                <span>{k}</span>
                <b className="font-semibold">{v}</b>
              </div>
            ))}
          </div>
          <p className="mt-6 text-[15px] font-semibold">3 creators matched</p>
          <div className="mt-3 grid gap-2">
            {[
              ["SR", "Food · Kannada · 24K", "Verified", "Most of her viewers live in South Bengaluru"],
              ["AK", "Lifestyle · Kannada + English · 61K", "Verified", "Posts weekday food finds"],
              ["MN", "Food · Kannada · 9K", "Self-reported", "Lives 1 km from you"],
            ].map(([i, who, tag, why]) => (
              <div key={i} className="lp-match" style={{ background: "var(--tint)" }}>
                <span className="lp-av" style={{ background: "var(--card)" }}>{i}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{who}</span>
                  <span className="block text-[13.5px]" style={{ color: "var(--ink-2)" }}>{why}</span>
                </span>
                <span className={`lp-chip ${tag === "Verified" ? "lp-chip--ok" : ""}`} style={{ background: "var(--card)" }}>
                  {tag === "Verified" && <Check />}
                  {tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  return (
    <div className="lp-hero__art lp-fade-in" style={{ ["--l" as string]: 2 }}>
      <OfferStack />
    </div>
  );
}
