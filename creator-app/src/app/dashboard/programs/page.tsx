"use client";

import { useCallback, useEffect, useState } from "react";
import { useDashboard } from "@/components/dashboard-context";
import { Button, Card, ErrorNote, PageHeader, Spinner } from "@/components/ui";
import type { Program } from "@/lib/marketplace/programs";

type Row = Program & { interested: number };
type Form = { kind: string; name: string; summary: string; eligibility: string; area: string; link: string; status: string; sortOrder: number };
const EMPTY: Form = { kind: "local", name: "", summary: "", eligibility: "", area: "", link: "", status: "published", sortOrder: 100 };
const KINDS = [
  ["local", "Local business"],
  ["brand", "Brand programme"],
  ["affiliate", "Affiliate"],
  ["platform", "Platform"],
] as const;

const field = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm";

/** Admins: the open programs creators see on their home. Add local businesses here once the owner agrees. */
export default function ProgramsPage() {
  const { me } = useDashboard();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [f, setF] = useState<Form>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetch("/api/admin/programs", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<{ programs: Row[] }>) : Promise.reject()))
      .then((j) => setRows(j.programs))
      .catch(() => setFailed(true));
  }, []);
  useEffect(load, [load]);

  function edit(r: Row | null) {
    setError(null);
    setEditing(r ? r.id : "new");
    setF(r ? { kind: r.kind, name: r.name, summary: r.summary, eligibility: r.eligibility ?? "", area: r.area ?? "", link: r.link ?? "", status: r.status, sortOrder: r.sortOrder } : EMPTY);
  }

  async function save() {
    setBusy(true);
    setError(null);
    const res = await fetch(editing === "new" ? "/api/admin/programs" : `/api/admin/programs/${editing}`, {
      method: editing === "new" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    const j = (await res.json().catch(() => null)) as { error?: string } | null;
    setBusy(false);
    if (!res.ok) return setError(j?.error ?? "Couldn't save.");
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this program? Creators' interest in it is deleted too.")) return;
    await fetch(`/api/admin/programs/${id}`, { method: "DELETE" });
    load();
  }

  if (me && !me.admin) return <ErrorNote>This page is for admins only.</ErrorNote>;

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: k === "sortOrder" ? Number(e.target.value) || 0 : e.target.value });

  return (
    <div className="rise">
      <PageHeader eyebrow="Admin" title="Open programs">
        <Button onClick={() => edit(null)}>Add a program</Button>
      </PageHeader>
      <p className="-mt-2 mb-6 max-w-2xl text-sm text-muted">
        What creators see under &quot;Open programs&quot; on their home. Add a local business only after the owner agrees to be listed. Check each programme&apos;s terms before publishing; Mitra doesn&apos;t run these
        and takes nothing from them.
      </p>
      {failed && <ErrorNote>Couldn&apos;t load programs.</ErrorNote>}
      {!rows && !failed && (
        <Card>
          <Spinner label="Loading" />
        </Card>
      )}

      {editing && (
        <Card className="mb-6">
          <h2 className="mb-4 font-semibold">{editing === "new" ? "Add a program" : "Edit program"}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              Kind
              <select className={field} value={f.kind} onChange={set("kind")}>
                {KINDS.map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              Name
              <input className={field} value={f.name} onChange={set("name")} maxLength={120} />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              What creators get (one or two sentences)
              <textarea className={field} value={f.summary} onChange={set("summary")} maxLength={400} rows={2} />
            </label>
            <label className="grid gap-1 text-sm">
              Who can join
              <input className={field} value={f.eligibility} onChange={set("eligibility")} maxLength={200} />
            </label>
            <label className="grid gap-1 text-sm">
              Area (local businesses)
              <input className={field} value={f.area} onChange={set("area")} maxLength={80} />
            </label>
            <label className="grid gap-1 text-sm">
              Link (https)
              <input className={field} value={f.link} onChange={set("link")} maxLength={500} placeholder="https://" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm">
                Status
                <select className={field} value={f.status} onChange={set("status")}>
                  <option value="published">Published</option>
                  <option value="hidden">Hidden</option>
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                Order (lower first)
                <input className={field} type="number" value={f.sortOrder} onChange={set("sortOrder")} />
              </label>
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <div className="mt-4 flex gap-2">
            <Button onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {rows && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="py-2 pr-3">Program</th>
                  <th className="py-2 pr-3">Kind</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3 text-right">Creators interested</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2.5 pr-3">
                      <span className="font-medium">{r.name}</span>
                      {r.area && <span className="text-muted"> · {r.area}</span>}
                    </td>
                    <td className="py-2.5 pr-3 capitalize">{r.kind}</td>
                    <td className="py-2.5 pr-3">{r.status}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{r.interested}</td>
                    <td className="py-2.5 text-right whitespace-nowrap">
                      <button type="button" className="text-sm underline" onClick={() => edit(r)}>
                        Edit
                      </button>{" "}
                      <button type="button" className="ml-2 text-sm text-muted underline" onClick={() => remove(r.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
