import { z } from "zod";
import { diagnoseVideo } from "@/lib/ai";
import { aiRoute } from "@/lib/ai-route";
import { DEMO_DOCTOR } from "@/lib/demo-ai";
import { fmtTime, keyMoments } from "@/lib/retention";

const Point = z.object({ t: z.number(), watching: z.number() });

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
  },
  DEMO_DOCTOR,
  ({ language, channel, channelAvgViewPct, video, retention }) => {
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
    ].filter(Boolean).join("\n");
    return diagnoseVideo(language, facts, `${video.title} (channel: ${channel})`);
  },
);
