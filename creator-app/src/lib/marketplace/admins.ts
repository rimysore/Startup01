import { inArray } from "drizzle-orm";
import { db, schema } from "@/db";

/** User ids of the admins (ADMIN_EMAILS): their own test activity is left out of the pilot numbers. */
export async function adminUserIds(): Promise<string[]> {
  const emails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (!emails.length) return [];
  return (await (await db()).select({ id: schema.users.id }).from(schema.users).where(inArray(schema.users.email, emails))).map((r) => r.id);
}
