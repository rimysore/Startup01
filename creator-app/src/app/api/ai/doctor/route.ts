import { z } from "zod";
import { diagnoseVideo } from "@/lib/ai";
import { aiRoute } from "@/lib/ai-route";
import { DEMO_DOCTOR } from "@/lib/demo-ai";
import { fmtTime, keyMoments } from "@/lib/retention";

const Point = z.object({ t: z.number(), watching: z.number() });
const Row = z.object({ label: z.string().max(120), value: z.number() });

export const POST = aiRoute(
  "doctor",
  {
    channel: z.string().max(200),
    channelAvgViewPct: z.number().nullable(),
    video: z.object({
      title: z.string().max(300),
      publishedAt: z.string().max(40),
      durationSec: z.number(),
      views: z.number(),
      likes: z.number(),
      comments: z.number(),
      avgViewPct: z.number().nullable(),
    }),
    retention: z.array(Point).max(200),
    audience: z.object({ cities: z.array(Row).max(8), sources: z.array(Row).max(8), searchTerms: z.array(Row).max(8) }).optional(),
  },
  DEMO_DOCTOR,
  ({ language, channel, channelAvgViewPct, video, retention, audience }) => {
    const sampled = retention.filter((_, i) => i % 5 === 0);
    const curve = sampled.map((p) => `${fmtTime(p.t * video.durationSec)} ${Math.round(p.watching * 100)}%`).join(", ");
    const moments = keyMoments(retention)
      .map((m) => `${m.kind} at ${fmtTime(m.t * video.durationSec)} (${Math.round(m.delta * 100)} pts)`)
      .join("; ");
    const facts = [
      `Channel average % viewed: ${channelAvgViewPct ?? "unknown"}.`,
      `Video published ${video.publishedAt}, length ${fmtTime(video.durationSec)}.`,
      `Views ${video.views}, likes ${video.likes}, comments ${video.comments}, average % viewed ${video.avgViewPct ?? "unknown"}.`,
      curve ? `Retention curve (time: % still watching): ${curve}` : "No retention data available.",
      moments ? `Key moments: ${moments}` : "",
      ...(audience
        ? [
            `Top cities (views): ${audience.cities.map((r) => `${r.label} ${r.value}`).join(", ") || "no data yet"}`,
            `Traffic sources (views): ${audience.sources.map((r) => `${r.label} ${r.value}`).join(", ") || "no data yet"}`,
            `Search terms (views): ${audience.searchTerms.map((r) => `"${r.label}" ${r.value}`).join(", ") || "none"}`,
          ]
        : ["No audience data for this video."]),
    ].filter(Boolean).join("\n");
    return diagnoseVideo(language, facts, `${video.title} (channel: ${channel})`);
  },
);
