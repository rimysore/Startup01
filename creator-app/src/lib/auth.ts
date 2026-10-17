import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { db, schema } from "@/db";
import { randomToken, sha256 } from "./crypto";

export type User = typeof schema.users.$inferSelect;

const COOKIE = "mitra_session";
const SESSION_DAYS = 30;

/** Emails listed in ADMIN_EMAILS (comma-separated) can see cost reports and error details. */
export function isAdmin(user: Pick<User, "email"> | null): boolean {
  if (!user) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return admins.includes(user.email.toLowerCase());
}

export function devLoginEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_DEV_LOGIN === "1";
}

export async function upsertUser(input: { email: string; name?: string | null; avatar?: string | null }): Promise<User> {
  const d = await db();
  const email = input.email.trim().toLowerCase();
  const [user] = await d
    .insert(schema.users)
    .values({ id: crypto.randomUUID(), email, name: input.name ?? null, avatar: input.avatar ?? null })
    .onConflictDoUpdate({
      target: schema.users.email,
      // Keep an existing name/avatar if the provider didn't send one this time.
      set: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.avatar ? { avatar: input.avatar } : {}),
        email,
      },
    })
    .returning();
  return user;
}

export async function startSession(userId: string): Promise<void> {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await (await db()).insert(schema.sessions).values({ id: sha256(token), userId, expiresAt });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const d = await db();
  const [row] = await d
    .select({ user: schema.users })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .where(and(eq(schema.sessions.id, sha256(token)), gt(schema.sessions.expiresAt, new Date())))
    .limit(1);
  return row?.user ?? null;
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await (await db()).delete(schema.sessions).where(eq(schema.sessions.id, sha256(token)));
  jar.delete(COOKIE);
}

export function unauthorized(): Response {
  return Response.json({ error: "Please sign in first." }, { status: 401 });
}

/** Only allow same-site relative paths as post-login destinations. */
export function safeNext(next: string | null | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}
