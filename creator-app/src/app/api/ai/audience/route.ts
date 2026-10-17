import { z } from "zod";
import { analyseAudience } from "@/lib/ai";
import { aiRoute } from "@/lib/ai-route";
import { DEMO_AUDIENCE_INSIGHTS } from "@/lib/demo-ai";

const Row = z.object({ label: z.string().max(120), value: z.number() });

export const POST = aiRoute(
  "audience",
  {
    channel: z.string().max(1500),
    countries: z.array(Row).max(10),
    cities: z.array(Row).max(15),
    sources: z.array(Row).max(20),
    searchTerms: z.array(Row).max(15),
    demographics: z.array(Row).max(20),
    subscribed: z.array(Row).max(3),
  },
  DEMO_AUDIENCE_INSIGHTS,
  ({ language, channel, ...d }) => {
    const section = (name: string, rows: { label: string; value: number }[], unit: string) =>
      `${name}:\n${rows.length ? rows.map((r) => `- ${r.label}: ${r.value}${unit}`).join("\n") : "- (no data yet)"}`;
    return analyseAudience(
      language,
      [
        `Channel and recent uploads:\n${channel}`,
        section("Top countries (views)", d.countries, ""),
        section("Top cities (views)", d.cities, ""),
        section("How viewers found the videos (views by traffic source)", d.sources, ""),
        section("YouTube search terms that brought viewers (views)", d.searchTerms, ""),
        section("Viewers by age group and gender", d.demographics, "%"),
        section("Subscribed vs not (views)", d.subscribed, ""),
      ].join("\n\n"),
    );
  },
);
