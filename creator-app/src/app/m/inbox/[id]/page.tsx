import Link from "next/link";
import { notFound } from "next/navigation";
import { MTop } from "@/components/m/MTop";
import { InboxActions, ReplyBox, SenderForm } from "@/components/m/InboxParts";
import { getInboxOffer, verdictOf } from "@/lib/marketplace/inbox";
import { marketPageFor } from "@/lib/marketplace/page";
import { offerReply } from "@/lib/offer-check";

// Reads the session and may redirect: renders per request (see the /m layout).
export const instant = false;

const ICON: Record<string, { stroke: string; d: string }> = {
  ok: { stroke: "var(--ok)", d: "M4 10.5 8 14.5 16 5.5" },
  good: { stroke: "var(--ok)", d: "M4 10.5 8 14.5 16 5.5" },
  info: { stroke: "var(--ink-3)", d: "M10 9v6M10 5.5v.5" },
  warn: { stroke: "var(--warn)", d: "M10 4v7M10 15.5v.5" },
  bad: { stroke: "var(--miss)", d: "M5 5l10 10M15 5 5 15" },
  missing: { stroke: "var(--miss)", d: "M5 5l10 10M15 5 5 15" },
};
const VERDICT_CHIP: Record<string, string> = { likely_scam: "mk-v-bad", careful: "mk-v-warn", looks_ok: "mk-v-ok", unknown: "" };

function Line({ level, text, source }: { level: string; text: string; source?: string }) {
  const i = ICON[level] ?? ICON.info;
  return (
    <div className="lp-res">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={i.stroke} strokeWidth="2.4" strokeLinecap="round" aria-hidden>
        <path d={i.d} />
      </svg>
      <span>
        {text}
        {source && <span className="lp-label"> · {source}</span>}
      </span>
    </div>
  );
}

/** One offer: the message, who sent it (the sender check), what it says (the offer check), a reply, and actions. */
export default async function InboxOfferPage({ params }: PageProps<"/m/inbox/[id]">) {
  const { id } = await params;
  const { user, member, s } = await marketPageFor(`/m/inbox/${id}`, "creator");
  const o = await getInboxOffer(user.id, id);
  if (!o) notFound();
  const v = verdictOf(o);
  const verdict = v?.verdict ?? "unknown";
  const lang = member.uiLanguage === "kn" ? "kn" : "en";
  const replies = { en: offerReply(o.checks as never, "en"), kn: offerReply(o.checks as never, "kn") };
  return (
    <>
      <MTop s={s} role="creator" lang={member.uiLanguage} active="inbox" />
      <main className="lp-wrap mk-main">
        <Link href="/m/inbox" className="lp-link text-[14px]" style={{ color: "var(--ink-2)" }}>
          ← {s.inbox.title}
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="lp-label">
              {s.inbox.sources[o.source]} · {o.receivedAt.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
            </p>
            <h1 className="mk-h1 mt-1">{o.senderName || o.senderHandle || o.senderEmail || s.inbox.unknownSender}</h1>
            {o.subject && <p className="mk-sub">{o.subject}</p>}
          </div>
          <span className={`lp-chip ${VERDICT_CHIP[verdict]}`} style={{ minHeight: 34, fontSize: 15, padding: "0 14px" }}>
            {s.inbox.verdict[verdict]}
          </span>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="grid content-start gap-4">
            <section className="lp-card mk-panel">
              <p className="lp-reply" style={{ marginTop: 0, whiteSpace: "pre-line" }}>
                {o.body}
              </p>
            </section>
            <section className="lp-card mk-panel">
              <h2 className="mk-h2">{s.inbox.offerTitle}</h2>
              <div className="mt-1">
                {o.checks.map((c) => (
                  <Line key={c.term} level={c.state} text={c.text} />
                ))}
              </div>
            </section>
            {(replies.en || replies.kn) && <ReplyBox s={s} lang={lang} replies={replies} />}
          </div>

          <div className="grid content-start gap-4">
            <section className="lp-card mk-panel">
              <h2 className="mk-h2">{s.inbox.senderTitle}</h2>
              <div className="mt-1">
                {v?.signals.length ? v.signals.map((x, i) => <Line key={i} level={x.level} text={x.text} source={x.source} />) : <p className="mt-2" style={{ color: "var(--ink-2)" }}>{s.inbox.noSignals}</p>}
              </div>
              {(v?.brand || v?.domain?.registered) && (
                <div className="lp-deal__rows">
                  {v?.brand && (
                    <div className="lp-deal__row">
                      <span>{s.inbox.brand}</span>
                      <b>
                        {v.brand.name}
                        {v.brand.description ? ` · ${v.brand.description}` : ""}
                      </b>
                    </div>
                  )}
                  {v?.domain?.registered && (
                    <div className="lp-deal__row">
                      <span>{s.inbox.domainAge}</span>
                      <b>
                        {v.domain.name} · {new Date(v.domain.registered).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                      </b>
                    </div>
                  )}
                </div>
              )}
              <SenderForm s={s} id={o.id} initial={{ senderName: o.senderName ?? "", senderEmail: o.senderEmail ?? "", senderPhone: o.senderPhone ?? "", senderHandle: o.senderHandle ?? "" }} />
            </section>
            <InboxActions s={s} id={o.id} status={o.status} dealId={o.dealId} />
            <p className="lp-label">{s.inbox.sourcesNote}</p>
          </div>
        </div>
      </main>
    </>
  );
}
