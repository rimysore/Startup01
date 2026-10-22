import { MTop } from "@/components/m/MTop";
import { PassInterest } from "@/components/m/AutoDm";
import { marketPageFor } from "@/lib/marketplace/page";
import { passState } from "@/lib/marketplace/pass";

// Reads the session and may redirect: renders per request (see the /m layout).
export const instant = false;

const day = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

/** The Creator Pass: where the creator stands (launch month, first collab free, active, needed) and what it includes. */
export default async function PassPage() {
  const { user, member, s } = await marketPageFor("/m/pass", "creator");
  const p = await passState(user.id);
  const t = s.pass;
  const status =
    p.status === "active" && p.paidUntil
      ? `${t.active} ${day(p.paidUntil)}`
      : p.status === "launch_free"
        ? `${p.freeUntil ? `${t.launchFreeUntil} ${day(p.freeUntil)}` : t.launchFree}. ${t.afterLaunch}`
        : p.status === "first_collab_free"
          ? t.firstFree
          : t.needs;
  return (
    <>
      <MTop s={s} role="creator" lang={member.uiLanguage} />
      <main className="lp-wrap mk-main" style={{ maxWidth: 760 }}>
        <h1 className="mk-h1">{t.title}</h1>
        <p className="mk-sub">{t.sub}</p>
        <p className="mk-nudge mt-6 text-[15px]">{status}</p>
        <section className="lp-card mk-panel mt-6 grid gap-4">
          <p className="mk-stat">{t.price}</p>
          <ul className="grid gap-2 text-[15px]">
            {t.includes.map((x) => (
              <li key={x}>✓ {x}</li>
            ))}
          </ul>
          {p.status !== "active" && <PassInterest s={s} wanted={Boolean(p.interestAt)} />}
          <p className="lp-label">{t.noCharge}</p>
        </section>
      </main>
    </>
  );
}
