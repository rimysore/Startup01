import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import "../../landing.css";
import "../../m/m.css";
import { MitraMark } from "@/components/brand";
import { MARKETPLACE, PLATFORM_LABEL, type Platform } from "@/lib/marketplace/flag";
import { strings } from "@/lib/marketplace/i18n";
import { getPublicKit, isVerified } from "@/lib/marketplace/store";

// Kits change whenever their creator saves; read per request.
export const instant = false;

const compact = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1).replace(/\.0$/, "")}K` : String(n));
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

async function load(slug: string) {
  if (!MARKETPLACE) notFound();
  // Kits change whenever their creator saves, so they're read per request.
  await connection();
  const kit = await getPublicKit(slug);
  if (!kit) notFound();
  return kit;
}

export async function generateMetadata({ params }: PageProps<"/kit/[slug]">): Promise<Metadata> {
  const { profile } = await load((await params).slug);
  return { title: `${profile.displayName} · media kit`, description: profile.bio ?? undefined, robots: { index: false } };
}

/** A creator's public media kit: shareable with any brand, honest about which numbers are verified. */
export default function PublicKitPage({ params }: PageProps<"/kit/[slug]">) {
  return (
    <Suspense fallback={<div className="lp min-h-screen" aria-busy="true" />}>
      <PublicKit params={params} />
    </Suspense>
  );
}

async function PublicKit({ params }: { params: PageProps<"/kit/[slug]">["params"] }) {
  const { profile, handles } = await load((await params).slug);
  const s = strings(profile.languages.includes("kn") && !profile.languages.includes("en") ? "kn" : "en");
  const initials = profile.displayName
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="lp mk min-h-screen">
      <main className="lp-wrap mk-main" style={{ maxWidth: 880 }}>
        <div className="mk-kit-hero">
          <span className="lp-av">{initials}</span>
          <div className="min-w-0 flex-1">
            <h1 className="mk-h1">{profile.displayName}</h1>
            {profile.bio && <p className="mk-sub">{profile.bio}</p>}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {[profile.area, profile.city].filter(Boolean).length > 0 && <span className="lp-chip">{[profile.area, profile.city].filter(Boolean).join(", ")}</span>}
          {profile.niches.map((n) => (
            <span key={n} className="lp-chip">
              {s.niche[n] ?? n}
            </span>
          ))}
          {profile.languages.map((l) => (
            <span key={l} className={`lp-chip ${l === "kn" ? "kn" : ""}`}>
              {l === "kn" ? "ಕನ್ನಡ" : "English"}
            </span>
          ))}
        </div>

        {handles.length > 0 && (
          <div className="mk-nums">
            {handles.map((h) => {
              const v = isVerified(h);
              return (
                <div key={h.id} className="mk-num">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{PLATFORM_LABEL[h.platform as Platform] ?? h.platform}</span>
                    <span className={`lp-chip ${v ? "lp-chip--ok" : ""}`}>{v ? s.common.verified : s.common.selfReported}</span>
                  </div>
                  <p className="mk-stat mt-4">{h.followers != null ? compact(h.followers) : "–"}</p>
                  <p className="lp-label mt-1">
                    @{h.handle}
                    {h.avgViews != null ? ` · ${compact(h.avgViews)} avg views` : ""}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {profile.rates.length > 0 && (
          <section className="mt-10">
            <h2 className="mk-h2">{s.publicKit.rates}</h2>
            <div className="mt-3 grid gap-2">
              {profile.rates.map((r) => (
                <div key={r.deliverable} className="lp-deal__row">
                  <span>{s.deliverable[r.deliverable as keyof typeof s.deliverable] ?? r.deliverable}</span>
                  <b>
                    {s.publicKit.from} {inr(r.priceInr)}
                  </b>
                </div>
              ))}
            </div>
          </section>
        )}

        {profile.contactEmail && (
          <a href={`mailto:${profile.contactEmail}?subject=${encodeURIComponent(`Collaboration with ${profile.displayName}`)}`} className="lp-btn mt-10">
            {s.publicKit.contact} {profile.displayName.split(" ")[0]}
          </a>
        )}

        <p className="lp-label mt-10 max-w-[60ch]">{s.publicKit.selfNote}</p>
        <Link href="/" className="mt-8 inline-flex items-center gap-2 text-[14px]" style={{ color: "var(--ink-3)" }}>
          <MitraMark size={20} /> {s.publicKit.made}
        </Link>
      </main>
    </div>
  );
}
