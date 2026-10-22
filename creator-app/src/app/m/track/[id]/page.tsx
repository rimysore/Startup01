import Link from "next/link";
import { notFound } from "next/navigation";
import { MTop } from "@/components/m/MTop";
import { ShareLink, TrackStatus } from "@/components/m/TrackParts";
import { marketPageFor } from "@/lib/marketplace/page";
import { getTracked } from "@/lib/marketplace/track";

// Reads the session and may redirect: renders per request (see the /m layout).
export const instant = false;

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** One tracked post: its code and link to send the creator, and what it has brought in. */
export default async function TrackedPostPage({ params }: PageProps<"/m/track/[id]">) {
  const { id } = await params;
  const { user, member, s } = await marketPageFor(`/m/track/${id}`, "business");
  const post = await getTracked(user.id, id);
  if (!post) notFound();
  return (
    <>
      <MTop s={s} role={member.role} lang={member.uiLanguage} active="track" />
      <main className="lp-wrap mk-main" style={{ maxWidth: 900 }}>
        <Link href="/m/track" className="lp-link text-[14px]" style={{ color: "var(--ink-2)" }}>
          ← {s.track.title}
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="mk-h1">{post.creatorName}</h1>
            <p className="mk-sub">
              {[post.creatorHandle ? `@${post.creatorHandle}` : null, post.kind === "barter" ? (post.barterNote ?? s.track.barter) : post.baseFeeInr != null ? inr(post.baseFeeInr) : s.track.paid, post.dealId ? s.track.fromMitra : null]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <span className={`lp-chip ${post.status === "active" ? "lp-chip--ok" : ""}`}>{post.status === "active" ? (post.kind === "barter" ? s.track.barter : s.track.paid) : s.track.ended}</span>
        </div>

        <section className="mk-grid">
          <div className="lp-card mk-panel">
            <p className="lp-label capitalize">{s.track.customers}</p>
            <p className="mk-stat mt-2">{post.stats.customers}</p>
            <p className="mt-2 text-[14px]" style={{ color: "var(--ink-2)" }}>
              {post.stats.opened} {s.track.opened}
              {post.stats.perCustomer != null ? ` · ${inr(post.stats.perCustomer)} ${s.track.perCustomer}` : ""}
            </p>
            {post.bonusPerCustomerInr != null && (
              <p className="mt-2 text-[14px]" style={{ color: "var(--ink-2)" }}>
                {s.terms.bonusLine}: {inr(post.bonusPerCustomerInr)} {s.terms.perCustomer}
                {post.bonusCapInr != null ? `, ${s.terms.upTo} ${inr(post.bonusCapInr)}` : ""} · {s.terms.bonusEarned} {inr(post.stats.bonus)}
              </p>
            )}
            {post.stats.due > 0 && (
              <p className="mt-1 text-[14px] font-semibold">
                {s.terms.due}: {inr(post.stats.due)}
              </p>
            )}
          </div>
          <div className="lp-card mk-panel">
            <p className="lp-label">{s.track.code}</p>
            <p className="mk-codebig mt-2">{post.promoCode}</p>
            <p className="mt-2 text-[14px]" style={{ color: "var(--ink-2)" }}>
              {post.offerText}
            </p>
          </div>
        </section>

        <section className="lp-card mk-panel mt-6">
          <ShareLink s={s} path={`/r/${post.linkCode}`} offer={post.offerText} code={post.promoCode} />
        </section>

        <div className="mk-bar mt-6">
          <Link href="/m/track/counter" className="lp-btn">
            {s.track.counter}
          </Link>
          {post.postUrl && (
            <a href={post.postUrl} className="lp-btn lp-btn--ghost" target="_blank" rel="noopener noreferrer" style={{ minHeight: 44 }}>
              {s.track.postUrl.replace(/\s*\(.*\)$/, "")}
            </a>
          )}
          <TrackStatus s={s} id={post.id} status={post.status} />
        </div>
      </main>
    </>
  );
}
