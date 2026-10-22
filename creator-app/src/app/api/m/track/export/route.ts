import { connection } from "next/server";
import { guard } from "@/lib/marketplace/http";
import { billCheckCsv, billCheckRows } from "@/lib/marketplace/pilot";

/** A business's own counted customers by day and code (last 60 days), to compare with its bill book. */
export async function GET() {
  // Per request, never prerendered: the answer depends on who is signed in.
  await connection();
  const g = await guard(["business", "brand", "agency"]);
  if (g.error) return g.error;
  const csv = billCheckCsv(await billCheckRows({ businessUserId: g.user.id }));
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="mitra-customers-${new Date().toISOString().slice(0, 10)}.csv"` },
  });
}
