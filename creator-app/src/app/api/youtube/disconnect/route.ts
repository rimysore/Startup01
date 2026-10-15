import { currentUser, unauthorized } from "@/lib/auth";
import { forgetUser } from "@/lib/memo";
import { removeYouTubeConnection } from "@/lib/youtube";

export async function POST() {
  const user = await currentUser();
  if (!user) return unauthorized();
  await removeYouTubeConnection(user.id);
  forgetUser(user.id);
  return Response.json({ ok: true });
}
