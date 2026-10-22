"use client";

import { useEffect, useMemo, useState } from "react";
import { useDashboard } from "@/components/dashboard-context";
import { Card, ErrorNote, PageHeader, Spinner } from "@/components/ui";
import type { AdminMember } from "@/lib/marketplace/members-admin";

const compact = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(n));
const day = (d: string | Date | null) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "–");
const ROLES = ["all", "creator", "business", "brand", "agency"] as const;

/** The Creator Pass for one creator: its state, and a switch for after they've paid (e.g. by UPI). */
function PassCell({ m, onChange }: { m: AdminMember; onChange: (paidUntil: Date | null) => void }) {
  const [busy, setBusy] = useState(false);
  const active = m.pass.paidUntil && new Date(m.pass.paidUntil) > new Date();
  const set = async (on: boolean) => {
    if (!confirm(on ? `Switch the Creator Pass on for ${m.name || m.email} for a year?` : `Switch off ${m.name || m.email}'s Creator Pass?`)) return;
    setBusy(true);
    const r = await fetch(`/api/admin/members/${m.userId}/pass`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ on }) });
    const j = (await r.json().catch(() => null)) as { paidUntil?: string | null } | null;
    setBusy(false);
    if (r.ok) onChange(j?.paidUntil ? new Date(j.paidUntil) : null);
  };
  return (
    <p className="mt-1">
      {active ? <span className="font-semibold text-good">Pass until {day(m.pass.paidUntil)}</span> : m.pass.wantsAt ? <span className="font-semibold">Wants the pass</span> : "No pass"}{" "}
      <button type="button" className="underline" disabled={busy} onClick={() => set(!active)}>
        {active ? "switch off" : "switch on"}
      </button>
    </p>
  );
}

/** Admins only: everyone on the marketplace, their profile and what they've used. */
export default function MembersPage() {
  const { me } = useDashboard();
  const [rows, setRows] = useState<AdminMember[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [role, setRole] = useState<(typeof ROLES)[number]>("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/admin/members", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<AdminMember[]>) : Promise.reject()))
      .then(setRows)
      .catch(() => setFailed(true));
  }, []);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (rows ?? []).filter(
      (m) => (role === "all" || m.role === role) && (!needle || [m.name, m.email, m.area, m.what].some((v) => v?.toLowerCase().includes(needle))),
    );
  }, [rows, role, q]);
  const byRole = useMemo(() => {
    const out: Record<string, number> = {};
    for (const m of rows ?? []) out[m.role] = (out[m.role] ?? 0) + 1;
    return out;
  }, [rows]);

  if (me && !me.admin) return <ErrorNote>This page is for admins only.</ErrorNote>;

  return (
    <div className="rise">
      <PageHeader eyebrow="Admin" title="Members" />
      <p className="-mt-2 mb-6 max-w-2xl text-sm text-muted">
        Every creator, brand and business with an account, newest first: their profile, verified accounts and what they&apos;ve used. Members never see this dashboard.
      </p>
      {failed && <ErrorNote>Couldn&apos;t load members.</ErrorNote>}
      {!rows && !failed && (
        <Card>
          <Spinner label="Loading" />
        </Card>
      )}
      {rows && (
        <Card>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {ROLES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`rounded-full border px-3 py-1 text-xs capitalize ${role === r ? "border-ink bg-ink text-surface" : "border-line text-ink-2"}`}
              >
                {r} {r === "all" ? rows.length : (byRole[r] ?? 0)}
              </button>
            ))}
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, email, area"
              className="ml-auto w-56 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="py-2 pr-3">Member</th>
                  <th className="py-2 pr-3">Area · what</th>
                  <th className="py-2 pr-3">Accounts</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Usage</th>
                  <th className="py-2 pr-3 text-right">Joined</th>
                  <th className="py-2 text-right">Last seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line align-top">
                {shown.map((m) => (
                  <tr key={m.userId}>
                    <td className="py-2.5 pr-3">
                      <p className="font-medium">{m.name || "–"}</p>
                      <p className="text-xs text-muted">
                        <span className="capitalize">{m.role}</span> · {m.email} · {m.language === "kn" ? "Kannada" : "English"}
                      </p>
                    </td>
                    <td className="py-2.5 pr-3 text-ink-2">
                      {m.area ?? "–"}
                      <p className="text-xs text-muted">{m.what || "–"}</p>
                    </td>
                    <td className="py-2.5 pr-3 text-xs">
                      {m.handles.length
                        ? m.handles.map((h) => (
                            <p key={h.platform}>
                              {h.platform} {h.handle}
                              {h.followers != null && ` · ${compact(h.followers)}`}
                              {h.verified ? <span className="ml-1 font-semibold text-good">verified</span> : <span className="ml-1 text-muted">self-reported</span>}
                            </p>
                          ))
                        : <span className="text-muted">–</span>}
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-ink-2">
                      {m.role === "creator" ? (
                        <>
                          <p>{m.openToOffers ? "Open to offers" : "Not open"}</p>
                          <p>{m.publicKit ? <a href={m.publicKit} className="underline">Public kit</a> : "Kit private"}</p>
                          <PassCell m={m} onChange={(paidUntil) => setRows((r) => r?.map((x) => (x.userId === m.userId ? { ...x, pass: { ...x.pass, paidUntil } } : x)) ?? null)} />
                        </>
                      ) : (
                        <>
                          <p>{m.listed ? "Listed for creators" : "Unlisted"}</p>
                          <p>
                            Plan {m.plan ?? "free"}
                            {m.planInterest && ` · wants ${m.planInterest}`}
                          </p>
                        </>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-ink-2">
                      {m.role === "creator" ? (
                        <p>
                          {m.counts.businessInterests} interested · {m.counts.programInterests} programs · {m.counts.inboxOffers} offers checked · {m.counts.deals} deals · {m.counts.autoDms} Auto-DMs, {m.counts.dmsSent} DMs sent
                        </p>
                      ) : (
                        <p>
                          {m.counts.creatorsInterested} creators interested · {m.counts.briefs} briefs · {m.counts.trackedPosts} tracked posts
                        </p>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{day(m.joined)}</td>
                    <td className="py-2.5 text-right tabular-nums">{day(m.lastSeen)}</td>
                  </tr>
                ))}
                {!shown.length && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-muted">
                      No members match.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
