import { currentUser } from "@/lib/auth";
import { demoSummary } from "@/lib/demo";
import { memo } from "@/lib/memo";
import { fetchSummary, youtubeTokens } from "@/lib/youtube";

export async function GET() {
  const user = await currentUser();
  const tokens = user ? await youtubeTokens(user.id).catch(() => null) : null;
  if (!tokens) return Response.json(demoSummary());
  try {
    return Response.json(await memo(`${user!.id}:summary`, 10 * 60_000, () => fetchSummary(tokens)));
  } catch (err) {
    console.error(err);
    return Response.json({ ...demoSummary(), error: "Couldn't load your channel, showing demo data." });
  }
}
