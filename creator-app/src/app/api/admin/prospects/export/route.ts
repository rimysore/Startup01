import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { currentUser, isAdmin } from "@/lib/auth";

const cell = (v: unknown) => {
  const s = v == null ? "" : Array.isArray(v) ? v.join(" ") : v instanceof Date ? v.toISOString() : String(v);
  // Quote everything; neutralise spreadsheet formulas.
  return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
};

/** Admins: all prospects as CSV (opens in Excel / Google Sheets). */
export async function GET() {
  if (!isAdmin(await currentUser())) return Response.json({ error: "Not found" }, { status: 404 });
  const rows = await (await db()).select().from(schema.prospects).orderBy(desc(schema.prospects.score));
  const cols = ["title", "handle", "channelId", "language", "subscribers", "videoCount", "lastUploadAt", "latestVideoTitle", "emails", "links", "score", "status", "subject", "opener", "notes", "seed", "contactedAt"] as const;
  const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\n");
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="mitra-prospects-${new Date().toISOString().slice(0, 10)}.csv"` },
  });
}
