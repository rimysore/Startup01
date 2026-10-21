import type { z } from "zod";
import { currentUser, type User } from "@/lib/auth";
import { MARKETPLACE, type Role } from "./flag";
import { getMember, type Member } from "./store";

type Guarded = { user: User; member: Member | null; error?: never } | { error: Response; user?: never; member?: never };

/**
 * Every marketplace API starts here: 404 while the flag is off, 401 without a session, and (when `roles` is
 * given) 403 unless the person joined with one of those roles.
 */
export async function guard(roles?: readonly Role[]): Promise<Guarded> {
  if (!MARKETPLACE) return { error: Response.json({ error: "Not found" }, { status: 404 }) };
  const user = await currentUser();
  if (!user) return { error: Response.json({ error: "Please sign in first." }, { status: 401 }) };
  const member = await getMember(user.id);
  if (roles && (!member || !roles.includes(member.role as Role))) return { error: Response.json({ error: "Not available for your account." }, { status: 403 }) };
  return { user, member };
}

/** Parses a JSON body with a zod schema; a bad body becomes a 400 naming the first field at fault. */
export async function body<T extends z.ZodType>(request: Request, schema: T): Promise<{ data: z.infer<T>; error?: never } | { error: Response; data?: never }> {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (parsed.success) return { data: parsed.data };
  const field = parsed.error.issues[0]?.path.join(".") || "form";
  return { error: Response.json({ error: "Please check the form.", field }, { status: 400 }) };
}
