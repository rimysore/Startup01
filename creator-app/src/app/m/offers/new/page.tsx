import { MTop } from "@/components/m/MTop";
import { OfferForm } from "@/components/m/OfferForm";
import { marketPageFor } from "@/lib/marketplace/page";
import { getKit, rateRange } from "@/lib/marketplace/store";

// Reads the session and may redirect: renders per request (see the /m layout).
export const instant = false;

export default async function NewOfferPage() {
  const { user, member, s } = await marketPageFor("/m/offers/new", "creator");
  const { profile } = await getKit(user.id);
  const reel = await rateRange(user.id, "reel", profile?.niches ?? []);
  const myReel = profile?.rates.find((r) => r.deliverable === "reel")?.priceInr ?? null;
  return (
    <>
      <MTop s={s} role="creator" lang={member.uiLanguage} active="offers" />
      <main className="lp-wrap mk-main">
        <h1 className="mk-h1">{s.offer.title}</h1>
        <p className="mk-sub">{s.offer.sub}</p>
        <OfferForm s={s} lang={member.uiLanguage === "kn" ? "kn" : "en"} reelRange={reel} myReel={myReel} />
      </main>
    </>
  );
}
