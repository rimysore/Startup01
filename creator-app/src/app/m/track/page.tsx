import Link from "next/link";
import { MTop } from "@/components/m/MTop";
import { PinForm } from "@/components/m/TrackParts";
import { marketPageFor } from "@/lib/marketplace/page";
import { getBusiness } from "@/lib/marketplace/store";
import { customersThisMonth, planState, shouldNudge } from "@/lib/marketplace/plans";
import { hasCounterPin, listTracked, trackTotals } from "@/lib/marketplace/track";

// Reads the session and may redirect: renders per request (see the /m layout).
export const instant = false;

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** Every tracked creator post with its customers, paid and barter side by side, the counter PIN and counter mode. */
export default async function TrackPage() {
  const { user, member, s } = await marketPageFor("/m/track", "business");
  const [biz, posts, pinSet, plan, monthCustomers] = await Promise.all([getBusiness(user.id), listTracked(user.id), hasCounterPin(user.id), planState(user.id), customersThisMonth(user.id)]);
  const tot = trackTotals(posts);
  const nudge = shouldNudge(plan.plan, monthCustomers, plan.interest);
  return (
    <>
      <MTop s={s} role={member.role} lang={member.uiLanguage} active="track" />
      <main className="lp-wrap mk-main">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="mk-h1">{s.track.title}</h1>
            <p className="mk-sub">{s.track.sub}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/m/track/counter" className="lp-btn lp-btn--ghost">
              {s.track.counter}
            </Link>
            <Link href={biz ? "/m/track/new" : "/m/business"} className="lp-btn">
              {biz ? s.track.add : s.track.needBusiness}
            </Link>
          </div>
        </div>

        {nudge && (
          <section className="mk-nudge mt-8">
            <div className="min-w-0">
              <p className="text-[18px] font-semibold">
                {s.plans.nudgeA} {monthCustomers} {s.plans.nudgeB}
              </p>
              <p className="mt-1 text-[15px]" style={{ color: "var(--ink-2)" }}>
                {s.plans.nudgeSub}
              </p>
            </div>
            <Link href="/m/plans" className="lp-btn">
              {s.plans.nudgeGo}
            </Link>
          </section>
        )}

        {posts.length > 0 && (
          <section className="mk-grid">
            <div className="lp-card mk-panel">
              <p className="lp-label">{s.track.paidTotal}</p>
              <p className="mk-stat mt-2">{tot.paid.customers}</p>
              {tot.paid.perCustomer != null && (
                <p className="mt-2 text-[14px]" style={{ color: "var(--ink-2)" }}>
                  {inr(tot.paid.perCustomer)} {s.track.perCustomer}
                </p>
              )}
            </div>
            <div className="lp-card mk-panel">
              <p className="lp-label">{s.track.barterTotal}</p>
              <p className="mk-stat mt-2">{tot.barter.customers}</p>
            </div>
          </section>
        )}

        <section className="mt-8">
          <div className="mk-list">
            {posts.length ? (
              posts.map((p) => (
                <Link key={p.id} href={`/m/track/${p.id}`} className="mk-deal">
                  <span className="min-w-0">
                    <span className="block truncate text-[17px] font-semibold">
                      {p.creatorName}
                      {p.creatorHandle ? <span style={{ color: "var(--ink-2)", fontWeight: 400 }}> @{p.creatorHandle}</span> : null}
                    </span>
                    <span className="block truncate text-[14px]" style={{ color: "var(--ink-2)" }}>
                      {p.promoCode} · {p.kind === "barter" ? (p.barterNote ?? s.track.barter) : p.baseFeeInr != null ? inr(p.baseFeeInr) : s.track.paid}
                      {p.dealId ? ` · ${s.track.fromMitra}` : ""}
                    </span>
                  </span>
                  <span className={`lp-chip ${p.status === "active" ? "lp-chip--ok" : ""}`}>{p.status === "active" ? (p.kind === "barter" ? s.track.barter.split(" ")[0] : s.track.paid) : s.track.ended}</span>
                  <span className="text-right">
                    <span className="block text-[17px] font-semibold tabular-nums">
                      {p.stats.customers} {p.stats.customers === 1 ? s.track.customer : s.track.customers}
                    </span>
                    <span className="block text-[13px] tabular-nums" style={{ color: "var(--ink-2)" }}>
                      {p.stats.perCustomer != null ? `${inr(p.stats.perCustomer)} ${s.track.perCustomer}` : `${p.stats.opened} ${s.track.opened}`}
                    </span>
                  </span>
                </Link>
              ))
            ) : (
              <p className="lp-card mk-panel" style={{ color: "var(--ink-2)" }}>
                {s.track.none}
              </p>
            )}
          </div>
        </section>

        <div className="mk-grid">
          <section className="lp-card mk-panel">
            <h2 className="mk-h2">{s.track.pinTitle}</h2>
            <p className="mt-2 mb-4 text-[15px]" style={{ color: "var(--ink-2)" }}>
              {s.track.pinSub}
            </p>
            {biz ? <PinForm s={s} isSet={pinSet} /> : <p className="mk-err">{s.track.needBusiness}</p>}
          </section>
          <section className="lp-card mk-panel">
            <h2 className="mk-h2">{s.track.howTitle}</h2>
            <ol className="mt-3 grid gap-2" style={{ color: "var(--ink-2)", listStyle: "decimal", paddingLeft: 20 }}>
              {s.track.howSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className="lp-label mt-4">
              {s.track.freePlan}{" "}
              <Link href="/m/plans" className="lp-link">
                {s.nav.plans} →
              </Link>
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
