"use client";

import { useEffect, useMemo, useState } from "react";
import { useDashboard } from "@/components/dashboard-context";
import { Card, ErrorNote, PageHeader, Spinner } from "@/components/ui";
import { languageLabel } from "@/lib/languages";

const FEATURE: Record<string, string> = {
  doctor: "Video Doctor", titles: "Titles", thumbnail: "Thumbnail design", image: "AI background", compose: "Pro thumbnail", chat: "Ask Mitra",
  trends: "Trend Radar", audience: "Audience", slang: "Slang", comments: "Comments", competitors: "Competitors", breakouts: "Breakout ideas",
  report: "Reports (Mitra pays)", outreach: "Outreach (admin)",
};
const feature = (f: string) => FEATURE[f] ?? f;

interface Row {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  language: string;
  founderNumber: number | null;
  createdAt: string;
  channel: string | null;
  needsReconnect: boolean;
  whatsapp: string | null;
  creditsUsed: number;
  founderUses: number;
  lastSeen: string | null;
  aiCalls: number;
  lastAi: string | null;
  costUsd: number;
  reportsSent: number;
}
interface Detail {
  user: { id: string; email: string; name: string | null; plan: string; language: string; createdAt: string; founderNumber: number | null };
  byFeature: { feature: string; calls: number; costUsd: number; first: string; last: string }[];
  recent: { feature: string; model: string; costUsd: number; latencyMs: number; createdAt: string }[];
  reports: { kind: string; key: string; channel: string; status: string; error: string | null; createdAt: string; sentAt: string | null }[];
  months: { month: string; credits: number; founderUses: number }[];
}

const INR = 88;
const inr = (usd: number) => `₹${(usd * INR).toFixed(usd * INR < 10 ? 2 : 0)}`;
const when = (s: string | null) => (s ? new Date(s).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "—");

/** Admins only: every creator who signed up, what they connected and what they've used. */
export default function UsersPage() {
  const { me } = useDashboard();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);

  useEffect(() => {
    fetch("/api/admin/users", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<{ users: Row[] }>) : Promise.reject()))
      .then((d) => setRows(d.users))
      .catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    if (!open) return;
    let live = true;
    fetch(`/api/admin/users?id=${encodeURIComponent(open)}`, { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<Detail>) : Promise.reject()))
      .then((d) => live && setDetail(d))
      .catch(() => live && setDetail(null));
    return () => {
      live = false;
    };
  }, [open]);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (rows ?? []).filter((r) => !t || `${r.name ?? ""} ${r.email} ${r.channel ?? ""}`.toLowerCase().includes(t));
  }, [rows, q]);

  if (me && !me.admin) return <ErrorNote>This page is for admins only.</ErrorNote>;
  const connected = (rows ?? []).filter((r) => r.channel).length;
  const active = (rows ?? []).filter((r) => r.aiCalls > 0).length;

  return (
    <div>
      <PageHeader eyebrow="Users" title="Everyone who signed up, what they connected and what they used." />
      {failed && <ErrorNote>Couldn&apos;t load users.</ErrorNote>}
      {!rows && !failed && <Spinner label="Loading users" />}
      {rows && (
        <>
          <div className="mb-4 grid grid-cols-3 gap-3">
            {[
              ["Signed up", rows.length],
              ["Connected YouTube", connected],
              ["Used AI", active],
            ].map(([l, v]) => (
              <Card key={l} className="!p-4">
                <p className="text-xs text-muted">{l}</p>
                <p className="mt-1 text-2xl font-semibold">{v}</p>
              </Card>
            ))}
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email or channel"
            className="mb-3 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <Card className="!p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-line text-xs text-muted">
                  <tr>
                    {["Creator", "Channel", "Joined", "Last sign-in", "AI calls", "Credits (this month)", "Cost", "Reports"].map((h) => (
                      <th key={h} className="px-4 py-2.5 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {shown.map((r) => (
                    <tr key={r.id} onClick={() => (setOpen(r.id === open ? null : r.id), setDetail(null))} className={`cursor-pointer hover:bg-surface-2 ${open === r.id ? "bg-surface-2" : ""}`}>
                      <td className="px-4 py-2.5">
                        <p className="font-medium">{r.name ?? "—"}</p>
                        <p className="text-xs text-muted">{r.email}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        {r.channel ?? <span className="text-muted">not connected</span>}
                        {r.needsReconnect && <span className="ml-1 text-xs text-bad">needs reconnect</span>}
                      </td>
                      <td className="px-4 py-2.5 text-xs">{when(r.createdAt)}</td>
                      <td className="px-4 py-2.5 text-xs">{when(r.lastSeen)}</td>
                      <td className="px-4 py-2.5">{r.aiCalls}</td>
                      <td className="px-4 py-2.5">
                        {r.creditsUsed}
                        {r.founderUses > 0 && <span className="text-xs text-muted"> + {r.founderUses} free</span>}
                      </td>
                      <td className="px-4 py-2.5">{inr(r.costUsd)}</td>
                      <td className="px-4 py-2.5">{r.reportsSent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          {open && (
            <Card className="mt-4">
              {!detail ? (
                <Spinner label="Loading" />
              ) : (
                <>
                  <h2 className="font-semibold">{detail.user.name ?? detail.user.email}</h2>
                  <p className="text-xs text-muted">
                    {detail.user.email} · {detail.user.plan} plan · writes in {languageLabel(detail.user.language)}
                    {detail.user.founderNumber != null && ` · Founding Creator #${detail.user.founderNumber}`} · joined {when(detail.user.createdAt)}
                  </p>
                  <div className="mt-5 grid gap-6 lg:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-medium">What they used</h3>
                      {detail.byFeature.length ? (
                        <table className="mt-2 w-full text-sm">
                          <thead className="text-xs text-muted">
                            <tr>
                              <th className="py-1 text-left font-medium">Feature</th>
                              <th className="py-1 text-right font-medium">Calls</th>
                              <th className="py-1 text-right font-medium">Cost</th>
                              <th className="py-1 text-right font-medium">Last</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-line">
                            {detail.byFeature.map((f) => (
                              <tr key={f.feature}>
                                <td className="py-1.5">{feature(f.feature)}</td>
                                <td className="py-1.5 text-right">{f.calls}</td>
                                <td className="py-1.5 text-right">{inr(f.costUsd)}</td>
                                <td className="py-1.5 text-right text-xs text-muted">{when(f.last)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="mt-2 text-sm text-muted">No AI features used yet.</p>
                      )}
                      <h3 className="mt-5 text-sm font-medium">Credits by month</h3>
                      <p className="mt-1 text-sm text-ink-2">
                        {detail.months.length ? detail.months.map((m) => `${m.month}: ${m.credits}${m.founderUses ? ` + ${m.founderUses} free` : ""}`).join(" · ") : "None yet"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Latest activity</h3>
                      <ul className="mt-2 max-h-72 space-y-1 overflow-y-auto text-sm">
                        {detail.recent.map((r, i) => (
                          <li key={i} className="flex justify-between gap-3">
                            <span>{feature(r.feature)}</span>
                            <span className="text-xs text-muted">
                              {when(r.createdAt)} · {(r.latencyMs / 1000).toFixed(1)}s
                            </span>
                          </li>
                        ))}
                        {!detail.recent.length && <li className="text-muted">Nothing yet</li>}
                      </ul>
                      <h3 className="mt-5 text-sm font-medium">Reports</h3>
                      <ul className="mt-2 space-y-1 text-sm">
                        {detail.reports.map((r, i) => (
                          <li key={i} className="flex justify-between gap-3">
                            <span>
                              {r.kind === "weekly" ? "Monday report" : "Video check"} · {r.channel}
                            </span>
                            <span className={`text-xs ${r.status === "sent" ? "text-good" : r.status === "failed" ? "text-bad" : "text-muted"}`} title={r.error ?? undefined}>
                              {r.status} · {when(r.sentAt ?? r.createdAt)}
                            </span>
                          </li>
                        ))}
                        {!detail.reports.length && <li className="text-muted">None yet</li>}
                      </ul>
                    </div>
                  </div>
                </>
              )}
            </Card>
          )}
          <p className="mt-3 text-xs text-muted">Counts real AI calls only: a repeated question answered from cache isn&apos;t counted. Page visits aren&apos;t tracked.</p>
        </>
      )}
    </div>
  );
}
