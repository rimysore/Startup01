import { z } from "zod";
import { analyseTrends } from "@/lib/ai";
import { aiRoute } from "@/lib/ai-route";
import { DEMO_TREND_INSIGHTS } from "@/lib/demo-ai";

const Video = z.object({ title: z.string().max(200), channel: z.string().max(100), category: z.string().max(40), views: z.number(), velocity: z.number() });

export const POST = aiRoute(
  "trends",
  { channel: z.string().max(1500), videos: z.array(Video).min(1).max(40) },
  DEMO_TREND_INSIGHTS,
  ({ language, channel, videos }) =>
    analyseTrends(language, channel, videos.map((v) => `${v.title} | ${v.channel} | ${v.category} | ${v.views} | ${v.velocity}/h`).join("\n")),
);
