import { hmacHex, safeEqual } from "../crypto";

/**
 * WhatsApp Cloud API (Meta, direct: no reseller markup). Everything Mitra sends goes through `send`, which turns
 * our small message vocabulary into the API's JSON and enforces WhatsApp's length limits, so callers never
 * worry about them.
 *
 * Cost rules this is built around (India, late 2026): a creator's own message opens a 24-hour window in which
 * replies are "service" messages (1,000 free per number a month, then about the utility rate); outside the window
 * only pre-approved templates can be sent, at about ₹0.115 + GST each for utility templates.
 */

export type Button = { id: string; title: string };
export type Row = { id: string; title: string; description?: string };

export type Out =
  | { type: "text"; text: string }
  /** Up to 3 reply buttons. */
  | { type: "buttons"; text: string; buttons: Button[]; footer?: string }
  /** A menu of up to 10 rows behind one button. */
  | { type: "list"; text: string; button: string; rows: Row[]; footer?: string }
  /** One button that opens a link. */
  | { type: "link"; text: string; label: string; url: string }
  /** A file (the PDF report), fetched by WhatsApp from `link`. */
  | { type: "document"; link: string; filename: string; caption?: string }
  /** A pre-approved template: the only kind allowed outside the 24-hour window. */
  | { type: "template"; name: string; language: string; params: string[]; buttons?: string[] };

export function whatsappFake(): boolean {
  return process.env.WHATSAPP_FAKE === "1";
}

export function whatsappConfigured(): boolean {
  if (whatsappFake()) return true;
  const e = process.env;
  return Boolean(e.WHATSAPP_TOKEN && e.WHATSAPP_PHONE_NUMBER_ID && e.WHATSAPP_APP_SECRET && e.WHATSAPP_VERIFY_TOKEN && e.WHATSAPP_NUMBER);
}

/** Mitra's WhatsApp number, digits only (for wa.me links). */
export function mitraNumber(): string {
  return (process.env.WHATSAPP_NUMBER ?? (whatsappFake() ? "910000000000" : "")).replace(/\D/g, "");
}

/** A wa.me link that opens a chat with Mitra with `text` already typed. */
export function chatLink(text: string): string {
  return `https://wa.me/${mitraNumber()}?text=${encodeURIComponent(text)}`;
}

/** Languages with approved templates (WHATSAPP_TEMPLATE_LANGS, e.g. "en,hi"); others fall back to English. */
export function templateLanguage(language: string): string {
  const approved = (process.env.WHATSAPP_TEMPLATE_LANGS ?? "en").split(",").map((s) => s.trim());
  const wanted = language === "hinglish" ? "en" : language;
  return approved.includes(wanted) ? wanted : "en";
}

// ---- Limits ---------------------------------------------------------------------------------------------

const clip = (s: string, max: number) => {
  const t = s.trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
};

/** Template variables may not contain newlines, tabs or long runs of spaces. */
export function templateParam(s: string, max = 300): string {
  return clip(s.replace(/[\n\r\t]+/g, " · ").replace(/ {4,}/g, " "), max) || "—";
}

/** Splits long text at paragraph breaks so each message stays under WhatsApp's 4,096 characters. */
export function splitText(text: string, max = 3800): string[] {
  const parts: string[] = [];
  let cur = "";
  for (const para of text.split(/\n{2,}/)) {
    const next = cur ? `${cur}\n\n${para}` : para;
    if (next.length <= max) cur = next;
    else {
      if (cur) parts.push(cur);
      cur = para.length > max ? para.slice(0, max) : para;
    }
  }
  if (cur) parts.push(cur);
  return parts;
}

export function toPayload(to: string, out: Out): Record<string, unknown> {
  const base = { messaging_product: "whatsapp", recipient_type: "individual", to };
  switch (out.type) {
    case "text":
      return { ...base, type: "text", text: { body: clip(out.text, 4096), preview_url: true } };
    case "buttons":
      return {
        ...base,
        type: "interactive",
        interactive: {
          type: "button",
          body: { text: clip(out.text, 1024) },
          ...(out.footer ? { footer: { text: clip(out.footer, 60) } } : {}),
          action: { buttons: out.buttons.slice(0, 3).map((b) => ({ type: "reply", reply: { id: b.id.slice(0, 256), title: clip(b.title, 20) } })) },
        },
      };
    case "list":
      return {
        ...base,
        type: "interactive",
        interactive: {
          type: "list",
          body: { text: clip(out.text, 4096) },
          ...(out.footer ? { footer: { text: clip(out.footer, 60) } } : {}),
          action: {
            button: clip(out.button, 20),
            sections: [{ title: "Mitra", rows: out.rows.slice(0, 10).map((r) => ({ id: r.id.slice(0, 200), title: clip(r.title, 24), ...(r.description ? { description: clip(r.description, 72) } : {}) })) }],
          },
        },
      };
    case "link":
      return {
        ...base,
        type: "interactive",
        interactive: { type: "cta_url", body: { text: clip(out.text, 1024) }, action: { name: "cta_url", parameters: { display_text: clip(out.label, 20), url: out.url } } },
      };
    case "document":
      return { ...base, type: "document", document: { link: out.link, filename: out.filename, ...(out.caption ? { caption: clip(out.caption, 1024) } : {}) } };
    case "template":
      return {
        ...base,
        type: "template",
        template: {
          name: out.name,
          language: { code: out.language },
          components: [
            { type: "body", parameters: out.params.map((p) => ({ type: "text", text: templateParam(p) })) },
            ...(out.buttons ?? []).map((payload, index) => ({ type: "button", sub_type: "quick_reply", index: String(index), parameters: [{ type: "payload", payload }] })),
          ],
        },
      };
  }
}

// ---- Sending ---------------------------------------------------------------------------------------------

/** In fake mode (tests, local previews) messages land here instead of going to Meta. */
const g = globalThis as unknown as { __waOutbox?: { to: string; out: Out }[] };
export function outbox(): { to: string; out: Out }[] {
  return (g.__waOutbox ??= []);
}

export class WhatsAppError extends Error {
  constructor(
    message: string,
    readonly code?: number,
  ) {
    super(message);
  }
}

/** Sends one message. Returns WhatsApp's message id. */
export async function send(to: string, out: Out): Promise<string> {
  if (whatsappFake()) {
    outbox().push({ to, out });
    return `fake-${outbox().length}`;
  }
  const version = process.env.WHATSAPP_API_VERSION || "v25.0";
  const res = await fetch(`https://graph.facebook.com/${version}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(toPayload(to, out)),
  });
  const body = (await res.json().catch(() => ({}))) as { messages?: { id: string }[]; error?: { message?: string; code?: number } };
  if (!res.ok || !body.messages?.[0]) throw new WhatsAppError(`WhatsApp ${res.status}: ${body.error?.message ?? "send failed"}`, body.error?.code);
  return body.messages[0].id;
}

/** Sends several messages in order (e.g. a long report then its buttons). */
export async function sendAll(to: string, outs: Out[]): Promise<void> {
  for (const o of outs) await send(to, o);
}

/** Blue ticks + "typing…" while Mitra thinks. Best effort. */
export async function markRead(messageId: string): Promise<void> {
  if (whatsappFake() || !whatsappConfigured()) return;
  const version = process.env.WHATSAPP_API_VERSION || "v25.0";
  await fetch(`https://graph.facebook.com/${version}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", status: "read", message_id: messageId, typing_indicator: { type: "text" } }),
  }).catch(() => {});
}

// ---- Receiving -------------------------------------------------------------------------------------------

/** Meta signs every webhook with the app secret (X-Hub-Signature-256: sha256=<hex>). */
export function validSignature(raw: string, header: string | null, secret = process.env.WHATSAPP_APP_SECRET ?? ""): boolean {
  if (!secret || !header?.startsWith("sha256=")) return false;
  return safeEqual(header.slice(7), hmacHex(secret, raw));
}

export interface Inbound {
  id: string;
  /** Sender's number, digits only. */
  from: string;
  name: string | null;
  /** What they typed, or the title of the button/row they tapped. */
  text: string;
  /** Id of the tapped button or menu row (our own ids, or a template button's payload). */
  action: string | null;
  at: number;
}

type WebhookBody = {
  entry?: {
    changes?: {
      value?: {
        contacts?: { wa_id: string; profile?: { name?: string } }[];
        messages?: {
          id: string;
          from: string;
          timestamp: string;
          type: string;
          text?: { body: string };
          button?: { payload?: string; text?: string };
          interactive?: { button_reply?: { id: string; title: string }; list_reply?: { id: string; title: string } };
        }[];
        statuses?: { id: string; status: string; recipient_id: string; errors?: { code: number; title: string }[] }[];
      };
    }[];
  }[];
};

/** Pulls the creators' messages out of a webhook body. Delivery receipts are returned separately. */
export function parseWebhook(body: unknown): { messages: Inbound[]; failures: { id: string; to: string; error: string }[] } {
  const messages: Inbound[] = [];
  const failures: { id: string; to: string; error: string }[] = [];
  for (const entry of (body as WebhookBody)?.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const v = change.value;
      const names = new Map((v?.contacts ?? []).map((c) => [c.wa_id, c.profile?.name ?? null]));
      for (const m of v?.messages ?? []) {
        const reply = m.interactive?.button_reply ?? m.interactive?.list_reply;
        const text = m.text?.body ?? reply?.title ?? m.button?.text ?? "";
        const action = reply?.id ?? m.button?.payload ?? null;
        if (!text && !action) continue; // images, stickers, voice notes: handled as "unsupported" by the bot
        messages.push({ id: m.id, from: m.from.replace(/\D/g, ""), name: names.get(m.from) ?? null, text: text.slice(0, 2000), action, at: Number(m.timestamp) * 1000 || Date.now() });
      }
      for (const s of v?.statuses ?? []) {
        if (s.status === "failed") failures.push({ id: s.id, to: s.recipient_id, error: s.errors?.map((e) => `${e.code} ${e.title}`).join("; ") ?? "failed" });
      }
    }
  }
  return { messages, failures };
}

/** Messages WhatsApp delivers that we can't read as text (voice notes, photos…), so the bot can say so. */
export function unsupportedSenders(body: unknown): { id: string; from: string }[] {
  const out: { id: string; from: string }[] = [];
  for (const entry of (body as WebhookBody)?.entry ?? [])
    for (const change of entry.changes ?? [])
      for (const m of change.value?.messages ?? [])
        if (!m.text && !m.button && !m.interactive) out.push({ id: m.id, from: m.from.replace(/\D/g, "") });
  return out;
}
