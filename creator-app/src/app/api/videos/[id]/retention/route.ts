import { demoBenchmark, demoRetention } from "@/lib/demo";
import { currentUser } from "@/lib/auth";
import { memo } from "@/lib/memo";
import { fetchRetention, youtubeTokens } from "@/lib/youtube";

export async function GET(_request: Request, { params }: RouteContext<"/api/videos/[id]/retention">) {
  const { id } = await params;
  const user = id.startsWith("demo-") ? null : await currentUser();
  const tokens = user ? await youtubeTokens(user.id).catch(() => null) : null;
  if (!tokens) return Response.json({ mode: "demo", points: demoRetention(id), benchmark: demoBenchmark() });
  try {
    return Response.json({ mode: "live", points: await memo(`${user!.id}:retention:${id}`, 60 * 60_000, () => fetchRetention(tokens, id)), benchmark: demoBenchmark() });
  } catch (err) {
    console.error(err);
    return Response.json({ mode: "live", points: [], benchmark: demoBenchmark(), error: "Retention data isn't available for this video yet." });
  }
}
