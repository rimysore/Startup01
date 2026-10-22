/**
 * Who operates Mitra, shown on the legal and contact pages. During the beta Mitra is run by an individual;
 * when a company is registered, change legalName/operatorType/address (and the governing law in the Terms).
 * The legal pages show a warning banner while any [bracketed] placeholder remains.
 */
const OPERATOR = "Rithvik Mysore Suresh";

/** The public site address: APP_URL, else Vercel's production URL (e.g. mitra.vercel.app), else our domain. */
export const SITE_URL =
  process.env.APP_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://trymitraapp.com");

/**
 * Mitra's official inbox: support, privacy, grievance and creator outreach all use it until the domain's own
 * addresses exist. NEXT_PUBLIC_CONTACT_EMAIL can override it without a code change.
 */
export const OFFICIAL_EMAIL = "mitracontentsupport@gmail.com";
const EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || OFFICIAL_EMAIL;

export const COMPANY = {
  product: "Mitra",
  legalName: OPERATOR,
  /** How the operator is described: "an individual" now, e.g. "a private limited company" later. */
  operatorType: "an individual",
  address: "Bloomington, Indiana, United States",
  supportEmail: EMAIL,
  privacyEmail: EMAIL,
  /** Optional; leave empty to hide. */
  phone: "",
  grievanceOfficer: OPERATOR,
  grievanceEmail: EMAIL,
  /** Outreach to creators is sent from this account. */
  outreachEmail: EMAIL,
  governingLaw: "the State of Indiana, United States",
  jurisdictionCity: "Monroe County, Indiana",
  website: SITE_URL,
};

/**
 * The people behind Mitra, shown on the landing page. Add the co-founder here (name, role, one line) when they're
 * happy to be named; an empty list hides the section's people and keeps the support line.
 */
export const TEAM: { name: string; role: string; line: string }[] = [
  { name: OPERATOR, role: "Co-founder · product and engineering", line: "Builds the app: the offer checks, the counter and everything in between." },
];

/** Mitra's WhatsApp support number (digits with country code, e.g. 919876543210). Empty hides it. */
export const SUPPORT_WHATSAPP = (process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "").replace(/\D/g, "");

/**
 * Private beta: until Google verifies the app, only creators added as test users can connect YouTube, so the site
 * offers a waitlist instead of open sign-up. Set NEXT_PUBLIC_INVITE_ONLY=0 once verification is approved.
 */
export const INVITE_ONLY = process.env.NEXT_PUBLIC_INVITE_ONLY !== "0";

/**
 * WhatsApp stays locked for creators (admins can still test) until Mitra's real business number is live: Meta's
 * test number only reaches a handful of registered phones. Set NEXT_PUBLIC_WHATSAPP_LIVE=1 to open it.
 */
export const WHATSAPP_LOCKED = process.env.NEXT_PUBLIC_WHATSAPP_LIVE !== "1";

/** Date the current versions of the legal pages take effect. Update whenever the text changes. */
export const LEGAL_EFFECTIVE_DATE = "20 October 2026";

export function hasPlaceholders(): boolean {
  return Object.values(COMPANY).some((v) => v.includes("["));
}
