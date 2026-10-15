import { z } from "zod";
import { generateTitles } from "@/lib/ai";
import { aiRoute } from "@/lib/ai-route";
import { DEMO_TITLES } from "@/lib/demo-ai";

export const POST = aiRoute(
  "titles",
  { topic: z.string().min(3).max(500), tone: z.string().max(60), channel: z.string().max(200) },
  DEMO_TITLES,
  ({ language, topic, tone, channel }) => generateTitles(language, topic, tone, channel),
);
