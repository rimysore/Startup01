import { after, type NextRequest } from "next/server";
import { handleWebhook, validSignature, type WebhookBody } from "@/lib/marketplace/autodm";

/** Meta checks the callback URL once: echo the challenge when the verify token matches. */
export function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const token = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;
  if (p.get("hub.mode") === "subscribe" && token && p.get("hub.verify_token") === token) return new Response(p.get("hub.challenge") ?? "", { status: 200 });
  return new Response("Forbidden", { status: 403 });
}

/** Comment events for connected creators: answer straight away, send the DMs just after (Meta retries slow answers). */
export async function POST(request: Request) {
  const raw = await request.text();
  if (!validSignature(raw, request.headers.get("x-hub-signature-256"))) return new Response("Bad signature", { status: 401 });
  let body: WebhookBody;
  try {
    body = JSON.parse(raw) as WebhookBody;
  } catch {
    return new Response("Bad body", { status: 400 });
  }
  after(() => handleWebhook(body).catch((err) => console.error("Auto-DM webhook failed", err)));
  return new Response("ok", { status: 200 });
}
