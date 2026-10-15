"use client";

import { useLayoutEffect, useRef, useState } from "react";

export interface Series {
  label: string;
  values: number[];
  color: string; // CSS color, usually a var(--token)
  dashed?: boolean;
  area?: boolean;
}

export interface Marker {
  index: number;
  label: string;
  tone: "bad" | "good";
}

interface Props {
  xLabels: string[];
  series: Series[];
  height?: number;
  yFormat?: (v: number) => string;
  yMin?: number;
  /** Lowest value the top of the axis may take, e.g. 100 for percentages. */
  yMaxFloor?: number;
  markers?: Marker[];
  ariaLabel: string;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(200, e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Line/area chart with a hover crosshair and tooltip. Single y-axis, recessive grid. */
export function LineChart({ xLabels, series, height = 260, yFormat = String, yMin, yMaxFloor, markers = [], ariaLabel }: Props) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { top: 16, right: 12, bottom: 28, left: 48 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;
  const n = xLabels.length;

  const all = series.flatMap((s) => s.values);
  const max = all.length ? Math.max(...all) : 1;
  const min = yMin ?? Math.min(0, ...all);
  const niceMax =
    yMaxFloor !== undefined && max <= yMaxFloor * 1.05 ? Math.max(yMaxFloor, max) : max === min ? max + 1 : max * 1.08;
  const x = (i: number) => pad.left + (n <= 1 ? w / 2 : (i / (n - 1)) * w);
  const y = (v: number) => pad.top + h - ((v - min) / (niceMax - min)) * h;

  const ticks = Array.from({ length: 4 }, (_, i) => min + ((niceMax - min) * (i + 1)) / 4);
  const xTickEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(w / 90))));

  const path = (vals: number[]) => vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");

  function onMove(e: React.PointerEvent<SVGRectElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    const rel = (e.clientX - box.left) / box.width;
    setHover(Math.min(n - 1, Math.max(0, Math.round(rel * (n - 1)))));
  }

  const tipLeft = hover === null ? 0 : Math.min(Math.max(x(hover) - 80, 0), width - 168);

  return (
    <div ref={ref} className="relative w-full min-w-0 select-none" style={{ minHeight: height }}>
      {width > 0 && (
      <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={pad.left + w} y1={y(t)} y2={y(t)} stroke="var(--chart-grid)" />
            <text x={pad.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize="11" fill="var(--muted)">
              {yFormat(t)}
            </text>
          </g>
        ))}
        <line x1={pad.left} x2={pad.left + w} y1={y(min)} y2={y(min)} stroke="var(--line)" />
        {xLabels.map((l, i) =>
          i % xTickEvery === 0 ? (
            <text key={i} x={x(i)} y={height - 8} textAnchor="middle" fontSize="11" fill="var(--muted)">
              {l}
            </text>
          ) : null,
        )}
        {series.map((s, si) => (
          <g key={s.label}>
            {s.area && (
              <path
                d={`${path(s.values)}L${x(n - 1)},${y(min)}L${x(0)},${y(min)}Z`}
                fill={s.color}
                opacity={0.12}
              />
            )}
            <path
              d={path(s.values)}
              fill="none"
              stroke={s.color}
              strokeWidth={si === 0 ? 2.25 : 1.75}
              strokeDasharray={s.dashed ? "5 5" : undefined}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </g>
        ))}
        {markers.map((m) => {
          const v = series[0]?.values[m.index] ?? 0;
          return (
            <g key={`${m.index}-${m.label}`}>
              <circle cx={x(m.index)} cy={y(v)} r={6} fill={m.tone === "bad" ? "var(--bad)" : "var(--good)"} stroke="var(--surface)" strokeWidth={2} />
              <text x={x(m.index)} y={y(v) - 12} textAnchor="middle" fontSize="11" fontWeight={600} fill="var(--ink)">
                {m.label}
              </text>
            </g>
          );
        })}
        {hover !== null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + h} stroke="var(--muted)" strokeDasharray="3 3" />
            {series.map((s) => (
              <circle key={s.label} cx={x(hover)} cy={y(s.values[hover])} r={4.5} fill={s.color} stroke="var(--surface)" strokeWidth={2} />
            ))}
          </g>
        )}
        <rect
          x={pad.left}
          y={pad.top}
          width={w}
          height={h}
          fill="transparent"
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        />
      </svg>
      )}
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-1 w-[168px] rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-lg"
          style={{ left: tipLeft }}
        >
          <div className="mb-1 font-medium text-ink">{xLabels[hover]}</div>
          {series.map((s) => (
            <div key={s.label} className="flex items-center justify-between gap-2 text-ink-2">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-0.5 w-3 rounded" style={{ background: s.color }} />
                {s.label}
              </span>
              <span className="font-medium tabular-nums text-ink">{yFormat(s.values[hover])}</span>
            </div>
          ))}
        </div>
      )}
      {series.length > 1 && (
        <div className="mt-1 flex flex-wrap gap-4 pl-12 text-xs text-ink-2">
          {series.map((s) => (
            <span key={s.label} className="flex items-center gap-1.5">
              <svg width="16" height="4" aria-hidden>
                <line x1="0" x2="16" y1="2" y2="2" stroke={s.color} strokeWidth="2" strokeDasharray={s.dashed ? "4 3" : undefined} />
              </svg>
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
