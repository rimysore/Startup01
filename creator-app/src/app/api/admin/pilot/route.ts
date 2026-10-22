import { currentUser, isAdmin } from "@/lib/auth";
import { adminUserIds } from "@/lib/marketplace/admins";
import { pilotNumbers } from "@/lib/marketplace/pilot";

/** Admins: the pilot's five numbers and the weekly trend. Admins' own test activity is left out. */
export async function GET() {
  if (!isAdmin(await currentUser())) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(await pilotNumbers({ exclude: await adminUserIds() }), { headers: { "Cache-Control": "no-store" } });
}
