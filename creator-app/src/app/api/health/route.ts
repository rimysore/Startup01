import { sql } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/db";

/** For uptime monitors: 200 when the app can reach its database, 503 otherwise. Reveals no configuration. */
export async function GET() {
  await connection(); // always check live, never prerender at build time
  try {
    await (await db()).execute(sql`select 1`);
    return Response.json({ ok: true });
  } catch (err) {
    console.error(err);
    return Response.json({ ok: false }, { status: 503 });
  }
}
