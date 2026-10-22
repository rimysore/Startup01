import Link from "next/link";
import { notFound } from "next/navigation";
import { MTop } from "@/components/m/MTop";
import { CustomerCounter } from "@/components/m/BriefParts";
import { HereLink, MessageBox, RoomActions } from "@/components/m/RoomParts";
import { getRoom } from "@/lib/marketplace/business";
import { SITE_URL } from "@/lib/company";
import { amountDue, bonusDue, termsOf } from "@/lib/marketplace/money";
import { marketPage } from "@/lib/marketplace/page";

// Reads the session and may redirect: renders per request (see the /m layout).
export const instant = false;

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const wa = (n: string) => `https://wa.me/${n.replace(/[^\d]/g, "").replace(/^(\d{10})$/, "91$1")}`;

/** The deal room both sides share once a creator accepts: terms, code, link, contacts, results and messages. */
export default async function RoomPage({ params }: PageProps<"/m/room/[id]">) {
  const { id } = await params;
  const { user, member, s } = await marketPage(`/m/room/${id}`);
  const room = await getRoom(user.id, id);
  if (!room) notFound();
  const { deal, outcome, side } = room;
  const other =
    side === "creator"
      ? { name: room.business.name, email: room.business.email, whatsapp: room.business.whatsapp, extra: room.business.website ?? room.business.instagram }
      : { name: room.creator.name, email: room.creator.email, whatsapp: room.creator.whatsapp, extra: room.creator.isPublic && room.creator.slug ? `${SITE_URL}/kit/${room.creator.slug}` : null };
  const link = outcome?.linkCode ? `/r/${outcome.linkCode}` : null;
  const t = termsOf(deal);
  const customers = outcome?.redemptions ?? 0;
  const due = amountDue(t, customers);
  return (
    <>
      <MTop s={s} role={member!.role} lang={member!.uiLanguage} />
      <main className="lp-wrap mk-main">
        <Link href={side === "creator" ? "/m/deals" : deal.opportunityId ? `/m/briefs/${deal.opportunityId}` : "/m"} className="lp-link text-[14px]" style={{ color: "var(--ink-2)" }}>
          ← {side === "creator" ? s.deals.title : s.brief.results}
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="lp-label">
              {s.room.title} · {s.room.with}
            </p>
            <h1 className="mk-h1 mt-1">{other.name}</h1>
          </div>
          <span className={`lp-chip ${deal.status === "paid" ? "lp-chip--ok" : "lp-chip--ink"}`}>{s.deals.statuses[deal.status as keyof typeof s.deals.statuses] ?? deal.status}</span>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="grid content-start gap-4">
            <section className="lp-card mk-panel">
              <h2 className="mk-h2">{s.room.terms}</h2>
              <div className="lp-deal__rows">
                {room.brief && <div className="lp-deal__row"><span>{s.room.goal}</span><b>{room.brief.goal}</b></div>}
                <div className="lp-deal__row"><span>{s.invite.want}</span><b>{room.brief ? room.brief.deliverables.map((d) => s.deliverable[d as keyof typeof s.deliverable] ?? d).join(" + ") : (deal.deliverables ?? "–")}</b></div>
                <div className="lp-deal__row"><span>{t.kind === "barter" ? s.invite.youGet : s.terms.forPost}</span><b>{t.kind === "barter" ? (t.barterNote ?? s.terms.barter) : t.feeInr != null ? inr(t.feeInr) : "–"}</b></div>
                {t.bonusPerCustomerInr != null && (
                  <>
                    <div className="lp-deal__row">
                      <span>{s.terms.bonusLine}</span>
                      <b>
                        {inr(t.bonusPerCustomerInr)} {s.terms.perCustomer}
                        {t.bonusCapInr != null ? `, ${s.terms.upTo} ${inr(t.bonusCapInr)}` : ""}
                      </b>
                    </div>
                    <div className="lp-deal__row"><span>{s.terms.bonusEarned}</span><b>{inr(bonusDue(t, customers))}</b></div>
                  </>
                )}
                {due > 0 && <div className="lp-deal__row"><span>{s.terms.due}</span><b>{inr(due)}</b></div>}
                <div className="lp-deal__row"><span>{s.terms.noCut}</span><b>{side === "creator" ? s.terms.noCutValue : "–"}</b></div>
                {deal.postBy && <div className="lp-deal__row"><span>{s.invite.postBy}</span><b>{deal.postBy}</b></div>}
              </div>
            </section>
            <section className="lp-card mk-panel grid gap-5">
              <div>
                <p className="lp-label">{s.room.code}</p>
                <p className="mk-stat mt-1" style={{ fontSize: 34 }}>{outcome?.promoCode ?? "–"}</p>
                <p className="lp-label mt-1">{s.room.codeHint}</p>
              </div>
              {link && (
                <div>
                  <p className="lp-label">{s.room.link}</p>
                  <p className="mt-1 break-all font-semibold">
                    <HereLink path={link} />
                  </p>
                  <p className="lp-label mt-1">
                    {s.room.linkHint} · {outcome?.clicks ?? 0} {s.brief.clicks.toLowerCase()}
                  </p>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>
                  <span className="lp-label block">{s.room.customers}</span>
                  {side === "creator" && <span className="mk-stat" style={{ fontSize: 34 }}>{outcome?.redemptions ?? 0}</span>}
                </span>
                {side === "business" && <CustomerCounter s={s} dealId={deal.id} count={outcome?.redemptions ?? 0} />}
              </div>
            </section>
            <RoomActions s={s} dealId={deal.id} side={side} status={deal.status} paidInr={outcome?.paidInr ?? null} fee={due || null} rating={side === "creator" ? outcome?.creatorRating ?? null : outcome?.businessRating ?? null} />
          </div>

          <div className="grid content-start gap-4">
            <section className="lp-card mk-panel">
              <h2 className="mk-h2">{s.room.contact}</h2>
              <div className="mt-3 grid gap-2">
                {other.whatsapp && (
                  <a href={wa(other.whatsapp)} target="_blank" rel="noopener noreferrer" className="lp-btn" style={{ minHeight: 44 }}>
                    {s.room.whatsapp}
                  </a>
                )}
                {other.email && (
                  <a href={`mailto:${other.email}`} className="lp-btn lp-btn--ghost" style={{ minHeight: 44 }}>
                    {s.room.email}: {other.email}
                  </a>
                )}
                {other.extra && (
                  <a href={other.extra} target="_blank" rel="noopener noreferrer" className="lp-link break-all text-[14px]" style={{ color: "var(--ink-2)" }}>
                    {other.extra}
                  </a>
                )}
              </div>
            </section>
            <MessageBox s={s} dealId={deal.id} messages={room.messages.map((m) => ({ id: m.id, mine: m.mine, body: m.body, at: m.at.toISOString() }))} />
          </div>
        </div>
      </main>
    </>
  );
}
