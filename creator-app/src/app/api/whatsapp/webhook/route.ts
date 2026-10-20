import { after } from "next/server";
import { safeEqual } from "@/lib/crypto";
import { parseWebhook, send, unsupportedSenders, validSignature } from "@/lib/whatsapp/api";
import { handleInbound, languageForPhone } from "@/lib/whatsapp/bot";
import { t } from "@/lib/whatsapp/strings";
import { markHealth } from "@/lib/whatsapp/health";

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
    const why = request.headers.get("x-hub-signature-256") ? "WHATSAPP_APP_SECRET doesn't match the app's secret" : "no signature header";
    console.warn(`WhatsApp webhook: signature check failed (${why})`);
    // Only Meta sends a signature header; random unsigned requests aren't worth recording.
    if (request.headers.get("x-hub-signature-256")) after(() => markHealth("badsig", why));
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
  // Last 4 digits only: phone numbers don't belong in logs.
  for (const f of failures) console.error(`WhatsApp delivery to …${f.to.slice(-4)} failed: ${f.error}`);
  after(async () => {
    await markHealth("ok", `${messages.length} message(s), ${failures.length} failed`);
    if (failures.length) await markHealth("fail", failures[0].error);
    // One sender's messages in order; different senders in parallel.
    const bySender = new Map<string, typeof messages>();
    for (const m of messages) bySender.set(m.from, [...(bySender.get(m.from) ?? []), m]);
    await Promise.all(
      [...bySender.values()].map(async (list) => {
        for (const m of list)
          await handleInbound(m).catch(async (err) => {
            console.error("WhatsApp message failed", err);
            await markHealth("fail", err instanceof Error ? err.message : String(err));
          });
      }),
    );
    // Voice notes, photos, stickers: answered in the language the creator picked (English if we don't know them).
    for (const u of unsupported) await send(u.from, { type: "text", text: t(await languageForPhone(u.from)).unsupported }).catch(() => {});
  });
  return Response.json({ ok: true });
}
