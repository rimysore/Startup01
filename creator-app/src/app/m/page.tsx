import Link from "next/link";
import type { Strings } from "@/lib/marketplace/i18n";
import { MTop } from "@/components/m/MTop";
import { marketPage } from "@/lib/marketplace/page";
import { invitesForCreator, listBriefs } from "@/lib/marketplace/business";
import { customersThisMonth, planState, shouldNudge } from "@/lib/marketplace/plans";
import { type PassState, passState } from "@/lib/marketplace/pass";
import { listTracked, trackTotals } from "@/lib/marketplace/track";
import { programsFor } from "@/lib/marketplace/programs";
import { businessesFor, creatorsFor, interestedCreators, type CreatorCard } from "@/lib/marketplace/collabs";
import { BusinessInterest, ProgramInterest } from "@/components/m/TrackParts";
import { dealTotals, getBusiness, getKit, isVerified, kitCompleteness, listDeals } from "@/lib/marketplace/store";

// Reads the session and may redirect: renders per request (see the /m layout).
export const instant = false;

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** Marketplace home: for creators their kit, deals and verification; for businesses their profile and what's next. */
export default async function MarketHome() {
  const { user, member, s } = await marketPage("/m");
  const first = (user.name ?? "").split(" ")[0];
  const top = <MTop s={s} role={member!.role} lang={member!.uiLanguage} active="home" />;

  if (member!.role !== "creator") {
    const [biz, briefs, tracked, plan, monthCustomers, fits, fans] = await Promise.all([getBusiness(user.id), listBriefs(user.id), listTracked(user.id), planState(user.id), customersThisMonth(user.id), creatorsFor(user.id), interestedCreators(user.id)]);
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
          <LaunchNotice s={s} side="business" />
          <div className="mk-grid">
            <CreatorList s={s} title={s.fit.interestedTitle} sub={s.fit.interestedSub} empty={s.fit.noneInterested} creators={fans} invite={biz ? "/m/briefs/new" : "/m/business"} />
            <CreatorList s={s} title={s.fit.title} sub={s.fit.sub} empty={s.fit.none} creators={fits} invite={biz ? "/m/briefs/new" : "/m/business"} />
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

  const [{ profile, handles }, deals, invites, programs, businesses, pass] = await Promise.all([getKit(user.id), listDeals(user.id), invitesForCreator(user.id), programsFor(user.id), businessesFor(user.id), passState(user.id)]);
  const pending = invites.filter((i) => i.invite.status === "pending");
  const pct = kitCompleteness(profile, handles);
  const totals = dealTotals(deals);
  const igVerified = handles.some((h) => h.platform === "instagram" && isVerified(h));
  return (
    <>
      {top}
      <main className="lp-wrap mk-main">
        <h1 className="mk-h1">
          {s.home.hi}
          {first ? `, ${first}` : ""}.
        </h1>
        <p className="mk-sub">{s.home.creatorSub}</p>
        <LaunchNotice s={s} side="creator" pass={pass} />
        {!igVerified && (
          <section className="lp-card mk-panel mt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="grid min-w-0 max-w-[60ch] gap-1">
              <h2 className="mk-h2">{s.home.verifyTitle}</h2>
              <p style={{ color: "var(--ink-2)" }}>{s.home.verifySub}</p>
            </div>
            <a href="/api/auth/instagram/start" className="lp-btn" style={{ minHeight: 46 }}>
              {s.home.verifyGo}
            </a>
          </section>
        )}
        <section className="mt-8">
          <h2 className="mk-h2">{s.collabs.title}</h2>
          <p className="mt-2 max-w-[70ch] text-[15px]" style={{ color: "var(--ink-2)" }}>
            {s.collabs.sub}
          </p>
          {businesses.length ? (
            <div className="mk-programs mt-5">
              {businesses.map((b) => (
                <article key={b.userId} className="lp-card mk-panel grid content-start gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="lp-chip">{b.category ?? s.programs.kinds.local}</span>
                    {b.isNew && <span className="lp-chip lp-chip--ink">{s.collabs.newChip}</span>}
                  </div>
                  <h3 className="text-[18px] font-semibold">{b.name}</h3>
                  <ul className="grid gap-1 text-[14.5px]" style={{ color: "var(--ink-2)" }}>
                    {b.reasons.map((r) => (
                      <li key={r}>• {r}</li>
                    ))}
                  </ul>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <BusinessInterest s={s} id={b.userId} interested={b.interested} />
                    {b.website?.startsWith("https://") && (
                      <a href={b.website} target="_blank" rel="noopener noreferrer nofollow" className="lp-link text-[14px]" style={{ color: "var(--ink-2)" }}>
                        {s.collabs.website} ↗
                      </a>
                    )}
                    {b.instagram && (
                      <a href={`https://www.instagram.com/${b.instagram.replace(/^@/, "")}/`} target="_blank" rel="noopener noreferrer nofollow" className="lp-link text-[14px]" style={{ color: "var(--ink-2)" }}>
                        {s.collabs.instagram} ↗
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="lp-card mk-panel mt-4" style={{ color: "var(--ink-2)" }}>
              {s.collabs.none}
            </p>
          )}
          <p className="lp-label mt-3">{s.collabs.sharedNote}</p>
        </section>
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
        {programs.length > 0 && (
          <section className="mt-8">
            <h2 className="mk-h2">{s.programs.title}</h2>
            <p className="mt-2 max-w-[70ch] text-[15px]" style={{ color: "var(--ink-2)" }}>
              {s.programs.sub}
            </p>
            <div className="mk-programs mt-5">
              {programs.map((p) => (
                <article key={p.id} className="lp-card mk-panel grid content-start gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="lp-chip">{s.programs.kinds[p.kind] ?? p.kind}</span>
                    {p.area && <span className="lp-label">{p.area}</span>}
                  </div>
                  <h3 className="text-[18px] font-semibold">{p.name}</h3>
                  <p className="text-[15px]" style={{ color: "var(--ink-2)" }}>
                    {p.summary}
                  </p>
                  {p.eligibility && (
                    <p className="lp-label">
                      {s.programs.who}: {p.eligibility}
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap gap-2">
                    <ProgramInterest s={s} id={p.id} interested={p.interested} />
                    {p.link ? (
                      <a href={p.link} target="_blank" rel="noopener noreferrer" className="lp-btn lp-btn--ghost" style={{ minHeight: 40 }}>
                        {s.programs.visit} ↗
                      </a>
                    ) : p.kind === "local" ? (
                      <Link href="/m/kit" className="lp-btn lp-btn--ghost" style={{ minHeight: 40 }}>
                        {s.home.kitEdit}
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
            <p className="lp-label mt-4">{s.programs.note}</p>
          </section>
        )}
        <div className="mk-grid">
          <section className="lp-card mk-panel">
            <h2 className="mk-h2">{s.autodm.title}</h2>
            <p className="mt-2" style={{ color: "var(--ink-2)" }}>{s.autodm.sub}</p>
            <Link href="/m/autodm" className="lp-btn mt-5" style={{ minHeight: 44 }}>
              {s.autodm.title}
            </Link>
          </section>

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

        </div>
      </main>
    </>
  );
}

/** The launch notice: free launch month, then the first collab free and the Creator Pass; businesses always free. */
function LaunchNotice({ s, side, pass }: { s: Strings; side: "creator" | "business"; pass?: PassState }) {
  const day = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "long" });
  const t = s.pass;
  const line =
    side === "business" || !pass
      ? t.businessFree
      : pass.status === "active" && pass.paidUntil
        ? `${t.active} ${day(pass.paidUntil)}.`
        : pass.status === "launch_free"
          ? `${pass.freeUntil ? `${t.launchFreeUntil} ${day(pass.freeUntil)}` : t.launchFree}. ${t.afterLaunch}`
          : pass.status === "first_collab_free"
            ? t.firstFree
            : t.needs;
  return (
    <section className="mk-nudge mt-6" aria-label={s.launch.title}>
      <div className="grid min-w-0 gap-2">
        <p className="text-[17px] font-semibold">
          {side === "business" || !pass ? t.titleBusiness : pass.status === "launch_free" ? t.titleLaunch : pass.status === "first_collab_free" ? t.titleFirst : t.title}
        </p>
        <p className="text-[15px]" style={{ color: "var(--ink-2)" }}>
          {line}{" "}
          {side === "creator" && (
            <Link href="/m/pass" className="lp-link underline">
              {t.more}
            </Link>
          )}
        </p>
        <details>
          <summary className="cursor-pointer text-[14px] font-semibold">{s.launch.comingTitle}</summary>
          <ul className="mt-2 grid gap-1.5 text-[14px]" style={{ color: "var(--ink-2)" }}>
            <li>• {s.launch.agency}</li>
          </ul>
        </details>
      </div>
    </section>
  );
}

/** A short list of creators for a business: who they are, why they fit, their kit, and a way to invite. */
function CreatorList({ s, title, sub, empty, creators, invite }: { s: Strings; title: string; sub: string; empty: string; creators: CreatorCard[]; invite: string }) {
  return (
    <section className="lp-card mk-panel grid content-start gap-3">
      <h2 className="mk-h2">{title}</h2>
      <p className="text-[15px]" style={{ color: "var(--ink-2)" }}>
        {sub}
      </p>
      {creators.length ? (
        <ul className="grid gap-3">
          {creators.map((c) => (
            <li key={c.userId} className="flex items-start justify-between gap-3">
              <span className="min-w-0">
                <span className="block font-semibold">
                  {c.name}
                  {c.area ? <span style={{ color: "var(--ink-2)", fontWeight: 400 }}> · {c.area}</span> : null}
                </span>
                <span className="block text-[13.5px]" style={{ color: "var(--ink-2)" }}>
                  {c.reasons.join(" · ")}
                </span>
              </span>
              {c.kit && (
                <a href={c.kit} target="_blank" className="lp-link shrink-0 text-[14px]">
                  {s.fit.viewKit} ↗
                </a>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="lp-label">{empty}</p>
      )}
      {creators.length > 0 && (
        <Link href={invite} className="lp-btn lp-btn--ghost justify-self-start" style={{ minHeight: 42 }}>
          {s.fit.invite}
        </Link>
      )}
    </section>
  );
}
