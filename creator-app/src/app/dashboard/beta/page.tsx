"use client";

import { useEffect, useState } from "react";
import { useDashboard } from "@/components/dashboard-context";
import { useStoredString } from "@/components/hooks";
import { Card, ErrorNote, PageHeader, Spinner } from "@/components/ui";
import type { BetaMetrics } from "@/lib/beta-metrics";

const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "—");

function Table({ head, rows, empty }: { head: string[]; rows: React.ReactNode[][]; empty: string }) {
  if (!rows.length) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted">
            {head.map((h) => (
              <th key={h} className="pb-2 pr-4 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className="py-2 pr-4 tabular-nums">{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Admins only: the beta's weekly numbers (docs/BETA.md). Spend per source is typed here and kept in this browser;
 * count founder hours at a fixed rupee rate so a source isn't "free" just because you did the work.
 */
export default function BetaMetricsPage() {
  const { me } = useDashboard();
  const [m, setM] = useState<BetaMetrics | null>(null);
  const [failed, setFailed] = useState(false);
  const [spendRaw, setSpendRaw] = useStoredString("mitra-beta-spend", "{}");
  let spend: Record<string, number> = {};
  try {
    spend = JSON.parse(spendRaw) as Record<string, number>;
  } catch {}

  useEffect(() => {
    if (!me?.admin) return;
    let live = true;
    fetch("/api/admin/beta", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<BetaMetrics>) : Promise.reject()))
      .then((d) => live && setM(d))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [me?.admin]);

  if (!me) return <Spinner label="Loading" />;
  if (!me.admin) return <ErrorNote>This page is for admins.</ErrorNote>;
  if (failed) return <ErrorNote>Couldn&apos;t load the beta metrics.</ErrorNote>;
  if (!m) return <Spinner label="Counting" />;

  const setSpend = (source: string, value: string) => setSpendRaw(JSON.stringify({ ...spend, [source]: Number(value.replace(/\D/g, "")) || 0 }));
  const r = m.repeat;

  return (
    <div className="rise space-y-6">
      <PageHeader eyebrow="Admin" title="Beta metrics" />
      <p className="text-sm text-muted">
        {m.events} events{m.from ? `, ${m.from.slice(0, 10)} to ${m.to?.slice(0, 10)}` : ""}. Downloads:{" "}
        <a href="/api/admin/beta?format=wtp" className="font-medium text-accent">price survey CSV</a> ·{" "}
        <a href="/api/admin/beta?format=reviews" className="font-medium text-accent">language reviews</a>
      </p>

      <Card>
        <h2 className="mb-3 font-semibold">1. Where creators come from, and what each costs</h2>
        <Table
          head={["Source (first touch)", "Visitors", "Connected", "Ran a diagnosis", "Spend (₹)", "₹ / connected", "₹ / activated"]}
          rows={m.sources.map((s) => [
            s.source,
            s.visitors,
            s.connected,
            s.activated,
            <input
              key="spend"
              value={spend[s.source] ? String(spend[s.source]) : ""}
              onChange={(e) => setSpend(s.source, e.target.value)}
              inputMode="numeric"
              placeholder="0"
              aria-label={`Spend for ${s.source}`}
              className="w-24 rounded border border-line bg-surface px-2 py-1"
            />,
            spend[s.source] && s.connected ? Math.round(spend[s.source] / s.connected) : "—",
            spend[s.source] && s.activated ? Math.round(spend[s.source] / s.activated) : "—",
          ])}
          empty="No visits yet. Tag every link you share with ?utm_source=…"
        />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">2. Do they come back?</h2>
          <p className="mb-3 text-xs text-muted">From each creator&apos;s first real diagnosis; a creator counts once enough time has passed.</p>
          <Table head={["Window", "Eligible", "Came back", "Retention"]} rows={m.retention.map((w) => [w.window, w.eligible, w.returned, pct(w.returned, w.eligible)])} empty="—" />
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">3. Do they use Video Doctor again?</h2>
          <Table
            head={["Measure", "Value"]}
            rows={[
              ["Creators with a diagnosis", r.creators],
              ["Diagnosed on 2+ days", `${r.twoDays} (${pct(r.twoDays, r.creators)})`],
              ["Diagnosed in 2+ weeks", `${r.twoWeeks} (${pct(r.twoWeeks, r.creators)})`],
              ["Median diagnoses per creator", r.medianRuns ?? "—"],
              ["Retention Sprints started", r.sprints],
              ["Early reads (low-view videos)", r.earlyReads],
            ]}
            empty="—"
          />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">4. Who they are</h2>
          <Table head={["Segment (interview)", "Creators", "Ran a diagnosis"]} rows={m.segments.map((s) => [s.segment, s.creators, `${s.activated} (${pct(s.activated, s.creators)})`])} empty="No interview answers yet." />
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">5. How the language reads</h2>
          <p className="mb-3 text-xs text-muted">Gate: under 15% &ldquo;sounds translated&rdquo; to keep recruiting in that language.</p>
          <Table
            head={["Language", "Ratings", "Natural", "A bit off", "Translated", "Useful"]}
            rows={m.language.map((l) => [l.language, l.ratings, pct(l.natural, l.ratings), pct(l.okay, l.ratings), pct(l.translated, l.ratings), pct(l.helpful, l.helpfulAnswers)])}
            empty="No ratings yet."
          />
        </Card>
      </div>

      <Card>
        <h2 className="mb-1 font-semibold">6. Documented results (goal: 5–10)</h2>
        <p className="mb-3 text-sm">
          <b>{m.solidResults}</b> with 4+ uploads measured and a real improvement. Smaller samples are encouraging, not proof.
        </p>
        <Table
          head={["Shared", "Language", "Before %", "After %", "Change", "Uploads", "Can be named"]}
          rows={m.results.map((x) => [
            x.at.slice(0, 10),
            x.language ?? "—",
            x.baselinePct,
            x.afterPct,
            `${x.afterPct - x.baselinePct >= 0 ? "+" : ""}${(x.afterPct - x.baselinePct).toFixed(1)} pts`,
            x.uploads,
            x.named ?? "no",
          ])}
          empty="No shared results yet."
        />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">7. Price survey (₹ / month)</h2>
          <Table
            head={["Too cheap", "Bargain", "Expensive", "Too expensive", "Segment"]}
            rows={m.wtp.map((w) => [w.too_cheap, w.cheap, w.expensive, w.too_expensive, w.segment ?? "—"])}
            empty="No answers yet (asked after a creator's second diagnosis)."
          />
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">8. Benchmark data (opted in)</h2>
          <p className="mb-3 text-xs text-muted">Show a group to creators only once it has 10+ channels.</p>
          <Table
            head={["Group", "Channels", "Median % viewed", "Ready"]}
            rows={m.benchmark.map((b) => [b.group, b.channels, b.medianPct ?? "—", b.channels >= 10 ? "yes" : "not yet"])}
            empty="No samples yet."
          />
        </Card>
      </div>
    </div>
  );
}
