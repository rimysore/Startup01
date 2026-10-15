"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, DemoNote, PageHeader, Select } from "@/components/ui";
import { DEMO_TRENDS } from "@/lib/demo";

const ALL = "All";

export default function TrendsPage() {
  const [language, setLanguage] = useState(ALL);
  const [niche, setNiche] = useState(ALL);
  const languages = [ALL, ...new Set(DEMO_TRENDS.map((t) => t.language))];
  const niches = [ALL, ...new Set(DEMO_TRENDS.map((t) => t.niche))];
  const trends = DEMO_TRENDS.filter((t) => (language === ALL || t.language === language) && (niche === ALL || t.niche === niche)).sort(
    (a, b) => b.growth - a.growth,
  );
  const max = Math.max(...DEMO_TRENDS.map((t) => t.growth));

  return (
    <div className="rise">
      <PageHeader eyebrow="Trend Radar" title="What your audience is searching this week" />
      <div className="mb-4">
        <DemoNote>Trends are sample data for now. Live regional trends (YouTube search + Google Trends by state) are next on the roadmap.</DemoNote>
      </div>
      <div className="mb-6 flex flex-wrap gap-4">
        <Select label="Language" value={language} onChange={setLanguage} options={languages.map((l) => ({ value: l, label: l }))} />
        <Select label="Niche" value={niche} onChange={setNiche} options={niches.map((n) => ({ value: n, label: n }))} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {trends.map((t) => (
          <Card key={t.topic} className="flex flex-col">
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-full bg-accent-soft px-2.5 py-1 font-semibold text-accent">{t.language}</span>
              <span className="rounded-full border border-line px-2.5 py-1 text-ink-2">{t.niche}</span>
              <span className="ml-auto text-muted">Search interest: {t.searches}</span>
            </div>
            <h2 className="mt-3 font-display text-2xl leading-snug">{t.topic}</h2>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-2 flex-1 rounded-full bg-surface-2">
                <div className="h-2 rounded-full bg-accent" style={{ width: `${(t.growth / max) * 100}%` }} />
              </div>
              <span className="w-24 text-right text-sm font-semibold tabular-nums text-good">▲ {t.growth}% WoW</span>
            </div>
            <p className="mt-3 text-sm text-ink-2"><span className="font-semibold text-ink">Angle: </span>{t.angle}</p>
            <Link
              href={`/dashboard/studio?topic=${encodeURIComponent(`${t.topic} — ${t.angle}`)}`}
              className="mt-4 self-start text-sm font-semibold text-accent underline-offset-4 hover:underline"
            >
              Package this idea →
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
