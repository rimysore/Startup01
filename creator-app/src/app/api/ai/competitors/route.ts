import { z } from "zod";
import { compareCompetitors } from "@/lib/ai";
import { aiRoute } from "@/lib/ai-route";
import { DEMO_COMPETITOR_INSIGHTS } from "@/lib/demo-ai";

const Channel = z.object({
  name: z.string().max(100),
  you: z.boolean(),
  subscribers: z.number(),
  stats: z.string().max(600),
  titles: z.array(z.object({ title: z.string().max(200), views: z.number(), minutes: z.number() })).max(15),
});

export const POST = aiRoute("competitors", { channels: z.array(Channel).min(2).max(6) }, DEMO_COMPETITOR_INSIGHTS, ({ language, channels }) =>
  compareCompetitors(
    language,
    channels
      .map((c) => [`## ${c.you ? "YOU: " : ""}${c.name} (${c.subscribers} subscribers)`, c.stats, "Recent uploads (title | views | minutes):", ...c.titles.map((t) => `- ${t.title} | ${t.views} | ${t.minutes}`)].join("\n"))
      .join("\n\n"),
  ),
);
