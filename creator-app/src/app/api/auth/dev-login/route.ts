import { z } from "zod";
import { devLoginEnabled, startSession, upsertUser } from "@/lib/auth";

const Body = z.object({ email: z.email().max(200), name: z.string().trim().max(80).optional() });

/** Email-only sign-in for local development and demos. Disabled in production unless ALLOW_DEV_LOGIN=1. */
export async function POST(request: Request) {
  if (!devLoginEnabled()) return Response.json({ error: "Not available" }, { status: 404 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  const user = await upsertUser({ email: parsed.data.email, name: parsed.data.name || null });
  await startSession(user.id);
  return Response.json({ ok: true });
}
