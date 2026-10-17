"use client";

import { useEffect, useMemo, useState } from "react";
import { useDashboard } from "@/components/dashboard-context";
import { Button, Card, ErrorNote, PageHeader, Spinner } from "@/components/ui";
import { languageLabel } from "@/lib/languages";

interface Row {
  id: number;
  email: string;
  name: string | null;
  channel: string | null;
  language: string | null;
  whatsapp: string | null;
  status: "waiting" | "invited";
  createdAt: string;
  invitedAt: string | null;
  joined: boolean;
}

const day = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

/** Admins only: invite creators from the early-access list. */
export default function WaitlistAdmin() {
  const { me } = useDashboard();
  const [data, setData] = useState<{ rows: Row[]; emailReady: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"waiting" | "invited" | "all">("waiting");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let live = true;
    fetch("/api/admin/waitlist", { cache: "no-store" })
      .then(async (r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => live && setData(d))
      .catch(() => live && setError("Couldn't load the waitlist."));
    return () => {
      live = false;
    };
  }, [version]);

  const rows = useMemo(() => (data?.rows ?? []).filter((r) => filter === "all" || r.status === filter), [data, filter]);
  const counts = useMemo(() => ({ waiting: data?.rows.filter((r) => r.status === "waiting").length ?? 0, invited: data?.rows.filter((r) => r.status === "invited").length ?? 0, joined: data?.rows.filter((r) => r.joined).length ?? 0 }), [data]);

  if (me && !me.admin) return <ErrorNote>Not found.</ErrorNote>;
  if (!data && !error) return <Spinner label="Loading waitlist" />;

  async function invite(ids: number[]) {
    if (!window.confirm(`Invite ${ids.length} creator${ids.length === 1 ? "" : "s"}?\n\nFirst add their emails as Test users in Google Cloud → Google Auth Platform → Audience, or Google will block their sign-in.`)) return;
    setBusy(true);
    const r = await fetch("/api/admin/waitlist", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids, status: "invited" }) });
    const d = (await r.json()) as { updated?: number; emailed?: number };
    setBusy(false);
    setSelected(new Set());
    setNotice(`Invited ${d.updated ?? 0}. ${data?.emailReady ? `Emailed ${d.emailed ?? 0}.` : "Email isn't set up, so message them yourself (WhatsApp buttons below)."}`);
    setVersion((v) => v + 1);
  }

  function copyEmails() {
    const emails = rows.filter((r) => selected.size === 0 || selected.has(r.id)).map((r) => r.email);
    navigator.clipboard.writeText(emails.join(", ")).then(() => setNotice(`Copied ${emails.length} email${emails.length === 1 ? "" : "s"}: paste them into Google's Test users.`));
  }

  const invitation = (r: Row) =>
    `https://wa.me/${(r.whatsapp ?? "").replace(/\D/g, "")}?text=${encodeURIComponent(
      `Hi${r.name ? ` ${r.name.split(" ")[0]}` : ""}! Your early access to Mitra is ready 🎉 Sign in with Google using ${r.email}: ${window.location.origin}/login?next=/dashboard/connections`,
    )}`;

  return (
    <div className="rise">
      <PageHeader eyebrow="Admin" title="Waitlist">
        <div className="flex gap-2 text-sm">
          <span className="rounded-full bg-surface-2 px-3 py-1.5">{counts.waiting} waiting</span>
          <span className="rounded-full bg-accent-soft px-3 py-1.5">{counts.invited} invited</span>
          <span className="rounded-full bg-good/15 px-3 py-1.5 text-good">{counts.joined} joined</span>
        </div>
      </PageHeader>
      {error && <ErrorNote>{error}</ErrorNote>}
      {notice && <p className="mb-4 rounded-xl bg-good/10 px-4 py-3 text-sm text-good">{notice}</p>}

      <Card>
        <ol className="mb-5 list-decimal space-y-1 pl-5 text-sm text-ink-2">
          <li>Pick creators and press <b>Copy emails</b>.</li>
          <li>Google Cloud → Google Auth Platform → <b>Audience</b> → Test users → paste and save (up to 100 while unverified).</li>
          <li>Press <b>Invite</b>: they get an email (or use the WhatsApp button).</li>
        </ol>
        <div className="flex flex-wrap items-center gap-2">
          {(["waiting", "invited", "all"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-2 text-sm font-semibold ${filter === f ? "bg-ink text-bg" : "bg-surface-2"}`}>
              {f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
          <span className="ml-auto flex gap-2">
            <Button variant="ghost" onClick={copyEmails} disabled={!rows.length}>
              Copy emails{selected.size ? ` (${selected.size})` : ""}
            </Button>
            <Button onClick={() => invite([...selected])} disabled={busy || !selected.size}>
              Invite{selected.size ? ` ${selected.size}` : ""}
            </Button>
          </span>
        </div>
        <ul className="mt-4 divide-y divide-line">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-3 py-3">
              <input
                type="checkbox"
                aria-label={`Select ${r.email}`}
                checked={selected.has(r.id)}
                onChange={(e) => {
                  const next = new Set(selected);
                  if (e.target.checked) next.add(r.id);
                  else next.delete(r.id);
                  setSelected(next);
                }}
                className="h-5 w-5"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                  {r.name || r.email} {r.joined && <span className="ml-1 rounded-full bg-good/15 px-2 py-0.5 text-xs text-good">joined</span>}
                </p>
                <p className="truncate text-xs text-muted">
                  {r.email} · {r.language ? languageLabel(r.language) : "—"} · {day(r.createdAt)}
                  {r.channel && (
                    <>
                      {" · "}
                      <a href={r.channel.startsWith("http") ? r.channel : `https://www.youtube.com/${r.channel.startsWith("@") ? r.channel : `@${r.channel}`}`} target="_blank" rel="noopener noreferrer" className="underline">
                        channel
                      </a>
                    </>
                  )}
                </p>
              </div>
              {r.whatsapp && (
                <a href={invitation(r)} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-[#073b1d]">
                  WhatsApp
                </a>
              )}
              {r.status === "waiting" ? (
                <Button variant="ghost" onClick={() => invite([r.id])} disabled={busy}>
                  Invite
                </Button>
              ) : (
                <span className="text-xs text-muted">invited {r.invitedAt ? day(r.invitedAt) : ""}</span>
              )}
            </li>
          ))}
          {!rows.length && <li className="py-8 text-center text-sm text-muted">Nobody here yet.</li>}
        </ul>
      </Card>
    </div>
  );
}
