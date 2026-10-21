import Link from "next/link";
import { MTop } from "@/components/m/MTop";
import { CounterBox } from "@/components/m/TrackParts";
import { marketPageFor } from "@/lib/marketplace/page";
import { listTracked } from "@/lib/marketplace/track";

// Reads the session and may redirect: renders per request (see the /m layout).
export const instant = false;

/** Counter mode, for the phone at the till: type a code, count a customer. Today's active codes are listed below. */
export default async function CounterPage() {
  const { user, member, s } = await marketPageFor("/m/track/counter", "business");
  const active = (await listTracked(user.id)).filter((p) => p.status === "active");
  return (
    <>
      <MTop s={s} role={member.role} lang={member.uiLanguage} active="track" />
      <main className="lp-wrap mk-main" style={{ maxWidth: 720 }}>
        <Link href="/m/track" className="lp-link text-[14px]" style={{ color: "var(--ink-2)" }}>
          ← {s.track.title}
        </Link>
        <h1 className="mk-h1 mt-3">{s.track.counter}</h1>
        <p className="mk-sub">{s.track.counterSub}</p>
        <section className="lp-card mk-panel mt-6">
          <CounterBox s={s} />
        </section>
        {active.length > 0 && (
          <section className="mt-6">
            <div className="mk-list">
              {active.map((p) => (
                <div key={p.id} className="mk-deal">
                  <span className="min-w-0">
                    <span className="block truncate text-[17px] font-semibold tabular-nums">{p.promoCode}</span>
                    <span className="block truncate text-[14px]" style={{ color: "var(--ink-2)" }}>
                      {p.creatorName} · {p.offerText}
                    </span>
                  </span>
                  <span />
                  <span className="text-[16px] font-semibold tabular-nums">
                    {p.stats.customers} {p.stats.customers === 1 ? s.track.customer : s.track.customers}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
