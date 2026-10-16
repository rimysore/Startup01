import { after } from "next/server";
import { safeEqual } from "@/lib/crypto";
import { parseWebhook, send, unsupportedSenders, validSignature } from "@/lib/whatsapp/api";
import { handleInbound } from "@/lib/whatsapp/bot";
import { t } from "@/lib/whatsapp/strings";

export const maxDuration = 60;

/** Meta's one-time check when the webhook URL is saved in the WhatsApp app settings. */
export function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const token = process.env.WHATSAPP_VERIFY_TOKEN ?? "";
  if (q.get("hub.mode") === "subscribe" && token && safeEqual(q.get("hub.verify_token") ?? "", token)) {
    return new Response(q.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

/**
 * Incoming messages and delivery receipts. Signed by Meta (X-Hub-Signature-256); unsigned requests are refused.
 * Answers 200 straight away and does the work after the response, because Meta retries slow webhooks.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  if (!validSignature(raw, request.headers.get("x-hub-signature-256"))) {
    console.warn(`WhatsApp webhook: signature check failed (${request.headers.get("x-hub-signature-256") ? "WHATSAPP_APP_SECRET doesn't match the app's secret" : "no signature header"})`);
    return new Response("Bad signature", { status: 401 });
  }
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }
  const { messages, failures } = parseWebhook(body);
  const unsupported = unsupportedSenders(body);
  console.log(`WhatsApp webhook: ${messages.length} message(s), ${failures.length} failed deliveries, ${unsupported.length} unsupported`);
  for (const f of failures) console.error(`WhatsApp delivery to ${f.to} failed: ${f.error}`);
  after(async () => {
    // One sender's messages in order; different senders in parallel.
    const bySender = new Map<string, typeof messages>();
    for (const m of messages) bySender.set(m.from, [...(bySender.get(m.from) ?? []), m]);
    await Promise.all(
      [...bySender.values()].map(async (list) => {
        for (const m of list) await handleInbound(m).catch((err) => console.error("WhatsApp message failed", err));
      }),
    );
    for (const u of unsupported) await send(u.from, { type: "text", text: t("hinglish").unsupported }).catch(() => {});
  });
  return Response.json({ ok: true });
}
