import { currentUser, isAdmin } from "@/lib/auth";
import { SITE_URL } from "@/lib/company";
import { readHealth } from "@/lib/whatsapp/health";

/**
 * Admins only: is WhatsApp set up end to end? Which settings are present (never their values), whether Meta
 * accepts the token for the phone number, and what the webhook last saw.
 */
export async function GET() {
  const me = await currentUser();
  if (!isAdmin(me)) return Response.json({ error: "Not found" }, { status: 404 });
  const e = process.env;
  const settings = Object.fromEntries(["WHATSAPP_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_APP_SECRET", "WHATSAPP_VERIFY_TOKEN", "WHATSAPP_NUMBER"].map((k) => [k, Boolean(e[k])]));
  let phone: { ok: boolean; detail: string } = { ok: false, detail: "Token or phone number ID missing" };
  if (e.WHATSAPP_TOKEN && e.WHATSAPP_PHONE_NUMBER_ID) {
    try {
      const res = await fetch(`https://graph.facebook.com/${e.WHATSAPP_API_VERSION || "v25.0"}/${e.WHATSAPP_PHONE_NUMBER_ID}?fields=display_phone_number,verified_name,quality_rating`, {
        headers: { Authorization: `Bearer ${e.WHATSAPP_TOKEN}` },
        signal: AbortSignal.timeout(8000),
      });
      const d = (await res.json().catch(() => ({}))) as { display_phone_number?: string; verified_name?: string; error?: { message?: string } };
      const digits = (d.display_phone_number ?? "").replace(/\D/g, "");
      const want = (e.WHATSAPP_NUMBER ?? "").replace(/\D/g, "");
      phone = res.ok
        ? digits && want && digits !== want
          ? { ok: false, detail: `Phone number ID belongs to +${digits}, but WHATSAPP_NUMBER is +${want}` }
          : { ok: true, detail: `+${digits} · ${d.verified_name ?? ""}` }
        : { ok: false, detail: d.error?.message ?? `Meta answered ${res.status}` };
    } catch (err) {
      phone = { ok: false, detail: err instanceof Error ? err.message : String(err) };
    }
  }
  return Response.json({ settings, phone, webhook: await readHealth(), callbackUrl: `${SITE_URL}/api/whatsapp/webhook` });
}
