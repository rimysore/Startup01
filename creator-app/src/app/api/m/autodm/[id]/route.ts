import { z } from "zod";
import { AutomationInput, deleteAutomation, saveAutomation, setAutomationActive } from "@/lib/marketplace/autodm";
import { guard } from "@/lib/marketplace/http";

/** Edit an automation, or just switch it on or off ({ active }). */
export async function PUT(request: Request, ctx: RouteContext<"/api/m/autodm/[id]">) {
  const g = await guard(["creator"]);
  if (g.error) return g.error;
  const { id } = await ctx.params;
  const json = await request.json().catch(() => null);
  const toggle = z.object({ active: z.boolean() }).strict().safeParse(json);
  if (toggle.success) return (await setAutomationActive(g.user.id, id, toggle.data.active)) ? Response.json({ ok: true }) : Response.json({ error: "Not found" }, { status: 404 });
  const parsed = AutomationInput.safeParse(json);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Please check the form.", field: parsed.error.issues[0]?.path.join(".") }, { status: 400 });
  return (await saveAutomation(g.user.id, parsed.data, id)) ? Response.json({ ok: true }) : Response.json({ error: "Not found" }, { status: 404 });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/m/autodm/[id]">) {
  const g = await guard(["creator"]);
  if (g.error) return g.error;
  return (await deleteAutomation(g.user.id, (await ctx.params).id)) ? Response.json({ ok: true }) : Response.json({ error: "Not found" }, { status: 404 });
}
