import { MTop } from "@/components/m/MTop";
import { PlanInterest } from "@/components/m/TrackParts";
import { BUSINESSES_FREE, PLANS, type PlanId } from "@/lib/marketplace/flag";
import { marketPageFor } from "@/lib/marketplace/page";
import { planState } from "@/lib/marketplace/plans";

// Reads the session and may redirect: renders per request (see the /m layout).
export const instant = false;

/** The business plans. Free during the pilot; owners can say which they'd pay for (recorded, never charged). */
export default async function PlansPage() {
  const { user, member, s } = await marketPageFor("/m/plans", "business");
  const state = await planState(user.id);
  const ids = Object.keys(PLANS) as PlanId[];
  // For now Mitra is free for businesses and brands: no plans to choose from.
  if (BUSINESSES_FREE)
    return (
      <>
        <MTop s={s} role={member.role} lang={member.uiLanguage} active="track" />
        <main className="lp-wrap mk-main">
          <h1 className="mk-h1">{s.plans.title}</h1>
          <p className="mk-nudge mt-6 text-[16px]">{s.pass.businessFree}</p>
        </main>
      </>
    );
  return (
    <>
      <MTop s={s} role={member.role} lang={member.uiLanguage} active="track" />
      <main className="lp-wrap mk-main">
        <h1 className="mk-h1">{s.plans.title}</h1>
        <p className="mk-sub">{s.plans.sub}</p>
        <p className="lp-label mt-3">{s.plans.pilot}</p>
        <div className="mk-plans mt-8">
          {ids.map((id) => (
            <section key={id} className="lp-card mk-panel grid content-start gap-4" style={id === "local" ? { boxShadow: "0 0 0 2px var(--ink), 0 24px 60px -36px rgb(0 0 0 / 0.25)" } : undefined}>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="mk-h2">{s.plans.names[id]}</h2>
                {state.plan === id && <span className="lp-chip lp-chip--ok">{s.plans.current}</span>}
              </div>
              <p>
                <span className="mk-stat">₹{PLANS[id].priceInr.toLocaleString("en-IN")}</span>
                <span style={{ color: "var(--ink-2)" }}>{s.plans.perMonth}</span>
              </p>
              <ul className="grid gap-2 text-[15px]" style={{ color: "var(--ink-2)" }}>
                {s.plans.features[id].map((f) => (
                  <li key={f} className="flex gap-2">
                    <span aria-hidden>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              {id !== "free" && <PlanInterest s={s} plan={id} chosen={state.interest === id} />}
            </section>
          ))}
        </div>
        <p className="lp-label mt-6">{s.terms.noCutBiz}</p>
      </main>
    </>
  );
}
