import { SITE_URL } from "../company";
import { hmacHex, safeEqual } from "../crypto";

/**
 * Signed, expiring links to a report's PDF. WhatsApp downloads the file from this URL, so it can't depend on the
 * creator's session; the signature makes it unguessable and it expires after 30 days.
 */
const VALID_MS = 30 * 86_400_000;

function secret(): string {
  return `pdf:${process.env.SESSION_SECRET ?? "dev-secret"}`;
}

export function pdfLink(notificationId: number, now = Date.now()): string {
  const exp = now + VALID_MS;
  const sig = hmacHex(secret(), `${notificationId}.${exp}`).slice(0, 32);
  return `${SITE_URL}/api/reports/pdf?id=${notificationId}&exp=${exp}&sig=${sig}`;
}

export function validPdfLink(id: number, exp: number, sig: string, now = Date.now()): boolean {
  if (!Number.isFinite(exp) || exp < now) return false;
  return safeEqual(sig, hmacHex(secret(), `${id}.${exp}`).slice(0, 32));
}

export function pdfFilename(key: string): string {
  return `Mitra-weekly-report-${key.replace(/[^\w-]/g, "")}.pdf`;
}
