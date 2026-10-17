import { z } from "zod";
import { breakoutIdeas } from "@/lib/ai";
import { aiRoute } from "@/lib/ai-route";
import { DEMO_BREAKOUT_IDEAS } from "@/lib/demo-ai";

const Breakout = z.object({
  title: z.string().max(200),
  channel: z.string().max(100),
  score: z.number(),
  basis: z.enum(["channel", "subscribers"]),
  views: z.number(),
  short: z.boolean(),
});

export const POST = aiRoute(
  "breakouts",
  { channel: z.string().max(2000), videos: z.array(Breakout).min(1).max(20) },
  DEMO_BREAKOUT_IDEAS,
  ({ language, channel, videos }) =>
    breakoutIdeas(
      language,
      channel,
      videos.map((v) => `${v.title} | ${v.channel} | ${v.score}x ${v.basis === "channel" ? "usual" : "subs"} | ${v.views} | ${v.short ? "Short" : "long"}`).join("\n"),
    ),
);
