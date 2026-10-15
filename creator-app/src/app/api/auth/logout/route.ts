import { clearTokens } from "@/lib/session";

export async function POST() {
  await clearTokens();
  return Response.json({ ok: true });
}
