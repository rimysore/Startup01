import Link from "next/link";
import { MTop } from "@/components/m/MTop";
import { marketPage } from "@/lib/marketplace/page";
import { invitesForCreator, listBriefs } from "@/lib/marketplace/business";
import { customersThisMonth, planState, shouldNudge } from "@/lib/marketplace/plans";
import { listTracked, trackTotals } from "@/lib/marketplace/track";
import { dealTotals, getBusiness, getKit, isVerified, kitCompleteness, listDeals } from "@/lib/marketplace/store";
import { youtubeConnection } from "@/lib/youtube";

// Reads the session and may redirect: renders per request (see the /m layout).
export const instant = false;

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** Marketplace home: for creators their kit, deals and verification; for businesses their profile and what's next. */
export default async function MarketHome() {
  const { user, member, s } = await marketPage("/m");
  const first = (user.name ?? "").split(" ")[0];
  const top = <MTop s={s} role={member!.role} lang={member!.uiLanguage} active="home" />;

  if (member!.role !== "creator") {
    const [biz, briefs, tracked, plan, monthCustomers] = await Promise.all([getBusiness(user.id), listBriefs(user.id), listTracked(user.id), planState(user.id), customersThisMonth(user.id)]);
    const tot = trackTotals(tracked);
    const nudge = shouldNudge(plan.plan, monthCustomers, plan.interest);
    return (
      <>
        {top}
        <main className="lp-wrap mk-main">
          <h1 className="mk-h1">
            {s.home.hi}
            {first ? `, ${first}` : ""}.
          </h1>
          <p className="mk-sub">{s.home.businessSub}</p>
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
          <section className="lp-card mk-panel mt-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0">
                <h2 className="mk-h2">{s.track.title}</h2>
                <p className="mt-2 text-[15px]" style={{ color: "var(--ink-2)" }}>
                  {tracked.length ? `${tot.customers} ${tot.customers === 1 ? s.track.customer : s.track.customers}` : s.track.sub}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {tracked.length > 0 && (
                  <Link href="/m/track/counter" className="lp-btn lp-btn--ghost">
                    {s.track.counter}
                  </Link>
                )}
                <Link href={!biz ? "/m/business" : tracked.length ? "/m/track" : "/m/track/new"} className="lp-btn">
                  {!biz ? s.track.needBusiness : tracked.length ? s.track.title : s.track.add}
                </Link>
              </div>
            </div>
          </section>
          <section className="mt-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="mk-h2">{s.brief.list}</h2>
              <Link href={biz ? "/m/briefs/new" : "/m/business"} className="lp-btn">
                {s.nav.briefs}
              </Link>
            </div>
            <div className="mk-list">
              {briefs.length ? (
                briefs.map((b) => (
                  <Link key={b.id} href={`/m/briefs/${b.id}`} className="mk-deal">
                    <span className="min-w-0">
                      <span className="block truncate text-[17px] font-semibold">{b.goal}</span>
                      <span className="block truncate text-[14px]" style={{ color: "var(--ink-2)" }}>
                        {b.invited} {s.brief.invited} · {b.accepted} {s.brief.accepted}
                      </span>
                    </span>
                    <span className="text-[16px] font-semibold tabular-nums">{b.budgetInr != null ? `₹${b.budgetInr.toLocaleString("en-IN")}` : ""}</span>
                    <span className={`lp-chip ${b.status === "open" ? "lp-chip--ok" : ""}`}>{b.status === "open" ? s.brief.open : s.brief.closed}</span>
                  </Link>
                ))
              ) : (
                <p className="lp-card mk-panel" style={{ color: "var(--ink-2)" }}>
                  {s.brief.none}
                </p>
              )}
            </div>
          </section>
          <div className="mk-grid">
            <section className="lp-card mk-panel">
              <h2 className="mk-h2">{biz?.name ?? s.business.title}</h2>
              <p className="mt-2" style={{ color: "var(--ink-2)" }}>
                {[biz?.category, biz?.area].filter(Boolean).join(" · ") || s.business.sub}
              </p>
              <Link href="/m/business" className="lp-btn lp-btn--ghost mt-5" style={{ minHeight: 44 }}>
                {s.common.edit}
              </Link>
            </section>
            <section className="lp-card mk-panel">
              <h2 className="mk-h2">{s.home.businessNext}</h2>
              <ol className="mt-3 grid gap-2" style={{ color: "var(--ink-2)", listStyle: "decimal", paddingLeft: 20 }}>
                {s.home.businessSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>
          </div>
        </main>
      </>
    );
  }

  const [{ profile, handles }, deals, yt, invites] = await Promise.all([getKit(user.id), listDeals(user.id), youtubeConnection(user.id), invitesForCreator(user.id)]);
  const pending = invites.filter((i) => i.invite.status === "pending");
  const pct = kitCompleteness(profile, handles);
  const totals = dealTotals(deals);
  const ytVerified = handles.some((h) => h.platform === "youtube" && isVerified(h));
  return (
    <>
      {top}
      <main className="lp-wrap mk-main">
        <h1 className="mk-h1">
          {s.home.hi}
          {first ? `, ${first}` : ""}.
        </h1>
        <p className="mk-sub">{s.home.creatorSub}</p>
        {(pending.length > 0 || profile?.openToOffers) && (
          <section className="mt-8">
            <h2 className="mk-h2">{s.invite.list}</h2>
            <div className="mk-list">
              {pending.length ? (
                pending.map(({ invite, brief, business }) => (
                  <Link key={invite.id} href={`/m/invites/${invite.id}`} className="mk-deal">
                    <span className="min-w-0">
                      <span className="block truncate text-[17px] font-semibold">{business?.name ?? "A local business"}</span>
                      <span className="block truncate text-[14px]" style={{ color: "var(--ink-2)" }}>
                        {brief.goal}
                      </span>
                    </span>
                    <span className="text-[16px] font-semibold tabular-nums">{invite.feeInr != null ? inr(invite.feeInr) : ""}</span>
                    <span className="lp-chip lp-chip--ink">{s.brief.status.pending}</span>
                  </Link>
                ))
              ) : (
                <p className="lp-card mk-panel" style={{ color: "var(--ink-2)" }}>
                  {s.invite.none}
                </p>
              )}
            </div>
          </section>
        )}
        <div className="mk-grid">
          <section className="lp-card mk-panel">
            <h2 className="mk-h2">{s.home.offerTitle}</h2>
            <p className="mt-2" style={{ color: "var(--ink-2)" }}>{s.home.offerSub}</p>
            <Link href="/m/inbox" className="lp-btn mt-5" style={{ minHeight: 44 }}>
              {s.home.offerGo}
            </Link>
          </section>

          <section className="lp-card mk-panel">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="mk-h2">{s.home.kitTitle}</h2>
              <span className="lp-label">
                {pct}% {s.home.kitDone}
              </span>
            </div>
            <div className="mk-meter mt-4" aria-hidden>
              <span style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-4 text-[15px]" style={{ color: "var(--ink-2)" }}>
              {profile?.isPublic ? `/kit/${profile.slug}` : s.home.kitPrivate}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/m/kit" className="lp-btn" style={{ minHeight: 44 }}>
                {s.home.kitEdit}
              </Link>
              {profile?.isPublic && (
                <Link href={`/kit/${profile.slug}`} className="lp-btn lp-btn--ghost" style={{ minHeight: 44 }}>
                  {s.home.kitView}
                </Link>
              )}
            </div>
          </section>

          <section className="lp-card mk-panel">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="mk-h2">{s.home.dealsTitle}</h2>
              <Link href="/m/deals" className="lp-link text-[14px]" style={{ color: "var(--ink-2)" }}>
                {s.nav.deals} →
              </Link>
            </div>
            {totals.count ? (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="mk-stat">{inr(totals.earned)}</p>
                  <p className="lp-label mt-1">{s.home.earned}</p>
                </div>
                <div>
                  <p className="mk-stat">{totals.open}</p>
                  <p className="lp-label mt-1">{s.home.open}</p>
                </div>
              </div>
            ) : (
              <p className="mt-3" style={{ color: "var(--ink-2)" }}>{s.home.dealsEmpty}</p>
            )}
          </section>

          {!ytVerified && (
            <section className="lp-card mk-panel">
              <h2 className="mk-h2">{s.home.verifyTitle}</h2>
              <p className="mt-2" style={{ color: "var(--ink-2)" }}>{s.home.verifySub}</p>
              <Link href={yt ? "/m/kit#verify" : "/api/auth/youtube/start?next=/m/kit%23verify"} className="lp-btn lp-btn--ghost mt-5" style={{ minHeight: 44 }}>
                {yt ? s.kit.verifyYt : s.home.verifyGo}
              </Link>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
