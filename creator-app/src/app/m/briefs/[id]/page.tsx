import Link from "next/link";
import { notFound } from "next/navigation";
import { MTop } from "@/components/m/MTop";
import { BriefStatus, CustomerCounter, InviteCard, WithdrawInvite } from "@/components/m/BriefParts";
import { briefResults, getBrief, matchesFor, planBudget } from "@/lib/marketplace/business";
import { marketPageFor } from "@/lib/marketplace/page";

// Reads the session and may redirect: renders per request (see the /m layout).
export const instant = false;

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/** One brief: Mitra's plan, matched creators with reasons, who's been invited, and what it has brought in. */
export default async function BriefPage({ params }: PageProps<"/m/briefs/[id]">) {
  const { id } = await params;
  const { user, member, s } = await marketPageFor(`/m/briefs/${id}`, "business");
  const brief = await getBrief(user.id, id);
  if (!brief) notFound();
  const [matches, results] = await Promise.all([brief.status === "open" ? matchesFor(brief) : Promise.resolve([]), briefResults(user.id, id)]);
  const plan = planBudget(brief.budgetInr ?? 0, matches);
  const planFee = new Map(plan.picks.map((p) => [p.userId, p]));
  const { totals } = results;
  return (
    <>
      <MTop s={s} role={member.role} lang={member.uiLanguage} />
      <main className="lp-wrap mk-main">
        <Link href="/m" className="lp-link text-[14px]" style={{ color: "var(--ink-2)" }}>
          ← {s.brief.list}
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="mk-h1">{brief.goal}</h1>
            <p className="mk-sub">
              {[brief.deliverables.map((d) => s.deliverable[d as keyof typeof s.deliverable] ?? d).join(" + "), brief.budgetInr != null ? inr(brief.budgetInr) : null, brief.area, brief.postBy ? `${s.brief.postBy} ${brief.postBy}` : null]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <BriefStatus s={s} id={brief.id} status={brief.status} />
        </div>

        {results.rows.length > 0 && (
          <section className="mt-10">
            <h2 className="mk-h2">{s.brief.results}</h2>
            <div className="mk-nums">
              {[
                [String(totals.customers), s.brief.customers],
                [inr(totals.spent), s.brief.spent],
                [totals.perCustomer != null ? inr(totals.perCustomer) : "–", s.brief.perCustomer],
                [String(totals.clicks), s.brief.clicks],
              ].map(([n, l]) => (
                <div key={l} className="mk-num">
                  <p className="mk-stat">{n}</p>
                  <p className="lp-label mt-2">{l}</p>
                </div>
              ))}
            </div>
            <div className="mk-list">
              {results.rows.map(({ invite, creator, deal, outcome }) => (
                <div key={invite.id} className="mk-deal" style={{ gridTemplateColumns: "minmax(0,1fr) auto auto" }}>
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="lp-av">{initials(creator?.displayName ?? "?")}</span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{creator?.displayName ?? "Creator"}</span>
                      <span className="block truncate text-[14px]" style={{ color: "var(--ink-2)" }}>
                        {invite.feeInr != null ? inr(invite.feeInr) : ""}
                        {outcome?.promoCode ? ` · ${outcome.promoCode}` : ""}
                        {outcome ? ` · ${outcome.clicks} ${s.brief.clicks.toLowerCase()}` : ""}
                      </span>
                    </span>
                  </span>
                  {deal && outcome ? <CustomerCounter s={s} dealId={deal.id} count={outcome.redemptions ?? 0} /> : <span />}
                  <span className="flex items-center gap-2">
                    <span className={`lp-chip ${invite.status === "accepted" ? "lp-chip--ok" : ""}`}>{s.brief.status[invite.status] ?? invite.status}</span>
                    {deal ? (
                      <Link href={`/m/room/${deal.id}`} className="lp-btn lp-btn--ghost" style={{ minHeight: 36, padding: "0 14px", fontSize: 14 }}>
                        {s.brief.room}
                      </Link>
                    ) : invite.status === "pending" ? (
                      <WithdrawInvite s={s} id={invite.id} />
                    ) : null}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {brief.status === "open" && (
          <>
            <section className="lp-card mk-panel mt-10">
              <h2 className="mk-h2">{s.brief.plan}</h2>
              {plan.picks.length ? (
                <p className="mt-2" style={{ color: "var(--ink-2)" }}>
                  {s.brief.planLine} {inr(plan.left)} {s.brief.planLeft}
                </p>
              ) : (
                <p className="mt-2" style={{ color: "var(--ink-2)" }}>{s.brief.planNone}</p>
              )}
            </section>

            {matches.length > 0 && (
              <section className="mt-10">
                <h2 className="mk-h2">{s.brief.matches}</h2>
                <p className="lp-label mt-1">{s.brief.matchesSub}</p>
                <div className="mk-grid" style={{ marginTop: 16 }}>
                  {matches.map((m) => {
                    const pick = planFee.get(m.userId);
                    return (
                      <InviteCard
                        key={m.userId}
                        s={s}
                        briefId={brief.id}
                        match={{ userId: m.userId, name: m.displayName, initials: initials(m.displayName), area: m.area, reasons: m.reasons, verified: m.verified, kit: m.isPublic ? `/kit/${m.slug}` : null }}
                        fee={pick?.fee ?? m.suggestedFee ?? null}
                        inPlan={Boolean(pick)}
                        suggested={Boolean(pick?.suggested)}
                      />
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}
