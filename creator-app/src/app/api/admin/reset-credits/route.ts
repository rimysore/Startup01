import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { currentUser, isAdmin } from "@/lib/auth";
import { monthKey } from "@/lib/usage";

/** Admins only: sets the caller's own credits used this month back to zero, for testing. */
export async function POST() {
  const user = await currentUser();
  if (!isAdmin(user)) return Response.json({ error: "Not found" }, { status: 404 });
  await (await db())
    .delete(schema.usage)
    .where(and(eq(schema.usage.userId, user!.id), eq(schema.usage.month, monthKey())));
  return Response.json({ ok: true });
}
