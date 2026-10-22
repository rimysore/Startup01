import { guard } from "@/lib/marketplace/http";
import { setPassInterest } from "@/lib/marketplace/pass";

/** "I want the Creator Pass": recorded so we know who to tell when payment opens. Nothing is charged. */
export async function PUT() {
  const g = await guard(["creator"]);
  if (g.error) return g.error;
  await setPassInterest(g.user.id);
  return Response.json({ ok: true });
}
