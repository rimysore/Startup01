import Link from "next/link";
import { MTop } from "@/components/m/MTop";
import { marketPageFor } from "@/lib/marketplace/page";
import { dealTotals, listDeals } from "@/lib/marketplace/store";
import type { DealStatus } from "@/lib/marketplace/flag";

// Reads the session and may redirect: renders per request (see the /m layout).
export const instant = false;

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** The creator's private deal log: every offer they saved, its status and what it paid. */
export default async function DealsPage() {
  const { user, member, s } = await marketPageFor("/m/deals", "creator");
  const deals = await listDeals(user.id);
  const totals = dealTotals(deals);
  return (
    <>
      <MTop s={s} role="creator" lang={member.uiLanguage} active="deals" />
      <main className="lp-wrap mk-main">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="mk-h1">{s.deals.title}</h1>
            <p className="mk-sub">{s.deals.sub}</p>
          </div>
          <Link href="/m/offers/new" className="lp-btn">
            {s.deals.new}
          </Link>
        </div>
        {deals.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-x-12 gap-y-4">
            <div>
              <p className="mk-stat">{inr(totals.earned)}</p>
              <p className="lp-label mt-1">{s.home.earned}</p>
            </div>
            <div>
              <p className="mk-stat">{totals.open}</p>
              <p className="lp-label mt-1">{s.home.open}</p>
            </div>
          </div>
        )}
        <div className="mk-list">
          {deals.length ? (
            deals.map((d) => (
              <Link key={d.id} href={`/m/deals/${d.id}`} className="mk-deal">
                <span className="min-w-0">
                  <span className="block truncate text-[17px] font-semibold">{d.counterparty}</span>
                  <span className="block truncate text-[14px]" style={{ color: "var(--ink-2)" }}>
                    {[d.deliverables, d.postBy ? new Date(`${d.postBy}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : null].filter(Boolean).join(" · ") || "–"}
                  </span>
                </span>
                <span className="text-[16px] font-semibold tabular-nums">{d.feeInr != null ? inr(d.feeInr) : d.barter ? d.barter : "–"}</span>
                <span className="lp-chip mk-status" data-s={d.status}>
                  {s.deals.statuses[d.status as DealStatus] ?? d.status}
                </span>
              </Link>
            ))
          ) : (
            <p className="lp-card mk-panel" style={{ color: "var(--ink-2)" }}>
              {s.home.dealsEmpty}
            </p>
          )}
        </div>
      </main>
    </>
  );
}
