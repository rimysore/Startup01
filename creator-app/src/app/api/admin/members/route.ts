import { currentUser, isAdmin } from "@/lib/auth";
import { adminMembers } from "@/lib/marketplace/members-admin";

/** Admins: every creator, brand and business on the marketplace, with their profile and usage. */
export async function GET() {
  if (!isAdmin(await currentUser())) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(await adminMembers(), { headers: { "Cache-Control": "no-store" } });
}
