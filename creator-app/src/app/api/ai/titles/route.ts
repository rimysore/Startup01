import { z } from "zod";
import { generateTitles } from "@/lib/ai";
import { aiRoute } from "@/lib/ai-route";
import { DEMO_TITLES } from "@/lib/demo-ai";

/** A video that already went viral on the same topic (from /api/studio/research). */
const Proven = z.object({ title: z.string().max(200), views: z.number().nonnegative(), score: z.number().nullable() });

export const POST = aiRoute(
  "titles",
  { topic: z.string().min(3).max(500), tone: z.string().max(60), channel: z.string().max(200), research: z.array(Proven).max(10).optional() },
  DEMO_TITLES,
  ({ language, topic, tone, channel, research = [] }) =>
    generateTitles(language, topic, tone, channel, research.map((v) => `${v.title} | ${v.views} views${v.score != null ? ` | ${v.score}x subs` : ""}`).join("\n")),
);
