import { demoSummary } from "@/lib/demo";
import { currentTokens, fetchSummary } from "@/lib/youtube";

export async function GET() {
  const tokens = await currentTokens().catch(() => null);
  if (!tokens) return Response.json(demoSummary());
  try {
    return Response.json(await fetchSummary(tokens));
  } catch (err) {
    console.error(err);
    return Response.json({ ...demoSummary(), error: "Couldn't load your channel, showing demo data." });
  }
}
