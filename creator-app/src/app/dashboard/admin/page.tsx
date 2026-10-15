"use client";

import { useEffect, useState } from "react";
import { useDashboard } from "@/components/dashboard-context";
import { Button, Card, ErrorNote, PageHeader, Spinner } from "@/components/ui";

interface RouteRow {
  feature: string;
  model: string;
  calls: number;
  users: number;
  avgInputTokens: number;
  avgOutputTokens: number;
  avgLatencyMs: number;
  costUsd: number;
  usdPerCall: number;
}
interface Report {
  days: number;
  totalUsd: number;
  dailyBudgetUsd: number | null;
  byRoute: RouteRow[];
  recent: { feature: string; model: string; inputTokens: number; outputTokens: number; costUsd: number; latencyMs: number; createdAt: string }[];
}

const RUPEES_PER_USD = 88;
const usd = (n: number) => `$${n < 0.01 ? n.toFixed(4) : n.toFixed(2)}`;
const inr = (n: number) => `₹${(n * RUPEES_PER_USD).toFixed(n * RUPEES_PER_USD < 1 ? 2 : 0)}`;

/** Admins only: where the AI money goes, by feature and model, plus the latest calls. */
export default function AdminPage() {
  const { me, refreshMe } = useDashboard();
  const [days, setDays] = useState(7);
  const [report, setReport] = useState<Report | null>(null);
  const [failed, setFailed] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(`/api/admin/costs?days=${days}`, { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<Report>) : Promise.reject()))
      .then((r) => live && (setReport(r), setFailed(false)))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [days]);

  async function resetCredits() {
    setResetting(true);
    await fetch("/api/admin/reset-credits", { method: "POST" });
    setResetting(false);
    refreshMe();
  }

  if (me && !me.admin) return <ErrorNote>This page is for admins only.</ErrorNote>;

  return (
    <div className="rise">
      <PageHeader eyebrow="Admin" title="Where the AI money goes">
        <div className="flex flex-wrap items-center gap-2">
          {[1, 7, 30].map((d) => (
            <Button key={d} variant={d === days ? "primary" : "ghost"} onClick={() => setDays(d)}>
              {d === 1 ? "Today" : `${d} days`}
            </Button>
          ))}
        </div>
      </PageHeader>

      {failed && <ErrorNote>Couldn&apos;t load the cost report.</ErrorNote>}
      {!report && !failed && <Card><Spinner label="Loading costs" /></Card>}

      {report && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <p className="text-xs uppercase tracking-wider text-muted">Spend · {report.days === 1 ? "today" : `${report.days} days`}</p>
              <p className="mt-2 font-display text-4xl tabular-nums">{usd(report.totalUsd)}</p>
              <p className="mt-1 text-sm text-muted">≈ {inr(report.totalUsd)}</p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-wider text-muted">AI calls</p>
              <p className="mt-2 font-display text-4xl tabular-nums">{report.byRoute.reduce((a, r) => a + r.calls, 0)}</p>
              <p className="mt-1 text-sm text-muted">Cached answers are free and not counted</p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-wider text-muted">Daily safety cap</p>
              <p className="mt-2 font-display text-4xl tabular-nums">{report.dailyBudgetUsd ? usd(report.dailyBudgetUsd) : "Off"}</p>
              <p className="mt-1 text-sm text-muted">AI_DAILY_BUDGET_USD</p>
            </Card>
          </div>

          <Card>
            <h2 className="mb-4 font-semibold">By feature</h2>
            {report.byRoute.length === 0 ? (
              <p className="text-sm text-muted">No AI calls in this period yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-wider text-muted">
                    <tr>
                      <th className="py-2 pr-3">Feature</th>
                      <th className="py-2 pr-3">Model</th>
                      <th className="py-2 pr-3 text-right">Calls</th>
                      <th className="py-2 pr-3 text-right">Avg tokens in / out</th>
                      <th className="py-2 pr-3 text-right">Per call</th>
                      <th className="py-2 pr-3 text-right">Total</th>
                      <th className="py-2 text-right">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {report.byRoute.map((r) => (
                      <tr key={`${r.feature}-${r.model}`}>
                        <td className="py-2.5 pr-3 font-medium capitalize">{r.feature}</td>
                        <td className="py-2.5 pr-3 text-muted">{r.model.replace("claude-", "")}</td>
                        <td className="py-2.5 pr-3 text-right tabular-nums">{r.calls}</td>
                        <td className="py-2.5 pr-3 text-right tabular-nums">{r.avgInputTokens.toLocaleString()} / {r.avgOutputTokens.toLocaleString()}</td>
                        <td className="py-2.5 pr-3 text-right tabular-nums">{usd(r.usdPerCall)} <span className="text-muted">({inr(r.usdPerCall)})</span></td>
                        <td className="py-2.5 pr-3 text-right tabular-nums">{usd(r.costUsd)}</td>
                        <td className="py-2.5 text-right tabular-nums">{report.totalUsd ? Math.round((r.costUsd / report.totalUsd) * 100) : 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-3 text-xs text-muted">Output tokens include the model&apos;s thinking. Converted at ₹{RUPEES_PER_USD}/$.</p>
          </Card>

          {report.recent.length > 0 && (
            <Card>
              <h2 className="mb-4 font-semibold">Latest calls</h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <tbody className="divide-y divide-line">
                    {report.recent.map((r, i) => (
                      <tr key={i}>
                        <td className="py-2 pr-3 text-muted tabular-nums">{new Date(r.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</td>
                        <td className="py-2 pr-3 capitalize">{r.feature}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{r.inputTokens.toLocaleString()} in</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{r.outputTokens.toLocaleString()} out</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{(r.latencyMs / 1000).toFixed(1)}s</td>
                        <td className="py-2 text-right tabular-nums">{usd(r.costUsd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <Card>
            <h2 className="font-semibold">Testing</h2>
            <p className="mt-1 text-sm text-muted">
              Your credits this month: {me?.usage?.used ?? 0} / {me?.usage?.limit ?? 0}. Free-plan allowance comes from FREE_CREDITS in Vercel.
            </p>
            <Button className="mt-3" variant="ghost" onClick={resetCredits} disabled={resetting}>
              {resetting ? "Resetting…" : "Reset my credits to 0 used"}
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
