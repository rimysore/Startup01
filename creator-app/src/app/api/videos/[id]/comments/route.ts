import { demoComments } from "@/lib/demo";
import { currentUser } from "@/lib/auth";
import { fetchComments, youtubeTokens } from "@/lib/youtube";

export async function GET(_request: Request, { params }: RouteContext<"/api/videos/[id]/comments">) {
  const { id } = await params;
  const user = id.startsWith("demo-") ? null : await currentUser();
  const tokens = user ? await youtubeTokens(user.id).catch(() => null) : null;
  if (!tokens) return Response.json({ mode: "demo", comments: demoComments() });
  try {
    return Response.json({ mode: "live", comments: await fetchComments(tokens, id) });
  } catch (err) {
    console.error(err);
    return Response.json({ mode: "live", comments: [], error: "Comments are turned off or unavailable for this video." });
  }
}
