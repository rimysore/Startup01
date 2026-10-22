import { currentUser, isAdmin } from "@/lib/auth";
import { deleteProgram, ProgramInput, updateProgram } from "@/lib/marketplace/programs";

export async function PUT(request: Request, ctx: RouteContext<"/api/admin/programs/[id]">) {
  if (!isAdmin(await currentUser())) return Response.json({ error: "Not found" }, { status: 404 });
  const parsed = ProgramInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Please check the form." }, { status: 400 });
  if (!(await updateProgram((await ctx.params).id, parsed.data))) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/admin/programs/[id]">) {
  if (!isAdmin(await currentUser())) return Response.json({ error: "Not found" }, { status: 404 });
  if (!(await deleteProgram((await ctx.params).id))) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
