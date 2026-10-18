"use client";

import { useEffect, useMemo, useState } from "react";
import { useDashboard } from "@/components/dashboard-context";
import { Button, Card, ErrorNote, PageHeader, Spinner } from "@/components/ui";
import { COMPANY } from "@/lib/company";
import { compact } from "@/lib/format";
import { LANGUAGES, type LanguageCode } from "@/lib/languages";
import { outreachBody, STATUSES, type ProspectStatus } from "@/lib/outreach";

interface Prospect {
  id: number;
  channelId: string;
  title: string;
  handle: string | null;
  avatar: string | null;
  language: string | null;
  subscribers: number;
  videoCount: number;
  lastUploadAt: string | null;
  latestVideoTitle: string | null;
  emails: string[];
  links: string[];
  score: number;
  seed: string;
  subject: string | null;
  opener: string | null;
  status: ProspectStatus;
  notes: string | null;
}
interface ListRes {
  prospects: Prospect[];
  quota: { used: number; limit: number };
  spotsLeft: number | null;
}

const STATUS_LABEL: Record<ProspectStatus, string> = {
  new: "New",
  approved: "Approved",
  contacted: "Contacted",
  replied: "Replied",
  joined: "Joined",
  not_interested: "Not interested",
  do_not_contact: "Do not contact",
};

const PRESETS: { label: string; query: string; language: LanguageCode }[] = [
  { label: "Telugu tech", query: "తెలుగు tech review", language: "te" },
  { label: "Telugu food", query: "telugu vantalu recipe", language: "te" },
  { label: "Tamil vlogs", query: "tamil vlog", language: "ta" },
  { label: "Hindi tech", query: "phone review hindi", language: "hinglish" },
  { label: "Bhojpuri comedy", query: "bhojpuri comedy", language: "hi" },
  { label: "Marathi recipes", query: "marathi recipe", language: "mr" },
  { label: "Kannada vlogs", query: "kannada vlog", language: "kn" },
  { label: "Malayalam travel", query: "malayalam travel vlog", language: "ml" },
  { label: "Bengali food", query: "bangla recipe", language: "bn" },
];

const ago = (iso: string | null) => {
  if (!iso) return "—";
  const d = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return d <= 0 ? "today" : `${d}d ago`;
};

/** Opens Gmail's compose window in Mitra's official account (authuser picks it when you're signed in to several). */
function gmailLink(to: string, subject: string, body: string) {
  return `https://mail.google.com/mail/?${new URLSearchParams({ authuser: COMPANY.outreachEmail, view: "cm", fs: "1", to, su: subject, body })}`;
}

/** Admins only: find regional creators to invite, write personal openers, and track outreach. */
export default function ProspectsPage() {
  const { me } = useDashboard();
  const [data, setData] = useState<ListRes | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [filter, setFilter] = useState<ProspectStatus | "all">("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [open, setOpen] = useState<number | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [form, setForm] = useState({ query: "", language: "te" as LanguageCode | "any", minSubs: 1000, maxSubs: 100_000, days: 14, pages: 1 });
  const [msgLanguage, setMsgLanguage] = useState<LanguageCode>("en");
  const sender = me?.user?.name ?? "the Mitra team";

  useEffect(() => {
    let live = true;
    fetch("/api/admin/prospects", { cache: "no-store" })
      .then(async (r) => (r.ok ? (r.json() as Promise<ListRes>) : Promise.reject(r.status)))
      .then((d) => live && setData(d))
      .catch(() => live && setError("Couldn't load prospects."));
    return () => {
      live = false;
    };
  }, [version]);

  const shown = useMemo(() => (data?.prospects ?? []).filter((p) => filter === "all" || p.status === filter), [data, filter]);
  const counts = useMemo(() => {
    const c = new Map<string, number>();
    for (const p of data?.prospects ?? []) c.set(p.status, (c.get(p.status) ?? 0) + 1);
    return c;
  }, [data]);

  if (me && !me.admin) return <ErrorNote>This page is for admins only.</ErrorNote>;

  async function call(path: string, method: string, body: unknown) {
    const res = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) throw new Error(typeof json.error === "string" ? json.error : "Something went wrong.");
    return json;
  }

  async function search() {
    setBusy("search");
    setError(null);
    setNotice(null);
    try {
      const r = await call("/api/admin/prospects/discover", "POST", form);
      setNotice(`Searched ${r.found} channels with recent uploads → ${r.matched} matched your filters → ${r.added} new prospects added. Used ${r.units} quota units.`);
      setVersion((v) => v + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed.");
    }
    setBusy(null);
  }

  async function setStatus(ids: number[], status: ProspectStatus) {
    await call("/api/admin/prospects", "PATCH", { ids, status });
    setData((d) => d && { ...d, prospects: d.prospects.map((p) => (ids.includes(p.id) ? { ...p, status } : p)) });
  }

  async function writeOpeners() {
    const ids = [...selected].slice(0, 30);
    setBusy("openers");
    setError(null);
    try {
      const r = await call("/api/admin/prospects/openers", "POST", { ids, language: msgLanguage });
      setNotice(`Wrote ${r.written} personal openers.`);
      setVersion((v) => v + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't write openers.");
    }
    setBusy(null);
  }

  function toggle(id: number) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  const estimate = form.pages * 101;
  const quotaLeft = data ? data.quota.limit - data.quota.used : null;

  return (
    <div className="rise">
      <PageHeader eyebrow="Admin · Growth" title="Find creators to invite">
        {data && (
          <div className="text-right text-xs text-muted">
            <p>
              YouTube quota today: <span className="font-semibold text-ink">{data.quota.used.toLocaleString()}</span> / {data.quota.limit.toLocaleString()} units
            </p>
            {data.spotsLeft != null && <p>Founding spots left: {data.spotsLeft}</p>}
          </div>
        )}
      </PageHeader>

      <Card className="mb-6">
        <div className="mb-3 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button key={p.label} onClick={() => setForm((f) => ({ ...f, query: p.query, language: p.language }))} className="rounded-full bg-surface-2 px-3 py-1 text-xs hover:bg-accent-soft">
              {p.label}
            </button>
          ))}
        </div>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void search();
          }}
        >
          <label className="flex min-w-[240px] flex-[2_1_240px] flex-col gap-1 text-xs font-medium text-muted">
            Keywords (what their videos are about)
            <input value={form.query} onChange={(e) => setForm({ ...form, query: e.target.value })} placeholder="e.g. telugu tech review" className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent" />
          </label>
          <label className="flex min-w-[110px] flex-[1_1_110px] flex-col gap-1 text-xs font-medium text-muted">
            Language
            <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value as LanguageCode | "any" })} className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink">
              <option value="any">Any</option>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[110px] flex-[1_1_110px] flex-col gap-1 text-xs font-medium text-muted">
            Min subscribers
            <input type="number" min={0} value={form.minSubs} onChange={(e) => setForm({ ...form, minSubs: Number(e.target.value) })} className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink" />
          </label>
          <label className="flex min-w-[110px] flex-[1_1_110px] flex-col gap-1 text-xs font-medium text-muted">
            Max subscribers
            <input type="number" min={1} value={form.maxSubs} onChange={(e) => setForm({ ...form, maxSubs: Number(e.target.value) })} className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink" />
          </label>
          <label className="flex min-w-[110px] flex-[1_1_110px] flex-col gap-1 text-xs font-medium text-muted">
            Uploaded within
            <select value={form.days} onChange={(e) => setForm({ ...form, days: Number(e.target.value) })} className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink">
              {[7, 14, 30].map((d) => (
                <option key={d} value={d}>
                  {d} days
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[110px] flex-[1_1_110px] flex-col gap-1 text-xs font-medium text-muted">
            Depth
            <select value={form.pages} onChange={(e) => setForm({ ...form, pages: Number(e.target.value) })} className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink">
              {[1, 2, 3].map((n) => (
                <option key={n} value={n}>
                  {n * 50} videos
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" disabled={busy !== null || form.query.trim().length < 2 || (quotaLeft != null && quotaLeft < estimate)}>
            {busy === "search" ? "Searching…" : "Search"}
          </Button>
        </form>
        <p className="mt-2 text-xs text-muted">
          Costs about {estimate} of your YouTube quota units. Only public channel data; emails only if the creator wrote one in their channel
          description.
        </p>
      </Card>

      {error && <div className="mb-4"><ErrorNote>{error}</ErrorNote></div>}
      {notice && <p className="mb-4 rounded-xl border border-good/40 px-3 py-2 text-sm text-good">{notice}</p>}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {(["all", ...STATUSES] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)} aria-pressed={filter === s} className={`rounded-full px-3 py-1 text-xs ${filter === s ? "bg-ink text-bg" : "bg-surface-2 text-ink-2"}`}>
            {s === "all" ? `All ${data?.prospects.length ?? 0}` : `${STATUS_LABEL[s]} ${counts.get(s) ?? 0}`}
          </button>
        ))}
        <a href="/api/admin/prospects/export" className="ml-auto rounded-full border border-line px-3 py-1.5 text-xs font-semibold hover:bg-surface-2">
          Export CSV
        </a>
      </div>

      {selected.size > 0 && (
        <Card className="mb-3 flex flex-wrap items-center gap-3 !py-3">
          <span className="text-sm font-semibold">{selected.size} selected</span>
          <label className="flex items-center gap-2 text-xs text-muted">
            Message language
            <select value={msgLanguage} onChange={(e) => setMsgLanguage(e.target.value as LanguageCode)} className="rounded-lg border border-line bg-surface px-2 py-1 text-sm text-ink">
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          <Button onClick={writeOpeners} disabled={busy !== null}>
            {busy === "openers" ? "Writing…" : `Write personal openers${selected.size > 30 ? " (first 30)" : ""}`}
          </Button>
          <Button variant="ghost" onClick={() => setStatus([...selected], "approved")}>Approve</Button>
          <Button variant="ghost" onClick={() => setStatus([...selected], "do_not_contact")}>Do not contact</Button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-muted underline">Clear</button>
        </Card>
      )}

      {!data && !error && <Card><Spinner label="Loading prospects" /></Card>}
      {data && !shown.length && (
        <Card className="py-10 text-center text-sm text-muted">No prospects here yet. Pick a preset above and search.</Card>
      )}

      {shown.length > 0 && (
        <Card className="!p-0">
          <ul className="divide-y divide-line">
            {shown.map((p) => {
              const email = p.emails[0];
              const subject = p.subject ?? `Quick idea for ${p.title}`;
              const body = outreachBody(p.opener ?? `Hi ${p.title} team, I came across your channel${p.latestVideoTitle ? ` and your video "${p.latestVideoTitle}"` : ""}.`, data?.spotsLeft ?? null, sender, COMPANY.outreachEmail, `${COMPANY.product} · ${COMPANY.address}`);
              return (
                <li key={p.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} aria-label={`Select ${p.title}`} className="h-4 w-4 accent-[var(--accent)]" />
                    {p.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element -- YouTube avatar
                      <img src={p.avatar} alt="" className="h-9 w-9 rounded-full" />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-surface-2" />
                    )}
                    <div className="min-w-[180px] flex-1">
                      <a href={`https://www.youtube.com/channel/${p.channelId}`} target="_blank" rel="noreferrer" className="font-indic font-semibold hover:underline">
                        {p.title}
                      </a>
                      <p className="text-xs text-muted">
                        {p.handle ?? ""} · {compact(p.subscribers)} subs · {p.videoCount} videos · last upload {ago(p.lastUploadAt)}
                        {p.language && ` · ${LANGUAGES.find((l) => l.code === p.language)?.label ?? p.language}`}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${p.score >= 70 ? "bg-good/15 text-good" : p.score >= 45 ? "bg-accent-soft text-accent" : "bg-surface-2 text-ink-2"}`} title="Fit score">
                      {p.score}
                    </span>
                    <div className="min-w-[160px] text-xs">
                      {email ? <span className="font-medium text-ink">{email}</span> : p.links[0] ? <a href={p.links[0]} target="_blank" rel="noreferrer" className="text-accent hover:underline">{p.links[0].replace(/^https?:\/\/(www\.)?/, "").slice(0, 32)}</a> : <span className="text-muted">No public contact</span>}
                    </div>
                    <select value={p.status} onChange={(e) => setStatus([p.id], e.target.value as ProspectStatus)} className="rounded-lg border border-line bg-surface px-2 py-1 text-xs" aria-label={`Status for ${p.title}`}>
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                    <button onClick={() => setOpen(open === p.id ? null : p.id)} className="text-xs font-semibold text-accent">
                      {open === p.id ? "Hide" : p.opener ? "Message ✓" : "Message"}
                    </button>
                  </div>
                  {open === p.id && (
                    <div className="mt-3 grid gap-3 rounded-xl bg-surface-2 p-3 md:grid-cols-[1fr_auto]">
                      <div className="min-w-0">
                        {p.latestVideoTitle && <p className="mb-2 text-xs text-muted">Latest video: <span className="font-indic">{p.latestVideoTitle}</span></p>}
                        <p className="text-xs font-semibold">Subject: <span className="font-normal">{subject}</span></p>
                        <pre className="mt-2 whitespace-pre-wrap font-sans text-sm">{body}</pre>
                        {p.links.length > 0 && <p className="mt-2 text-xs text-muted">Links: {p.links.join(" · ")}</p>}
                      </div>
                      <div className="flex flex-col gap-2">
                        {email && p.status !== "do_not_contact" && (
                          <a
                            href={gmailLink(email, subject, body)}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => setStatus([p.id], "contacted")}
                            className="rounded-lg bg-accent px-4 py-2 text-center text-sm font-semibold text-accent-ink"
                          >
                            Open in Gmail
                          </a>
                        )}
                        <Button variant="ghost" onClick={() => navigator.clipboard?.writeText(`${subject}\n\n${body}`)}>Copy message</Button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
      <p className="mt-4 text-xs text-muted">
        Send a few personal emails a day from an outreach mailbox, one follow-up at most, and mark anyone who says stop as “Do not contact”: they&apos;ll
        never be found again by a search.
      </p>
    </div>
  );
}
