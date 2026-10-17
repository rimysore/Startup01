import { and, eq, isNotNull, ne, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { FOUNDING_SPOTS } from "./plans";

/** How many of the founding spots are still open. */
export async function foundingSpotsLeft(): Promise<number> {
  const [row] = await (await db()).select({ n: sql<number>`count(*)::int` }).from(schema.users).where(isNotNull(schema.users.founderNumber));
  return Math.max(0, FOUNDING_SPOTS - (row?.n ?? 0));
}

/**
 * Gives the user the next founding number if any are left. Called when a YouTube channel is connected, so the
 * spots go to real creators. One spot per channel: a channel that already earned a spot on another account
 * doesn't earn a second. Safe under concurrency: the number is unique in the database, so a clash just retries.
 */
export async function claimFounderSpot(userId: string, channelId: string): Promise<number | null> {
  const d = await db();
  const [me] = await d.select({ n: schema.users.founderNumber }).from(schema.users).where(eq(schema.users.id, userId));
  if (me?.n) return me.n;
  const [taken] = await d
    .select({ id: schema.users.id })
    .from(schema.users)
    .innerJoin(schema.youtubeConnections, eq(schema.youtubeConnections.userId, schema.users.id))
    .where(and(eq(schema.youtubeConnections.channelId, channelId), isNotNull(schema.users.founderNumber), ne(schema.users.id, userId)));
  if (taken) return null;
  // One statement picks the next number and enforces the cap, so concurrent claims rarely clash; when two do
  // pick the same number, the unique constraint rejects one and it retries after a short random pause.
  for (let attempt = 0; attempt < 12; attempt++) {
    try {
      const rows = (await d.execute(sql`
        update users set founder_number = (select coalesce(max(founder_number), 0) + 1 from users)
        where id = ${userId} and founder_number is null
          and (select count(*) from users where founder_number is not null) < ${FOUNDING_SPOTS}
        returning founder_number`)) as unknown as { rows?: { founder_number: number }[] } | { founder_number: number }[];
      const list = Array.isArray(rows) ? rows : (rows.rows ?? []);
      return list[0]?.founder_number ?? null;
    } catch {
      await new Promise((r) => setTimeout(r, 10 + Math.random() * 40));
    }
  }
  return null;
}
