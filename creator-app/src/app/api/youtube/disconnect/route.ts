import { currentUser, unauthorized } from "@/lib/auth";
import { removeYouTubeConnection } from "@/lib/youtube";

export async function POST() {
  const user = await currentUser();
  if (!user) return unauthorized();
  await removeYouTubeConnection(user.id);
  return Response.json({ ok: true });
}
