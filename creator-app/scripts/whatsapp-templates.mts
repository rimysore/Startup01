// Submits Mitra's WhatsApp templates to Meta for approval (usually minutes to a day).
// Usage: WHATSAPP_TOKEN=... WHATSAPP_WABA_ID=... npx tsx scripts/whatsapp-templates.mts [languages]
//   languages: optional comma list to submit only some, e.g. "te,ta,mr,bn,kn,ml" (already-approved ones are skipped)
// Then set WHATSAPP_TEMPLATE_LANGS to the languages that were approved, e.g. "en,hi,te,ta".
import { TEMPLATES } from "../src/lib/whatsapp/templates";

const token = process.env.WHATSAPP_TOKEN;
const waba = process.env.WHATSAPP_WABA_ID;
const version = process.env.WHATSAPP_API_VERSION || "v25.0";
if (!token || !waba) {
  console.error("Set WHATSAPP_TOKEN and WHATSAPP_WABA_ID (WhatsApp Manager → Account tools → WhatsApp Business Account ID).");
  process.exit(1);
}

const only = process.argv[2]?.split(",").map((s) => s.trim()).filter(Boolean);
for (const t of TEMPLATES.filter((t) => !only?.length || only.includes(t.language))) {
  const res = await fetch(`https://graph.facebook.com/${version}/${waba}/message_templates`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: t.name,
      language: t.language,
      category: "UTILITY",
      components: [
        { type: "BODY", text: t.body, example: { body_text: [t.example] } },
        { type: "BUTTONS", buttons: t.buttons.map((text) => ({ type: "QUICK_REPLY", text })) },
      ],
    }),
  });
  const body = (await res.json()) as { id?: string; status?: string; category?: string; error?: { message?: string; error_user_msg?: string } };
  console.log(`${t.name} (${t.language}):`, res.ok ? `${body.status} as ${body.category}` : body.error?.error_user_msg ?? body.error?.message);
}
