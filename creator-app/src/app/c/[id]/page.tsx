import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import "../../landing.css";
import "../../m/m.css";
import { MitraMark } from "@/components/brand";
import { RedeemBox } from "@/components/m/TrackParts";
import { MARKETPLACE } from "@/lib/marketplace/flag";
import { strings } from "@/lib/marketplace/i18n";
import { couponView } from "@/lib/marketplace/track";

// A coupon changes the moment staff redeem it; read per request.
export const instant = false;

export const metadata: Metadata = { title: "Your coupon", robots: { index: false } };

/** The customer's coupon: the business, the offer and the code, and the staff-only redeem box. English and Kannada. */
export default function CouponPage({ params }: PageProps<"/c/[id]">) {
  return (
    <Suspense fallback={<div className="lp min-h-screen" aria-busy="true" />}>
      <Coupon params={params} />
    </Suspense>
  );
}

async function Coupon({ params }: { params: PageProps<"/c/[id]">["params"] }) {
  // Per request (redeemed state changes); before the flag check so the route is never prerendered.
  await connection();
  if (!MARKETPLACE) notFound();
  const c = await couponView((await params).id);
  if (!c) notFound();
  const en = strings("en").coupon;
  const kn = strings("kn").coupon;
  const both = (k: keyof typeof en) => (
    <>
      {en[k]}
      <span className="kn block text-[0.85em]" lang="kn" style={{ color: "var(--ink-2)" }}>
        {kn[k]}
      </span>
    </>
  );
  return (
    <div className="lp mk min-h-screen">
      <main className="lp-wrap mk-coupon">
        <section className="lp-card mk-coupon__card">
          <p className="lp-label">{c.business.area ? `${c.business.name} · ${c.business.area}` : c.business.name}</p>
          <h1 className="mk-coupon__offer">{c.offer}</h1>
          <p className="mk-coupon__code" aria-label="Code">
            {c.code}
          </p>
          <p className="text-[16px] font-semibold">{c.redeemedAt ? both("redeemed") : c.ended ? both("ended") : both("show")}</p>
          <p className="mt-1 text-[14px]" style={{ color: "var(--ink-2)" }}>
            {en.from} {c.creatorName}
          </p>
          {!c.redeemedAt && !c.ended && (
            <RedeemBox id={c.id} pinReady={c.pinReady} locked={c.locked} en={en} kn={kn} />
          )}
          {c.destinationUrl && (
            <a href={c.destinationUrl} className="lp-btn lp-btn--ghost mt-6" rel="noopener noreferrer" style={{ minHeight: 44 }}>
              {en.visit} {c.business.name}
            </a>
          )}
        </section>
        <p className="mk-coupon__note">{en.note}</p>
        <p className="mk-coupon__brand">
          <MitraMark size={18} /> Mitra
        </p>
      </main>
    </div>
  );
}
