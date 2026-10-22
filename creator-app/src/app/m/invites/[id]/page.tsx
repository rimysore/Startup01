import Link from "next/link";
import { notFound } from "next/navigation";
import { MTop } from "@/components/m/MTop";
import { InviteAnswer } from "@/components/m/RoomParts";
import { briefAsOffer, inviteForCreator } from "@/lib/marketplace/business";
import { maxEarn, termsOf } from "@/lib/marketplace/money";
import { marketPageFor } from "@/lib/marketplace/page";
import { checkOffer } from "@/lib/offer-check";

// Reads the session and may redirect: renders per request (see the /m layout).
export const instant = false;

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const ICON: Record<string, { stroke: string; d: string }> = {
  ok: { stroke: "var(--ok)", d: "M4 10.5 8 14.5 16 5.5" },
  warn: { stroke: "var(--warn)", d: "M10 4v7M10 15.5v.5" },
  missing: { stroke: "var(--miss)", d: "M5 5l10 10M15 5 5 15" },
};

/** An invite as the creator reads it: the brief, the fee, Mitra's fee, why they were picked, and what's unclear. */
export default async function InvitePage({ params }: PageProps<"/m/invites/[id]">) {
  const { id } = await params;
  const { user, member, s } = await marketPageFor(`/m/invites/${id}`, "creator");
  const row = await inviteForCreator(user.id, id);
  if (!row) notFound();
  const { invite, brief, business } = row;
  const name = business?.name ?? "A local business";
  const t = termsOf(invite);
  const checks = checkOffer(briefAsOffer(brief, t, name));
  const most = maxEarn(t);
  return (
    <>
      <MTop s={s} role="creator" lang={member.uiLanguage} active="home" />
      <main className="lp-wrap mk-main" style={{ maxWidth: 820 }}>
        <Link href="/m" className="lp-link text-[14px]" style={{ color: "var(--ink-2)" }}>
          ← {s.nav.home}
        </Link>
        <p className="lp-label mt-4">{s.invite.title}</p>
        <h1 className="mk-h1 mt-1">{name}</h1>
        <p className="mk-sub">{[business?.category, business?.area].filter(Boolean).join(" · ")}</p>

        <section className="lp-card mk-panel mt-8">
          <p className="text-[19px] font-semibold">{brief.goal}</p>
          {brief.brief && <p className="mt-2" style={{ color: "var(--ink-2)" }}>{brief.brief}</p>}
          {invite.message && <p className="lp-reply mt-4">“{invite.message}”</p>}
          <div className="lp-deal__rows">
            <div className="lp-deal__row"><span>{s.invite.want}</span><b>{brief.deliverables.map((d) => s.deliverable[d as keyof typeof s.deliverable] ?? d).join(" + ")}</b></div>
            <div className="lp-deal__row">
              <span>{t.kind === "barter" ? s.invite.youGet : s.terms.forPost}</span>
              <b>{t.kind === "barter" ? (t.barterNote ?? s.terms.barter) : t.feeInr != null ? `${inr(t.feeInr)} ${s.invite.inFull}` : "–"}</b>
            </div>
            {t.bonusPerCustomerInr != null && (
              <div className="lp-deal__row">
                <span>{s.terms.bonusLine}</span>
                <b>
                  {inr(t.bonusPerCustomerInr)} {s.terms.perCustomer}
                  {t.bonusCapInr != null ? `, ${s.terms.upTo} ${inr(t.bonusCapInr)}` : ` (${s.terms.noCap})`}
                </b>
              </div>
            )}
            {t.bonusPerCustomerInr != null && most != null && (
              <div className="lp-deal__row">
                <span>{s.terms.most}</span>
                <b>{inr(most)}</b>
              </div>
            )}
            {brief.postBy && <div className="lp-deal__row"><span>{s.invite.postBy}</span><b>{brief.postBy}</b></div>}
            <div className="lp-deal__row">
              <span>{s.terms.noCut}</span>
              <b>{s.terms.noCutValue}</b>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="mk-h2">{s.invite.why}</h2>
            <ul className="mt-3 grid gap-1.5" style={{ color: "var(--ink-2)" }}>
              {invite.reasons.map((r) => (
                <li key={r}>• {r}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mk-h2">{s.deals.checks}</h2>
            <div className="mt-1">
              {checks.map((c) => (
                <div key={c.term} className="lp-res">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={ICON[c.state].stroke} strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                    <path d={ICON[c.state].d} />
                  </svg>
                  <span>{c.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-10">
          {invite.status === "pending" ? (
            <InviteAnswer s={s} id={invite.id} />
          ) : invite.dealId ? (
            <Link href={`/m/room/${invite.dealId}`} className="lp-btn">
              {s.brief.room}
            </Link>
          ) : (
            <p style={{ color: "var(--ink-2)" }}>{s.invite.answered}</p>
          )}
        </div>
      </main>
    </>
  );
}
