import Link from "next/link";
import { MTop } from "@/components/m/MTop";
import { AutoDmManager } from "@/components/m/AutoDm";
import { couponLinks, hasDmScopes, listAutomations, recentEvents } from "@/lib/marketplace/autodm";
import { marketPageFor } from "@/lib/marketplace/page";
import { canUse } from "@/lib/marketplace/pass";
import { instagramConfigured, instagramConnection } from "@/lib/marketplace/social";

// Reads the session and may redirect: renders per request (see the /m layout).
export const instant = false;

const when = (d: Date) => d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default async function AutoDmPage({ searchParams }: PageProps<"/m/autodm">) {
  const { user, member, s } = await marketPageFor("/m/autodm", "creator");
  const t = s.autodm;
  const [conn, automations, events, coupons, allowed] = await Promise.all([instagramConnection(user.id), listAutomations(user.id), recentEvents(user.id), couponLinks(user.id), canUse(user.id, "autodm")]);
  const igMsg = (await searchParams).ig;
  const ready = Boolean(conn && hasDmScopes(conn.scopes));
  return (
    <>
      <MTop s={s} role="creator" lang={member.uiLanguage} active="autodm" />
      <main className="lp-wrap mk-main" style={{ maxWidth: 980 }}>
        <h1 className="mk-h1">{t.title}</h1>
        <p className="mk-sub">{t.sub}</p>
        {typeof igMsg === "string" && (
          <p className={["ok", "filled"].includes(igMsg) ? "mk-ok mt-4" : "mk-err mt-4"} role="status">
            {s.kit.igMsg[igMsg] ?? s.kit.igMsg.failed}
          </p>
        )}
        <div className="mt-8 grid gap-6">
          {!instagramConfigured() ? (
            <p className="lp-card mk-panel" style={{ color: "var(--ink-2)" }}>
              {t.soon}
            </p>
          ) : !ready ? (
            <section className="lp-card mk-panel flex flex-wrap items-center justify-between gap-4">
              <p className="max-w-[60ch]" style={{ color: "var(--ink-2)" }}>
                {conn ? t.reconnect : t.connectFirst}
              </p>
              <a href="/api/auth/instagram/start?next=/m/autodm" className="lp-btn">
                {conn ? t.reconnectGo : t.connectGo}
              </a>
            </section>
          ) : (
            <>
              {!allowed && (
                <p className="mk-nudge">
                  {t.passNeeded}{" "}
                  <Link href="/m/pass" className="lp-link underline">
                    {s.pass.more}
                  </Link>
                </p>
              )}
              <AutoDmManager s={s} initial={automations} coupons={coupons} />
              <p className="lp-label">{t.howTest}</p>
            </>
          )}
          {events.length > 0 && (
            <section className="lp-card mk-panel">
              <h2 className="mk-h2">{t.activity}</h2>
              <ul className="mt-3 grid gap-2 text-[14px]">
                {events.map((e) => (
                  <li key={e.commentId} className="flex flex-wrap justify-between gap-2">
                    <span className="min-w-0 truncate">
                      <b className="font-semibold">@{e.commenterUsername ?? "someone"}</b> <span style={{ color: "var(--ink-2)" }}>“{e.text}”</span>
                    </span>
                    <span className="shrink-0 tabular-nums" style={{ color: e.status === "sent" ? "var(--ok)" : "var(--ink-3)" }}>
                      {t.status[e.status] ?? e.status}
                      {e.error ? ` · ${t.reason[e.error] ?? e.error.replace(/^Instagram: /, "").slice(0, 80)}` : ""} · {when(e.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
