import { LOW_DATA_VIEWS } from "./beta";
import type { RetentionPoint } from "./types";

export interface RetentionMoment {
  t: number;
  kind: "drop" | "spike";
  delta: number; // change in share watching over the window
}

/** Finds the steepest drops and rewatch spikes after the intro, at least 8% of the video apart. */
export function keyMoments(points: RetentionPoint[], max = 3): RetentionMoment[] {
  const window = 3;
  const candidates: RetentionMoment[] = [];
  for (let i = window; i < points.length; i++) {
    const delta = points[i].watching - points[i - window].watching;
    const t = points[i].t;
    if (t < 0.06 || t > 0.95) continue;
    candidates.push({ t, delta, kind: delta < 0 ? "drop" : "spike" });
  }
  const pick = (kind: RetentionMoment["kind"], n: number) => {
    const sorted = candidates
      .filter((c) => c.kind === kind)
      .sort((a, b) => (kind === "drop" ? a.delta - b.delta : b.delta - a.delta));
    const chosen: RetentionMoment[] = [];
    for (const c of sorted) {
      if (chosen.length >= n) break;
      if (chosen.every((x) => Math.abs(x.t - c.t) > 0.08)) chosen.push(c);
    }
    return chosen;
  };
  return [...pick("drop", max), ...pick("spike", 1).filter((s) => s.delta > 0.01)].sort((a, b) => a.t - b.t);
}

export function fmtTime(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

export function introDrop(points: RetentionPoint[]): number {
  const at = points.find((p) => p.t >= 0.08) ?? points[points.length - 1];
  return points.length ? Math.max(0, (points[0].watching || 1) - at.watching) : 0;
}

/** True when a video can only get an early read (packaging and hook), not a retention diagnosis. */
export function isLowData(points: RetentionPoint[], views: number): boolean {
  return points.length < 20 || views < LOW_DATA_VIEWS;
}
