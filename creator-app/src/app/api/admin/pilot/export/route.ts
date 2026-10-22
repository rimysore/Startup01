import { currentUser, isAdmin } from "@/lib/auth";
import { adminUserIds } from "@/lib/marketplace/admins";
import { billCheckCsv, billCheckRows } from "@/lib/marketplace/pilot";

/** Admins: counted customers per business, day and code for the last 60 days, to check against bill books. */
export async function GET() {
  if (!isAdmin(await currentUser())) return Response.json({ error: "Not found" }, { status: 404 });
  const csv = billCheckCsv(await billCheckRows({ exclude: await adminUserIds() }));
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="mitra-bill-check-${new Date().toISOString().slice(0, 10)}.csv"` },
  });
}
