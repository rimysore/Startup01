import { demoBenchmark, demoRetention } from "@/lib/demo";
import { currentTokens, fetchRetention } from "@/lib/youtube";

export async function GET(_request: Request, { params }: RouteContext<"/api/videos/[id]/retention">) {
  const { id } = await params;
  const tokens = id.startsWith("demo-") ? null : await currentTokens().catch(() => null);
  if (!tokens) return Response.json({ mode: "demo", points: demoRetention(id), benchmark: demoBenchmark() });
  try {
    return Response.json({ mode: "live", points: await fetchRetention(tokens, id), benchmark: demoBenchmark() });
  } catch (err) {
    console.error(err);
    return Response.json({ mode: "live", points: [], benchmark: demoBenchmark(), error: "Retention data isn't available for this video yet." });
  }
}
