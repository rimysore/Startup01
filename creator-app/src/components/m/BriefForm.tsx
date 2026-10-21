"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DELIVERABLES, GOALS, NICHES } from "@/lib/marketplace/flag";
import type { Strings } from "@/lib/marketplace/i18n";
import { send } from "./client";

/** A brief in under two minutes: the goal, what to post, the budget and the area. */
export function BriefForm({ s, area, link, budget }: { s: Strings; area: string; link: string; budget: number | null }) {
  const router = useRouter();
  const [goalKey, setGoalKey] = useState<string>("footfall");
  const [goalText, setGoalText] = useState("");
  const [f, setF] = useState({ brief: "", area, niches: ["food"] as string[], languages: ["kn"] as string[], deliverables: ["reel"] as string[], budgetInr: budget ? String(budget) : "", postBy: "", destinationUrl: link });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toggle = (k: "niches" | "languages" | "deliverables", v: string, max: number) =>
    setF((x) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((y) => y !== v) : x[k].length < max ? [...x[k], v] : x[k] }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const goal = goalText.trim() || s.brief.goals[goalKey];
    const r = await send("/api/m/briefs", "POST", { ...f, goal, budgetInr: f.budgetInr || null });
    if (r.error) {
      setBusy(false);
      const field = String(r.json?.field ?? "");
      return setError(field === "destinationUrl" ? s.brief.linkHint : field === "budgetInr" ? s.brief.budget : field === "deliverables" ? s.brief.deliverables : r.error);
    }
    router.push(`/m/briefs/${r.json?.id}`);
  }

  return (
    <form className="mk-form" onSubmit={submit}>
      <section className="lp-card mk-fieldset">
        <h2 className="mk-h2">{s.brief.goal}</h2>
        <div className="mk-chips">
          {GOALS.map((g) => (
            <button key={g} type="button" aria-pressed={!goalText && goalKey === g} onClick={() => (setGoalKey(g), setGoalText(""))}>
              {s.brief.goals[g]}
            </button>
          ))}
        </div>
        <label className="mk-label">
          <small>{s.brief.goalOther}</small>
          <input value={goalText} onChange={(e) => setGoalText(e.target.value)} maxLength={160} />
        </label>
        <label className="mk-label">
          {s.brief.details} <small>({s.common.optional})</small>
          <textarea value={f.brief} onChange={(e) => setF({ ...f, brief: e.target.value })} placeholder={s.brief.detailsPh} maxLength={1000} style={{ minHeight: 100 }} />
        </label>
      </section>

      <section className="lp-card mk-fieldset">
        <div className="grid gap-2">
          <p className="text-[14px] font-semibold">{s.brief.deliverables}</p>
          <div className="mk-chips">
            {DELIVERABLES.map((d) => (
              <button key={d} type="button" aria-pressed={f.deliverables.includes(d)} onClick={() => toggle("deliverables", d, 5)}>
                {s.deliverable[d]}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-2">
          <p className="text-[14px] font-semibold">{s.brief.niches}</p>
          <div className="mk-chips">
            {NICHES.map((n) => (
              <button key={n} type="button" aria-pressed={f.niches.includes(n)} onClick={() => toggle("niches", n, 4)}>
                {s.niche[n]}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-2">
          <p className="text-[14px] font-semibold">{s.brief.languages}</p>
          <div className="mk-chips">
            {(["kn", "en"] as const).map((l) => (
              <button key={l} type="button" aria-pressed={f.languages.includes(l)} onClick={() => toggle("languages", l, 2)} className={l === "kn" ? "kn" : ""}>
                {l === "kn" ? "ಕನ್ನಡ" : "English"}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-card mk-fieldset">
        <div className="mk-row">
          <label className="mk-label">
            {s.brief.budget}
            <input inputMode="numeric" value={f.budgetInr} onChange={(e) => setF({ ...f, budgetInr: e.target.value.replace(/[^\d]/g, "") })} placeholder="₹" required />
          </label>
          <label className="mk-label">
            {s.brief.area}
            <input value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })} placeholder={s.kit.areaPh} maxLength={60} />
          </label>
          <label className="mk-label">
            {s.brief.postBy} <small>({s.common.optional})</small>
            <input type="date" value={f.postBy} onChange={(e) => setF({ ...f, postBy: e.target.value })} />
          </label>
        </div>
        <label className="mk-label">
          {s.brief.link} <small>({s.common.optional})</small>
          <input type="url" value={f.destinationUrl} onChange={(e) => setF({ ...f, destinationUrl: e.target.value })} placeholder="https://" maxLength={500} />
          <small>{s.brief.linkHint}</small>
        </label>
      </section>

      {error && (
        <p className="mk-err" role="alert">
          {error}
        </p>
      )}
      <div className="mk-bar">
        <button type="submit" className="lp-btn" disabled={busy || !f.deliverables.length || !f.budgetInr}>
          {busy ? s.common.saving : s.brief.create}
        </button>
      </div>
    </form>
  );
}
