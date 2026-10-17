import { formatScore, OUTLIER_TEXT, type Outlier } from "@/lib/outliers";

const STYLE = {
  breakout: "bg-brand text-white",
  above: "bg-good/15 text-good",
  usual: "bg-surface-2 text-ink-2",
  below: "bg-bad/10 text-bad",
} as const;

/**
 * "3.2× Breakout": this video's views against the channel's usual (median of the previous uploads of the same
 * kind). Nothing when there are too few earlier uploads to compare with.
 */
export function OutlierBadge({ outlier, compact = false }: { outlier: Outlier | undefined; compact?: boolean }) {
  if (!outlier?.score || !outlier.label) return null;
  const title = `${formatScore(outlier.score)} your usual views (${Math.round(outlier.usual ?? 0).toLocaleString("en-IN")})${outlier.early ? ". Still new, so this can grow" : ""}`;
  return (
    <span title={title} className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold ${STYLE[outlier.label]}`}>
      {outlier.label === "breakout" && <span aria-hidden>🚀</span>}
      {formatScore(outlier.score)}
      {!compact && <span className="font-semibold">{OUTLIER_TEXT[outlier.label]}</span>}
      {outlier.early && <span className="font-medium opacity-80">so far</span>}
    </span>
  );
}
