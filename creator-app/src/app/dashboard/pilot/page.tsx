"use client";

import { useEffect, useState } from "react";
import { useDashboard } from "@/components/dashboard-context";
import { Card, ErrorNote, PageHeader, Spinner } from "@/components/ui";
import type { PilotNumbers } from "@/lib/marketplace/pilot";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

function Num({ label, value, target, note, ok }: { label: string; value: string; target: string; note: string; ok: boolean | null }) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-2 font-display text-2xl tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-muted">{note}</p>
      <p className={`mt-3 text-xs ${ok ? "font-semibold text-good" : "text-muted"}`}>
        {ok ? "✓ " : ""}Target by 16 Dec: {target}
      </p>
    </Card>
  );
}

/** Admins only: the pilot's five numbers (founder/research/01-progress.md §4), the weekly trend and the bill check. */
export default function PilotPage() {
  const { me } = useDashboard();
  const [n, setN] = useState<PilotNumbers | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/admin/pilot", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<PilotNumbers>) : Promise.reject()))
      .then(setN)
      .catch(() => setFailed(true));
  }, []);

  if (me && !me.admin) return <ErrorNote>This page is for admins only.</ErrorNote>;

  return (
    <div className="rise">
      <PageHeader eyebrow="Admin" title="Pilot numbers">
        <a href="/api/admin/pilot/export" className="text-sm font-medium underline underline-offset-4">
          Download bill check (CSV)
        </a>
      </PageHeader>
      <p className="-mt-2 mb-6 max-w-2xl text-sm text-muted">
        The five numbers investors ask for first. Admin accounts are left out. Check counts against the bill book at 3 venues: download the sheet, fill in the bill column with the owner, and compare.
      </p>

      {failed && <ErrorNote>Couldn&apos;t load the pilot numbers.</ErrorNote>}
      {!n && !failed && (
        <Card>
          <Spinner label="Loading" />
        </Card>
      )}

      {n && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Num
              label="1 · Businesses counting"
              value={String(n.activeBusinesses.value)}
              note={`with a customer redeemed in the last 14 days · ${n.activeBusinesses.tracking} tracking, ${n.activeBusinesses.posts} posts`}
              target={`${n.activeBusinesses.target} (stretch 30)`}
              ok={n.activeBusinesses.value >= n.activeBusinesses.target}
            />
            <Num
              label="2 · Customers per post"
              value={n.customersPerPost.median == null ? "–" : `${n.customersPerPost.median} median`}
              note={
                n.customersPerPost.posts
                  ? `range ${n.customersPerPost.p25}–${n.customersPerPost.p75} (middle half), max ${n.customersPerPost.max}, over ${n.customersPerPost.posts} posts 3+ days old · ${n.customersPerPost.total} total (${n.customersPerPost.byPin} PIN, ${n.customersPerPost.byCounter} counter)`
                  : "no posts 3+ days old yet"
              }
              target="30+ posts; within ~20% of bills at 3 venues"
              ok={null}
            />
            <Num
              label="3 · Businesses paying"
              value={String(n.paying.value)}
              note={`on a paid plan · MRR ${inr(n.paying.mrrInr)} · ${n.paying.wouldPay} said they'd pay (${inr(n.paying.wouldPayMrrInr)}/month) · ${n.paying.paidDeals} Mitra deals paid to creators`}
              target="5–10 paying, any price"
              ok={n.paying.value >= 5}
            />
            <Num
              label="4 · Repeat rate"
              value={n.repeat.rate == null ? "–" : `${n.repeat.rate}%`}
              note={n.repeat.of ? `${n.repeat.repeated} of ${n.repeat.of} ran a 2nd post 1–30 days after their first` : "no business is 30 days in yet"}
              target={`≥${n.repeat.target}%`}
              ok={n.repeat.rate != null && n.repeat.rate >= n.repeat.target}
            />
            <Num
              label="5 · Creators using the inbox"
              value={String(n.inbox.creators)}
              note={`${n.inbox.offers} offers (${Object.entries(n.inbox.bySource)
                .map(([k, v]) => `${v} ${k}`)
                .join(", ") || "none"}) · ${n.inbox.scamsFlagged} flagged as likely scams · ${n.inbox.scamReports} scam reports`}
              target={`${n.inbox.target}+ forwarding without a founder DM`}
              ok={n.inbox.creators >= n.inbox.target}
            />
            <Card>
              <p className="text-xs uppercase tracking-wider text-muted">Also track weekly</p>
              <p className="mt-2 text-sm">Cost to sign up one business: rep hours, travel and printed standees ÷ businesses active.</p>
              <p className="mt-2 text-sm text-muted">Not in the database; keep it in the outreach sheet. It&apos;s the number most likely to break the model.</p>
            </Card>
          </div>

          <Card>
            <h2 className="mb-4 font-semibold">Last 8 weeks</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="py-2 pr-3">Week ending</th>
                    <th className="py-2 pr-3 text-right">Businesses counting</th>
                    <th className="py-2 pr-3 text-right">Customers counted</th>
                    <th className="py-2 pr-3 text-right">New tracked posts</th>
                    <th className="py-2 text-right">Inbox offers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {n.weeks.map((w) => (
                    <tr key={w.weekEnding}>
                      <td className="py-2.5 pr-3 tabular-nums">{w.weekEnding}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{w.activeBusinesses}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{w.customers}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{w.newPosts}</td>
                      <td className="py-2.5 text-right tabular-nums">{w.inboxOffers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted">As of {new Date(n.asOf).toLocaleString()}.</p>
          </Card>
        </div>
      )}
    </div>
  );
}
