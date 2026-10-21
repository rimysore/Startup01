import { notFound } from "next/navigation";
import { MTop } from "@/components/m/MTop";
import { DealEditor } from "@/components/m/DealEditor";
import { marketPageFor } from "@/lib/marketplace/page";
import { getDeal } from "@/lib/marketplace/store";

// Reads the session and may redirect: renders per request (see the /m layout).
export const instant = false;

export default async function DealPage({ params }: PageProps<"/m/deals/[id]">) {
  const { id } = await params;
  const { user, member, s } = await marketPageFor(`/m/deals/${id}`, "creator");
  const deal = await getDeal(user.id, id);
  if (!deal) notFound();
  const o = deal.outcome;
  return (
    <>
      <MTop s={s} role="creator" lang={member.uiLanguage} active="deals" />
      <main className="lp-wrap mk-main" style={{ maxWidth: 980 }}>
        <DealEditor
          s={s}
          deal={{
            id: deal.id,
            counterparty: deal.counterparty,
            source: deal.source,
            status: deal.status,
            feeInr: deal.feeInr != null ? String(deal.feeInr) : "",
            barter: deal.barter ?? "",
            deliverables: deal.deliverables ?? "",
            postBy: deal.postBy ?? "",
            paymentTerms: deal.paymentTerms ?? "",
            usageTerms: deal.usageTerms ?? "",
            notes: deal.notes ?? "",
            offerText: deal.offerText ?? "",
            checks: deal.checks,
            promoCode: o?.promoCode ?? "",
            trackedLink: o?.trackedLink ?? "",
            redemptions: o?.redemptions != null ? String(o.redemptions) : "",
            paidInr: o?.paidInr != null ? String(o.paidInr) : "",
            paidAt: o?.paidAt ? o.paidAt.toISOString().slice(0, 10) : "",
            creatorRating: o?.creatorRating != null ? String(o.creatorRating) : "",
          }}
        />
      </main>
    </>
  );
}
