"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useDashboard } from "@/components/dashboard-context";
import { Button, Card, PageHeader, Spinner } from "@/components/ui";
import { SPRINT_UPLOADS } from "@/lib/beta";
import { COMPANY } from "@/lib/company";
import { shortDate } from "@/lib/format";
import { track } from "@/lib/track";
import type { Video } from "@/lib/types";

interface Sprint {
  videoId: string;
  videoTitle: string;
  fixes: string[];
  baselinePct: number | null;
  createdAt: string;
}

interface Outcome {
  after: Video[];
  measured: Video[];
  afterPct: number | null;
  delta: number | null;
}

/** Uploads published after the creator committed to the fixes, against the channel's average at that time. */
function outcome(s: Sprint, videos: Video[]): Outcome {
  const from = new Date(s.createdAt).getTime();
  const after = videos.filter((v) => v.id !== s.videoId && new Date(v.publishedAtIso ?? v.publishedAt).getTime() >= from - 86_400_000);
  const measured = after.filter((v) => v.avgViewPct != null);
  const afterPct = measured.length ? measured.reduce((a, v) => a + (v.avgViewPct ?? 0), 0) / measured.length : null;
  const delta = afterPct != null && s.baselinePct != null ? afterPct - s.baselinePct : null;
  return { after, measured, afterPct, delta };
}

function ShareResult({ s, o }: { s: Sprint; o: Outcome }) {
  const { summary, language } = useDashboard();
  const [named, setNamed] = useState(false);
  const [sent, setSent] = useState(false);
  if (sent) return <p className="mt-4 text-sm text-good">Shared. Thank you, this is how we show Mitra works.</p>;
  return (
    <div className="mt-4 rounded-lg border border-line p-4">
      <p className="text-sm font-semibold">Share this result with the Mitra team?</p>
      <p className="mt-1 text-xs text-muted">We only see the numbers above, unless you tick the box.</p>
      <label className="mt-3 flex items-start gap-2 text-sm">
        <input type="checkbox" checked={named} onChange={(e) => setNamed(e.target.checked)} className="mt-1" />
        You can name my channel in a case study (we&apos;ll ask before publishing anything).
      </label>
      <Button
        className="mt-3"
        onClick={() => {
          track("result_shared", {
            language,
            baselinePct: s.baselinePct,
            afterPct: o.afterPct == null ? null : Math.round(o.afterPct * 10) / 10,
            uploadsMeasured: o.measured.length,
            fixes: s.fixes.length,
            committedAt: s.createdAt,
            channelName: named ? summary?.channel.title : null,
            channelHandle: named ? summary?.channel.handle : null,
          });
          setSent(true);
        }}
      >
        Share result
      </Button>
    </div>
  );
}

export default function ProgressPage() {
  const { summary } = useDashboard();
  const [sprints, setSprints] = useState<Sprint[] | null>(null);

  useEffect(() => {
    let live = true;
    track("progress_view");
    fetch("/api/sprints", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<{ sprints: Sprint[] }>) : { sprints: [] }))
      .then((d) => live && setSprints(d.sprints))
      .catch(() => live && setSprints([]));
    return () => {
      live = false;
    };
  }, []);

  if (!summary || !sprints) return <Spinner label="Loading your progress" />;

  return (
    <div className="rise">
      <PageHeader eyebrow="Retention Sprint" title="Are the fixes working?" />
      {!sprints.length ? (
        <Card className="text-center">
          <p className="text-xl font-semibold">No sprint started yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">
            Run Video Doctor on a video, then tap &ldquo;I&apos;ll apply these fixes&rdquo;. Mitra measures your next {SPRINT_UPLOADS} uploads against your
            channel&apos;s average.
          </p>
          <Link href="/dashboard/doctor" className="mt-6 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink">
            Open Video Doctor →
          </Link>
        </Card>
      ) : (
        <div className="space-y-6">
          {sprints.map((s) => {
            const o = outcome(s, summary.videos);
            const done = o.measured.length >= SPRINT_UPLOADS;
            return (
              <Card key={s.videoId}>
                <p className="text-xs text-muted">
                  Started {shortDate(s.createdAt.slice(0, 10))} from &ldquo;{s.videoTitle}&rdquo;
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted">Before</p>
                    <p className="mt-1 text-3xl font-semibold tabular-nums">{s.baselinePct == null ? "—" : `${s.baselinePct.toFixed(0)}%`}</p>
                    <p className="text-xs text-muted">average % viewed</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">After</p>
                    <p className="mt-1 text-3xl font-semibold tabular-nums">{o.afterPct == null ? "—" : `${o.afterPct.toFixed(0)}%`}</p>
                    <p className="text-xs text-muted">
                      {o.measured.length} of {SPRINT_UPLOADS} uploads measured
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Change</p>
                    <p className={`mt-1 text-3xl font-semibold tabular-nums ${o.delta == null ? "" : o.delta >= 0 ? "text-good" : "text-bad"}`}>
                      {o.delta == null ? "—" : `${o.delta >= 0 ? "+" : ""}${o.delta.toFixed(1)} pts`}
                    </p>
                    <p className="text-xs text-muted">{done ? "sprint complete" : "keep uploading"}</p>
                  </div>
                </div>
                {o.after.length > o.measured.length && (
                  <p className="mt-3 text-xs text-muted">YouTube can take a day or two to report % viewed on brand-new uploads.</p>
                )}
                <details className="mt-4 text-sm">
                  <summary className="cursor-pointer font-medium">The fixes you committed to</summary>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-2">
                    {s.fixes.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </details>
                {done && o.delta != null && o.delta <= 0 && (
                  <p className="mt-4 rounded-lg bg-surface-2 px-4 py-3 text-sm">
                    No improvement yet. As promised, we&apos;d like to go through your channel with you one-on-one:{" "}
                    <a href={`mailto:${COMPANY.supportEmail}?subject=${encodeURIComponent("Mitra Retention Sprint review")}`} className="font-semibold text-accent">
                      email us
                    </a>{" "}
                    or use Help &amp; feedback.
                  </p>
                )}
                {o.measured.length > 0 && <ShareResult s={s} o={o} />}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
