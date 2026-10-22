import { AutomationInput, saveAutomation, subscribeComments } from "@/lib/marketplace/autodm";
import { guard } from "@/lib/marketplace/http";
import { instagramConnection } from "@/lib/marketplace/social";

/** A new Auto-DM automation. Makes sure Instagram is sending this account's comments to Mitra. */
export async function POST(request: Request) {
  const g = await guard(["creator"]);
  if (g.error) return g.error;
  const parsed = AutomationInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Please check the form.", field: parsed.error.issues[0]?.path.join(".") }, { status: 400 });
  const conn = await instagramConnection(g.user.id);
  if (!conn) return Response.json({ error: "Connect Instagram first.", connect: true }, { status: 409 });
  const a = await saveAutomation(g.user.id, parsed.data);
  if (!conn.subscribedAt) await subscribeComments(g.user.id).catch((err) => console.error("Instagram webhook subscribe failed", err));
  return Response.json({ ok: true, id: a?.id });
}
