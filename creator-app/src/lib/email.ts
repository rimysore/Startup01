import nodemailer, { type Transporter } from "nodemailer";
import { COMPANY, SITE_URL } from "./company";

/**
 * Email fallback for creators who haven't connected WhatsApp. Sent over SMTP: during the beta that's Mitra's
 * Gmail account with an app password (SMTP_USER / SMTP_PASS, ~500 emails a day); later any provider's SMTP
 * (Zoho, Workspace, SES…) by changing SMTP_HOST. EMAIL_FAKE=1 collects mail in memory for tests.
 */

export interface Mail {
  to: string;
  subject: string;
  /** Plain text with *bold* (WhatsApp style); also rendered as simple HTML. */
  text: string;
  /** Optional button at the bottom. */
  link?: { label: string; url: string };
}

const g = globalThis as unknown as { __mailOutbox?: Mail[] };
export function mailOutbox(): Mail[] {
  return (g.__mailOutbox ??= []);
}

export function emailConfigured(): boolean {
  return process.env.EMAIL_FAKE === "1" || Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

let transport: Transporter | null = null;
function smtp(): Transporter {
  const port = Number(process.env.SMTP_PORT ?? 465);
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transport;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** WhatsApp-style text → a clean, phone-friendly email. */
export function mailHtml(m: Mail): string {
  const body = esc(m.text)
    .replace(/\*([^*\n]+)\*/g, "<strong>$1</strong>")
    .replace(/_([^_\n]+)_/g, "<em>$1</em>")
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px;line-height:1.55">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
  const button = m.link
    ? `<p style="margin:22px 0"><a href="${esc(m.link.url)}" style="background:#6C47FF;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600">${esc(m.link.label)}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#f6f2ec;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#1a1714">
<div style="max-width:560px;margin:0 auto;padding:24px 18px">
<p style="font-size:22px;font-weight:800;margin:0 0 18px;letter-spacing:-0.5px">mitra</p>
<div style="background:#fff;border-radius:18px;padding:22px 20px;font-size:15px">${body}${button}</div>
<p style="font-size:12px;color:#7a7268;margin:16px 4px;line-height:1.5">You get this because reports are on in your Mitra account. Turn them off any time in
<a href="${esc(SITE_URL)}/dashboard/whatsapp" style="color:#7a7268">WhatsApp &amp; reports</a>. Questions: ${esc(COMPANY.supportEmail)}</p>
</div></body></html>`;
}

export async function sendMail(m: Mail): Promise<void> {
  if (process.env.EMAIL_FAKE === "1") {
    mailOutbox().push(m);
    return;
  }
  if (!emailConfigured()) throw new Error("Email isn't set up (SMTP_USER / SMTP_PASS)");
  const text = m.link ? `${m.text}\n\n${m.link.label}: ${m.link.url}` : m.text;
  await smtp().sendMail({
    from: process.env.MAIL_FROM ?? `Mitra <${process.env.SMTP_USER}>`,
    replyTo: COMPANY.supportEmail,
    to: m.to,
    subject: m.subject,
    text: text.replace(/\*([^*\n]+)\*/g, "$1"),
    html: mailHtml(m),
    headers: { "List-Unsubscribe": `<${SITE_URL}/dashboard/whatsapp>` },
  });
}
