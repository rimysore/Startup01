import type { Emotion } from "@/lib/ai";
import type { AudienceReport } from "@/lib/youtube";

export const EMOTION_STYLE: Record<Emotion, { emoji: string; color: string; label: string }> = {
  curiosity: { emoji: "🤔", color: "#3b82f6", label: "Curiosity" },
  joy: { emoji: "😊", color: "#f59e0b", label: "Joy" },
  humor: { emoji: "😂", color: "#eab308", label: "Humour" },
  pride: { emoji: "🦁", color: "#e2620b", label: "Pride" },
  nostalgia: { emoji: "🥹", color: "#a855f7", label: "Nostalgia" },
  inspiration: { emoji: "✨", color: "#10b981", label: "Inspiration" },
  surprise: { emoji: "😮", color: "#06b6d4", label: "Surprise" },
  fear: { emoji: "😨", color: "#64748b", label: "Fear / worry" },
  anger: { emoji: "😠", color: "#dc2626", label: "Anger" },
  empathy: { emoji: "🤝", color: "#ec4899", label: "Empathy" },
  romance: { emoji: "💞", color: "#f43f5e", label: "Romance" },
  devotion: { emoji: "🙏", color: "#d97706", label: "Devotion" },
};

/** Emotion shares as labelled bars, biggest first. */
export function EmotionBars({ emotions }: { emotions: { emotion: Emotion; share: number }[] }) {
  if (!emotions.length) return <p className="text-sm text-muted">Not enough signal yet.</p>;
  return (
    <ul className="space-y-2">
      {emotions.map((e) => {
        const s = EMOTION_STYLE[e.emotion];
        return (
          <li key={e.emotion} className="grid grid-cols-[130px_1fr_44px] items-center gap-3 text-sm">
            <span>
              {s.emoji} {s.label}
            </span>
            <div className="h-2.5 rounded-full bg-surface-2">
              <div className="h-2.5 rounded-full" style={{ width: `${e.share}%`, background: s.color }} />
            </div>
            <span className="text-right tabular-nums text-muted">{e.share}%</span>
          </li>
        );
      })}
    </ul>
  );
}

/** A simple ranked list with proportional bars. */
export function BarList({ rows, format = (n) => n.toLocaleString("en-IN"), empty = "No data yet." }: { rows: { label: string; value: number; hint?: string }[]; format?: (n: number) => string; empty?: string }) {
  if (!rows.length) return <p className="text-sm text-muted">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-indic">
              {r.label}
              {r.hint && <span className="ml-1.5 text-xs text-muted">{r.hint}</span>}
            </span>
            <span className="shrink-0 tabular-nums text-ink-2">{format(r.value)}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-surface-2">
            <div className="h-1.5 rounded-full bg-accent" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export const TRAFFIC_LABELS: Record<string, string> = {
  YT_SEARCH: "YouTube search",
  RELATED_VIDEO: "Suggested videos",
  SHORTS: "Shorts feed",
  SUBSCRIBER: "Home & subscriptions",
  BROWSE: "Browse features",
  EXT_URL: "Other websites & Google",
  NOTIFICATION: "Notifications",
  PLAYLIST: "Playlists",
  YT_CHANNEL: "Your channel page",
  YT_OTHER_PAGE: "Other YouTube pages",
  NO_LINK_OTHER: "Direct / unknown",
  NO_LINK_EMBEDDED: "Embedded players",
  END_SCREEN: "End screens",
  HASHTAGS: "Hashtag pages",
  ADVERTISING: "Ads",
  SOUND_PAGE: "Shorts sound pages",
};

const regionNames = typeof Intl !== "undefined" && "DisplayNames" in Intl ? new Intl.DisplayNames(["en"], { type: "region" }) : null;
export function countryName(code: string): string {
  try {
    return regionNames?.of(code) ?? code;
  } catch {
    return code;
  }
}

const AGE = (a: string) => a.replace("age", "").replace("-", "–");

/** Turns the report into the labelled rows the AI and the bars both use. */
export function audienceRows(r: AudienceReport) {
  const total = r.sources.reduce((a, s) => a + s.views, 0) || 1;
  return {
    countries: r.countries.map((c) => ({ label: countryName(c.country), value: c.views })),
    cities: r.cities.map((c) => ({ label: `${c.city}${c.country ? `, ${countryName(c.country)}` : ""}`, value: c.views })),
    sources: r.sources.map((s) => ({ label: TRAFFIC_LABELS[s.source] ?? s.source, value: s.views, hint: `${Math.round((s.views / total) * 100)}%` })),
    searchTerms: r.searchTerms.map((t) => ({ label: t.term, value: t.views })),
    demographics: [...r.demographics].sort((a, b) => b.percent - a.percent).map((d) => ({ label: `${d.gender === "female" ? "Women" : d.gender === "male" ? "Men" : "Other"} ${AGE(d.ageGroup)}`, value: Math.round(d.percent * 10) / 10 })),
    subscribed: r.subscribed.map((s) => ({ label: s.status === "SUBSCRIBED" ? "Subscribers" : "Not subscribed", value: s.views })),
  };
}

