import type { WeeklyCoach } from "../ai";
import { SITE_URL } from "../company";
import { esc, mailFooter } from "../email";
import { compact, full } from "../format";
import { change, times, type WeeklyFacts } from "./facts";
import { reportLabels, weekday } from "./labels";

/**
 * The Monday report as a designed email, same order as the PDF. Tables and inline styles only, so it looks the
 * same in Gmail, Outlook and phone mail apps; the chart is table cells, so it shows even with images off.
 */

const C = { bg: "#f6f2ec", ink: "#1c1b19", ink2: "#4a4540", muted: "#7a7268", line: "#ece6dc", card: "#faf7f2", accent: "#e2620b", soft: "#fdf0e5", good: "#1f7a3a", bad: "#b3261e", ghost: "#d9d1c5" };
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans','Noto Sans Devanagari','Noto Sans Telugu','Noto Sans Tamil',Helvetica,Arial,sans-serif";
const GRADIENT = "linear-gradient(90deg,#FF8A1F,#D946EF 50%,#6C47FF)";

export function weeklyEmailHtml(f: WeeklyFacts, coach: WeeklyCoach, language: string, links: { dashboard: string; pdf?: string }): string {
  const L = reportLabels(language, coach);
  const lower = (x: string) => (/^[A-Z][a-z]/.test(x) ? x.toLowerCase() : x);
  const delta = (n: number | null | undefined) => {
    const c = change(n);
    if (!c) return "";
    return `<div style="margin-top:6px;font-size:12px;font-weight:700;color:${c.startsWith("▲") ? C.good : C.bad}">${c} <span style="font-weight:400;color:${C.muted}">vs ${esc(lower(L.lastWeek))}</span></div>`;
  };
  const stat = (label: string, value: string, n: number | null | undefined) =>
    `<td width="33%" valign="top" style="padding:0 4px"><div style="background:${C.card};border-radius:12px;padding:14px 12px">
<div style="font-size:12px;color:${C.muted}">${esc(label)}</div>
<div style="font-size:26px;line-height:1.15;font-weight:800;margin-top:4px;color:${C.ink}">${esc(value)}</div>${delta(n)}</div></td>`;

  // Chart: this week (accent) beside last week (grey), per day.
  const thisWeek = f.days.slice(-7);
  const lastWeek = f.days.length > 7 ? f.days.slice(-14, -7) : [];
  const max = Math.max(1, ...f.days.map((d) => d.views));
  const PH = 96;
  const bar = (v: number, color: string) => `<td valign="bottom" style="padding:0 1px"><div style="width:12px;height:${Math.max(2, Math.round((v / max) * PH))}px;background:${color};border-radius:3px 3px 0 0;font-size:0;line-height:0">&nbsp;</div></td>`;
  const chart = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid ${C.line}"><tr>${thisWeek
    .map((d, i) => {
      const prev = lastWeek[i];
      return `<td align="center" valign="bottom" height="${PH}"><table role="presentation" cellpadding="0" cellspacing="0"><tr>${prev ? bar(prev.views, C.ghost) : ""}${bar(d.views, C.accent)}</tr></table></td>`;
    })
    .join("")}</tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${thisWeek.map((d) => `<td align="center" style="font-size:11px;color:${C.muted};padding-top:6px">${esc(weekday(d.date, language))}</td>`).join("")}</tr></table>`;

  const legend = (color: string, label: string) => `<span style="display:inline-block;width:9px;height:9px;border-radius:2px;background:${color};margin:0 4px 0 10px"></span>${esc(label)}`;

  const milestone = f.nextMilestone
    ? (() => {
        const pct = Math.max(2, Math.min(100, Math.round((f.subscribers / f.nextMilestone.at) * 100)));
        return `<tr><td style="padding:20px 24px 0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="font-size:13px;font-weight:700;color:${C.ink}">🎯 ${esc(full(f.nextMilestone.left))} ${esc(L.milestone)}</td>
<td align="right" style="font-size:12px;color:${C.muted}">${esc(full(f.subscribers))} / ${esc(compact(f.nextMilestone.at))}</td></tr></table>
<div style="margin-top:8px;height:8px;background:${C.line};border-radius:4px;overflow:hidden"><div style="width:${pct}%;height:8px;background:${C.accent};background-image:${GRADIENT};border-radius:4px"></div></div>
</td></tr>`;
      })()
    : "";

  const star = f.star
    ? `<tr><td style="padding:20px 24px 0"><div style="background:${C.card};border-radius:14px;padding:14px">
<div style="font-size:13px;font-weight:700;color:${C.ink};margin-bottom:10px">${esc(L.videoOfWeek)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
${f.star.thumbnail ? `<td width="140" valign="top" style="padding-right:12px"><a href="${esc(`https://youtu.be/${f.star.id ?? ""}`)}"><img src="${esc(f.star.thumbnail)}" width="140" alt="" style="display:block;width:140px;border-radius:8px;border:0"></a></td>` : ""}
<td valign="top"><div style="font-size:14px;line-height:1.4;color:${C.ink}">${esc(f.star.title)}</div>
<div style="margin-top:8px"><span style="font-size:24px;font-weight:800;color:${C.accent}">${esc(times(f.star.times))}</span> <span style="font-size:12px;color:${C.muted}">${esc(L.usual)} · ${esc(compact(f.star.views))} ${esc(lower(L.views))}</span></div></td>
</tr></table></div></td></tr>`
    : "";

  const list = (title: string, items: string[], color: string, mark: string) =>
    items.length
      ? `<div style="font-size:14px;font-weight:700;color:${color};margin:0 0 8px">${esc(title)}</div>${items
          .slice(0, 2)
          .map(
            (it) =>
              `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:8px"><tr><td valign="top" style="width:22px;padding-top:1px"><span style="display:inline-block;width:16px;height:16px;line-height:16px;border-radius:8px;background:${color};color:#fff;font-size:11px;text-align:center;font-weight:700">${mark}</span></td><td style="font-size:14px;line-height:1.5;color:${C.ink}">${esc(it)}</td></tr></table>`,
          )
          .join("")}`
      : "";

  const uploads = (f.uploads ?? []).length
    ? `<tr><td style="padding:20px 24px 0"><div style="font-size:14px;font-weight:700;color:${C.ink};margin-bottom:6px">${esc(L.recent)}</div>${(f.uploads ?? [])
        .map(
          (u) =>
            `<div style="border-top:1px solid ${C.line};padding:8px 0;font-size:13px;color:${C.ink}">${esc(u.title)}<br><span style="font-size:12px;color:${C.muted}">${esc(compact(u.views))} ${esc(lower(L.views))}${u.avgViewPct != null ? ` · ${u.avgViewPct}% ${esc(L.watched)}` : ""} · ${u.days} ${esc(L.daysAgo)}</span></div>`,
        )
        .join("")}</td></tr>`
    : "";

  const button = (label: string, url: string, primary: boolean) =>
    `<a href="${esc(url)}" style="display:inline-block;margin:0 6px 8px 0;padding:11px 18px;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none;${primary ? `background:${C.accent};color:#ffffff` : `background:#ffffff;color:${C.ink};border:1px solid ${C.line}`}">${esc(label)}</a>`;

  return `<!doctype html><html lang="${esc(language === "hinglish" ? "en" : language)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(`${L.report} · ${f.period}`)}</title></head>
<body style="margin:0;padding:0;background:${C.bg};font-family:${FONT};color:${C.ink}">
<div style="display:none;max-height:0;overflow:hidden">${esc(`${compact(f.views)} ${lower(L.views)} ${change(f.viewsChange)} · +${full(f.subscribersGained)} · ${coach.headline}`)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg}"><tr><td align="center" style="padding:20px 10px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden">
<tr><td style="padding:20px 24px 14px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td valign="middle"><img src="${esc(SITE_URL)}/brand/mitra-120.png" width="30" height="30" alt="" style="display:inline-block;vertical-align:middle;border:0"> <span style="vertical-align:middle;font-size:19px;font-weight:800;letter-spacing:-0.4px;color:${C.ink}">mitra</span></td>
<td align="right" valign="middle"><div style="font-size:12px;font-weight:700;color:${C.accent}">${esc(L.report)}</div><div style="font-size:12px;color:${C.muted}">${esc(f.period)}</div></td>
</tr></table></td></tr>
<tr><td style="padding:0 24px"><div style="height:3px;background:${C.accent};background-image:${GRADIENT};border-radius:2px;font-size:0;line-height:0">&nbsp;</div></td></tr>
<tr><td style="padding:18px 24px 0"><div style="font-size:13px;color:${C.muted}">${esc(f.channel)}</div>
<h1 style="margin:4px 0 0;font-size:22px;line-height:1.3;font-weight:800;color:${C.ink}">${esc(coach.headline)}</h1></td></tr>
<tr><td style="padding:18px 20px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
${stat(L.views, compact(f.views), f.viewsChange)}${stat(L.watchTime, compact(f.watchHours), f.watchHoursChange)}${stat(L.subscribers, `+${full(f.subscribersGained)}`, f.subscribersChange)}
</tr></table></td></tr>
${milestone}
<tr><td style="padding:22px 24px 0"><div style="border:1px solid ${C.line};border-radius:14px;padding:14px 14px 10px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px"><tr><td style="font-size:13px;font-weight:700;color:${C.ink}">${esc(L.views)}</td>
<td align="right" style="font-size:11px;color:${C.muted}">${legend(C.accent, L.thisWeek)}${legend(C.ghost, L.lastWeek)}</td></tr></table>
${chart}</div></td></tr>
${star}
<tr><td style="padding:20px 24px 0"><div style="background:${C.soft};border-left:4px solid ${C.accent};border-radius:12px;padding:14px 16px">
<div style="font-size:12px;font-weight:700;color:${C.accent};margin-bottom:4px">${esc(L.next)}</div>
<div style="font-size:17px;line-height:1.35;font-weight:800;color:${C.ink}">${esc(coach.nextVideo.idea)}</div>
<div style="font-size:14px;line-height:1.5;color:${C.ink2};margin-top:6px">${esc(coach.nextVideo.why)}</div></div></td></tr>
<tr><td style="padding:20px 24px 0">${list(L.wins, coach.wins, C.good, "✓")}<div style="height:8px"></div>${list(L.fixes, coach.fixes, C.accent, "→")}</td></tr>
${uploads}
<tr><td style="padding:18px 24px 6px">${button("Open my dashboard", links.dashboard, true)}${links.pdf ? button("Download PDF", links.pdf, false) : ""}</td></tr>
<tr><td style="padding:0 24px 20px;font-size:11px;line-height:1.5;color:${C.muted}">Numbers from YouTube Analytics (latest 7 days available).${f.star ? " × scores are Mitra's calculation from your YouTube data, not YouTube metrics." : ""}</td></tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px"><tr><td>${mailFooter()}</td></tr></table>
</td></tr></table></body></html>`;
}
