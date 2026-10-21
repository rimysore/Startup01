import Link from "next/link";
import { MTop } from "@/components/m/MTop";
import { InboxAdd } from "@/components/m/InboxParts";
import { WHATSAPP_LOCKED } from "@/lib/company";
import { inboxToken, listInbox, verdictOf } from "@/lib/marketplace/inbox";
import { marketPageFor } from "@/lib/marketplace/page";

// Reads the session and may redirect: renders per request (see the /m layout).
export const instant = false;

const VERDICT_CHIP: Record<string, string> = { likely_scam: "mk-v-bad", careful: "mk-v-warn", looks_ok: "mk-v-ok", unknown: "" };

/** The offer inbox: add an offer however it arrived, and see every offer with its two checks. */
export default async function InboxPage() {
  const { user, member, s } = await marketPageFor("/m/inbox", "creator");
  const domain = process.env.INBOUND_EMAIL_DOMAIN?.trim();
  const [offers, token] = await Promise.all([listInbox(user.id), domain ? inboxToken(user.id) : Promise.resolve(null)]);
  const active = offers.filter((o) => o.status !== "dismissed");
  const dismissed = offers.filter((o) => o.status === "dismissed");
  const row = (o: (typeof offers)[number]) => {
    const v = verdictOf(o)?.verdict ?? "unknown";
    return (
      <Link key={o.id} href={`/m/inbox/${o.id}`} className="mk-deal" style={{ gridTemplateColumns: "minmax(0,1fr) auto auto" }}>
        <span className="min-w-0">
          <span className="block truncate text-[17px] font-semibold">{o.senderName || o.senderHandle || o.senderEmail || s.inbox.unknownSender}</span>
          <span className="block truncate text-[14px]" style={{ color: "var(--ink-2)" }}>
            {o.subject ? `${o.subject} · ` : ""}
            {o.body.slice(0, 120)}
          </span>
        </span>
        <span className="lp-label whitespace-nowrap">
          {s.inbox.sources[o.source]} · {o.receivedAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        </span>
        <span className={`lp-chip ${VERDICT_CHIP[v]}`}>{o.status === "saved" ? s.deals.title : s.inbox.verdict[v]}</span>
      </Link>
    );
  };
  return (
    <>
      <MTop s={s} role="creator" lang={member.uiLanguage} active="inbox" />
      <main className="lp-wrap mk-main">
        <h1 className="mk-h1">{s.inbox.title}</h1>
        <p className="mk-sub">{s.inbox.sub}</p>

        <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <InboxAdd s={s} />
          <div className="grid content-start gap-4">
            <section className="lp-card mk-panel">
              <h2 className="mk-h2">{s.inbox.forward}</h2>
              {domain && token ? (
                <>
                  <p className="mt-3 break-all rounded-xl px-4 py-3 font-semibold" style={{ background: "var(--tint)" }}>
                    offers+{token}@{domain}
                  </p>
                  <p className="lp-label mt-2">{s.inbox.forwardHint}</p>
                </>
              ) : (
                <p className="mt-2" style={{ color: "var(--ink-2)" }}>{s.inbox.forwardOff}</p>
              )}
            </section>
            {!WHATSAPP_LOCKED && (
              <section className="lp-card mk-panel">
                <h2 className="mk-h2">{s.inbox.whatsapp}</h2>
                <p className="mt-2" style={{ color: "var(--ink-2)" }}>{s.inbox.whatsappHint}</p>
                <Link href="/dashboard/whatsapp" className="lp-btn lp-btn--ghost mt-4" style={{ minHeight: 42 }}>
                  {s.inbox.whatsappLink}
                </Link>
              </section>
            )}
          </div>
        </div>

        <section className="mt-12">
          <div className="mk-list">{active.length ? active.map(row) : <p className="lp-card mk-panel" style={{ color: "var(--ink-2)" }}>{s.inbox.none}</p>}</div>
          {dismissed.length > 0 && (
            <details className="mt-8">
              <summary className="lp-label cursor-pointer">
                {s.inbox.dismiss} ({dismissed.length})
              </summary>
              <div className="mk-list">{dismissed.map(row)}</div>
            </details>
          )}
        </section>
      </main>
    </>
  );
}
