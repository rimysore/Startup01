/** Indian-style compact numbers: 3,12,400 -> "3.1L", 4,18,20,000 -> "4.2Cr". */
export function compact(n: number): string {
  const abs = Math.abs(n);
  const fmt = (v: number) => (v >= 100 ? Math.round(v).toString() : v.toFixed(1).replace(/\.0$/, ""));
  if (abs >= 1e7) return `${fmt(n / 1e7)}Cr`;
  if (abs >= 1e5) return `${fmt(n / 1e5)}L`;
  if (abs >= 1e3) return `${fmt(n / 1e3)}K`;
  return Math.round(n).toString();
}

export function full(n: number): string {
  return Math.round(n).toLocaleString("en-IN");
}

export function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
}

export function pctChange(curr: number, prev: number): number | null {
  if (!prev) return null;
  return ((curr - prev) / prev) * 100;
}
