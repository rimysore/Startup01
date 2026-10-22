import { currentUser, isAdmin } from "@/lib/auth";
import { adminPrograms, createProgram, ProgramInput } from "@/lib/marketplace/programs";

/** Admins: every open program with interest counts. */
export async function GET() {
  if (!isAdmin(await currentUser())) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ programs: await adminPrograms() }, { headers: { "Cache-Control": "no-store" } });
}

/** Admins: add a program (e.g. a local business that agreed to be listed). */
export async function POST(request: Request) {
  if (!isAdmin(await currentUser())) return Response.json({ error: "Not found" }, { status: 404 });
  const parsed = ProgramInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Please check the form." }, { status: 400 });
  return Response.json({ ok: true, program: await createProgram(parsed.data) });
}
